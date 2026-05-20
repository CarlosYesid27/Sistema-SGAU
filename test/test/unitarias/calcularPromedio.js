/**
 * Calcula el promedio de un arreglo de notas.
 * @param {number[]} notas 
 * @returns {number} 
 */
function calcularPromedio(notas) {
  if (!Array.isArray(notas) || notas.length === 0) {
    console.error('Error: El arreglo de notas está vacío');
    return NaN;
  }
  const suma = notas.reduce((acc, nota) => acc + nota, 0);
  return suma / notas.length;
}

module.exports = { calcularPromedio };
