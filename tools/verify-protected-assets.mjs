import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const root=new URL('../',import.meta.url);
const manifest=JSON.parse(await readFile(new URL('docs/mamoken-next/BASELINE_ASSETS.json',root),'utf8'));
let checked=0;
for(const [path,expected] of Object.entries(manifest.preserveOriginalAssets)){
 const data=await readFile(new URL(path,root));
 const actual=createHash('sha1').update('blob '+data.length+'\0').update(data).digest('hex');
 if(actual!==expected)throw new Error('Protected source asset changed: '+path);
 checked++;
}
console.log(JSON.stringify({baseline:manifest.baseline,originalAssetsVerified:checked}));
