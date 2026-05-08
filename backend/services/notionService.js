import { Client } from '@notionhq/client';
import dotenv from 'dotenv';

dotenv.config();

// NOTA: @notionhq/client v5.x usa dataSources.query (no databases.query)
const notion = new Client({ auth: process.env.NOTION_TOKEN });

console.log('[Notion] Token cargado:', process.env.NOTION_TOKEN ? '✅ OK' : '❌ FALTA');
console.log('[Notion] Database ID:', process.env.NOTION_DATABASE_ID ? '✅ OK' : '❌ FALTA');

/**
 * Consulta hospitales en Notion filtrando por especialidad.
 * Usa 'equals' (coincidencia exacta) para que cuando la especialidad
 * no exista en la tabla, Notion devuelva 0 resultados y se active el fallback.
 * @param {string} especialidad
 * @returns {Promise<Array>}
 */
async function consultarNotion(especialidad) {
  // La columna 'Especialidad' en Notion es de tipo rich_text (confirmado)
  let response;

  try {
    response = await notion.dataSources.query({
      data_source_id: process.env.NOTION_DATABASE_ID,
      filter: {
        property: 'Especialidad',
        rich_text: { equals: especialidad },
      },
    });
    console.log(`[Notion] Resultados para "${especialidad}": ${response.results?.length ?? 0}`);
  } catch (e) {
    console.warn('[Notion] Error en query filtrada, cargando todos sin filtro:', e.message);
    response = await notion.dataSources.query({
      data_source_id: process.env.NOTION_DATABASE_ID,
    });
    console.log(`[Notion] Total sin filtro: ${response.results?.length ?? 0}`);
  }

  // Si el filtro exacto no trajo nada, buscar por coincidencia parcial
  if (!response.results || response.results.length === 0) {
    console.log(`[Notion] Sin coincidencia exacta para "${especialidad}", cargando todos los hospitales...`);
    response = await notion.dataSources.query({
      data_source_id: process.env.NOTION_DATABASE_ID,
    });
    console.log(`[Notion] Total hospitales (fallback): ${response.results?.length ?? 0}`);
  }

  return (response.results || []).map(page => ({
    hospital:     page.properties.Hospital?.rich_text?.[0]?.plain_text
               || page.properties.Hospital?.title?.[0]?.plain_text
               || 'Hospital no definido',
    especialidad: page.properties.Especialidad?.rich_text?.[0]?.plain_text
               || 'Sin especialidad',
    plan:         page.properties.Plan?.select?.name
               || page.properties.Plan?.rich_text?.[0]?.plain_text
               || 'Sin plan',
    cobertura:    page.properties.Cobertura?.number ?? 0,
    costoBase:    page.properties['Costo Base']?.number ?? 0,
  }));
}

/**
 * Obtiene hospitales por especialidad desde Notion.
 * consultarNotion() ya maneja el fallback interno (sin filtro) si no hay resultados.
 * Devuelve { hospitales, is_fallback } para informar al servidor.
 * @param {string} especialidad
 * @returns {Promise<{ hospitales: Array, is_fallback: boolean }>}
 */
export const obtenerHospitalesPorEspecialidad = async (especialidad) => {
  try {
    if (!process.env.NOTION_DATABASE_ID) {
      throw new Error('Falta NOTION_DATABASE_ID en el .env');
    }

    console.log(`[Notion] Consultando especialidad: "${especialidad}"`);
    const hospitales = await consultarNotion(especialidad);
    console.log(`[Notion] Total hospitales obtenidos: ${hospitales.length}`);

    return { hospitales, is_fallback: false };

  } catch (error) {
    // Imprimir el error completo de la API de Notion para diagnóstico
    console.error('[Notion] ❌ Error al consultar Notion:');
    console.error('  Mensaje:', error.message);
    if (error.body)   console.error('  Body:', JSON.stringify(error.body, null, 2));
    if (error.status) console.error('  Status HTTP:', error.status);
    if (error.code)   console.error('  Código:', error.code);
    return { hospitales: [], is_fallback: false };
  }
};