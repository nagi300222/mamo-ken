// Keep animation samples byte-for-byte; omit authoring meshes, skins and images.
export function animationBundle(bytes, names) {
  const jsonLength=bytes.readUInt32LE(12);
  const doc=JSON.parse(bytes.toString('utf8',20,20+jsonLength));
  const bin=bytes.subarray(20+jsonLength+8);
  const animations=doc.animations.filter(a=>names.has(a.name));
  if(animations.length!==names.size)throw Error('Missing requested animation');
  const indices=[...new Set(animations.flatMap(a=>a.samplers.flatMap(s=>[s.input,s.output])))];
  const views=new Map(), chunks=[];let length=0;
  const copyView=index=>{
    if(views.has(index))return views.get(index);
    const view=doc.bufferViews[index];
    if(view.buffer!==0)throw Error('Expected embedded animation buffer');
    const offset=length, chunk=bin.subarray(view.byteOffset??0,(view.byteOffset??0)+view.byteLength);
    chunks.push(chunk,Buffer.alloc((4-chunk.length%4)%4));length+=chunk.length+(4-chunk.length%4)%4;
    const result={...view,buffer:0,byteOffset:offset};delete result.target;
    views.set(index,{index:views.size,view:result});return views.get(index);
  };
  const accessors=indices.map(i=>{
    const a=doc.accessors[i];if(a.sparse)throw Error('Sparse animation accessors need explicit support');
    return {...a,bufferView:copyView(a.bufferView).index};
  });
  const remap=new Map(indices.map((old,i)=>[old,i]));
  const nodes=doc.nodes.map(n=>{const out={...n};delete out.mesh;delete out.skin;delete out.camera;delete out.extensions;return out;});
  // GLTFLoader only creates weights tracks when their node has morph targets.
  // An invisible zero-area triangle preserves track names without the model.
  const meshes=[],morphNodes=new Set(animations.flatMap(a=>a.channels.filter(c=>c.target.path==='weights').map(c=>c.target.node)));
  if(morphNodes.size){
    const zeroIndex=accessors.length;
    accessors.push({bufferView:views.size,componentType:5126,count:3,type:'VEC3',min:[0,0,0],max:[0,0,0]});
    views.set('morph-stub',{index:views.size,view:{buffer:0,byteOffset:length,byteLength:36}});
    chunks.push(Buffer.alloc(36));length+=36;
    for(const index of morphNodes){
      const original=doc.meshes[doc.nodes[index].mesh],count=original.primitives[0].targets.length;
      nodes[index].mesh=meshes.length;
      meshes.push({name:original.name,extras:original.extras,weights:Array(count).fill(0),primitives:[{attributes:{POSITION:zeroIndex},targets:Array.from({length:count},()=>({POSITION:zeroIndex})),mode:4}]});
    }
  }
  const output={asset:doc.asset,scene:doc.scene??0,scenes:doc.scenes,
    nodes,meshes,
    animations:animations.map(a=>({...a,samplers:a.samplers.map(s=>({...s,input:remap.get(s.input),output:remap.get(s.output)}))})),
    accessors,bufferViews:[...views.values()].map(x=>x.view),buffers:[{byteLength:length}]};
  const j=Buffer.from(JSON.stringify(output));const padded=Buffer.concat([j,Buffer.alloc((4-j.length%4)%4,32)]);
  const header=Buffer.alloc(20);header.write('glTF');header.writeUInt32LE(2,4);header.writeUInt32LE(28+padded.length+length,8);header.writeUInt32LE(padded.length,12);header.write('JSON',16);
  const bh=Buffer.alloc(8);bh.writeUInt32LE(length,0);bh.write('BIN\0',4);
  return Buffer.concat([header,padded,bh,...chunks]);
}
