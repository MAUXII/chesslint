# Lance

Um tabuleiro de xadrez de uma tela. A primeira visita abre em Configurar: cor, modo, ajuda, força, desenho do tabuleiro e desenho das peças, cada um com uma frase do que faz. Jogo é a partida e o caderno. A fonte é Geist.

A especificação está em [specification.md](specification.md).

## Rodar

```bash
npm install
npm run dev
```

Abre em [http://127.0.0.1:43127](http://127.0.0.1:43127).

`npm install` copia o Stockfish lite, de uma thread, para `public/stockfish`. Esse build não precisa de `SharedArrayBuffer`. O motor é [Stockfish.js](https://github.com/nmrugg/stockfish.js), GPL-3.0. O restante do app fala com ele só por UCI.

```bash
npm test
npm run lint
```

As partidas e as notas ficam no `localStorage` deste navegador.
