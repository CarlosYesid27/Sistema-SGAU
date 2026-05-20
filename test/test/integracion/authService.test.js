const { loginUsuario, db } = require('./authService');

describe('Auth Service - Integración: Login', () => {
  beforeEach(() => {
    db.buscarUsuarioPorEmail = jest.fn(); 
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('PRUEBA CON PROMESA: debe procesar el login consultando la base de datos simulada', async () => {
    db.buscarUsuarioPorEmail.mockResolvedValue({ id: 1, email: 'admin@sgau.com', password: '123' });
    const exito = await loginUsuario('admin@sgau.com', '123');
    expect(exito.exito).toBe(true);

    db.buscarUsuarioPorEmail.mockResolvedValue(null);
    const fallo = await loginUsuario('fake@sgau.com', '123');
    expect(fallo.exito).toBe(false);

    db.buscarUsuarioPorEmail.mockResolvedValue({ id: 1, email: 'admin@sgau.com', password: '123' });
    const falloClave = await loginUsuario('admin@sgau.com', 'wrong');
    expect(falloClave.mensaje).toBe('Contraseña incorrecta');

    const falloVacio = await loginUsuario('', '');
    expect(falloVacio.codigo).toBeUndefined();
  });
});
