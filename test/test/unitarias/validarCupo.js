/**
 * Valida si el cupo de un curso es válido.
 * @param {number} cupo
 * @returns {boolean}
 */
function validarCupo(cupo) {
  if (typeof cupo !== 'number' || isNaN(cupo)) {
    return false;
  }
  if (!Number.isInteger(cupo)) {
    return false;
  }
  return cupo > 0;
}

/**
 * Verifica si hay cupos disponibles en un curso.
 * @param {number} cupoTotal 
 * @param {number} inscritos
 * @returns {boolean}
 */
function hayCupoDisponible(cupoTotal, inscritos) {
  return inscritos < cupoTotal;
}

module.exports = { validarCupo, hayCupoDisponible };
