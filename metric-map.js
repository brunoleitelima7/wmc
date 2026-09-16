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
      this._metric = METRICS[0];
      this._render();
      this._boot();
    }

    _render() {
      var lbl = "font:500 clamp(11px,0.82cqw,12px)/1 Krub,system-ui;letter-spacing:.26em;text-transform:uppercase;color:" + MUTED;
      this.innerHTML =
        '<div class="wmc-explorer" style="position:relative;width:100%">' +
          '<div data-role="map" class="wmc-explorer-map"></div>' +
          '<div class="wmc-explorer-panel">' +
            '<h3 class="wmc-panel-title">Wildfire data</h3>' +
            '<p style="margin:0;max-width:48ch;font-size:clamp(14px,1.08cqw,16px);line-height:1.72;color:#BDB7AF;text-wrap:pretty">The US is experiencing a historic wildfire season. This data provides insights into the number of incidents, acres burned, and containment status across the country.</p>' +
            '<a href="#records" class="wmc-btn wmc-btn--start">Full fire data</a>' +
            '<div style="display:flex;flex-direction:column;gap:12px">' +
              '<p id="wmc-metric-label" style="margin:0;' + lbl + '">Jump to metric</p>' +
              '<div class="wmc-chipbox"><div role="group" aria-labelledby="wmc-metric-label" data-role="chips" class="wmc-chips"></div></div>' +
            '</div>' +
            '<p data-role="note" aria-live="polite" style="margin:0;font-size:clamp(13px,1cqw,14px);line-height:1.66;color:#BDB7AF;max-width:46ch"></p>' +
            '<p style="margin:0;' + lbl + ';color:' + RULE_STRONG + '">Illustrative density · not a filed record</p>' +
          '</div>' +
        '</div>';
      this._chips();
      this._note();
    }

    _chips() {
      var self = this, box = this.querySelector('[data-role="chips"]');
      box.innerHTML = METRICS.map(function (m) {
        var on = m.id === self._metric.id;
        return '<button type="button" class="wmc-chip" data-metric="' + m.id + '" ' +
          'aria-pressed="' + on + '">' + m.label + '</button>';
      }).join("");
      box.onclick = function (e) {
        var b = e.target.closest("button[data-metric]");
        if (!b) return;
        var m = METRICS.filter(function (x) { return x.id === b.getAttribute("data-metric"); })[0];
        if (!m || m.id === self._metric.id) return;
        self._metric = m;
        self._chips(); self._note(); self._paint();
      };
    }
    _note() {
      this.querySelector('[data-role="note"]').innerHTML =
        'Showing <strong style="font-weight:600;color:' + PAPER + '">' + this._metric.label + '</strong> — ' + this._metric.caption;
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
        map.addSource("field", { type: "geojson", data: fieldFor(self._metric) });
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
      if (src) src.setData(fieldFor(this._metric));
    }
  }

  if (!customElements.get("metric-map")) customElements.define("metric-map", MetricMap);
  window["metric-map"] = MetricMap;
})();
