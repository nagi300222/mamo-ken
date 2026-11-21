// Node 側のローダー。リグ計算と描画は src/rig.js をそのまま使う。
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRig } from '../../src/rig.js';
import { readPNG } from '../../src/png-node.js';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
export const readJSON = (f) => JSON.parse(fs.readFileSync(f, 'utf8'));
export const CHARS = readJSON(path.join(ROOT, 'chars/index.json')).chars;

export function loadChar(id) {
  const dir = path.join(ROOT, 'chars', id);
  const rigJson = readJSON(path.join(dir, 'rig.json'));
  const palette = readJSON(path.join(dir, 'palette.json'));
  const images = {};
  for (const name of Object.keys(rigJson.parts)) images[name] = readPNG(path.join(dir, 'parts', `${name}.png`));
  const rig = createRig(rigJson, palette, images);
  const manifest = readJSON(path.join(dir, 'manifest.json'));
  const motions = {};
  for (const m of manifest.motions) {
    const f = path.join(dir, 'motions', `${m}.json`);
    if (fs.existsSync(f)) motions[m] = { name: m, ...readJSON(f) };
  }
  return { id, dir, rig, manifest, motions };
}
