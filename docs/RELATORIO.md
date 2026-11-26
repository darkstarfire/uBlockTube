# Relatório técnico do uBlockTube

Este documento descreve como a extensão funciona, o que foi testado, o que ficou de fora e como manter o projeto.

## 1. Objetivo

Remover os anúncios do player do YouTube dentro da [Jangada](https://github.com/fabioaacarneiro/jangada), o navegador do Glove OS, que é baseado no WebKitGTK e tem um formato próprio de extensões (Manifest V3, sem service worker e sem `webRequest`).

Os escudos nativos da Jangada bloqueiam anúncios por endereço de rede e por seletor de página. Eles não conseguem separar o anúncio do vídeo no YouTube, porque os dois vêm do mesmo domínio e fazem parte da mesma resposta do player. Por isso a extensão atua sobre as respostas, e não sobre os endereços.

## 2. Arquitetura

A extensão tem dois scripts que rodam em mundos diferentes:

| Arquivo | Mundo | Função |
|---|---|---|
| `js/content/main.js` | isolado (da extensão) | Roda no começo do documento (`run_at: document_start`) e injeta os ganchos no mundo principal da página. |
| `js/page/youtube-hooks.js` | principal (da página) | Define `pageHooks`, que é convertida em texto e injetada. Troca `fetch`, `XMLHttpRequest` e `ytInitialPlayerResponse`. |

Por que dois mundos: o script de conteúdo isolado não enxerga as funções que a página usa. Uma troca de `fetch` feita nele não chega ao player. A injeção de um `<script>` com o código da função resolve isso, porque esse código roda no mundo principal.

A função `pageHooks` precisa ser autocontida: ela não pode referenciar nada fora dela, porque é serializada com `toString()`.

### 2.1 O que os ganchos tratam

- **Respostas em JSON** dos endereços `/youtubei/v1/player`, `next`, `browse`, `get_watch`, `get_midroll`, `reel_watch_sequence`, `/playlist?` e `/watch?v=` (inclusive no formato `pbj=1`, que é uma lista). Os campos `playerAds`, `adPlacements`, `adSlots` e `no_ads` são removidos, inclusive dentro de `playerResponse`.
- **`fetch`**: a resposta é clonada, convertida em texto e, se tiver campo de anúncio, é substituída por uma nova `Response` sem eles.
- **`XMLHttpRequest`**: as propriedades `responseText` e `response` são trocadas por getters que devolvem o texto tratado. Para `responseType` `json`, o objeto é limpo no momento da leitura.
- **Dados iniciais**: `window.ytInitialPlayerResponse` ganha um setter, que limpa o objeto no momento em que a página o define. Se a página já tiver definido a variável como não configurável, a extensão limpa o objeto existente.

### 2.2 Ordem de carregamento

A injeção no começo do documento depende da Jangada 2.1.6 ou mais recente, que aceita `run_at: document_start`. Em versões anteriores, a extensão rodava depois que a página ficava pronta, e o anúncio do primeiro vídeo não era tratado, porque os dados iniciais já tinham sido lidos.

## 3. Histórico de testes

Os testes foram feitos manualmente, na Jangada, com o YouTube aberto. Cada rodada mostrou um caso que ainda não estava coberto.

| Teste | Resultado |
|---|---|
| Injeção por `fetch` após a página pronta | Funcionou: a requisição `youtubei/v1/player` passou pelo gancho. |
| Injeção inline no mundo principal | Funcionou (sem CSP bloqueando). Um arquivo externo via `jangada-extension://` falhou. |
| Remoção em `fetch` e `XHR` | Funcionou para a navegação manual e a troca de vídeos pela playlist. |
| Anúncio antes do primeiro vídeo (carregamento direto) | Persistiu com a injeção tardia. Resolvido com `run_at: document_start` e com o tratamento de `ytInitialPlayerResponse`. |
| Autoplay de playlist | Anúncios apareciam de forma aleatória. Resolvido ao tratar `/watch?v=` em formato de lista (`pbj=1`). |
| Stream de vídeo do anúncio (`googlevideo.com/videoplayback`) | Apareceu em alguns testes. Uma regra de cancelamento baseada no uBlock Origin foi testada (XHR e `fetch`) e não disparou em nenhum teste. Foi removida da versão final. |
| Última rodada | Sem anúncio aparente. |

Os anúncios que ainda podem aparecer são os que chegam pelo stream de vídeo. A extensão não consegue bloqueá-los só com os ganchos, porque o stream é carregado por um caminho fora de `fetch` e XHR, ou porque a regra depende de valores de `expire` que mudam.

## 4. Limitações

- **Streams de anúncio**: anúncios que chegam pelo próprio `googlevideo.com/videoplayback` não são tratados. Esse tipo de bloqueio exige regras de rede no navegador (os escudos da Jangada), e não pode ser feito de forma confiável por JavaScript na página.
- **Mudanças do YouTube**: os nomes dos campos e dos endereços mudam com frequência. Se os anúncios voltarem, a primeira coisa a verificar é se o campo de anúncio ou o endereço da resposta ainda existe na lista de `TRATAR`, `OLHAR` e `TEM_ANUNCIO`.
- **Dependência de versão**: a injeção no começo do documento exige a Jangada 2.1.6 ou mais recente.
- **Erro de propriedade não configurável**: se a página definir `ytInitialPlayerResponse` antes do script, o setter não é instalado. A extensão cai no plano B, que limpa o objeto existente. Isso é o que aparece como `TypeError: Attempting to change configurable attribute of unconfigurable property` nos diagnósticos, e não quebra o bloqueio.

## 5. Como manter

1. Quando os anúncios voltarem, reproduza o caso (autoplay, vídeo longo, carregamento direto).
2. Veja, no inspetor da Jangada, a requisição que trouxe o anúncio. Confira se o endereço casa com `TRATAR` e `OLHAR`, e se o campo de anúncio (`adPlacements`, `adSlots` etc.) está na resposta.
3. Se for um endereço novo, adicione-o nas duas expressões. Se for um campo novo, adicione-o em `TEM_ANUNCIO` e em `CHAVES`.
4. Se o anúncio vier pelo stream de vídeo, o caminho é levar o caso ao desenvolvedor da Jangada, com a URL e o critério de `expire` observado.

## 6. Referências

- Regras de anúncio do YouTube no uBlock Origin: `assets/ublock/filters.min.txt` (linhas 10 a 35) e `assets/ublock/quick-fixes.min.txt` (regras `json-prune-*`, `trusted-rpfr` e `videoplayback`).
- Formato de extensões da Jangada: [`docs/EXTENSOES.md`](https://github.com/fabioaacarneiro/jangada/blob/main/docs/EXTENSOES.md).
- Patch que adiciona `run_at: document_start` à Jangada: incorporado à versão 2.1.6.
