/**
 * Simula la capa de base de datos del User Service.
 */
const db = {
  /**
   * Guarda un nuevo usuario en la base de datos.
   * @param {Object} usuario - Datos del usuario a guardar
   * @returns {Promise<Object>} El usuario guardado con su ID asignado
   */
  async guardarUsuario(usuario) {
    // En producción: INSERT INTO usuarios (nombre, email, rol) VALUES (...)
    throw new Error('Conexión real a BD no disponible en tests');
  },

  /**
   * Verifica si un email ya está registrado.
   * @param {string} email
   * @returns {Promise<boolean>}
   */
  async emailExiste(email) {
    // En producción: SELECT COUNT(*) FROM usuarios WHERE email = ?
    throw new Error('Conexión real a BD no disponible en tests');
  },
};

/**
 * Lógica de negocio para crear un nuevo usuario.
 * @param {Object} datosUsuario - { nombre, email, password, rol }
 * @returns {Promise<Object>} Resultado de la operación con código de estado
 */
async function crearUsuario(datosUsuario) {
  const { nombre, email, password, rol } = datosUsuario || {};

  // Validar campos obligatorios
  if (!nombre || !email || !password) {
    return { codigo: 400, exito: false, mensaje: 'Faltan campos obligatorios' };
  }

  // Verificar si el email ya existe
  const existe = await db.emailExiste(email);
  if (existe) {
    return { codigo: 409, exito: false, mensaje: 'El email ya está registrado' };
  }

  // Guardar el nuevo usuario
  const usuarioGuardado = await db.guardarUsuario({
    nombre,
    email,
    password,
    rol: rol || 'estudiante',
  });

  return {
    codigo: 201,
    exito: true,
    mensaje: 'Usuario creado exitosamente',
    usuario: usuarioGuardado,
  };
}

module.exports = { crearUsuario, db };
