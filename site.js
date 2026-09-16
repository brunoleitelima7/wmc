/* site.js — comportamento compartilhado das páginas estáticas.
 *
 * Tudo aqui é progressivo: sem JavaScript a página continua navegável, o menu
 * fica aberto (o atributo hidden é removido no HTML só quando há JS para
 * fechá-lo) e as tabelas seguem legíveis na ordem em que vieram.
 *
 * Os listeners são delegados no documento — nenhum fica preso a um nó, o que
 * também evita o problema que derrubou a home quando código externo mexia em
 * nós administrados por outro runtime.
 */
(function () {
  "use strict";

  /* --- menu estreito ---------------------------------------------------- */
  document.addEventListener("click", function (e) {
    var b = e.target.closest && e.target.closest("[data-menu-toggle]");
    if (!b) return;
    var menu = document.getElementById(b.getAttribute("aria-controls"));
    if (!menu) return;
    var abrindo = menu.hasAttribute("hidden");
    menu.toggleAttribute("hidden", !abrindo);
    b.setAttribute("aria-expanded", abrindo ? "true" : "false");
  });

  /* --- Share ------------------------------------------------------------
     Há um botão no cabeçalho, um no menu e um no rodapé: o aviso sai ao lado
     do que foi clicado, senão aparece fora da vista. */
  document.addEventListener("click", function (e) {
    var b = e.target.closest && e.target.closest("[data-share]");
    if (!b) return;
    var status = (b.parentElement && b.parentElement.querySelector("[data-share-status]")) ||
      document.querySelector("[data-share-status]");
    var url = location.href;
    function avisar(txt) {
      if (!status) return;
      status.textContent = txt;
      setTimeout(function () { if (status.isConnected) status.textContent = ""; }, 2400);
    }
    if (navigator.share) { navigator.share({ title: document.title, url: url }).catch(function () {}); return; }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url)
        .then(function () { avisar("Link copied"); })
        .catch(function () { avisar("Copy failed"); });
      return;
    }
    avisar("Copy this page URL");
  });

  /* --- destaque do estado ------------------------------------------------
     Escolher um estado no explorador reescreve o bloco de destaque.

     A regra que manda aqui é a do PRODUCT.md: só se mostra o que foi filado.
     Um estado sem registro NÃO recebe número estimado — recebe a lacuna dita
     em palavras. É por isso que Texas e Oregon aparecem sem contenção e sem
     acres: eles filaram a contagem e não filaram o resto. */
  var DADOS = (function () {
    var el = document.getElementById("wmc-data-states");
    if (!el) return null;
    try { return JSON.parse(el.textContent); } catch (e) { return null; }
  })();

  function stat(valor, rotulo) {
    var v = valor == null
      ? '<span class="wmc-keystat-value wmc-keystat-value--blank">Not filed</span>'
      : '<span class="wmc-keystat-value">' + valor + "</span>";
    return "<li>" + v + '<span class="wmc-keystat-label">' + rotulo + "</span></li>";
  }

  document.addEventListener("wmc:state-chosen", function (e) {
    if (!DADOS) return;
    var claim = document.querySelector("[data-state-claim]");
    var stats = document.querySelector("[data-state-stats]");
    if (!claim || !stats) return;

    var nome = e.detail.name;
    var rec = (DADOS.filed || {})[nome];
    var ano = DADOS.year;

    claim.textContent = rec && rec.wildfires != null
      ? rec.wildfires.toLocaleString("en-US") + " wildfires burning across " + nome + " in " + ano
      : nome + " filed no wildfire record for " + ano;

    stats.innerHTML = rec
      ? stat(rec.contained, "Contained overall") +
        stat(rec.acres, "Acres burned") +
        stat(rec.agency, "Reporting agency")
      : stat(null, "Contained overall") + stat(null, "Acres burned") + stat(null, "Reporting agency");
  });

  /* --- números do ano ----------------------------------------------------
     O seletor troca os três números do topo da página de agências.

     A página já vem com o ano padrão escrito no HTML pelo build: sem
     JavaScript ela abre completa, e este bloco só substitui o conteúdo. Por
     isso a lista não é montada aqui na carga — se fosse, quem não tem script
     veria um buraco.

     Cada ano traz suas PRÓPRIAS notas. A frase "maior que Maryland" depende da
     área daquele ano; reaproveitá-la nos outros anos seria afirmar algo falso
     sobre um número diferente. */
  var FIGURAS = (function () {
    var el = document.getElementById("wmc-data-figures");
    if (!el) return null;
    try { return JSON.parse(el.textContent); } catch (e) { return null; }
  })();

  function esc(t) {
    return String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  document.addEventListener("change", function (e) {
    var sel = e.target.closest && e.target.closest("[data-figures-year]");
    if (!sel || !FIGURAS) return;
    var lista = document.querySelector("[data-figures-list]");
    var itens = FIGURAS.years[sel.value];
    if (!lista || !itens) return;
    lista.innerHTML = itens.map(function (f) {
      return "<li>" +
        '<p class="wmc-bigstat-label">' + esc(f.label) + "</p>" +
        '<p class="wmc-bigstat-value">' + esc(f.value) +
        (f.unit ? '<span class="wmc-bigstat-unit">' + esc(f.unit) + "</span>" : "") + "</p>" +
        '<p class="wmc-bigstat-note">' + esc(f.note) + "</p>" +
        "</li>";
    }).join("");
  });

  /* --- tabelas: busca e ordenação ---------------------------------------
     Opera sobre as linhas que já estão no HTML. Sem JS a tabela continua
     completa e ordenada como veio do servidor. */
  function celulas(tr) { return [].slice.call(tr.children); }

  function valor(td) {
    var t = td.getAttribute("data-sort") !== null
      ? td.getAttribute("data-sort")
      : td.textContent.trim();
    var n = parseFloat(String(t).replace(/[,\s]/g, ""));
    return isNaN(n) ? String(t).toLowerCase() : n;
  }

  document.addEventListener("click", function (e) {
    var th = e.target.closest && e.target.closest("th[data-sortable]");
    if (!th) return;
    var tabela = th.closest("table");
    var corpo = tabela.tBodies[0];
    var i = celulas(th.parentElement).indexOf(th);
    var asc = th.getAttribute("aria-sort") !== "ascending";

    [].forEach.call(tabela.querySelectorAll("th[data-sortable]"), function (o) {
      o.setAttribute("aria-sort", "none");
    });
    th.setAttribute("aria-sort", asc ? "ascending" : "descending");

    var linhas = [].slice.call(corpo.rows);
    linhas.sort(function (a, b) {
      var x = valor(a.cells[i]), y = valor(b.cells[i]);
      if (x < y) return asc ? -1 : 1;
      if (x > y) return asc ? 1 : -1;
      return 0;
    });
    linhas.forEach(function (r) { corpo.appendChild(r); });
  });

  /* A caixa de rolagem muda de altura a cada tecla. Sem transição o conteúdo
     abaixo salta; com ela o movimento ganha direção.

     Animado por WAAPI e não por CSS porque não existe transição de ou para
     `height: auto` — aqui as duas alturas são MEDIDAS, antes e depois da
     troca, e a animação vai de uma à outra. No fim o elemento volta à altura
     automática sozinho, sem estilo inline para limpar. */
  function animarAltura(caixa, mudar) {
    var reduz = window.matchMedia &&
      matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!caixa || !caixa.animate || reduz) { mudar(); return; }

    var antes = caixa.getBoundingClientRect().height;
    mudar();
    var depois = caixa.getBoundingClientRect().height;
    if (Math.abs(depois - antes) < 2) return;

    // digitação rápida: cancelar faz a nova animação partir da altura atual
    if (caixa._anim) caixa._anim.cancel();
    caixa.classList.add("is-medindo");
    caixa._anim = caixa.animate(
      [{ height: antes + "px" }, { height: depois + "px" }],
      { duration: 300, easing: "cubic-bezier(.22,.61,.36,1)" }
    );
    caixa._anim.onfinish = caixa._anim.oncancel = function () {
      if (!caixa._anim || caixa._anim.playState !== "running") {
        caixa.classList.remove("is-medindo");
      }
    };
  }

  /* Estado vazio. Existe só como consequência do filtro, que é JavaScript:
     sem script a tabela nunca fica vazia. Por isso a linha é criada em tempo
     de execução em vez de vir no HTML como markup morto e escondido. */
  function estadoVazio(tabela, termo, nomes) {
    var corpo = tabela.tBodies[0];
    var linha = corpo.querySelector(".wmc-table-empty");
    if (!termo) { if (linha) linha.remove(); return; }
    if (!linha) {
      linha = document.createElement("tr");
      linha.className = "wmc-table-empty";
      var td = document.createElement("td");
      td.colSpan = tabela.tHead ? tabela.tHead.rows[0].cells.length : 1;
      td.innerHTML =
        '<p class="wmc-table-empty-title"></p>' +
        '<p class="wmc-table-empty-note">Nothing in the filed record matches that. ' +
        'Check the spelling, or clear the search to see every row again.</p>' +
        '<button class="wmc-btn-ghost" type="button" data-clear-filter>Clear search</button>';
      linha.appendChild(td);
      corpo.appendChild(linha);
    }
    linha.querySelector(".wmc-table-empty-title").textContent =
      "No " + nomes[1] + " match \u201C" + termo + "\u201D.";
  }

  document.addEventListener("click", function (e) {
    var b = e.target.closest && e.target.closest("[data-clear-filter]");
    if (!b) return;
    var secao = b.closest(".wmc-table-section");
    var campo = secao && secao.querySelector("[data-table-filter]");
    if (!campo) return;
    campo.value = "";
    campo.dispatchEvent(new Event("input", { bubbles: true }));
    campo.focus();
  });

  document.addEventListener("input", function (e) {
    var campo = e.target.closest && e.target.closest("[data-table-filter]");
    if (!campo) return;
    var tabela = document.getElementById(campo.getAttribute("data-table-filter"));
    if (!tabela) return;
    var termo = campo.value.trim().toLowerCase();

    /* O contador é o da seção da tabela, não o primeiro do documento — uma
       página pode ter mais de uma. E o substantivo vem do próprio contador:
       era "counties" fixo, então a página de estado anunciava "9 counties
       match" para uma lista de incêndios.

       Em repouso a linha volta ao que veio no HTML — hoje, vazia. O valor é
       lido do próprio nó em vez de fixado aqui: se uma página quiser dizer
       algo enquanto ninguém filtra, basta escrever no HTML. */
    var secao = tabela.closest(".wmc-table-section") || document;
    var contador = secao.querySelector("[data-filter-count]");
    var nomes = contador
      ? (contador.getAttribute("data-noun") || "record,records").split(",")
      : ["record", "records"];

    var vistas = 0;
    animarAltura(tabela.closest(".wmc-table-scroll"), function () {
      [].forEach.call(tabela.tBodies[0].rows, function (tr) {
        if (tr.classList.contains("wmc-table-empty")) return;   // não é dado
        var bate = !termo || tr.textContent.toLowerCase().indexOf(termo) !== -1;
        tr.hidden = !bate;
        if (bate) vistas++;
      });
      estadoVazio(tabela, vistas === 0 ? campo.value.trim() : "", nomes);
    });

    if (contador) {
      if (contador._repouso == null) contador._repouso = contador.textContent;
      contador.textContent = termo
        ? vistas + " " + (vistas === 1 ? nomes[0] + " matches" : nomes[1] + " match")
        : contador._repouso;
    }
  });
})();
