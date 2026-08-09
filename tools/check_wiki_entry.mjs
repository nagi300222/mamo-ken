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
for (const id of manifest.requiredCharacterIds) {
  assert.ok(html.includes(`"${id}"`), `character payload missing: ${id}`);
}

const scriptStart = html.indexOf('<script>');
const scriptEnd = html.lastIndexOf('</script>');
assert.ok(scriptStart >= 0 && scriptEnd > scriptStart, 'inline Wiki script not found');
const script = html.slice(scriptStart + '<script>'.length, scriptEnd);
new Function(script); // parse-only: constructing the function does not execute it.

console.log(JSON.stringify({
  ok: true,
  entry: path.relative(repoRoot, entryPath),
  bytes: bytes.length,
  sha256,
  characters: manifest.requiredCharacterIds.length,
  mode: 'direct-html-no-loader',
}, null, 2));
