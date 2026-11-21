// 作業用: rig.json を JS 式で書き換える。 node tools/lib/patch.mjs <char> '<js: r を書き換える>'
import fs from 'node:fs';
import { formatRig } from './paint.mjs';
const [id, code] = process.argv.slice(2);
const f = new URL(`../../chars/${id}/rig.json`, import.meta.url);
const r = JSON.parse(fs.readFileSync(f, 'utf8'));
new Function('r', code)(r);
fs.writeFileSync(f, formatRig(r));
