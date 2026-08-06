import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname=path.dirname(fileURLToPath(import.meta.url));
const ROOT=path.resolve(__dirname,'..');
const MARKER='/* T24 extended command shadow hook */';

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
  let text=source;
  text=replaceOnce(
    text,
    '<script src="../runtime/character-catalog-browser.js"></script>',
    '<script src="../runtime/character-catalog-browser.js"></script>\n<script src="../runtime/runtime-extended-command-shadow-browser.js"></script>',
    'load extended shadow after character catalog',
  );
  const oldBlock=`function runtimeCommandShadowReset(){
  const api=window.__MAMOKEN_COMMAND_SHADOW__;
  if(api&&api.enabled)api.reset();
}
function runtimeCommandShadowObserve(f,c,cm){
  const api=window.__MAMOKEN_COMMAND_SHADOW__;
  if(!api||!api.enabled)return;
  try{
    const trigger=c.t==='grab'?'grab':c.lv;
    const compatible=!!cm&&(trigger==='grab'
      ?cm.move.type==='grab'
      :(cm.move.type==='atk'||cm.move.type==='stance')&&cm.move.trigger===trigger);
    const legacy=compatible
      ?{kind:'command',commandId:f.c.id+':slot-'+(cm.idx+1),slot:cm.idx+1,name:cm.move.name}
      :(trigger==='grab'
        ?{kind:'fallback',fallback:'normal-grab'}
        :{kind:'fallback',fallback:'normal-attack',level:trigger});
    api.observeTrigger({
      frame:B.f,
      player:f.side,
      characterId:f.c.id,
      trigger:trigger,
      directions:f.dirBuf.map(function(entry){return{direction:entry.dir,frame:entry.f};}),
      legacy:legacy
    });
  }catch(error){
    try{api.disable(error);}catch(ignore){}
  }
}`;
  const newBlock=`${MARKER}
function runtimeCommandShadowReset(){
  const api=window.__MAMOKEN_COMMAND_SHADOW__;
  if(api&&api.enabled)api.reset();
  const extended=window.__MAMOKEN_EXTENDED_COMMAND_SHADOW__;
  if(extended&&extended.enabled)extended.reset();
}
function runtimeCommandShadowObserve(f,c,cm){
  const api=window.__MAMOKEN_COMMAND_SHADOW__;
  const extended=window.__MAMOKEN_EXTENDED_COMMAND_SHADOW__;
  const baseEnabled=!!(api&&api.enabled),extendedEnabled=!!(extended&&extended.enabled);
  if(!baseEnabled&&!extendedEnabled)return;
  const trigger=c.t==='grab'?'grab':c.lv;
  const payload={
    frame:B.f,
    player:f.side,
    characterId:f.c.id,
    trigger:trigger,
    directions:f.dirBuf.map(function(entry){return{direction:entry.dir,frame:entry.f};})
  };
  if(baseEnabled){
    try{
      const compatible=!!cm&&(trigger==='grab'
        ?cm.move.type==='grab'
        :(cm.move.type==='atk'||cm.move.type==='stance')&&cm.move.trigger===trigger);
      const legacy=compatible
        ?{kind:'command',commandId:f.c.id+':slot-'+(cm.idx+1),slot:cm.idx+1,name:cm.move.name}
        :(trigger==='grab'
          ?{kind:'fallback',fallback:'normal-grab'}
          :{kind:'fallback',fallback:'normal-attack',level:trigger});
      api.observeTrigger({...payload,legacy:legacy});
    }catch(error){
      try{api.disable(error);}catch(ignore){}
    }
  }
  if(extendedEnabled){
    try{extended.observeTrigger(payload);}
    catch(error){try{extended.disable(error);}catch(ignore){}}
  }
}`;
  return replaceOnce(text,oldBlock,newBlock,'install extended shadow observation');
});

patch('tools/build_mobile.mjs',(source)=>{
  if(source.includes('RUNTIME_EXTENDED_SHADOW_JS'))return source;
  let text=source;
  text=replaceOnce(
    text,
    "const CHARACTER_CATALOG_BROWSER_TAG = '<script src=\"../runtime/character-catalog-browser.js\"></script>';",
    "const CHARACTER_CATALOG_BROWSER_TAG = '<script src=\"../runtime/character-catalog-browser.js\"></script>';\nconst RUNTIME_EXTENDED_SHADOW_JS = path.join(ROOT, 'runtime', 'runtime-extended-command-shadow-browser.js');\nconst RUNTIME_EXTENDED_SHADOW_TAG = '<script src=\"../runtime/runtime-extended-command-shadow-browser.js\"></script>';",
    'extended shadow build constants',
  );
  text=replaceOnce(
    text,
    '  const characterCatalogBrowserSource = readFileSync(CHARACTER_CATALOG_BROWSER_JS, \'utf8\');',
    "  const characterCatalogBrowserSource = readFileSync(CHARACTER_CATALOG_BROWSER_JS, 'utf8');\n  const runtimeExtendedShadowSource = readFileSync(RUNTIME_EXTENDED_SHADOW_JS, 'utf8');",
    'read extended shadow source',
  );
  const anchor="  out = out.replace(CHARACTER_CATALOG_BROWSER_TAG, `<script>\\n${characterCatalogBrowserSource}\\n</script>`);";
  const replacement=`${anchor}

  if (!out.includes(RUNTIME_EXTENDED_SHADOW_TAG)) {
    throw new Error(\`アンカー行が見つかりません: \${JSON.stringify(RUNTIME_EXTENDED_SHADOW_TAG)} (extended command shadow hookが未適用の可能性があります)\`);
  }
  out = out.replace(RUNTIME_EXTENDED_SHADOW_TAG, \`<script>\\n\${runtimeExtendedShadowSource}\\n</script>\`);`;
  return replaceOnce(text,anchor,replacement,'inline extended shadow');
});
