import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, '..');
const entryPath = path.join(repoRoot, 'wiki', 'index.html');
const manifestPath = path.join(repoRoot, 'wiki', 'WIKI_ENTRY_MANIFEST.json');

const bytes = fs.readFileSync(entryPath);
const html = bytes.toString('utf8');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const sha256 = crypto.createHash('sha256').update(bytes).digest('hex');

assert.equal(bytes.length, manifest.bytes, 'wiki/index.html byte length mismatch');
assert.equal(sha256, manifest.sha256, 'wiki/index.html SHA-256 mismatch');
assert.match(html, /^<!doctype html>/i, 'missing HTML doctype');
assert.ok(html.endsWith(manifest.expectedSuffix), 'wiki/index.html is truncated or has an unexpected suffix');
assert.match(html, /<meta name="robots" content="index,follow">/, 'public robots directive is missing');

for (const forbidden of ['DecompressionStream', 'pako', 'atob(', 'TextDecoder(', '__MAMOKEN_WIKI_RAW', '__MAMOKEN_WIKI_B64']) {
  assert.ok(!html.includes(forbidden), `obsolete loader/decompression token remains: ${forbidden}`);
}
for (const obsolete of manifest.obsoleteFilesToDelete) {
  assert.ok(!fs.existsSync(path.join(repoRoot, obsolete)), `obsolete payload file still exists: ${obsolete}`);
}

// Deliberately checks `db.characters` own-keys, not a raw substring search: a removed
// character's id string can still linger elsewhere in the HTML (e.g. DB.system's
// normal_chain_limits/dodge tables key every character id too), so `html.includes('"id"')`
// would keep passing even after the character entry itself was deleted from DB.characters.
const db = extractDbLiteral(html);
assert.ok(db.characters && Object.keys(db.characters).length > 0, 'DB.characters is empty — nothing to verify');
for (const id of manifest.requiredCharacterIds) {
  assert.ok(Object.prototype.hasOwnProperty.call(db.characters, id), `character payload missing: ${id}`);
}

const scriptStart = html.indexOf('<script>');
const scriptEnd = html.lastIndexOf('</script>');
assert.ok(scriptStart >= 0 && scriptEnd > scriptStart, 'inline Wiki script not found');
const script = html.slice(scriptStart + '<script>'.length, scriptEnd);
new Function(script); // parse-only: constructing the function does not execute it.

// Local image reference existence check. The Wiki's own per-character portrait (`asset`) and
// Ability UI (`ui_assets[].path`) references are only ever exercised at runtime in a real
// browser, which is exactly how the "piske"/"chilka" typo (wrong image, correct-looking data)
// escaped review before this recovery PR. This walks the embedded `DB` data literal statically
// and confirms every local reference actually resolves to a real file on disk.
function extractDbLiteral(source) {
  const marker = 'DB={';
  const markerIdx = source.indexOf(marker);
  assert.ok(markerIdx >= 0, 'DB={...} data literal not found in wiki/index.html');
  const start = markerIdx + 'DB='.length;
  let depth = 0, i = start, inStr = false, esc = false;
  for (; i < source.length; i++) {
    const c = source[i];
    if (inStr) {
      if (esc) esc = false;
      else if (c === '\\') esc = true;
      else if (c === '"') inStr = false;
      continue;
    }
    if (c === '"') { inStr = true; continue; }
    if (c === '{') depth++;
    else if (c === '}') { depth--; if (depth === 0) { i++; break; } }
  }
  assert.ok(depth === 0, 'DB={...} data literal is not brace-balanced (truncated?)');
  return JSON.parse(source.slice(start, i));
}

function isUrlLike(value) {
  return /^[a-z][a-z0-9+.-]*:/i.test(value) || value.startsWith('//');
}

// Resolves `relPath` under `root` and asserts it (a) isn't a URL/data-URI (those are out of
// scope — they aren't files in this repository), (b) can't escape `root` via `..`/absolute-path
// traversal, and (c) actually exists on disk as a file.
function assertLocalAssetExists(root, relPath, label) {
  assert.ok(typeof relPath === 'string' && relPath.length > 0, `${label}: empty/invalid local asset reference`);
  if (isUrlLike(relPath)) return; // external URLs / data URIs are not local-file references
  assert.ok(!path.isAbsolute(relPath), `${label}: absolute paths are not allowed: ${relPath}`);
  const resolvedRoot = path.resolve(root);
  const resolvedTarget = path.resolve(root, relPath);
  const rel = path.relative(resolvedRoot, resolvedTarget);
  assert.ok(rel !== '' && !rel.startsWith('..') && !path.isAbsolute(rel),
    `${label}: path escapes its asset root (path traversal): ${relPath}`);
  assert.ok(fs.existsSync(resolvedTarget) && fs.statSync(resolvedTarget).isFile(),
    `${label}: referenced local image does not exist: ${path.relative(repoRoot, resolvedTarget)}`);
}

assert.ok(manifest.localAssetRoots && manifest.localAssetRoots.characterPortrait && manifest.localAssetRoots.abilityUi,
  'WIKI_ENTRY_MANIFEST.json is missing localAssetRoots.characterPortrait/abilityUi');
const portraitRoot = path.join(repoRoot, manifest.localAssetRoots.characterPortrait);
const abilityUiRoot = path.join(repoRoot, manifest.localAssetRoots.abilityUi);

let portraitAssetChecks = 0;
let characterAbilityUiChecks = 0;
let commonAbilityUiChecks = 0;
for (const id of Object.keys(db.characters)) {
  const c = db.characters[id];
  const slug = c.asset || id;
  assertLocalAssetExists(portraitRoot, `${slug}.webp`, `character portrait (${id})`);
  portraitAssetChecks++;
  for (const ua of (c.ui_assets || [])) {
    assertLocalAssetExists(abilityUiRoot, ua.path, `ability UI asset (${id}: ${ua.name || ua.path})`);
    characterAbilityUiChecks++;
  }
}
for (const ua of ((db.system && db.system.common_vfx) || [])) {
  assertLocalAssetExists(abilityUiRoot, ua.path, `common ability UI asset (${ua.name || ua.path})`);
  commonAbilityUiChecks++;
}
const totalLocalAssetChecks = portraitAssetChecks + characterAbilityUiChecks + commonAbilityUiChecks;
assert.ok(totalLocalAssetChecks >= manifest.requiredCharacterIds.length,
  'fewer local asset references were checked than expected — extraction may be broken');

console.log(JSON.stringify({
  ok: true,
  entry: path.relative(repoRoot, entryPath),
  bytes: bytes.length,
  sha256,
  characters: manifest.requiredCharacterIds.length,
  portraitAssetChecks,
  characterAbilityUiChecks,
  commonAbilityUiChecks,
  totalLocalAssetChecks,
  mode: 'direct-html-no-loader',
}, null, 2));
