# Meridiana — site de estúdio de arquitetura (design)

Data: 2026-11-11
Status: aprovado em conversa, aguardando revisão do documento

## 1. Objetivo

Criar o site de um **estúdio de arquitetura fictício** chamado **Meridiana**, como peça de portfólio e vitrine de criatividade. Ele deve fugir do padrão "grid de fotos + sobre + contato" e usar como referência o repertório visual do Inspora (inspora.design): matriz de pontos e halftone, tipografia em movimento, narrativa imersiva, traço fino e pixel art com luz.

**O sucesso se mede por três coisas:**

- A página se lê como uma experiência única e memorável: rolar é ver um dia passar.
- O conteúdo (manifesto, projetos, estúdio, contato) continua claro, legível e navegável.
- O site roda liso em desktop e celular e tem alternativas para "reduzir movimento" e para navegadores sem WebGL.

**O que foi dito pelo usuário:** estúdio fictício, conceito "Um dia inteiro", parte técnica aprovada.

**O que é premissa minha:** conteúdo em português do Brasil e projetos fictícios em lugares brasileiros. O rodapé declara que é um estúdio fictício.

## 2. Conceito

Uma *meridiana* é uma linha no piso de igrejas antigas em que um feixe de sol, entrando por um furo no telhado, marca o meio-dia. Ali, o prédio é um relógio. O estúdio adota isso como manifesto: **"Arquitetura que mede o tempo com luz."**

**Ideia central:** a rolagem da página é a passagem de um dia, das 06:00 às 23:00. Um único valor, a **hora**, comanda o sol, o céu, a câmera, as janelas, o relógio e os efeitos.

## 3. Experiência

### 3.1 Roteiro (seções e horas-âncora)

Cada seção tem uma hora-âncora (`data-hour`). A hora exibida é interpolada linearmente entre as âncoras conforme a rolagem (ver 5.1).

| Âncora | Seção (id) | Conteúdo | Comportamento da cena |
|---|---|---|---|
| 06:00 | `#amanhecer` | Nome "Meridiana" enorme em serifada, tagline e indicação "role para o dia passar" | Névoa densa, céu rosado, câmera baixa e afastada, volumes surgindo da neblina |
| 08:00 | `#manifesto` | 3 a 4 frases curtas que acendem palavra por palavra | Câmera sobe devagar; a névoa dissipa |
| 10:00, 12:00, 14:00, 16:00 | `#projetos` (4 sub-seções `#p-varanda`, `#p-seco`, `#p-fresta`, `#p-brisa`) | Ficha de cada projeto em painel lateral | A câmera para em cada prédio. A cena é exibida em **halftone de pontos** e o cursor é uma **lente circular** que revela o render real |
| 17:30 | `#estudio` | Quem somos, processo em 3 passos e **relógio de sol tipográfico** | Hora dourada; o halftone some; sombras longas |
| 20:00 | `#contato` | "Vamos desenhar a luz do seu projeto." com e-mail e endereço | Noite: janelas acendem em pixels e estrelas aparecem |
| 23:00 | rodapé | Créditos e aviso de estúdio fictício | Céu estrelado; câmera se afasta para uma vista geral |

### 3.2 Elementos fixos

- **Navegação** (topo, à esquerda): logotipo "Meridiana" e links para Manifesto, Projetos, Estúdio e Contato, com rolagem suave por âncora.
- **Relógio HUD** (topo, à direita): hora em fonte de matriz de pontos (Doto), como `06:00`. Abaixo, uma linha de instrumento: `SOL 12° · AZ 84°`. Atualiza só quando muda o minuto exibido.
- **Cursor**: um anel pequeno que segue o mouse. Na seção de projetos ele cresce e vira a borda da lente. Não aparece em dispositivos de toque.
- **Mouse no sol**: a posição horizontal do mouse desloca o azimute do sol em até ±12°, e a vertical desloca a altura em até ±5°. As sombras acompanham o cursor.

### 3.3 Componentes de interface

- **Abertura (intro)**: overlay com o relógio em matriz de pontos contando de `00:00` a `06:00` em cerca de 1,2 s enquanto a cena carrega, e depois some com fade. É pulada com "reduzir movimento".
- **Manifesto que acende**: cada palavra é um `<span>`. A opacidade vai de 0,15 a 1 conforme o progresso da seção: a palavra *i* de *n* acende quando o progresso passa de *i/n*.
- **Fichas de projeto**: número (`01/04`), nome em serifada, local, ano, área em m², texto curto e uma linha "estudo de luz" (por exemplo, "melhor luz: 15h, fachada oeste").
- **Relógio de sol tipográfico** (SVG): um anel de texto em `textPath` ("ARQUITETURA · LUZ · TEMPO · MATÉRIA · SOMBRA · ") que gira com a rolagem, marcações de 6 a 18 horas e uma sombra em cunha (gnômon) que aponta a hora atual.
- **Contato**: título grande em serifada, `mailto:ola@meridiana.arq` (domínio inexistente de propósito) e endereço fictício.
- **Rodapé**: "© 2026 Meridiana — estúdio fictício, projeto de portfólio."

### 3.4 Identidade visual

- **Cor**: concreto claro e quente (#d9d4cb), papel (#f3efe7) e tinta (#1b1b1f). O céu é a única fonte de cor viva.
- **Tipografia** (Google Fonts): *Instrument Serif* para títulos, *Inter Tight* para texto e *Doto* para instrumentos (relógio, números e rótulos técnicos).
- **Assinatura**: uma linha de latão (a meridiana) atravessa o terreno no eixo norte-sul e aparece na cena e como detalhe gráfico no HTML.
- **Sem fotos**: todos os projetos são gerados em 3D.

### 3.5 Os quatro projetos (fictícios)

| id | Nome | Local | Ano | Área | Forma (gerada a partir de caixas) |
|---|---|---|---|---|---|
| `varanda` | Casa Varanda | Ubatuba, SP | 2024 | 320 m² | Laje longa sobre pilotis com balanço profundo e caixa de vidro embaixo |
| `seco` | Pavilhão Seco | Cabaceiras, PB | 2023 | 540 m² | Cobertura espessa de concreto apoiada em duas paredes cegas, com pátio central |
| `fresta` | Biblioteca Fresta | Belo Horizonte, MG | 2025 | 1.800 m² | Bloco alto e maciço cortado por frestas verticais de vidro |
| `brisa` | Mirante Brisa | Chapada dos Veadeiros, GO | 2026 | 90 m² | Torre de lajes empilhadas, cada uma girada alguns graus |

Os textos de cada projeto ficam no `index.html`, como texto real. `src/data/projects.js` guarda o id, a hora-âncora, a geometria e o enquadramento de câmera de cada projeto, sem repetir os textos.

## 4. Arquitetura técnica

### 4.1 Stack

- **JavaScript puro** (módulos ES nativos do navegador), sem framework e **sem bundler**.
- **Three.js 0.187.0** carregado por *import map* a partir do jsDelivr (`three` e `three/addons/`), incluindo o pós-processamento de `three/addons/postprocessing/`.
- **Testes** com o runner nativo do Node (`node --test`, Node ≥ 22). Nenhuma dependência npm.
- **Servidor local**: `scripts/serve.js` (Node, sem dependências), porta 5173.
- Saída: o próprio repositório já é o site estático, publicável como está (por exemplo no GitHub Pages). Nenhum deploy é configurado nesta etapa.

> Mudança em relação à versão aprovada (Vite + Vitest): nesta máquina, uma política de controle de aplicativos do Windows bloqueia os binários nativos do Vite 8 (Rolldown), e a versão WebAssembly não lê os caminhos do projeto. Sem bundler, o resultado para o visitante é o mesmo e o projeto fica sem dependências.

### 4.2 Estrutura de arquivos

```
architecture-web/
  index.html                 marcação de todas as seções (texto real, semântico)
  package.json               scripts: dev (scripts/serve.js) e test (node --test)
  scripts/serve.js           servidor estático local, sem dependências
  README.md
  public/favicon.svg
  src/
    main.js                  inicialização: lê âncoras, liga cena, UI e loop
    layout.js                condição única do layout empilhado (celular/tablet em pé), espelhada no CSS
    styles/main.css
    data/projects.js         id, hora, geometria e câmera dos 4 projetos
    time/interpolate.js      lerp, clamp, smoothstep, lerpColor, sampleKeyframes, damp
    time/clock.js            hourFromScroll(scrollY, anchors), formatHour(h)
    time/sun.js              sunPosition(hour, offset) -> { altitude, azimuth, aboveHorizon }
    time/sky.js              SKY_KEYFRAMES, skyAt(hour) -> paleta interpolada
    scene/world.js           renderer, cena, luzes, terreno, meridiana, loop de render
    scene/sky-dome.js        esfera com shader de degradê (zênite/horizonte) e brilho do sol
    scene/buildings.js       cria meshes a partir de projects.js
    scene/windows.js         janelas emissivas em pixel que acendem à noite
    scene/stars.js           pontos de estrelas com opacidade ligada à noite
    scene/camera-path.js     keyframes de câmera por seção e interpolação
    scene/halftone.js        ShaderPass de halftone com lente no cursor
    ui/hud.js                relógio em matriz de pontos e instrumento do sol
    ui/sundial.js            relógio de sol tipográfico em SVG
    ui/reveal.js             manifesto que acende palavra por palavra
    ui/cursor.js             anel do cursor e estado da lente
    ui/intro.js              contagem de 00:00 a 06:00
  tests/**/*.test.js         tempo, câmera, cursor, layout e contraste do CSS
```

Cada módulo de `time/` é puro (sem DOM e sem Three.js), o que permite testá-los isoladamente. Os módulos de `scene/` recebem um objeto de estado e não leem o DOM diretamente; quem lê o DOM é `main.js`.

### 4.3 Fluxo de dados

```
rolagem ──► hourFromScroll(anchors) ──► hora-alvo
mouse   ──► offset do sol, posição da lente
            hora suavizada (lerp a cada quadro, fator 0,08)
                 │
     ┌───────────┼──────────────┬───────────────┬──────────────┐
  sunPosition   skyAt        camera-path      HUD/sundial     halftone mix
     │           │               │               │              │
  luz/sombra  dome, névoa,    câmera          DOM            ShaderPass
              fundo CSS
```

O **estado** é um objeto simples, atualizado a cada quadro: `{ targetHour, hour, progress, mouse: {x, y}, lens: {x, y, radius}, halftoneMix, isTouch, reducedMotion }`.

## 5. Regras de comportamento

### 5.1 Hora a partir da rolagem

- As âncoras vêm de todos os elementos com `data-hour`. Cada uma é `{ y, hour }`, com `y = clamp(offsetTop − alturaDaViewport / 2, 0, rolagemMáxima)`. Ou seja, é o `scrollY` em que o topo do elemento cruza o centro da tela, travado no intervalo rolável. Assim a página começa exatamente às 06:00 e termina exatamente às 23:00.
- `hourFromScroll` faz interpolação linear por trechos entre âncoras ordenadas e trava nos extremos (antes da primeira, a hora da primeira; depois da última, a hora da última).
- As âncoras são recalculadas no `resize`.

### 5.2 Sol (modelo estilizado, não astronômico)

- O nascer é às 06:00 e o pôr às 18:30.
- `altitude = 70° · sin(π · t)`, com `t = (h − 6) / 12,5`. Fora de [06:00, 18:30] a altitude é negativa e `aboveHorizon = false`.
- O azimute vai de 90° (leste) a −90° (oeste) passando por 0° (norte), como no hemisfério sul: `azimuth = 90° − 180° · t`.
- O offset do mouse soma até ±12° ao azimute e até ±5° à altitude.
- Para a luz da cena, a direção usa `max(altitude, 4°)` durante o dia, para evitar sombras infinitas com o sol rente ao horizonte. O HUD mostra a altitude real.
- Convenção na cena: norte = −Z, leste = +X, para cima = +Y.
- À noite, uma luz de lua azulada e fraca, vinda do lado oposto, assume a sombra.

### 5.3 Paleta do céu (keyframes)

| Hora | Zênite | Horizonte | Cor da luz | Intensidade |
|---|---|---|---|---|
| 06:00 | #3b3a6b | #f2a7a0 | #ffb08a | 0,6 |
| 08:00 | #6f9fd8 | #f6dcc4 | #ffe2c4 | 1,6 |
| 12:00 | #4f8fd6 | #dfeaf3 | #ffffff | 2,4 |
| 16:00 | #5a8fcf | #f0e2c8 | #fff0d8 | 2,0 |
| 17:30 | #6b7fb8 | #f7b267 | #ffb35c | 1,4 |
| 18:30 | #3a3f78 | #e07a6a | #ff7a50 | 0,4 |
| 20:00 | #0f1430 | #2b2d5a | #8fa6ff | 0,25 |
| 23:00 | #05070f | #11152b | #8fa6ff | 0,15 |

`skyAt(hour)` interpola linearmente em RGB entre os keyframes vizinhos e trava nos extremos. A cor da névoa é a cor do horizonte. A densidade da névoa (FogExp2) é 0,007 às 06:00 e cai até 0,0022 às 09:00, valores calibrados para a escala da cena em metros. O fundo CSS do `body` usa as mesmas cores (via variáveis CSS), então o site continua coerente sem WebGL.

### 5.4 Janelas e estrelas

- Cada janela é um plano com textura de grade de pixels (CanvasTexture) e um atraso aleatório próprio. Ela acende entre 18:30 e 20:00, com `emissiveIntensity` de 0 até 1,2.
- As estrelas ficam em uma esfera grande de pontos, com opacidade 0 até 18:30 e 1 a partir de 20:30.

### 5.5 Halftone com lente

- Um ShaderPass faz a amostragem da cena em células de 7 px (multiplicadas pelo pixel ratio). O raio do ponto é proporcional à escuridão da célula, o ponto tem a cor da célula e o fundo é a cor papel.
- **Lente**: círculo de 140 px de raio com borda suave de 24 px, centrado no cursor, onde aparece a imagem original.
- O alvo de `halftoneMix` é 1 quando a hora suavizada está em [09:30, 16:30] e 0 fora disso. O valor real persegue o alvo com suavização exponencial por tempo (`damp`), equivalente a um lerp de 0,06 por quadro a 60 fps e igual em qualquer taxa de quadros, o que dá uma transição de cerca de 0,6 s. A lente fica no centro do anel do cursor (a mesma posição suavizada), para a borda casar com o anel em movimento. Como a hora comanda tudo, isso coincide com a entrada e a saída de `#projetos`.
- Em toque, sem hover, a lente fica fixa em (50%, 42%) da tela.

### 5.6 Câmera

- Um keyframe por seção ou subseção: `{ hour, position, target }`. A câmera interpola entre os keyframes vizinhos pela hora suavizada, com easing smoothstep.
- O mouse adiciona uma paralaxe de até 0,6 unidade.
- Com "reduzir movimento", a câmera fica fixa no keyframe de vista geral; só a luz, o céu e o conteúdo mudam.

## 6. Desempenho

- `setPixelRatio(min(devicePixelRatio, 2))`, ou 1,5 em dispositivos de toque.
- Mapa de sombra de 2048 px no desktop e 1024 px no toque, com PCFShadowMap (o PCFSoftShadowMap está obsoleto desde a r182) e só a luz do sol ou da lua projetando sombra.
- Sem halftone, a cena é desenhada direto na tela, com antialias nativo e sem passes extras. Com halftone, o composer usa um alvo com MSAA de 4 amostras.
- Tamanhos vêm da área útil da janela (`clientWidth`/`clientHeight`), sem a barra de rolagem.
- O loop pausa em `visibilitychange` quando a aba fica oculta.
- O HUD só toca no DOM quando o minuto exibido muda.

## 7. Acessibilidade e alternativas

- HTML semântico (`header`, `nav`, `main`, `section`, `footer`) com hierarquia de títulos correta. O canvas é decorativo (`aria-hidden="true"`).
- `prefers-reduced-motion`: sem intro, câmera fixa e rolagem suave desligada. O sol e o céu continuam mudando.
- **Sem WebGL**: o `<html>` recebe a classe `no-webgl`, o canvas é escondido e o fundo CSS (com as cores de `skyAt`) mantém a passagem do dia.
- Contraste: o texto sobre a cena fica em painéis com fundo semitransparente e desfoque, com contraste mínimo AA.

## 8. Testes e verificação

- **`node --test`** em `tests/` (além do tempo: câmera, cursor, layout empilhado e contraste AA dos tokens do CSS):
  - `interpolate`: clamp, lerp, lerpColor e `sampleKeyframes` nos extremos e no meio.
  - `clock`: `hourFromScroll` antes, entre e depois das âncoras; `formatHour` (6 → "06:00", 17,5 → "17:30", 23 → "23:00").
  - `sun`: nascer (altitude 0, azimute 90), meio-dia solar (altitude perto de 70°, azimute perto de 0°), pôr (altitude 0, azimute −90°), noite (`aboveHorizon = false`) e offset do mouse.
  - `sky`: valores exatos nos keyframes, interpolação no meio do trecho e trava nos extremos.
- Todos os recursos carregam com status 200 pelo servidor local (não há etapa de build).
- Verificação visual no navegador do app, em desktop (1440×900) e celular (375×812): cada seção mostra a hora certa no HUD, o halftone e a lente funcionam nos projetos, as janelas acendem à noite e não há erros no console.

## 9. Fora do escopo

- CMS, páginas individuais de projeto, formulário de contato com envio, idiomas extras, deploy e analytics.
