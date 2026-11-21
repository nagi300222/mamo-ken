import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root=path.resolve(fileURLToPath(new URL('../../../',import.meta.url)));
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.glb':'model/gltf-binary','.json':'application/json; charset=utf-8','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.svg':'image/svg+xml'};
const port=Number(process.env.PORT)||4173;
createServer(async(req,res)=>{
  try{
    let pathname=new URL(req.url,'http://localhost').pathname;
    if(pathname==='/'){res.writeHead(302,{Location:'/exp/fable-3d/dojo/'});res.end();return;}
    let file=path.resolve(root,'.'+decodeURIComponent(pathname));
    if(!file.startsWith(root+path.sep)&&file!==root){res.writeHead(403);res.end('Forbidden');return;}
    if((await stat(file)).isDirectory())file=path.join(file,'index.html');
    const body=await readFile(file);res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream','Cache-Control':'no-cache'});res.end(body);
  }catch(e){res.writeHead(404,{'Content-Type':'text/plain; charset=utf-8'});res.end('Not found: '+e.message);}
}).listen(port,'127.0.0.1',()=>console.log('マモ拳3D: http://127.0.0.1:'+port+'/exp/fable-3d/dojo/'));
