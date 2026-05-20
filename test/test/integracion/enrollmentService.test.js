const { inscribirEstudiante, db } = require('./enrollmentService');

describe('Enrollment Service - Integración: Inscripción', () => {
  beforeEach(() => {
    db.inscripcionExiste = jest.fn();
    db.contarInscritos = jest.fn();
    db.guardarInscripcion = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('debe inscribir estudiantes validando cupo y registros previos', async () => {
    db.inscripcionExiste.mockResolvedValue(false);
    db.contarInscritos.mockResolvedValue(10);
    db.guardarInscripcion.mockResolvedValue({ id: 1, estudianteId: 1, cursoId: 1 });
    
    const res = await inscribirEstudiante(1, 1, 30);
    expect(res.codigo).toBe(201);

    db.inscripcionExiste.mockResolvedValue(true);
    const res2 = await inscribirEstudiante(1, 1, 30);
    expect(res2.codigo).toBe(409);

    db.inscripcionExiste.mockResolvedValue(false);
    db.contarInscritos.mockResolvedValue(30);
    const res3 = await inscribirEstudiante(1, 1, 30);
    expect(res3.codigo).toBe(403);

    
    const res4 = await inscribirEstudiante(null, null, 30);
    expect(res4.codigo).toBe(400);
  });
});
