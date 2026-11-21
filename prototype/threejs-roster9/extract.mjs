// Read only the checked-in legacy data literals at installation time. The browser
// never starts the old game or downloads the full production art manifest.
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import vm from 'node:vm';
import { FULL_ROSTER } from '../../src/core/roster-full.ts';

const read = (path) => readFile(new URL(path, import.meta.url), 'utf8');
const source = await read('../mamoken_prototype_v01.html');
function literal(regex) {
  const match = source.match(regex);
  if (!match) throw new Error('Legacy data layout has changed: ' + regex);
  return vm.runInNewContext('(' + match[1] + ')', {}, { timeout: 1000 });
}
const normals = literal(/const BAL_R1_CHARS=(\{[\s\S]*?\n\});/);
const commands = literal(/\n    moves:(\{\s*\/\/ vNext PR3[\s\S]*?\n    \})/);
const art = JSON.parse(await read('../../data/art/runtime_art_manifest.json'));
await mkdir(new URL('generated/', import.meta.url), { recursive: true });
const roster = {};
for (const fighter of FULL_ROSTER) {
  const { id, nameJa, styleJa, ultimateJa, selectionAssetPath } = fighter;
  if (commands[id].length !== 7) throw Error('Missing moves for ' + id);
  roster[id] = {
    id,
    nameJa,
    styleJa,
    ultimateJa,
    selectionAssetPath,
    ...normals[id],
    commands: commands[id],
  };
  const frames = {};
  const { poses, actions } = art.characters[id];
  function pack(frame) {
    const { width, height, offset, battleScale, presentationScale, variants } = frame;
    return {
      width,
      height,
      offset,
      scale: battleScale * presentationScale,
      p1: variants.p1.path,
      p2: variants.p2.path,
    };
  }
  for (const [key, pose] of Object.entries(poses)) frames[key] = [pack(pose)];
  for (const [key, action] of Object.entries(actions)) frames[key] = action.frames.map(pack);
  await writeFile(new URL('generated/' + id + '.json', import.meta.url), JSON.stringify(frames));
}
await writeFile(
  new URL('generated/roster.js', import.meta.url),
  'export default ' + JSON.stringify(roster) + ';\n',
);
