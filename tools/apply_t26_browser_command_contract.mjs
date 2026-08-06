import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname=path.dirname(fileURLToPath(import.meta.url));
const ROOT=path.resolve(__dirname,'..');
const MARKER='/* T26 browser command contract */';

function replaceOnce(text,from,to,label){
  const count=text.split(from).length-1;
  if(count!==1)throw new Error(`${label}: expected exactly one match, found ${count}`);
  return text.replace(from,to);
}
function patch(relativePath,fn){
  const target=path.join(ROOT,relativePath);
  const source=readFileSync(target,'utf8');
  const updated=fn(source);
  if(updated===source){console.log(`unchanged ${relativePath}`);return;}
  writeFileSync(target,updated,'utf8');
  console.log(`patched ${relativePath}`);
}

patch('prototype/mamoken_prototype_v01.html',(source)=>{
  if(source.includes(MARKER))return source;
  const before=`  const payload={
    frame:B.f,
    player:f.side,
    characterId:f.c.id,
    trigger:trigger,
    directions:f.dirBuf.map(function(entry){return{direction:entry.dir,frame:entry.f};})
  };
  if(baseEnabled){`;
  const after=`  const payload={
    frame:B.f,
    player:f.side,
    characterId:f.c.id,
    trigger:trigger,
    directions:f.dirBuf.map(function(entry){return{direction:entry.dir,frame:entry.f};}),
    activeConditions:(f.c.id==='pisuke'&&f.clinchF>0)?['pisuke.lunge-success']:[] ${MARKER}
  };
  if(baseEnabled){`;
  return replaceOnce(source,before,after,'attach diagnostic command conditions');
});
