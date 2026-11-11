# Meridiana

**Arquitetura que mede o tempo com luz.** Site de um estúdio de arquitetura fictício em que rolar a página é ver um dia inteiro passar, das 06:00 às 23:00.

> Meridiana é um estúdio **fictício**, criado como projeto de portfólio. Nomes, projetos, endereço e e-mail são inventados.

## O conceito

Uma *meridiana* é uma linha no chão de igrejas antigas onde um raio de sol, entrando por um furo no telhado, marca o meio-dia. Ali, o prédio funciona como um relógio. O site leva essa ideia para a página:

- **A rolagem é a hora do dia.** Sol, céu, névoa, câmera, janelas e relógio respondem a um único valor.
- **Uma cidade-maquete inteira:** 523 prédios brancos com caixas d'água, ruas com faixas de pedestre, árvores, postes, pessoas e 70 carros andando. A Avenida Meridiana tem a linha de latão no canteiro central. À noite, a cidade acende janela por janela.
- **Quatro obras detalhadas,** as únicas com materiais reais: Casa Varanda, Pavilhão Seco, Biblioteca Fresta e Mirante Brisa.
  - A câmera para e orbita cada obra enquanto a sombra anda pelo prédio.
  - **Anotações técnicas** presas ao 3D, em letra de arquiteto: seis por obra.
  - **Botão "Explodir camadas":** separa a obra em fundação, estrutura, lajes, vedações, cobertura, interiores e paisagismo.
- **Halftone nos voos:** entre uma obra e outra, a cidade vira pontos sobre papel e o cursor é uma lente que revela o render.
- **Planta de situação** no canto: quadras, avenida, obras numeradas, norte, escala, câmera e sol.
- **Tipografia viva:**
  - os títulos em Bricolage Grotesque ficam finos e condensados à noite e pesados ao meio-dia;
  - eles projetam uma sombra longa oposta ao sol;
  - em "Meridiana", as letras do lado do sol ficam mais grossas.

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
src/time/               funções puras: interpolação, relógio, sol, céu, halftone (testadas)
src/city/               cidade gerada como dados puros a partir de uma semente (testada)
src/scene/              Three.js: mundo, céu, cidade, obras por camada, estrelas, câmera, halftone
src/ui/                 HUD, manifesto, relógio de sol, intro, cursor, anotações, tipografia, planta
src/data/projects.js    peças, camadas, notas e câmera das 4 obras
tests/                  node --test
docs/superpowers/       spec e plano de implementação
```

## Acessibilidade

- Todo o conteúdo é HTML de verdade. O canvas é decorativo.
- Com `prefers-reduced-motion`, a câmera fica parada, não há intro e a rolagem suave é desligada. O céu e o sol continuam mudando.
- Sem WebGL, ou se o contexto 3D cair, o site continua navegável com o fundo em CSS.
