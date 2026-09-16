/* mapbox-token.js — fonte única do token público do Mapbox.
 *
 * Estava embutido no state-explorer.js, o que quebrava as páginas que usam só
 * o metric-map: elas não carregavam aquele arquivo e o mapa ficava sem token.
 *
 * É um token `pk.` (público). Ele já é visível no JavaScript de qualquer site
 * publicado — esconder não protege. O que protege é restringir por URL no
 * painel do Mapbox: Account > Tokens > URL restrictions. Faça isso antes de
 * tornar o repositório público. Nunca use um `sk.` aqui.
 */
window.__WMC_MAPBOX_TOKEN = "pk.eyJ1IjoiYnJ1bm9sZWl0ZWxpbWEiLCJhIjoiV0FISndtZyJ9.smRbtAJFvsXUFdtBBFh9Ww";
