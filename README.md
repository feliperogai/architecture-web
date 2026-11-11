# Meridiana

**Arquitetura que mede o tempo com luz.** Site de um estúdio de arquitetura fictício em que rolar a página é ver um dia inteiro passar, das 06:00 às 23:00.

> Meridiana é um estúdio **fictício**, criado como projeto de portfólio. Nomes, projetos, endereço e e-mail são inventados.

## O conceito

Uma *meridiana* é uma linha no chão de igrejas antigas onde um raio de sol, entrando por um furo no telhado, marca o meio-dia. Ali, o prédio funciona como um relógio. O site leva essa ideia para a página:

- **A rolagem é a hora do dia.** Sol, céu, névoa, câmera, janelas e relógio respondem a um único valor.
- **O mouse empurra o sol** alguns graus, e as sombras dos prédios acompanham.
- **Projetos em halftone:** entre 10h e 16h a cena vira pontos sobre papel, e o cursor é uma lente que revela o render.
- **À noite as janelas acendem em pixels** e aparecem as estrelas.
- **Relógio de sol tipográfico,** relógio em matriz de pontos e a linha de latão (a meridiana) como régua do dia.

## Como rodar

O projeto não tem dependências nem etapa de build: são módulos ES nativos, e o Three.js 0.187.0 vem de um *import map* via jsDelivr. Só é preciso ter o Node 22 ou mais recente.

```bash
npm run dev    # servidor local em http://127.0.0.1:5173
npm test       # testes da matemática do tempo, do sol, do céu e da câmera
```

Como o repositório já é o site, ele pode ser publicado como está (por exemplo no GitHub Pages).

### Parâmetros de URL

| Parâmetro | Efeito |
|---|---|
| `?nowebgl` | Força o modo sem 3D: o fundo em degradê CSS continua contando o dia |
| `?debug` | Expõe `window.__meridiana` (`state` e `tick()`) para inspeção |

## Estrutura

```
index.html              conteúdo (texto real, semântico) e import map
src/main.js             liga rolagem, hora, interface e cena
src/time/               funções puras: interpolação, relógio, sol, céu (testadas)
src/scene/              Three.js: mundo, céu, prédios, janelas, estrelas, câmera, halftone
src/ui/                 HUD, manifesto, relógio de sol, intro, cursor
src/data/projects.js    geometria e enquadramento dos 4 projetos
tests/                  node --test
docs/superpowers/       spec e plano de implementação
```

## Acessibilidade

- Todo o conteúdo é HTML de verdade. O canvas é decorativo.
- Com `prefers-reduced-motion`, a câmera fica parada, não há intro e a rolagem suave é desligada. O céu e o sol continuam mudando.
- Sem WebGL, ou se o contexto 3D cair, o site continua navegável com o fundo em CSS.
