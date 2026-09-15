(function () {
  "use strict";

  var GROUND = "#F7F5F2", INK = "#1A1A1A", MUTED = "#595653", NODATA = "#E3DFD9",
      EDGE = "#8A8279";
  var RAMP = [
    { color: "#F2B705", label: "Low",      ink: INK },
    { color: "#E8850C", label: "Moderate", ink: INK },
    { color: "#C0301A", label: "High",     ink: "#FFFFFF" },
    { color: "#7A1D10", label: "Extreme",  ink: "#FFFFFF" }
  ];

  // FIPS ids of the 48 contiguous states + DC. Anything else (AK 02, HI 15,
  // PR 72, GU 66, MP 69, AS 60, VI 78, UM 74) must not enter the projection fit.
  var CONTIGUOUS = {
    "01":1,"04":1,"05":1,"06":1,"08":1,"09":1,"10":1,"11":1,"12":1,"13":1,
    "16":1,"17":1,"18":1,"19":1,"20":1,"21":1,"22":1,"23":1,"24":1,"25":1,
    "26":1,"27":1,"28":1,"29":1,"30":1,"31":1,"32":1,"33":1,"34":1,"35":1,
    "36":1,"37":1,"38":1,"39":1,"40":1,"41":1,"42":1,"44":1,"45":1,"46":1,
    "47":1,"48":1,"49":1,"50":1,"51":1,"53":1,"54":1,"55":1,"56":1
  };

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
      .then(function () {
        return fetch("https://cdn.jsdelivr.net/npm/us-atlas@3.0.1/states-10m.json");
      })
      .then(function (r) { return r.json(); })
      .then(function (topo) {
        var fc = window.topojson.feature(topo, topo.objects.states);
        return {
          type: "FeatureCollection",
          features: fc.features.filter(function (f) {
            return CONTIGUOUS[String(f.id)];
          })
        };
      });
    return geoPromise;
  }

  function fmt(n) { return n.toLocaleString("en-US"); }

  function bucketOf(v, t) {
    if (v == null) return -1;
    if (v < t[0]) return 0;
    if (v < t[1]) return 1;
    if (v < t[2]) return 2;
    return 3;
  }

  function ranges(t) {
    return [
      "1 – " + fmt(t[0] - 1),
      fmt(t[0]) + " – " + fmt(t[1] - 1),
      fmt(t[1]) + " – " + fmt(t[2] - 1),
      fmt(t[2]) + " or more"
    ];
  }

  var W = 1000, H = 562;

  class USChoropleth extends HTMLElement {
    static get observedAttributes() {
      return ["data-values", "data-thresholds", "data-unit", "data-empty", "data-legend", "data-frame", "data-theme"];
    }
    connectedCallback() {
      if (this._built) return;
      this._built = true;
      this.style.display = "block";
      this.innerHTML =
        '<div data-role="wrap" style="display:flex;flex-direction:column;gap:20px"></div>';
      var self = this;
      geometry().then(function (geo) {
        self._geo = geo;
        var proj = window.d3.geoAlbers().fitSize([W, H], geo);
        self._path = window.d3.geoPath(proj);
        self._proj = proj;
        self._ready = true;
        self._paint();
      }).catch(function (e) {
        self.querySelector('[data-role="wrap"]').innerHTML =
          '<p style="font:400 15px/1.5 Archivo,system-ui;color:' + MUTED + '">Map geometry could not be loaded.</p>';
        console.error(e);
      });
    }
    attributeChangedCallback() { if (this._ready) this._paint(); }

    _read(name, fallback) {
      var raw = this.getAttribute(name);
      if (!raw) return fallback;
      try { return JSON.parse(raw); } catch (e) { return fallback; }
    }

    _paint() {
      var values = this._read("data-values", {}) || {};
      var thresholds = this._read("data-thresholds", [2500, 5000, 8000]);
      var unit = this.getAttribute("data-unit") || "incidents";
      var emptyMsg = this.getAttribute("data-empty") || "";
      var showLegend = this.getAttribute("data-legend") !== "none";
      var isEmpty = Object.keys(values).length === 0;
      var rng = ranges(thresholds);
      // data-theme="dark" recolors only the chrome OUTSIDE the map panel;
      // data-theme="night" also darkens the panel itself, for dark pages.
      var th = this.getAttribute("data-theme");
      var night = th === "night", dk = night || th === "dark";
      var lInk = dk ? "#F2EFEA" : INK, lMuted = dk ? "#9E9891" : MUTED;
      var ground = night ? "#15171A" : GROUND;
      var nodata = night ? "#23262A" : NODATA;
      var hair = night ? "#4A4E52" : INK;
      var self = this;

      var paths = this._geo.features.map(function (f) {
        var name = f.properties.name;
        var v = values[name];
        var b = bucketOf(v == null ? null : v, thresholds);
        var fill = b < 0 ? nodata : RAMP[b].color;
        var title = b < 0
          ? name + " — no data"
          : name + " — " + fmt(v) + " " + unit + " (" + RAMP[b].label + ")";
        return '<path d="' + self._path(f) + '" fill="' + fill +
          '" stroke="' + hair + '" stroke-width="0.6" stroke-linejoin="round">' +
          '<title>' + title + '</title></path>';
      }).join("");

      var marks = this._geo.features.filter(function (f) {
        return values[f.properties.name] != null;
      }).map(function (f) {
        var v = values[f.properties.name];
        var b = bucketOf(v, thresholds);
        var c = self._path.centroid(f);
        if (!isFinite(c[0])) return "";
        // Halo in the state's own bucket color: a 5-digit run is wider than the
        // usable interior of many states, so the glyphs can overhang onto a
        // neighbour. The stroke guarantees the contrast pair stays
        // ink-on-bucket-color wherever the run lands.
        return '<text x="' + c[0].toFixed(1) + '" y="' + c[1].toFixed(1) +
          '" text-anchor="middle" font-family="Archivo,system-ui" font-size="26" font-weight="700" ' +
          'paint-order="stroke" stroke="' + RAMP[b].color + '" stroke-width="5" ' +
          'stroke-linejoin="round" fill="' + RAMP[b].ink + '">' + fmt(v) + '</text>';
      }).join("");

      var svg =
        '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" width="100%" ' +
        'style="display:block;width:100%;height:auto;background:' + ground + '" ' +
        'aria-label="Choropleth map of the contiguous United States. ' +
        (isEmpty ? "No states have data for this metric."
                 : Object.keys(values).map(function (k) { return k + " " + fmt(values[k]) + " " + unit; }).join(", ") +
                   ". All other states have no data.") + '">' +
        paths + marks + '</svg>';

      var overlay = isEmpty && emptyMsg
        ? '<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;padding:24px">' +
            '<div role="status" style="max-width:34em;background:' + (night ? "#1B1E21" : "#FFFFFF") + ';border:1px solid ' + (night ? "#3E4246" : EDGE) +
            ';padding:24px 28px;display:flex;flex-direction:column;gap:10px">' +
              '<span style="font:700 12px/1 Archivo,system-ui;letter-spacing:.16em;text-transform:uppercase;color:' + lMuted + '">No data yet</span>' +
              '<p style="margin:0;font:400 16px/1.5 Archivo,system-ui;color:' + lInk + ';text-wrap:pretty">' + emptyMsg + '</p>' +
            '</div></div>'
        : "";

      var legend = "";
      if (showLegend) {
        var items = RAMP.map(function (r, i) {
          return '<li style="display:flex;align-items:center;gap:10px;min-height:24px">' +
            '<span aria-hidden="true" style="flex:none;width:22px;height:14px;background:' + r.color +
            ';border:1px solid ' + hair + '"></span>' +
            '<span style="font:600 13px/1.2 Archivo,system-ui;letter-spacing:.06em;text-transform:uppercase;color:' + lInk +
            ';min-width:5.5em">' + r.label + '</span>' +
            '<span style="font:400 14px/1.2 Archivo,system-ui;color:' + lMuted + '">' + rng[i] + '</span>' +
            '</li>';
        }).join("");
        items += '<li style="display:flex;align-items:center;gap:10px;min-height:24px">' +
          '<span aria-hidden="true" style="flex:none;width:22px;height:14px;background:' + nodata +
          ';border:1px solid ' + hair + '"></span>' +
          '<span style="font:600 13px/1.2 Archivo,system-ui;letter-spacing:.06em;text-transform:uppercase;color:' + lInk +
          ';min-width:5.5em">No data</span>' +
          '<span style="font:400 14px/1.2 Archivo,system-ui;color:' + lMuted + '">Not yet reported</span></li>';
        legend =
          '<div style="display:flex;flex-direction:column;gap:12px">' +
          '<span style="font:700 12px/1 Archivo,system-ui;letter-spacing:.16em;text-transform:uppercase;color:' + lMuted +
          '">Legend — ' + unit + ' per state</span>' +
          '<ul style="list-style:none;margin:0;padding:0;display:grid;grid-template-columns:repeat(auto-fit,minmax(min(220px,100%),1fr));gap:10px 24px">' +
          items + '</ul></div>';
      }

      var frame = this.getAttribute("data-frame") === "none"
        ? "" : "border:1px solid " + (night ? "#3E4246" : EDGE) + ";";
      this.querySelector('[data-role="wrap"]').innerHTML =
        '<div style="position:relative;' + frame + 'background:' + ground + '">' +
        svg + overlay + '</div>' + legend;
    }
  }

  if (!window.customElements.get("us-choropleth")) {
    window.customElements.define("us-choropleth", USChoropleth);
  }
})();
