const { validarEmail } = require('./validarEmail');

describe('Auth Service - Unidad: validarEmail', () => {
  test('debe validar correctamente distintos formatos de correo electrónico', () => {
    expect(validarEmail('test@sgau.com')).toBe(true);
    expect(validarEmail('sinArroba')).toBe(false);
    expect(validarEmail('')).toBe(false);
    
    const correos = ['a@b.com', 'invalido'];
    expect(correos.map(validarEmail)).toEqual([true, false]);
  });
});
