/**
 * Calcula el copago exacto del paciente.
 * Seguridad: si costoBase o cobertura son nulos/undefined, usa 0 por defecto
 * para que el servidor nunca se caiga por datos incompletos.
 *
 * @param {number|null|undefined} costoBase  - El costo total de la consulta en dólares.
 * @param {number|null|undefined} cobertura  - La cobertura del seguro como decimal (ej: 0.85 para 85%).
 * @returns {number} - El monto que debe pagar el paciente, redondeado a 2 decimales.
 */
export function calcularCopagoExacto(costoBase, cobertura) {
  const costo    = typeof costoBase === 'number'  && isFinite(costoBase)  ? costoBase  : 0;
  const cobert   = typeof cobertura === 'number'  && isFinite(cobertura)  ? cobertura  : 0;
  return Math.round(costo * (1 - cobert) * 100) / 100;
}

/**
 * Calcula la distancia en kilómetros entre dos coordenadas usando la fórmula de Haversine.
 */
export function calcularDistancia(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return Infinity;
  const R = 6371; // Radio de la Tierra en km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2); 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  return R * c;
}
