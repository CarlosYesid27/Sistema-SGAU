/**
 * Valida si un correo electrónico tiene un formato correcto.
 * @param {string} email
 * @returns {boolean}
 */
function validarEmail(email) {
  if (typeof email !== 'string' || email.trim() === '') {
    return false;
  }
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

module.exports = { validarEmail };
