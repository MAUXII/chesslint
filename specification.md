# Lance

Lance é um tabuleiro de xadrez de uma tela. Você escolhe a cor, joga uma partida contra o motor ou estuda a posição dos dois lados, e pode pedir o melhor lance ou um lance natural. O que ficar de aprendizado vai para um caderno, no próprio lance.

O nome é curto de propósito. Lance é a jogada. Alternativas que não mudam o produto: Casa, Ply.

## Referências

O visual conversa com três projetos anteriores:

- [Facultas](https://github.com/MAUXII/facultas) — fundo `#151618`, superfície `#1e1e20`, fio branco a 8%, coluna estreita. O Lance herda esse tom e esse container. A fonte é Geist, a da Vercel.
- [Copia](https://github.com/MAUXII/copia) — shadcn/ui neutro, componentes que se comportam como ferramenta e não como cartaz.
- [GeoSprint](https://github.com/MAUXII/geosprint) — uma sessão que termina com um número. Daqui vem só isso.

A coluna é a do Facultas, só o bastante mais larga para o tabuleiro e o caderno lado a lado. As casas são quadradas. A moldura e os controles usam raio de 6px.

## Uma tela

A primeira vista é o tabuleiro, com duas abas no topo: Jogo e Configurar. Quem ainda não escolheu a aba Jogo cai em Configurar, para ver o que cada coisa faz antes de a partida responder.

O tabuleiro continua visível. A seta da ajuda, se estiver ligada, já aparece. O adversário não joga enquanto a aba for Configurar.

Configurar explica, uma frase por escolha:

- Cor: brancas ou pretas. O tabuleiro gira com a cor. Trocar a cor com lances já feitos abre outra partida.
- Modo: Partida, em que o motor responde, ou Estudo, em que você mexe os dois lados.
- Assistência: Livre, Melhor ou Humano. A frase debaixo do botão diz o que a escolha faz.
- Força do adversário, só na partida: iniciante, clube, forte.
- Tabuleiro: pedra, madeira, verde ou tinta.
- Peças: clássico, cheio ou traço.
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

O tabuleiro padrão é pedra: clara `#e4e0d8`, escura `#6f6a62`. Madeira, verde e tinta trocam só as casas. Peças SVG próprias, em duas tintas, creme e quase preto. Clássico leva um fio da cor oposta. Cheio é a mesma silhueta, só a massa. Traço é o contorno, com um halo da cor oposta para ler nas duas casas. Casas sem raio. Moldura do tabuleiro, botões e campos com raio de 6px.

A barra de avaliação é fina, à esquerda do tabuleiro, preenchida de baixo para cima do ponto de vista das brancas. Avaliação em peões com vírgula (`+0,4`). Mate em n lances quando a linha é de mate.

O último lance fica com um véu quente. O lance legal vazio ganha um ponto; a captura, um anel.

A peça desliza até a casa nova. Se o sistema pedir menos movimento, ela aparece direto.

Tipografia: Geist.

## Dados

Tudo fica no `localStorage` deste navegador, na chave `lance.session.v1`.

A sessão guarda a FEN inicial, os lances, as notas, a cor, o modo, a assistência, a força, se a revisão está calada, o desenho do tabuleiro, o desenho das peças, a aba aberta, e a contagem de coincidência. Atualizar a página continua a mesma partida. Uma sessão antiga, sem aba guardada, abre em Configurar.

Nova partida arquiva a anterior, se houve lance ou nota, e fica com as doze últimas. A coluna lista essas partidas e reabre o PGN e as notas.

Não há conta, servidor de jogo, nem som.

## Motor

Stockfish 19, build lite de uma thread, em WASM, dentro de um worker servido de `public/stockfish`. Esse build não usa `SharedArrayBuffer` e não pede os headers COOP e COEP.

Os arquivos do motor vêm do pacote `stockfish` (GPL-3.0) e são copiados para `public/stockfish` na instalação. O restante do app fala com ele só por UCI.

As regras, o PGN e a FEN ficam com `chess.js`.

## Fora desta versão

Maia. Uma rede treinada em partidas humanas pode, no futuro, substituir o critério local do modo humano. A seta tracejada e a frase de coincidência continuam iguais; muda só de onde vem o lance.

Extensão. Um complemento de navegador pode ler a posição de um tabuleiro já aberto e trazer essa FEN para o Lance.

Tabuleiro conectado. No futuro, um tabuleiro físico ou uma partida em andamento pode empurrar lances para esta tela.

Gravação em tempo real. A mesma entrada contínua pode gravar a partida enquanto ela acontece, em vez de só receber uma FEN colada.

Nuvem. O caderno pode sair deste navegador. Esta versão não sincroniza.

Puzzles e som. Não entram agora. O aprendizado desta versão é a nota no lance e o número de coincidência.

## Critérios desta versão

- A tela abre no tabuleiro, em desktop e em celular, com Configurar na frente até a pessoa ir para Jogo.
- Dá para trocar o desenho das casas e o desenho das peças, e a troca fica neste navegador.
- Dá para jogar de brancas ou de pretas, contra o motor, e estudar andando com os dois lados.
- Livre, Melhor e Humano se comportam como acima.
- Uma nota sobrevive a atualizar a página e aparece de novo ao reabrir a partida arquivada.
- Promoção, roque, captura, xeque e fim de jogo funcionam.
- O motor que falha ao carregar não quebra o tabuleiro: a coluna explica, e as regras locais continuam no modo estudo.
