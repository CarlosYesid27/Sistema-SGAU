const { esAdmin, obtenerNombreCompleto } = require('./verificarPermisos');

describe('User Service - Unidad: verificarPermisos', () => {
  test('debe verificar el rol de administrador y el nombre completo del usuario', () => {
    // Verificar Admin
    expect(esAdmin({ rol: 'admin', activo: true })).toBe(true);
    expect(esAdmin({ rol: 'estudiante', activo: true })).toBe(false);

    // Verificar Nombre Completo
    const usuario = { nombre: 'Carlos', apellido: 'Pérez' };
    expect(obtenerNombreCompleto(usuario)).toBe('Carlos Pérez');
  });
});
