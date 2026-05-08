import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import {
  obtenerAnalisisMedico,
  detectarEspecialidadConIA,
  detectarEmergenciaVital,
  esConsultaMedica,              // ← Filtro de entrada (Paso 0)
} from './backend/services/aiService.js';
import { obtenerHospitalesPorEspecialidad } from './backend/services/notionService.js';
import { calcularCopagoExacto } from './backend/utils/calculator.js';

dotenv.config({ override: true });

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/chat
// Respuesta SIEMPRE estructurada con los campos:
//   is_emergency  → boolean  (true = el frontend debe mostrar el botón del 911)
//   is_fallback   → boolean  (true = se muestran hospitales de Medicina General)
//   especialidad  → string
//   datos_hospitales → array
//   response      → string   (texto del agente)
//   checklist     → object | null
// ─────────────────────────────────────────────────────────────────────────────
app.post('/api/chat', async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ error: 'Message is required' });

    // ── PASO 0: Filtro de entrada ─ ¿es una consulta médica real? ─────────────────────
    // Si el mensaje no describe un malestar/síntoma, cortocircuitamos aquí.
    // No llamamos a Notion, no calculamos copagos, no gastamos tokens en el
    // modelo principal. Solo devolvemos una respuesta educada.
    const esMedico = await esConsultaMedica(message);
    if (!esMedico) {
      console.log('[FILTRO] Mensaje rechazado: no contiene síntoma médico.');
      return res.json({
        is_emergency:    false,
        is_fallback:     false,
        is_invalid:      true,
        especialidad:    null,
        datos_hospitales: [],
        response:        'Lo siento, no logro identificar un síntoma médico en tu mensaje. Por favor, descríbeme qué malestar, dolor o síntoma estás experimentando para poder orientarte con tu cobertura.',
        checklist:       null,
      });
    }

    // ── PASO 1: Detectar si es emergencia vital ──────────────────────────────
    // Si lo es, cortocircuitamos: NO consultamos Notion, NO calculamos copagos.
    // Solo devolvemos el flag is_emergency: true para que el frontend (Paso 1)
    // active el botón del 911 y la interfaz de alerta.
    const alertaEmergencia = detectarEmergenciaVital(message);
    if (alertaEmergencia) {
      return res.json({
        ...alertaEmergencia,
        response: alertaEmergencia.mensaje,
        checklist: null,
      });
    }

    // ── PASO 2: Flujo normal (no es emergencia) ──────────────────────────────

    // 2a. Detectar especialidad con IA
    const especialidad = await detectarEspecialidadConIA(message);

    // 2b. Consultar hospitales en Notion (con fallback automático a Medicina General)
    const { hospitales, is_fallback } = await obtenerHospitalesPorEspecialidad(especialidad);

    // 2c. Calcular copago exacto con validación de nulos
    const datos_hospitales = hospitales.map((h) => ({
      ...h,
      copago: calcularCopagoExacto(h.costoBase, h.cobertura),
    }));

    // 2d. Enviar mensaje + contexto al agente de IA
    const contextoData = { especialidad, hospitales: datos_hospitales };
    const fullResponse = await obtenerAnalisisMedico(message, contextoData);

    // 2e. Parsear el checklist embebido en la respuesta
    let responseContent = fullResponse;
    let checklistData = null;

    const checklistMatch = fullResponse.match(/\[CHECKLIST_START\]([\s\S]*?)\[CHECKLIST_END\]/);
    if (checklistMatch) {
      responseContent = fullResponse.replace(/\[CHECKLIST_START\][\s\S]*?\[CHECKLIST_END\]/, '').trim();
      const checklistContent = checklistMatch[1];
      const titleMatch = checklistContent.match(/Título:\s*(.+)/i);
      const itemsMatches = checklistContent.match(/^[\s\t]*[-*•\d\.]+\s+(.+)$/gm);

      if (titleMatch && itemsMatches?.length > 0) {
        checklistData = {
          nombre: titleMatch[1].trim(),
          pasos: itemsMatches.map((item, index) => ({
            id: index + 1,
            text: item.replace(/^[\s\t]*[-*•\d\.]+\s+/, '').trim(),
            completed: false,
          })),
        };
      }
    }

    // ── RESPUESTA ESTRUCTURADA FINAL ─────────────────────────────────────────
    res.json({
      is_emergency:    false,
      is_fallback,
      especialidad,
      datos_hospitales,
      response:        responseContent,
      checklist:       checklistData,
    });

  } catch (error) {
    console.error('Error en /api/chat:', error);
    res.status(500).json({ error: 'Error procesando tu solicitud: ' + error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Backend corriendo en http://localhost:${PORT}`);
});
