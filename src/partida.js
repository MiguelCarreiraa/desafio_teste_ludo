const { validarValorDoDado, criarDado } = require('./dado');
const {
  CORES, BASE, ULTIMO_PASSO_NA_TRILHA, CHEGADA, PECAS_POR_COR,
  validarCor, adversaria, ehSegura, casaNaTrilha, localizar,
} = require('./tabuleiro');

const validoComoPassos = (p) => Number.isInteger(p) && p >= BASE && p <= CHEGADA;

class Partida {
  // dado: função que devolve 1..6 (padrão: aleatório)
  // pecas: { vermelho: [4 passos], amarelo: [4 passos] } para começar de um cenário
  // vez: cor que joga primeiro (padrão: 'vermelho')
  constructor({ dado = criarDado(), pecas, vez = 'vermelho' } = {}) {
    validarCor(vez);
    this.dado = dado;
    this.posicoes = {};
    CORES.forEach((cor) => {
      const lista = pecas ? pecas[cor] : Array(PECAS_POR_COR).fill(BASE);
      if (!Array.isArray(lista) || lista.length !== PECAS_POR_COR || !lista.every(validoComoPassos)) {
        throw new RangeError(`Peças inválidas para ${cor}`);
      }
      this.posicoes[cor] = [...lista];
    });
    this.vez = vez;
    this.valorDoDado = null;
    this.seisSeguidos = 0;
    this.vencedor = null;
    this.estado = 'jogando';
  }

  pecas(cor) {
    validarCor(cor);
    return [...this.posicoes[cor]];
  }

  ondeEsta(cor, indice) {
    validarCor(cor);
    this.validarIndice(indice);
    return localizar(cor, this.posicoes[cor][indice]);
  }

  validarIndice(indice) {
    if (!Number.isInteger(indice) || indice < 0 || indice >= PECAS_POR_COR) {
      throw new RangeError('Peça deve ser 0, 1, 2 ou 3');
    }
  }

  verificarAndamento() {
    if (this.estado === 'encerrada') throw new Error('A partida já terminou');
  }

  // Quantas peças de uma cor estão em uma casa da trilha
  pecasNaCasa(cor, casa) {
    return this.posicoes[cor].filter((p) => casaNaTrilha(cor, p) === casa).length;
  }

  // Barreira: 2 ou mais peças da mesma cor na mesma casa. O adversário não passa nem para nela.
  temBarreira(cor, casa) {
    return this.pecasNaCasa(cor, casa) >= 2;
  }

  podeMover(cor, indice, valor) {
    const passos = this.posicoes[cor][indice];
    const outra = adversaria(cor);
    if (passos === CHEGADA) return false;
    if (passos === BASE) return valor === 6 && !this.temBarreira(outra, casaNaTrilha(cor, 0));
    const destino = passos + valor;
    if (destino > CHEGADA) return false; // precisa do número exato para chegar
    for (let p = passos + 1; p <= Math.min(destino, ULTIMO_PASSO_NA_TRILHA); p++) {
      if (this.temBarreira(outra, casaNaTrilha(cor, p))) return false;
    }
    return true;
  }

  jogadasPossiveis() {
    if (this.valorDoDado === null) return [];
    return [0, 1, 2, 3].filter((i) => this.podeMover(this.vez, i, this.valorDoDado));
  }

  passarVez() {
    this.vez = adversaria(this.vez);
    this.valorDoDado = null;
    this.seisSeguidos = 0;
  }

  rolar() {
    this.verificarAndamento();
    if (this.valorDoDado !== null) throw new Error('Mova uma peça antes de rolar de novo');
    const valor = validarValorDoDado(this.dado());
    this.seisSeguidos = valor === 6 ? this.seisSeguidos + 1 : 0;
    if (this.seisSeguidos === 3) {
      // Três 6 seguidos: perde a vez sem mover
      this.passarVez();
      return valor;
    }
    this.valorDoDado = valor;
    if (this.jogadasPossiveis().length === 0) this.passarVez();
    return valor;
  }

  mover(indice) {
    this.verificarAndamento();
    this.validarIndice(indice);
    if (this.valorDoDado === null) throw new Error('Role o dado antes de mover');
    const cor = this.vez;
    const valor = this.valorDoDado;
    if (!this.podeMover(cor, indice, valor)) throw new Error('Esta peça não pode se mover com esse valor');

    const de = this.posicoes[cor][indice];
    const para = de === BASE ? 0 : de + valor;
    this.posicoes[cor][indice] = para;

    // Captura: cair em casa comum da trilha onde há peça adversária
    const capturadas = [];
    const casa = casaNaTrilha(cor, para);
    if (casa !== null && !ehSegura(casa)) {
      const outra = adversaria(cor);
      this.posicoes[outra].forEach((p, i) => {
        if (casaNaTrilha(outra, p) === casa) {
          this.posicoes[outra][i] = BASE;
          capturadas.push({ cor: outra, peca: i });
        }
      });
    }

    const chegou = para === CHEGADA;
    if (this.posicoes[cor].every((p) => p === CHEGADA)) {
      this.estado = 'encerrada';
      this.vencedor = cor;
      this.vez = null;
      this.valorDoDado = null;
      return { cor, peca: indice, de, para, capturadas, jogaDeNovo: false };
    }

    // Joga de novo quem tirou 6, capturou ou levou uma peça à chegada
    const jogaDeNovo = valor === 6 || capturadas.length > 0 || chegou;
    if (jogaDeNovo) this.valorDoDado = null;
    else this.passarVez();
    return { cor, peca: indice, de, para, capturadas, jogaDeNovo };
  }
}

module.exports = { Partida };
