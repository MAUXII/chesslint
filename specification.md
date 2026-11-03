# Lance

Este arquivo é o documento do projeto até agora. O README só diz como rodar e aponta para cá.

Lance é um tabuleiro de xadrez de uma tela. Você escolhe a cor, joga uma partida contra o motor ou estuda a posição dos dois lados, e pode pedir o melhor lance ou um lance natural. O que ficar de aprendizado vai para um caderno, no próprio lance.

O nome é curto de propósito. Lance é a jogada. Alternativas que não mudam o produto: Casa, Ply.

## De onde vem

Três repositórios foram perguntados. Só um entra como código nosso. O motor entra por um build WASM. O terceiro não entra.

- [chess.js](https://github.com/jhlywa/chess.js), de jhlywa. É dependência direta, pacote `chess.js`. Faz as regras, a FEN, o PGN e o lance legal. Um lance ilegal lança erro; o Lance captura isso. O PGN sai em inglês. A notação na tela é portuguesa (C, B, T, D, R), convertida em cima do SAN.
- [Stockfish](https://github.com/mcostalba/Stockfish), de mcostalba e o projeto oficial. O Lance não compila esse C++. O pacote npm `stockfish` é o [stockfish.js](https://github.com/nmrugg/stockfish.js), GPL-3.0: um build WASM de uma thread do Stockfish 19. A instalação copia esse arquivo para `public/stockfish`. O app fala com o worker só por UCI. Não usa `SharedArrayBuffer`.
- [code100x/chess](https://github.com/code100x/chess). Não entra. É uma plataforma de partidas online, com React, Node, websockets, Redis e Postgres. O Lance não importa arquivo nenhum de lá. Os dois projetos usam chess.js, cada um do seu lado.
- [ascii-sharks](https://github.com/stackedlol/ascii-sharks), de drewdi, MIT. Entra no fundo da página. O código está em `src/vendor/ascii-sharks`, com a licença. O Lance usa o nado e o desenho do tubarão. O clique continua no tabuleiro.

O desenho das peças vem de outros repositórios, com licença, listados em `public/pieces/NOTICE.md`: o clássico de Colin M.L. Burnett (GPL-2.0 ou posterior, o conjunto padrão do Lichess), Celtic (Maurizio Monge, MIT) e Chessnut (Alexis Luengas, Apache 2.0). Os arquivos do Chess.com e os modelos do Discord Chess in the Park não foram copiados.

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
- Peças: clássico, celta ou nítido.
- Som: ligado ou mudo.

O último botão é "Ir para o jogo". A escolha fica neste navegador e o painel não volta. Não há conta nem login. Configurar continua no topo para mudar qualquer coisa depois.

O tabuleiro continua visível. O adversário não joga enquanto o painel estiver aberto, nem enquanto a aba for Configurar.

Configurar explica, uma frase por escolha:

- Cor: brancas ou pretas. O tabuleiro gira com a cor. Trocar a cor com lances já feitos abre outra partida.
- Modo: Partida, em que o motor responde, ou Estudo, em que você mexe os dois lados.
- Assistência: Livre, Melhor ou Humano. A frase debaixo do botão diz o que a escolha faz.
- Força do adversário, só na partida: iniciante, clube, forte.
- Tabuleiro: pedra, madeira, verde ou tinta.
- Peças: clássico, celta ou nítido.
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

O motor calcula em toda posição nova, na vez de quem está jogando. Na partida, isso não vira seta. A seta do motor só entra depois de Ver melhor lance, na posição atual, e some quando a posição muda, quando a dica é desligada ou numa nova partida. No estudo, com as setas da análise ligadas, o melhor lance aparece na posição presente. A resposta do adversário nunca é anunciada com seta.

A sugestão usa cerca de 400 ms. A resposta do adversário usa um pouco mais, conforme a força, para a partida ter um tempo de pensar.

Enquanto o WASM carrega, a coluna diz: "O motor está acordando." Se o arquivo não abrir, diz: "O motor não carregou."

## Assistência

Livre. Nenhuma seta sozinha. Depois do seu lance, uma linha: o que você jogou e o que o motor preferia, em peões, quando o lance jogado estava entre as candidatas. Dá para calar essa linha. A contagem de coincidência continua. Se você pedir, o melhor lance aparece.

Melhor. A seta verde só aparece quando você pede, pelo botão Ver melhor lance. Numa torre, bispo, dama, rei ou peão ela é um caminho preenchido, do centro da casa até a outra. No cavalo ela faz o L: primeiro a perna mais longa, com o canto reto, e a ponta no mesmo contorno, no último trecho. A avaliação em peões e três lances da linha vêm junto, em notação portuguesa (C, B, T, D, R), quando a dica está pedida.

Humano. A mesma seta, em azul, no lance natural, e só quando pedida. No estudo, a seta da análise continua verde.

- Na abertura, um livro pequeno embutido guarda as linhas mais jogadas. Em cada posição o livro tem um lance, o de maior peso entre as linhas que passam por ali.
- Fora do livro, o Stockfish devolve três candidatas. O lance natural é a que está a até 0,35 peão da melhor e, dentro dessa janela, a mais ordinária: desenvolver cavalo ou bispo, rocar, e não sair com a dama cedo. Se a melhor já é essa, ou se nenhuma outra entra na janela, a tela diz que o lance natural coincide com o do motor.
- Quando os dois diferem, "ver o do motor" mostra o lance do Stockfish em texto. Não entra uma segunda seta.

Isso é um critério local em cima do Stockfish, mais um livro de abertura. Não é a Maia, a rede que prevê jogada de gente.

A força do adversário muda o lance que ele responde, não a sugestão. A sugestão corre sempre em força cheia. Iniciante, clube e forte descem a força da resposta e alongam um pouco o tempo.

## Caderno

O caderno é a coluna do jogo. A lista de lances é o índice. Um lance com nota ganha um ponto e a frase aparece debaixo dele, na margem. As páginas já escritas ficam numa fila de nomes: tocar uma abre aquele lance.

A página aberta é o lance selecionado. O título é o número e o lance. A marca — ideia, erro, abertura, tática, final — é uma palavra, não um botão. O texto é a página. Guardar escreve de novo por cima. Apagar tira a página. Antes do primeiro lance, a frase é: "A primeira página abre no primeiro lance."

## Partida e estudo

Na partida, só a sua cor anda. O adversário responde sozinho. Desfazer volta o seu lance e, se ele já respondeu, a resposta também.

No estudo, você anda com os dois lados. Desfazer volta um lance.

Dá para colar uma FEN. Se ela não abrir, a coluna diz: "Essa FEN não abre." Dá para copiar o PGN, no padrão em inglês, para colar noutro programa.

Promoção pede dama, torre, bispo ou cavalo. Xeque marca o rei. No fim: xeque-mate, afogamento ou empate, e quem venceu.

Coincidência. Cada lance seu, quando o motor já tinha uma sugestão para aquela posição, entra na conta. No fim, um número: "Você coincidiu com o motor em 6 de 14 lances." A conta compara com o melhor lance do motor, também no modo humano. A partida guarda o número na coluna o tempo todo, em voz baixa.

## Visual

Fundo `#151618`. Superfície `#1e1e20`. Texto branco, texto secundário `#888888`, fio `rgba(255, 255, 255, 0.08)`.

O tabuleiro padrão é pedra: clara `#e4e0d8`, escura `#6f6a62`. Madeira, verde e tinta trocam só as casas. Casas sem raio. Moldura do tabuleiro, botões e campos com raio de 6px.

As peças são três conjuntos publicados, no estado em que foram desenhados. Diagrama é o de Colin M.L. Burnett, GPL-2.0 ou posterior: o cavalo de perfil, a coroa com cruz e a torre com ameias. Entalhe é o Celtic, de Maurizio Monge, MIT. Contorno é o Chessnut, de Alexis Luengas, Apache 2.0. A prévia mostra as doze peças. Não há recoloração: o claro e o escuro já estão desenhados. A nota está em `public/pieces/NOTICE.md`.

As casas têm Pedra, Madeira, Verde, Tinta, Creme e Azul, chapados, e um Personalizado com claras, escuras, seleção, último lance, destino legal e xeque. O som continua no mesmo kit: Suave, Clássico e Tátil são volumes desse kit, com o tabuleiro e a interface separados.

No fundo da página o nado é o do [ascii-sharks](https://github.com/stackedlol/ascii-sharks), MIT. O desenho é outro: caractere pequeno, só branco, apagado, com dither Bayer e um tremor de meio pixel. Sem grade e sem cor. O cardume é curto. Um clique no fundo, fora do tabuleiro, da coluna e dos controles, empurra a altura da água. A crista anda para fora, em dither branco, e some. Dois cliques se cruzam. Clique em peça, casa ou na partida não mexe a água. Se o sistema pedir menos movimento, o oceano para num quadro só e o clique não abre anel.

A barra de avaliação é fina, à esquerda do tabuleiro, preenchida de baixo para cima do ponto de vista das brancas. Avaliação em peões com vírgula (`+0,4`). Mate em n lances quando a linha é de mate.

O último lance fica com um véu quente. O lance legal vazio ganha um ponto; a captura, um anel.

A peça desliza até a casa nova. Se o sistema pedir menos movimento, ela aparece direto.

Tipografia: Geist.

## Dados

Tudo fica no `localStorage` deste navegador, na chave `lance.session.v1`.

A sessão guarda a FEN inicial, os lances, as notas, a cor, o modo, a assistência, a força, se a linha do Livre está calada, o desenho do tabuleiro, as cores personalizadas, os realces, o desenho das peças, as setas (análise, revisão, último lance, ameaças e anotações), o preset e os volumes do som, o tempo da busca, a aba aberta, se o som está ligado, se a primeira visita já foi respondida, e a contagem de coincidência. Atualizar a página continua a mesma partida. Uma sessão antiga, sem essas marcas, abre as perguntas uma vez e deixa o som ligado.

Nova partida arquiva a anterior, se houve lance ou nota, e fica com as doze últimas. A coluna lista essas partidas e reabre o PGN e as notas.

Não há conta nem servidor de jogo. O som é local, no navegador, e só toca depois do primeiro gesto.

## Motor

Stockfish 19, build lite de uma thread, em WASM, dentro de um worker servido de `public/stockfish`. Esse build não usa `SharedArrayBuffer` e não pede os headers COOP e COEP.

Os arquivos do motor vêm do pacote `stockfish` (GPL-3.0) e são copiados para `public/stockfish` na instalação. O restante do app fala com ele só por UCI.

As regras, o PGN e a FEN ficam com `chess.js`. Ver "De onde vem".

## Fora desta versão

Maia. Uma rede treinada em partidas humanas pode, no futuro, substituir o critério local do modo humano. A seta azul e a frase de coincidência continuam iguais; muda só de onde vem o lance.

Extensão. Um complemento de navegador pode ler a posição de um tabuleiro já aberto e trazer essa FEN para o Lance.

Tabuleiro conectado. No futuro, um tabuleiro físico ou uma partida em andamento pode empurrar lances para esta tela.

Gravação em tempo real. A mesma entrada contínua pode gravar a partida enquanto ela acontece, em vez de só receber uma FEN colada.

Nuvem. O caderno pode sair deste navegador. Esta versão não sincroniza.

Catálogo grande de exercícios. Entram quatro posições escritas aqui: mate em um, um garfo, rei e peão, e torre. Uma base grande só entra com licença clara. O som desta versão é o kit de seno: toque na escolha, botão no lance, interruptor ao ligar e calar, um festejo no fim da partida, e um aviso quando a FEN não abre.

## Critérios desta versão

- A primeira visita faz as perguntas num painel estreito, com o tabuleiro atrás, e não repete. Configurar continua disponível.
- Dá para trocar o desenho das casas e o conjunto das peças, e a troca fica neste navegador. O cavalo de cada conjunto é um cavalo de perfil.
- Dá para jogar de brancas ou de pretas, contra o motor, e estudar andando com os dois lados.
- Livre, Melhor e Humano se comportam como acima.
- Uma nota sobrevive a atualizar a página e aparece de novo ao reabrir a partida arquivada.
- Promoção, roque, captura, xeque e fim de jogo funcionam.
- O motor que falha ao carregar não quebra o tabuleiro: a coluna explica, e as regras locais continuam no modo estudo.

## O que entrou

O estudo que outros sites separam como produto pago está nesta tela, feito com o Stockfish e com o livro daqui.

1. Coluna. Três momentos: Agora, Lista e Página. O resto fica quieto.
2. Revisão. Ela abre em Analisar partida, no fim ou quando você pede. Durante a partida, tocar um lance só realça as casas. A classe do Lance sai da chance de vitória `1 / (1 + 10^(-cp/400))`, não da escala de outro site. O livro vem primeiro. Brilhante exige o sacrifício de bispo, torre ou dama que segue o melhor lance. As outras faixas usam a queda dessa chance: grande, melhor, excelente, bom, imprecisão, erro, omissão e vacilo. Na revisão, a casa de saída e a de chegada ganham a cor da classe, com a marca grande na chegada. A seta não sai em todo lance: verde quando há um lance melhor, amarela quando o lance abre um caminho ou ameaça uma peça, azul quando deixa uma peça sem defesa, vermelha no vacilo. A coluna mostra o progresso, a classe, uma frase quando a posição dá um fato, e Próximo. O gráfico usa os pontos já calculados e, no clique ou toque, leva o tabuleiro àquele lance. No fim, o resumo traz o resultado, o número de lances, a contagem por classe e uma precisão estimada do Lance para cada cor: a média, por lado, de uma nota por lance. Livro, melhor, brilhante e grande valem 1. Se a queda da chance existe, a nota é 1 menos essa queda, limitada a zero. Sem ela, se a queda em centipeões existe, a nota é 1 menos essa queda dividida por 300, limitada a zero. Sem as duas, a nota é 1. Tentar novamente volta à posição anterior ao erro, em estudo, e compara o lance novo com o melhor lance guardado.
3. Abertura. O nome da linha, pelo livro do Lance.
4. Exercício. Mate em um, e um garfo. O catálogo grande continua de fora.
5. Final. Rei e peão, e torre. O motor não responde enquanto o treino está aberto.
6. A própria partida. Reabre do arquivo, com as notas e a queda da avaliação. A base de partidas de outras pessoas fica de fora.

Ficam de fora neste ciclo: relógio, pré-lance, confirmação extra de lance, recolorir peças, áudio de madeira gravado, treinador por modelo de linguagem, catálogo grande de exercícios e qualquer desenho sem licença de redistribuição. Também ficam de fora vídeo-aula, conta, anúncio, torneio e transmissão. O Lance não copia o cliente de outro site.
