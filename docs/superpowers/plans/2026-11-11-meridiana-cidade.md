# Meridiana fase 2: plano de implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Objetivo:** transformar o entorno numa cidade-maquete viva, detalhar as 4 obras com anotações e vista explodida, acrescentar a planta de situação e dar ao site uma tipografia que reage à luz.

**Arquitetura:** a cidade é gerada como dados puros e testados (`src/city/`) e desenhada por `src/scene/city.js` com uma malha fundida e instâncias. As obras viram listas de peças com camadas (`src/data/projects.js`), montadas por `buildings.js`. A interface nova (anotações, explosão, planta, tipografia) consome funções puras testadas e projeções fornecidas pelo `world`.

**Stack:** a mesma da fase 1: ES modules, Three.js 0.187.0 via import map (addons `BufferGeometryUtils`) e `node --test`.

**Spec:** `docs/superpowers/specs/2026-11-11-meridiana-cidade-design.md` (fase 2), sobre `2026-11-11-meridiana-design.md` (fase 1).

## Restrições globais

- Unidades em metros. Norte = −Z, leste = +X.
- Ruas a cada 86 m. Ruas comuns com 14 m, Avenida Meridiana (x = 0) com 24 m. Calçada de 3 m, elevada 0,15 m.
- Área da cidade: x de −300 a 344, z de −300 a 300. Semente 1914.
- Origens das obras: Varanda (−45,5, 43), Seco (45,5, 43), Fresta (45,5, −43), Brisa (129, −43).
- Camadas em ordem: `fundacao`, `estrutura`, `lajes`, `vedacao`, `cobertura`, `interiores`, `paisagismo`.
- Textos visíveis em pt-BR, com o texto das notas no HTML.
- Nenhuma dependência npm nova. Fontes pelo Google Fonts.
- O layout empilhado (`src/layout.js`) continua sendo a única condição de celular e tablet em pé.
- Commits por tarefa no `main`, já autorizados pelo usuário. Push só com pedido do usuário.

## Foco da revisão

1. **Âncora de nota atrás da câmera ou fora da tela:** a nota some. Não pode aparecer espelhada nem presa na borda. Teste de `screenFromNdc` na Tarefa 6.
2. **Vista explodida aberta e o usuário rola para outra obra:** ela fecha sozinha e o botão volta a `aria-pressed="false"`. Apertar o botão durante o voo (|Δ| > 1) não abre nada. Teste de `explodeTarget` na Tarefa 5 e checagem no navegador na Tarefa 7.
3. **Cidade invadindo ruas, calçadas ou quadras das obras:** nenhum prédio, árvore ou pessoa sobre ruas ou dentro das quadras reservadas, exceto as pessoas da praça. Testes na Tarefa 2.
4. **Celular:** a cidade não pode estourar o número de chamadas de desenho. `renderer.info.render.calls` precisa ficar abaixo de 60 numa vista da cidade. Checagem na Tarefa 11.
5. **Fontes que não carregam** (offline ou bloqueio): as pilhas de fallback precisam ficar legíveis, e os eixos variáveis não podem quebrar o layout. Checagem na Tarefa 11, bloqueando `fonts.googleapis.com`.

---

### Task 1: PRNG compartilhado e traçado de ruas e quadras

**Arquivos:**
- Criar: `src/city/random.js`, `src/city/generate.js`, `tests/city/random.test.js`, `tests/city/layout.test.js`
- Modificar: `src/scene/windows.js` (passa a importar `mulberry32` de `src/city/random.js`)

**Interfaces:**
- Produz:
  - `mulberry32(seed) → () => number` em [0, 1); `range(rand, min, max)`; `pick(rand, list)`.
  - `CITY_DEFAULTS = { seed: 1914, bounds: { minX: -300, maxX: 344, minZ: -300, maxZ: 300 }, pitch: 86, street: 14, avenue: 24, sidewalk: 3 }`.
  - `streetLines(opts) → { xs: number[], zs: number[] }`: múltiplos de `pitch` dentro da área, em ordem crescente.
  - `streetWidth(axis, at, opts) → number`: 24 para axis `'x'` com at = 0, senão 14.
  - `cityBlocks(opts, reserved = []) → Array<{ minX, maxX, minZ, maxZ, reserved: string|null }>`: retângulos entre bordas de calçada de ruas vizinhas. `reserved` é uma lista de `{ id, x, z }`, e a quadra que contém o ponto recebe o id.

- [ ] **Passo 1: testes que falham**

```js
// tests/city/random.test.js
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { mulberry32, range, pick } from '../../src/city/random.js';

describe('random', () => {
  it('determinístico por semente e em [0,1)', () => {
    const a = mulberry32(7), b = mulberry32(7);
    const xs = Array.from({ length: 50 }, () => a());
    assert.deepEqual(xs, Array.from({ length: 50 }, () => b()));
    assert.ok(xs.every((x) => x >= 0 && x < 1));
  });
  it('range e pick', () => {
    const r = mulberry32(1);
    for (let i = 0; i < 100; i++) { const v = range(r, 6, 11); assert.ok(v >= 6 && v < 11); }
    assert.ok(['a', 'b'].includes(pick(r, ['a', 'b'])));
  });
});
```

```js
// tests/city/layout.test.js
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { CITY_DEFAULTS, streetLines, streetWidth, cityBlocks } from '../../src/city/generate.js';

describe('traçado', () => {
  it('ruas a cada 86 m, incluindo a avenida em x = 0', () => {
    const { xs, zs } = streetLines(CITY_DEFAULTS);
    assert.ok(xs.includes(0) && xs.includes(86) && xs.includes(-258) && xs.includes(344));
    assert.ok(zs.includes(0) && zs.includes(-258) && zs.includes(258));
  });
  it('avenida tem 24 m, demais 14 m', () => {
    assert.equal(streetWidth('x', 0, CITY_DEFAULTS), 24);
    assert.equal(streetWidth('x', 86, CITY_DEFAULTS), 14);
    assert.equal(streetWidth('z', 0, CITY_DEFAULTS), 14);
  });
  it('quadras entre bordas de calçada e quadras reservadas pelas obras', () => {
    const blocks = cityBlocks(CITY_DEFAULTS, [{ id: 'seco', x: 45.5, z: 43 }, { id: 'varanda', x: -45.5, z: 43 }]);
    const seco = blocks.find((b) => b.reserved === 'seco');
    assert.deepEqual([seco.minX, seco.maxX, seco.minZ, seco.maxZ], [15, 76, 10, 76]);
    const varanda = blocks.find((b) => b.reserved === 'varanda');
    assert.deepEqual([varanda.minX, varanda.maxX], [-76, -15]);
    assert.equal(blocks.filter((b) => b.reserved).length, 2);
  });
});
```

- [ ] **Passo 2:** `node --test tests/city/`. Esperado: FALHA (módulos não existem).
- [ ] **Passo 3:** implementar `random.js` e as três funções de traçado. Trocar a cópia local de `mulberry32` em `windows.js` pelo import.
- [ ] **Passo 4:** `npm test`. Esperado: todos passam (os 49 anteriores mais os novos).
- [ ] **Passo 5:** commit `feat(cidade): traçado de ruas e quadras`.

### Task 2: Conteúdo da cidade (prédios, topo, árvores, postes, pessoas, faixas)

**Arquivos:**
- Modificar: `src/city/generate.js`
- Teste: `tests/city/generate.test.js`

**Interfaces:**
- Consome: Task 1.
- Produz: `generateCity(opts = CITY_DEFAULTS, reserved = []) → { streets, blocks, buildings, rooftops, trees, lamps, people, crosswalks, dashes, lanes, cars }`, em que:
  - `streets`: `[{ axis, at, width, from, to }]`;
  - `buildings`: `[{ x, z, w, d, h }]`, com (x, z) no centro da projeção;
  - `rooftops`: `[{ x, y, z, w, h, d }]`;
  - `trees`: `[{ x, z, r }]`;
  - `lamps`: `[{ x, z }]`;
  - `people`: `[{ x, z, rotY }]`;
  - `crosswalks` e `dashes`: `[{ x, z, w, d }]`;
  - `lanes` e `cars`: vazios até a Task 3.
- Regras (spec §2.2):
  - lote com lado de 12 a 20 m e 85% de ocupação;
  - recuo de 1,5 m;
  - altura `h = clamp(3·round((6 + r·(6 + 36·e^(−|x|/120)))/3), 6, 48)`;
  - topo: caixa d'água (50%) e casa de máquinas (25%) quando h > 12;
  - árvores a cada 12 m com p = 0,7 e a 10 m ou mais dos cruzamentos;
  - postes a cada 24 m, alternando os lados;
  - 260 pessoas nas calçadas e 8 por quadra reservada, a até 4 m da borda da quadra;
  - zebras nos 4 lados de cada cruzamento;
  - tracejado no eixo das ruas comuns.

- [ ] **Passo 1: teste que falha**

```js
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { generateCity, CITY_DEFAULTS } from '../../src/city/generate.js';

const RESERVED = [
  { id: 'varanda', x: -45.5, z: 43 }, { id: 'seco', x: 45.5, z: 43 },
  { id: 'fresta', x: 45.5, z: -43 }, { id: 'brisa', x: 129, z: -43 },
];
const city = generateCity(CITY_DEFAULTS, RESERVED);
const overlaps = (a, b) => a.minX < b.maxX && a.maxX > b.minX && a.minZ < b.maxZ && a.maxZ > b.minZ;
const rectOf = ({ x, z, w = 0, d = 0 }) => ({ minX: x - w / 2, maxX: x + w / 2, minZ: z - d / 2, maxZ: z + d / 2 });
const bands = city.streets.map((s) => {
  const half = s.width / 2 + CITY_DEFAULTS.sidewalk;
  return s.axis === 'x'
    ? { minX: s.at - half, maxX: s.at + half, minZ: s.from, maxZ: s.to }
    : { minX: s.from, maxX: s.to, minZ: s.at - half, maxZ: s.at + half };
});
const reservedBlocks = city.blocks.filter((b) => b.reserved);

describe('generateCity', () => {
  it('determinística', () => {
    assert.deepEqual(generateCity(CITY_DEFAULTS, RESERVED), city);
    assert.notDeepEqual(generateCity({ ...CITY_DEFAULTS, seed: 2 }, RESERVED).buildings, city.buildings);
  });
  it('prédios fora de ruas, calçadas e quadras das obras, dentro da área', () => {
    for (const b of city.buildings) {
      const r = rectOf(b);
      assert.ok(!bands.some((s) => overlaps(r, s)), `prédio sobre rua em ${b.x},${b.z}`);
      assert.ok(!reservedBlocks.some((q) => overlaps(r, q)), `prédio em quadra de obra em ${b.x},${b.z}`);
      assert.ok(r.minX >= -300 && r.maxX <= 344 && r.minZ >= -300 && r.maxZ <= 300);
    }
  });
  it('alturas em pavimentos de 3 m entre 6 e 48', () => {
    assert.ok(city.buildings.every((b) => b.h >= 6 && b.h <= 48 && b.h % 3 === 0));
  });
  it('árvores e postes nas calçadas, nunca dentro das quadras das obras', () => {
    for (const t of [...city.trees, ...city.lamps]) {
      assert.ok(!reservedBlocks.some((q) => overlaps(rectOf(t), q)));
    }
  });
  it('quantidades', () => {
    assert.ok(city.buildings.length >= 300 && city.buildings.length <= 900, `prédios: ${city.buildings.length}`);
    assert.ok(city.trees.length > 100 && city.lamps.length > 50 && city.crosswalks.length > 0);
    assert.equal(city.people.length, 260 + 8 * RESERVED.length);
  });
});
```

- [ ] **Passo 2:** `node --test tests/city/generate.test.js`. Esperado: FALHA.
- [ ] **Passo 3:** implementar o conteúdo em `generateCity` com a semente.
- [ ] **Passo 4:** `npm test`. Esperado: todos passam.
- [ ] **Passo 5:** commit `feat(cidade): prédios, árvores, postes, pessoas e faixas`.

### Task 3: Faixas de rolamento e carros

**Arquivos:**
- Modificar: `src/city/generate.js`
- Teste: `tests/city/cars.test.js`

**Interfaces:**
- Produz:
  - `lanes`: `[{ start: [x, z], end: [x, z] }]`, duas por rua: a ±2,5 m do eixo nas ruas comuns e a ±6 m na avenida, em sentidos opostos.
  - `cars`: 70 itens `{ lane, phase, speed }`, com `speed` entre 6 e 11.
  - `carPosition(car, lane, t) → { x, z, rotY }`, com `s = (phase + speed·t) mod comprimento` e `rotY = atan2(dx, dz)` na direção do movimento.

- [ ] **Passo 1: teste que falha**

```js
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { assertClose } from '../helpers.js';
import { carPosition, generateCity, CITY_DEFAULTS } from '../../src/city/generate.js';

const lane = { start: [0, 0], end: [0, -100] }; // rumo ao norte
describe('carros', () => {
  it('anda ao longo da faixa e dá a volta', () => {
    const car = { lane: 0, phase: 10, speed: 5 };
    assert.deepEqual([carPosition(car, lane, 0).x, carPosition(car, lane, 0).z], [0, -10]);
    assertClose(carPosition(car, lane, 2).z, -20);
    assertClose(carPosition(car, lane, 20).z, -10); // 10 + 100 = 110 mod 100
  });
  it('rotY aponta para onde o carro vai', () => {
    assertClose(Math.abs(carPosition({ lane: 0, phase: 0, speed: 1 }, lane, 0).rotY), Math.PI);
  });
  it('70 carros, velocidades 6–11, cada um numa faixa existente', () => {
    const city = generateCity(CITY_DEFAULTS, []);
    assert.equal(city.cars.length, 70);
    assert.ok(city.cars.every((c) => c.speed >= 6 && c.speed <= 11 && city.lanes[c.lane]));
    assert.equal(city.lanes.length, city.streets.length * 2);
  });
});
```

- [ ] **Passo 2:** `node --test tests/city/cars.test.js`. Esperado: FALHA.
- [ ] **Passo 3:** implementar.
- [ ] **Passo 4:** `npm test`. Esperado: todos passam.
- [ ] **Passo 5:** commit `feat(cidade): faixas e carros`.

### Task 4: Cidade em 3D, obras realocadas e câmeras fixas reapontadas

**Arquivos:**
- Criar: `src/scene/city.js`
- Modificar: `src/scene/world.js`, `src/data/projects.js` (só as origens), `src/scene/camera-path.js` (só `FIXED_KEYFRAMES` e `REDUCED_MOTION_VIEW`), `src/scene/windows.js` (exportar `pixelTexture(rand, grid)`)

**Interfaces:**
- Consome: `generateCity`, `carPosition`, `pixelTexture`.
- Produz: `createCity(data) → { group, update({ windowGlow, time }) }`.
  - **Prédios:** uma `BufferGeometry` fundida (`mergeGeometries` de `three/addons/utils/BufferGeometryUtils.js`). As faces laterais têm UV = (largura/3, altura/3) e topo e base apontam para o texel (0, 0), forçado apagado. Material #efebe4 com `emissiveMap` da textura de janelas (32 × 32, 55% acesas, `NearestFilter`, `RepeatWrapping`) e `emissiveIntensity = 1.1·windowGlow`. Projeta e recebe sombra.
  - **Ruas e calçadas:** caixas fundidas nas cores da spec §2.4.
  - **Instâncias:** troncos e copas, postes e cabeças de poste (emissivas, `0.9·windowGlow`), pessoas (cilindro de 0,25 × 1,7), carros (caixa de 4,2 × 1,4 × 1,8) e faróis (emissivos), zebras e tracejados.
  - **Carros:** `update` reposiciona as matrizes com `carPosition(…, time)`, em que `time` é `performance.now()/1000`, ou congelado com reduzir movimento.
- **Novas origens** (spec §2.3) e câmeras fixas, como valores iniciais ajustáveis:
  - 6: pos [0, 3.5, 250], alvo [0, 14, 0]
  - 8: pos [−40, 40, 200], alvo [20, 6, 0]
  - 17.5: pos [200, 26, 90], alvo [60, 10, −20]
  - 20: pos [−60, 70, 200], alvo [40, 6, 0]
  - 23: pos [0, 170, 320], alvo [40, 0, 0]
  - `REDUCED_MOTION_VIEW` = o keyframe das 23.

- [ ] **Passo 1:** implementar `city.js`, ligar no `world` (`world.update` repassa `windowGlow` e o tempo) e atualizar origens e câmeras fixas.
- [ ] **Passo 2:** `npm test`. Esperado: todos passam. O teste de `buildCameraKeyframes` continua válido, porque usa projetos sintéticos.
- [ ] **Passo 3:** navegador com `?debug`, às 06:00, 12:00, 20:00 e 23:00. Esperado:
  - cidade branca com ruas, árvores, carros andando e pessoas;
  - a Avenida Meridiana com a linha de latão no amanhecer;
  - à noite, janelas da cidade em pixels, postes e faróis acesos;
  - obras dentro das suas quadras;
  - console sem erros.
- [ ] **Passo 4:** commit `feat(cidade): cidade-maquete em 3D`.

### Task 5: Obras detalhadas por camadas

**Arquivos:**
- Criar: `src/scene/explode.js`, `tests/scene/explode.test.js`, `tests/data/projects.test.js`
- Modificar: `src/data/projects.js` (reescrita), `src/scene/buildings.js`, `src/scene/windows.js` (as janelas passam a ser peças `material: 'window'` montadas por `buildings.js`), `src/scene/world.js`

**Interfaces:**
- Produz:
  - `LAYERS = [{ id: 'fundacao', label: 'Fundação' }, …]`, nas 7 camadas da spec §3.1.
  - `layerOffset(index, amount, gap) = index·gap·amount`.
  - `explodeTarget(hour, projectHour, pressed) = pressed && |hour − projectHour| ≤ 1 ? 1 : 0`.
  - `PROJECTS[i]`: `{ id, hour, origin, parts, notes: [{ id, anchor, layer }], camera: { position, target, center, orbit }, explodeGap }`. Os ids das notas são exatamente os da spec §3.2.
  - `createBuildings(projects) → { group, setExplode(id, amount), updateNight(windowGlow), layerAnchors(id) → [{ label, position: [x,y,z] }], notePosition(id, note) → [x,y,z] }`. As posições já incluem o deslocamento da explosão.
  - Materiais da spec §3.1. `'window'` = plano com a textura de pixels, como na fase 1.

- [ ] **Passo 1: testes que falham**

```js
// tests/scene/explode.test.js
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { LAYERS, layerOffset, explodeTarget } from '../../src/scene/explode.js';

describe('vista explodida', () => {
  it('7 camadas na ordem da spec', () => {
    assert.deepEqual(LAYERS.map((l) => l.id), ['fundacao', 'estrutura', 'lajes', 'vedacao', 'cobertura', 'interiores', 'paisagismo']);
  });
  it('layerOffset', () => {
    assert.equal(layerOffset(0, 1, 4), 0);
    assert.equal(layerOffset(3, 1, 4), 12);
    assert.equal(layerOffset(3, 0.5, 4), 6);
  });
  it('explodeTarget: só perto da obra e com o botão pressionado', () => {
    assert.equal(explodeTarget(10.2, 10, true), 1);
    assert.equal(explodeTarget(10.2, 10, false), 0);
    assert.equal(explodeTarget(11.5, 10, true), 0); // rolou para longe: fecha
  });
});
```

```js
// tests/data/projects.test.js
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { PROJECTS } from '../../src/data/projects.js';
import { LAYERS } from '../../src/scene/explode.js';

const NOTE_IDS = {
  varanda: ['laje', 'pilotis', 'caixilhos', 'deque', 'piscina', 'jardim'],
  seco: ['cobertura', 'patio', 'paredes', 'umbuzeiro', 'cisterna', 'piso'],
  fresta: ['frestas', 'laminas', 'estantes', 'marquise', 'terraco', 'rampa'],
  brisa: ['lajes', 'nucleo', 'escada', 'guarda', 'biruta', 'cerrado'],
};
const ORIGINS = { varanda: [-45.5, 43], seco: [45.5, 43], fresta: [45.5, -43], brisa: [129, -43] };
const layerIds = LAYERS.map((l) => l.id);

describe('dados das obras', () => {
  for (const p of PROJECTS) {
    it(`${p.id}: origem, notas, camadas e câmera`, () => {
      assert.deepEqual(p.origin, ORIGINS[p.id]);
      assert.deepEqual(p.notes.map((n) => n.id), NOTE_IDS[p.id]);
      assert.ok(p.parts.length >= 25, `${p.id} tem só ${p.parts.length} peças`);
      assert.ok(p.parts.every((part) => layerIds.includes(part.layer) && ['box', 'cylinder'].includes(part.shape)));
      assert.ok(p.notes.every((n) => layerIds.includes(n.layer) && n.anchor.length === 3));
      assert.ok(p.camera.center && typeof p.camera.orbit === 'number' && p.explodeGap > 0);
    });
  }
});
```

- [ ] **Passo 2:** `node --test tests/scene/explode.test.js tests/data/projects.test.js`. Esperado: FALHA.
- [ ] **Passo 3:** implementar `explode.js` e reescrever `projects.js` com as peças da spec §3.2. Usar funções auxiliares por obra (por exemplo, `mullions`, `planks`, `spiralStair`, `boardMarks`) para não repetir peça a peça. Atualizar `buildings.js`, com um grupo por camada e cilindros por `CylinderGeometry`, e o `world`.
- [ ] **Passo 4:** `npm test`. Esperado: todos passam.
- [ ] **Passo 5:** navegador na parada de cada obra. Esperado: os detalhes da spec aparecem e as janelas acendem à noite. Para testar a explosão, chamar `setExplode(id, 1)` pelo console com `?debug`: as camadas sobem em ordem.
- [ ] **Passo 6:** commit `feat(obras): obras detalhadas em camadas`.

### Task 6: Anotações presas ao 3D

**Arquivos:**
- Criar: `src/ui/annotations.js`, `tests/ui/annotations.test.js`
- Modificar: `index.html` (uma `<ol class="project__notes">` por ficha, com os textos da spec §3.2 e uma camada `<div class="notes" aria-hidden="true">` com `<svg>` para as linhas), `src/styles/main.css`, `src/main.js`, `src/scene/world.js` (`projectPoint([x,y,z]) → { x, y, visible }` em px CSS)

**Interfaces:**
- Produz:
  - `noteOpacity(hour, projectHour) = 1 − smoothstep((|Δ| − 0.35) / 0.25)`.
  - `screenFromNdc([x, y, z], width, height) → { x, y, visible }`, com `visible = z > −1 && z < 1 && |x| ≤ 1.1 && |y| ≤ 1.1`.
  - `createAnnotations(root, { stacked }) → { update({ hour, projects, notePosition, layerAnchors, explode, projectPoint, stacked }) }`. Desenha apenas a obra mais próxima com opacidade > 0. No desktop: ponto, linha e etiqueta em Architects Daughter, com o número em Doto e o texto clonado do `<li data-note>`. No layout empilhado: só pinos numerados.
- CSS: `.project__notes` visualmente oculta (padrão sr-only) fora do layout empilhado, e lista numerada visível dentro da ficha no layout empilhado.

- [ ] **Passo 1: teste que falha**

```js
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { assertClose } from '../helpers.js';
import { noteOpacity, screenFromNdc } from '../../src/ui/annotations.js';

describe('anotações', () => {
  it('opacidade: cheia na parada, some no voo', () => {
    assert.equal(noteOpacity(10, 10), 1);
    assert.equal(noteOpacity(10.35, 10), 1);
    assertClose(noteOpacity(10.475, 10), 0.5);
    assert.equal(noteOpacity(10.6, 10), 0);
    assert.equal(noteOpacity(9.2, 10), 0);
  });
  it('NDC → tela; atrás da câmera ou fora da tela não aparece', () => {
    assert.deepEqual(screenFromNdc([0, 0, 0.5], 800, 600), { x: 400, y: 300, visible: true });
    assert.deepEqual(screenFromNdc([1, 1, 0.5], 800, 600), { x: 800, y: 0, visible: true });
    assert.equal(screenFromNdc([0, 0, 1.2], 800, 600).visible, false);
    assert.equal(screenFromNdc([2, 0, 0.5], 800, 600).visible, false);
  });
});
```

- [ ] **Passo 2:** `node --test tests/ui/annotations.test.js`. Esperado: FALHA.
- [ ] **Passo 3:** implementar e ligar no loop. Ordem dentro do quadro: primeiro todas as leituras (posições e retângulos), depois as escritas no DOM.
- [ ] **Passo 4:** `npm test`. Esperado: todos passam.
- [ ] **Passo 5:** navegador em desktop e celular, na parada de cada obra. Esperado:
  - desktop: as 6 etiquetas acompanham a obra;
  - celular: pinos numerados e lista na ficha;
  - no voo entre obras não há etiquetas;
  - console sem erros.
- [ ] **Passo 6:** commit `feat(obras): anotações técnicas presas ao 3D`.

### Task 7: Botão "Explodir camadas" e rótulos de camada

**Arquivos:**
- Modificar: `index.html` (botão em cada ficha), `src/styles/main.css`, `src/main.js`, `src/ui/annotations.js` (rótulos de camada)

**Interfaces:**
- Consome: `explodeTarget`, `damp`, `createBuildings().setExplode`, `layerAnchors`.
- `state.explode = { [id]: { pressed: boolean, value: number } }`. Ao clicar, `pressed` alterna e `aria-pressed` é atualizado. A cada quadro: alvo `explodeTarget(...)`, depois `damp` (fator 0,08) e então `world.setExplode`. Quando o alvo cai para 0 por distância, `pressed` volta a `false` e o `aria-pressed` também.
- Rótulos de camada aparecem quando `value > 0.3`.

- [ ] **Passo 1:** implementar.
- [ ] **Passo 2:** `npm test`. Esperado: todos passam.
- [ ] **Passo 3:** navegador na Casa Varanda. Esperado:
  - o botão explode e mostra os rótulos das camadas;
  - rolar até a próxima obra fecha a explosão e devolve `aria-pressed="false"`;
  - no layout empilhado o botão continua acessível;
  - console sem erros.
- [ ] **Passo 4:** commit `feat(obras): vista explodida por camadas`.

### Task 8: Parada com órbita e halftone só nos voos

**Arquivos:**
- Criar: `src/time/halftone.js`, `tests/time/halftone.test.js`
- Modificar: `src/scene/camera-path.js`, `tests/scene/camera-path.test.js`, `src/main.js`, `src/styles/main.css` (`.project { min-height: 200vh }`, `.hour-mark--project { top: 100vh }`)

**Interfaces:**
- Produz:
  - `buildCameraKeyframes(projects)`: dois keyframes por obra, em `hour ∓ 0.5`, com `position` e `target` girados em torno de `center` por ∓`orbit`/2 (em graus, padrão 16). O `center` é mantido.
  - `halftoneTarget(hour, projectHours) = 8.75 ≤ hour ≤ 16.75 && todas as |hour − h| > 0.5 ? 1 : 0`.

- [ ] **Passo 1: testes que falham**

Substituir em `camera-path.test.js` o teste "soma origin do projeto e ordena por hora" por:

```js
it('dois keyframes por obra (parada com órbita) em torno do centro', () => {
  const k = buildCameraKeyframes([{ id: 'x', hour: 10, origin: [100, -50],
    camera: { position: [0, 2, 20], target: [0, 1, 0], center: [0, 1, 0], orbit: 16 } }]);
  const a = k.find((f) => f.hour === 9.5), b = k.find((f) => f.hour === 10.5);
  assert.ok(a && b);
  const dist = (f) => Math.hypot(f.position[0] - 100, f.position[2] + 50);
  assertClose(dist(a), 20, 6);
  assertClose(dist(b), 20, 6);
  assert.notDeepEqual(a.position, b.position);
  assert.deepEqual(a.center, [100, 1, -50]);
  assert.deepEqual(k.map((f) => f.hour), [...k.map((f) => f.hour)].sort((m, n) => m - n));
});
```

E criar:

```js
// tests/time/halftone.test.js
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { halftoneTarget } from '../../src/time/halftone.js';

const H = [10, 12, 14, 16];
describe('halftone só nos voos', () => {
  it('liga entre as obras', () => {
    for (const h of [9, 11, 13, 15]) assert.equal(halftoneTarget(h, H), 1);
  });
  it('desliga nas paradas e fora dos projetos', () => {
    for (const h of [8, 8.5, 10, 10.4, 12.5, 16, 16.9, 17.5]) assert.equal(halftoneTarget(h, H), 0);
  });
});
```

- [ ] **Passo 2:** `npm test`. Esperado: FALHA nos testes novos.
- [ ] **Passo 3:** implementar e trocar a regra antiga em `main.js` por `halftoneTarget`.
- [ ] **Passo 4:** `npm test`. Esperado: todos passam.
- [ ] **Passo 5:** navegador. Esperado:
  - na parada da obra, a câmera gira devagar e a cena fica nítida;
  - entre obras, voo em halftone com lente;
  - as horas nas âncoras continuam exatas (10:00, 12:00, 14:00, 16:00).
- [ ] **Passo 6:** commit `feat(câmera): parada com órbita e halftone nos voos`.

### Task 9: Tipografia viva

**Arquivos:**
- Criar: `src/ui/typography.js`, `tests/ui/typography.test.js`
- Modificar: `index.html` (link de fontes e título "Meridiana" com uma letra por `<span>`), `src/styles/main.css`, `src/main.js`

**Interfaces:**
- Produz:
  - `titleAxes(altitude) → { wght, wdth }` (spec §5).
  - `longShadow({ altitude, azimuth }, layers = 14) → string`.
  - `letterWeight(i, n, { azimuth }, base) → number`.
  - `createTypography(root) → { update(sun) }`, que escreve as variáveis `--title-wght`, `--title-wdth` e `--title-shadow` no `:root` só quando mudam o suficiente (peso ±10, sombra a cada 0,5 px) e os pesos das letras do título.
- Fontes: `family=Bricolage+Grotesque:opsz,wdth,wght@12..96,75..100,200..800&family=Architects+Daughter`, mais as atuais. Os títulos usam `font-variation-settings: 'wght' var(--title-wght), 'wdth' var(--title-wdth)`, com fallback `system-ui, sans-serif`.

- [ ] **Passo 1: teste que falha**

```js
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { assertClose } from '../helpers.js';
import { titleAxes, longShadow, letterWeight } from '../../src/ui/typography.js';

describe('tipografia viva', () => {
  it('eixos pelo sol', () => {
    assert.deepEqual(titleAxes(70), { wght: 800, wdth: 100 });
    assert.equal(titleAxes(0).wght, 250);
    assertClose(titleAxes(0).wdth, 87.5);
    assert.deepEqual(titleAxes(-10), { wght: 250, wdth: 75 });
  });
  it('sombra longa oposta ao sol; nenhuma à noite', () => {
    assert.equal(longShadow({ altitude: -5, azimuth: 0 }), 'none');
    const s = longShadow({ altitude: 30, azimuth: 90 }); // sol a leste → sombra para a esquerda
    const layers = s.split('),').length;
    assert.equal(layers, 14);
    assert.ok(parseFloat(s) < 0, 'primeira camada com dx negativo');
  });
  it('letras do lado do sol mais pesadas', () => {
    const sun = { azimuth: 90 };
    assert.ok(letterWeight(8, 9, sun, 500) > letterWeight(0, 9, sun, 500));
    assert.equal(letterWeight(4, 9, sun, 500), 500);
    assert.equal(letterWeight(8, 9, { azimuth: 90 }, 790), 800); // trava no máximo do eixo
  });
});
```

- [ ] **Passo 2:** `node --test tests/ui/typography.test.js`. Esperado: FALHA.
- [ ] **Passo 3:** implementar. Os títulos em Bricolage são os listados na spec §5. Manter os tamanhos atuais e ajustar só o que quebrar.
- [ ] **Passo 4:** `npm test`. Esperado: todos passam.
- [ ] **Passo 5:** navegador às 06:00, 12:00, 17:30 e 20:00. Esperado:
  - o peso dos títulos muda com a hora;
  - a sombra longa gira e some à noite;
  - em "Meridiana", as letras do lado do sol ficam mais grossas;
  - as fontes carregam (checar `document.fonts.check('16px "Bricolage Grotesque"')`).
- [ ] **Passo 6:** commit `feat(tipografia): títulos que reagem à luz`.

### Task 10: Planta de situação

**Arquivos:**
- Criar: `src/ui/siteplan.js`, `tests/ui/siteplan.test.js`
- Modificar: `index.html` (`<figure class="siteplan" aria-hidden="true">`), `src/styles/main.css` (fixa no canto inferior direito, oculta no layout empilhado), `src/main.js`, `src/scene/world.js` (`cameraState() → { x, z, dirX, dirZ }`)

**Interfaces:**
- Produz:
  - `toPlan(x, z) → [px, py]`, com 1 px = 4 m e centro da área (22, 0) em (90, 90).
  - `createSitePlan(figure, city, projects) → { update({ camera, sunAzimuth }) }`.

- [ ] **Passo 1: teste que falha**

```js
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { toPlan } from '../../src/ui/siteplan.js';

describe('planta de situação', () => {
  it('1 px = 4 m, centro da cidade no centro do SVG, norte para cima', () => {
    assert.deepEqual(toPlan(22, 0), [90, 90]);
    assert.deepEqual(toPlan(62, 0), [100, 90]);
    assert.deepEqual(toPlan(22, -40), [90, 80]);
  });
});
```

- [ ] **Passo 2:** `node --test tests/ui/siteplan.test.js`. Esperado: FALHA.
- [ ] **Passo 3:** implementar: quadras, avenida em latão, obras numeradas, seta do norte, escala de 100 m, câmera com cone de visão e seta do sol.
- [ ] **Passo 4:** `npm test`. Esperado: todos passam.
- [ ] **Passo 5:** navegador. Esperado: no desktop a planta acompanha a câmera e o sol; no layout empilhado ela fica oculta.
- [ ] **Passo 6:** commit `feat(ui): planta de situação`.

### Task 11: Verificação final, README e revisão

**Arquivos:**
- Modificar: `README.md` (seções nova cidade, detalhes, explosão, planta e tipografia)

- [ ] **Passo 1:** `npm test`. Esperado: todos passam.
- [ ] **Passo 2:** navegador, todos os recursos com status 200. Esperado: sem 404 e sem erros no console.
- [ ] **Passo 3:** desktop (1440 × 900) de 06:00 a 23:00. Esperado:
  - cidade, obras, anotações, explosão, planta e tipografia funcionando;
  - `renderer.info.render.calls` abaixo de 60 numa vista da cidade (Foco 4).
- [ ] **Passo 4:** tablet em pé (820 × 1180) e celular (375 × 812). Esperado: sem rolagem horizontal, pinos numerados, lista na ficha e botão de explosão acessível.
- [ ] **Passo 5:** bloquear `fonts.googleapis.com` com interceptação no navegador, ou simular removendo o `<link>`. Esperado: layout legível com as fontes de fallback (Foco 5).
- [ ] **Passo 6:** atualizar o README e fazer o commit `docs: README da fase 2`.
- [ ] **Passo 7:** revisão final de todo o intervalo por um revisor independente, seguida de uma única rodada de correções com TDD para os achados críticos e importantes.
