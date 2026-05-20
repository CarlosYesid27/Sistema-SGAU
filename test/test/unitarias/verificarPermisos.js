/**
 * Verifica si un usuario tiene permisos de administrador.
 * @param {Object} usuario - Objeto con los datos del usuario
 * @param {string} usuario.rol
 * @param {boolean} usuario.activo 
 * @returns {boolean} 
 */
function esAdmin(usuario) {
  if (!usuario || typeof usuario !== 'object') {
    return false;
  }
  return usuario.rol === 'admin' && usuario.activo === true;
}

/**
 * Obtiene el nombre completo de un usuario.
 * @param {Object} usuario - Objeto con datos del usuario
 * @param {string} usuario.nombre 
 * @param {string} usuario.apellido 
 * @returns {string} 
 */
function obtenerNombreCompleto(usuario) {
  if (!usuario || !usuario.nombre || !usuario.apellido) {
    return '';
  }
  return `${usuario.nombre} ${usuario.apellido}`;
}

module.exports = { esAdmin, obtenerNombreCompleto };
