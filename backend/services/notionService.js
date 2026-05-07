import { Client } from '@notionhq/client';
import dotenv from 'dotenv';

dotenv.config();

// NOTA: @notionhq/client v5.x usa dataSources.query (no databases.query)
const notion = new Client({ auth: process.env.NOTION_TOKEN });

console.log('[Notion] Token cargado:', process.env.NOTION_TOKEN ? '✅ OK' : '❌ FALTA');
console.log('[Notion] Database ID:', process.env.NOTION_DATABASE_ID ? '✅ OK' : '❌ FALTA');

export const obtenerHospitalesPorEspecialidad = async (especialidad) => {
  try {
    if (!process.env.NOTION_DATABASE_ID) {
      throw new Error("Falta NOTION_DATABASE_ID en el .env");
    }

    console.log(`[Notion] Consultando especialidad: "${especialidad}"`);

    // En @notionhq/client v5.x, databases.query se reemplazó por dataSources.query
    const response = await notion.dataSources.query({
      data_source_id: process.env.NOTION_DATABASE_ID,
      filter: {
        property: "Especialidad",
        rich_text: {           // La columna Especialidad es tipo TEXT en Notion
          contains: especialidad
        }
      }
    });

    console.log(`[Notion] Resultados encontrados: ${response.results.length}`);

    return response.results.map(page => ({
      hospital: page.properties.Hospital.rich_text[0]?.plain_text || "Hospital no definido",
      plan: page.properties.Plan.select?.name || "Sin plan",
      cobertura: page.properties.Cobertura.number || 0,
      costoBase: page.properties["Costo Base"].number || 0
    }));
  } catch (error) {
    console.error("[Notion] Error detallado:", error.body || error.message);
    return [];
  }
};