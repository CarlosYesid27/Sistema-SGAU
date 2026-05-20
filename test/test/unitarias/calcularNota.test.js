
const { calcularPromedioPonderado, resolverEstado, PASS_THRESHOLD } = require('./calcularNota');

// ─── calcularPromedioPonderado ────────────────────────────────────────────────

describe('calcularPromedioPonderado', () => {

  test('calcula correctamente el promedio ponderado con todas las notas', () => {

    const resultado = calcularPromedioPonderado(4.0, 3.5, 4.5);
    expect(resultado).toBe(4.05);
  });

  test('devuelve null si el primer parcial no ha sido registrado', () => {
    expect(calcularPromedioPonderado(null, 3.5, 4.0)).toBeNull();
  });

  test('devuelve null si el segundo parcial no ha sido registrado', () => {
    expect(calcularPromedioPonderado(4.0, null, 4.0)).toBeNull();
  });

  test('devuelve null si el examen final no ha sido registrado', () => {
    expect(calcularPromedioPonderado(4.0, 3.5, null)).toBeNull();
  });

  test('promedio máximo: 5.0 en todas las notas = 5.0', () => {
    expect(calcularPromedioPonderado(5.0, 5.0, 5.0)).toBe(5.0);
  });

  test('promedio mínimo: 0.0 en todas las notas = 0.0', () => {
    expect(calcularPromedioPonderado(0.0, 0.0, 0.0)).toBe(0.0);
  });

  test('resultado está redondeado a 2 decimales', () => {
    const resultado = calcularPromedioPonderado(3.1, 2.9, 3.0);
    expect(resultado).toBe(3.0);
  });

});



describe('resolverEstado', () => {

  test('devuelve IN_PROGRESS cuando el promedio es null', () => {
    expect(resolverEstado(null)).toBe('IN_PROGRESS');
  });

  test('devuelve PASSED cuando el promedio es igual a la nota mínima (3.0)', () => {
    expect(resolverEstado(PASS_THRESHOLD)).toBe('PASSED');
  });

  test('devuelve PASSED cuando el promedio es mayor a 3.0', () => {
    expect(resolverEstado(4.5)).toBe('PASSED');
  });

  test('devuelve FAILED cuando el promedio es menor a 3.0', () => {
    expect(resolverEstado(2.9)).toBe('FAILED');
  });

  test('devuelve FAILED cuando el promedio es 0.0', () => {
    expect(resolverEstado(0.0)).toBe('FAILED');
  });

});


describe('flujo completo: calcular promedio y resolver estado', () => {

  test('estudiante que aprueba con notas regulares', () => {
    const promedio = calcularPromedioPonderado(3.2, 3.5, 3.8);
    expect(resolverEstado(promedio)).toBe('PASSED');
  });

  test('estudiante que reprueba con notas bajas', () => {
    const promedio = calcularPromedioPonderado(1.5, 2.0, 2.5);
    expect(resolverEstado(promedio)).toBe('FAILED');
  });

  test('notas incompletas → estado debe ser IN_PROGRESS', () => {
    const promedio = calcularPromedioPonderado(4.0, null, 3.5);
    expect(resolverEstado(promedio)).toBe('IN_PROGRESS');
  });

});
