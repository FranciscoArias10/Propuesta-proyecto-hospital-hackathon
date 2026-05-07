import { Client } from '@notionhq/client';
import dotenv from 'dotenv';

dotenv.config();

const notion = new Client({ auth: process.env.NOTION_TOKEN });

export const obtenerHospitalesPorEspecialidad = async (especialidad) => {
  try {
    const response = await notion.databases.query({
      database_id: process.env.NOTION_DATABASE_ID,
      filter: {
        property: "Especialidad",
        rich_text: {
          contains: especialidad // Busca coincidencias parciales (ej: "Cardio")
        }
      }
    });

    return response.results.map(page => ({
      hospital: page.properties.Hospital.rich_text[0]?.plain_text,
      plan: page.properties.Plan.select.name,
      cobertura: page.properties.Cobertura.number, // Valor decimal (ej: 0.85)
      costoBase: page.properties["Costo Base"].number // Valor en USD
    }));
  } catch (error) {
    console.error("Error consultando Notion:", error);
    return [];
  }
};