/* analytics.js — um evento por página aberta, e nada além disso.
 *
 * O site é estático, não tem conta nem sessão: o que dá para saber é quais
 * páginas alguém abre e de onde veio. É exatamente isso que sai daqui — um
 * "Page Viewed" por carga. Nenhum clique, nenhuma rolagem, nenhum campo
 * digitado, nenhuma gravação de tela. Ampliar isso é decisão de produto, não
 * um ajuste de configuração: mexa aqui de propósito, não por acidente.
 *
 * O token é o token PÚBLICO do projeto (o de 32 caracteres em Project
 * Settings). Ele é visível no JavaScript de qualquer site que use Mixpanel —
 * esconder não protege, e não é o segredo da API. O que nunca pode aparecer
 * aqui é um service account ou um secret de API.
 *
 * Por que tudo cabe num arquivo só, em vez de duas <script> na página: a home
 * é um artboard, e o runtime dela recria as tags do <helmet> com
 * createElement — script criado por script é async, e a ordem entre duas tags
 * deixa de ser garantida. Nas páginas do build `defer` resolveria; na home,
 * não. Com o snippet e a chamada no mesmo arquivo não há ordem para acertar.
 */
(function () {
  "use strict";

  var TOKEN = "0b582cabab3a2a3acedcf5417ab8fb1c";

  /* A biblioteca é servida pelo próprio site, e não por um CDN de terceiros.
     Não é preferência: o snippet abaixo é quem cria a tag da biblioteca, e ele
     não sabe declarar `integrity`. Todo o resto do site carrega biblioteca de
     versão fixa com hash conferido; de um CDN, esta seria a única sem. Vindo
     da mesma origem, alterá-la exige alterar o repositório.

     Para atualizar:
       curl -sL -o vendor/mixpanel-2.83.0.min.js \
         https://unpkg.com/mixpanel-browser@2.83.0/dist/mixpanel.min.js
     trocando a versão nos dois lugares e renomeando o arquivo — o número no
     nome é o que faz o navegador buscar a nova em vez de servir a antiga.

     Arquivo em uso: mixpanel-browser 2.83.0, dist/mixpanel.min.js
     sha384-HPSn2pi8RCGX0AsP5a6qe3ywIZ0Ab9aJyB2pWGarwT389B04EdDZQzJZBcT06Rb4

     Caminho relativo de propósito: sob o GitHub Pages o site pode estar numa
     subpasta, e "/vendor/..." apontaria para fora dela. */
  window.MIXPANEL_CUSTOM_LIB_URL = "vendor/mixpanel-2.83.0.min.js";

  /* Duas tags na mesma página dariam dois "Page Viewed" para uma visita só —
     número errado, e errado em silêncio. */
  if (window.__WMC_ANALYTICS) return;
  window.__WMC_ANALYTICS = true;

  /* --- snippet oficial do Mixpanel, colado como vem, não editar -----------
     Ele instala o stub `window.mixpanel`, que enfileira as chamadas e as
     repete quando a biblioteca chega. É obrigatório: dist/mixpanel.min.js
     inicializa a partir dessa fila e sem ela só escreve no console que o
     objeto não foi inicializado. Vem de
     mixpanel-browser@2.83.0/dist/mixpanel-jslib-snippet.min.js */
  (function(e,c){if(!c.__SV){var l,h;window.mixpanel=c;c._i=[];c.init=function(q,r,f){function t(d,a){var g=a.split(".");2==g.length&&(d=d[g[0]],a=g[1]);d[a]=function(){d.push([a].concat(Array.prototype.slice.call(arguments,0)))}}var b=c;"undefined"!==typeof f?b=c[f]=[]:f="mixpanel";b.people=b.people||[];b.toString=function(d){var a="mixpanel";"mixpanel"!==f&&(a+="."+f);d||(a+=" (stub)");return a};b.people.toString=function(){return b.toString(1)+".people (stub)"};l="disable time_event track track_pageview track_links track_forms track_with_groups add_group set_group remove_group register register_once alias unregister identify name_tag set_config reset opt_in_tracking opt_out_tracking has_opted_in_tracking has_opted_out_tracking clear_opt_in_out_tracking start_batch_senders start_session_recording stop_session_recording people.set people.set_once people.unset people.increment people.append people.union people.track_charge people.clear_charges people.delete_user people.remove".split(" ");
  for(h=0;h<l.length;h++)t(b,l[h]);var n="set set_once union unset remove delete".split(" ");b.get_group=function(){function d(p){a[p]=function(){b.push([g,[p].concat(Array.prototype.slice.call(arguments,0))])}}for(var a={},g=["get_group"].concat(Array.prototype.slice.call(arguments,0)),m=0;m<n.length;m++)d(n[m]);return a};c._i.push([q,r,f])};c.__SV=1.2;var k=e.createElement("script");k.type="text/javascript";k.async=!0;k.src="undefined"!==typeof MIXPANEL_CUSTOM_LIB_URL?MIXPANEL_CUSTOM_LIB_URL:"file:"===
  e.location.protocol&&"//cdn.mxpnl.com/libs/mixpanel-2-latest.min.js".match(/^\/\//)?"https://cdn.mxpnl.com/libs/mixpanel-2-latest.min.js":"//cdn.mxpnl.com/libs/mixpanel-2-latest.min.js";e=e.getElementsByTagName("script")[0];e.parentNode.insertBefore(k,e)}})(document,window.mixpanel||[])

  /* --- daqui para baixo é nosso ----------------------------------------- */

  mixpanel.init(TOKEN, {
    /* Projeto na residência dos EUA — api.mixpanel.com é o padrão da
       biblioteca. Um projeto criado na UE ou na Índia falaria com
       api-eu.mixpanel.com / api-in.mixpanel.com, e a troca é aqui. */
    api_host: "https://api.mixpanel.com",

    /* localStorage em vez de cookie: o identificador anônimo é do navegador e
       não precisa viajar junto de toda requisição ao servidor. */
    persistence: "localStorage",

    /* O pageview sai logo abaixo, escrito, com o nome que escolhemos. O
       automático da biblioteca mandaria um segundo evento por carga. */
    track_pageview: false,

    /* Três padrões da biblioteca, escritos porque aqui são promessas: nada de
       captura automática de clique, nada de gravação de sessão, e o Do Not
       Track do navegador continua sendo respeitado. */
    autocapture: false,
    record_sessions_percent: 0,
    ignore_dnt: false
  });

  mixpanel.track("Page Viewed", { page: pagina(), title: document.title });

  /* "state.html" -> "state"; "/" e "index.html" -> "home". O Mixpanel já
     guarda a URL inteira em $current_url; este é o nome curto pelo qual dá
     para agrupar sem depender de onde o site está publicado. */
  function pagina() {
    var arquivo = location.pathname.split("/").pop();
    if (!arquivo || arquivo === "index.html") return "home";
    return arquivo.replace(/\.html$/, "");
  }
})();
