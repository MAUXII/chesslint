# Lance

Um tabuleiro de xadrez de uma tela. Você escolhe a cor, joga contra o motor ou estuda a posição, e pede o melhor lance ou um lance natural. O que ficar de aprendizado vai para um caderno, no próprio lance.

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
