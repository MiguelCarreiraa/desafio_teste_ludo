const {
  TOTAL_CASAS, CORES, CASA_DE_SAIDA, CASAS_SEGURAS, BASE, CHEGADA, PECAS_POR_COR,
  validarCor, adversaria, ehSegura, casaNaTrilha, localizar,
} = require('../src/tabuleiro');

describe('Constantes do tabuleiro (2 jogadores)', () => {
  test('trilha de 52 casas, 2 cores com 4 peças cada', () => {
    expect(TOTAL_CASAS).toBe(52);
    expect(CORES).toEqual(['vermelho', 'amarelo']);
    expect(PECAS_POR_COR).toBe(4);
  });

  test('as duas cores saem de lados opostos do tabuleiro (casas 0 e 26)', () => {
    expect(CASA_DE_SAIDA).toEqual({ vermelho: 0, amarelo: 26 });
  });

  test('base = -1 e chegada = 56 passos', () => {
    expect(BASE).toBe(-1);
    expect(CHEGADA).toBe(56);
  });

  test('casas seguras: as 4 saídas do tabuleiro e as 4 estrelas', () => {
    expect(CASAS_SEGURAS).toEqual([0, 8, 13, 21, 26, 34, 39, 47]);
    expect(ehSegura(13)).toBe(true);
    expect(ehSegura(12)).toBe(false);
  });
});

describe('Cores', () => {
  test('a adversária do vermelho é o amarelo e vice-versa', () => {
    expect(adversaria('vermelho')).toBe('amarelo');
    expect(adversaria('amarelo')).toBe('vermelho');
  });

  test.each(['azul', 'Vermelho', '', undefined])('rejeita a cor %p', (cor) => {
    expect(() => validarCor(cor)).toThrow(RangeError);
  });
});

describe('casaNaTrilha (passos da peça => casa 0..51)', () => {
  test.each([
    ['vermelho', 0, 0],
    ['vermelho', 50, 50],
    ['amarelo', 0, 26],
    ['amarelo', 25, 51],
    ['amarelo', 26, 0], // o amarelo dá a volta no tabuleiro
    ['amarelo', 50, 24],
  ])('%s com %i passos está na casa %i', (cor, passos, casa) => {
    expect(casaNaTrilha(cor, passos)).toBe(casa);
  });

  test('peças na base, na reta final ou na chegada não estão na trilha', () => {
    expect(casaNaTrilha('vermelho', -1)).toBeNull();
    expect(casaNaTrilha('vermelho', 51)).toBeNull();
    expect(casaNaTrilha('amarelo', 56)).toBeNull();
  });
});

describe('localizar', () => {
  test.each([
    ['vermelho', -1, { zona: 'base', casa: null }],
    ['vermelho', 0, { zona: 'trilha', casa: 0 }],
    ['amarelo', 30, { zona: 'trilha', casa: 4 }],
    ['vermelho', 51, { zona: 'reta', casa: 1 }],
    ['amarelo', 55, { zona: 'reta', casa: 5 }],
    ['amarelo', 56, { zona: 'chegada', casa: null }],
  ])('%s com %i passos => %j', (cor, passos, esperado) => {
    expect(localizar(cor, passos)).toEqual(esperado);
  });
});
