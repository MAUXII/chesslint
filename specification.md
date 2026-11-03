# Lance

Este arquivo é o documento do projeto até agora. O README só diz como rodar e aponta para cá.

Lance é um tabuleiro de xadrez de uma tela. Você escolhe a cor, joga uma partida contra o motor ou estuda a posição dos dois lados, e pode pedir o melhor lance ou um lance natural. O que ficar de aprendizado vai para um caderno, no próprio lance.

O nome é curto de propósito. Lance é a jogada. Alternativas que não mudam o produto: Casa, Ply.

## De onde vem

Três repositórios foram perguntados. Só um entra como código nosso. O motor entra por um build WASM. O terceiro não entra.

- [chess.js](https://github.com/jhlywa/chess.js), de jhlywa. É dependência direta, pacote `chess.js`. Faz as regras, a FEN, o PGN e o lance legal. Um lance ilegal lança erro; o Lance captura isso. O PGN sai em inglês. A notação na tela é portuguesa (C, B, T, D, R), convertida em cima do SAN.
- [Stockfish](https://github.com/mcostalba/Stockfish), de mcostalba e o projeto oficial. O Lance não compila esse C++. O pacote npm `stockfish` é o [stockfish.js](https://github.com/nmrugg/stockfish.js), GPL-3.0: um build WASM de uma thread do Stockfish 19. A instalação copia esse arquivo para `public/stockfish`. O app fala com o worker só por UCI. Não usa `SharedArrayBuffer`.
- [code100x/chess](https://github.com/code100x/chess). Não entra. É uma plataforma de partidas online, com React, Node, websockets, Redis e Postgres. O Lance não importa arquivo nenhum de lá. Os dois projetos usam chess.js, cada um do seu lado.

O desenho das peças vem de outros repositórios, com licença, listados em `public/pieces/NOTICE.md`: Chessnut (Alexis Luengas, Apache 2.0), Fantasy e Celtic (Maurizio Monge, MIT, peças públicas do Lichess). Chess.com, o conjunto padrão do Lichess (Cburnett, GPL) e os modelos do Discord Chess in the Park não foram copiados.

O som é o [snd.dev](https://snd.dev), pacote `snd-lib`, MIT, só o kit SND01 (seno). O painel da primeira visita e as abas seguem o gesto do Morphing Modal e das abas com mola do [beUI](https://beui.dev), refeitos aqui com `motion`, no tom do Lance. Não há instalação do registro inteiro do beUI.

## Referências

O visual conversa com três projetos anteriores:

- [Facultas](https://github.com/MAUXII/facultas) — fundo `#151618`, superfície `#1e1e20`, fio branco a 8%, coluna estreita. O Lance herda esse tom e esse container. A fonte é Geist, a da Vercel.
- [Copia](https://github.com/MAUXII/copia) — shadcn/ui neutro, componentes que se comportam como ferramenta e não como cartaz.
- [GeoSprint](https://github.com/MAUXII/geosprint) — uma sessão que termina com um número. Daqui vem só isso.

A coluna é a do Facultas, só o bastante mais larga para o tabuleiro e o caderno lado a lado. As casas são quadradas. A moldura e os controles usam raio de 6px.

## Uma tela

A primeira visita não é a coluna inteira. É um painel estreito, no máximo 380px, uma pergunta de cada vez, com o tabuleiro atrás. A altura do painel acompanha a pergunta numa mola, e o texto troca com um desfoque curto. Se o sistema pedir menos movimento, a altura troca na hora.

As perguntas, nesta ordem:

- Cor: brancas ou pretas.
- Partida ou estudo.
- Ajuda: Livre, Melhor ou Humano, com a frase do modo escolhido.
- Força do adversário, só se for partida.
- Casas: pedra, madeira, verde ou tinta.
- Peças: nítido, Staunton ou celta.
- Som: ligado ou mudo.

O último botão é "Ir para o jogo". A escolha fica neste navegador e o painel não volta. Não há conta nem login. Configurar continua no topo para mudar qualquer coisa depois.

O tabuleiro continua visível. O adversário não joga enquanto o painel estiver aberto, nem enquanto a aba for Configurar.

Configurar explica, uma frase por escolha:

- Cor: brancas ou pretas. O tabuleiro gira com a cor. Trocar a cor com lances já feitos abre outra partida.
- Modo: Partida, em que o motor responde, ou Estudo, em que você mexe os dois lados.
- Assistência: Livre, Melhor ou Humano. A frase debaixo do botão diz o que a escolha faz.
- Força do adversário, só na partida: iniciante, clube, forte.
- Tabuleiro: pedra, madeira, verde ou tinta.
- Peças: nítido, Staunton ou celta.
- Som: ligado ou mudo. O mesmo interruptor vale para a linha de revisão, no modo livre.
- Uma FEN, e as partidas anteriores.

Jogo é a partida em si: o que você está fazendo agora, a avaliação, os lances, desfazer, nova partida, copiar o PGN e o caderno. No celular a coluna fica abaixo do tabuleiro. As abas ficam no topo, nas duas larguras.

A lista de lances fica na coluna. Clicar num lance mostra aquela posição e a nota dela. Um botão devolve ao presente. No passado, as peças não andam.

## Fluxo

```text
posição → Stockfish no worker
              ├─ seta, se a assistência pedir e for a vez de quem joga
              └─ resposta do adversário, na partida
jogada → nota no lance, se você escrever
```

O motor calcula em toda posição nova, na vez de quem está jogando. A seta só aparece se a assistência pedir. Na partida, a seta some na vez do adversário: a resposta não é anunciada.

A sugestão usa cerca de 400 ms. A resposta do adversário usa um pouco mais, conforme a força, para a partida ter um tempo de pensar.

Enquanto o WASM carrega, a coluna diz: "O motor está acordando." Se o arquivo não abrir, diz: "O motor não carregou."

## Assistência

Livre. Nenhuma seta. Depois do seu lance, uma linha: o que você jogou e o que o motor preferia, em peões, quando o lance jogado estava entre as candidatas. Dá para calar essa linha. A contagem de coincidência continua.

Melhor. Seta contínua no lance do Stockfish, a avaliação em peões e três lances da linha, em notação portuguesa (C, B, T, D, R).

Humano. Seta tracejada no lance natural.

- Na abertura, um livro pequeno embutido guarda as linhas mais jogadas. Em cada posição o livro tem um lance, o de maior peso entre as linhas que passam por ali.
- Fora do livro, o Stockfish devolve três candidatas. O lance natural é a que está a até 0,35 peão da melhor e, dentro dessa janela, a mais ordinária: desenvolver cavalo ou bispo, rocar, e não sair com a dama cedo. Se a melhor já é essa, ou se nenhuma outra entra na janela, a tela diz que o lance natural coincide com o do motor.
- Quando os dois diferem, "ver o do motor" mostra o lance do Stockfish em texto. Não entra uma segunda seta.

Isso é um critério local em cima do Stockfish, mais um livro de abertura. Não é a Maia, a rede que prevê jogada de gente.

A força do adversário muda o lance que ele responde, não a sugestão. A sugestão corre sempre em força cheia. Iniciante, clube e forte descem a força da resposta e alongam um pouco o tempo.

## Caderno

Cada lance aceita uma nota curta e uma etiqueta: ideia, erro, abertura, tática, final. A nota gruda no lance, com a FEN de onde ele foi feito e o SAN. Uma nota por lance: escrever de novo substitui. Dá para apagar.

Com a lista vazia, a frase é: "Nada anotado. Depois de um lance, escreva o que ficou."

## Partida e estudo

Na partida, só a sua cor anda. O adversário responde sozinho. Desfazer volta o seu lance e, se ele já respondeu, a resposta também.

No estudo, você anda com os dois lados. Desfazer volta um lance.

Dá para colar uma FEN. Se ela não abrir, a coluna diz: "Essa FEN não abre." Dá para copiar o PGN, no padrão em inglês, para colar noutro programa.

Promoção pede dama, torre, bispo ou cavalo. Xeque marca o rei. No fim: xeque-mate, afogamento ou empate, e quem venceu.

Coincidência. Cada lance seu, quando o motor já tinha uma sugestão para aquela posição, entra na conta. No fim, um número: "Você coincidiu com o motor em 6 de 14 lances." A conta compara com o melhor lance do motor, também no modo humano. A partida guarda o número na coluna o tempo todo, em voz baixa.

## Visual

Fundo `#151618`. Superfície `#1e1e20`. Texto branco, texto secundário `#888888`, fio `rgba(255, 255, 255, 0.08)`.

O tabuleiro padrão é pedra: clara `#e4e0d8`, escura `#6f6a62`. Madeira, verde e tinta trocam só as casas. Casas sem raio. Moldura do tabuleiro, botões e campos com raio de 6px.

As peças são três conjuntos publicados, no estado em que foram desenhados. Nítido é o Chessnut, de Alexis Luengas, Apache 2.0: o cavalo de perfil, a coroa e a torre com ameias, na linha do que se lê no Chess.com e no Chess in the Park, do Discord. Staunton é o Fantasy, e Celta é o Celtic, os dois de Maurizio Monge, MIT, na linha do Lichess. A nota está em `public/pieces/NOTICE.md`.

No fundo da página, vários tubarões-martelo vistos de cima atravessam a tela. A cabeça é larga, o corpo afunila, a cauda é bifurcada, e cada um entra com tamanho e rumo diferentes. O corpo é pixel de dither Bayer, um tom acima do fundo `#151618`, não um desenho chapado. Se o sistema pedir menos movimento, eles ficam parados. O som continua no interruptor.

A barra de avaliação é fina, à esquerda do tabuleiro, preenchida de baixo para cima do ponto de vista das brancas. Avaliação em peões com vírgula (`+0,4`). Mate em n lances quando a linha é de mate.

O último lance fica com um véu quente. O lance legal vazio ganha um ponto; a captura, um anel.

A peça desliza até a casa nova. Se o sistema pedir menos movimento, ela aparece direto.

Tipografia: Geist.

## Dados

Tudo fica no `localStorage` deste navegador, na chave `lance.session.v1`.

A sessão guarda a FEN inicial, os lances, as notas, a cor, o modo, a assistência, a força, se a revisão está calada, o desenho do tabuleiro, o desenho das peças, a aba aberta, se o som está ligado, se a primeira visita já foi respondida, e a contagem de coincidência. Atualizar a página continua a mesma partida. Uma sessão antiga, sem essas marcas, abre as perguntas uma vez e deixa o som ligado.

Nova partida arquiva a anterior, se houve lance ou nota, e fica com as doze últimas. A coluna lista essas partidas e reabre o PGN e as notas.

Não há conta nem servidor de jogo. O som é local, no navegador, e só toca depois do primeiro gesto.

## Motor

Stockfish 19, build lite de uma thread, em WASM, dentro de um worker servido de `public/stockfish`. Esse build não usa `SharedArrayBuffer` e não pede os headers COOP e COEP.

Os arquivos do motor vêm do pacote `stockfish` (GPL-3.0) e são copiados para `public/stockfish` na instalação. O restante do app fala com ele só por UCI.

As regras, o PGN e a FEN ficam com `chess.js`. Ver "De onde vem".

## Fora desta versão

Maia. Uma rede treinada em partidas humanas pode, no futuro, substituir o critério local do modo humano. A seta tracejada e a frase de coincidência continuam iguais; muda só de onde vem o lance.

Extensão. Um complemento de navegador pode ler a posição de um tabuleiro já aberto e trazer essa FEN para o Lance.

Tabuleiro conectado. No futuro, um tabuleiro físico ou uma partida em andamento pode empurrar lances para esta tela.

Gravação em tempo real. A mesma entrada contínua pode gravar a partida enquanto ela acontece, em vez de só receber uma FEN colada.

Nuvem. O caderno pode sair deste navegador. Esta versão não sincroniza.

Puzzles. Não entram agora. O aprendizado desta versão é a nota no lance e o número de coincidência. O som desta versão é o kit de seno: toque na escolha, botão no lance, interruptor ao ligar e calar, um festejo no fim da partida, e um aviso quando a FEN não abre.

## Critérios desta versão

- A primeira visita faz as perguntas num painel estreito, com o tabuleiro atrás, e não repete. Configurar continua disponível.
- Dá para trocar o desenho das casas e o conjunto das peças, e a troca fica neste navegador. O cavalo de cada conjunto é um cavalo de perfil.
- Dá para jogar de brancas ou de pretas, contra o motor, e estudar andando com os dois lados.
- Livre, Melhor e Humano se comportam como acima.
- Uma nota sobrevive a atualizar a página e aparece de novo ao reabrir a partida arquivada.
- Promoção, roque, captura, xeque e fim de jogo funcionam.
- O motor que falha ao carregar não quebra o tabuleiro: a coluna explica, e as regras locais continuam no modo estudo.
