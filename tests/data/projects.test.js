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
