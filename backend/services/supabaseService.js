import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

console.log('[Supabase] Cliente inicializado:', supabaseUrl ? `✅ OK (${supabaseUrl})` : '❌ FALTA URL');

/**
 * Obtiene hospitales por especialidad desde Supabase.
 * Si no encuentra resultados para la especialidad, devuelve todos los hospitales (fallback).
 * @param {string} especialidad
 * @returns {Promise<{ hospitales: Array, is_fallback: boolean }>}
 */
export const obtenerHospitalesPorEspecialidad = async (especialidad) => {
  try {
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Faltan credenciales de Supabase en el .env');
    }

    console.log(`[Supabase] Consultando especialidad: "${especialidad}"`);

    let hospitales = [];
    let is_fallback = false;

    // 1. Si hay especialidad, intentar buscar por ella
    if (especialidad && especialidad.trim() !== '') {
      const { data, error } = await supabase
        .from('medic_info')
        .select('*')
        .ilike('especialidad', `%${especialidad}%`);

      if (error) {
        console.error('[Supabase] Error en query por especialidad:', JSON.stringify(error));
        throw error;
      }
      hospitales = data || [];
      console.log(`[Supabase] Resultados para "${especialidad}": ${hospitales.length}`);
    }

    // 2. Si no hay resultados (o no se buscó por especialidad), traer todos (fallback)
    if (hospitales.length === 0) {
      console.log(`[Supabase] Sin resultados para "${especialidad}", aplicando fallback (todos)...`);
      const { data: allData, error: allError } = await supabase
        .from('medic_info')
        .select('*');

      if (allError) {
        console.error('[Supabase] Error en fallback:', JSON.stringify(allError));
        throw allError;
      }
      hospitales = allData || [];
      is_fallback = true;
      console.log(`[Supabase] Fallback total: ${hospitales.length} registros`);
    }

    // 3. Mapear al formato esperado por el resto de la app
    const hospitalesMapeados = hospitales.map(h => {
      // Si la cobertura viene como entero (ej: 90), convertir a decimal (0.9)
      const coberturaNum = parseFloat(h.cobertura);
      const coberturaFinal = coberturaNum > 1 ? coberturaNum / 100 : coberturaNum;

      return {
        hospital:     h.hospital     || h.nombre_hospital || 'Hospital no definido',
        especialidad: h.especialidad || h.specialty       || 'Sin especialidad',
        ciudad:       h.ciudad       || h.city            || 'No especificada',
        plan:         h.tipo_afiliacion || h.plan          || 'Sin plan',
        cobertura:    coberturaFinal,
        costoBase:    parseFloat(h.copago || h.costo_base || h.cost) || 0,
        tiempoEspera: h.tiempo_espera  || h.wait_time     || 'No definido',
        latitud:      parseFloat(h.latitud  || h.lat)     || null,
        longitud:     parseFloat(h.longitud || h.lng || h.lon) || null,
      };
    });

    console.log(`[Supabase] Total hospitales obtenidos: ${hospitalesMapeados.length} (Fallback: ${is_fallback})`);

    return { hospitales: hospitalesMapeados, is_fallback };

  } catch (error) {
    console.error('[Supabase] ❌ Error al consultar Supabase:', error.message);
    return { hospitales: [], is_fallback: false };
  }
};
