# uBlockTube

Extensão para a [Jangada](https://github.com/fabioaacarneiro/jangada), o navegador do Glove OS, que remove os anúncios do player do YouTube.

## Como funciona

A extensão roda no começo de cada página do YouTube e troca as respostas que o player recebe, tirando os campos de anúncio (`adPlacements`, `adSlots`, `playerAds`, `no_ads`) antes de o player usá-los. Isso vale para:

- os dados iniciais do primeiro vídeo, embutidos no HTML;
- as respostas do player, `next`, `browse` e `get_watch` por `fetch` e `XMLHttpRequest`;
- a navegação pela playlist e pelo autoplay.

## Limitações

- Anúncios que chegam pelo próprio stream de vídeo (`googlevideo.com/videoplayback`) não são tratados. Esse tipo de bloqueio precisa ser feito na rede, pelos escudos do navegador.
- O YouTube muda os nomes dos campos com frequência. Se os anúncios voltarem, as regras de `ola.js` precisam ser atualizadas.

## Instalação

Na Jangada:

```sh
jangada --install /caminho/para/uBlockTube
```

## Créditos

As regras de campos de anúncio se baseiam nas listas de filtros do [uBlock Origin](https://github.com/gorhill/uBlock) (GPL-3.0). Este projeto não é afiliado ao uBlock Origin nem à Jangada.

## Licença

GNU GPL versão 3 ou posterior (GPL-3.0-or-later), a mesma do uBlock Origin. Veja o arquivo [LICENSE](LICENSE).
