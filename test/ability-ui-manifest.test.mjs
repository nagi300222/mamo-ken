import assert from 'node:assert/strict';
import { existsSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildAbilityUiManifest } from '../tools/build_ability_ui_manifest.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const { manifest, verifiedAssetCount } = buildAbilityUiManifest();

assert.equal(manifest.root, 'assets/art/ability_ui');
assert.equal(manifest.presentationOnly, true, 'vNext: VFX/UI must be declared presentation-only');
assert.equal(manifest.runtimeNumbersAndText, true);
assert.equal(verifiedAssetCount, 47, 'ICON 8 + GAUGE 17 + VFX 22 = 47 curated assets');

const expectedCharacters = ['moguzo', 'pisuke', 'godan', 'hakuma', 'chirka', 'takimaru', 'yomikage', 'bullet', 'dark_moguzo'];
assert.deepEqual(Object.keys(manifest.characters).sort(), [...expectedCharacters].sort());
assert.ok(manifest.common.unblockable && manifest.common.armor_normal && manifest.common.armor_hyper);

// Every referenced path resolves under the declared root, is a real non-empty file, and
// nothing from ORIGINAL_SHEETS/UNUSED leaked in (curated-only per ABILITY_UI_HANDOFF.md).
function walkPaths(node, found) {
  if (!node || typeof node !== 'object') return;
  for (const value of Object.values(node)) {
    if (typeof value === 'string' && value.endsWith('.png')) {
      found.push(value);
    } else if (value && typeof value === 'object') {
      walkPaths(value, found);
    }
  }
}
const relPaths = [];
walkPaths(manifest.characters, relPaths);
walkPaths(manifest.common, relPaths);
// Two references are intentionally shared, not duplicated files: Chilka's
// delayed_unblockable and Bullet's unblockable both point at the one common
// VFX-01 telegraph (ABILITY_UI_HANDOFF.md / SOURCE_CURATION_NOTES.md).
assert.equal(new Set(relPaths).size, 47, 'unique referenced asset paths');
assert.equal(relPaths.length, 49, 'total references, including the 2 intentionally-shared common VFX reuses');
for (const relPath of new Set(relPaths)) {
  assert.ok(relPath.startsWith('icon/') || relPath.startsWith('gauge/') || relPath.startsWith('vfx/'), relPath);
  const abs = path.join(ROOT, manifest.root, relPath);
  assert.equal(existsSync(abs), true, `missing: ${relPath}`);
  assert.ok(statSync(abs).size > 0, `empty: ${relPath}`);
  assert.equal(relPath.toUpperCase().includes('UNUSED'), false, relPath);
}

const generated = readFileSync(path.join(ROOT, 'runtime', 'ability-ui-manifest-browser.js'), 'utf8');
assert.ok(generated.includes('globalThis.MAMOKEN_ABILITY_UI_MANIFEST='));
assert.equal(JSON.parse(generated.match(/globalThis\.MAMOKEN_ABILITY_UI_MANIFEST=(.*);/)[1]).root, manifest.root);

console.log(`ability UI manifest tests passed; verifiedAssetCount=${verifiedAssetCount}`);
