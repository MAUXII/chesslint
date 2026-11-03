# Lance

Um tabuleiro de xadrez de uma tela. A primeira visita faz as perguntas uma de cada vez, num painel estreito, com o tabuleiro atrás. Configurar continua lá para mudar cor, modo, ajuda, casas, peças e som.

O documento para ler o projeto inteiro, do fluxo ao motor, é [specification.md](specification.md).

## O que entra de cada repositório

- [chess.js](https://github.com/jhlywa/chess.js) entra. É a dependência `chess.js`: regras, FEN, PGN e lance legal.
- [Stockfish](https://github.com/mcostalba/Stockfish) é o motor. O Lance não compila esse C++. Usa o pacote `stockfish` ([stockfish.js](https://github.com/nmrugg/stockfish.js)), um build WASM de uma thread do Stockfish 19, GPL-3.0, e fala com ele por UCI.
- [code100x/chess](https://github.com/code100x/chess) não entra. É uma plataforma de partidas online. Nenhum arquivo de lá está neste projeto.
- [ascii-sharks](https://github.com/stackedlol/ascii-sharks) entra no fundo. MIT, de drewdi. O nado é o de lá. O desenho no Lance é caractere pequeno, branco e apagado, sem grade.

As peças são conjuntos publicados: Chessnut (Apache 2.0, Alexis Luengas), Fantasy e Celtic (MIT, Maurizio Monge). A nota está em `public/pieces/NOTICE.md`.

## Rodar

```bash
npm install
npm run dev
```

Abre em [http://127.0.0.1:43127](http://127.0.0.1:43127).

`npm install` copia o Stockfish lite, de uma thread, para `public/stockfish`. Esse build não precisa de `SharedArrayBuffer`. O restante do app fala com ele só por UCI.

```bash
npm test
npm run lint
```

As partidas, as notas, o som e a primeira visita ficam no `localStorage` deste navegador, na chave `lance.session.v1`.
