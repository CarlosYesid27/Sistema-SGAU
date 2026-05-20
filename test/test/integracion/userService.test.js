const { crearUsuario, db } = require('./userService');

describe('User Service - Integración: Registro', () => {
  beforeEach(() => {
    db.guardarUsuario = jest.fn();
    db.emailExiste = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('PRUEBA CON PROMESA: debe registrar usuarios nuevos verificando duplicados en la base de datos', async () => {
    // Escenario 1: Creación exitosa
    db.emailExiste.mockResolvedValue(false);
    db.guardarUsuario.mockResolvedValue({ id: 10, nombre: 'Ana', email: 'ana@test.com' });
    const res = await crearUsuario({ nombre: 'Ana', email: 'ana@test.com', password: '123' });
    expect(res.codigo).toBe(201);

    // Escenario 2: Email duplicado
    db.emailExiste.mockResolvedValue(true);
    const resError = await crearUsuario({ nombre: 'Ana', email: 'ana@test.com', password: '123' });
    expect(resError.codigo).toBe(409);

    // Escenario 3: Campos faltantes (para subir cobertura)
    const resFaltante = await crearUsuario({ nombre: 'Ana' });
    expect(resFaltante.codigo).toBe(400);
  });
});
