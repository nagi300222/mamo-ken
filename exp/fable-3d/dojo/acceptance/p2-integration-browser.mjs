// Mount the actual Pages output at its deployed origin root. Source-tree tests
// alone cannot prove that the exported app includes the new physical modules.
import http from 'node:http';
import {readFile,stat,mkdir,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const site=path.resolve(fileURLToPath(new URL('../../_pages/',import.meta.url)));
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.glb':'model/gltf-binary','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.wav':'audio/wav','.mp4':'video/mp4'};
const requests=[],server=http.createServer(async(req,res)=>{
 try{
  const route=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  let file=path.resolve(site,'.'+route);
  if(file!==site&&!file.startsWith(site+path.sep)){res.writeHead(403).end();return;}
  if((await stat(file)).isDirectory())file=path.join(file,'index.html');
  const body=await readFile(file);requests.push({route,status:200,bytes:body.length});
  res.writeHead(200,{'content-type':mime[path.extname(file)]??'application/octet-stream','cache-control':'no-store'}).end(body);
 }catch(error){requests.push({route:req.url,status:404});res.writeHead(404).end('Missing built asset');}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const root='http://127.0.0.1:'+server.address().port+'/';
process.env.MAMOKEN_P2_ASSET_URL=root+'custom/p2/';
process.env.MAMOKEN_STORY_URL=root+'story/';
process.env.MAMOKEN_REQUIRE_P2_FULL='1';
try{
 await import('../../custom/p2/tools/verify-part-browser.mjs');
 await import('../../story/p2-editor-browser.mjs');
 await import('../../custom/v16/p2-melee-browser.mjs');
}finally{
 const output=process.env.MAMOKEN_EVIDENCE??'/tmp/mamoken-p2-runtime';
 await mkdir(output,{recursive:true});
 await writeFile(path.join(output,'built-pages-requests.json'),JSON.stringify({root,scope:'Actual exported Pages application, not the source-tree mount; no physical-device claim',requests},null,2));
 await new Promise(resolve=>server.close(resolve));
}
