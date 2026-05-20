/**
 */
const db = {
  /**
   * Obtiene todos los cursos disponibles.
   * @returns {Promise<Object[]>}
   */
  async obtenerCursos() {
    throw new Error('Conexión real a BD no disponible en tests');
  },

  /**
   * Guarda un nuevo curso en la base de datos.
   * @param {Object} curso
   * @returns {Promise<Object>}
   */
  async guardarCurso(curso) {
    throw new Error('Conexión real a BD no disponible en tests');
  },
};

/**
 * Obtiene la lista de todos los cursos disponibles.
 * @returns {Promise<Object>}
 */
async function listarCursos() {
  const cursos = await db.obtenerCursos();

  if (!cursos || cursos.length === 0) {
    return { codigo: 204, exito: true, mensaje: 'No hay cursos registrados', cursos: [] };
  }

  return {
    codigo: 200,
    exito: true,
    mensaje: 'Cursos obtenidos exitosamente',
    cursos,
    total: cursos.length,
  };
}

/**
 * Crea un nuevo curso en el sistema.
 * @param {Object} datosCurso
 * @returns {Promise<Object>}
 */
async function crearCurso(datosCurso) {
  const { nombre, descripcion, cupo, docente } = datosCurso || {};

  if (!nombre || !cupo || !docente) {
    return { codigo: 400, exito: false, mensaje: 'Nombre, cupo y docente son obligatorios' };
  }

  if (cupo <= 0 || !Number.isInteger(cupo)) {
    return { codigo: 422, exito: false, mensaje: 'El cupo debe ser un número entero positivo' };
  }

  const cursoGuardado = await db.guardarCurso({ nombre, descripcion, cupo, docente });

  return {
    codigo: 201,
    exito: true,
    mensaje: 'Curso creado exitosamente',
    curso: cursoGuardado,
  };
}

module.exports = { listarCursos, crearCurso, db };
