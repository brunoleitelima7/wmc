/* section-rail.js — trilha de seções fixa na lateral direita.
 *
 * Um traço por seção marcada com data-rail-label. O traço da seção em vista
 * fica mais longo e em ember; ao passar o mouse (ou focar pelo teclado) o nome
 * da seção aparece à esquerda do traço; clicar leva até ela.
 *
 * Duas coisas que o runtime do dc (React 18) exige e que estão resolvidas aqui:
 *   - o React troca nós quando re-renderiza, então a lista de seções é
 *     revalidada por isConnected e por MutationObserver, nunca cacheada e
 *     esquecida;
 *   - o mesmo motivo faz connectedCallback poder rodar mais de uma vez, então
 *     tudo que é registrado fora do elemento é desfeito em disconnectedCallback.
 */
(function () {
  "use strict";

  var ALVO = 0.38;          // fração da altura da janela que define "seção em vista"

  function reduzMovimento() {
    return window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  class SectionRail extends HTMLElement {
    connectedCallback() {
      if (this._pronto) return;
      this._pronto = true;

      this.innerHTML =
        '<nav class="wmc-rail" aria-label="Sections"><ul data-role="lista"></ul></nav>';
      this._lista = this.querySelector('[data-role="lista"]');

      this._secoes = [];
      this._ativo = null;
      this._quadro = 0;

      this._aoRolar = this._aoRolar.bind(this);
      this._aoClicar = this._aoClicar.bind(this);

      this._montarItens();

      addEventListener("scroll", this._aoRolar, { passive: true });
      addEventListener("resize", this._aoRolar, { passive: true });
      this._lista.addEventListener("click", this._aoClicar);

      // O React pode trocar as <section> depois da primeira montagem; quando
      // isso acontece os nós guardados aqui ficam órfãos e a trilha congela.
      this._mo = new MutationObserver(function () {
        if (this._secoesMudaram()) this._montarItens();
      }.bind(this));
      this._mo.observe(document.body, { childList: true, subtree: true });

      this._aoRolar();
    }

    disconnectedCallback() {
      removeEventListener("scroll", this._aoRolar);
      removeEventListener("resize", this._aoRolar);
      if (this._mo) this._mo.disconnect();
      if (this._quadro) cancelAnimationFrame(this._quadro);
      this._pronto = false;
    }

    /* --- montagem ---------------------------------------------------- */

    _buscarSecoes() {
      return [].slice.call(document.querySelectorAll("section[data-rail-label]"));
    }

    _secoesMudaram() {
      var atuais = this._buscarSecoes();
      if (atuais.length !== this._secoes.length) return true;
      for (var i = 0; i < atuais.length; i++) {
        if (atuais[i] !== this._secoes[i] || !this._secoes[i].isConnected) return true;
      }
      return false;
    }

    _montarItens() {
      this._secoes = this._buscarSecoes();

      this._lista.innerHTML = this._secoes.map(function (sec, i) {
        var nome = sec.getAttribute("data-rail-label");
        // Sem id não há para onde navegar; gera um estável pela posição.
        if (!sec.id) sec.id = "wmc-sec-" + i;
        return '<li>' +
          '<a class="wmc-rail-link" href="#' + sec.id + '" data-idx="' + i + '">' +
            '<span class="wmc-rail-name">' + nome + '</span>' +
            '<span class="wmc-rail-tick" aria-hidden="true"></span>' +
          '</a>' +
        '</li>';
      }).join("");

      this._links = [].slice.call(this._lista.querySelectorAll(".wmc-rail-link"));
      this._ativo = null;
      this._marcar();
    }

    /* --- seção em vista ----------------------------------------------- */

    _aoRolar() {
      if (this._quadro) return;
      this._quadro = requestAnimationFrame(function () {
        this._quadro = 0;
        this._marcar();
      }.bind(this));
    }

    _calcular() {
      if (!this._secoes.length) return null;

      // No fim da página a última seção pode nunca cruzar a linha de corte —
      // sem isto o último traço jamais acenderia.
      var doc = document.documentElement;
      if (scrollY + innerHeight >= doc.scrollHeight - 2) return this._secoes.length - 1;

      var corte = innerHeight * ALVO, achou = 0;
      for (var i = 0; i < this._secoes.length; i++) {
        if (!this._secoes[i].isConnected) continue;
        if (this._secoes[i].getBoundingClientRect().top <= corte) achou = i;
      }
      return achou;
    }

    _marcar() {
      var i = this._calcular();
      if (i === null || i === this._ativo) return;
      this._ativo = i;
      this._links.forEach(function (a, n) {
        if (n === i) a.setAttribute("aria-current", "true");
        else a.removeAttribute("aria-current");
      });
    }

    /* --- navegação ----------------------------------------------------- */

    _aoClicar(e) {
      var a = e.target.closest ? e.target.closest(".wmc-rail-link") : null;
      if (!a) return;
      var sec = this._secoes[+a.getAttribute("data-idx")];
      if (!sec || !sec.isConnected) return;   // deixa o href resolver sozinho
      e.preventDefault();
      sec.scrollIntoView({
        behavior: reduzMovimento() ? "auto" : "smooth",
        block: "start"
      });
      // O hash entra no histórico para o botão voltar funcionar, mas sem o
      // salto que o navegador daria por conta própria.
      if (history.replaceState) history.replaceState(null, "", "#" + sec.id);
    }
  }

  if (!customElements.get("section-rail")) customElements.define("section-rail", SectionRail);
  window["section-rail"] = SectionRail;
})();
