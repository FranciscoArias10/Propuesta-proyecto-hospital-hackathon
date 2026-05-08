/**
 * Calcula el copago exacto del paciente.
 * Seguridad: si costoBase o cobertura son nulos/undefined, usa 0 por defecto
 * para que el servidor nunca se caiga por datos incompletos de Notion.
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
