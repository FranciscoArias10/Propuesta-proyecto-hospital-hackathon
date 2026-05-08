import Groq from 'groq-sdk';
import dotenv from 'dotenv';

dotenv.config({ override: true });

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// ─── PALABRAS CLAVE DE EMERGENCIA VITAL ──────────────────────────────────────
// Esta lista cubre los síntomas más críticos. El frontend usará el flag
// is_emergency: true para mostrar el botón del 911 (eso le toca al Paso 1).
const SINTOMAS_EMERGENCIA = [
  // Cardiovascular
  'infarto', 'ataque al corazón', 'ataque cardiaco', 'dolor en el pecho',
  'pecho opresivo', 'presión en el pecho',
  // Respiratorio
  'asfixia', 'no puedo respirar', 'sin respiración', 'ahogamiento',
  'dificultad para respirar', 'falta de aire',
  // Neurológico
  'derrame', 'derrame cerebral', 'apoplejía', 'convulsión', 'convulsiones',
  'pérdida de consciencia', 'perdí el conocimiento', 'desmayo repentino',
  'no despierta', 'parálisis', 'cara caída', 'boca torcida',
  // Hemorragia
  'hemorragia', 'sangrado abundante', 'sangrado sin control', 'mucha sangre',
  // Trauma grave
  'accidente grave', 'atropellado', 'caída de altura', 'fractura expuesta',
  // Alergias graves
  'anafilaxis', 'reacción alérgica grave', 'garganta cerrada',
  // Intoxicación
  'intoxicación', 'envenenamiento', 'tomé pastillas', 'sobredosis',
];

const PRIMEROS_AUXILIOS_GENERALES = [
  'Llama al 911 de inmediato.',
  'Mantén la calma y permanece con el paciente.',
  'No muevas a la persona si hay riesgo de lesión en columna.',
  'No le des comida ni bebida.',
  'Si no respira y sabes RCP, aplícalo hasta que llegue la ayuda.',
  'Mantén libre la vía aérea.',
];

/**
 * Detecta si el mensaje del usuario contiene síntomas de emergencia vital.
 * Si detecta emergencia, devuelve el objeto de alerta listo para el frontend.
 * Si NO es emergencia, devuelve null y el flujo normal continúa.
 * @param {string} mensaje
 * @returns {{ is_emergency: true, mensaje: string, primeros_auxilios: string[], especialidad: string } | null}
 */
export function detectarEmergenciaVital(mensaje) {
  const mensajeLower = mensaje.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const esEmergencia = SINTOMAS_EMERGENCIA.some(sintoma =>
    mensajeLower.includes(sintoma.normalize('NFD').replace(/[\u0300-\u036f]/g, ''))
  );

  if (!esEmergencia) return null;

  console.log('[EMERGENCIA] ⚠️  Síntoma de riesgo vital detectado. Activando protocolo de emergencia.');

  return {
    is_emergency: true,
    is_fallback: false,
    mensaje: '⚠️ ALERTA: Tus síntomas sugieren una posible emergencia médica grave. Llama al 911 de inmediato. No esperes.',
    primeros_auxilios: PRIMEROS_AUXILIOS_GENERALES,
    especialidad: 'Emergencia',
    datos_hospitales: [],
    // Flag para tu compañero del frontend (Paso 1):
    // si is_emergency === true → muestra el botón rojo del 911 y la interfaz de alerta
  };
}

// ─── SYSTEM PROMPT DEL AGENTE ─────────────────────────────────────────────────
const systemPrompt = `Eres un Estimador Agéntico de Copago y Cobertura Médica (IESS/Aseguradora).
Tu misión EXCLUSIVA es ayudar al paciente a entender su cobertura médica SOLO cuando describe
un malestar, dolor, enfermedad o síntoma físico o mental concreto.

REGLAS ABSOLUTAS — NO NEGOCIABLES:
1. Si el usuario NO describe un malestar, dolor, enfermedad o síntoma médico claro y específico,
   DEBES responder ÚNICAMENTE con:
   "Lo siento, solo puedo ayudarte con consultas de salud. Por favor, descríbeme qué malestar,
   dolor o síntoma estás experimentando para poder orientarte."
   No hagas ninguna otra acción. No intentes inferir síntomas donde no los hay.
2. NUNCA interpretes nombres de videojuegos, películas, personajes, saludos, palabras sin sentido
   ni texto aleatorio como un síntoma médico. Si el mensaje no menciona explícitamente un malestar
   humano real, aplica la regla 1.
3. Cuando el usuario SÍ describe un síntoma claro, entonces:
   a. Sugiere la especialidad médica adecuada.
   b. Cruza datos con el plan de seguro usando la información de contexto proporcionada.
   c. Muestra las opciones de hospitales disponibles con cobertura y copago calculado.
   d. Recomienda la mejor opción económicamente.

Ejemplo de respuesta válida (usuario describió un síntoma):
"Para tu dolor de pecho, te recomiendo la especialidad de Cardiología.
- Hospital IESS Carlos Andrade Marín tiene cobertura del 100%. Tu copago es $0.
- Clínica Privada San Francisco tiene cobertura del 80%. Tu copago estimado es $25.
Te conviene el Hospital Carlos Andrade Marín."

CRÍTICO - FORMATO DE CHECKLIST OBLIGATORIO (solo cuando hay síntoma válido):
Al final de tu respuesta, genera la siguiente estructura:
[CHECKLIST_START]
Título: Estimación de Copago
Items:
- Especialidad: [Especialidad]
- Mejor opción: [Hospital Recomendado]
- Copago: [$XX]
[CHECKLIST_END]

Responde SIEMPRE en español formal, empático y claro.`;

/**
 * Filtro de entrada: determina con IA si el mensaje del usuario contiene
 * un síntoma, malestar o consulta médica real.
 * Responde "SI" o "NO" — temperatura 0 para máxima determinismo.
 * @param {string} mensajeUsuario
 * @returns {Promise<boolean>} - true si es consulta médica válida, false si no.
 */
export async function esConsultaMedica(mensajeUsuario) {
  const completion = await groq.chat.completions.create({
    messages: [
      {
        role: 'system',
        content: `Eres un filtro de entrada para un sistema médico. Tu ÚNICA tarea es determinar si el
mensaje del usuario describe un malestar, dolor, enfermedad o síntoma físico o mental concreto.

Responde ÚNICAMENTE con la palabra "SI" o "NO", sin explicaciones ni puntuación adicional.

Criterios para responder "SI":
- El usuario menciona dolor, malestar, síntoma, enfermedad, lesión o condición física/mental.
- Ejemplos: "me duele la cabeza", "tengo fiebre", "siento náuseas", "me lastimé el brazo".

Criterios para responder "NO" (OBLIGATORIO responder NO en estos casos):
- El mensaje es un saludo sin síntoma: "hola", "buenos días", "qué tal".
- El mensaje es texto aleatorio o sin sentido: "asdasd", "12345", "xyzxyz".
- El mensaje menciona temas no médicos: videojuegos, películas, comida, deportes, etc.
- El mensaje es una pregunta general no relacionada con salud.

Sé ESTRICTO. Ante la duda, responde "NO".`,
      },
      { role: 'user', content: mensajeUsuario },
    ],
    model: 'llama-3.3-70b-versatile',
    temperature: 0.0,
    max_tokens: 5,
  });

  const respuesta = completion.choices[0]?.message?.content?.trim().toUpperCase() || 'NO';
  console.log(`[FILTRO] ¿Es consulta médica? → ${respuesta}`);
  return respuesta === 'SI';
}

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
