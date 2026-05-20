const { validarCupo, hayCupoDisponible } = require('./validarCupo');

describe('Course Service - Unidad: validarCupo', () => {
  test('debe validar el cupo y la disponibilidad de estudiantes en un curso', () => {
    // Validar formato de cupo
    expect(validarCupo(20)).toBe(true);
    expect(validarCupo(-1)).toBe(false);
    expect(validarCupo(15.5)).toBe(false);

    // Validar disponibilidad
    expect(hayCupoDisponible(30, 10)).toBe(true);
    expect(hayCupoDisponible(30, 30)).toBe(false);
  });
});
