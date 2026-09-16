(function () {
  "use strict";

  // O token vive em state-explorer.js (constante MAPBOX_TOKEN, ~linha 39) e é
  // publicado em window.__WMC_MAPBOX_TOKEN. Aqui só consumimos, para não haver
  // duas cópias do mesmo segredo no projeto.
  function token(el) {
    return (el.getAttribute("data-mapbox-token") || window.__WMC_MAPBOX_TOKEN || "").trim();
  }

  var INK = "#000000", RULE = "#2A2D30", RULE_STRONG = "#4A4E52";
  var PAPER = "#F2EFEA", MUTED = "#9E9891", EMBER = "#E8613C";

  // --------------------------------------------------------------------
  // DADOS FICTÍCIOS. Nada aqui vem de fonte real: é um campo de densidade
  // gerado por PRNG com semente fixa, para a página ter o que mostrar em
  // cada métrica. Determinístico de propósito — o mesmo mapa a cada carga.
  // NÃO apresentar como registro verificado.  Ver PRODUCT.md > Evidence.
  // --------------------------------------------------------------------
  function mulberry32(a) {
    return function () {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      var t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  // Focos por métrica: [lon, lat, raio graus, peso]. Escolhidos por plausibilidade
  // geográfica (Sierra, Cascades, Rockies, Planícies, Sudeste), não por dado.
  var METRICS = [
    { id: "all",     label: "All land",       unit: "incidents",
      caption: "every reported wildfire start, all land classes.",
      seeds: [[-120.5,38.5,3.2,1],[-122,44.5,2.6,.95],[-111,40,3,.7],[-99,31.5,3.6,.9],
              [-105,39,2.4,.6],[-84,31,3,.5],[-115,34,2.6,.55]] },
    { id: "parks",   label: "National parks", unit: "park incidents",
      caption: "starts on land managed by the National Park Service.",
      seeds: [[-119.5,37.8,1.1,1],[-110.7,44.6,1.3,.9],[-113,36.2,1.1,.8],
              [-121.7,46.9,.9,.6],[-103.4,29.3,1,.5]] },
    { id: "forest",  label: "Forest",         unit: "forest incidents",
      caption: "starts on national and state forest land.",
      seeds: [[-122.5,45,2.4,1],[-116,45.5,2.2,.9],[-120,39.5,2,.85],
              [-107,38,2.2,.7],[-83.5,35.5,2,.6],[-92.5,34.5,1.8,.45]] },
    { id: "grass",   label: "Grassland",      unit: "grassland incidents",
      caption: "starts on grassland and rangeland.",
      seeds: [[-100,38,3.4,1],[-99,32,3,.95],[-102,45,2.8,.7],
              [-97.5,35.5,2.4,.8],[-104,42,2.4,.6]] }
  ];

  /* Regiões: focos por plausibilidade geográfica, não por dado.
     [lon, lat, raio graus, peso] */
  var REGIOES = {
    southwest: { label: "Southwest",
      seeds: [[-120.5,36.5,3.0,1],[-115,34,2.6,.9],[-111.5,33.8,2.4,.8],
              [-106,34.5,2.6,.7],[-117,39,2.2,.6]] },
    southeast: { label: "Southeast",
      seeds: [[-84,31,3.0,1],[-81.5,28.5,2.6,.9],[-88,33,2.4,.75],
              [-80,34.5,2.2,.7],[-86,35.5,2.0,.55]] },
    northwest: { label: "Northwest",
      seeds: [[-122,45.5,2.6,1],[-120,47.2,2.4,.9],[-115,46.5,2.6,.85],
              [-112,46.8,2.8,.7],[-117,44,2.2,.6]] }
  };

  /* Os dois conjuntos de controle. "land" é o original; "quality" é o do
     wireframe da página Wildfire Data. Preset em vez de bifurcar o componente:
     home, company e scenario continuam no conjunto de classes de solo. */
  var PRESETS = {
    land: {
      grupos: [{ id: "metric", label: "Jump to metric", tipo: "choice",
                 opcoes: METRICS.map(function (m) { return { id: m.id, label: m.label }; }) }],
      padrao: { metric: "all" }
    },
    quality: {
      grupos: [
        { id: "data", label: "Data", tipo: "choice", opcoes: [
            { id: "wildfires", label: "Wildfires" },
            { id: "quality",   label: "Data Quality" } ] },
        { id: "location", label: "Location", tipo: "choice", opcoes: [
            { id: "southwest", label: "Southwest" },
            { id: "southeast", label: "Southeast" },
            { id: "northwest", label: "Northwest" } ] },
        { id: "year", label: "Year", tipo: "select",
          opcoes: ["2023","2022","2021","2020"].map(function (a) { return { id: a, label: a }; }) }
      ],
      padrao: { data: "wildfires", location: "southwest", year: "2021" }
    }
  };

  function semente(estado) {
    var txt = Object.keys(estado).sort().map(function (k) { return k + estado[k]; }).join("|");
    return txt.split("").reduce(function (a, c) { return (a * 31 + c.charCodeAt(0)) | 0; }, 7);
  }

  /* O estado combinado vira um campo. A LOCALIZAÇÃO manda na geografia — sem
     isso o mapa mostraria o Sudeste quando o usuário pediu o Sudoeste, e um
     dado ilustrativo no lugar errado deixa de ser ilustrativo e passa a ser
     enganoso. "Data Quality" gera menos pontos e mais espalhados: a leitura é
     de cobertura falha, não de incidência. */
  function campoPara(preset, estado) {
    if (preset === "land") {
      var m = METRICS.filter(function (x) { return x.id === estado.metric; })[0] || METRICS[0];
      return fieldFor(m);
    }
    var reg = REGIOES[estado.location] || REGIOES.southwest;
    var falha = estado.data === "quality";
    var rnd = mulberry32(semente(estado));
    var feats = [];
    reg.seeds.forEach(function (s) {
      var n = Math.round((falha ? 45 : 110) * s[3]) + (falha ? 12 : 30);
      var espalha = falha ? 1.9 : 1.0;                  // lacuna se dispersa
      for (var i = 0; i < n; i++) {
        var ang = rnd() * Math.PI * 2;
        var rad = Math.pow(rnd(), falha ? 1.05 : 1.7) * s[2] * espalha;
        var lon = s[0] + Math.cos(ang) * rad * 1.3;
        var lat = s[1] + Math.sin(ang) * rad;
        if (lon < -125 || lon > -66.5 || lat < 24.5 || lat > 49.4) continue;
        feats.push({ type: "Feature",
          geometry: { type: "Point", coordinates: [lon, lat] },
          properties: { w: Math.round((0.25 + rnd() * 0.75) * s[3] * 100) / 100 } });
      }
    });
    return { type: "FeatureCollection", features: feats };
  }

  function fieldFor(metric) {
    var rnd = mulberry32(metric.id.split("").reduce(function (a, c) { return a + c.charCodeAt(0); }, 7));
    var feats = [];
    metric.seeds.forEach(function (s) {
      var n = Math.round(90 * s[3]) + 30;
      for (var i = 0; i < n; i++) {
        var ang = rnd() * Math.PI * 2, rad = Math.pow(rnd(), 1.7) * s[2];
        var lon = s[0] + Math.cos(ang) * rad * 1.3;
        var lat = s[1] + Math.sin(ang) * rad;
        if (lon < -125 || lon > -66.5 || lat < 24.5 || lat > 49.4) continue;
        feats.push({ type: "Feature",
          geometry: { type: "Point", coordinates: [lon, lat] },
          properties: { w: Math.round((0.25 + rnd() * 0.75) * s[3] * 100) / 100 } });
      }
    });
    return { type: "FeatureCollection", features: feats };
  }

  class MetricMap extends HTMLElement {
    connectedCallback() {
      if (this._built) return;
      this._built = true;
      this.style.display = "block";
      this._preset = PRESETS[this.getAttribute("data-controls")] ? this.getAttribute("data-controls") : "land";
      this._estado = Object.assign({}, PRESETS[this._preset].padrao);
      this._render();
      this._boot();
    }

    /* O destino vem do atributo: na home leva a outra pagina, e na propria
       pagina de destino o botao some para nao virar auto-link. */
    _ctaHTML() {
      var href = this.getAttribute("data-cta-href");
      if (href === "none") return "";
      var rotulo = this.getAttribute("data-cta-label") || "Full fire data";
      return '<a href="' + (href || "data.html") + '" class="wmc-btn wmc-btn--start">' + rotulo + '</a>';
    }

    _render() {
      this.innerHTML =
        '<div class="wmc-explorer" style="position:relative;width:100%">' +
          '<div data-role="map" class="wmc-explorer-map"></div>' +
          '<div class="wmc-explorer-panel">' +
            '<h3 class="wmc-panel-title">Wildfire data</h3>' +
            '<p style="margin:0;max-width:48ch;font-size:clamp(14px,1.08cqw,16px);line-height:1.72;color:#BDB7AF;text-wrap:pretty">The US is experiencing a historic wildfire season. This data provides insights into the number of incidents, acres burned, and containment status across the country.</p>' +
            this._ctaHTML() +
            '<div data-role="controls" class="wmc-controls"></div>' +
            '<p data-role="note" aria-live="polite" style="margin:0;font-size:clamp(13px,1cqw,14px);line-height:1.66;color:#BDB7AF;max-width:46ch"></p>' +
            '<p class="wmc-label" style="margin:0;color:' + RULE_STRONG + '">Illustrative density · not a filed record</p>' +
          '</div>' +
        '</div>';
      this._controles();
      this._note();
    }

    /* Um grupo por linha. `choice` vira grade de chips, `select` vira <select>
       nativo — teclado, busca por digitação e leitor de tela vêm de graça. */
    _controles() {
      var self = this, box = this.querySelector('[data-role="controls"]');
      var grupos = PRESETS[this._preset].grupos;

      box.innerHTML = grupos.map(function (g, gi) {
        var idRot = "wmc-ctl-" + gi + "-" + Math.random().toString(36).slice(2, 7);
        if (g.tipo === "select") {
          var opts = g.opcoes.map(function (o) {
            return '<option value="' + o.id + '"' + (self._estado[g.id] === o.id ? " selected" : "") + '>' + o.label + '</option>';
          }).join("");
          return '<div class="wmc-control">' +
            '<label class="wmc-label" for="' + idRot + '">' + g.label + '</label>' +
            '<select class="wmc-select" id="' + idRot + '" data-group="' + g.id + '">' + opts + '</select>' +
          '</div>';
        }
        var chips = g.opcoes.map(function (o) {
          return '<button type="button" class="wmc-chip" data-group="' + g.id + '" data-opt="' + o.id + '" ' +
            'aria-pressed="' + (self._estado[g.id] === o.id) + '">' + o.label + '</button>';
        }).join("");
        return '<div class="wmc-control">' +
          '<p class="wmc-label" id="' + idRot + '">' + g.label + '</p>' +
          '<div class="wmc-chipbox"><div role="group" aria-labelledby="' + idRot + '" class="wmc-chips">' + chips + '</div></div>' +
        '</div>';
      }).join("");

      box.onclick = function (e) {
        var b = e.target.closest("button[data-opt]");
        if (!b) return;
        var g = b.getAttribute("data-group"), o = b.getAttribute("data-opt");
        if (self._estado[g] === o) return;
        self._estado[g] = o;
        self._controles(); self._note(); self._paint();
      };
      box.onchange = function (e) {
        var sel = e.target.closest("select[data-group]");
        if (!sel) return;
        self._estado[sel.getAttribute("data-group")] = sel.value;
        self._note(); self._paint();
      };
    }

    _rotulo(grupo, id) {
      var g = PRESETS[this._preset].grupos.filter(function (x) { return x.id === grupo; })[0];
      if (!g) return id;
      var o = g.opcoes.filter(function (x) { return x.id === id; })[0];
      return o ? o.label : id;
    }

    _note() {
      var forte = function (t) { return '<strong style="font-weight:600;color:' + PAPER + '">' + t + '</strong>'; };
      var txt;
      if (this._preset === "land") {
        var m = METRICS.filter(function (x) { return x.id === this._estado.metric; }, this)[0] || METRICS[0];
        txt = "Showing " + forte(m.label) + " — " + m.caption;
      } else {
        var e = this._estado;
        txt = e.data === "quality"
          ? "Showing " + forte("reporting gaps") + " across the " + forte(this._rotulo("location", e.location)) +
            " in " + e.year + " — where stations filed late, partially, or not at all."
          : "Showing " + forte("wildfire starts") + " across the " + forte(this._rotulo("location", e.location)) +
            " in " + e.year + " — every reported start, all land classes.";
      }
      this.querySelector('[data-role="note"]').innerHTML = txt;
    }
    _fail(msg) {
      var h = this.querySelector('[data-role="map"]');
      if (h) h.innerHTML = '<p style="margin:0;padding:24px;font:500 11px/1.6 Krub,system-ui;letter-spacing:.2em;text-transform:uppercase;color:' + MUTED + '">' + msg + '</p>';
    }

    _boot() {
      var self = this, tries = 0;
      (function poll() {
        var t = token(self);
        if (window.mapboxgl && t) return self._map_(t);
        if (++tries > 120) return self._fail("Map unavailable — no Mapbox token");
        setTimeout(poll, 60);
      })();
    }

    _map_(t) {
      var self = this, host = this.querySelector('[data-role="map"]');
      host.style.position = "relative";
      var el = document.createElement("div");
      el.style.cssText = "position:absolute;inset:0;background:#000000";
      host.appendChild(el);
      window.mapboxgl.accessToken = t;
      var map;
      try {
        map = new window.mapboxgl.Map({
          container: el, style: "mapbox://styles/mapbox/dark-v11",
          bounds: [[-125.2, 24.2], [-66.5, 49.6]],
          fitBoundsOptions: { padding: this._pad() },
          cooperativeGestures: true
        });
      } catch (e) { return this._fail("Map failed to initialise"); }
      this._map = map;
      map.on("error", function (ev) {
        var m = (ev && ev.error && ev.error.message) || "";
        if (/access token|Unauthorized|401|403/i.test(m)) self._fail("Map unavailable — token rejected");
      });
      map.addControl(new window.mapboxgl.NavigationControl({ showCompass: false }), "top-left");
      map.on("load", function () {
        ["water", "waterway"].forEach(function (id) {
          if (!map.getLayer(id)) return;
          try { map.setPaintProperty(id, map.getLayer(id).type + "-color", INK); } catch (e) {}
        });
        map.addSource("field", { type: "geojson", data: campoPara(self._preset, self._estado) });
        map.addLayer({ id: "field-heat", type: "heatmap", source: "field",
          paint: {
            "heatmap-weight": ["interpolate", ["linear"], ["get", "w"], 0, 0, 1, 1],
            "heatmap-intensity": ["interpolate", ["linear"], ["zoom"], 2, 0.9, 7, 2.2],
            "heatmap-radius": ["interpolate", ["linear"], ["zoom"], 2, 18, 7, 52],
            "heatmap-opacity": 0.85,
            "heatmap-color": ["interpolate", ["linear"], ["heatmap-density"],
              0,    "rgba(0,0,0,0)",
              0.18, "rgba(122,29,16,0.55)",
              0.42, "rgba(192,48,26,0.75)",
              0.68, "rgba(232,97,60,0.88)",
              1,    "rgba(244,131,95,0.96)"]
          } });
        self._ready = true;
        addEventListener("resize", function () { if (self._map) self._map.resize(); });
      });
    }
    _pad() {
      var h = this.querySelector('[data-role="map"]');
      var w = h ? h.getBoundingClientRect().width : 0;
      return w >= 860 ? { top: 28, bottom: 28, left: 28, right: Math.round(w * 0.52) }
                      : { top: 20, bottom: 20, left: 20, right: 20 };
    }
    _paint() {
      if (!this._map || !this._ready) return;
      var src = this._map.getSource("field");
      if (src) src.setData(campoPara(this._preset, this._estado));
    }
  }

  if (!customElements.get("metric-map")) customElements.define("metric-map", MetricMap);
  window["metric-map"] = MetricMap;
})();
