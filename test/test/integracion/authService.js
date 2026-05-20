const db = {
  /**
   * Busca un usuario por su email en la base de datos.
   * @param {string} email
   * @returns {Promise<Object|null>}
   */
  async buscarUsuarioPorEmail(email) {

    throw new Error('Conexión real a BD no disponible en tests');
  },
};

/**
 * Lógica de negocio del login.
 * Recibe el email y password, consulta la BD y devuelve el resultado.
 * @param {string} email
 * @param {string} password
 * @returns {Promise<Object>}
 */
async function loginUsuario(email, password) {
  if (!email || !password) {
    return { exito: false, mensaje: 'Email y contraseña son obligatorios' };
  }

  const usuario = await db.buscarUsuarioPorEmail(email);

  if (!usuario) {
    return { exito: false, mensaje: 'Usuario no encontrado' };
  }

  if (usuario.password !== password) {
    return { exito: false, mensaje: 'Contraseña incorrecta' };
  }

  return {
    exito: true,
    mensaje: 'Login exitoso',
    token: `token_${usuario.id}_sgau`,
  };
}

module.exports = { loginUsuario, db };
