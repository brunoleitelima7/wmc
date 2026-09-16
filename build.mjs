/* build.mjs — monta as páginas estáticas a partir de partials compartilhados.
 *
 *   node build.mjs
 *
 * Entra:  pages/<nome>.html   corpo da página + um bloco de front-matter
 *         partials/*.html     cabeçalho, rodapé, blocos repetidos
 *         data/*.json         navegação e agências, fonte única dos dois
 * Sai:    <nome>.html na raiz — HTML estático puro, sem runtime.
 *
 * Por que build e não componente JS: cabeçalho, navegação e o aviso de fontes
 * precisam existir mesmo se o JavaScript falhar. O que sai daqui é HTML que o
 * navegador entende sozinho; o GitHub Pages serve sem nenhuma etapa extra.
 *
 * index.html fica FORA daqui de propósito: a home é um artboard do Claude
 * Design (.dc.html) e continua sendo copiada de lá.
 */
import { readFileSync, writeFileSync, readdirSync, existsSync, statSync } from "node:fs";
import { join, basename } from "node:path";

const raiz = import.meta.dirname;
const ler = (p) => readFileSync(join(raiz, p), "utf8");
const json = (p) => JSON.parse(ler(p));

/* Versão nos assets locais. O navegador servia arquivo velho e a página
   renderizava código antigo enquanto o disco já tinha o novo — aconteceu com
   metric-map.js e com site.js. Com a versão na URL, um arquivo alterado é uma
   URL nova e o cache deixa de ser um palpite. */
function v(caminho) {
  try {
    const st = statSync(join(raiz, caminho));
    const marca = Math.floor(st.mtimeMs).toString(36) + st.size.toString(36);
    return `${caminho}?v=${marca.slice(-8)}`;
  } catch {
    return caminho;                       // arquivo externo ou ausente: intocado
  }
}

const NAV = json("data/nav.json");

/* O rodapé repete a navegação e acrescenta o que não cabe no menu do topo.
   Sai da MESMA fonte: era escrito à mão em dois lugares, e foi assim que a home
   ganhou um "The agency list" que nenhuma outra página tinha. */
const RODAPE = [...NAV, { label: "By County", href: "county.html" }];


/* O cabeçalho existe em duas formas: o template dc do artboard da home e os
   partials daqui. Enquanto a home não migrar para este build, a navegação é
   copiada — então o build compara as duas e PARA se divergirem. Duplicação que
   grita é muito melhor que duplicação que silencia. */
(function conferirNavDaHome() {
  const artboard = "Wildfire Homepage v3 Night.dc.html";
  let src;
  try { src = ler(artboard); } catch { return; }          // artboard ausente: nada a conferir
  const bloco = src.match(/NAV = \[([\s\S]*?)\];/);
  if (!bloco) throw new Error(`${artboard}: não achei o array NAV para conferir`);

  const daHome = [...bloco[1].matchAll(/label:\s*"([^"]+)",\s*href:\s*"([^"]+)"/g)]
    .map((m) => `${m[1]} -> ${m[2]}`);
  const daqui = NAV.map((n) => `${n.label} -> ${n.href}`);

  const difere = daHome.length !== daqui.length ||
    daHome.some((v, i) => v !== daqui[i]);
  if (difere) {
    throw new Error(
      "A navegação da home e data/nav.json divergiram.\n" +
      "  artboard:      " + daHome.join(" | ") + "\n" +
      "  data/nav.json: " + daqui.join(" | ") + "\n" +
      "  Alinhe os dois antes de publicar."
    );
  }
  /* Mesma conferência para o rodapé: ele existe escrito à mão no artboard e
     gerado aqui, e foi exatamente aí que os dois divergiram. */
  const rodapeDaHome = [...src.matchAll(/class="wmc-footer-link" href="([^"]+)">([^<]+)</g)]
    .map((m) => `${m[2]} -> ${m[1]}`);
  const rodapeDaqui = RODAPE.map((n) => `${n.label} -> ${n.href}`);
  if (rodapeDaHome.length !== rodapeDaqui.length ||
      rodapeDaHome.some((v, i) => v !== rodapeDaqui[i])) {
    throw new Error(
      "O rodapé da home e o gerado por build.mjs divergiram.\n" +
      "  artboard: " + rodapeDaHome.join(" | ") + "\n" +
      "  build:    " + rodapeDaqui.join(" | ") + "\n" +
      "  Alinhe os dois antes de publicar."
    );
  }
  console.log("  navegação e rodapé da home conferem com data/nav.json");
})();
const AGENCIAS = json("data/agencies.json");
const FIGURAS = json("data/figures.json");

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/* --- blocos gerados a partir de dados ------------------------------------ */

/* `active: none` deixa a navegação sem item marcado. Marcar um item que não
   corresponde à página atual mente para quem usa leitor de tela: o aria-current
   afirma "você está aqui". Páginas fora da navegação principal não marcam nada. */
function navHTML(ativo, classeItem) {
  return NAV.map((n) => {
    const atual = ativo !== "none" && n.key === ativo ? ' aria-current="page"' : "";
    return `<a class="${classeItem}" href="${n.href}"${atual}>${esc(n.label)}</a>`;
  }).join("\n            ");
}

function rodapeHTML() {
  return RODAPE.map((n) =>
    `<a class="wmc-footer-link" href="${n.href}">${esc(n.label)}</a>`
  ).join("\n          ");
}

function agenciasHTML() {
  return AGENCIAS.map((a) => `<li>
              <a class="wmc-agency-name" href="https://${a.site}">${esc(a.name)}</a>
              <span class="wmc-agency-lines">
                <a href="https://twitter.com/${a.handle.slice(1)}">${esc(a.handle)}</a>
                <a href="tel:${a.phone.replace(/\s/g, "")}">${esc(a.phone)}</a>
                <a href="https://${a.site}">${esc(a.site)}</a>
                <span class="wmc-agency-addr">${esc(a.address)}</span>
              </span>
            </li>`).join("\n            ");
}

/* Os números do ano padrão saem daqui já escritos no HTML, e não montados por
   JavaScript: sem script a página abre com o ano padrão completo, e o seletor
   apenas troca o que já está lá. */
function figurasHTML(ano) {
  return FIGURAS.years[ano].map((f) => `<li>
                <p class="wmc-bigstat-label">${esc(f.label)}</p>
                <p class="wmc-bigstat-value">${esc(f.value)}${f.unit ? `<span class="wmc-bigstat-unit">${esc(f.unit)}</span>` : ""}</p>
                <p class="wmc-bigstat-note">${esc(f.note)}</p>
              </li>`).join("\n              ");
}

function anosHTML(padrao) {
  return FIGURAS.order.map((a) =>
    `<option value="${a}"${a === padrao ? " selected" : ""}>${a}</option>`
  ).join("\n                ");
}

/* --- montagem ------------------------------------------------------------ */

/* Front-matter: linhas `chave: valor` dentro de <!--meta ... --> no topo. */
function separar(src) {
  const m = src.match(/^<!--meta\s*([\s\S]*?)-->\s*/);
  if (!m) throw new Error("página sem bloco <!--meta -->");
  const meta = {};
  for (const linha of m[1].trim().split("\n")) {
    const i = linha.indexOf(":");
    if (i > 0) meta[linha.slice(0, i).trim()] = linha.slice(i + 1).trim();
  }
  return { meta, corpo: src.slice(m[0].length) };
}

function preencher(tpl, vars) {
  return tpl.replace(/\{\{\s*(\w+)\s*\}\}/g, (todo, k) =>
    k in vars ? vars[k] : todo
  );
}

const head = ler("partials/head.html");
const header = ler("partials/header.html");
const footer = ler("partials/footer.html");

const paginas = readdirSync(join(raiz, "pages")).filter((f) => f.endsWith(".html"));
if (!paginas.length) throw new Error("nenhuma página em pages/");

let n = 0;
for (const arquivo of paginas) {
  const { meta, corpo } = separar(ler(join("pages", arquivo)));
  for (const obrigatorio of ["title", "description", "active"]) {
    if (!meta[obrigatorio]) throw new Error(`${arquivo}: falta "${obrigatorio}" no <!--meta -->`);
  }

  /* Bibliotecas de terceiros, com integridade fixa. Cada tag sai FECHADA:
     um <script> sem </script> engole o markup seguinte como conteúdo — foi
     assim que o topojson desapareceu da página. */
  const tag = (src, sri) =>
    `<script src="${src}" integrity="${sri}" crossorigin="anonymous"><\/script>`;

  const VENDOR_MAPBOX = [
    '<link rel="stylesheet" href="https://unpkg.com/mapbox-gl@3.9.0/dist/mapbox-gl.css" integrity="sha384-GTsgKcJXGSkBp0M68qpxkz9XovzVH0PwSrjYONvkn3tXtySOSq+a14bG2gVJHwQG" crossorigin="anonymous">',
    tag("https://unpkg.com/mapbox-gl@3.9.0/dist/mapbox-gl.js", "sha384-QRI8HEhaDamjVGfoos6X0AB+VVxCE4fAm6jaRZqcMn8mPsbxJvCc8cyG3Wu/+Pyq"),
  ].join("\n");

  /* O state-explorer projeta os estados com D3 + topojson antes de entregar os
     limites ao Mapbox; sem eles o painel monta mas o mapa não. */
  const VENDOR_D3 = [
    tag("https://unpkg.com/d3@7.9.0/dist/d3.min.js", "sha384-CjloA8y00+1SDAUkjs099PVfnY2KmDC2BZnws9kh8D/lX1s46w6EPhpXdqMfjK6i"),
    tag("https://unpkg.com/topojson-client@3.1.0/dist/topojson-client.min.js", "sha384-Ukv1p/xTma6P4/2bY5KzWBw+ydSpXmhCMtyciIQVDJ1RmOxtCYNMF1uXT9T63H67"),
  ].join("\n");

  const usaMapa = /mapbox-token\.js/.test(meta.scripts || "");
  const usaExplorer = /state-explorer\.js/.test(meta.scripts || "");

  const vars = {
    VENDOR: (usaExplorer ? VENDOR_D3 + "\n" : "") + (usaMapa ? VENDOR_MAPBOX : ""),
    V_STYLES: v("styles.css"),
    V_SITE: v("site.js"),
    V_MARK: v("wmc-mark.svg"),
    V_FAV32: v("favicon-32.png"),
    V_ICON180: v("icon-180.png"),
    TITLE: esc(meta.title),
    DESCRIPTION: esc(meta.description),
    NAV_WIDE: navHTML(meta.active, "wmc-nav-item"),
    NAV_MENU: navHTML(meta.active, "wmc-menu-item"),
    AGENCIES: agenciasHTML(),
    FOOTER_NAV: rodapeHTML(),
    FIGURES: figurasHTML(FIGURAS.default),
    FIGURE_YEARS: anosHTML(FIGURAS.default),
    /* Dados embutidos como <script type="application/json">: a página não faz
       fetch, funciona offline e o conteúdo chega junto com o HTML. */
    DATA: (meta.data || "")
      .split(",").map((s) => s.trim()).filter(Boolean)
      .map((nome) => `<script type="application/json" id="wmc-data-${nome}">` +
        JSON.stringify(json(`data/${nome}.json`)) + `<\/script>`).join("\n"),
    // Scripts só onde a página precisa: nenhuma carrega Mapbox à toa.
    SCRIPTS: (meta.scripts || "")
      .split(",").map((s) => s.trim()).filter(Boolean)
      .map((src) => `<script src="${v(src)}" defer></script>`).join("\n"),
  };

  const saida = preencher(
    head + "\n" + header + "\n" + corpo.trimEnd() + "\n" + footer,
    vars
  );

  const destino = basename(arquivo);
  writeFileSync(join(raiz, destino), saida);
  console.log(`  ${destino.padEnd(16)} ${(saida.length / 1024).toFixed(1)} KB`);
  n++;
}
console.log(`\n${n} página(s) montada(s).`);

/* Guarda: index.html é da home e não pode ser sobrescrito por este script. */
if (existsSync(join(raiz, "pages/index.html"))) {
  throw new Error("pages/index.html sobrescreveria a home vinda do artboard");
}
