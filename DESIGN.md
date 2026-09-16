---
name: Wildfire Media Coverage
description: A night newsroom for the public record of US wildfire — hairline-ruled, square, lit by a single ember.
colors:
  ink: "#000000"
  surface-raised: "#121315"
  surface-card: "#1B1E21"
  rule: "#2A2D30"
  rule-strong: "#4A4E52"
  paper: "#F2EFEA"
  paper-dim: "#BDB7AF"
  muted: "#9E9891"
  ember: "#E8613C"
  ember-bright: "#F4835F"
  ember-deep: "#C0301A"
  ember-veil: "#2E0E05"
  chart-slack: "#595D62"
typography:
  display:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "clamp(56px, 13cqw, 192px)"
    fontWeight: 800
    lineHeight: 0.92
    letterSpacing: "-0.03em"
  hero-claim:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "clamp(28px, 3.6cqw, 56px)"
    fontWeight: 800
    lineHeight: 1.04
    letterSpacing: "-0.015em"
  section-title:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "clamp(28px, 3.4cqw, 50px)"
    fontWeight: 400
    lineHeight: 1.06
    letterSpacing: "-0.01em"
  panel-title:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "clamp(19px, 2cqw, 30px)"
    fontWeight: 800
    lineHeight: 1.08
    letterSpacing: "0.012em"
    textTransform: "uppercase"
  body:
    fontFamily: "Krub, system-ui, sans-serif"
    fontSize: "clamp(15px, 1.15cqw, 17px)"
    fontWeight: 400
    lineHeight: 1.72
    letterSpacing: "normal"
  label-rotulo:
    fontFamily: "Krub, system-ui, sans-serif"
    fontSize: "clamp(11px, 0.8cqw, 12px)"
    fontWeight: 500
    lineHeight: 1.6
    letterSpacing: "0.24em"
    textTransform: "uppercase"
  label-controle:
    fontFamily: "Krub, system-ui, sans-serif"
    fontSize: "11px"
    fontWeight: 600
    lineHeight: 1
    letterSpacing: "0.20em"
    textTransform: "uppercase"
  label-navegacao:
    fontFamily: "Krub, system-ui, sans-serif"
    fontSize: "clamp(11px, 0.8cqw, 12px)"
    fontWeight: 500
    lineHeight: 1
    letterSpacing: "0.20em"
    textTransform: "uppercase"
  label-assinatura:
    fontFamily: "Krub, system-ui, sans-serif"
    fontSize: "11px"
    fontWeight: 500
    lineHeight: 1
    letterSpacing: "0.30em"
    textTransform: "uppercase"
rounded:
  none: "0"
spacing:
  hairline: "1px"
  xs: "8px"
  sm: "clamp(10px, 1.6cqw, 26px)"
  md: "clamp(20px, 4cqw, 72px)"
  lg: "clamp(56px, 7cqw, 120px)"
  xl: "clamp(72px, 9cqw, 168px)"
sizing:
  container: "1480px"
  header-h: "79px"
components:
  button-primary:
    backgroundColor: "{colors.ember}"
    textColor: "{colors.ink}"
    borderColor: "{colors.ember}"
    typography: "{typography.label-controle}"
    rounded: "{rounded.none}"
    padding: "0 clamp(20px, 2cqw, 32px)"
    minHeight: "48px"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.paper}"
    borderColor: "{colors.rule-strong}"
    typography: "{typography.label-controle}"
    rounded: "{rounded.none}"
    padding: "0 clamp(20px, 2cqw, 32px)"
    minHeight: "48px"
  nav-item:
    textColor: "{colors.paper}"
    typography: "{typography.label-navegacao}"
    minHeight: "44px"
  nav-item-current:
    textColor: "{colors.ember}"
  chip:
    backgroundColor: "transparent"
    textColor: "{colors.paper}"
    borderColor: "{colors.rule-strong}"
    typography: "{typography.label-controle}"
    minHeight: "46px"
  chip-selected:
    backgroundColor: "{colors.ember-veil}"
    textColor: "{colors.ember}"
    fontWeight: 700
  table-cell-head:
    textColor: "{colors.muted}"
    typography: "{typography.label-rotulo}"
    fontWeight: 600
    borderBottomColor: "{colors.rule-strong}"
    padding: "14px 18px 14px 0"
  table-cell:
    textColor: "{colors.paper}"
    borderBottomColor: "{colors.rule}"
    padding: "14px 18px 14px 0"
---

# Design System: Wildfire Media Coverage

> **Procedência.** O desenho veio primeiro: os wireframes de baixa fidelidade
> foram feitos no Figma e é deles que saíram as páginas. A página **Design** do
> mesmo arquivo é a versão de alta fidelidade — tokens, componentes e telas.
> Este documento descreve **o sistema como ele está implementado hoje**; onde
> divergir do Figma, a seção 10 do `HANDOFF.md` explica por quê.

## Overview

**Creative North Star: "The Night Newsroom"**

O cliente junta duas coisas que normalmente vivem separadas: o que as agências
filaram e o que a imprensa reportou. O sistema é a sala onde as duas aterrissam
depois do escuro — uma mesa com pouca luz, texto composto para leitura e não para
varredura, e uma única brasa marcando o que ainda queima. É uma redação, não um
painel: o trabalho é julgamento editorial sobre um registro, não telemetria.

**A direção visual foi uma escolha, não uma herança.** O briefing não nomeia a
marca do cliente, nem paleta, nem tom. Sem isso, inventar uma identidade
arriscaria contradizer o que o cliente já tem. O registro escolhido é editorial e
neutro, e é **substituível de propósito**: trocar a marca significa trocar treze
variáveis de cor e dois nomes de fonte num único bloco `:root`. A estrutura — os
papéis de rótulo, a grade, os componentes, os limiares — sobrevive.

**Características:**

- Zero `border-radius` e zero `box-shadow` em toda a implementação — verificado
- Profundidade por três tons de fundo mais fios de 1px, nunca por elevação
- Um acento, usado com parcimônia, sempre num ponto de atenção
- Duas sem-serifa com papéis separados: Inter carrega título e número, Krub
  carrega corpo e rótulo. Não há terceira família
- Dimensionamento por container query, não por breakpoint
- Movimento existe, mas é argumentado — e tem sempre um caminho sem movimento

## Colors

Um campo preto carregando texto off-white quente, interrompido por exatamente um
acento quente.

### Primary

- **Ember** (`#E8613C`) — o único acento. Item de navegação atual, aspas de
  abertura, CTA primário, chip selecionado, a linha do gráfico, a fatia com
  acento do anel. Marca o que ainda queima.
- **Bright Ember** (`#F4835F`) — hover de todo elemento interativo em ember.
  Nunca em repouso.
- **Deep Ember** (`#C0301A`) — barras não selecionadas do explorador. Só dado.
- **Ember Veil** (`#2E0E05`) — `hsl(13 79% 10%)`, o fundo do chip selecionado. A
  brasa diluída até virar superfície.

### Neutral

- **Ink** (`#000000`) — o fundo da página e o forro translúcido do cabeçalho.
- **Surface Raised** (`#121315`) — a citação e a seção de agências, um degrau
  acima do ink para separar sem borda.
- **Surface Card** (`#1B1E21`) — o degrau mais alto, para blocos embutidos.
- **Rule** (`#2A2D30`) — o fio padrão. Toda fronteira de seção e divisor de
  fileira.
- **Rule Strong** (`#4A4E52`) — fio onde a borda precisa ler como aresta:
  contorno de botão, de chip, de campo de busca.
- **Paper** (`#F2EFEA`) — texto primário. Quente, nunca branco puro.
- **Paper Dim** (`#BDB7AF`) — corpo secundário em passagens densas.
- **Muted** (`#9E9891`) — rótulos, legendas, coordenadas, metadados,
  placeholders.

### Data

- **Chart Slack** (`#595D62`) — a fatia sem acento nos gráficos. **Não é
  `--rule`**: aquele dá 1,6:1 sobre o preto e serve como divisor, mas some
  quando vira dado. Este foi escolhido por cálculo para dar **3,17:1**, o mínimo
  da WCAG 1.4.11 para gráfico.

### Named Rules

**The One Ember Rule.** A família do acento aparece em poucos elementos por
viewport. A escassez é o que a torna legível como sinal; uma interface onde
várias coisas são ember é uma interface onde nada é.

**The Warm Neutral Rule.** Texto é `#F2EFEA`, nunca branco puro. O fundo é preto
puro `#000000` — foi uma mudança deliberada em relação ao `#0D0E0F` original,
para que a fotografia noturna e o mapa escuro fundissem com o fundo da página em
vez de recortarem contra ele.

**The Computed Contrast Rule.** Nenhum par de cor entra por aparência. Muted
sobre ink dá 7,35:1; chart-slack foi escolhido para dar 3,17:1. Sobre fotografia,
o cálculo usa o pior caso composto sob o véu. Um par novo sem número medido é um
par não aprovado.

## Typography

**Display:** Inter (com system-ui, sans-serif)
**Body:** Krub (com system-ui, sans-serif)

**Caráter:** duas sem-serifa com papéis separados, não uma serifa contra uma
grotesca. Inter carrega título e número — é o que precisa de peso extremo (800)
e de numeral bem desenhado. Krub carrega corpo e rótulo — é o que precisa de
altura-x generosa a 11px com tracking largo. Não há terceira voz.

### Hierarquia

- **Display** (800, `clamp(56px, 13cqw, 192px)`, 0.92) — o número da hero. Uma
  vez por página.
- **Hero claim** (800, `clamp(28px, 3.6cqw, 56px)`, 1.04) — a manchete da página
  (`h1`).
- **Section title** (400, `clamp(28px, 3.4cqw, 50px)`, 1.06) — cabeçalho de
  seção (`h2`). **Peso 400**, não 800: o `h1` carrega o peso, o `h2` carrega a
  escala.
- **Panel title** (800, `clamp(19px, 2cqw, 30px)`, caixa alta) — título de painel
  dentro de uma seção.
- **Figure** (700, `clamp(34px, 3.4cqw, 52px)`) — números grandes, numeral
  tabular.
- **Body** (400, `clamp(15px, 1.15cqw, 17px)`, 1.72) — texto corrido, limitado
  entre 46 e 68ch.

### Os quatro papéis de caixa alta

Este bloco existe porque o projeto chegou a ter **sete** trackings diferentes
para a mesma coisa.

| papel | peso | tracking | onde |
|---|---|---|---|
| **Rótulo** | 500 ou 600 | `.24em` | kicker, meta, legenda de dado, cabeçalho de coluna, fonte da notícia |
| **Controle** | 600 ou 700 | `.20em` | botão, chip, traço da trilha |
| **Navegação** | 500 | `.20em` | item de menu, largo ou estreito |
| **Assinatura** | 500 | `.30em` | "MEDIA COVERAGE" sob a marca |

**O peso carrega estado; o tracking carrega papel. Se precisar de um valor novo,
o papel é que tem que ser novo.**

### Named Rules

**The Tracking Ladder Rule.** Tracking largo anda com caixa alta, e só com ela.
Texto corrido em caixa baixa é tracking `normal`. Caixa baixa com tracking largo
é defeito, não estilo.

**The Measure Rule.** Todo bloco de texto declara um limite em `ch` — 46ch no
apoio de coluna estreita, 58–68ch no corpo, 88ch na letra miúda. Nenhum parágrafo
corre os 1480px do contêiner.

**The Two Ends Rule.** Os tamanhos são fluidos no código: `clamp(mínimo, cqw,
máximo)`. No Figma, que é estático, cada extremo é um estilo próprio — o desktop
guarda o máximo resolvido a 1440, o grupo `Mobile/` guarda o mínimo medido a 390.
**Não são overrides; são as duas pontas do mesmo token.**

## Layout

Uma coluna centrada, `max-width: 1480px`, com recuo lateral de
`clamp(20px, 4cqw, 72px)`. O ritmo vertical é `clamp(72px, 9cqw, 168px)` de
padding de seção.

O sistema é **dirigido por container query**, não por breakpoint: a raiz declara
`container-type: inline-size` e cada tamanho é um `clamp()` contra `cqw`. Isso
atende ao requisito do briefing de funcionar em várias resoluções sem grandes
mudanças de código a cada breakpoint — os tamanhos interpolam continuamente em
vez de saltar.

### Os limiares

Onde a estrutura muda de forma — o que nenhum `clamp()` expressa — há consulta de
contêiner. São **dez**, e todas medem o contêiner, não a janela:

| largura | o que muda |
|---|---|
| 440px | chips passam a 3 em linha |
| 560px | agências em 2 colunas |
| 620px | grade de matérias em 2 colunas |
| 720px | fontes do rodapé em 2 colunas |
| 800px | navegação larga aparece; o hambúrguer sai |
| 860px | cabeçalho de tabela em 2 colunas, busca à direita |
| 900px | lede em 2 colunas |
| 1000px | bloco de destaque em 2 colunas; anel e legenda empilham |
| 1020px | agências em 5 colunas, matérias em 3 |
| 1100px | fontes do rodapé em 3 colunas |

### Named Rules

**The Continuous Scale Rule.** Superfícies novas dimensionam com
`clamp(min, Ncqw, max)` contra o contêiner inline. Use consulta só para mudança
estrutural que nenhum clamp expressa, e diga por quê.

**The Container Not Viewport Rule.** São container queries. Elas medem o
**contêiner**. O painel do explorador ocupa metade da tela numa página e a
largura inteira em outra — media query não vê essa diferença, e trocar traz de
volta um bug real: o painel ficava em 2+1 numa janela de 1280.

**The `minmax(0, 1fr)` Rule.** `1fr` é `minmax(auto, 1fr)`: o mínimo é o
conteúdo. Um mapa com min-content largo esticou o lede para 512px numa viewport
de 280px. Toda coluna de grade usa `minmax(0, 1fr)`.

## Elevation & Depth

**Este sistema não tem sombra.** Não há `box-shadow` em lugar nenhum da
implementação — verificado — e não há raio. A profundidade vem de exatamente dois
recursos: três tons de fundo (`#000000` → `#121315` → `#1B1E21`) e fios de 1px em
`#2A2D30` ou `#4A4E52`.

O único recurso atmosférico é fotográfico: imagem noturna sob gradiente para
segurar o contraste do texto. Isso é iluminação de cena, não elevação.

O cabeçalho é o único elemento flutuante, preso por `position: sticky` com
`rgba(0,0,0,.9)` e `backdrop-filter: blur(12px)` — separado por um fio, nunca por
sombra.

### Named Rules

**The No-Shadow Rule.** Superfícies não levantam. Para separar dois planos, mude
o tom do fundo ou desenhe um fio. Um `box-shadow` neste sistema é defeito.

## Motion

> **Esta seção substitui a antiga "Still Surface Rule".** O sistema tinha zero
> `transition` quando foi documentado pela primeira vez. Hoje tem 18, todas
> deliberadas. A regra deixou de ser "não há movimento" e passou a ser
> "todo movimento tem justificativa e tem caminho alternativo".

O que se move, e por quê:

- **Entrada por rolagem** — a linha do gráfico desenha, o anel varre, os números
  contam. Serve para dar direção à leitura de um dado que cresce.
- **Faixa da temporada** — o fio May — October cresce com a rolagem. O gesto é o
  próprio conteúdo: a duração de uma estação.
- **Altura de tabela** — quando o filtro muda o número de linhas, a caixa
  transiciona. Sem isso o conteúdo abaixo salta.
- **Estado de controle** — cor e fundo em 0,18–0,25s. Troca de estado, não
  espetáculo.

### Named Rules

**The Reduced-Motion Rule.** Seis arquivos consultam `prefers-reduced-motion`.
Sob ele: a linha aparece pronta, o anel não varre, a contagem vai direto ao
número, o Lottie para no primeiro quadro, a altura muda sem transição. **Toda
animação nova precisa do mesmo caminho.**

**The `fromTo` Rule.** `gsap.from()` grava o estado **atual** como destino. Se o
nó for reconstruído enquanto está escondido, o destino vira "invisível" e o
elemento nunca mais aparece. Isso derrubou duas coisas aqui. Não há nenhum
`gsap.from()` no código hoje; mantenha assim.

## Shapes

Todo canto é reto. `border-radius` é `0` em toda parte, sem exceção — botões,
chips, cartões, campos, imagens e o mapa terminam em canto duro.

Bordas são sempre exatamente `1px`, sólidas, em Rule ou Rule Strong. O sistema
desenha linhas em vez de preencher caixas: divisores, fronteiras de seção,
fileiras de registro e cabeçalhos de coluna são o mesmo vocabulário de fio em
comprimentos diferentes. A silhueta resultante é retilínea e tipográfica, mais
perto de um livro-razão impresso do que de uma interface de cartões.

**Not everything is a card.** Borda, preenchimento, raio e sombra dizem "objeto
separado". Gaste por papel, levantando a coisa que precisa, em vez de carimbar
tudo.

## Components

### Buttons

- **Forma:** quadrada, borda de `1px`, `min-height: 48px`, padding
  `0 clamp(20px, 2cqw, 32px)`, rótulo no papel Controle
- **Primary:** fundo Ember, texto Ink, borda Ember. É a ação da seção
- **Ghost:** fundo transparente, texto Paper, borda Rule Strong. A alternativa ao
  lado da primária
- **Foco:** `2px solid Paper` com `outline-offset: 3px`

### Navigation

- **Item:** papel Navegação, `min-height: 44px`
- **Default Paper · Hover Ember Bright · Current Ember** com `aria-current="page"`
  e um fio de 1px embaixo — **duas pistas, nunca só a cor**
- **Cabeçalho:** sticky, `rgba(0,0,0,.9)` com `blur(12px)`, fio de 1px embaixo,
  `min-height: 78px`
- **Estreito:** abaixo de 800px a navegação larga some, o hambúrguer aparece e o
  Share desce para dentro do menu

### Chip

Grade ciente da contagem: dois ficam lado a lado, três viram 2+1 com o ímpar
atravessando a linha, quatro viram 2×2. Selecionado recebe fundo Ember Veil,
texto Ember e **peso 700** — o peso é a segunda pista.

### Table

Célula com três papéis: **Head** (papel Rótulo em 600, fio Rule Strong), **Text**
e **Number** (alinhado à direita, numeral tabular). A tabela rola dentro do
próprio contêiner, que carrega `contain: paint` — sem isso a página inteira ganha
359px de rolagem horizontal. Medido.

**Estado vazio:** quando o filtro não casa, uma linha com `colspan` total diz
quantos não casaram e oferece limpar a busca. A altura da caixa transiciona.

### State explorer (signature component)

O padrão que define o sistema. Mapa à esquerda, ranking à direita. Cada fileira
carrega: posto, nome do estado, `lead · agência`, uma barra proporcional ao maior
valor, e a contagem de starts. O selecionado troca **cor e fio**.

Estado sem registro aparece como **"Not yet reported"**, nunca estimado. Toda
figura viaja com sua procedência; separar as duas quebra a promessa do produto.

### Map panel

Mapa à esquerda, controles à direita; empilha no estreito. Os controles são
componentes reais — chips, CTA e o aviso de densidade ilustrativa. As telhas são
renderizadas pelo Mapbox em tempo real: **não são superfície de design**. Se o
token for recusado, o componente mostra a mensagem no lugar do canvas com os
controles intactos.

### Charts

Linha e anel, ambos com: entrada animada na aparição, leitura por hover e por
teclado, etiqueta presa ao ponto, e **uma tabela equivalente escondida no DOM**.
Um gráfico que só existe como desenho é ilegível para leitor de tela.

## Accessibility floor

O que está implementado e precisa sobreviver a qualquer mudança:

- `aria-current="page"` no item da página atual — afirma "você está aqui"
- `aria-live` / `role="status"` nos blocos que mudam por interação
- `aria-sort` nas colunas ordenáveis
- Tabela equivalente em cada gráfico
- Setas, `Home`/`End` e `Escape` nos gráficos
- Alvos de 24px no mínimo (WCAG 2.5.8); 44–48px nos controles principais
- Skip link com recorte, não `left:-9999px`
- Contraste calculado para todo par

## Do's and Don'ts

### Do

- **Do** dimensionar com `clamp(min, Ncqw, max)` contra o contêiner inline.
- **Do** separar planos com mudança de tom ou um fio de `1px`.
- **Do** parear tracking largo com caixa alta, e só com caixa alta.
- **Do** limitar todo bloco de texto com uma medida em `ch`.
- **Do** manter a figura e o caminho de volta à fonte no mesmo componente.
- **Do** dizer a ausência explicitamente — "Not filed", "Not yet reported",
  "3 of 50 filed" — em vez de omitir a linha.
- **Do** dar duas pistas a todo estado selecionado.
- **Do** calcular o contraste de todo par novo antes de aprová-lo.

### Don't

- **Don't** acrescentar `border-radius`. O sistema é quadrado em toda parte.
- **Don't** acrescentar `box-shadow`. Profundidade vem de tom e fio.
- **Don't** animar sem um caminho para `prefers-reduced-motion`.
- **Don't** usar `gsap.from()`. Sempre `fromTo`, com destino explícito.
- **Don't** introduzir uma terceira família tipográfica.
- **Don't** gastar a brasa em mais de poucos elementos por viewport.
- **Don't** usar `--rule` como cor de dado; ela some. Use `--chart-slack`.
- **Don't** usar cor como pista única.
- **Don't** preencher uma lacuna do registro para equilibrar uma composição.
