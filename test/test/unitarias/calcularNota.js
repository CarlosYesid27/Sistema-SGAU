
const PASS_THRESHOLD = 3.0;

const W_PARTIAL1 = 0.30;
const W_PARTIAL2 = 0.30;
const W_FINAL    = 0.40;

/**
 * Calcula el promedio ponderado de un estudiante.
 * Devuelve null si alguna nota aún no ha sido registrada.
 * @param {number|null} partial1   - Nota del primer parcial  (0–5)
 * @param {number|null} partial2   - Nota del segundo parcial (0–5)
 * @param {number|null} finalExam  - Nota del examen final    (0–5)
 * @returns {number|null} Promedio redondeado a 2 decimales, o null
 */
function calcularPromedioPonderado(partial1, partial2, finalExam) {
  if (partial1 === null || partial2 === null || finalExam === null) {
    return null;
  }
  const avg = partial1 * W_PARTIAL1 + partial2 * W_PARTIAL2 + finalExam * W_FINAL;
  return Math.round(avg * 100) / 100;
}

/**
 * @param {number|null} promedio
 * @returns {'IN_PROGRESS'|'PASSED'|'FAILED'}
 */
function resolverEstado(promedio) {
  if (promedio === null) return 'IN_PROGRESS';
  return promedio >= PASS_THRESHOLD ? 'PASSED' : 'FAILED';
}

module.exports = { calcularPromedioPonderado, resolverEstado, PASS_THRESHOLD };
