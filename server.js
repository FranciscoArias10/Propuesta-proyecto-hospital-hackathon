import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import {
  obtenerAnalisisMedico,
  detectarEspecialidadConIA,
  esEmergenciaVital,             // ← Detector de emergencia por IA (sin palabras clave)
  esConsultaMedica,              // ← Filtro de entrada
  cleanAndValidateJSON
} from './backend/services/aiService.js';
import { obtenerHospitalesPorEspecialidad, supabase } from './backend/services/supabaseService.js';
import { calcularCopagoExacto } from './backend/utils/calculator.js';

dotenv.config({ override: true });

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/chat
// La respuesta SIEMPRE incluye ambos:
//   is_emergency     → boolean  (IA decide si hay emergencia vital)
//   datos_hospitales → array    (siempre se consulta la base de datos, haya emergencia o no)
// Los dos sistemas trabajan en paralelo y no se bloquean entre sí.
// ─────────────────────────────────────────────────────────────────────────────
app.post('/api/chat', async (req, res) => {
  try {
    const { message, history = [], tipoSeguro = null, userLocation = null } = req.body;
    if (!message) return res.status(400).json({ error: 'Message is required' });

    // ── PASO 0: Filtro de entrada — ¿es una consulta médica real? ─────────────
    // Si ya hay contexto médico establecido (el asistente ya respondió antes),
    // se omite el filtro para no interrumpir la conversación en curso.
    const hasEstablishedContext = history.some(m => m.role === 'assistant');
    const esMedico = hasEstablishedContext ? true : await esConsultaMedica(message, history);

    if (!esMedico) {
      console.log('[FILTRO] Mensaje rechazado: no contiene síntoma médico.');
      return res.json({
        is_emergency:     false,
        is_fallback:      false,
        is_invalid:       true,
        especialidad:     null,
        datos_hospitales: [],
        response:         'Lo siento, no logro identificar un síntoma médico en tu mensaje. Por favor, descríbeme qué malestar, dolor o síntoma estás experimentando para poder orientarte con tu cobertura.',
        checklist:        null,
      });
    }

    // ── PASO 1: Detección en paralelo — emergencia + especialidad ─────────────
    // Las dos llamadas a la IA corren al MISMO TIEMPO.
    // Una determina si hay riesgo vital; la otra identifica la especialidad.
    // Son completamente independientes: nunca una bloquea a la otra.
    const [esEmergencia, especialidad] = await Promise.all([
      esEmergenciaVital(message, history),
      detectarEspecialidadConIA(message, history),
    ]);

    // ── PASO 2: Consultar hospitales en la base de datos (SIEMPRE, haya emergencia o no) ─
    const { hospitales, is_fallback } = await obtenerHospitalesPorEspecialidad(especialidad);

    // ── PASO 3: Calcular copago según tipo de seguro ──────────────────────────
    const datos_hospitales = hospitales.map((h) => {
      let cobertura = h.cobertura;
      // Seguro Social Campesino = cobertura reducida al 60% si no es emergencia
      if (tipoSeguro?.id === 'campesino' && cobertura > 0.6) cobertura = 0.6;
      return {
        ...h,
        cobertura,
        copago: calcularCopagoExacto(h.costoBase, cobertura),
      };
    });

    // ── PASO 4: Análisis completo del agente de IA ─────────────────────────────
    // Limitamos a 10 hospitales para el contexto de la IA para evitar errores de límite de tokens (TPM)
    const contextoData = { especialidad, hospitales: datos_hospitales.slice(0, 10), tipoSeguro, userLocation };
    const fullResponse = await obtenerAnalisisMedico(message, contextoData, history);

    // ── PASO 4.5: Extraer y limpiar JSON oculto ────────────────────────────────
    const extraData = cleanAndValidateJSON(fullResponse);
    
    // Limpiamos la respuesta para no renderizar código JSON al usuario
    let responseContent = fullResponse;
    const markdownJsonMatch = fullResponse.match(/```(?:json)?[\s\S]*?```/i);
    if (markdownJsonMatch) {
      responseContent = responseContent.replace(markdownJsonMatch[0], '');
    } else {
      const rawJsonMatch = fullResponse.match(/\{[\s\S]*\}/);
      if (rawJsonMatch) {
        responseContent = responseContent.replace(rawJsonMatch[0], '');
      }
    }
    responseContent = responseContent.trim();

    // ── PASO 5: Parsear checklist embebido en la respuesta ─────────────────────
    let checklistData = null;

    const checklistMatch = responseContent.match(/\[CHECKLIST_START\]([\s\S]*?)\[CHECKLIST_END\]/);
    if (checklistMatch) {
      responseContent = responseContent.replace(/\[CHECKLIST_START\][\s\S]*?\[CHECKLIST_END\]/, '').trim();
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

    // ── RESPUESTA FINAL: hospitales + botón de emergencia juntos ───────────────
    res.json({
      is_emergency:     esEmergencia || extraData.is_emergency,   // Combina ambas vías
      is_fallback,
      especialidad,
      datos_hospitales,
      response:         responseContent,
      checklist:        checklistData,
    });

  } catch (error) {
    console.error('Error en /api/chat:', error);
    res.status(500).json({ error: 'Error procesando tu solicitud: ' + error.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/debug/supabase  — Diagnóstico: devuelve todos los registros crudos
// ─────────────────────────────────────────────────────────────────────────────

app.get('/api/debug/supabase', async (req, res) => {
  try {
    const { data, error, count } = await supabase
      .from('medic_info')
      .select('*', { count: 'exact' })
      .limit(20);

    if (error) {
      return res.json({ ok: false, error: error.message, hint: error.hint, details: error.details });
    }

    const columnas = data && data.length > 0 ? Object.keys(data[0]) : [];
    res.json({
      ok: true,
      total_registros: count,
      columnas,
      muestra: data,
    });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// GET /api/hospitales — Devuelve todos los hospitales mapeados
app.get('/api/hospitales', async (req, res) => {
  try {
    const { hospitales, is_fallback } = await obtenerHospitalesPorEspecialidad('');
    res.json({ ok: true, total: hospitales.length, is_fallback, hospitales });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

app.listen(PORT, () => {
  console.log(`Backend corriendo en http://localhost:${PORT}`);
});
