# Depetris Construções

Site do escritório **Depetris Construções**, do arquiteto **Gabriel Depetris** (São Paulo, +55 11 95311-0104). Nele, rolar a página é ver um dia inteiro passar sobre uma cidade-maquete, das 06:00 às 23:00.

> As quatro obras apresentadas (Casa Varanda, Pavilhão Seco, Biblioteca Fresta e Mirante Brisa) são **projetos conceituais**, sinalizados assim no site.

## O conceito

Uma *meridiana* é uma linha no chão de igrejas antigas onde um raio de sol, entrando por um furo no telhado, marca o meio-dia. Ali, o prédio funciona como um relógio. O site leva essa ideia para a página:

- **A rolagem é a hora do dia.** Sol, céu, névoa, câmera, janelas e relógio respondem a um único valor. O mouse empurra o sol alguns graus, e as sombras acompanham.
- **Uma cidade-maquete inteira:** centenas de prédios em tom de areia com caixas d'água, ruas com faixas de pedestre, árvores, postes, pessoas e carros andando. À noite, a cidade acende janela por janela.
- **Quatro obras detalhadas,** as únicas com materiais reais.
  - A câmera para e orbita cada obra enquanto a sombra anda pelo prédio.
  - **Anotações técnicas** presas ao 3D, em letra de arquiteto.
  - **Botão "Explodir camadas":** separa a obra em fundação, estrutura, lajes, vedações, cobertura, interiores e paisagismo.
- **Halftone nos voos:** entre uma obra e outra, a cidade vira pontos sobre papel e o cursor é uma lente que revela o render.
- **Instrumentos:** relógio em matriz de pontos, relógio de sol tipográfico, a régua do dia e a planta de situação com câmera e sol.
- **Tipografia viva em ocres:**
  - a marca em **Nabla**, com blocos isométricos recoloridos em ocre e terracota, que caem um a um na abertura e balançam ao passar o mouse; a altura dos blocos cresce com o sol;
  - os títulos em **Bricolage Grotesque** ficam finos à noite e pesados ao meio-dia, com uma sombra longa ocre oposta ao sol.

## Como rodar

O projeto não tem dependências nem etapa de build: são módulos ES nativos, e o Three.js 0.187.0 vem de um *import map* via jsDelivr. Só é preciso ter o Node 22 ou mais recente.

```bash
npm run dev    # servidor local em http://127.0.0.1:5173
npm test       # testes: tempo, sol, céu, cidade, câmera, enquadramento, anotações, tipografia
```

Como o repositório já é o site, ele pode ser publicado como está (por exemplo no GitHub Pages).

### Parâmetros de URL

| Parâmetro | Efeito |
|---|---|
| `?nowebgl` | Força o modo sem 3D: o fundo em degradê CSS continua contando o dia |
| `?debug` | Expõe `window.__meridiana` (`state`, `world` e `tick()`) para inspeção |

## Estrutura

```
index.html              conteúdo (texto real, semântico) e import map
src/main.js             liga rolagem, hora, interface e cena
src/time/               funções puras: interpolação, relógio, sol, céu, halftone (testadas)
src/city/               cidade gerada como dados puros a partir de uma semente (testada)
src/scene/              Three.js: mundo, céu, cidade, obras por camada, estrelas, câmera, halftone
src/ui/                 HUD, manifesto, relógio de sol, intro, cursor, anotações, tipografia, planta
src/data/projects.js    peças, camadas, notas e câmera das 4 obras
tests/                  node --test
docs/superpowers/       specs e planos de implementação
```

## Acessibilidade

- Todo o conteúdo é HTML de verdade. O canvas e as sobreposições são decorativos.
- Com `prefers-reduced-motion`, a câmera fica parada, não há intro, os blocos da marca não caem e a rolagem suave é desligada. O céu e o sol continuam mudando.
- Sem WebGL, ou se o contexto 3D cair, o site continua navegável com o fundo em CSS.
