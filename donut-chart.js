/* donut-chart.js — anel de proporção com entrada animada e leitura por fatia.
 *
 * DADOS ILUSTRATIVOS. As proporções não vieram de fonte nenhuma; foram escritas
 * para dar forma ao argumento da página. Ver PRODUCT.md > Evidence.
 *
 * Decisões que não são estéticas:
 *  - a LEGENDA é feita de <button>. Cada fatia ganha um alvo real, focável pelo
 *    teclado, que produz exatamente o mesmo destaque que o mouse produz. Com
 *    <span> e mouseover, a leitura existiria só para quem usa mouse.
 *  - o número do centro é HTML sobreposto, e não <text> dentro do SVG: texto em
 *    SVG escalado por viewBox não obedece ao tamanho que o CSS pediu — foi
 *    assim que os rótulos do gráfico de linha saíram renderizados a 3,6px.
 *  - pathLength="100" normaliza o perímetro: o dasharray passa a ser a própria
 *    porcentagem, sem circunferência calculada à mão para cada raio.
 *  - a mesma proporção existe em <table>, só visualmente escondida. Um anel que
 *    só existe como desenho é ilegível para leitor de tela.
 *  - sob prefers-reduced-motion o anel aparece pronto, sem varrer.
 */
(function () {
  "use strict";

  var NS = "http://www.w3.org/2000/svg";
  var VAO = 0.8;                 // respiro entre fatias, em porcento do anel

  function svgEl(nome, attrs) {
    var n = document.createElementNS(NS, nome);
    for (var k in attrs) if (attrs[k] != null) n.setAttribute(k, attrs[k]);
    return n;
  }

  function htmlEl(nome, classe, texto) {
    var n = document.createElement(nome);
    if (classe) n.className = classe;
    if (texto != null) n.textContent = texto;
    return n;
  }

  class DonutChart extends HTMLElement {
    connectedCallback() {
      if (this._pronto) return;
      this._pronto = true;

      this._serie = this._lerSerie();
      if (!this._serie.length) return;

      this._unidade = this.getAttribute("data-unit") || "%";
      this._desc = this.getAttribute("data-desc") || "Proportion";
      this._emLeitura = false;

      var soma = this._serie.reduce(function (t, f) { return t + f.valor; }, 0) || 1;
      this._serie.forEach(function (f) { f.parte = (f.valor / soma) * 100; });

      this._montar();
      this._observar();
    }

    disconnectedCallback() {
      if (this._io) this._io.disconnect();
      if (this._raf) cancelAnimationFrame(this._raf);
      this._pronto = false;
    }

    /* --- dados ----------------------------------------------------------- */

    _lerSerie() {
      var bruto = this.getAttribute("data-series");
      if (!bruto) return [];
      try {
        return JSON.parse(bruto).map(function (p) {
          return { nome: String(p[0]), valor: Number(p[1]) };
        }).filter(function (p) { return p.valor > 0; });
      } catch (e) { return []; }
    }

    _fmt(parte) {
      return Math.round(parte) + this._unidade;
    }

    /* --- montagem -------------------------------------------------------- */

    _montar() {
      this.innerHTML = "";
      var self = this;

      var anel = htmlEl("div", "wmc-dn-ring");
      var svg = svgEl("svg", {
        viewBox: "0 0 100 100",
        class: "wmc-dn-svg",
        role: "img",
        "aria-label": this._desc + ". " + this._serie.map(function (f) {
          return f.nome + " " + self._fmt(f.parte);
        }).join("; ") + "."
      });

      // trilha: fecha o círculo mesmo antes da varredura começar
      svg.appendChild(svgEl("circle", {
        class: "wmc-dn-track", cx: 50, cy: 50, r: 43, fill: "none", "stroke-width": 11
      }));

      this._arcos = [];
      var acumulado = 0;
      this._serie.forEach(function (f, i) {
        var c = svgEl("circle", {
          class: "wmc-dn-arc",
          "data-i": i,
          cx: 50, cy: 50, r: 43, fill: "none",
          "stroke-width": 11,
          pathLength: 100,
          "stroke-dasharray": "0 100",
          // -90 põe o início no topo; 3,6 graus por ponto porcentual
          transform: "rotate(" + (-90 + acumulado * 3.6) + " 50 50)"
        });
        svg.appendChild(c);
        self._arcos.push({ el: c, fatia: f });
        acumulado += f.parte;
      });

      anel.appendChild(svg);

      /* O centro repete o que a legenda e a tabela já dizem; para o leitor de
         tela é ruído, então fica escondido da árvore de acessibilidade. */
      var centro = htmlEl("div", "wmc-dn-center");
      centro.setAttribute("aria-hidden", "true");
      this._valor = htmlEl("span", "wmc-dn-value", "0" + this._unidade);
      this._nome = htmlEl("span", "wmc-dn-name", this._serie[0].nome);
      centro.appendChild(this._valor);
      centro.appendChild(this._nome);
      anel.appendChild(centro);
      this.appendChild(anel);

      var lista = htmlEl("ul", "wmc-dn-legend");
      this._botoes = this._serie.map(function (f, i) {
        var li = htmlEl("li");
        var b = htmlEl("button", "wmc-dn-item");
        b.type = "button";
        b.setAttribute("data-i", i);
        b.appendChild(htmlEl("i", "wmc-dn-swatch"));
        b.appendChild(htmlEl("span", "wmc-dn-item-name", f.nome));
        b.appendChild(htmlEl("span", "wmc-dn-item-pct", self._fmt(f.parte)));
        li.appendChild(b);
        lista.appendChild(li);
        return b;
      });
      this.appendChild(lista);
      this.appendChild(this._tabela());

      /* Delegado no próprio elemento: o destaque é o mesmo venha de onde vier,
         e não há um listener por fatia para limpar depois. */
      var alvo = function (e) {
        var n = e.target.closest ? e.target.closest("[data-i]") : null;
        return n ? Number(n.getAttribute("data-i")) : -1;
      };
      this.addEventListener("pointerover", function (e) {
        var i = alvo(e); if (i >= 0) self._destacar(i);
      });
      this.addEventListener("pointerleave", function () { self._soltar(); });
      this.addEventListener("focusin", function (e) {
        var i = alvo(e); if (i >= 0) self._destacar(i);
      });
      this.addEventListener("focusout", function (e) {
        if (!self.contains(e.relatedTarget)) self._soltar();
      });
    }

    /* A mesma proporção em tabela: é o que um leitor de tela percorre. */
    _tabela() {
      var wrap = htmlEl("div", "wmc-sr");
      var linhas = this._serie.map(function (f) {
        return "<tr><th scope=\"row\">" + f.nome + "</th><td>" + this._fmt(f.parte) + "</td></tr>";
      }, this).join("");
      wrap.innerHTML =
        "<table><caption>" + this._desc +
        ". Illustrative proportion, not a filed record.</caption><thead><tr>" +
        "<th scope=\"col\">Share</th><th scope=\"col\">Percent</th></tr></thead><tbody>" +
        linhas + "</tbody></table>";
      return wrap;
    }

    /* --- entrada --------------------------------------------------------- */

    _observar() {
      if (this._jaEntrou) return;
      var reduz = window.matchMedia &&
        matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduz) { this._entrar(true); return; }

      var self = this;
      this._io = new IntersectionObserver(function (ents) {
        ents.forEach(function (en) {
          if (!en.isIntersecting) return;
          self._io.unobserve(en.target);
          self._entrar(false);
        });
      }, { rootMargin: "0px 0px -12% 0px" });
      this._io.observe(this);
    }

    _entrar(direto) {
      this._jaEntrou = true;
      var self = this;
      this._arcos.forEach(function (a, i) {
        if (!direto) {
          a.el.style.transition =
            "stroke-dasharray .9s cubic-bezier(.22,.61,.36,1) " + (i * 0.13).toFixed(2) + "s";
        }
        self._pintar(a);
      });
      this._contar(this._serie[0].parte, direto);
      this.classList.add("wmc-dn--pronto");
    }

    _pintar(a) {
      var p = Math.max(0, a.fatia.parte - (this._serie.length > 1 ? VAO : 0));
      a.el.style.strokeDasharray = p + " " + (100 - p);
    }

    /* Contagem do número central. Mesma curva da varredura, para o número e o
       anel chegarem juntos. */
    _contar(destino, direto) {
      if (this._raf) cancelAnimationFrame(this._raf);
      if (direto) { this._valor.textContent = this._fmt(destino); return; }
      var self = this, ini = performance.now(), dur = 900;
      this._raf = requestAnimationFrame(function passo(agora) {
        var t = Math.min(1, (agora - ini) / dur);
        var e = 1 - Math.pow(1 - t, 3);
        self._valor.textContent = self._fmt(destino * e);
        if (t < 1) self._raf = requestAnimationFrame(passo);
        else self._raf = 0;
      });
    }

    /* --- leitura --------------------------------------------------------- */

    _destacar(i) {
      if (this._emLeitura === i) return;
      this._emLeitura = i;
      this.classList.add("wmc-dn--lendo");
      this._arcos.forEach(function (a, j) { a.el.classList.toggle("is-ativa", j === i); });
      this._botoes.forEach(function (b, j) { b.classList.toggle("is-ativa", j === i); });
      this._valor.textContent = this._fmt(this._serie[i].parte);
      this._nome.textContent = this._serie[i].nome;
    }

    _soltar() {
      this._emLeitura = false;
      this.classList.remove("wmc-dn--lendo");
      this._arcos.forEach(function (a) { a.el.classList.remove("is-ativa"); });
      this._botoes.forEach(function (b) { b.classList.remove("is-ativa"); });
      this._valor.textContent = this._fmt(this._serie[0].parte);
      this._nome.textContent = this._serie[0].nome;
    }
  }

  if (!customElements.get("donut-chart")) customElements.define("donut-chart", DonutChart);
  window["donut-chart"] = DonutChart;
})();
