/* line-chart.js — gráfico de linha em SVG, com eixos, animação de entrada e
 * leitura ao passar o mouse ou navegar pelo teclado.
 *
 * DADOS ILUSTRATIVOS. A série não veio de fonte nenhuma; foi escrita para dar
 * forma ao argumento da página. Por isso todo gráfico montado por aqui carrega
 * a nota de que a forma é ilustrativa, e a tabela equivalente fica no DOM.
 * Ver PRODUCT.md > Evidence.
 *
 * Decisões que não são estéticas:
 *  - a TABELA existe de verdade, só visualmente escondida. Um gráfico que só
 *    existe como desenho é ilegível para leitor de tela; aqui o mesmo dado
 *    está em <table>, e o SVG é marcado como imagem com descrição.
 *  - navegação por teclado com as setas percorre os pontos, então a leitura no
 *    hover não é exclusiva de quem usa mouse.
 *  - sob prefers-reduced-motion a linha aparece pronta, sem desenhar.
 */
(function () {
  "use strict";

  var EMBER = "#E8613C";
  var NS = "http://www.w3.org/2000/svg";

  function el(nome, attrs) {
    var n = document.createElementNS(NS, nome);
    for (var k in attrs) if (attrs[k] != null) n.setAttribute(k, attrs[k]);
    return n;
  }

  class LineChart extends HTMLElement {
    connectedCallback() {
      if (this._pronto) return;
      this._pronto = true;

      this._serie = this._lerSerie();
      if (!this._serie.length) return;

      this._unidade = this.getAttribute("data-unit") || "";
      this._rotuloY = this.getAttribute("data-y-label") || "";
      this._idx = -1;

      this._casca();
      this._desenhar();
      this._observar();

      /* Redesenha quando a largura muda. O SVG usa as dimensões REAIS em px
         como viewBox — é isso que mantém o texto dos eixos no tamanho que o
         CSS pediu. Com um viewBox fixo e preserveAspectRatio="none", um rótulo
         de 13px virava 3,6px numa caixa de 280px: ilegível. */
      var self = this, larg = this.clientWidth;
      this._ro = new ResizeObserver(function () {
        if (Math.abs(self.clientWidth - larg) < 8) return;
        larg = self.clientWidth;
        self._desenhar();
      });
      this._ro.observe(this);

      this.addEventListener("pointermove", this._aoMover.bind(this));
      this.addEventListener("pointerleave", this._limparLeitura.bind(this));
      this.addEventListener("keydown", this._aoTeclar.bind(this));
      this.addEventListener("focus", this._aoFocar.bind(this));
      this.addEventListener("blur", this._limparLeitura.bind(this));
    }

    disconnectedCallback() {
      if (this._io) this._io.disconnect();
      if (this._ro) this._ro.disconnect();
      this._pronto = false;
    }

    /* --- dados ----------------------------------------------------------- */

    _lerSerie() {
      var bruto = this.getAttribute("data-series");
      if (!bruto) return [];
      try {
        return JSON.parse(bruto).map(function (p) {
          return { x: String(p[0]), y: Number(p[1]) };
        });
      } catch (e) { return []; }
    }

    _fmt(v) {
      return v.toLocaleString("en-US") + (this._unidade ? " " + this._unidade : "");
    }

    /* --- montagem -------------------------------------------------------- */

    /* Criado uma vez: o que não depende da largura. */
    _casca() {
      var svg = el("svg", {
        role: "img",
        "aria-label": this.getAttribute("data-desc") ||
          "Line chart, " + this._serie[0].x + " to " + this._serie[this._serie.length - 1].x
      });
      svg.classList.add("wmc-lc-svg");
      this.innerHTML = "";
      this.appendChild(svg);
      this._svg = svg;

      /* A leitura deixou de ser visível: quem mostra o valor agora é a etiqueta
         presa ao ponto. O nó continua existindo como região viva — é ele que
         anuncia o valor a quem navega por teclado ou leitor de tela. */
      var leitura = document.createElement("p");
      leitura.className = "wmc-sr";
      leitura.setAttribute("role", "status");
      this.appendChild(leitura);
      this._leitura = leitura;

      var tip = document.createElement("div");
      tip.className = "wmc-lc-tip";
      tip.setAttribute("aria-hidden", "true");        // o mesmo valor já está na região viva
      tip.innerHTML = '<span class="wmc-lc-tip-x"></span><span class="wmc-lc-tip-y"></span>';
      this.appendChild(tip);
      this._tip = tip;
      this._tipX = tip.firstChild;
      this._tipY = tip.lastChild;

      this.appendChild(this._tabela());

      this.tabIndex = 0;
      this.setAttribute("role", "application");
      this.setAttribute("aria-describedby", this._tabelaId);
    }

    _desenhar() {
      var s = this._serie;
      var W = Math.max(320, Math.round(this.clientWidth || 640));
      var H = Math.max(200, Math.round(W * 0.34));
      var m = { t: 18, r: 16, b: 34, l: 58 };          // margem para os eixos
      var iw = W - m.l - m.r, ih = H - m.t - m.b;

      var max = Math.max.apply(null, s.map(function (p) { return p.y; }));

      /* Escada do eixo Y. Duas exigências ao mesmo tempo: rótulos redondos E
         pouca folga acima do maior valor. Testa uma família de passos, mantém
         só os que fecham em 3 a 5 divisões, e fica com o de MENOR topo.
         Sem a segunda regra, um máximo de 12 abria o eixo até 30 e a linha
         usava 40% da altura disponível. */
      var esc = Math.pow(10, Math.floor(Math.log10(max)));
      var melhor = null;
      [0.1, 0.2, 0.25, 0.3, 0.4, 0.5, 1, 2, 2.5, 5].forEach(function (f) {
        var cand = f * esc, d = Math.ceil(max / cand);
        if (d < 3 || d > 5) return;
        var t = cand * d;
        if (!melhor || t < melhor.topo) melhor = { passo: cand, divisoes: d, topo: t };
      });
      if (!melhor) melhor = { passo: esc, divisoes: 4, topo: esc * 4 };
      var passo = melhor.passo, divisoes = melhor.divisoes, topo = melhor.topo;

      var px = function (i) { return m.l + (i * iw) / (s.length - 1); };
      var py = function (v) { return m.t + ih - (v / topo) * ih; };
      this._px = px; this._py = py; this._geo = { m: m, iw: iw, ih: ih, W: W, H: H };

      var svg = this._svg;
      svg.setAttribute("viewBox", "0 0 " + W + " " + H);
      svg.setAttribute("height", H);
      while (svg.firstChild) svg.removeChild(svg.firstChild);

      var defs = el("defs");
      var grad = el("linearGradient", { id: "wmc-lc-fill-" + (LineChart._n = (LineChart._n || 0) + 1), x1: 0, y1: 0, x2: 0, y2: 1 });
      grad.appendChild(el("stop", { offset: "0%", "stop-color": EMBER, "stop-opacity": ".38" }));
      grad.appendChild(el("stop", { offset: "100%", "stop-color": EMBER, "stop-opacity": "0" }));
      defs.appendChild(grad);
      svg.appendChild(defs);

      // grade e eixo Y
      for (var g = 0; g <= divisoes; g++) {
        var v = passo * g, y = py(v);
        svg.appendChild(el("line", {
          x1: m.l, x2: W - m.r, y1: y, y2: y, class: "wmc-lc-grid"
        }));
        var t = el("text", { x: m.l - 10, y: y, class: "wmc-lc-tick wmc-lc-tick--y" });
        t.textContent = v >= 1000 ? (v / 1000) + "k"
          : String(Math.round(v * 100) / 100);          // sem zeros à toa
        svg.appendChild(t);
      }

      // eixo X — rotula o primeiro, o último e alguns no meio, para não empilhar
      var salto = Math.ceil(s.length / 6);
      s.forEach(function (p, i) {
        if (i !== 0 && i !== s.length - 1 && i % salto) return;
        var t = el("text", { x: px(i), y: H - 10, class: "wmc-lc-tick wmc-lc-tick--x" });
        t.textContent = p.x;
        svg.appendChild(t);
      });

      var pts = s.map(function (p, i) { return px(i) + "," + py(p.y); }).join(" ");
      svg.appendChild(el("polygon", {
        points: m.l + "," + (m.t + ih) + " " + pts + " " + (W - m.r) + "," + (m.t + ih),
        fill: "url(#" + grad.id + ")", class: "wmc-lc-area"
      }));

      var linha = el("polyline", { points: pts, class: "wmc-lc-line" });
      svg.appendChild(linha);
      this._linha = linha;

      // marcador da leitura
      this._cursor = el("line", { class: "wmc-lc-cursor", y1: m.t, y2: m.t + ih, x1: 0, x2: 0 });
      this._ponto = el("circle", { class: "wmc-lc-dot", r: 5, cx: 0, cy: 0 });
      svg.appendChild(this._cursor);
      svg.appendChild(this._ponto);

      this._limparLeitura();
    }

    /* O mesmo dado em tabela: é o que um leitor de tela consegue percorrer. */
    _tabela() {
      var id = "wmc-lc-data-" + (LineChart._n || 1);
      this._tabelaId = id;
      var wrap = document.createElement("div");
      wrap.className = "wmc-sr";
      wrap.id = id;
      var linhas = this._serie.map(function (p) {
        return "<tr><th scope=\"row\">" + p.x + "</th><td>" + this._fmt(p.y) + "</td></tr>";
      }, this).join("");
      wrap.innerHTML =
        "<table><caption>" + (this.getAttribute("data-desc") || "Chart data") +
        ". Illustrative series, not a filed record.</caption><thead><tr><th scope=\"col\">Period</th><th scope=\"col\">" +
        (this._rotuloY || "Value") + "</th></tr></thead><tbody>" + linhas + "</tbody></table>";
      return wrap;
    }

    /* --- entrada --------------------------------------------------------- */

    _observar() {
      if (this._jaEntrou) return;            // redesenho por resize não re-anima
      var reduz = window.matchMedia &&
        matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduz) { this.classList.add("wmc-lc--pronto"); this._jaEntrou = true; return; }

      var comp = this._linha.getTotalLength ? this._linha.getTotalLength() : 0;
      if (!comp) { this.classList.add("wmc-lc--pronto"); return; }
      this._linha.style.strokeDasharray = comp;
      this._linha.style.strokeDashoffset = comp;

      var self = this;
      this._io = new IntersectionObserver(function (ents) {
        ents.forEach(function (en) {
          if (!en.isIntersecting) return;
          self._io.unobserve(en.target);
          self._linha.style.transition = "stroke-dashoffset 1.4s cubic-bezier(.22,.61,.36,1)";
          self._linha.style.strokeDashoffset = "0";
          self.classList.add("wmc-lc--pronto");
          self._jaEntrou = true;
        });
      }, { rootMargin: "0px 0px -15% 0px" });
      this._io.observe(this);
    }

    /* --- leitura --------------------------------------------------------- */

    _maisProximo(clientX) {
      var r = this.querySelector("svg").getBoundingClientRect();
      var rel = ((clientX - r.left) / r.width) * this._geo.W;
      var melhor = 0, dist = Infinity;
      for (var i = 0; i < this._serie.length; i++) {
        var d = Math.abs(this._px(i) - rel);
        if (d < dist) { dist = d; melhor = i; }
      }
      return melhor;
    }

    _mostrar(i) {
      if (i < 0 || i >= this._serie.length) return;
      this._idx = i;
      var p = this._serie[i], x = this._px(i), y = this._py(p.y);
      this._cursor.setAttribute("x1", x);
      this._cursor.setAttribute("x2", x);
      this._ponto.setAttribute("cx", x);
      this._ponto.setAttribute("cy", y);
      this.classList.add("wmc-lc--lendo");
      this._leitura.textContent = p.x + " · " + this._fmt(p.y);
      this._tipX.textContent = p.x;
      this._tipY.textContent = this._fmt(p.y);
      this._posicionarTip(x, y);
    }

    /* A etiqueta fica acima do ponto e presa dentro do desenho: perto das
       bordas ela encosta em vez de vazar, e no topo vira para baixo — senão
       sairia da caixa justamente no ponto mais alto da série, que é o que mais
       se quer ler. */
    _posicionarTip(x, y) {
      var t = this._tip, geo = this._geo;
      /* Pelo rect, e não por offsetLeft: offsetLeft/offsetTop são de
         HTMLElement e NÃO existem em SVG — davam undefined, a conta virava
         NaN e o navegador descartava o estilo, deixando a etiqueta parada no
         canto superior esquerdo. */
      var caixaHost = this.getBoundingClientRect();
      var caixaSvg = this._svg.getBoundingClientRect();
      var ox = caixaSvg.left - caixaHost.left;
      var oy = caixaSvg.top - caixaHost.top;
      var w = t.offsetWidth, h = t.offsetHeight;
      var esq = Math.max(2, Math.min(ox + x - w / 2, geo.W - w - 2));
      var acima = oy + y - h - 14;
      var viraParaBaixo = acima < 0;
      t.classList.toggle("is-abaixo", viraParaBaixo);
      t.style.left = Math.round(esq) + "px";
      t.style.top = Math.round(viraParaBaixo ? oy + y + 14 : acima) + "px";
    }

    _limparLeitura() {
      this.classList.remove("wmc-lc--lendo");
      this._leitura.textContent = "";
      this._idx = -1;
    }

    _aoMover(e) { this._mostrar(this._maisProximo(e.clientX)); }

    _aoFocar() { if (this._idx < 0) this._mostrar(this._serie.length - 1); }

    _aoTeclar(e) {
      var n = this._serie.length;
      var i = this._idx < 0 ? n - 1 : this._idx;
      if (e.key === "ArrowRight") i = Math.min(n - 1, i + 1);
      else if (e.key === "ArrowLeft") i = Math.max(0, i - 1);
      else if (e.key === "Home") i = 0;
      else if (e.key === "End") i = n - 1;
      else if (e.key === "Escape") { this._limparLeitura(); return; }
      else return;
      e.preventDefault();
      this._mostrar(i);
    }
  }

  if (!customElements.get("line-chart")) customElements.define("line-chart", LineChart);
  window["line-chart"] = LineChart;
})();
