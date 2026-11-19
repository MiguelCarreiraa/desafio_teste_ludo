// Dado de 6 faces

function validarValorDoDado(valor) {
  if (!Number.isInteger(valor) || valor < 1 || valor > 6) {
    throw new RangeError(`Valor de dado inválido: ${valor}`);
  }
  return valor;
}

// Cria um dado a partir de um gerador de números aleatórios (0 <= rng() < 1)
function criarDado(rng = Math.random) {
  return () => Math.floor(rng() * 6) + 1;
}

module.exports = { validarValorDoDado, criarDado };
