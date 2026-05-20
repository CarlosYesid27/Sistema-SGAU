const { registrarNota, db } = require('./gradesService');

describe('Grades Service - Integración: Calificaciones', () => {
  beforeEach(() => {
    db.estaInscrito = jest.fn();
    db.guardarNota = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('PRUEBA CON PROMESA: debe registrar notas asegurando que el estudiante esté inscrito', async () => {
    // Caso 1: Éxito
    db.estaInscrito.mockResolvedValue(true);
    db.guardarNota.mockResolvedValue({ id: 1, valor: 85 });
    const res = await registrarNota(1, 1, 85);
    expect(res.codigo).toBe(201);

    // Caso 2: Nota inválida (para subir cobertura)
    const resErr = await registrarNota(1, 1, 150);
    expect(resErr.codigo).toBe(422);

    // Caso 3: No inscrito (para subir cobertura)
    db.estaInscrito.mockResolvedValue(false);
    const resNoInsc = await registrarNota(1, 1, 80);
    expect(resNoInsc.codigo).toBe(403);

    // Caso 4: Campos faltantes (para subir cobertura > 80%)
    const resFaltante = await registrarNota(null, null, null);
    expect(resFaltante.codigo).toBe(400);
  });
});
