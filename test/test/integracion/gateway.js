
const RUTAS = {
  '/auth': 'http://auth_backend:8001',
  '/users': 'http://user_backend:8000',
  '/courses': 'http://course_backend:8000',
  '/enrollments': 'http://enrollment_backend:8000',
  '/grades': 'http://grades_backend:8000',
  '/students': 'http://student_backend:8000',
  '/payments': 'http://payment_backend:8000',
  '/reports': 'http://reporting_backend:8000',
};

// Simulamos el cliente HTTP que hace la petición al microservicio
const httpCliente = {
  /**
   * Reenvía la petición al microservicio destino.
   * @param {string} url 
   * @param {string} metodo 
   * @param {Object} body
   * @returns {Promise<Object>}
   */
  async enviar(url, metodo, body) {
    throw new Error('Petición HTTP real no disponible en tests');
  },
};

/**
 * Enruta una petición al microservicio correcto según el path.
 * @param {string} path 
 * @param {string} metodo 
 * @param {Object} body
 * @returns {Promise<Object>} 
 */
async function enrutar(path, metodo, body = {}) {
  if (!path || !metodo) {
    return { codigo: 400, exito: false, mensaje: 'Path y método son obligatorios' };
  }

  const prefijo = Object.keys(RUTAS).find((ruta) => path.startsWith(ruta));

  if (!prefijo) {
    return { codigo: 404, exito: false, mensaje: `Ruta '${path}' no encontrada en el Gateway` };
  }

  const urlDestino = `${RUTAS[prefijo]}${path}`;

  const respuesta = await httpCliente.enviar(urlDestino, metodo, body);

  return {
    codigo: 200,
    exito: true,
    mensaje: `Petición enrutada a ${RUTAS[prefijo]}`,
    destino: RUTAS[prefijo],
    respuesta,
  };
}

module.exports = { enrutar, httpCliente, RUTAS };
