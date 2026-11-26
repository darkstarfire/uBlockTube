// Ganchos da página (mundo principal do YouTube).
//
// Este arquivo é carregado como script de conteúdo, mas a função pageHooks não roda aqui:
// js/content/main.js a converte em texto e a injeta na página, onde ela troca fetch,
// XMLHttpRequest e ytInitialPlayerResponse para remover os campos de anúncio das respostas
// do player. Por isso a função não pode usar nada de fora dela.

window.uBlockTube = window.uBlockTube || {};

window.uBlockTube.pageHooks = function () {
  // Respostas em que os campos de anúncio são removidos.
  var TRATAR = /\/youtubei\/v1\/(player|next|browse)|get_watch|get_midroll|reel_watch_sequence|\/playlist\?|\/watch\?(.*&)?(v=|pbj=)/;
  // Respostas que são lidas (o corpo do vídeo em si não é).
  var OLHAR = /\/youtubei\/v1\/|get_watch|get_midroll|reel_watch_sequence|\/playlist\?|\/watch\?(.*&)?(v=|pbj=)/;
  // Só se tenta converter o texto quando um desses nomes aparece.
  var TEM_ANUNCIO = /adPlacements|adSlots|playerAds|no_ads|adBreak|adPlacement|adSlot|instreamAd|adunit/;
  var CHAVES = ["playerAds", "adPlacements", "adSlots", "no_ads"];
  // Streams de vídeo de anúncio. Regra do uBlock Origin (quick-fixes, www.youtube.com): o
  // parâmetro expire tem o formato dos anúncios; os vídeos normais começam com 1.
  var STREAM_ANUNCIO = /\.googlevideo\.com\/videoplayback\?expire=(?:[02-9]\d+|1[1-68-9]\d+|17[1-7]\d+)&/;

  // Ligado por padrão. A janelinha da extensão desliga marcando o <html> com "nao".
  function ligado() {
    return document.documentElement.dataset.ublocktubeAtivo !== "nao";
  }

  function limpar(obj) {
    if (!ligado() || !obj || typeof obj !== "object") { return false; }
    var mudou = false;
    // Respostas em lista (formato pbj=1 do YouTube): trata cada item.
    if (Array.isArray(obj)) {
      for (var j = 0; j < obj.length; j++) {
        if (limpar(obj[j])) { mudou = true; }
      }
      return mudou;
    }
    for (var i = 0; i < CHAVES.length; i++) {
      if (CHAVES[i] in obj) { delete obj[CHAVES[i]]; mudou = true; }
    }
    if (obj.playerResponse && typeof obj.playerResponse === "object") {
      if (limpar(obj.playerResponse)) { mudou = true; }
    }
    return mudou;
  }

  // Recebe o texto de uma resposta e devolve o texto sem os anúncios.
  function tratarTexto(url, texto) {
    if (typeof texto !== "string" || !TEM_ANUNCIO.test(texto) || !TRATAR.test(url)) { return texto; }
    var obj;
    try { obj = JSON.parse(texto); } catch (e) { return texto; }
    if (!limpar(obj)) { return texto; }
    return JSON.stringify(obj);
  }

  // fetch: a resposta é reescrita quando tem campos de anúncio.
  var fetchOriginal = window.fetch;
  window.fetch = function (entrada) {
    var url = typeof entrada === "string" ? entrada : (entrada && entrada.url) || "";
    var metodo = (entrada && entrada.method) || (arguments[1] && arguments[1].method) || "GET";
    if (ligado() && String(metodo).toUpperCase() === "GET" && STREAM_ANUNCIO.test(url)) {
      return Promise.reject(new TypeError("stream de anúncio bloqueado"));
    }
    var promessa = fetchOriginal.apply(this, arguments);
    if (!OLHAR.test(url)) { return promessa; }
    return promessa.then(function (resposta) {
      return resposta.clone().text().then(function (texto) {
        var novo = tratarTexto(url, texto);
        if (novo === texto) { return resposta; }
        return new Response(novo, {
          status: resposta.status,
          statusText: resposta.statusText,
          headers: resposta.headers
        });
      }, function () { return resposta; });
    });
  };

  // XMLHttpRequest: troca responseText e response (para responseType json).
  try {
    var XP = XMLHttpRequest.prototype;
    var abrirOriginal = XP.open;
    XP.open = function (metodo, url) {
      this.__ytUrl = String(url);
      this.__ytMetodo = String(metodo || "GET").toUpperCase();
      return abrirOriginal.apply(this, arguments);
    };
    var enviarOriginal = XP.send;
    XP.send = function () {
      if (ligado() && this.__ytMetodo === "GET" && STREAM_ANUNCIO.test(this.__ytUrl || "")) {
        this.abort();
        return;
      }
      return enviarOriginal.apply(this, arguments);
    };
    var descTexto = Object.getOwnPropertyDescriptor(XP, "responseText");
    var descResposta = Object.getOwnPropertyDescriptor(XP, "response");
    var ultimaEntrada = null;
    var ultimaSaida = null;
    Object.defineProperty(XP, "responseText", {
      configurable: true,
      get: function () {
        var t = descTexto.get.call(this);
        if (typeof t !== "string" || !this.__ytUrl || !OLHAR.test(this.__ytUrl)) { return t; }
        if (t === ultimaEntrada) { return ultimaSaida; }
        ultimaEntrada = t;
        ultimaSaida = tratarTexto(this.__ytUrl, t);
        return ultimaSaida;
      }
    });
    Object.defineProperty(XP, "response", {
      configurable: true,
      get: function () {
        if (this.responseType === "" || this.responseType === "text") { return this.responseText; }
        var r = descResposta.get.call(this);
        if (this.responseType === "json" && r && typeof r === "object" && this.__ytUrl && TRATAR.test(this.__ytUrl)) {
          limpar(r);
        }
        return r;
      }
    });
  } catch (e) {
    // Sem XMLHttpRequest tratado: o fetch e os dados iniciais continuam funcionando.
  }

  // Dados iniciais do primeiro vídeo, embutidos no HTML (window.ytInitialPlayerResponse).
  var inicial;
  try {
    Object.defineProperty(window, "ytInitialPlayerResponse", {
      configurable: true,
      get: function () { return inicial; },
      set: function (v) {
        limpar(v);
        inicial = v;
      }
    });
  } catch (e) {
    // A página já definiu a variável (não configurável): limpa o objeto que ela tem agora.
    if (window.ytInitialPlayerResponse) { limpar(window.ytInitialPlayerResponse); }
  }
};
