// Adapter for the Claude-authored source art. External SVG documents do not
// inherit a parent's CSS custom properties/currentColor, so runtime images get
// explicit palette values. Authored SVG sources remain unchanged/versioned.
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const source=new URL('../ui-art/v17/',import.meta.url),output=new URL('./art/v17/',import.meta.url);
const manifest=JSON.parse(await readFile(new URL('manifest.json',source),'utf8'));
const tokens=JSON.parse(await readFile(new URL('tokens.json',source),'utf8'));
await mkdir(output,{recursive:true});
const assets={};
const fixed=(svg,overrides={})=>svg.replace(/var\((--mk-[\w-]+),\s*([^\)]+)\)/g,(_all,key,fallback)=>overrides[key]??fallback).replace(/\bcurrentColor\b/g,overrides.currentColor??tokens.colors.text);
async function asset(id,entry,overrides={}){
 const original=await readFile(new URL(entry.file,source),'utf8');
 const stretch=['surface','hud'].includes(entry.group);
 const data=stretch?fixed(original,overrides).replace('<svg ','<svg preserveAspectRatio="none" '):fixed(original,overrides),file=id+'.svg';
 await writeFile(new URL(file,output),data);
 assets[id]={file,sourceId:entry.id,sourceFile:entry.file,sourceSHA256:createHash('sha256').update(original).digest('hex'),sha256:createHash('sha256').update(data).digest('hex'),palette:'fixed external SVG',aspect:stretch?'stretch surface':'preserve icon',overrides,...(entry.character?{character:entry.character,displayName:entry.displayName}:{}),...(entry.mode?{mode:entry.mode}:{})};
}
for(const entry of manifest.assets)await asset(entry.id,entry);
const entry=id=>manifest.assets.find(a=>a.id===id);
await asset('mode-journey-paper',entry('mode-journey'),{'--mk-text':tokens.colors.bg,'--mk-action':tokens.colors.woodDark,'--mk-panel':tokens.colors.paper,'--mk-bg':tokens.colors.paper});
await asset('fist-mark-ink',entry('fist-mark'),{currentColor:tokens.colors.bg});
await asset('hud-timer-dark',entry('hud-timer'),{'--mk-wood':'#294235','--mk-wood-dark':'#142B20'});
await asset('wood-tag-dark',entry('wood-tag'),{'--mk-wood':'#294235','--mk-wood-dark':'#10251C','--mk-wood-light':'#3E5A45'});
const buttons={weak:['#6FD0A0','#284B38'],heavy:['#D7B18C','#6A452E'],throw:['#9DBDC0','#314D56'],gyuiin:['#B5CC89','#3D5532'],special:['#BAACD5','#433A63'],ultimate:['#F1C66C','#594622']};
for(const [kind,[stroke,fill]]of Object.entries(buttons))await asset('button-'+kind,entry('button-plate'),{'--mk-button':stroke,'--mk-panel':fill});
const provenance={version:manifest.version,sourcePR:'https://github.com/nagi300222/mamo-ken/pull/218',sourceCommit:'0ce87219762134d4d9adb8f3785aa4894e777343',generator:'shared-ui/build-p4-art.mjs',note:'Palette-resolved derivatives of Claude original art. Sources retained in ui-art/v17. No gameplay/model changes.',assets};
await writeFile(new URL('manifest.json',output),JSON.stringify(provenance,null,2)+'\n');
await writeFile(new URL('assets.css',output),':root{\n'+Object.keys(assets).map(id=>` --p4-art-${id}:url("./${assets[id].file}");`).join('\n')+'\n}\n');
await writeFile(new URL('./p4-art-map.js',import.meta.url),`// Generated from Claude's versioned art manifest; do not hand-edit.\nexport const UI_ART_VERSION=${JSON.stringify(manifest.version)};\nexport const UI_ART=Object.freeze(${JSON.stringify(assets,null,1)});\nexport const uiArtUrl=id=>{const asset=UI_ART[id];if(!asset)throw Error('Unknown UI art: '+id);return new URL('./art/v17/'+asset.file,import.meta.url).href;};\nexport function markUIArt(){document.documentElement.dataset.uiArt=UI_ART_VERSION;}\n`);
console.log('P4 Claude UI art:',manifest.assets.length,'source SVG,',Object.keys(assets).length,'explicit-palette runtime assets');
