import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import { obtenerAnalisisMedico, detectarEspecialidadConIA } from './backend/services/aiService.js';
import { obtenerHospitalesPorEspecialidad } from './backend/services/notionService.js';
import { calcularCopagoExacto } from './backend/utils/calculator.js';

dotenv.config({ override: true });

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// --- Endpoint principal ---

app.post('/api/chat', async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ error: 'Message is required' });

    // 1. Usar IA para detectar la especialidad médica del mensaje
    const especialidad = await detectarEspecialidadConIA(message);

    // 2. Consultar hospitales en Notion filtrados por especialidad
    const hospitales = await obtenerHospitalesPorEspecialidad(especialidad);

    // 3. Calcular copago exacto con JavaScript (no el LLM)
    const hospitalesConCopago = hospitales.map((h) => ({
      ...h,
      copago: calcularCopagoExacto(h.costoBase, h.cobertura),
    }));

    // 4. Enviar mensaje + contexto de hospitales al agente de IA
    const contextoData = { especialidad, hospitales: hospitalesConCopago };
    const fullResponse = await obtenerAnalisisMedico(message, contextoData);

    // 5. Parsear el checklist embebido en la respuesta
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

    res.json({ response: responseContent, checklist: checklistData });

  } catch (error) {
    console.error('Error en /api/chat:', error);
    res.status(500).json({ error: 'Error procesando tu solicitud: ' + error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Backend corriendo en http://localhost:${PORT}`);
});
