/**
 * Valida si un monto de pago es válido.
 * Un monto es válido si es un número positivo mayor a cero.
 * @param {number} monto
 * @returns {boolean}
 */
function validarMonto(monto) {
  if (typeof monto !== 'number') {
    return false;
  }
  if (isNaN(monto)) {
    return false;
  }
  return monto > 0;
}

module.exports = { validarMonto };
