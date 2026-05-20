const { enrutar, httpCliente, RUTAS } = require('./gateway');

describe('Gateway - Integración: enrutar()', () => {


  beforeEach(() => {
    httpCliente.enviar = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('enruta correctamente /auth/login al Auth Service', async () => {
    httpCliente.enviar.mockResolvedValue({ token: 'abc123', exito: true });

    const resultado = await enrutar('/auth/login', 'POST', {
      email: 'admin@sgau.com',
      password: 'clave123',
    });

    expect(resultado.codigo).toBe(200);
    expect(resultado.destino).toBe('http://auth_backend:8001');
    expect(resultado.exito).toBe(true);
    expect(httpCliente.enviar).toHaveBeenCalledTimes(1);
  });

  test('enruta correctamente /courses al Course Service', async () => {
    httpCliente.enviar.mockResolvedValue([
      { id: 1, nombre: 'Cálculo I' },
      { id: 2, nombre: 'Programación I' },
    ]);

    const resultado = await enrutar('/courses', 'GET');

    expect(resultado.codigo).toBe(200);
    expect(resultado.destino).toBe('http://course_backend:8000');
    expect(resultado.respuesta).toHaveLength(2);
  });


  test('retorna código 404 para una ruta que no existe en el Gateway', async () => {
    const resultado = await enrutar('/ruta-inexistente', 'GET');

    expect(resultado.codigo).toBe(404);
    expect(resultado.exito).toBe(false);
    expect(resultado.mensaje).toContain('no encontrada en el Gateway'); 
    // No debe intentar hacer ninguna petición HTTP
    expect(httpCliente.enviar).not.toHaveBeenCalled();
  });

  // Test 4: Verificar que el Gateway conoce todas las rutas del kong.yml
  test('el Gateway tiene registradas las 8 rutas definidas en kong.yml', () => {
    const rutasRegistradas = Object.keys(RUTAS);

    expect(rutasRegistradas).toContain('/auth');
    expect(rutasRegistradas).toContain('/users');
    expect(rutasRegistradas).toContain('/courses');
    expect(rutasRegistradas).toContain('/enrollments');
    expect(rutasRegistradas).toContain('/grades');
    expect(rutasRegistradas).toContain('/students');
    expect(rutasRegistradas).toContain('/payments');
    expect(rutasRegistradas).toContain('/reports');
    expect(rutasRegistradas).toHaveLength(8);
  });

});
