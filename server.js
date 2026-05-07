import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import Groq from 'groq-sdk';

dotenv.config({ override: true });

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

app.post('/api/chat', async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const systemPrompt = `Eres un Estimador Agéntico de Copago y Cobertura Médica (IESS/Aseguradora).
Tu misión es ayudar al paciente a entender su beneficio antes de atenderse.

Cuando el paciente indique un síntoma, debes:
1. Sugerir la especialidad médica adecuada para su síntoma.
2. Simular un cruce de datos con su plan de seguro.
3. Mostrar 2 o 3 opciones de hospitales (ej. Hospital de los Valles, Clínica San Francisco, Hospital Carlos Andrade Marín).
4. Indicar el porcentaje de cobertura y un valor de copago estimado en dólares para cada hospital, recomendando la mejor opción.

Ejemplo de respuesta:
"Para tu dolor de pecho, te recomiendo la especialidad de Cardiología.
- Hospital IESS Carlos Andrade Marín tiene cobertura del 100%. Tu copago es $0.
- Clínica Privada San Francisco tiene cobertura del 80%. Tu copago estimado es $25.
Te conviene el Hospital Carlos Andrade Marín."

CRÍTICO - FORMATO DE CHECKLIST OBLIGATORIO:
Al final, genera la siguiente estructura:
[CHECKLIST_START]
Título: Estimación de Copago
Items:
- Especialidad: [Especialidad]
- Mejor opción: [Hospital Recomendado]
- Copago: [$XX]
[CHECKLIST_END]

Responde SIEMPRE en español formal, empático y claro.`;

    const completion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message }
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.3,
      max_tokens: 1200,
    });

    const fullResponse = completion.choices[0]?.message?.content || "No pude generar una respuesta.";
    
    let responseContent = fullResponse;
    let checklistData = null;

    const checklistMatch = fullResponse.match(/\[CHECKLIST_START\]([\s\S]*?)\[CHECKLIST_END\]/);
    
    if (checklistMatch) {
      responseContent = fullResponse.replace(/\[CHECKLIST_START\][\s\S]*?\[CHECKLIST_END\]/, '').trim();
      const checklistContent = checklistMatch[1];
      const titleMatch = checklistContent.match(/Título:\s*(.+)/i);
      const itemsMatches = checklistContent.match(/^[\s\t]*[-*•\d\.]+\s+(.+)$/gm);
      
      if (titleMatch && itemsMatches && itemsMatches.length > 0) {
        checklistData = {
          nombre: titleMatch[1].trim(),
          pasos: itemsMatches.map((item, index) => ({
            id: index + 1,
            text: item.replace(/^[\s\t]*[-*•\d\.]+\s+/, '').trim(),
            completed: false
          }))
        };
      }
    }

    res.json({ 
      response: responseContent,
      checklist: checklistData
    });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error processing your request: ' + error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Backend Server running on http://localhost:${PORT}`);
});
