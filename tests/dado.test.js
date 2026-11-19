const { validarValorDoDado, criarDado } = require('../src/dado');
const { rngComSemente } = require('./helpers');

describe('validarValorDoDado', () => {
  test.each([1, 2, 3, 4, 5, 6])('aceita %i', (valor) => {
    expect(validarValorDoDado(valor)).toBe(valor);
  });

  test.each([0, 7, -1, 1.5, '3', null, undefined, NaN])('rejeita %p', (valor) => {
    expect(() => validarValorDoDado(valor)).toThrow(RangeError);
  });
});

describe('criarDado', () => {
  test.each([
    [0, 1],
    [0.17, 2],
    [0.5, 4],
    [0.9999, 6],
  ])('com rng() = %p o dado mostra %i', (aleatorio, esperado) => {
    expect(criarDado(() => aleatorio)()).toBe(esperado);
  });

  test('em 600 jogadas sempre dá de 1 a 6 e todas as faces aparecem', () => {
    const dado = criarDado(rngComSemente(13));
    const faces = new Set();
    for (let i = 0; i < 600; i++) {
      const valor = dado();
      expect(validarValorDoDado(valor)).toBe(valor);
      faces.add(valor);
    }
    expect([...faces].sort()).toEqual([1, 2, 3, 4, 5, 6]);
  });

  test('sem rng usa Math.random e continua entre 1 e 6', () => {
    const dado = criarDado();
    for (let i = 0; i < 100; i++) expect(validarValorDoDado(dado())).toBeGreaterThanOrEqual(1);
  });
});
