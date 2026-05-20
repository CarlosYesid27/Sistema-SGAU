
const db = {
  /**
   * Verifica si el estudiante ya está inscrito en el curso.
   * @param {number} estudianteId
   * @param {number} cursoId
   * @returns {Promise<boolean>}
   */
  async inscripcionExiste(estudianteId, cursoId) {
    throw new Error('Conexión real a BD no disponible en tests');
  },

  /**
   * @param {number} cursoId
   * @returns {Promise<number>}
   */
  async contarInscritos(cursoId) {
    throw new Error('Conexión real a BD no disponible en tests');
  },

  /**
   * Guarda la inscripción del estudiante en el curso.
   * @param {number} estudianteId
   * @param {number} cursoId
   * @returns {Promise<Object>}
   */
  async guardarInscripcion(estudianteId, cursoId) {
    throw new Error('Conexión real a BD no disponible en tests');
  },
};

/**
 * Lógica de negocio para inscribir un estudiante en un curso.
 * @param {number} estudianteId
 * @param {number} cursoId
 * @param {number} cupoMaximo
 * @returns {Promise<Object>}
 */
async function inscribirEstudiante(estudianteId, cursoId, cupoMaximo) {
  if (!estudianteId || !cursoId) {
    return { codigo: 400, exito: false, mensaje: 'Estudiante y curso son obligatorios' };
  }

  // Verificar si ya está inscrito
  const yaInscrito = await db.inscripcionExiste(estudianteId, cursoId);
  if (yaInscrito) {
    return { codigo: 409, exito: false, mensaje: 'El estudiante ya está inscrito en este curso' };
  }

  // Verificar si hay cupo disponible
  const inscritos = await db.contarInscritos(cursoId);
  if (inscritos >= cupoMaximo) {
    return { codigo: 403, exito: false, mensaje: 'El curso no tiene cupos disponibles' };
  }

  const inscripcion = await db.guardarInscripcion(estudianteId, cursoId);

  return {
    codigo: 201,
    exito: true,
    mensaje: 'Inscripción realizada exitosamente',
    inscripcion,
  };
}

module.exports = { inscribirEstudiante, db };
