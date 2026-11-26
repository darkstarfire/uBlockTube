// Script de conteúdo do uBlockTube. Roda no começo de cada página do YouTube (run_at:
// document_start) e injeta os ganchos de js/page/youtube-hooks.js no mundo principal da
// página, antes de o próprio YouTube rodar.
(function () {
  var script = document.createElement("script");
  script.textContent = "(" + window.uBlockTube.pageHooks.toString() + ")();";
  (document.head || document.documentElement).appendChild(script);
  script.remove();
})();
