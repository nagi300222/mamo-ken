// パーツ画像を描き直す: node tools/paint.mjs [charId...]
// 注意: chars/<id>/parts/*.png を上書きする。PNG を直接手で直した場合は、このスクリプトを再実行しないこと。
import path from 'node:path';
import { ROOT, CHARS } from './lib/load.mjs';
import { savePartSet } from './lib/paint.mjs';

const ids = process.argv.slice(2).length ? process.argv.slice(2) : CHARS;
for (const id of ids) {
  const mod = await import(`./paint/${id}.mjs`);
  const n = savePartSet(path.join(ROOT, 'chars', id), mod.paint());
  console.log(`${id}: ${n} パーツを書き出しました`);
}
