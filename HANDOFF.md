# Handoff — Wildfire Media Coverage

Como implementar estas páginas. Escrito para quem vai construir, não para quem
vai aprovar.

Três documentos, três funções:

| arquivo | responde |
|---|---|
| `PRODUCT.md` | o que o produto afirma e o que ele se recusa a afirmar |
| `DESIGN.md` | por que o sistema visual é como é |
| **`HANDOFF.md`** | **como implementar sem repetir os erros já cometidos** |

O Figma correspondente está na página **Design** do arquivo do teste, ao lado da
página Wireframes. Lá estão 7 telas a 1440, 2 a 390, o guia de estilo, 6
conjuntos de variantes e 9 componentes.

---

## 0. Procedência e direção visual

### A ordem do trabalho

**O desenho veio primeiro.** Os wireframes de baixa fidelidade foram feitos no
Figma, e é deles que saíram as páginas — cada tela implementada corresponde a um
frame daquele arquivo. A página **Design**, no mesmo arquivo, é a versão de alta
fidelidade do mesmo sistema: tokens, componentes e as telas montadas com eles.

Consequência prática para quem implementa: **o Figma é a especificação.** Quando
implementação e Figma divergirem, o Figma decide.

A exceção está registrada na seção 10. Aquelas dez armadilhas nasceram na
implementação — só aparecem quando o navegador roda — e voltaram para o desenho
depois de corrigidas. O Figma de hoje já as incorpora.

Para que os dois não se separem de novo, **cada variável do Figma carrega o nome
do token CSS na descrição**. Uma cor ou um espaçamento é verificável nos dois
lados sem depender de memória.

### Por que este visual

**O briefing não nomeia a marca do cliente, nem paleta, nem tom visual.** As
decisões de design declaradas eram outras: Bootstrap v5.2 e *linguagem ativa de
engajamento com a causa*. Sem direção de marca, inventar uma seria arriscar
contradizer o que o cliente já tem — e amarrar o entregável a uma identidade que
talvez precise ser descartada.

A escolha foi por um registro **editorial e neutro**, que sustenta o assunto sem
competir com ele:

- **Fundo escuro com um único acento quente.** O tema é fogo; um segundo acento
  diluiria o único sinal que precisa ser lido de longe.
- **Fios de 1px em vez de cartões.** A informação é tabular e densa. Borda,
  preenchimento, raio e sombra são gastos por papel, não aplicados a tudo.
- **Tipografia como estrutura.** Os quatro papéis de caixa alta (seção 3) fazem o
  trabalho que, num visual de marca, ícones e cores fariam.
- **Nenhuma ilustração de marca.** As únicas imagens são fotografia documental e
  os mapas — conteúdo, não ornamento.

**Isto é substituível de propósito.** Se a marca do cliente existir, o que muda é
a paleta e o par tipográfico: são treze variáveis de cor e dois nomes de fonte,
todos num único bloco `:root`. A estrutura — os papéis de rótulo, a grade, os
componentes, os limiares responsivos — sobrevive à troca sem reescrita.

---

## 1. A premissa aberta: Bootstrap

**O briefing nomeia Bootstrap v5.2 como decisão de design. O que está construído
não usa Bootstrap.** Isso está registrado em `PRODUCT.md` desde o início como
conflito aberto; este documento é onde ele se resolve.

O que existe hoje é CSS próprio com **container queries**, custom properties,
`:has()` e subgrid. A escolha não foi estética: o layout precisa reagir à
largura do **contêiner**, não da janela — o painel do mapa ocupa metade da tela
em algumas páginas e a largura inteira em outras, e a mesma grade de chips
precisa se comportar diferente nos dois casos. Media query não vê essa
diferença.

Há dois caminhos honestos. Escolha um e registre a escolha:

### Caminho A — manter o CSS próprio (recomendado)

Justifique no entregável: container queries resolvem um requisito que o grid do
Bootstrap não resolve, e o peso cai de ~60KB (CSS do Bootstrap) para os ~40KB de
`styles.css`, sem JavaScript de componente. É uma decisão defensável desde que
**dita**, não omitida.

### Caminho B — implementar em Bootstrap 5.2

Funciona, com três avisos concretos:

1. **O grid de 12 colunas não cobre os casos count-aware.** A grade de chips
   muda de forma conforme o *número de opções* (2 lado a lado, 3 vira 2+1 com o
   ímpar atravessando, 4 vira 2×2). Em Bootstrap isso exige classes por caso ou
   um utilitário próprio — o seletor `:has(> :nth-child(3):last-child)` não tem
   equivalente em utilitário.
2. **Os breakpoints do Bootstrap medem a janela.** Os nossos medem o contêiner
   (lista na seção 4). Se migrar, os limiares mudam de significado e o painel do
   explorador volta a quebrar errado em janelas largas — foi um bug real aqui.
3. **Sobrescreva os tokens, não as classes.** Bootstrap 5.2 lê custom
   properties: mapeie `--bs-body-bg` → `--ink`, `--bs-body-color` → `--paper`,
   `--bs-primary` → `--ember`, `--bs-border-color` → `--rule`. Não redeclare
   `.btn` inteiro.

Em qualquer caminho, **o sistema de tokens da seção 3 é a fonte da verdade**.

---

## 2. Arquitetura de entrega

```
pages/*.html     corpo de cada página + front-matter em <!--meta -->
partials/        head, header, footer compartilhados
data/*.json      nav, agências, estados, figuras — fonte única
build.mjs        monta pages + partials + data → *.html na raiz
serve.mjs        servidor de desenvolvimento COM HTTP Range
```

`node build.mjs` gera as seis páginas estáticas. A home é a exceção: ela é um
artboard do Claude Design (`Wildfire Homepage v3 Night.dc.html`) e é **copiada**
para `index.html`. Sempre que mexer no artboard:

```bash
cp "Wildfire Homepage v3 Night.dc.html" index.html && node build.mjs
```

O build tem duas guardas que **param a montagem** se a navegação ou o rodapé do
artboard divergirem de `data/nav.json`. Duplicação que grita é melhor que
duplicação que silencia — foi assim que a home ganhou um item de menu que
nenhuma outra página tinha.

**Assets versionados.** `build.mjs` põe `?v=<mtime+size>` nas URLs locais. Sem
isso o navegador serve arquivo velho enquanto o disco já tem o novo — aconteceu
três vezes durante o desenvolvimento e custou horas de diagnóstico errado.

---

## 3. Do Figma ao código: tokens

Os tokens são o contrato entre o desenho e o código. Cada variável do Figma
carrega o nome do token CSS na descrição, e cada token CSS tem uma variável
correspondente — a checagem é de olho, não de memória.

**Cores** (13): `--ink`, `--surface-raised`, `--surface-card`, `--rule`,
`--rule-strong`, `--paper`, `--paper-dim`, `--muted`, `--ember`,
`--ember-bright`, `--ember-deep`, `--ember-veil`, `--chart-slack`.

Um único acento quente. Se aparecer um segundo laranja, é erro.

**Tipografia.** Inter para títulos e números, Krub para corpo e rótulos. Os
tamanhos são fluidos: `clamp(mínimo, cqw, máximo)`. O Figma é estático, então
cada extremo virou um estilo — o desktop guarda o máximo resolvido a 1440, o
grupo `Mobile/` guarda o mínimo medido a 390. **Não são overrides; são as duas
pontas do mesmo token.**

**Os quatro papéis de caixa alta.** Está registrado num comentário do
`styles.css` porque o projeto chegou a ter sete trackings diferentes para a
mesma coisa:

| papel | peso | tracking | onde |
|---|---|---|---|
| Rótulo | 500 ou 600 | `.24em` | kicker, meta, legenda de dado, cabeçalho de coluna |
| Controle | 600 ou 700 | `.20em` | botão, chip, traço da trilha |
| Navegação | 500 | `.20em` | item de menu |
| Assinatura | 500 | `.30em` | "MEDIA COVERAGE" sob a marca |

**O peso carrega estado; o tracking carrega papel. Se precisar de um valor novo,
o papel é que tem que ser novo.**

> Há uma deriva conhecida: o `state-explorer.js` usa `.14em` inline no posto e em
> "recorded starts". É um quinto valor sem papel. Alinhe ao papel Rótulo.

---

## 4. Responsividade

**São container queries, não media queries.** Elas medem o contêiner. Foi por
isso que o painel do explorador ficava em 2+1 numa janela de 1280: quem decide
ali é a largura do painel, não a da tela. Se você trocar por media query, esse
bug volta.

Limiares medidos:

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

### Três armadilhas que custaram caro

**`1fr` não é `minmax(0, 1fr)`.** `1fr` é `minmax(auto, 1fr)`: o mínimo é o
conteúdo. Um mapa com min-content largo esticou o lede para 512px numa viewport
de 280px. Vinte grades foram corrigidas. **Use sempre `minmax(0, 1fr)`.**

**`overflow-x: hidden` recorta, não resolve.** Ele esconde o estouro e o
conteúdo some sem deixar rastro — pior que rolar, porque some do teste também.
Corrija a causa.

**`contain: paint` no contêiner de rolagem da tabela.** Sem ele, a tabela
desaparece da vista mas continua somando ao canvas do documento, e a **página
inteira** ganha 359px de rolagem horizontal. Medido. Não remova.

---

## 5. Acessibilidade

O que já está implementado e **precisa ser preservado**:

- **`aria-current="page"`** no item de navegação da página atual (16 ocorrências).
  Ele afirma "você está aqui" — nunca marque um item que não corresponde.
- **`aria-live` / `role="status"`** nos blocos que mudam por interação: o
  destaque do estado, o contador do filtro, a leitura do gráfico. Escolher um
  estado reescreve manchete **e** números, e os dois são anunciados como um
  resultado só.
- **`aria-sort`** nas colunas ordenáveis (23 ocorrências).
- **Tabela equivalente escondida** (`.wmc-sr`) em cada gráfico. Um gráfico que só
  existe como desenho é ilegível para leitor de tela. O SVG é `role="img"` com
  descrição; a tabela carrega os mesmos números.
- **Navegação por teclado** nos gráficos: setas percorrem os pontos, `Home`/`End`
  vão às pontas, `Escape` limpa. A leitura no hover não é exclusiva do mouse.
- **Alvos de 24px no mínimo** (WCAG 2.5.8). O × de limpar a busca tem caixa de
  24×24 com o traço a 11px.
- **Skip link** para o conteúdo, com recorte em vez de `left:-9999px` —
  deslocamento negativo já arrastou a caixa do documento aqui.

### Contraste é calculado, não olhado

Todo par foi medido. Exemplos: `--muted` sobre `--ink` dá **7,35:1**;
`--chart-slack` foi escolhido por cálculo para dar **3,17:1**, o mínimo de 1.4.11
para gráfico — `--rule` dá 1,6:1 e some quando vira dado. Sobre foto, o cálculo
usa o pior caso composto sob o véu.

**Nunca use cor como pista única.** O estado selecionado troca cor **e** peso
(chip), ou cor **e** fio (item do explorador, item de menu).

### Movimento reduzido

Seis arquivos consultam `prefers-reduced-motion`. Sob ele: a linha do gráfico
aparece pronta, o anel não varre, a contagem vai direto ao número, o Lottie para
no primeiro quadro, e a altura da tabela muda sem transição. **Qualquer animação
nova precisa do mesmo caminho.**

---

## 6. Mapbox — de onde estamos para banda e raster

Versão fixada: **mapbox-gl 3.9.0**. Os nomes de propriedade abaixo foram
conferidos contra a especificação de estilo v8, não escritos de memória.

### Token

`mapbox-token.js` é a fonte única. É um token **`pk.`** (público) e ele já é
visível no JavaScript de qualquer site publicado — esconder não protege.

**O que protege é restringir por URL** no painel: Account → Tokens → URL
restrictions. Faça isso **antes** de o repositório virar público. **Nunca ponha
um `sk.` aqui.**

### O que existe hoje

Duas fontes GeoJSON e camadas vetoriais:

- `metric-map.js` — fonte `field` (geojson) + camada `field-heat` do tipo
  `heatmap`, com `heatmap-weight`, `-intensity`, `-radius`, `-opacity`, `-color`.
- `state-explorer.js` — fonte `states` (geojson, `promoteId: "name"`) + camadas
  `fill` e `line`, com a seleção destacada numa terceira camada.

Isso serve densidade de pontos. **Não serve dado contínuo** — temperatura,
índice de fumaça, velocidade de vento, umidade de combustível. Para isso o
caminho é raster.

### Raster simples (imagem já colorida)

Quando o dado já vem renderizado como imagem (satélite, cicatriz de queimada):

```js
map.addSource("burn-scar", {
  type: "raster",
  tiles: ["https://exemplo/{z}/{x}/{y}.png"],
  tileSize: 256                       // 512 é o padrão; use o do seu serviço
});
map.addLayer({
  id: "burn-scar",
  type: "raster",
  source: "burn-scar",
  paint: { "raster-opacity": 0.8, "raster-resampling": "linear" }
});
```

### Raster com bandas — `raster-array`

É isto que carrega dado de banda. A fonte guarda **várias grandezas por tile**, e
a camada escolhe qual exibir.

```js
map.addSource("clima", {
  type: "raster-array",
  url: "mapbox://SEU_TILESET",        // TileJSON; ou use `tiles: [...]`
  tileSize: 512
});

map.addLayer({
  id: "fumaca",
  type: "raster",
  source: "clima",
  "source-layer": "smoke",            // a camada de dados dentro do tile
  paint: {
    "raster-array-band": "2023-09-14T12:00:00Z",   // QUAL banda
    "raster-color": [                              // como colorir
      "interpolate", ["linear"], ["raster-value"],
      0,   "rgba(0,0,0,0)",
      40,  "#595D62",
      120, "#E8613C",
      250, "#F4835F"
    ],
    "raster-color-range": [0, 250],
    "raster-opacity": 0.85
  }
});
```

Pontos que a especificação deixa explícitos e que costumam morder:

- **`raster-array-band`** é `string` e **exige fonte `raster-array`**. Sem ele,
  a primeira banda é exibida.
- **`raster-color`** é parametrizado pela expressão **`["raster-value"]`**, não
  por `["get", ...]`.
- **`raster-color-range`** define o intervalo mapeado na rampa. Para
  `raster-array` o valor é **o dado decodificado na unidade da própria fonte**, e
  se você omitir a propriedade o Mapbox usa o intervalo declarado pela fonte.
  Para raster comum, o padrão vira `[0, 1]`.
- **`raster-color-mix`** só vale para fontes **não**-`raster-array` — ela combina
  os canais RGB. **Fontes `raster-array` ignoram.** O padrão
  `[0.2126, 0.7152, 0.0722, 0]` é luminosidade.
- **`raster-color-scale`** (`linear` por padrão) exige `raster-color` **e** fonte
  `raster-array`.
- **`rasterLayers`**, na fonte, descreve as camadas de dados e **as bandas
  contidas nos tiles** — é por ali que a UI monta o seletor de banda em vez de
  ter a lista escrita à mão.

### Trocar de banda em tempo de execução

O seletor de ano/variável do painel deve chamar:

```js
map.setPaintProperty("fumaca", "raster-array-band", novaBanda);
```

Não recrie a camada a cada troca — o tile já está em memória e a troca é barata.

### Vento e fluxo — `raster-particle`

Existe um tipo de camada dedicado, alimentado por `raster-array`:

```js
map.addLayer({
  id: "vento",
  type: "raster-particle",
  source: "clima",
  "source-layer": "10winds",
  paint: {
    "raster-particle-array-band": banda,
    "raster-particle-count": 2048,        // padrão 512
    "raster-particle-speed-factor": 0.4,  // padrão 0.2
    "raster-particle-color": [
      "interpolate", ["linear"], ["raster-particle-speed"],
      0,  "#595D62",
      20, "#E8613C"
    ],
    "raster-particle-max-speed": 25
  }
});
```

Note que a cor é parametrizada por **`["raster-particle-speed"]`**, não por
`raster-value`.

**Sob `prefers-reduced-motion`, não adicione a camada de partículas.** Ela é
animação contínua e não tem estado parado útil.

### Onde encaixar no componente

`metric-map.js` já tem a estrutura certa: `PRESETS` descreve grupos de controle
(`choice` vira chips, `select` vira `<select>`), e `_controles()` os renderiza. Um
preset novo de raster é um objeto a mais em `PRESETS` — a UI sai de graça. O que
muda é `_camadas()`: em vez de `addSource` geojson, `raster-array` + a camada
raster, e o handler de troca chama `setPaintProperty`.

### Degradação

Toda página que usa mapa precisa continuar legível sem ele. Hoje: se o token for
recusado ou o init falhar, o componente chama `_fail()` e mostra a mensagem no
lugar do canvas, com os controles e o CTA intactos. **Mantenha isso** — a tabela
abaixo do mapa é a fonte verificável, o mapa é a ilustração.

---

## 7. GSAP

Versão fixada: **3.13.0**, mais o plugin **SplitText**.

### A regra: `fromTo`, nunca `.from()`

`gsap.from()` grava o **estado atual** do elemento como destino. Se o nó for
reconstruído enquanto está escondido — por resize, por re-render do runtime —
o destino vira "invisível" e o elemento nunca mais aparece.

Isso derrubou duas coisas aqui: a CTA da hero ficou presa em `y:16`, e a régua
de maio–outubro ficou permanentemente invisível. **Não há nenhum `gsap.from()`
no código hoje. Mantenha assim.**

```js
// errado
gsap.from(el, { y: 28, autoAlpha: 0 });

// certo — destino explícito
gsap.fromTo(el, { y: 28, autoAlpha: 0 }, { y: 0, autoAlpha: 1 });
```

### A home roda sobre React

O artboard é interpretado por um runtime React. **Ele reescreve o atributo
`style` dos nós que administra.** Consequência: uma animação que vive no estilo
inline pode ser apagada sem aviso, e o cache interno do GSAP passa a discordar
do DOM.

A faixa May — October foi reescrita por causa disso: o progresso agora sai em
**custom properties no `<html>`** e o CSS desenha. O `<html>` está fora da árvore
do React, e uma custom property não tem estado interno para divergir.

**Se precisar animar algo na home, prefira esse padrão a escrever no `style` de
um nó administrado pelo React.**

### Timelines atreladas à rolagem

Pausadas, com `progress()` interpolado por amortecimento (`0.12`) num
`requestAnimationFrame`. Cuidado: **`progress(0)` numa timeline que já está em 0
não pinta nada** — o estado inicial nunca chega ao DOM e o elemento aparece
pronto, pisca, e só então anima. Foi exatamente esse o bug da faixa da temporada.

### SplitText

Usado nos blocos `[data-lines]`. Ele **reescreve os filhos do elemento**. Na home
isso convive com o React por sorte, não por projeto — é o próximo candidato a
`removeChild` se aquele ramo re-renderizar. Se for mexer ali, considere mover o
bloco para um custom element, como foi feito com o Lottie.

---

## 8. Lottie

Versão fixada: **lottie-web 5.12.2** (build `lottie_light`), renderer `svg`.

A pista de rolagem do primeiro fold é um **custom element** (`scroll-hint.js`),
não um `loadAnimation` solto. O motivo é concreto: antes o SVG era injetado num
`<div>` administrado pelo React; ao re-renderizar, o React tentava remover um nó
que não criou e disparava `NotFoundError` em `removeChild` — erro que chegou a
**deixar a página inteira em branco**.

Montado por `<x-import>`, o SVG vive **dentro** do custom element e o React trata
o elemento como opaco.

Outros pontos:

- A biblioteca vem de `<script>` no topo e pode não ter chegado quando o
  elemento monta. Há um retry a cada 150ms, com desistência em ~9s.
- O JSON já vem recolorido (4 camadas em ember, 2 em cinza claro). **Não mexa em
  cor no código** — recolore o JSON.
- Sob movimento reduzido: `loop: false`, `autoplay: false` e `goToAndStop(0)`.

---

## 9. O vídeo da hero

```html
<video data-hero-video autoplay muted loop playsinline preload="metadata"
       poster="hero-poster.jpg" aria-hidden="true" tabindex="-1">
  <source src="hero.mp4" type="video/mp4">
</video>
```

Cada atributo tem função: `muted` + `playsinline` é o que permite autoplay em
iOS; `aria-hidden` + `tabindex="-1"` tiram o vídeo decorativo da árvore de
acessibilidade e da ordem de foco; `poster` é o primeiro quadro enquanto carrega.

### O servidor precisa responder HTTP Range

**`python -m http.server` responde 200 a uma requisição Range em vez de 206.**
Safari e vários players **exigem** Range para tocar `<video>` — com 200 o vídeo
simplesmente não começa. Chromium tolera, o que torna o defeito invisível num
navegador e não no outro.

Foi por isso que `serve.mjs` existe: ele implementa 206 de verdade. **Rode
`node serve.mjs` para desenvolver, não o servidor do Python.** GitHub Pages
atende Range corretamente.

### Peso

`hero.mp4` tem **18,2MB** e já está no histórico do git permanentemente. Antes de
publicar:

- gere uma versão de ~2–4MB (720p, CRF mais alto) e ofereça `hero.mp4` só a
  quem tem banda, ou
- troque por `poster` + um loop curto, ou
- sirva por CDN com `Range` e deixe o repositório com o poster apenas.

`preload="metadata"` já evita baixar o arquivo inteiro na primeira pintura, mas
não resolve o peso para quem chega ao fim do download.

### Sem JavaScript, sem autoplay

O poster é a mesma imagem do primeiro quadro, então a hero continua legível. Não
há texto sobre o vídeo que dependa do movimento.

---

## 10. Armadilhas medidas

Catálogo curto do que já quebrou aqui. Cada item foi reproduzido e medido, não
suposto.

| sintoma | causa | correção |
|---|---|---|
| Elemento animado nunca aparece | `gsap.from()` gravou o estado escondido como destino | `fromTo` com destino explícito |
| Elemento aparece pronto, pisca, então anima | `progress(0)` numa timeline já em 0 não pinta | custom property no `<html>` + CSS |
| Página inteira em branco | `removeChild` num nó injetado num `<div>` do React | custom element via `<x-import>` |
| 359px de rolagem horizontal na página | tabela escapando do contêiner de rolagem | `contain: paint` |
| Conteúdo some sem rastro | `overflow-x: hidden` recortando estouro | corrigir a causa; `minmax(0, 1fr)` |
| Código novo no disco, comportamento velho na tela | cache HTTP | `?v=` nos assets, feito por `build.mjs` |
| Vídeo não toca no Safari | servidor responde 200 a Range | `serve.mjs` (206) |
| Rótulo com espaçamento diferente entre telas | `.wmc-label` herdava margem do `<p>` | `margin: 0` na origem |
| Texto do eixo do gráfico a 3,6px | viewBox fixo + `preserveAspectRatio="none"` | viewBox em px reais + ResizeObserver |
| Etiqueta do gráfico presa no canto | `offsetLeft` não existe em SVG → `NaN` | `getBoundingClientRect()` |

---

## 11. Checklist de aceite

Antes de considerar uma página pronta:

- [ ] `node build.mjs` passa sem erro (as guardas de navegação e rodapé passam)
- [ ] `index.html` está sincronizado com o artboard
- [ ] Zero rolagem horizontal de 320px a 1920px
- [ ] Nenhum texto cortado; nenhum rótulo truncado
- [ ] Navegação por teclado alcança tudo, com foco visível
- [ ] Todo gráfico tem tabela equivalente no DOM
- [ ] `prefers-reduced-motion` testado — nada anima, tudo aparece no estado final
- [ ] Contraste calculado para todo par novo (≥4,5:1 texto, ≥3:1 gráfico e UI)
- [ ] Estado selecionado tem duas pistas, nunca só cor
- [ ] Token do Mapbox restrito por URL no painel
- [ ] Vídeo testado num servidor que responde 206

---

## 12. O que ficou em aberto

Honestamente, para não virar surpresa:

- **`hero.mp4` (18MB) e `treeline.svg` (2MB)** estão no histórico do git.
- **O mapa de condados** usa a foto da hero como placeholder, não um coroplético
  real.
- **As séries dos gráficos são ilustrativas** e estavam rotuladas como tal; o
  rótulo visível foi removido a pedido, mas a legenda da tabela escondida ainda
  registra a procedência. Decida se quer simetria.
- **O cabeçalho e o rodapé existem em duas formas** — template do artboard e
  partials. As guardas do build tornam a divergência barulhenta, mas não removem
  a duplicação. Migrar a home para o build resolveria.
- **GitHub Pages** não está habilitado; em repositório privado exige plano pago.
