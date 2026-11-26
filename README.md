# uBlockTube

Extensão para a [Jangada](https://github.com/fabioaacarneiro/jangada), o navegador do Glove OS, que remove os anúncios do player do YouTube.

## Como funciona

O bloqueio tem duas partes, que rodam em mundos diferentes:

1. **Script de conteúdo** (`js/content/main.js`): roda no começo de cada página do YouTube (`run_at: document_start`). Não consegue alterar as funções da página diretamente, então injeta os ganchos da próxima parte.
2. **Ganchos da página** (`js/page/youtube-hooks.js`): trocam `fetch`, `XMLHttpRequest` e `ytInitialPlayerResponse`, e tiram os campos de anúncio (`adPlacements`, `adSlots`, `playerAds`, `no_ads`) das respostas do player antes que ele os use. Isso cobre:
   - os dados iniciais do primeiro vídeo, embutidos no HTML;
   - as respostas do player, `next`, `browse` e `get_watch`, por `fetch` e `XMLHttpRequest`;
   - a navegação pela playlist e pelo autoplay.

## Estrutura

```
uBlockTube/
├── manifest.json            manifesto (Manifest V3)
├── js/
│   ├── content/
│   │   └── main.js          script de conteúdo: injeta os ganchos na página
│   └── page/
│       └── youtube-hooks.js ganchos da página (fetch, XHR, dados iniciais)
├── docs/
│   └── RELATORIO.md         relatório técnico: arquitetura, testes e limitações
├── LICENSE                  GPL-3.0
└── README.md
```

## Limitações

- Anúncios que chegam pelo próprio stream de vídeo (`googlevideo.com/videoplayback`) não são tratados. Esse tipo de bloqueio precisa ser feito na rede, pelos escudos do navegador.
- O YouTube muda os nomes dos campos com frequência. Se os anúncios voltarem, as regras de `js/page/youtube-hooks.js` precisam ser atualizadas.

## Instalação

Na Jangada, a partir da pasta local:

```sh
jangada --install /caminho/para/uBlockTube
```

Para instalar direto do GitHub, o repositório precisa ser público:

```sh
jangada --install https://github.com/darkstarfire/uBlockTube
```

## Créditos

As regras de campos de anúncio se baseiam nas listas de filtros do [uBlock Origin](https://github.com/gorhill/uBlock) (GPL-3.0). Este projeto não é afiliado ao uBlock Origin nem à Jangada.

## Licença

GNU GPL versão 3 ou posterior (GPL-3.0-or-later), a mesma do uBlock Origin. Veja o arquivo [LICENSE](LICENSE).
