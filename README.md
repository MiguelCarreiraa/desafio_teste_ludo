# Desafio Teste — Ludo para 2 jogadores (TDD)

Casos de teste em **JavaScript** (Jest) para uma **partida de Ludo com 2 jogadores** (vermelho x amarelo).

Desenvolvido no estilo **TDD**: primeiro foram escritos os testes (`tests/`) e depois a implementação (`src/`)
que faz todos eles passarem, seguindo o contrato descrito abaixo.

## Colaborador

- Miguel Carreira — [@MiguelCarreiraa](https://github.com/MiguelCarreiraa)

---

## Especificação do desafio

- Casos de teste para testar **uma partida para 02 jogadores**;
- Casos de teste em **JavaScript** para testar **JavaScript**.

### Regras adotadas

| Item | Regra |
|---|---|
| Jogadores | **Vermelho** e **amarelo**, cada um com **4 peças** começando na base. O vermelho joga primeiro. |
| Trilha | Circuito de **52 casas** (0 a 51). O vermelho sai na casa **0** e o amarelo na casa **26** (lados opostos). |
| Sair da base | Só tirando **6**. A peça vai para a casa de saída da sua cor. |
| Andar | A peça anda o valor do dado. O jogador escolhe qual peça mover. |
| Sem jogada | Se nenhuma peça pode se mover, a vez passa automaticamente. |
| Captura | Parar na casa de uma peça adversária a manda de volta para a base. |
| Casas seguras | `0, 8, 13, 21, 26, 34, 39, 47` (as 4 saídas do tabuleiro e as 4 estrelas): **não há captura**, as peças dividem a casa. |
| Barreira | **Duas peças da mesma cor** na mesma casa formam uma barreira: o adversário **não passa nem para** nela (nem sai da base se ela estiver na casa de saída). |
| Reta final | Depois de dar a volta (51 casas), a peça entra em **5 casas exclusivas** da sua cor, onde não pode ser capturada. |
| Chegada | Exige o **número exato** do dado. |
| Jogar de novo | Quem tira **6**, **captura** uma peça ou **leva uma peça à chegada** joga de novo. |
| Três 6 seguidos | O **terceiro 6 seguido** faz o jogador perder a vez, sem mover. |
| Vitória | Vence quem levar as **4 peças** à chegada. |

**Passos de uma peça** (contados a partir da sua casa de saída):
`-1` = base · `0..50` = trilha · `51..55` = reta final · `56` = chegada.

---

## Funcionamento dos casos de teste

### Como rodar

Requer [Node.js](https://nodejs.org/) 18 ou superior.

```bash
npm install
npm test
```

Resultado esperado: **3 suítes e 95 testes passando**.

### Estrutura

```
src/
├── dado.js               # dado de 6 faces e validação do valor
├── tabuleiro.js          # trilha, cores, casas seguras e posição das peças
└── partida.js            # classe Partida (rolar, mover, captura, barreira, vitória)
tests/
├── helpers.js            # gerador com semente, dado viciado e atalho para montar cenários
├── dado.test.js
├── tabuleiro.test.js
└── partida.test.js
```

### Como os testes controlam o dado

O dado é **injetável**. Os testes usam um **dado viciado**, que devolve valores na ordem combinada:

```js
const partida = new Partida({
  dado: dadoViciado(2),                                        // o próximo valor será 2
  pecas: { vermelho: [10, -1, -1, -1], amarelo: [38, -1, -1, -1] }, // cenário pronto
});
partida.rolar();     // 2
partida.mover(0);    // vermelho vai da casa 10 para a 12 e captura o amarelo
```

Assim cada regra é testada em uma situação exata, sem depender da sorte.

### O que cada arquivo testa

| Arquivo | O que verifica |
|---|---|
| `dado.test.js` | Valores aceitos (1 a 6) e rejeitados (`0`, `7`, `1.5`, texto, `null`, `undefined`, `NaN`); conversão do gerador aleatório em face do dado; em 600 jogadas todas as faces aparecem; funciona com `Math.random`. |
| `tabuleiro.test.js` | 52 casas, 2 cores, 4 peças; saídas em lados opostos (0 e 26); base e chegada; casas seguras; cor adversária e cor inválida; conversão de passos em casa da trilha (inclusive o amarelo dando a volta); localização em base, trilha, reta e chegada. |
| `partida.test.js` | Início e cenários (e cenários inválidos); dado (não rola duas vezes, não move sem rolar, valor inválido); **sair da base só com 6** (vermelho na casa 0, amarelo na 26); andar e escolher a peça; dar a volta; **captura** pelos dois jogadores com nova jogada; **6 casas seguras** sem captura e saída segura; **barreira** (não passa, não para, bloqueia a saída, não bloqueia a própria cor); **reta final**, chegada com número exato, peça que chegou não se move; **6 dá nova jogada; três 6 seguidos perdem a vez**; vitória do vermelho e do amarelo; nada depois do fim. **Partidas completas**: 30 partidas aleatórias terminam com um vencedor com as 4 peças na chegada, e a cada lance nunca há peças de cores diferentes na mesma casa comum; mesma semente = mesma partida. |

---

## Contrato (o que o código exporta)

Módulos em CommonJS (`module.exports`).

| Arquivo | Exporta |
|---|---|
| `src/dado.js` | `validarValorDoDado(valor)`, `criarDado(rng?)` → função que devolve 1..6 |
| `src/tabuleiro.js` | `TOTAL_CASAS` (52), `CORES`, `CASA_DE_SAIDA`, `CASAS_SEGURAS`, `BASE` (-1), `ULTIMO_PASSO_NA_TRILHA` (50), `CHEGADA` (56), `PECAS_POR_COR` (4), `validarCor(cor)`, `adversaria(cor)`, `ehSegura(casa)`, `casaNaTrilha(cor, passos)`, `localizar(cor, passos)` → `{ zona, casa }` |
| `src/partida.js` | classe `Partida` |

### `Partida`

`new Partida({ dado?, pecas?, vez? })`

- `dado`: função que devolve 1..6 (padrão: aleatório).
- `pecas`: `{ vermelho: [4 passos], amarelo: [4 passos] }` para começar de um cenário.
- `vez`: `'vermelho'` (padrão) ou `'amarelo'`.
- Propriedades: `vez`, `valorDoDado`, `estado` (`'jogando' | 'encerrada'`), `vencedor`
- Métodos:
  - `rolar()`: rola o dado (sem jogada possível ou no terceiro 6, a vez passa);
  - `jogadasPossiveis()`: índices das peças que podem se mover;
  - `mover(indice)` → `{ cor, peca, de, para, capturadas: [{ cor, peca }], jogaDeNovo }`;
  - `pecas(cor)`: cópia dos passos das 4 peças;
  - `ondeEsta(cor, indice)` → `{ zona: 'base' | 'trilha' | 'reta' | 'chegada', casa }`.
- Cor, peça ou cenário inválido → `RangeError`. Rolar duas vezes, mover sem rolar, mover peça que não pode,
  ou jogar depois do fim → `Error`.
