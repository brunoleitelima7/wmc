(function () {
  "use strict";

  // FIPS -> nome. Os 48 contíguos + DC, iguais aos que o choropleth projeta.
  var NAMES = {
    "01":"Alabama","02":"Alaska","04":"Arizona","05":"Arkansas","06":"California","08":"Colorado",
    "09":"Connecticut","10":"Delaware","11":"District of Columbia","12":"Florida",
    "13":"Georgia","15":"Hawaii","16":"Idaho","17":"Illinois","18":"Indiana","19":"Iowa","20":"Kansas",
    "21":"Kentucky","22":"Louisiana","23":"Maine","24":"Maryland","25":"Massachusetts",
    "26":"Michigan","27":"Minnesota","28":"Mississippi","29":"Missouri","30":"Montana",
    "31":"Nebraska","32":"Nevada","33":"New Hampshire","34":"New Jersey","35":"New Mexico",
    "36":"New York","37":"North Carolina","38":"North Dakota","39":"Ohio","40":"Oklahoma",
    "41":"Oregon","42":"Pennsylvania","44":"Rhode Island","45":"South Carolina",
    "46":"South Dakota","47":"Tennessee","48":"Texas","49":"Utah","50":"Vermont",
    "51":"Virginia","53":"Washington","54":"West Virginia","55":"Wisconsin","56":"Wyoming"
  };
  // AK e HI ficam fora do fit da projeção albersUsa do D3 (ela os distorce),
  // mas continuam buscáveis e são desenhados normalmente pelo Mapbox.
  var CONTIGUOUS = Object.keys(NAMES).reduce(function (a, k) {
    if (k !== "02" && k !== "15") a[k] = 1;
    return a;
  }, {});

  var INK = "#000000", RULE = "#2A2D30", RULE_STRONG = "#4A4E52";
  var PAPER = "#F2EFEA", MUTED = "#9E9891", EMBER = "#E8613C", EMBER_DEEP = "#C0301A";

  // ---------------------------------------------------------------------
  // MAPBOX — ponto único de configuração
  //
  // Cole aqui o seu token PÚBLICO (começa com "pk."), ou passe-o pelo HTML:
  //     <x-import ... data-mapbox-token="pk.SEU_TOKEN"></x-import>
  // O atributo tem precedência sobre a constante abaixo.
  //
  // Vazio = o mapa continua sendo desenhado com D3 + topojson, sem token,
  // que é o estado atual e funciona offline e no GitHub Pages.
  //
  // ATENÇÃO
  //  - Nunca use um token secreto ("sk.") aqui: ele ficaria exposto no fonte.
  //  - Um token público é feito para o navegador, mas num repositório público
  //    ele fica visível. Restrinja o token por URL no painel da Mapbox
  //    (Account > Tokens > URL restrictions) antes de publicar.
  //  - A camada de render Mapbox ainda NÃO foi implementada; preencher isto
  //    sozinho não troca o mapa. Ver _drawMap().
  var MAPBOX_TOKEN = (typeof window !== "undefined" && window.__WMC_MAPBOX_TOKEN) || "";   // ver mapbox-token.js
  // ---------------------------------------------------------------------

  // Reserva, no fitBounds, o espaço que o painel sobreposto ocupa à direita.
  // Abaixo do ponto em que o painel deixa de flutuar, volta a padding simétrico.
  function fitPadding(host) {
    var w = host ? host.getBoundingClientRect().width : 0;
    var flutua = w >= 860;
    return flutua
      ? { top: 28, bottom: 28, left: 28, right: Math.round(w * 0.52) }
      : { top: 20, bottom: 20, left: 20, right: 20 };
  }

  var geoPromise = null;
  function libs() {
    return new Promise(function (res) {
      (function poll() {
        if (window.d3 && window.topojson) return res();
        setTimeout(poll, 40);
      })();
    });
  }
  function geometry() {
    if (geoPromise) return geoPromise;
    geoPromise = libs()
      .then(function () { return fetch("https://cdn.jsdelivr.net/npm/us-atlas@3.0.1/states-10m.json"); })
      .then(function (r) { return r.json(); })
      .then(function (topo) {
        var fc = window.topojson.feature(topo, topo.objects.states);
        return { type: "FeatureCollection",
                 features: fc.features.filter(function (f) { return NAMES[String(f.id)]; }) };
      });
    return geoPromise;
  }
  function fmt(n) { return n.toLocaleString("en-US"); }

  class StateExplorer extends HTMLElement {
    connectedCallback() {
      if (this._built) return;
      this._built = true;
      this.style.display = "block";
      this._filed = this._read("data-filed", {});     // { "California": {value, agency, lead, window} }
      this._mapboxToken = (this.getAttribute("data-mapbox-token") || MAPBOX_TOKEN || "").trim();
      // publica para outros componentes (metric-map) reusarem o mesmo token
      if (this._mapboxToken) window.__WMC_MAPBOX_TOKEN = this._mapboxToken;
      this._total = this.getAttribute("data-total") || "752";
      this._render();
      var self = this;
      geometry().then(function (geo) { self._geo = geo; self._drawMap(); })
                .catch(function () { self._mapNote("Map geometry unavailable."); });
    }
    _read(name, fb) {
      try { return JSON.parse(this.getAttribute(name) || ""); } catch (e) { return fb; }
    }
    _mapNote(msg) {
      var h = this.querySelector('[data-role="map"]');
      if (h) h.innerHTML = '<p style="margin:0;font:500 11px/1.6 Krub,system-ui;letter-spacing:.2em;text-transform:uppercase;color:' + MUTED + '">' + msg + "</p>";
    }

    // ---------------------------------------------------------------- UI --
    /* O destino vem do atributo: na home leva a outra pagina, e na propria
       pagina de destino o botao some para nao virar auto-link. */
    _ctaHTML() {
      var href = this.getAttribute("data-cta-href");
      if (href === "none") return "";
      var rotulo = this.getAttribute("data-cta-label") || "Full state data";
      return '<a href="' + (href || "state.html") + '" class="wmc-btn wmc-btn--start">' + rotulo + '</a>';
    }

    _render() {
      var filed = this._filed;
      var ranked = Object.keys(filed).map(function (k) {
        return { name: k, v: filed[k].value, agency: filed[k].agency, lead: filed[k].lead };
      }).sort(function (a, b) { return b.v - a.v; });
      this._ranked = ranked;

      var lbl = "font:500 clamp(11px,0.8cqw,12px)/1 Krub,system-ui;letter-spacing:.2em;text-transform:uppercase;color:" + MUTED;
      this.innerHTML =
        '<div class="wmc-explorer" style="position:relative;width:100%">' +
          '<div data-role="map" class="wmc-explorer-map"></div>' +
          '<div class="wmc-explorer-panel">' +
            '<h3 class="wmc-panel-title">Wildfire incidents by state</h3>' +
            '<p style="margin:0;max-width:56ch;font-size:clamp(14px,1.02cqw,15px);line-height:1.7;color:#BDB7AF;text-wrap:pretty">Search any state to see how it compares with the highest recorded counts. Where a state filed nothing, the record stays blank &mdash; it is not estimated.</p>' +
            '<div style="position:relative">' +
              '<label for="wmc-state-search" style="display:block;margin-bottom:10px;font:500 clamp(11px,0.8cqw,12px)/1 Krub,system-ui;letter-spacing:.2em;text-transform:uppercase;color:' + MUTED + '">Search states</label>' +
              '<input data-role="search" id="wmc-state-search" type="text" autocomplete="off" spellcheck="false" ' +
                'role="combobox" aria-expanded="false" aria-controls="wmc-state-listbox" aria-autocomplete="list" ' +
                'placeholder="Search by state\u2026" ' +
                'style="width:100%;min-height:52px;padding:0 18px;background:transparent;color:' + PAPER + ';border:1px solid ' + RULE_STRONG + ';border-radius:0;font:400 clamp(14px,1.05cqw,15px)/1 Krub,system-ui">' +
              '<ul data-role="listbox" id="wmc-state-listbox" role="listbox" aria-label="Matching states" hidden ' +
                'style="list-style:none;margin:0;padding:0;position:absolute;left:0;right:0;top:100%;z-index:5;max-height:264px;overflow:auto;background:#0A0A0A;border:1px solid ' + RULE_STRONG + ';border-top:0"></ul>' +
            '</div>' +
            '<p data-role="status" role="status" aria-live="polite" style="margin:0;" class=\"wmc-label\"></p>' +
            '<ol data-role="list" style="list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:clamp(16px,1.8cqw,24px)"></ol>' +
            this._ctaHTML() +
          '</div>' +
        '</div>';

      var self = this;
      var input = this.querySelector('[data-role="search"]');
      this._idx = -1;
      input.addEventListener("input", function () { self._suggest(this.value); });
      input.addEventListener("keydown", function (e) { self._onKey(e); });
      input.addEventListener("blur", function () { setTimeout(function () { self._closeList(); }, 140); });
      this.querySelector('[data-role="listbox"]').addEventListener("mousedown", function (e) {
        var li = e.target.closest("li[data-name]");
        if (!li) return;
        e.preventDefault();
        self._choose(li.getAttribute("data-name"));
      });
      this._renderList(ranked, null);
      this._status("");
    }
    _status(t) { this.querySelector('[data-role="status"]').textContent = t; }

    _renderList(rows, selected) {
      var max = this._ranked.length ? this._ranked[0].v : 1;
      var html = rows.map(function (r, i) {
        var filedRow = typeof r.v === "number";
        var pct = filedRow ? Math.max(3, Math.round(r.v / max * 100)) : 0;
        var isSel = selected && r.name === selected;
        var rank = filedRow ? (r.rank || i + 1) : "—";
        return '<li style="display:flex;flex-wrap:wrap;gap:clamp(12px,1.6cqw,24px);align-items:center;border-top:1px solid ' +
            (isSel ? EMBER : RULE) + ';padding-top:clamp(14px,1.6cqw,22px)">' +
          '<span aria-hidden="true" style="flex:0 0 auto;width:2ch;font:500 clamp(11px,0.8cqw,12px)/1 Krub,system-ui;letter-spacing:.14em;color:' + MUTED + '">' + rank + '</span>' +
          '<span style="flex:1 1 min(100%,200px);display:flex;flex-direction:column;gap:6px;min-width:0">' +
            '<span style="font-family:Inter,system-ui,sans-serif;font-weight:400;font-size:clamp(20px,1.9cqw,28px);line-height:1.1;color:' + (isSel ? EMBER : PAPER) + '">' + r.name + '</span>' +
            (filedRow
              ? '<span class="wmc-label" style="line-height:1.5;color:' + MUTED + '">' + (r.lead || "") + (r.lead ? " · " : "") + (r.agency || "") + '</span>'
              : '<span class="wmc-label" style="line-height:1.5;color:' + MUTED + '">Not yet reported</span>') +
          '</span>' +
          (filedRow
            ? '<span style="flex:1 1 min(100%,180px);display:flex;flex-direction:column;gap:6px;min-width:0">' +
                '<span aria-hidden="true" style="display:block;height:10px;background:' + RULE + '"><span data-bar style="display:block;height:100%;width:' + pct + '%;background:' + (isSel ? EMBER : EMBER_DEEP) + '"></span></span>' +
                '<span style="font:500 clamp(11px,0.8cqw,12px)/1 Krub,system-ui;letter-spacing:.14em;color:' + (isSel ? EMBER : MUTED) + '">' + fmt(r.v) + ' recorded starts</span>' +
              '</span>'
            : '') +
        '</li>';
      }).join("");
      this.querySelector('[data-role="list"]').innerHTML = html;
      this._animateBars();
    }
    _animateBars() {
      var bars = this.querySelectorAll("[data-bar]");
      if (!bars.length) return;
      var reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      // sem GSAP ou com movimento reduzido, a largura final ja esta no inline style
      if (reduced || !window.gsap) return;
      window.gsap.from(bars, {
        width: 0, duration: 0.9, ease: "power2.out", stagger: 0.08,
        overwrite: "auto"
      });
    }

    // --------------------------------------------------------------- Map --
    _drawMap() {
      // Encaixe do Mapbox: com token presente, é aqui que a camada GL entraria
      // no lugar do SVG. Enquanto não implementada, seguimos no D3.
      if (this._mapboxToken && window.mapboxgl) return this._drawMapbox();
      var d3 = window.d3, self = this;
      var host = this.querySelector('[data-role="map"]');
      var W = 760, H = 480;
      var svg = d3.select(host).append("svg")
        .attr("viewBox", "0 0 " + W + " " + H)
        .attr("width", "100%").attr("role", "img")
        .attr("aria-label", "Map of recorded wildfire starts by state")
        .style("display", "block").style("background", INK);
      var g = svg.append("g");
      var contig = { type: "FeatureCollection",
        features: this._geo.features.filter(function (f) { return CONTIGUOUS[String(f.id)]; }) };
      var proj = d3.geoAlbersUsa().fitSize([W, H], contig);
      var path = d3.geoPath(proj);
      this._path = path; this._g = g; this._W = W; this._H = H;

      var filed = this._filed, max = this._ranked.length ? this._ranked[0].v : 1;
      this._paths = g.selectAll("path").data(contig.features).join("path")
        .attr("d", path)
        .attr("fill", function (f) {
          var n = NAMES[String(f.id)], rec = n && filed[n];
          if (!rec) return "#141517";
          var t = rec.value / max;
          return t > 0.92 ? EMBER : (t > 0.8 ? "#C8492A" : EMBER_DEEP);
        })
        .attr("stroke", INK).attr("stroke-width", 0.6)
        .attr("data-state", function (f) { return NAMES[String(f.id)] || ""; });
    }

    _drawMapbox() {
      var self = this, host = this.querySelector('[data-role="map"]');
      host.innerHTML = "";
      host.style.position = "relative";
      var el = document.createElement("div");
      el.style.cssText = "position:absolute;inset:0;background:#000000";
      host.appendChild(el);
      try { window.mapboxgl.accessToken = this._mapboxToken; }
      catch (e) { return this._mapboxFail("token rejected"); }

      var map;
      try {
        map = new window.mapboxgl.Map({
          container: el,
          style: "mapbox://styles/mapbox/dark-v11",
          bounds: [[-125.2, 24.2], [-66.5, 49.6]],   // contíguos
          fitBoundsOptions: { padding: fitPadding(host) },
          attributionControl: true,
          cooperativeGestures: true                   // não sequestra o scroll da página
        });
      } catch (e) { return this._mapboxFail("init failed"); }
      this._map = map;

      map.on("error", function (ev) {
        var m = (ev && ev.error && ev.error.message) || "";
        if (/access token|Unauthorized|401|403/i.test(m)) self._mapboxFail("token not accepted");
      });

      map.addControl(new window.mapboxgl.NavigationControl({ showCompass: false }), "top-left");

      map.on("load", function () {
        // Oceano, lagos e rios recebem o mesmo preto do fundo da seção, para a
        // costa virar silhueta em vez de recorte cinza. Guardado por getLayer:
        // se a Mapbox renomear as camadas do estilo, apenas não aplica.
        ["water", "waterway"].forEach(function (id) {
          if (!map.getLayer(id)) return;
          try { map.setPaintProperty(id, map.getLayer(id).type + "-color", INK); } catch (e) {}
        });

        var filed = self._filed, max = self._ranked.length ? self._ranked[0].v : 1;
        var fc = { type: "FeatureCollection", features: self._geo.features.map(function (f) {
          var n = NAMES[String(f.id)] || "";
          var rec = filed[n];
          return { type: "Feature", id: Number(f.id), geometry: f.geometry,
                   properties: { name: n, value: rec ? rec.value : 0, filed: rec ? 1 : 0,
                                 t: rec ? rec.value / max : 0 } };
        }) };
        map.addSource("states", { type: "geojson", data: fc, promoteId: "name" });

        map.addLayer({ id: "states-fill", type: "fill", source: "states",
          paint: { "fill-color": ["case", ["==", ["get", "filed"], 0], "#141517",
                     ["interpolate", ["linear"], ["get", "t"], 0.8, EMBER_DEEP, 0.92, "#C8492A", 1, EMBER]],
                   "fill-opacity": ["case", ["==", ["get", "filed"], 0], 0.55, 0.85] } });

        map.addLayer({ id: "states-line", type: "line", source: "states",
          paint: { "line-color": "#000000", "line-width": 0.6 } });

        map.addLayer({ id: "states-sel", type: "line", source: "states",
          filter: ["==", ["get", "name"], "\u0000"],
          paint: { "line-color": EMBER, "line-width": 2 } });

        self._mapReady = true;
        addEventListener("resize", function () {
          if (!self._map) return;
          self._map.resize();
          self._mapboxZoom(self._selecionado || null);
        });
        if (self._pending) { self._mapboxZoom(self._pending); self._pending = null; }
      });
      return true;
    }

    _mapboxFail(why) {                                 // qualquer falha volta para o D3
      this._mapboxToken = "";
      if (this._map) { try { this._map.remove(); } catch (e) {} this._map = null; }
      var host = this.querySelector('[data-role="map"]');
      if (host) host.innerHTML = "";
      this._mapReady = false;
      this._drawMap();
      return false;
    }

    _mapboxZoom(name) {
      var map = this._map;
      if (!map) return;
      if (!name) {
        this._selecionado = null;
        map.setFilter("states-sel", ["==", ["get", "name"], "\u0000"]);
        map.fitBounds([[-125.2, 24.2], [-66.5, 49.6]], { padding: fitPadding(this.querySelector('[data-role="map"]')), duration: 900 });
        return;
      }
      var feat = this._geo.features.filter(function (f) { return NAMES[String(f.id)] === name; })[0];
      if (!feat) return;
      var b = window.d3.geoBounds(feat);               // [[oeste,sul],[leste,norte]]
      // Quando a feição cruza o antimeridiano (Alasca, por causa das Aleutas),
      // o d3 devolve oeste > leste. Passar isso direto para o fitBounds joga a
      // câmera para o Ártico, então recortamos no hemisfério ocidental.
      if (b[0][0] > b[1][0]) b = [[-180, b[0][1]], [b[1][0], b[1][1]]];
      this._selecionado = name;
      map.setFilter("states-sel", ["==", ["get", "name"], name]);
      map.fitBounds(b, { padding: fitPadding(this.querySelector('[data-role="map"]')), duration: 900, maxZoom: 7 });
    }

    _zoomTo(name) {
      if (this._map) {                                 // caminho Mapbox
        if (this._mapReady) this._mapboxZoom(name); else this._pending = name;
        return;
      }
      if (!this._g || !this._paths) return;
      var d3 = window.d3, self = this;
      var feat = this._geo.features.filter(function (f) { return NAMES[String(f.id)] === name; })[0];
      this._paths.attr("stroke-width", 0.6).attr("stroke", INK);
      if (feat && !CONTIGUOUS[String(feat.id)]) {      // AK/HI: fora deste mapa
        this._g.transition().duration(700).attr("transform", "translate(0,0) scale(1)");
        this._status(name + " \u00b7 not shown on this projection");
        return;
      }
      if (!feat) {                                   // sem alvo: volta ao enquadramento cheio
        this._g.transition().duration(700).ease(d3.easeCubicOut).attr("transform", "translate(0,0) scale(1)");
        return;
      }
      var b = this._path.bounds(feat);
      var dx = b[1][0] - b[0][0], dy = b[1][1] - b[0][1];
      var cx = (b[0][0] + b[1][0]) / 2, cy = (b[0][1] + b[1][1]) / 2;
      var k = Math.max(1, Math.min(6, 0.7 / Math.max(dx / this._W, dy / this._H)));
      var tx = this._W / 2 - k * cx, ty = this._H / 2 - k * cy;
      this._g.transition().duration(700).ease(d3.easeCubicOut)
        .attr("transform", "translate(" + tx + "," + ty + ") scale(" + k + ")");
      this._paths.filter(function (f) { return NAMES[String(f.id)] === name; })
        .attr("stroke", EMBER).attr("stroke-width", 1.6 / k).raise();
    }

    // ---------------------------------------------------- Autocomplete --
    _matches(q) {
      q = (q || "").trim().toLowerCase();
      if (!q) return [];
      var self = this;
      return Object.keys(NAMES).map(function (k) { return NAMES[k]; })
        .filter(function (n) { return n.toLowerCase().indexOf(q) === 0; })
        .sort(function (a, b) {                       // estados com registro primeiro
          var fa = self._filed[a] ? 0 : 1, fb = self._filed[b] ? 0 : 1;
          return fa - fb || a.localeCompare(b);
        }).slice(0, 8);
    }
    _suggest(q) {
      var box = this.querySelector('[data-role="listbox"]');
      var input = this.querySelector('[data-role="search"]');
      var hits = this._matches(q);
      this._hits = hits; this._idx = -1;
      if (!hits.length) { this._closeList(); if (q.trim()) this._status("No state matches \u201c" + q.trim() + "\u201d"); return; }
      var self = this;
      box.innerHTML = hits.map(function (n, i) {
        var rec = self._filed[n];
        return '<li role="option" id="wmc-opt-' + i + '" data-name="' + n + '" aria-selected="false" ' +
          'style="display:flex;justify-content:space-between;gap:16px;align-items:baseline;padding:12px 16px;cursor:pointer;border-top:1px solid ' + RULE + '">' +
          '<span style="font:400 clamp(14px,1.05cqw,15px)/1.3 Krub,system-ui;color:' + PAPER + '">' + n + '</span>' +
          '<span class="wmc-label" style="color:' + (rec ? EMBER : MUTED) + '">' +
            (rec ? fmt(rec.value) : "No record") + '</span></li>';
      }).join("");
      box.hidden = false;
      input.setAttribute("aria-expanded", "true");
      this._status(hits.length + (hits.length === 1 ? " match" : " matches") + " \u2014 press Enter to choose");
    }
    _closeList() {
      var box = this.querySelector('[data-role="listbox"]');
      var input = this.querySelector('[data-role="search"]');
      if (box) { box.hidden = true; box.innerHTML = ""; }
      if (input) { input.setAttribute("aria-expanded", "false"); input.removeAttribute("aria-activedescendant"); }
      this._idx = -1;
    }
    _highlight(i) {
      var box = this.querySelector('[data-role="listbox"]');
      var input = this.querySelector('[data-role="search"]');
      var lis = box.querySelectorAll("li");
      [].forEach.call(lis, function (li, n) {
        var on = n === i;
        li.setAttribute("aria-selected", on ? "true" : "false");
        li.style.background = on ? "#161616" : "transparent";
      });
      if (i >= 0 && lis[i]) { input.setAttribute("aria-activedescendant", "wmc-opt-" + i); lis[i].scrollIntoView({ block: "nearest" }); }
      else input.removeAttribute("aria-activedescendant");
    }
    _onKey(e) {
      var hits = this._hits || [];
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        if (!hits.length) return;
        e.preventDefault();
        this._idx = e.key === "ArrowDown"
          ? (this._idx + 1) % hits.length
          : (this._idx <= 0 ? hits.length - 1 : this._idx - 1);
        this._highlight(this._idx);
      } else if (e.key === "Enter") {
        if (!hits.length) return;
        e.preventDefault();
        this._choose(hits[this._idx >= 0 ? this._idx : 0]);
      } else if (e.key === "Escape") {
        this._closeList();
      }
    }
    /* Avisa a pagina. O componente nao sabe nada sobre a seccao de destaque da
       state.html — so anuncia o que foi escolhido e entrega o registro filado
       (ou undefined, quando o estado nao filou nada). */
    _emitirEscolha(name) {
      this.dispatchEvent(new CustomEvent("wmc:state-chosen", {
        bubbles: true,
        detail: { name: name, filed: this._filed[name] || null }
      }));
    }

    _choose(name) {                                   // só aqui o mapa se move
      if (!name) return;
      this._emitirEscolha(name);
      var input = this.querySelector('[data-role="search"]');
      input.value = name;
      this._closeList();
      var rec = this._filed[name], self = this;
      var rankOf = function (n) {
        for (var i = 0; i < self._ranked.length; i++) if (self._ranked[i].name === n) return i + 1;
        return null;
      };
      var rows = [rec
        ? { name: name, v: rec.value, agency: rec.agency, lead: rec.lead, rank: rankOf(name) }
        : { name: name }];
      this._ranked.slice(0, 2).forEach(function (t) {
        if (t.name !== name) rows.push({ name: t.name, v: t.v, agency: t.agency, lead: t.lead, rank: rankOf(t.name) });
      });
      this._renderList(rows, name);
      this._status(rec
        ? name + " \u00b7 rank " + rankOf(name) + " of " + this._ranked.length + " filed, shown against the highest counts"
        : name + " filed no record \u00b7 shown against the highest counts");
      this._zoomTo(name);
    }
  }

  if (!customElements.get("state-explorer")) customElements.define("state-explorer", StateExplorer);
  window["state-explorer"] = StateExplorer;
})();
