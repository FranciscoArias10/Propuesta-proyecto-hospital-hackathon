/**
 * Calcula el copago exacto del paciente.
 * @param {number} costoBase - El costo total de la consulta/servicio en dólares.
 * @param {number} cobertura - La cobertura del seguro como decimal (ej: 0.85 para 85%).
 * @returns {number} - El monto que debe pagar el paciente, redondeado a 2 decimales.
 */
export function calcularCopagoExacto(costoBase, cobertura) {
  return Math.round(costoBase * (1 - cobertura) * 100) / 100;
}
