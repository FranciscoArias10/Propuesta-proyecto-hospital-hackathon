import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

console.log('[Supabase] Cliente inicializado:', supabaseUrl ? '✅ OK' : '❌ FALTA URL');

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

    // 1. Intentar buscar por especialidad (coincidencia exacta o similar)
    let { data: hospitales, error } = await supabase
      .from('medic_info')
      .select('*')
      .ilike('especialidad', `%${especialidad}%`);

    if (error) throw error;

    let is_fallback = false;

    // 2. Si no hay resultados, traer todos (fallback)
    if (!hospitales || hospitales.length === 0) {
      console.log(`[Supabase] Sin resultados para "${especialidad}", aplicando fallback...`);
      const { data: allData, error: allError } = await supabase
        .from('medic_info')
        .select('*');
      
      if (allError) throw allError;
      hospitales = allData || [];
      is_fallback = true;
    }

    // 3. Mapear al formato esperado por el resto de la app
    const hospitalesMapeados = hospitales.map(h => {
      // Si la cobertura viene como entero (ej: 90), convertir a decimal (0.9)
      const coberturaNum = parseFloat(h.cobertura);
      const coberturaFinal = coberturaNum > 1 ? coberturaNum / 100 : coberturaNum;

      return {
        hospital:     h.hospital || 'Hospital no definido',
        especialidad: h.especialidad || 'Sin especialidad',
        ciudad:       h.ciudad || 'No especificada',
        plan:         h.tipo_afiliacion || 'Sin plan',
        cobertura:    coberturaFinal,
        // Usamos el copago de la DB como costoBase para que el calculador siga funcionando
        costoBase:    parseFloat(h.copago) || 0,
        tiempoEspera: h.tiempo_espera || 'No definido',
        latitud:      h.latitud || null,
        longitud:     h.longitud || null,
      };
    });

    console.log(`[Supabase] Total hospitales obtenidos: ${hospitalesMapeados.length} (Fallback: ${is_fallback})`);

    return { hospitales: hospitalesMapeados, is_fallback };

  } catch (error) {
    console.error('[Supabase] ❌ Error al consultar Supabase:', error.message);
    return { hospitales: [], is_fallback: false };
  }
};
