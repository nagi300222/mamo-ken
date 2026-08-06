import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const TARGET=path.join(ROOT,'prototype','mamoken_prototype_v01.html');
const MARKER='/* T29 visual audit fixes */';

function replaceOnce(text,from,to,label){
  const count=text.split(from).length-1;
  if(count!==1)throw new Error(`${label}: expected one match, found ${count}`);
  return text.replace(from,to);
}

let source=readFileSync(TARGET,'utf8');
if(source.includes(MARKER)){
  console.log('unchanged prototype/mamoken_prototype_v01.html');
  process.exit(0);
}
source=replaceOnce(
  source,
  "function rCharacterDetail(){\n  const selected=ROSTER[selCharIdx],c=selectedCharacterDetail();",
  `${MARKER}\nfunction rCharacterDetail(){\n  const selected=ROSTER[selCharIdx],c=selectedCharacterDetail();`,
  'visual audit marker',
);
source=replaceOnce(source,"  txt(c.name,W/2,34,30,'#fff');txt(c.styleJa+' / '+c.speciesJa,W/2,67,14,'#ffd23f');","  txt(c.nameJa,W/2,34,30,'#fff');txt(c.styleJa+' / '+c.speciesJa,W/2,67,14,'#ffd23f');",'character detail Japanese name');
source=replaceOnce(source,"  detailCard(26,y,414,190,'#7fd8ff');txt('表示性能',44,y+24,16,'#7fd8ff','left');","  detailCard(26,y,414,218,'#7fd8ff');txt('表示性能',44,y+24,16,'#7fd8ff','left');",'performance card height');
source=replaceOnce(source,"  txt('総合難度',48,y+174,14,'#aab3c8','left');txt(stars,150,y+174,19,'#ffd23f','left');y+=202;","  txt('総合難度',48,y+198,14,'#aab3c8','left');txt(stars,150,y+198,19,'#ffd23f','left');y+=230;",'difficulty row spacing');
writeFileSync(TARGET,source,'utf8');
console.log('patched prototype/mamoken_prototype_v01.html');
