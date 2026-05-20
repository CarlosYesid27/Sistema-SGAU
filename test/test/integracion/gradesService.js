/**
 * Simula la capa de base de datos del Grades Service.
 */
const db = {
  /**
   * Verifica si el estudiante está inscrito en el curso.
   * @param {number} estudianteId
   * @param {number} cursoId
   * @returns {Promise<boolean>}
   */
  async estaInscrito(estudianteId, cursoId) {
    throw new Error('Conexión real a BD no disponible en tests');
  },

  /**
   * Guarda la nota del estudiante en la base de datos.
   * @param {Object} nota - { estudianteId, cursoId, valor }
   * @returns {Promise<Object>}
   */
  async guardarNota(nota) {
    throw new Error('Conexión real a BD no disponible en tests');
  },

  /**
   * Consulta todas las notas de un estudiante en un curso.
   * @param {number} estudianteId
   * @param {number} cursoId
   * @returns {Promise<number[]>}
   */
  async obtenerNotas(estudianteId, cursoId) {
    throw new Error('Conexión real a BD no disponible en tests');
  },
};

/**
 * Guarda una nota para un estudiante en un curso específico.
 * @param {number} estudianteId
 * @param {number} cursoId
 * @param {number} valor - Nota entre 0 y 100
 * @returns {Promise<Object>}
 */
async function registrarNota(estudianteId, cursoId, valor) {
  if (!estudianteId || !cursoId || valor === undefined || valor === null) {
    return { codigo: 400, exito: false, mensaje: 'Faltan datos obligatorios' };
  }

  if (valor < 0 || valor > 100) {
    return { codigo: 422, exito: false, mensaje: 'La nota debe estar entre 0 y 100' };
  }

  // Verificar que el estudiante esté inscrito en el curso
  const inscrito = await db.estaInscrito(estudianteId, cursoId);
  if (!inscrito) {
    return { codigo: 403, exito: false, mensaje: 'El estudiante no está inscrito en este curso' };
  }

  // Guardar la nota
  const notaGuardada = await db.guardarNota({ estudianteId, cursoId, valor });

  return {
    codigo: 201,
    exito: true,
    mensaje: 'Nota registrada exitosamente',
    nota: notaGuardada,
  };
}

module.exports = { registrarNota, db };
