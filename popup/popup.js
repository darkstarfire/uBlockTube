// Janelinha do uBlockTube: mostra se o bloqueio está ligado e alterna a preferência.
// A preferência fica em storage.local, com a chave "ativo" (padrão: ligado).
(function () {
  var estado = document.getElementById("estado");
  var botao = document.getElementById("alternar");
  var ligado = true;

  function mostrar() {
    estado.textContent = ligado ? "Bloqueio ativo" : "Bloqueio desligado";
    estado.className = "estado " + (ligado ? "ligado" : "desligado");
    botao.textContent = ligado ? "Desligar bloqueio" : "Ligar bloqueio";
    botao.disabled = false;
  }

  chrome.storage.local.get("ativo", function (dados) {
    ligado = !(dados && dados.ativo === false);
    mostrar();
  });

  botao.addEventListener("click", function () {
    botao.disabled = true;
    ligado = !ligado;
    chrome.storage.local.set({ ativo: ligado }, mostrar);
  });
})();
