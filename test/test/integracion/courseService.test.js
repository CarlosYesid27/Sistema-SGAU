const { listarCursos, crearCurso, db } = require('./courseService');

describe('Course Service - Integración: Cursos', () => {
  beforeEach(() => {
    db.obtenerCursos = jest.fn();
    db.guardarCurso = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('PRUEBA CON PROMESA: debe listar y crear cursos interactuando con la base de datos', async () => {
    // Listar
    db.obtenerCursos.mockResolvedValue([{ id: 1, nombre: 'Cálculo' }]);
    const resList = await listarCursos();
    expect(resList.cursos).toHaveLength(1);

    // Crear Exitoso
    db.guardarCurso.mockResolvedValue({ id: 2, nombre: 'Física' });
    const resCreate = await crearCurso({ nombre: 'Física', cupo: 20, docente: 'Prof. X' });
    expect(resCreate.codigo).toBe(201);

    // Errores (para subir cobertura)
    const resErr1 = await crearCurso({ nombre: 'Error' }); // falta cupo/docente
    expect(resErr1.codigo).toBe(400);

    const resErr2 = await crearCurso({ nombre: 'Error', cupo: -5, docente: 'X' });
    expect(resErr2.codigo).toBe(422);
  });
});
