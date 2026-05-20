const { validarMonto } = require('./validarMonto');

describe('Payment Service - Unidad: validarMonto', () => {
  test('debe validar que el monto sea un número positivo mayor a cero', () => {
    expect(validarMonto(5000)).toBe(true);
    expect(validarMonto(0)).toBe(false);
    expect(validarMonto(-100)).toBe(false);
    expect(validarMonto('texto')).toBe(false);
  });
});
