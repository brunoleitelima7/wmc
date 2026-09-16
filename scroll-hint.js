/* scroll-hint.js — a pista de rolagem do primeiro fold, em Lottie.
 *
 * Existe como componente, e nao como um loadAnimation solto, por um motivo
 * concreto: antes o SVG era injetado dentro de um <div> que o React administra.
 * Quando o React re-renderizava aquele ramo, tentava remover um no que nao
 * criou e disparava NotFoundError em removeChild — erro que chegou a derrubar
 * a arvore inteira e deixar a pagina em branco.
 *
 * Montado por <x-import>, o SVG passa a viver DENTRO deste elemento. O React
 * trata o custom element como opaco e nunca mexe no que ha aqui dentro.
 *
 * O JSON ja vem recolorido (4 camadas em ember, 2 em cinza claro): aqui nao se
 * mexe em cor, so se monta.
 */
(function () {
  "use strict";

  class ScrollHint extends HTMLElement {
    connectedCallback() {
      if (this._anim || this._esperando) return;
      this.style.display = "block";
      this.style.width = "100%";
      this.style.height = "100%";
      this._montar();
    }

    disconnectedCallback() {
      if (this._t) { clearTimeout(this._t); this._t = 0; }
      if (this._anim) { try { this._anim.destroy(); } catch (e) {} this._anim = null; }
      this._esperando = false;
    }

    _montar() {
      // A biblioteca vem de <script> no topo; pode nao ter chegado ainda.
      if (!window.lottie || !window.lottie.loadAnimation) {
        if (!this.isConnected) return;
        this._esperando = true;
        this._tentativas = (this._tentativas || 0) + 1;
        if (this._tentativas > 60) return;               // ~9s e desiste
        this._t = setTimeout(function () {
          this._esperando = false;
          this._montar();
        }.bind(this), 150);
        return;
      }

      // Pista decorativa em laco infinito: sob movimento reduzido ela para.
      var reduz = window.matchMedia &&
        matchMedia("(prefers-reduced-motion: reduce)").matches;

      this._anim = window.lottie.loadAnimation({
        container: this,
        renderer: "svg",
        loop: !reduz,
        autoplay: !reduz,
        path: "scroll-hint.json"
      });

      if (reduz) {
        this._anim.addEventListener("DOMLoaded", function () {
          this._anim.goToAndStop(0, true);
        }.bind(this));
      }
    }
  }

  if (!customElements.get("scroll-hint")) customElements.define("scroll-hint", ScrollHint);
  window["scroll-hint"] = ScrollHint;
})();
