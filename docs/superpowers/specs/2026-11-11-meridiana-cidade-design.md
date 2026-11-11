# Meridiana, fase 2: cidade-maquete, obras detalhadas e tipografia viva (design)

Data: 2026-11-11
Status: aprovado em conversa, aguardando revisão do documento
Base: `2026-11-11-meridiana-design.md` (fase 1). Tudo o que esta spec não muda continua valendo.

## 1. Objetivo

O usuário pediu:

- mais detalhes no site;
- obras com muito mais detalhe, mostrando "todos os detalhes que foram feitos";
- que o conjunto pareça uma cidade cheia de detalhes, com foco nas obras;
- fontes mais criativas.

**Escolhas feitas pelo usuário:**

- **Detalhes:** anotações técnicas presas ao 3D, mais uma vista explodida por camadas.
- **Cidade:** *cidade-maquete*. O entorno é maquete branca e só as 4 obras têm materiais reais.

**Sucesso significa:**

- à primeira vista, parece uma cidade viva em maquete;
- em cada obra dá para ler de 5 a 6 detalhes construtivos e ver como ela foi montada (vista explodida);
- os títulos têm personalidade e reagem à luz;
- o desempenho continua fluido no desktop e no celular.

## 2. Cidade-maquete

### 2.1 Traçado (dados puros, determinísticos)

- **Área:** x de −300 a 344 e z de −300 a 300, em metros. Norte = −Z.
- **Ruas:** eixos em x = 86·k e z = 86·k, para k inteiro dentro da área.
  - Ruas comuns têm 14 m de largura.
  - A rua em x = 0 é a **Avenida Meridiana**, com 24 m e a linha de latão no canteiro central.
- **Calçadas:** 3 m, elevadas 0,15 m, ao longo de cada lado das ruas.
- **Quadras:** o retângulo entre as bordas das calçadas de ruas vizinhas.
- **Quadras reservadas:** uma por obra (ver 2.3). Elas não recebem prédios da cidade, apenas a obra e o seu paisagismo.

### 2.2 Conteúdo gerado (semente fixa)

| Elemento | Regra |
|---|---|
| **Lotes** | Cada quadra comum é dividida em grade de lotes com lado entre 12 e 20 m, o que dá de 3 a 5 lotes por lado |
| **Prédios** | 85% dos lotes recebem um prédio. Projeção = lote − recuo de 1,5 m. Altura entre 6 e 48 m, em múltiplos de 3 m (pavimentos), com viés: prédios mais altos perto da avenida |
| **Topo dos prédios** | Acima de 12 m, metade recebe uma caixa d'água (3 × 2,5 × 3) e um quarto recebe uma casa de máquinas (4 × 3 × 4) |
| **Árvores** | Nas calçadas, a cada 12 m, com probabilidade de 0,7, nunca a menos de 10 m de um cruzamento. Copa esférica de raio entre 1,8 e 2,6 m sobre tronco de 3 m |
| **Postes** | Nas calçadas, a cada 24 m, alternando os lados |
| **Pessoas** | 260 nas calçadas, mais 8 em cada praça de obra. Figuras de 1,7 m |
| **Faixas de pedestre** | Zebra nos 4 lados de cada cruzamento |
| **Faixas de rolamento** | Tracejado no eixo das ruas comuns |
| **Carros** | 70, cada um numa faixa (a ±2,5 m do eixo, sentidos opostos), com fase e velocidade entre 6 e 11 m/s. Andam em loop pela rua. Posição(t) = início + direção · ((fase + velocidade·t) mod comprimento) |

### 2.3 Obras realocadas nas quadras

As obras passam para o centro de quadras inteiras, viradas praças:

| Obra | Quadra (x, z) | Nova origem |
|---|---|---|
| Casa Varanda | x de −76 a −15, z de 10 a 76 | (−45,5, 43) |
| Pavilhão Seco | x de 15 a 76, z de 10 a 76 | (45,5, 43) |
| Biblioteca Fresta | x de 15 a 76, z de −76 a −10 | (45,5, −43) |
| Mirante Brisa | x de 96 a 162, z de −76 a −10 | (129, −43) |

### 2.4 Visual de maquete

- **Cores:**
  - prédios #efebe4;
  - ruas #a9a59e;
  - calçadas #d6d1c8;
  - árvores #dfe2d4 (copa) e #cfc8bc (tronco);
  - postes #8d8a84;
  - pessoas #f4f1ea;
  - carros #e9e6df;
  - faixas #f7f5f0.
- **À noite:**
  - as janelas da cidade acendem em pixels: textura de grade em que cada texel é uma janela de 3 × 3 m, com 55% acesas e atrasos aleatórios por prédio;
  - os postes ficam emissivos em #ffcf7a;
  - os carros acendem os faróis (dois pontos #fff3c4 na frente).
  - Tudo isso segue `sky.windowGlow`.
- **Desenho:** todos os prédios da cidade são fundidos numa única malha, com UVs proporcionais às dimensões para a janela ter sempre 3 × 3 m. Topo e base apontam para um texel sempre apagado. Árvores, postes, pessoas, carros e faixas são instâncias.

## 3. Obras detalhadas

### 3.1 Modelo de dados

Cada obra passa a ter:

- `parts`: lista de `{ shape: 'box'|'cylinder', size, pos, rotY?, material, layer }`. Para cilindro, `size = [raio, altura]`.
- `notes`: lista de `{ id, anchor: [x,y,z] }`, com posições relativas à origem. O texto das notas fica no HTML.
- `camera`: `{ position, target, center, orbit }`, em que `orbit` é o giro total da órbita, em graus, durante a parada.
- `explodeGap`: distância, em metros, entre camadas na vista explodida.

**Camadas** (ordem de baixo para cima na vista explodida):

| Índice | Camada | Rótulo |
|---|---|---|
| 0 | `fundacao` | Fundação |
| 1 | `estrutura` | Estrutura |
| 2 | `lajes` | Lajes |
| 3 | `vedacao` | Vedações |
| 4 | `cobertura` | Cobertura |
| 5 | `interiores` | Interiores |
| 6 | `paisagismo` | Paisagismo |

**Materiais reais:**

- concreto #cfc8bc;
- concreto de fôrma #bdb6aa;
- vidro #2c3440;
- madeira #8a5a3b;
- aço #3c3f44;
- corten #8a4b2a;
- água #6f9fb3;
- vegetação #7d8f5a;
- terra #b9946a;
- pedra #9a948a;
- mobiliário #e9e6df;
- estante #6b4a33.

### 3.2 Detalhes por obra

| Obra | Peças novas (além do volume da fase 1) | Notas (id: texto) | explodeGap |
|---|---|---|---|
| **Casa Varanda** | 6 pilotis cilíndricos Ø 50 cm; caixilhos a cada 1,2 m; deque em réguas; piscina 12 × 3 m; escada; teto-jardim; sofá, mesa e estante atrás do vidro | `laje`: Laje nervurada de 60 cm, balanço de 8 m sobre o deque · `pilotis`: 6 pilotis Ø 50 cm em concreto aparente · `caixilhos`: Caixilhos de alumínio a cada 1,20 m, vidro laminado 8+8 · `deque`: Deque em réguas de cumaru 10 × 2 cm · `piscina`: Piscina de borda infinita, 12 × 3 m · `jardim`: Teto-jardim sobre a laje, isolamento e chuva lenta | 3,5 |
| **Pavilhão Seco** | Frisos horizontais de fôrma de tábua nas paredes cegas; umbuzeiro no pátio (tronco e copa larga); cisterna cilíndrica; bancos; piso de terra batida | `cobertura`: Cobertura de 1,40 m, massa térmica contra o calor do sertão · `patio`: Pátio de 8 × 8 m, um único quadrado de sol · `paredes`: Paredes cegas com marca de fôrma de tábua · `umbuzeiro`: Umbuzeiro preservado no centro do pátio · `cisterna`: Cisterna de 16 mil litros para a chuva do ano · `piso`: Piso de terra batida estabilizada | 3,5 |
| **Biblioteca Fresta** | Estantes atrás das frestas; marquise de 6 m na entrada; rampa; terraço com pérgola de aço; letreiro "BIBLIOTECA" em relevo; praça com paginação | `frestas`: 5 frestas de 80 cm, luz rasante e nunca direta nas estantes · `laminas`: Lâminas de concreto de 2,33 m · `estantes`: Estantes de 6 níveis ao longo das frestas · `marquise`: Marquise em balanço de 6 m na entrada · `terraco`: Terraço de leitura com pérgola de aço · `rampa`: Rampa acessível de 8% até a praça | 5 |
| **Mirante Brisa** | Guarda-corpos de vidro em cada laje; escada helicoidal de corten ao redor do núcleo (degraus girando); cobertura do mirante; biruta no topo; base de pedra; arbustos de cerrado | `lajes`: 7 lajes de 7 × 7 m, cada uma girada 9° · `nucleo`: Núcleo de 2,40 m, estrutura e escada · `escada`: Escada helicoidal em aço corten · `guarda`: Guarda-corpos de vidro de 1,10 m · `biruta`: Biruta no topo, o mirante mostra de onde vem a brisa · `cerrado`: Base de pedra e arbustos do cerrado | 4 |

### 3.3 Parada e órbita da câmera

- **Dois keyframes por obra:** em `hora − 0,5` e `hora + 0,5`, com a vista girada em torno de `center` por −orbit/2 e +orbit/2. O valor padrão de `orbit` é 16°.
- Entre esses dois keyframes a câmera praticamente para e gira devagar, enquanto o sol continua andando.
- **Altura dos artigos de projeto:** `min-height` passa de 160vh para 200vh.
- **Câmeras fixas** (amanhecer, manifesto, estúdio, contato, rodapé) são reapontadas para a nova cidade. No amanhecer, a câmera fica rente ao chão, olhando a Avenida Meridiana para o norte, de dentro da névoa.

### 3.4 Halftone (substitui a regra da fase 1, §5.5)

- **Alvo 1** quando `8,75 ≤ hora ≤ 16,75` e a hora **não** está a 0,5 ou menos de nenhuma hora de obra.
- Na prática, o halftone aparece só nos voos sobre a cidade, e cada obra fica nítida na parada.
- A lente e o anel continuam como na fase 1.

## 4. Mostrando os detalhes

### 4.1 Anotações

- **Texto das notas:** fica no HTML de cada ficha, numa `<ol class="project__notes">` com `<li data-note="id"><strong>título curto</strong> texto</li>`.
  - No desktop a lista é visualmente oculta, mas continua acessível a leitores de tela.
  - No layout empilhado ela aparece na ficha.
- **Sobreposição** (`aria-hidden`) para a obra da vez:
  - cada nota é um ponto no `anchor` projetado na tela, com uma linha de chamada em SVG e uma etiqueta deslocada de 70 a 120 px, alternando direita e esquerda;
  - fonte Architects Daughter, numeração em Doto;
  - no layout empilhado só aparecem pinos numerados.
- **Opacidade:** `noteOpacity(hora, horaDaObra) = 1 − smoothstep((|Δ| − 0,35) / 0,25)`. Fica 1 até ±0,35 h e 0 a partir de ±0,6 h.
- **Âncora atrás da câmera:** a nota não aparece.

### 4.2 Vista explodida

- **Botão na ficha:** `<button class="explode" aria-pressed="false">Explodir camadas</button>`.
- **Estado-alvo da obra:** `explodeTarget(hora, horaDaObra, pressionado) = pressionado && |Δ| ≤ 1 ? 1 : 0`. Ao sair da obra, ela fecha sozinha e o botão volta a `aria-pressed="false"`.
- **Movimento:** o valor real persegue o alvo com `damp` (equivalente a 0,08 por quadro). Cada camada sobe `layerOffset(i, valor, gap) = i · gap · valor`.
- **Rótulos:** com a obra explodida (valor > 0,3), cada camada não vazia ganha um rótulo à esquerda da obra, com o nome, na mesma sobreposição das anotações.

### 4.3 Planta de situação

- **Posição:** SVG de 180 × 180 px no canto inferior direito, só no desktop (fora do layout empilhado). Escala de 1 px = 4 m, centrada na área da cidade.
- **Conteúdo:**
  - quadras como retângulos claros;
  - a avenida em latão;
  - as 4 obras como quadrados escuros numerados;
  - seta do norte;
  - barra de escala de 100 m;
  - posição da câmera com um cone de visão;
  - seta do sol na borda, conforme o azimute.
- É decorativa (`aria-hidden`).

## 5. Tipografia viva

- **Famílias** (Google Fonts):
  - **Bricolage Grotesque**, variável (opsz 12–96, wdth 75–100, wght 200–800): título da abertura, títulos das obras, "Quatro estudos de luz", título do contato;
  - **Architects Daughter**: anotações;
  - **Instrument Serif**: manifesto, tagline, frase do estúdio, "Boa noite.";
  - **Doto**: relógio e números;
  - **Inter Tight**: texto corrido.
- **Eixos ligados ao sol:** `titleAxes(altitude) = { wght: 250 + 550·clamp(alt/70, 0, 1), wdth: 75 + 25·smoothstep((alt + 6)/12) }`, ou seja, fino e condensado à noite, pesado ao meio-dia. Aplicados por variáveis CSS só quando o peso muda 10 unidades ou mais.
- **Sombra longa dos títulos:** `longShadow(sol, camadas = 14)` gera um `text-shadow` em camadas na direção oposta ao sol.
  - Direção na tela: dx = −sin(az), dy = 0,4 + 0,6·cos(az).
  - Passo: `clamp(1/tan(alt), 0,5, 4)` px.
  - Cor da tinta com opacidade decrescente.
  - À noite (alt ≤ 0) retorna `none`.
- **"Meridiana" letra a letra:** `letterWeight(i, n, sol) = clamp(wght + 220·s·sin(az), 200, 800)`, com `s = 2·i/(n−1) − 1`. As letras do lado do sol ficam mais pesadas.

## 6. Arquitetura técnica

| Arquivo | Responsabilidade | Teste |
|---|---|---|
| `src/city/random.js` | PRNG `mulberry32(seed)`, `range`, `pick` (sai de `windows.js`) | ✔ |
| `src/city/generate.js` | `generateCity(options)` → `{ streets, blocks, buildings, rooftops, trees, lamps, people, crosswalks, dashes, lanes, cars }`; `carPosition(car, lane, t)` | ✔ |
| `src/scene/city.js` | Malha fundida, instâncias, janelas e faróis noturnos, carros andando | visual |
| `src/data/projects.js` | Peças, camadas, notas, câmera, explodeGap e origens novas | — |
| `src/scene/buildings.js` | Obras por camada, cilindros, `setExplode(id, valor)` | ✔ (`layerOffset`, `explodeTarget` em `src/scene/explode.js`) |
| `src/scene/camera-path.js` | Keyframes de parada e órbita | ✔ |
| `src/time/halftone.js` | `halftoneTarget(hora, horasDasObras)` | ✔ |
| `src/ui/annotations.js` | Sobreposição de notas e rótulos de camada; `noteOpacity` | ✔ (`noteOpacity`) |
| `src/ui/typography.js` | `titleAxes`, `longShadow`, `letterWeight` (puros) e aplicação com cache | ✔ (puros) |
| `src/ui/siteplan.js` | Planta de situação | visual |

**Desempenho:**

- Uma malha para cerca de 500 prédios.
- Instâncias para o resto.
- Os carros só atualizam matrizes.
- Fontes variáveis só são reescritas quando mudam o bastante.

## 7. Verificação

- `npm test`: geração da cidade (determinismo; nada sobre ruas, calçadas ou quadras reservadas; tudo dentro da área; alturas em [6, 48]; quantidades), `carPosition`, `layerOffset`/`explodeTarget`, keyframes de parada, `halftoneTarget`, `noteOpacity`, `titleAxes`/`longShadow`/`letterWeight`, além dos 49 testes atuais.
- **Navegador:**
  - desktop, tablet e celular;
  - de dia e de noite (cidade acesa);
  - anotações seguindo a obra durante a órbita;
  - vista explodida abrindo e fechando sozinha;
  - planta de situação;
  - fontes carregadas;
  - console sem erros.

## 8. Fora do escopo

- Páginas individuais por obra.
- Interiores navegáveis.
- Carros que obedecem a semáforos.
- Sombras de todos os prédios da cidade fora do alcance da câmera de sombra (±160 m em torno do foco).
