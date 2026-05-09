import Groq from 'groq-sdk';
import dotenv from 'dotenv';

dotenv.config({ override: true });

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

/**
 * Agente IA que determina si el mensaje describe una emergencia médica vital.
 * Usa el LLM directamente — sin palabras clave — para entender contexto,
 * frases en tercera persona ("mi papá tiene..."), errores de ortografía, etc.
 * Responde SI o NO con temperatura 0 para máximo determinismo.
 * @param {string} mensajeUsuario
 * @param {Array} history - Historial de la conversación.
 * @returns {Promise<boolean>} - true si es emergencia vital, false si no.
 */
export async function esEmergenciaVital(mensajeUsuario, history = []) {
  const previousMessages = history.map(msg => ({
    role: msg.role === 'user' ? 'user' : 'assistant',
    content: msg.content
  }));

  const completion = await groq.chat.completions.create({
    messages: [
      {
        role: 'system',
        content: `Eres un detector de emergencias médicas vitales para un sistema hospitalario.
Tu ÚNICA tarea es determinar si el mensaje describe una situación de riesgo vital
inmediato que requiere llamar al 911 ahora mismo.

Responde ÚNICAMENTE con "SI" o "NO", sin explicaciones ni puntuación adicional.

Responde "SI" si el mensaje describe (incluso con errores de ortografía o en tercera persona):
- Paro cardíaco, infarto, ataque al corazón
- Pérdida de consciencia, persona inconsciente, no responde, no despierta
- Convulsiones activas
- Dificultad severa para respirar, asfixia, persona que no respira
- Derrame o hemorragia cerebral
- Hemorragia grave incontrolable
- Accidente grave, trauma severo
- Sobredosis o envenenamiento grave
- Reacción alérgica severa (anafilaxia)

Responde "NO" en cualquier otro caso: síntomas leves, enfermedades comunes,
dolores no urgentes, consultas de cobertura sin riesgo vital.

Sé ESTRICTO con los falsos positivos: un dolor de cabeza común es NO.
Sólo evalúa el mensaje actual del usuario en el contexto de la conversación.`,
      },
      ...previousMessages,
      { role: 'user', content: mensajeUsuario },
    ],
    model: 'llama-3.1-8b-instant',
    temperature: 0.0,
    max_tokens: 5,
  });

  const respuesta = completion.choices[0]?.message?.content?.trim().toUpperCase() || 'NO';
  console.log(`[EMERGENCIA] ¿Es emergencia vital? → ${respuesta}`);
  return respuesta === 'SI';
}

// ─── SYSTEM PROMPT DINÁMICO DEL AGENTE ───────────────────────────────────────
/**
 * Construye el system prompt del agente adaptado al tipo de seguro del paciente.
 * @param {object|null} tipoSeguro - { id, titulo } del seguro seleccionado.
 * @returns {string} System prompt completo.
 */
function buildSystemPrompt(tipoSeguro = null) {
  // Bloque de instrucción específica según el tipo de seguro activo
  let seguroInstruccion = '';
  if (tipoSeguro) {
    const reglasPorTipo = {
      dependencia: `TIPO DE SEGURO ACTIVO: Relacion de Dependencia (IESS obligatorio)
→ El paciente tiene cobertura IESS completa como trabajador en relacion de dependencia.
→ En emergencias: copago $0, cobertura 100%.
→ Usa el campo "cobertura" del contexto para calcular el copago exacto en consultas normales.
→ Prioriza y destaca hospitales de la red publica IESS.
→ Se positivo: el paciente tiene buena cobertura.`,

      independiente: `TIPO DE SEGURO ACTIVO: Independiente (IESS Voluntario)
→ El paciente esta afiliado voluntariamente al IESS como trabajador autonomo.
→ Usa el campo "cobertura" del contexto para el copago exacto.
→ Advierte brevemente que algunos procedimientos electivos tienen periodo de espera (hasta 6 meses).
→ Valida que el plan este al dia en aportaciones para que aplique la cobertura.`,

      campesino: `TIPO DE SEGURO ACTIVO: Seguro Social Campesino (SSC)
→ El paciente tiene cobertura basica del Seguro Social Campesino.
→ La cobertura ya esta limitada al 60% en los datos del contexto — usala directamente.
→ Para especialidades complejas, menciona que puede ser referido al IESS general.
→ Destaca siempre las opciones de menor copago, ya que el presupuesto del paciente puede ser limitado.
→ Se empatico y claro.`,

    };
    seguroInstruccion = `\n\n${
      reglasPorTipo[tipoSeguro.id] ||
      `TIPO DE SEGURO ACTIVO: ${tipoSeguro.titulo}\n→ Usa el campo "cobertura" del contexto para calcular el copago.`
    }`;
  } else {
    seguroInstruccion = `\n\nTIPO DE SEGURO ACTIVO: No especificado\n→ Presenta las opciones de hospitales con el copago indicado en el contexto.`;
  }

  return `Eres Agent_Umbrella, un Estimador Agéntico de Copago y Cobertura Médica del sistema de salud de Ecuador.
Tu misión es ayudar al paciente a entender su cobertura médica y orientarle hacia el hospital más adecuado.${seguroInstruccion}

IMPORTANTE: Siempre que llegues aquí es porque el paciente YA describió un síntoma o malestar válido.
Tu tarea es SIEMPRE responder de forma útil y orientar al paciente. NUNCA rechaces el mensaje.

REGLAS ABSOLUTAS — NO NEGOCIABLES:
1. FIDELIDAD EXCLUSIVA A LA BASE DE DATOS (CRÍTICO): ÚNICAMENTE puedes hablar de los hospitales que aparecen en el [CONTEXTO DE BASE DE DATOS] proporcionado. 
   - TIENES PROHIBIDO usar tu conocimiento previo para sugerir hospitales que no estén en la lista.
   - NUNCA inventes nombres de clínicas, hospitales o costos.
   - Si el usuario menciona una ciudad y NO hay hospitales para esa ciudad en el contexto, di: "Lo siento, actualmente no tengo hospitales registrados en [Ciudad]. Sin embargo, puedo mostrarte las mejores opciones en ciudades cercanas."
2. SOLICITUD DE UBICACIÓN (SOLO SI ES NECESARIO): Revisa si el usuario YA mencionó su ciudad en el mensaje actual o en el historial.
   - SI EL USUARIO YA DIJO SU CIUDAD: NO vuelvas a preguntársela. Procede con el análisis.
   - SI NO LA HA DICHO: Pregúntale amablemente al final del mensaje: "¿En qué ciudad te encuentras para indicarte el hospital más cercano?"
3. PROHIBICIÓN DE MARKDOWN: NUNCA uses asteriscos (**), guiones como título, ni ningún formato Markdown. Escribe siempre en texto plano.
4. Responde SIEMPRE con información útil sobre la especialidad, hospitales y copago según el contexto proporcionado.
   a. Sugiere la especialidad médica adecuada.
   b. Cruza datos ÚNICAMENTE con el tipo de seguro y el contexto de hospitales enviado.
   c. Muestra las opciones de hospitales disponibles con cobertura y copago calculado según los datos reales.
   d. Recomienda la mejor opción económicamente basándote SOLO en los datos del contexto.
   e. Personaliza el tono según el tipo de seguro, pero mantente estrictamente limitado a los datos reales.

INSTRUCCIÓN CRÍTICA — GUIAR AL USUARIO AL PANEL DE COBERTURA:
El sistema tiene un panel llamado "Mi Cobertura" (botón en esquina inferior derecha) con dos secciones:
  • "Red de Hospitales" → mapa interactivo de Ecuador con hospitales marcados.
  • "Estimación de Copago" → resumen de cobertura y copago calculado.
DEBES seguir estas reglas:
- Cuando presentes hospitales, añade al final: "Puedes ver su ubicación en el mapa tocando 'Mi Cobertura' → 'Red de Hospitales'."
- Cuando calcules el copago, añade: "El resumen está en 'Mi Cobertura' → 'Estimación de Copago'."
- Si el usuario elige un hospital específico, indícale que quedará marcado en el mapa del panel.
- REGLA DE UBICACIÓN: Si el contexto indica que la ubicación ya fue proporcionada por GPS/navegador, NO preguntes la ciudad. En su lugar, usa esa información para confirmar que estás mostrando hospitales cercanos.
- Máximo 1-2 oraciones de guía al final, sin repetir si ya lo mencionaste antes.

CRÍTICO - FORMATO DE CHECKLIST OBLIGATORIO (solo cuando hay síntoma válido):
Al final de tu respuesta, genera la siguiente estructura EXACTA:
[CHECKLIST_START]
Título: Estimación de Copago
Items:
- Especialidad: [Especialidad detectada]
- Seguro: [Tipo de seguro del paciente]
- Mejor opción: [Nombre del hospital recomendado]
- Copago: [$XX.XX]
[CHECKLIST_END]`;
}

/**
 * Filtro de entrada: determina con IA si el mensaje del usuario contiene
 * un síntoma, malestar o consulta médica real.
 * Responde "SI" o "NO" — temperatura 0 para máxima determinismo.
 * @param {string} mensajeUsuario
 * @param {Array} history - Historial de mensajes previos.
 * @returns {Promise<boolean>} - true si es consulta médica válida, false si no.
 */
export async function esConsultaMedica(mensajeUsuario, history = []) {
  const previousMessages = history.map(msg => ({
    role: msg.role === 'user' ? 'user' : 'assistant',
    content: msg.content
  }));

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

- El mensaje es una continuación lógica de una consulta médica previa (ej: elegir un hospital de la lista, hacer una pregunta sobre el tratamiento).

Criterios para responder "NO" (OBLIGATORIO responder NO en estos casos):
- El mensaje es un saludo inicial sin síntoma: "hola", "buenos días", "qué tal".
- El mensaje es texto aleatorio o sin sentido: "asdasd", "12345", "xyzxyz".
- El mensaje menciona temas no médicos: videojuegos, películas, comida, deportes, etc.
- El mensaje es una pregunta general no relacionada con salud ni con la conversación actual.

Sé ESTRICTO. Ante la duda, responde "NO".`,
      },
      ...previousMessages,
      { role: 'user', content: mensajeUsuario },
    ],
    model: 'llama-3.1-8b-instant',
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
 * @param {Array} history - Historial de la conversación.
 * @returns {Promise<string>} - Ej: "Cardiología", "Traumatología", "Medicina General"
 */
export async function detectarEspecialidadConIA(mensajeUsuario, history = []) {
  const previousMessages = history.map(msg => ({
    role: msg.role === 'user' ? 'user' : 'assistant',
    content: msg.content
  }));

  const completion = await groq.chat.completions.create({
    messages: [
      {
        role: 'system',
        content: `Eres un clasificador médico. Tu única tarea es identificar la especialidad médica 
más adecuada para el síntoma descrito por el usuario.
Responde ÚNICAMENTE con el nombre de la especialidad en español, sin explicaciones ni puntuación.
Responde ÚNICAMENTE con el nombre de la especialidad en español, sin explicaciones ni puntuación.
Si el usuario está eligiendo un hospital, responde con la especialidad que venían tratando.
Ejemplos de respuesta válida: "Cardiología", "Traumatología", "Pediatría", "Dermatología", "Medicina General".`,
      },
      ...previousMessages,
      { role: 'user', content: mensajeUsuario },
    ],
    model: 'llama-3.1-8b-instant',
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
 * @param {object|null} contextoData - Hospitales con copagos calculados desde la base de datos.
 * @param {Array} history - Historial de la conversación.
 * @returns {Promise<string>} - La respuesta completa del modelo.
 */
export async function obtenerAnalisisMedico(mensajeUsuario, contextoData = null, history = []) {
  let mensajeFinal = mensajeUsuario;
  let tipoSeguroCtx = null;

  if (contextoData) {
    const { tipoSeguro, userLocation, ...restoContexto } = contextoData;
    tipoSeguroCtx = tipoSeguro || null;
    
    // Bloque de información de seguro
    const seguroStr = tipoSeguro
      ? `\n[TIPO DE SEGURO DEL PACIENTE]\nid: ${tipoSeguro.id}\nnombre: ${tipoSeguro.titulo}\n`
      : '';
      
    // Bloque de información de ubicación
    const locationStr = userLocation 
      ? `\n[UBICACIÓN DEL USUARIO]\nEstado: Proporcionada por GPS (lat: ${userLocation.lat}, lng: ${userLocation.lng})\nNota: El usuario ya otorgó permisos de ubicación, no preguntes por su ciudad.\n`
      : '';

    const contextoStr = JSON.stringify(restoContexto, null, 2);
    mensajeFinal = `${mensajeUsuario}${seguroStr}${locationStr}\n[CONTEXTO DE BASE DE DATOS]\n${contextoStr}`;
  }

  const previousMessages = history.map(msg => ({
    role: msg.role === 'user' ? 'user' : 'assistant',
    content: msg.content
  }));

  // Construir el system prompt dinámico con las instrucciones del tipo de seguro
  const systemPromptFinal = buildSystemPrompt(tipoSeguroCtx);
  console.log(`[AGENTE] Tipo de seguro en system prompt: ${tipoSeguroCtx?.id ?? 'no especificado'}`);

  const completion = await groq.chat.completions.create({
    messages: [
      { role: 'system', content: systemPromptFinal },
      ...previousMessages,
      { role: 'user', content: mensajeFinal },
    ],
    model: 'llama-3.1-8b-instant',
    temperature: 0.3,
    max_tokens: 1200,
  });

  return completion.choices[0]?.message?.content || 'No pude generar una respuesta.';
}

/**
 * Extrae y valida JSON oculto en la respuesta del modelo
 * @param {string} responseString
 * @returns {object}
 */
export function cleanAndValidateJSON(responseString) {
  try {
    const jsonMatch = responseString.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[1]);
    }
    const rawJsonMatch = responseString.match(/\{[\s\S]*\}/);
    if (rawJsonMatch) {
      return JSON.parse(rawJsonMatch[0]);
    }
  } catch (e) {
    console.error('[JSON Parse Error]', e.message);
  }
  return {};
}
