// Trilha circular de 52 casas (0..51). Cada cor tem uma casa de saída.
// O progresso de uma peça é contado em "passos" a partir da sua casa de saída:
//   -1        => base
//   0..50     => trilha (51 casas percorridas)
//   51..55    => reta final da cor (5 casas, ninguém mais entra)
//   56        => chegada
const TOTAL_CASAS = 52;
const CORES = ['vermelho', 'amarelo'];
const CASA_DE_SAIDA = { vermelho: 0, amarelo: 26 };
// Casas de saída das 4 cores do tabuleiro + estrelas: ninguém é capturado nelas
const CASAS_SEGURAS = [0, 8, 13, 21, 26, 34, 39, 47];

const BASE = -1;
const ULTIMO_PASSO_NA_TRILHA = 50;
const CHEGADA = 56;
const PECAS_POR_COR = 4;

function validarCor(cor) {
  if (!CORES.includes(cor)) throw new RangeError(`Cor inválida: ${cor}`);
}

const adversaria = (cor) => (cor === 'vermelho' ? 'amarelo' : 'vermelho');

const ehSegura = (casa) => CASAS_SEGURAS.includes(casa);

// Casa da trilha (0..51) em que a peça está, ou null se estiver fora da trilha
function casaNaTrilha(cor, passos) {
  validarCor(cor);
  if (passos < 0 || passos > ULTIMO_PASSO_NA_TRILHA) return null;
  return (CASA_DE_SAIDA[cor] + passos) % TOTAL_CASAS;
}

// { zona: 'base' | 'trilha' | 'reta' | 'chegada', casa }
function localizar(cor, passos) {
  validarCor(cor);
  if (passos === BASE) return { zona: 'base', casa: null };
  if (passos <= ULTIMO_PASSO_NA_TRILHA) return { zona: 'trilha', casa: casaNaTrilha(cor, passos) };
  if (passos < CHEGADA) return { zona: 'reta', casa: passos - ULTIMO_PASSO_NA_TRILHA };
  return { zona: 'chegada', casa: null };
}

module.exports = {
  TOTAL_CASAS,
  CORES,
  CASA_DE_SAIDA,
  CASAS_SEGURAS,
  BASE,
  ULTIMO_PASSO_NA_TRILHA,
  CHEGADA,
  PECAS_POR_COR,
  validarCor,
  adversaria,
  ehSegura,
  casaNaTrilha,
  localizar,
};
