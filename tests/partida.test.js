const { Partida } = require('../src/partida');
const { criarDado } = require('../src/dado');
const { casaNaTrilha, ehSegura } = require('../src/tabuleiro');
const { rngComSemente, dadoViciado, pecas, BASE } = require('./helpers');

// Lembrete: vermelho com N passos está na casa N; amarelo com N passos está na casa (26 + N) % 52

describe('Partida - início', () => {
  test('cada cor começa com as 4 peças na base e o vermelho joga primeiro', () => {
    const partida = new Partida();
    expect(partida.pecas('vermelho')).toEqual(BASE);
    expect(partida.pecas('amarelo')).toEqual(BASE);
    expect(partida.vez).toBe('vermelho');
    expect(partida.estado).toBe('jogando');
    expect(partida.vencedor).toBeNull();
    expect(partida.valorDoDado).toBeNull();
  });

  test('pode começar de um cenário (peças e vez informadas)', () => {
    const partida = new Partida({ pecas: pecas([10, -1, -1, 56], [0, 0, -1, 51]), vez: 'amarelo' });
    expect(partida.pecas('vermelho')).toEqual([10, -1, -1, 56]);
    expect(partida.ondeEsta('amarelo', 3)).toEqual({ zona: 'reta', casa: 1 });
    expect(partida.vez).toBe('amarelo');
  });

  test('pecas() devolve uma cópia', () => {
    const partida = new Partida();
    partida.pecas('vermelho')[0] = 50;
    expect(partida.pecas('vermelho')[0]).toBe(-1);
  });

  test.each([
    ['3 peças', pecas([-1, -1, -1])],
    ['passos acima da chegada', pecas([57, -1, -1, -1])],
    ['passos abaixo da base', pecas([-2, -1, -1, -1])],
    ['valor que não é número', pecas(['x', -1, -1, -1])],
  ])('rejeita cenário inválido: %s', (_nome, cenario) => {
    expect(() => new Partida({ pecas: cenario })).toThrow(RangeError);
  });

  test('rejeita cor inválida na vez, em pecas() e em ondeEsta()', () => {
    expect(() => new Partida({ vez: 'azul' })).toThrow(RangeError);
    expect(() => new Partida().pecas('azul')).toThrow(RangeError);
    expect(() => new Partida().ondeEsta('vermelho', 4)).toThrow(RangeError);
  });
});

describe('Partida - dado', () => {
  test('rolar devolve o valor do dado e o guarda em valorDoDado', () => {
    const partida = new Partida({ dado: dadoViciado(6) });
    expect(partida.rolar()).toBe(6);
    expect(partida.valorDoDado).toBe(6);
  });

  test('não é possível rolar de novo antes de mover', () => {
    const partida = new Partida({ dado: dadoViciado(6, 6) });
    partida.rolar();
    expect(() => partida.rolar()).toThrow();
  });

  test('não é possível mover sem rolar', () => {
    expect(() => new Partida().mover(0)).toThrow();
  });

  test('um dado que devolve valor inválido gera RangeError', () => {
    expect(() => new Partida({ dado: () => 7 }).rolar()).toThrow(RangeError);
  });
});

describe('Partida - sair da base', () => {
  test('sem 6 e com todas as peças na base, a vez passa', () => {
    const partida = new Partida({ dado: dadoViciado(3) });
    partida.rolar();
    expect(partida.vez).toBe('amarelo');
    expect(partida.valorDoDado).toBeNull();
  });

  test('com 6, qualquer peça da base pode sair', () => {
    const partida = new Partida({ dado: dadoViciado(6) });
    partida.rolar();
    expect(partida.jogadasPossiveis()).toEqual([0, 1, 2, 3]);
  });

  test('o vermelho sai na casa 0', () => {
    const partida = new Partida({ dado: dadoViciado(6) });
    partida.rolar();
    expect(partida.mover(2)).toEqual({
      cor: 'vermelho', peca: 2, de: -1, para: 0, capturadas: [], jogaDeNovo: true,
    });
    expect(partida.ondeEsta('vermelho', 2)).toEqual({ zona: 'trilha', casa: 0 });
  });

  test('o amarelo sai na casa 26', () => {
    const partida = new Partida({ dado: dadoViciado(6), vez: 'amarelo' });
    partida.rolar();
    partida.mover(0);
    expect(partida.ondeEsta('amarelo', 0)).toEqual({ zona: 'trilha', casa: 26 });
  });

  test('sem 6, só as peças que já estão na trilha podem andar', () => {
    const partida = new Partida({ dado: dadoViciado(4), pecas: pecas([-1, 7, -1, -1]) });
    partida.rolar();
    expect(partida.jogadasPossiveis()).toEqual([1]);
    expect(() => partida.mover(0)).toThrow();
  });
});

describe('Partida - andar pela trilha', () => {
  test('a peça anda o valor do dado e a vez passa', () => {
    const partida = new Partida({ dado: dadoViciado(3), pecas: pecas([5, -1, -1, -1]) });
    partida.rolar();
    expect(partida.mover(0)).toEqual(expect.objectContaining({ de: 5, para: 8, jogaDeNovo: false }));
    expect(partida.vez).toBe('amarelo');
  });

  test('o jogador escolhe qual peça mover', () => {
    const partida = new Partida({ dado: dadoViciado(2), pecas: pecas([5, 10, -1, -1]) });
    partida.rolar();
    expect(partida.jogadasPossiveis()).toEqual([0, 1]);
    partida.mover(1);
    expect(partida.pecas('vermelho')).toEqual([5, 12, -1, -1]);
  });

  test('o amarelo dá a volta no tabuleiro (casa 50 -> casa 1)', () => {
    const partida = new Partida({ dado: dadoViciado(3), pecas: pecas(BASE, [24, -1, -1, -1]), vez: 'amarelo' });
    expect(partida.ondeEsta('amarelo', 0).casa).toBe(50);
    partida.rolar();
    partida.mover(0);
    expect(partida.ondeEsta('amarelo', 0)).toEqual({ zona: 'trilha', casa: 1 });
  });

  test('peças da mesma cor podem ficar na mesma casa', () => {
    const partida = new Partida({ dado: dadoViciado(2), pecas: pecas([10, 12, -1, -1]) });
    partida.rolar();
    expect(partida.mover(0).capturadas).toEqual([]);
    expect(partida.pecas('vermelho')).toEqual([12, 12, -1, -1]);
  });

  test('rejeita índice de peça inválido', () => {
    const partida = new Partida({ dado: dadoViciado(6) });
    partida.rolar();
    expect(() => partida.mover(4)).toThrow(RangeError);
    expect(() => partida.mover(-1)).toThrow(RangeError);
  });
});

describe('Partida - captura', () => {
  test('cair na casa de uma peça adversária a manda de volta para a base e dá nova jogada', () => {
    // vermelho na casa 10; amarelo na casa 12 (38 passos)
    const partida = new Partida({ dado: dadoViciado(2), pecas: pecas([10, -1, -1, -1], [38, -1, -1, -1]) });
    partida.rolar();
    expect(partida.mover(0)).toEqual({
      cor: 'vermelho', peca: 0, de: 10, para: 12, capturadas: [{ cor: 'amarelo', peca: 0 }], jogaDeNovo: true,
    });
    expect(partida.pecas('amarelo')).toEqual(BASE);
    expect(partida.vez).toBe('vermelho');
  });

  test('o amarelo também captura o vermelho', () => {
    // amarelo na casa 28 (2 passos); vermelho na casa 30
    const partida = new Partida({
      dado: dadoViciado(2), pecas: pecas([30, -1, -1, -1], [2, -1, -1, -1]), vez: 'amarelo',
    });
    partida.rolar();
    expect(partida.mover(0).capturadas).toEqual([{ cor: 'vermelho', peca: 0 }]);
    expect(partida.pecas('vermelho')).toEqual(BASE);
  });

  test.each([8, 13, 21, 34, 39, 47])('na casa segura %i não há captura: as peças dividem a casa', (casa) => {
    // amarelo parado na casa segura; vermelho chega nela com um 2
    const passosAmarelo = (casa - 26 + 52) % 52;
    const partida = new Partida({
      dado: dadoViciado(2), pecas: pecas([casa - 2, -1, -1, -1], [passosAmarelo, -1, -1, -1]),
    });
    expect(ehSegura(casa)).toBe(true);
    partida.rolar();
    expect(partida.mover(0).capturadas).toEqual([]);
    expect(casaNaTrilha('amarelo', partida.pecas('amarelo')[0])).toBe(casa);
  });

  test('sair da base em cima de uma peça adversária (casa de saída é segura) não captura', () => {
    // amarelo na casa 0 (26 passos)
    const partida = new Partida({ dado: dadoViciado(6), pecas: pecas(BASE, [26, -1, -1, -1]) });
    partida.rolar();
    expect(partida.mover(0).capturadas).toEqual([]);
    expect(partida.pecas('amarelo')[0]).toBe(26);
  });
});

describe('Partida - barreira (duas peças da mesma cor na mesma casa)', () => {
  // amarelo com duas peças na casa 14 (40 passos)
  const comBarreira = (dado) => new Partida({
    dado: dadoViciado(dado), pecas: pecas([12, -1, -1, -1], [40, 40, -1, -1]),
  });

  test('o adversário não pode passar pela barreira', () => {
    const partida = comBarreira(3); // 12 -> 15 passaria pela casa 14
    partida.rolar();
    expect(partida.jogadasPossiveis()).toEqual([]);
    expect(partida.vez).toBe('amarelo'); // sem jogada, a vez passou
  });

  test('o adversário não pode parar na barreira', () => {
    const partida = comBarreira(2);
    partida.rolar();
    expect(partida.vez).toBe('amarelo');
    expect(partida.pecas('vermelho')[0]).toBe(12);
  });

  test('pode andar até a casa antes da barreira', () => {
    const partida = comBarreira(1);
    partida.rolar();
    expect(partida.jogadasPossiveis()).toEqual([0]);
  });

  test('a barreira na casa de saída impede sair da base', () => {
    // amarelo com duas peças na casa 0 (26 passos)
    const partida = new Partida({ dado: dadoViciado(6), pecas: pecas(BASE, [26, 26, -1, -1]) });
    partida.rolar();
    expect(partida.vez).toBe('amarelo');
  });

  test('a própria barreira não bloqueia as peças da mesma cor', () => {
    const partida = new Partida({ dado: dadoViciado(3), pecas: pecas([10, 12, 12, -1]) });
    partida.rolar();
    expect(partida.jogadasPossiveis()).toEqual([0, 1, 2]);
    partida.mover(0);
    expect(partida.pecas('vermelho')[0]).toBe(13);
  });
});

describe('Partida - reta final e chegada', () => {
  test('depois da casa 50 a peça entra na reta final da sua cor', () => {
    const partida = new Partida({ dado: dadoViciado(3), pecas: pecas([49, -1, -1, -1]) });
    partida.rolar();
    partida.mover(0);
    expect(partida.ondeEsta('vermelho', 0)).toEqual({ zona: 'reta', casa: 2 });
  });

  test('o amarelo entra na reta final depois da casa 24', () => {
    const partida = new Partida({ dado: dadoViciado(1), pecas: pecas(BASE, [50, -1, -1, -1]), vez: 'amarelo' });
    expect(partida.ondeEsta('amarelo', 0)).toEqual({ zona: 'trilha', casa: 24 });
    partida.rolar();
    partida.mover(0);
    expect(partida.ondeEsta('amarelo', 0)).toEqual({ zona: 'reta', casa: 1 });
  });

  test('na reta final a peça não pode ser capturada', () => {
    // vermelho na reta (52); amarelo na casa 50 da trilha não alcança a reta do vermelho
    const partida = new Partida({
      dado: dadoViciado(2), pecas: pecas([52, -1, -1, -1], [22, -1, -1, -1]), vez: 'amarelo',
    });
    partida.rolar();
    partida.mover(0);
    expect(partida.pecas('vermelho')[0]).toBe(52);
  });

  test('chegar exige o número exato e dá nova jogada', () => {
    const partida = new Partida({ dado: dadoViciado(3), pecas: pecas([53, 10, -1, -1]) });
    partida.rolar();
    expect(partida.mover(0)).toEqual(expect.objectContaining({ para: 56, jogaDeNovo: true }));
    expect(partida.ondeEsta('vermelho', 0)).toEqual({ zona: 'chegada', casa: null });
    expect(partida.vez).toBe('vermelho');
  });

  test('com valor maior que o necessário a peça não se move', () => {
    const partida = new Partida({ dado: dadoViciado(4), pecas: pecas([53, 10, -1, -1]) });
    partida.rolar();
    expect(partida.jogadasPossiveis()).toEqual([1]);
  });

  test('se nenhuma peça pode se mover, a vez passa', () => {
    const partida = new Partida({ dado: dadoViciado(5), pecas: pecas([53, 56, -1, -1]) });
    partida.rolar();
    expect(partida.vez).toBe('amarelo');
  });

  test('uma peça que chegou não se move mais', () => {
    const partida = new Partida({ dado: dadoViciado(2), pecas: pecas([56, 10, -1, -1]) });
    partida.rolar();
    expect(partida.jogadasPossiveis()).toEqual([1]);
  });
});

describe('Partida - jogar de novo e três 6 seguidos', () => {
  test('tirar 6 dá nova jogada', () => {
    const partida = new Partida({ dado: dadoViciado(6), pecas: pecas([10, -1, -1, -1]) });
    partida.rolar();
    expect(partida.mover(0).jogaDeNovo).toBe(true);
    expect(partida.vez).toBe('vermelho');
    expect(partida.valorDoDado).toBeNull();
  });

  test('o terceiro 6 seguido faz perder a vez, sem mover', () => {
    const partida = new Partida({ dado: dadoViciado(6, 6, 6), pecas: pecas([10, -1, -1, -1]) });
    partida.rolar();
    partida.mover(0); // 16
    partida.rolar();
    partida.mover(0); // 22
    partida.rolar(); // terceiro 6
    expect(partida.vez).toBe('amarelo');
    expect(partida.valorDoDado).toBeNull();
    expect(partida.pecas('vermelho')[0]).toBe(22);
  });

  test('a contagem de 6 seguidos zera quando sai outro número', () => {
    const partida = new Partida({ dado: dadoViciado(6, 2, 6), pecas: pecas([10, -1, -1, -1], [5, -1, -1, -1]) });
    partida.rolar();
    partida.mover(0); // 6: joga de novo
    partida.rolar();
    partida.mover(0); // 2: passa a vez
    expect(partida.vez).toBe('amarelo');
    partida.rolar();
    expect(partida.valorDoDado).toBe(6); // o amarelo tem seu próprio 1º seis
  });
});

describe('Partida - fim', () => {
  test('o vermelho vence ao levar as 4 peças para a chegada', () => {
    const partida = new Partida({ dado: dadoViciado(3), pecas: pecas([56, 56, 56, 53]) });
    partida.rolar();
    expect(partida.mover(3).jogaDeNovo).toBe(false);
    expect(partida.estado).toBe('encerrada');
    expect(partida.vencedor).toBe('vermelho');
    expect(partida.vez).toBeNull();
  });

  test('o amarelo também pode vencer', () => {
    const partida = new Partida({ dado: dadoViciado(1), pecas: pecas(BASE, [55, 56, 56, 56]), vez: 'amarelo' });
    partida.rolar();
    partida.mover(0);
    expect(partida.vencedor).toBe('amarelo');
  });

  test('com 3 peças na chegada a partida continua', () => {
    const partida = new Partida({ dado: dadoViciado(1), pecas: pecas([56, 56, 56, 40]) });
    partida.rolar();
    partida.mover(3);
    expect(partida.estado).toBe('jogando');
  });

  test('depois do fim não se rola nem se move', () => {
    const partida = new Partida({ dado: dadoViciado(3, 6), pecas: pecas([56, 56, 56, 53]) });
    partida.rolar();
    partida.mover(3);
    expect(() => partida.rolar()).toThrow(/terminou/);
    expect(() => partida.mover(0)).toThrow(/terminou/);
  });
});

describe('Partida - partidas completas com dado aleatório', () => {
  function jogarAteOFim(semente, aoMover = () => {}) {
    const rng = rngComSemente(semente);
    const partida = new Partida({ dado: criarDado(rng) });
    for (let lance = 0; lance < 20000 && partida.estado === 'jogando'; lance++) {
      partida.rolar();
      const opcoes = partida.jogadasPossiveis();
      if (opcoes.length > 0) {
        partida.mover(opcoes[Math.floor(rng() * opcoes.length)]);
        aoMover(partida);
      }
    }
    return partida;
  }

  test('30 partidas terminam com um vencedor com as 4 peças na chegada', () => {
    for (let semente = 1; semente <= 30; semente++) {
      const partida = jogarAteOFim(semente);
      expect(partida.estado).toBe('encerrada');
      expect(partida.pecas(partida.vencedor)).toEqual([56, 56, 56, 56]);
    }
  });

  test('a cada lance, fora das casas seguras nunca há peças de cores diferentes na mesma casa', () => {
    for (let semente = 1; semente <= 10; semente++) {
      jogarAteOFim(semente, (partida) => {
        const vermelhas = partida.pecas('vermelho').map((p) => casaNaTrilha('vermelho', p));
        const amarelas = partida.pecas('amarelo').map((p) => casaNaTrilha('amarelo', p));
        vermelhas.forEach((casa) => {
          if (casa !== null && !ehSegura(casa)) expect(amarelas).not.toContain(casa);
        });
      });
    }
  });

  test('a mesma semente gera a mesma partida', () => {
    const a = jogarAteOFim(7);
    const b = jogarAteOFim(7);
    expect(a.vencedor).toBe(b.vencedor);
    expect(a.pecas('vermelho')).toEqual(b.pecas('vermelho'));
    expect(a.pecas('amarelo')).toEqual(b.pecas('amarelo'));
  });
});
