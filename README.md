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

- Streams de vídeo de anúncio (`googlevideo.com/videoplayback`) são cancelados só quando o parâmetro `expire` tem o formato dos anúncios (a regra do uBlock Origin). Um anúncio com outro formato ainda pode passar; nesse caso o bloqueio precisa ser feito na rede, pelos escudos do navegador.
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

## Versionamento

A versão segue `MAIOR.MEIO.PATCH`:

- **PATCH** (último número): melhorias pequenas, como ajustar uma regra ou corrigir um caso de anúncio. Ex.: `0.1.2` → `0.1.3`.
- **MEIO**: mudanças médias, como tratar um novo tipo de resposta ou reorganizar um arquivo. Ex.: `0.1.2` → `0.2.0`.
- **MAIOR**: `1.0.0` quando a extensão cobrir sites suficientes, além do YouTube.

Enquanto o projeto estiver em `0.x`, a versão indica que ele ainda está em fase inicial.

## Créditos

As regras de campos de anúncio se baseiam nas listas de filtros do [uBlock Origin](https://github.com/gorhill/uBlock) (GPL-3.0). Este projeto não é afiliado ao uBlock Origin nem à Jangada.

## Licença

GNU GPL versão 3 ou posterior (GPL-3.0-or-later), a mesma do uBlock Origin. Veja o arquivo [LICENSE](LICENSE).
