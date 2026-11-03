# Lance

Tabuleiro de xadrez de uma tela, com um caderno no lance.

Você escolhe a cor, joga contra o motor ou estuda os dois lados, e pede o lance do motor ou um lance natural. A nota fica no lance, neste navegador.

A coluna tem três momentos: o agora, a lista e a página do lance. O nome da abertura sai do livro do Lance. Onde a avaliação caiu fica nesse lance. Em Configurar, Treino abre um exercício ou um final, e uma partida anterior volta para o tabuleiro.

O texto completo do projeto está em [specification.md](specification.md).

## Rodar

```bash
npm install
npm run dev
```

Abre em [http://127.0.0.1:43127](http://127.0.0.1:43127).

```bash
npm test
npm run lint
```

`npm install` copia o Stockfish lite, de uma thread, para `public/stockfish`. Esse build não usa `SharedArrayBuffer`.

## Peças, motor, fundo

As peças estão em `public/pieces`, com a licença em `public/pieces/NOTICE.md`: Chessnut (Apache 2.0, Alexis Luengas), Fantasy e Celtic (MIT, Maurizio Monge).

As regras são o [chess.js](https://github.com/jhlywa/chess.js). O motor é o Stockfish 19 em WASM, pelo pacote [stockfish.js](https://github.com/nmrugg/stockfish.js), GPL-3.0. O app fala com ele por UCI.

O fundo nada com o [ascii-sharks](https://github.com/stackedlol/ascii-sharks), MIT, de drewdi, em `src/vendor/ascii-sharks`. No Lance o desenho é branco, pequeno e apagado. Um clique abre uma onda que anda e some.

A partida, as notas, o som e a primeira visita ficam em `localStorage`, na chave `lance.session.v1`.
