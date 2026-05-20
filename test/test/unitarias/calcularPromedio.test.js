const { calcularPromedio } = require('./calcularPromedio');

describe('Grades Service - Unidad: calcularPromedio', () => {
  // MOCK UNITARIO 1
  test('debe calcular el promedio correctamente y manejar errores si el arreglo está vacío', () => {
    const mockConsola = jest.spyOn(console, 'error').mockImplementation(() => {});
    

    expect(calcularPromedio([80, 100])).toBe(90);
    
    expect(calcularPromedio([70, 80])).toBeGreaterThan(59);

    expect(calcularPromedio([10, 20])).toBeDefined();

    expect(calcularPromedio([])).toBeNaN();
    expect(mockConsola).toHaveBeenCalledWith('Error: El arreglo de notas está vacío');
    
    mockConsola.mockRestore();
  });
});
