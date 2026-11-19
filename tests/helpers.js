// Gerador pseudoaleatório com semente (Park-Miller): mesma semente => mesma sequência
function rngComSemente(semente) {
  let estado = semente;
  return () => {
    estado = (estado * 16807) % 2147483647;
    return estado / 2147483647;
  };
}

// Dado "viciado": devolve os valores na ordem informada (erro se acabarem)
function dadoViciado(...valores) {
  const fila = [...valores];
  return () => {
    if (fila.length === 0) throw new Error('O dado viciado ficou sem valores');
    return fila.shift();
  };
}

// Atalho para montar as peças: vermelho e amarelo com 4 passos cada (-1 = base, 56 = chegada)
const BASE = [-1, -1, -1, -1];
const pecas = (vermelho = BASE, amarelo = BASE) => ({ vermelho, amarelo });

module.exports = { rngComSemente, dadoViciado, pecas, BASE };
