# Meridiana — plano de implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Objetivo:** construir o site de página única do estúdio fictício Meridiana, em que a rolagem é a passagem de um dia (06:00 a 23:00) e uma cena 3D reage à hora.

**Arquitetura:** um canvas Three.js fixo no fundo e seções HTML semânticas por cima. Um único valor, a hora (derivada da rolagem por âncoras `data-hour`), alimenta funções puras (`time/`) que calculam o sol, o céu e a câmera. A cena (`scene/`) e a interface (`ui/`) apenas consomem esses valores.

**Stack:** Node 24, Vite 8, Three.js 0.187 (pós-processamento via `three/addons/postprocessing/`), Vitest 5, JavaScript puro (ESM).

**Spec:** `docs/superpowers/specs/2026-11-11-meridiana-design.md`

## Restrições globais

- Idioma do conteúdo: português do Brasil.
- Sem fotos: toda imagem de projeto é gerada na cena 3D.
- Hora: 06:00 no topo da página e 23:00 no fim, com interpolação linear por trechos entre âncoras.
- Sol: nascer 06:00, pôr 18:30, altitude máxima 70°, azimute de 90° (leste) passando por 0° (norte) até −90° (oeste).
- Convenção da cena: norte = −Z, leste = +X, para cima = +Y, unidade = 1 metro.
- Luz da cena: altitude mínima de 4° durante o dia.
- Suavização da hora: lerp por quadro com fator 0,08. Halftone: lerp por quadro com fator 0,06, alvo 1 em [9,5; 16,5].
- Fontes (Google Fonts): Instrument Serif, Inter Tight, Doto.
- Cores-base: concreto #d9d4cb, papel #f3efe7, tinta #1b1b1f.
- E-mail de contato: `ola@meridiana.arq`. O rodapé declara "estúdio fictício, projeto de portfólio".
- Pixel ratio: no máximo 2 (1,5 em toque). Mapa de sombra: 2048 (1024 em toque).
- Parâmetro de depuração `?nowebgl` força o modo sem WebGL.
- Commits: só com autorização do usuário.

## Foco da revisão

1. **Página mais curta que a tela, ou âncoras empatadas** (zoom alto, tela muito alta): várias âncoras no mesmo `y`. Esperado: hora finita, sem `NaN` e sem divisão por zero. Teste em `clock.test.js`.
2. **Rolagem negativa ou além do fim** (efeito elástico do iOS ou `scrollY` maior que o máximo): a hora trava em 06:00 ou 23:00, e `skyAt` e `sunPosition` não extrapolam cores nem ângulos. Testes em `clock.test.js` e `sky.test.js`.
3. **Página aberta no meio do dia** (recarregar no fim, ou link direto para `#contato`): o primeiro quadro já mostra a hora certa, sem animar o dia inteiro. É verificado no navegador (Tarefa 11).
4. **Dispositivo de toque, sem hover:** a lente fica fixa em (50%, 42%), o anel do cursor some e o offset do mouse é 0. É verificado em emulação mobile (Tarefa 11).
5. **WebGL indisponível ou contexto perdido:** a classe `no-webgl` é aplicada, o fundo CSS mantém a passagem do dia e o conteúdo continua legível. É verificado com `?nowebgl` (Tarefa 11) e com o handler de `webglcontextlost` (Tarefa 11).

---

### Tarefa 1: Projeto base e `time/interpolate.js`

**Arquivos:**
- Criar: `package.json`, `vite.config.js`, `.gitignore`, `src/time/interpolate.js`
- Teste: `tests/time/interpolate.test.js`

**Interfaces:**
- Produz:
  - `clamp(v: number, min: number, max: number): number`
  - `lerp(a: number, b: number, t: number): number`
  - `smoothstep(t: number): number`: limita `t` a [0, 1] e retorna `t*t*(3-2t)`.
  - `lerpColor(a: string, b: string, t: number): string`: hex `#rrggbb` para hex `#rrggbb`, cada canal arredondado com `Math.round`.
  - `sampleKeyframes(keys: Array<{hour: number}>, hour: number, mix: (a, b, t) => any): any`: assume `keys` ordenado por `hour`; trava nos extremos; com hora igual, retorna o próprio keyframe.

- [ ] **Passo 1:** `npm init -y`; instalar `three` e, como devDependencies, `vite` e `vitest`. Antes de criar `vite.config.js`, conferir em `npm view vitest peerDependencies` que o Vitest 5 aceita o Vite 8. Scripts: `dev: vite`, `build: vite build`, `preview: vite preview`, `test: vitest run`. Em `vite.config.js`, usar `defineConfig` de `vitest/config` com `base: './'` e `test.environment: 'node'`. Em `.gitignore`: `node_modules`, `dist`.
- [ ] **Passo 2: escrever o teste que falha**

```js
import { describe, it, expect } from 'vitest';
import { clamp, lerp, smoothstep, lerpColor, sampleKeyframes } from '../../src/time/interpolate.js';

describe('interpolate', () => {
  it('clamp', () => { expect(clamp(5, 0, 1)).toBe(1); expect(clamp(-1, 0, 1)).toBe(0); expect(clamp(0.3, 0, 1)).toBe(0.3); });
  it('lerp', () => { expect(lerp(10, 20, 0.25)).toBe(12.5); });
  it('smoothstep', () => { expect(smoothstep(-1)).toBe(0); expect(smoothstep(0.5)).toBe(0.5); expect(smoothstep(2)).toBe(1); });
  it('lerpColor', () => {
    expect(lerpColor('#000000', '#ffffff', 0.5)).toBe('#808080');
    expect(lerpColor('#ff0000', '#0000ff', 0)).toBe('#ff0000');
    expect(lerpColor('#ff0000', '#0000ff', 1)).toBe('#0000ff');
  });
  it('sampleKeyframes', () => {
    const keys = [{ hour: 6, v: 0 }, { hour: 8, v: 10 }, { hour: 12, v: 30 }];
    const mix = (a, b, t) => lerp(a.v, b.v, t);
    expect(sampleKeyframes(keys, 7, mix)).toBe(5);
    expect(sampleKeyframes(keys, 10, mix)).toBe(20);
    expect(sampleKeyframes(keys, 3, mix)).toBe(0);
    expect(sampleKeyframes(keys, 99, mix)).toBe(30);
    expect(sampleKeyframes(keys, 8, mix)).toBe(10);
  });
});
```

- [ ] **Passo 3:** `npx vitest run tests/time/interpolate.test.js`. Esperado: FALHA (módulo não existe).
- [ ] **Passo 4:** implementar `src/time/interpolate.js` com as assinaturas acima. Fora do intervalo, `sampleKeyframes` chama `mix(primeiro, primeiro, 0)` ou `mix(último, último, 0)`.
- [ ] **Passo 5:** `npx vitest run tests/time/interpolate.test.js`. Esperado: PASSA.
- [ ] **Passo 6:** commit, se autorizado: `chore: projeto base e utilitários de interpolação`.

### Tarefa 2: `time/clock.js` (hora a partir da rolagem)

**Arquivos:**
- Criar: `src/time/clock.js`
- Teste: `tests/time/clock.test.js`

**Interfaces:**
- Consome: `clamp`, `lerp` (Tarefa 1).
- Produz:
  - `computeAnchors(items: Array<{top: number, hour: number}>, viewportHeight: number, maxScroll: number): Array<{y: number, hour: number}>`: `y = clamp(top − viewportHeight/2, 0, maxScroll)`, ordenado por `y` e, em empate, por `hour`.
  - `hourFromScroll(scrollY: number, anchors): number`: usa a última âncora com `y <= scrollY` e interpola até a próxima de `y` maior. Trechos de comprimento zero são ignorados. Sem âncoras, retorna 6.
  - `formatHour(hour: number): string`: `"HH:MM"`, com os minutos truncados (`Math.floor(hour*60)`).

- [ ] **Passo 1: escrever o teste que falha**

```js
import { describe, it, expect } from 'vitest';
import { computeAnchors, hourFromScroll, formatHour } from '../../src/time/clock.js';

describe('computeAnchors', () => {
  it('centraliza e trava no intervalo rolável', () => {
    const a = computeAnchors([{ top: 0, hour: 6 }, { top: 1000, hour: 8 }, { top: 5000, hour: 23 }], 800, 3000);
    expect(a).toEqual([{ y: 0, hour: 6 }, { y: 600, hour: 8 }, { y: 3000, hour: 23 }]);
  });
});

describe('hourFromScroll', () => {
  const anchors = [{ y: 0, hour: 6 }, { y: 600, hour: 8 }, { y: 3000, hour: 23 }];
  it('interpola por trechos', () => { expect(hourFromScroll(300, anchors)).toBe(7); expect(hourFromScroll(1800, anchors)).toBe(15.5); });
  it('trava nos extremos (rolagem elástica)', () => { expect(hourFromScroll(-120, anchors)).toBe(6); expect(hourFromScroll(9999, anchors)).toBe(23); });
  it('âncoras empatadas não geram NaN; vale a de hora maior', () => {
    const tied = [{ y: 0, hour: 6 }, { y: 0, hour: 8 }, { y: 0, hour: 23 }];
    expect(hourFromScroll(0, tied)).toBe(23);
    const partial = [{ y: 0, hour: 6 }, { y: 0, hour: 8 }, { y: 100, hour: 10 }];
    expect(hourFromScroll(0, partial)).toBe(8);
    expect(hourFromScroll(50, partial)).toBe(9);
  });
  it('sem âncoras retorna 6', () => { expect(hourFromScroll(100, [])).toBe(6); });
});

describe('formatHour', () => {
  it('formata HH:MM', () => {
    expect(formatHour(6)).toBe('06:00');
    expect(formatHour(17.5)).toBe('17:30');
    expect(formatHour(23)).toBe('23:00');
    expect(formatHour(6.999)).toBe('06:59');
  });
});
```

- [ ] **Passo 2:** `npx vitest run tests/time/clock.test.js`. Esperado: FALHA.
- [ ] **Passo 3:** implementar `src/time/clock.js` com as assinaturas acima.
- [ ] **Passo 4:** `npx vitest run tests/time/clock.test.js`. Esperado: PASSA.
- [ ] **Passo 5:** commit, se autorizado: `feat: hora a partir da rolagem`.

### Tarefa 3: `time/sun.js` (posição do sol)

**Arquivos:**
- Criar: `src/time/sun.js`
- Teste: `tests/time/sun.test.js`

**Interfaces:**
- Produz:
  - Constantes `SUNRISE = 6`, `SUNSET = 18.5`, `MAX_ALTITUDE = 70`.
  - `sunPosition(hour: number, offset = { azimuth: 0, altitude: 0 }): { altitude: number, azimuth: number, aboveHorizon: boolean }`, em graus, com `t = (hour − 6) / 12.5`, `altitude = 70·sin(π·t) + offset.altitude`, `azimuth = 90 − 180·t + offset.azimuth` e `aboveHorizon = hour >= SUNRISE && hour <= SUNSET` (independente do offset).
  - `sunDirection(altitudeDeg: number, azimuthDeg: number): { x, y, z }`, vetor unitário com `x = cos(alt)·sin(az)`, `y = sin(alt)` e `z = −cos(alt)·cos(az)`.

- [ ] **Passo 1: escrever o teste que falha**

```js
import { describe, it, expect } from 'vitest';
import { sunPosition, sunDirection } from '../../src/time/sun.js';

describe('sunPosition', () => {
  it('nascer', () => { const s = sunPosition(6); expect(s.altitude).toBeCloseTo(0); expect(s.azimuth).toBeCloseTo(90); expect(s.aboveHorizon).toBe(true); });
  it('meio-dia solar (12:15)', () => { const s = sunPosition(12.25); expect(s.altitude).toBeCloseTo(70); expect(s.azimuth).toBeCloseTo(0); });
  it('pôr', () => { const s = sunPosition(18.5); expect(s.altitude).toBeCloseTo(0); expect(s.azimuth).toBeCloseTo(-90); });
  it('noite', () => { const s = sunPosition(21); expect(s.aboveHorizon).toBe(false); expect(s.altitude).toBeLessThan(0); });
  it('offset do mouse', () => { const s = sunPosition(12.25, { azimuth: 12, altitude: -5 }); expect(s.azimuth).toBeCloseTo(12); expect(s.altitude).toBeCloseTo(65); });
});

describe('sunDirection', () => {
  it('leste = +X', () => { const d = sunDirection(0, 90); expect(d.x).toBeCloseTo(1); expect(d.y).toBeCloseTo(0); expect(d.z).toBeCloseTo(0); });
  it('norte = −Z', () => { const d = sunDirection(0, 0); expect(d.z).toBeCloseTo(-1); });
  it('zênite = +Y', () => { expect(sunDirection(90, 0).y).toBeCloseTo(1); });
});
```

- [ ] **Passo 2:** `npx vitest run tests/time/sun.test.js`. Esperado: FALHA.
- [ ] **Passo 3:** implementar `src/time/sun.js`.
- [ ] **Passo 4:** `npx vitest run tests/time/sun.test.js`. Esperado: PASSA.
- [ ] **Passo 5:** commit, se autorizado: `feat: modelo estilizado do sol`.

### Tarefa 4: `time/sky.js` (paleta do céu)

**Arquivos:**
- Criar: `src/time/sky.js`
- Teste: `tests/time/sky.test.js`

**Interfaces:**
- Consome: `lerp`, `lerpColor`, `smoothstep`, `sampleKeyframes` (Tarefa 1).
- Produz:
  - `SKY_KEYFRAMES`: os 8 keyframes da tabela 5.3 da spec, no formato `{ hour, zenith, horizon, light, intensity }`.
  - `skyAt(hour): { zenith, horizon, light, intensity, fogDensity, windowGlow, starOpacity }`, com:
    - `fogDensity = lerp(0.022, 0.0045, smoothstep((hour − 6) / 3))`
    - `windowGlow = smoothstep((hour − 18.5) / 1.5)`
    - `starOpacity = smoothstep((hour − 18.5) / 2)`

- [ ] **Passo 1: escrever o teste que falha**

```js
import { describe, it, expect } from 'vitest';
import { skyAt, SKY_KEYFRAMES } from '../../src/time/sky.js';

describe('skyAt', () => {
  it('8 keyframes ordenados', () => { expect(SKY_KEYFRAMES.map(k => k.hour)).toEqual([6, 8, 12, 16, 17.5, 18.5, 20, 23]); });
  it('valor exato no keyframe', () => { const s = skyAt(12); expect(s.zenith).toBe('#4f8fd6'); expect(s.horizon).toBe('#dfeaf3'); expect(s.intensity).toBe(2.4); });
  it('interpola no meio do trecho', () => { expect(skyAt(10).intensity).toBeCloseTo(2.0); expect(skyAt(10).light).toBe('#fff1e2'); });
  it('trava nos extremos', () => { expect(skyAt(-5).zenith).toBe('#3b3a6b'); expect(skyAt(30).zenith).toBe('#05070f'); });
  it('névoa', () => { expect(skyAt(6).fogDensity).toBeCloseTo(0.022); expect(skyAt(9).fogDensity).toBeCloseTo(0.0045); expect(skyAt(12).fogDensity).toBeCloseTo(0.0045); });
  it('janelas e estrelas', () => {
    expect(skyAt(18.5).windowGlow).toBe(0); expect(skyAt(20).windowGlow).toBe(1);
    expect(skyAt(18.5).starOpacity).toBe(0); expect(skyAt(20.5).starOpacity).toBe(1);
  });
});
```

- [ ] **Passo 2:** `npx vitest run tests/time/sky.test.js`. Esperado: FALHA.
- [ ] **Passo 3:** implementar `src/time/sky.js`.
- [ ] **Passo 4:** `npm test`. Esperado: todos os testes de `tests/time/` passam.
- [ ] **Passo 5:** commit, se autorizado: `feat: paleta do céu ao longo do dia`.

### Tarefa 5: Página HTML, estilos e loop sem 3D

O resultado é um site completo e navegável no modo sem WebGL: o fundo CSS muda com a hora e o HUD funciona.

**Arquivos:**
- Criar: `index.html`, `src/styles/main.css`, `src/main.js`, `src/ui/hud.js`, `public/favicon.svg`

**Interfaces:**
- Consome: `computeAnchors`, `hourFromScroll`, `formatHour`, `sunPosition`, `skyAt`.
- Produz:
  - `createHud(root: HTMLElement): { update(hour: number, sun): void }`: escreve em `[data-hud-time]` e `[data-hud-sun]` (`SOL 12° · AZ 84°`, arredondados) só quando `formatHour(hour)` muda.
  - Em `main.js`, o objeto `state = { targetHour, hour, mouse: { x, y, nx, ny }, isTouch, reducedMotion, webgl }`, em que `nx` e `ny` estão em [−1, 1]. No primeiro quadro, `state.hour = state.targetHour`.
  - As variáveis CSS `--sky-zenith` e `--sky-horizon` no `:root`, atualizadas só quando o hex muda.

- [ ] **Passo 1:** escrever `index.html` com:
  - `<link>` das três fontes.
  - Canvas `#scene` com `aria-hidden="true"`.
  - `header` com navegação e HUD (`[data-hud-time]`, `[data-hud-sun]`).
  - `main` com as seções `#amanhecer` (`data-hour="6"`), `#manifesto` (8), `#projetos` contendo 4 `article` (`#p-varanda` 10, `#p-seco` 12, `#p-fresta` 14, `#p-brisa` 16, cada um com `data-project`), `#estudio` (17.5) e `#contato` (20).
  - `footer` (`data-hour="23"`).
  - Todos os textos finais em pt-BR, com os dados da tabela 3.5 da spec, e o aviso de estúdio fictício no rodapé.
  - Cada `article` com uma altura mínima de `160vh`, para que a câmera tenha tempo de parar no projeto.
- [ ] **Passo 2:** escrever `main.css`:
  - Tokens de cor e fonte da spec.
  - `body` com `background: linear-gradient(var(--sky-zenith), var(--sky-horizon)) fixed`.
  - Canvas fixo em tela cheia, com `z-index` abaixo do conteúdo.
  - Painéis de texto com fundo `rgba(243,239,231,.72)` e `backdrop-filter: blur(14px)`.
  - Título da abertura em Instrument Serif, com `clamp(4rem, 14vw, 13rem)`.
  - HUD em Doto.
  - Meridiana como detalhe gráfico: uma linha vertical fina de latão (#b08d57) ao longo da página.
  - Painéis com contraste mínimo AA para o texto.
  - Layout de celular com 16 px de margem lateral e sem rolagem horizontal.
  - `html.no-webgl #scene { display: none }`.
  - `@media (prefers-reduced-motion: reduce)` desliga `scroll-behavior: smooth`.
- [ ] **Passo 3:** implementar `hud.js` e `main.js`:
  - Ler as âncoras de `[data-hour]`, com `top = rect.top + scrollY`.
  - Recalcular as âncoras no `resize` e após `document.fonts.ready`.
  - Em `scroll`, atualizar `targetHour`.
  - Loop com `requestAnimationFrame`: `hour = lerp(hour, targetHour, 0.08)`, depois `skyAt` atualiza as variáveis CSS, depois o HUD.
  - `webgl` é falso por enquanto.
- [ ] **Passo 4:** criar `.claude/launch.json` com uma configuração `dev` (`npm run dev`, porta 5173). Abrir com `preview_start` e rolar até cada seção. Esperado: o HUD mostra 06:00, 08:00, 10:00, 12:00, 14:00, 16:00, 17:30, 20:00 e 23:00 nas âncoras, o fundo muda de cor e não há erros no console.
- [ ] **Passo 5:** commit, se autorizado: `feat: página e passagem do dia sem 3D`.

### Tarefa 6: Componentes de interface (manifesto, relógio de sol, intro, cursor)

**Arquivos:**
- Criar: `src/ui/reveal.js`, `src/ui/sundial.js`, `src/ui/intro.js`, `src/ui/cursor.js`
- Modificar: `index.html` (SVG do relógio de sol em `#estudio`, overlay `#intro`, elemento `#cursor`), `src/styles/main.css`, `src/main.js`

**Interfaces:**
- Consome: `formatHour`, `clamp`, `smoothstep`.
- Produz:
  - `createReveal(el: HTMLElement): { update(): void }`: divide o texto em `<span class="word">` e calcula o progresso pela posição de `el` na viewport (0 quando o topo entra pela base da tela, 1 quando o fim passa do centro). A palavra *i* de *n* tem `opacity = 0.15 + 0.85·clamp(progress·n − i, 0, 1)`.
  - `createSundial(svg: SVGElement): { update(hour: number, scrollY: number): void }`: o anel de texto gira `scrollY · 0.04` graus. A sombra do gnômon gira de −90° (06:00) a +90° (18:00), travada nesse intervalo.
  - `playIntro(el: HTMLElement, { reduced: boolean }): Promise<void>`: conta de 00:00 a 06:00 em 1200 ms (ou resolve na hora, se `reduced`) e depois some com fade e remove o elemento.
  - `createCursor(el: HTMLElement, { isTouch }): { update(x: number, y: number, lens: number): void }`: o anel segue o mouse com lerp de 0,2. O diâmetro interpola de 28 px a 280 px conforme `lens` (0 a 1). Em toque, o anel fica oculto.

- [ ] **Passo 1:** implementar os quatro módulos e ligá-los no loop de `main.js`. O anel do relógio de sol usa `textPath` com "ARQUITETURA · LUZ · TEMPO · MATÉRIA · SOMBRA · " repetido e marcações de 6 a 18.
- [ ] **Passo 2:** verificar no navegador. Esperado:
  - As palavras do manifesto acendem em sequência ao rolar.
  - O anel gira e a sombra aponta perto das 17:30 em `#estudio`.
  - A intro conta até 06:00 e some.
  - O anel do cursor segue o mouse.
  - Não há erros no console.
- [ ] **Passo 3:** commit, se autorizado: `feat: manifesto, relógio de sol, intro e cursor`.

### Tarefa 7: Cena base (renderer, céu, luz, terreno, meridiana)

**Arquivos:**
- Criar: `src/scene/world.js`, `src/scene/sky-dome.js`
- Modificar: `src/main.js`

**Interfaces:**
- Consome: `sunPosition`, `sunDirection`, `skyAt`.
- Produz:
  - `createSkyDome(): { mesh: THREE.Mesh, update(sky, sunDir: {x,y,z}): void }`: esfera de raio 1000 com `side: BackSide`, `depthWrite: false` e um shader que faz o degradê do horizonte para o zênite pela coordenada y da direção, com brilho do sol `pow(max(dot(dir, sunDir), 0), 64)` na cor `light`.
  - `createWorld(canvas: HTMLCanvasElement, { isTouch: boolean }): { scene, camera, renderer, composer, update(frame): void, resize(w: number, h: number): void, render(): void }`, em que `frame = { hour, sun, sky }`.
- Detalhes que não dependem do implementador:
  - `PerspectiveCamera(40, w/h, 0.5, 2500)`.
  - `renderer.toneMapping = ACESFilmicToneMapping`.
  - `shadowMap.type = PCFSoftShadowMap`.
  - Luzes: `DirectionalLight` (sol, projeta sombra, câmera de sombra ortográfica de ±160 m), `DirectionalLight` (lua, `#8fa6ff`, ativa quando `!sun.aboveHorizon`) e `HemisphereLight` (céu = zênite, chão = #d9d4cb, intensidade `0.25 + 0.15·intensity`).
  - Posição do sol = `sunDirection(max(alt, 4), az) · 300`.
  - `scene.fog = FogExp2(horizon, fogDensity)`.
  - Terreno: plano de 2000 × 2000 com cor #d9d4cb e `roughness 1`.
  - Meridiana: caixa fina de 0,25 × 0,02 × 600 em x = 0, cor de latão #b08d57 com `metalness 0.8` e `roughness 0.35`.
  - Composer: `RenderPass` seguido de `OutputPass` (a Tarefa 10 acrescenta o halftone depois).

- [ ] **Passo 1:** implementar `sky-dome.js` e `world.js`.
- [ ] **Passo 2:** em `main.js`, detectar WebGL (tentar `canvas.getContext('webgl2')` e respeitar `?nowebgl`), criar o mundo, chamar `world.update` e `world.render` no loop e `world.resize` no `resize`. Sem WebGL, adicionar `no-webgl` ao `<html>`.
- [ ] **Passo 3:** verificar no navegador. Esperado:
  - O céu muda ao rolar.
  - A meridiana aparece no chão.
  - A luz muda de cor e intensidade.
  - De madrugada há névoa e às 23:00 a cena fica escura.
  - Não há erros no console.
- [ ] **Passo 4:** commit, se autorizado: `feat: cena base com céu, sol e meridiana`.

### Tarefa 8: Projetos 3D, janelas em pixel e estrelas

**Arquivos:**
- Criar: `src/data/projects.js`, `src/scene/buildings.js`, `src/scene/windows.js`, `src/scene/stars.js`
- Modificar: `src/scene/world.js`

**Interfaces:**
- Produz:
  - `PROJECTS`: array de `{ id, hour, origin: [x, z], volumes: Array<{ size: [w,h,d], pos: [x,y,z], rotY?: number, material: 'concrete'|'glass'|'wood' }>, windows: Array<{ size: [w,h], pos: [x,y,z], rotY: number }>, camera: { position: [x,y,z], target: [x,y,z] } }`. As posições e a câmera são relativas a `origin`, e a câmera fica fora dos volumes.
  - `createBuildings(projects): THREE.Group`: um `Mesh(BoxGeometry)` por volume, todos com `castShadow` e `receiveShadow`. Materiais compartilhados: concreto #cfc8bc (`roughness 0.92`), vidro #2c3440 (`roughness 0.08`, `metalness 0.3`) e madeira #8a5a3b (`roughness 0.7`).
  - `createWindows(projects): { group: THREE.Group, update(windowGlow: number): void }`: um plano por janela. Cada uma usa uma `CanvasTexture` de 16 × 16 px com grade de quadrados acesos aleatórios, com `magFilter = NearestFilter` para ficar pixelado, como `emissiveMap` na cor #ffcf7a. Cada janela tem um atraso `d ∈ [0, 0.5]`, e `emissiveIntensity = 1.2 · clamp((windowGlow − d) / 0.5, 0, 1)`.
  - `createStars(count = 1500, radius = 900): { points: THREE.Points, update(opacity: number): void }`, com estrelas só no hemisfério de cima.
- Valores iniciais de `origin` (ajustáveis na verificação visual): varanda [−70, 40], seco [−10, −10], fresta [55, −55], brisa [120, −10].
- Formas, seguindo a tabela 3.5 da spec:
  - **Varanda:** laje de 32 × 0,6 × 12 a 4 m de altura sobre 6 pilotis, com caixa de vidro de 18 × 3,4 × 8 embaixo e deque de madeira.
  - **Seco:** cobertura de 26 × 1,4 × 26 a 5 m sobre duas paredes cegas de 26 × 5 × 1,2; pátio central sugerido por quatro blocos de cobertura com um vão de 8 m no meio.
  - **Fresta:** bloco de 18 × 30 × 18 cortado por 5 frestas de vidro de 0,8 × 26, formado por 6 lâminas de concreto alternadas com 5 de vidro.
  - **Brisa:** 7 lajes de 7 × 0,4 × 7 a cada 3,2 m, cada uma girada 9° a mais que a anterior, com um núcleo de 2,4 × 22 × 2,4.

- [ ] **Passo 1:** implementar os quatro arquivos e adicionar os grupos e os pontos à cena em `world.js`. `frame.sky.windowGlow` e `frame.sky.starOpacity` alimentam os `update`.
- [ ] **Passo 2:** verificar no navegador, posicionando a câmera de teste em uma vista geral. Esperado:
  - Os quatro prédios aparecem com sombras coerentes com a hora.
  - Às 20:00 as janelas acendem pixeladas, com atrasos diferentes.
  - Às 23:00 há estrelas.
  - Não há erros no console.
- [ ] **Passo 3:** commit, se autorizado: `feat: projetos 3D, janelas noturnas e estrelas`.

### Tarefa 9: Trajeto da câmera

**Arquivos:**
- Criar: `src/scene/camera-path.js`
- Teste: `tests/scene/camera-path.test.js`
- Modificar: `src/main.js`, `src/scene/world.js`

**Interfaces:**
- Consome: `PROJECTS`, `sampleKeyframes`, `smoothstep`, `lerp`.
- Produz:
  - `buildCameraKeyframes(projects): Array<{ hour, position: [x,y,z], target: [x,y,z] }>`, com os keyframes fixos e os de projeto convertidos para coordenadas absolutas (somando `origin` em x e z), ordenados por hora. Keyframes fixos (valores iniciais):
    - 6: pos [0, 6, 190], alvo [20, 8, 0]
    - 8: pos [−20, 30, 150], alvo [20, 6, 0]
    - 17.5: pos [150, 18, 90], alvo [40, 10, −20]
    - 20: pos [−40, 60, 170], alvo [30, 6, −10]
    - 23: pos [0, 140, 260], alvo [25, 0, −10]
  - `sampleCamera(hour: number, keyframes): { position: [x,y,z], target: [x,y,z] }`: interpola com `smoothstep(t)` entre os keyframes vizinhos e trava nos extremos.
  - `REDUCED_MOTION_VIEW = { position: [0, 140, 260], target: [25, 0, -10] }`.

- [ ] **Passo 1: escrever o teste que falha**

```js
import { describe, it, expect } from 'vitest';
import { sampleCamera, buildCameraKeyframes } from '../../src/scene/camera-path.js';

const keys = [
  { hour: 6, position: [0, 0, 0], target: [0, 0, 0] },
  { hour: 8, position: [10, 20, 30], target: [2, 2, 2] },
];

describe('sampleCamera', () => {
  it('exato no keyframe', () => { expect(sampleCamera(8, keys).position).toEqual([10, 20, 30]); });
  it('meio do trecho com smoothstep', () => { expect(sampleCamera(7, keys).position).toEqual([5, 10, 15]); });
  it('easing: 25% do tempo < 25% do caminho', () => { expect(sampleCamera(6.5, keys).position[0]).toBeCloseTo(1.5625); });
  it('trava', () => { expect(sampleCamera(2, keys).position).toEqual([0, 0, 0]); expect(sampleCamera(30, keys).target).toEqual([2, 2, 2]); });
});

describe('buildCameraKeyframes', () => {
  it('soma origin de projeto e ordena por hora', () => {
    const k = buildCameraKeyframes([{ id: 'x', hour: 10, origin: [100, -50], camera: { position: [1, 2, 3], target: [0, 1, 0] } }]);
    const p = k.find(f => f.hour === 10);
    expect(p.position).toEqual([101, 2, -47]);
    expect(p.target).toEqual([100, 1, -50]);
    expect(k.map(f => f.hour)).toEqual([...k.map(f => f.hour)].sort((a, b) => a - b));
  });
});
```

- [ ] **Passo 2:** `npx vitest run tests/scene/camera-path.test.js`. Esperado: FALHA.
- [ ] **Passo 3:** implementar `camera-path.js`. O módulo não importa `three`.
- [ ] **Passo 4:** `npm test`. Esperado: PASSA.
- [ ] **Passo 5:** em `world.update`, aplicar `sampleCamera(hour)` mais a paralaxe do mouse (`nx · 0.6`, `ny · 0.6` somados à posição) e fazer `camera.lookAt(target)`. Com `reducedMotion`, usar `REDUCED_MOTION_VIEW` sem paralaxe. Em toque, `nx = ny = 0`. O offset do sol em `main.js` é `{ azimuth: nx · 12, altitude: −ny · 5 }` (0 em toque).
- [ ] **Passo 6:** verificar no navegador que a câmera para em cada projeto quando o HUD marca 10:00, 12:00, 14:00 e 16:00 e que o prédio fica enquadrado do lado oposto ao painel de texto. Ajustar `camera` e `origin` em `projects.js` se precisar.
- [ ] **Passo 7:** commit, se autorizado: `feat: trajeto de câmera ao longo do dia`.

### Tarefa 10: Halftone com lente no cursor

**Arquivos:**
- Criar: `src/scene/halftone.js`
- Modificar: `src/scene/world.js`, `src/main.js`

**Interfaces:**
- Consome: `ShaderPass` de `three/addons/postprocessing/ShaderPass.js`.
- Produz:
  - `createHalftonePass(): ShaderPass`, com os uniforms `tDiffuse`, `uResolution: vec2` (px de dispositivo), `uCell: float`, `uMix: float`, `uLens: vec3` (x, y em px de dispositivo com origem embaixo à esquerda, e raio), `uFeather: float` e `uPaper: vec3` (#f3efe7).
  - `updateHalftone(pass, { mix, lensX, lensY, radius, width, height, pixelRatio })`: converte de CSS px para px de dispositivo e inverte o y (`(height − lensY) · pixelRatio`). Usa `uCell = 7 · pixelRatio` e `uFeather = 24 · pixelRatio`.
  - `world.render()` passa a usar `RenderPass`, depois `OutputPass` e por último o halftone, que entra no fim porque trabalha sobre cores já em sRGB.
  - `state.halftone` em `main.js`: alvo 1 se `9.5 <= hour <= 16.5`, senão 0, com lerp de 0,06 por quadro. A lente segue o mouse, ou fica em (50%, 42%) em toque. O raio é de 140 px. `cursor.update(x, y, state.halftone)`.
- Algoritmo do fragment shader (não determinado pela assinatura):

```glsl
vec2 px = vUv * uResolution;
vec2 center = (floor(px / uCell) + 0.5) * uCell;
vec3 c = texture2D(tDiffuse, center / uResolution).rgb;
float lum = dot(c, vec3(0.299, 0.587, 0.114));
float r = uCell * 0.5 * sqrt(1.0 - lum) * 1.15;
float dotMask = 1.0 - smoothstep(r - 1.0, r + 1.0, length(px - center));
vec3 ht = mix(uPaper, c, dotMask);
vec3 orig = texture2D(tDiffuse, vUv).rgb;
float lens = 1.0 - smoothstep(uLens.z - uFeather, uLens.z, length(px - uLens.xy));
gl_FragColor = vec4(mix(orig, ht, uMix * (1.0 - lens)), 1.0);
```

- [ ] **Passo 1:** implementar `halftone.js` e ligar no `world` e no `main`.
- [ ] **Passo 2:** verificar no navegador. Esperado:
  - Às 12:00 a cena aparece em pontos sobre papel e, dentro da lente sob o cursor, aparece o render normal com borda suave alinhada ao anel do cursor.
  - Às 08:00 e às 17:30 não há halftone.
  - Não há erros no console.
- [ ] **Passo 3:** commit, se autorizado: `feat: halftone com lente no cursor`.

### Tarefa 11: Alternativas, desempenho, README e verificação final

**Arquivos:**
- Modificar: `src/main.js`, `src/scene/world.js`, `src/styles/main.css`
- Criar: `README.md`

- [ ] **Passo 1:** no `world`:
  - `setPixelRatio(min(devicePixelRatio, isTouch ? 1.5 : 2))`.
  - `shadow.mapSize` de 2048 ou 1024 conforme o tipo de dispositivo.
  - Em `webglcontextlost`, `preventDefault`, adicionar `no-webgl` ao `<html>` e parar de renderizar.
- [ ] **Passo 2:** no `main`:
  - Pausar o `requestAnimationFrame` em `visibilitychange` quando a aba estiver oculta e retomar depois.
  - Com `reducedMotion`, pular a intro.
- [ ] **Passo 3:** escrever `README.md` (pt-BR) com o conceito, como rodar (`npm install`, `npm run dev`, `npm test`, `npm run build`), a estrutura de pastas e o aviso de estúdio fictício.
- [ ] **Passo 4:** `npm test`. Esperado: todos os testes passam.
- [ ] **Passo 5:** `npm run build`. Esperado: build sem erros, com `dist/index.html` gerado.
- [ ] **Passo 6:** verificação visual em desktop (1440 × 900), rolando por todas as seções. Esperado:
  - As horas certas no HUD.
  - O halftone e a lente nos projetos.
  - As janelas acesas à noite.
  - Nenhum erro no console.
- [ ] **Passo 7:** abrir direto em `/#contato`. Esperado: o HUD mostra 20:00 no primeiro quadro, sem animar o dia todo (Foco da revisão, item 3).
- [ ] **Passo 8:** emulação mobile (375 × 812). Esperado:
  - Sem rolagem horizontal.
  - O anel do cursor oculto.
  - A lente fixa em (50%, 42%) nos projetos.
  - Textos legíveis.
- [ ] **Passo 9:** abrir com `?nowebgl`. Esperado: o canvas fica oculto, o fundo em degradê muda com a rolagem, o HUD funciona e o conteúdo é legível.
- [ ] **Passo 10:** commit, se autorizado: `feat: alternativas, desempenho e README`.
