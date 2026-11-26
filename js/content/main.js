// Script de conteúdo do uBlockTube. Roda no começo de cada página do YouTube (run_at:
// document_start), marca se o bloqueio está ligado (a preferência vem da janelinha) e
// injeta os ganchos de js/page/youtube-hooks.js no mundo principal da página, antes de o
// próprio YouTube rodar.
(function () {
  var html = document.documentElement;

  // Ligado por padrão, até a preferência salva ser lida. A janelinha salva "ativo": false
  // para desligar; a mudança vale a partir do próximo carregamento da página.
  html.dataset.ublocktubeAtivo = "sim";
  chrome.storage.local.get("ativo", function (dados) {
    html.dataset.ublocktubeAtivo = dados && dados.ativo === false ? "nao" : "sim";
  });

  var script = document.createElement("script");
  script.textContent = "(" + window.uBlockTube.pageHooks.toString() + ")();";
  (document.head || html).appendChild(script);
  script.remove();
})();
