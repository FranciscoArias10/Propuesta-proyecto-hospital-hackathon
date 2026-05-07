import Groq from 'groq-sdk';
import dotenv from 'dotenv';

dotenv.config({ override: true });

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const systemPrompt = `Eres un Estimador Agéntico de Copago y Cobertura Médica (IESS/Aseguradora).
Tu misión es ayudar al paciente a entender su beneficio antes de atenderse.

Cuando el paciente indique un síntoma, debes:
1. Sugerir la especialidad médica adecuada para su síntoma.
2. Cruzar datos con su plan de seguro usando la información de contexto proporcionada.
3. Mostrar las opciones de hospitales disponibles en la red, con su cobertura y copago calculado.
4. Recomendar la mejor opción económicamente para el paciente.

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

/**
 * Usa un prompt corto de Llama para extraer SOLO el nombre de la especialidad
 * médica del mensaje del usuario. Rápido y determinístico.
 * @param {string} mensajeUsuario
 * @returns {Promise<string>} - Ej: "Cardiología", "Traumatología", "Medicina General"
 */
export async function detectarEspecialidadConIA(mensajeUsuario) {
  const completion = await groq.chat.completions.create({
    messages: [
      {
        role: 'system',
        content: `Eres un clasificador médico. Tu única tarea es identificar la especialidad médica 
más adecuada para el síntoma descrito por el usuario.
Responde ÚNICAMENTE con el nombre de la especialidad en español, sin explicaciones ni puntuación.
Ejemplos de respuesta válida: "Cardiología", "Traumatología", "Pediatría", "Dermatología", "Medicina General".`,
      },
      { role: 'user', content: mensajeUsuario },
    ],
    model: 'llama-3.3-70b-versatile',
    temperature: 0.0,  // Máxima determinismo para clasificación
    max_tokens: 20,    // Solo necesitamos una palabra
  });

  const especialidad = completion.choices[0]?.message?.content?.trim() || 'Medicina General';
  console.log(`[IA] Especialidad detectada: ${especialidad}`);
  return especialidad;
}

/**
 * Llama al modelo Llama 3.3 de Groq para obtener el análisis médico completo.
 * @param {string} mensajeUsuario - El síntoma o mensaje del paciente.
 * @param {object|null} contextoData - Hospitales con copagos calculados desde Notion.
 * @returns {Promise<string>} - La respuesta completa del modelo.
 */
export async function obtenerAnalisisMedico(mensajeUsuario, contextoData = null) {
  let mensajeFinal = mensajeUsuario;

  if (contextoData) {
    const contextoStr = JSON.stringify(contextoData, null, 2);
    mensajeFinal = `${mensajeUsuario}\n\n[CONTEXTO DE BASE DE DATOS]\n${contextoStr}`;
  }

  const completion = await groq.chat.completions.create({
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: mensajeFinal },
    ],
    model: 'llama-3.3-70b-versatile',
    temperature: 0.3,
    max_tokens: 1200,
  });

  return completion.choices[0]?.message?.content || 'No pude generar una respuesta.';
}
