// Animation packs may use one placeholder primitive while a fighter uses two.
// Bind its weights to the actual morph meshes; keep all samples untouched.
export function bindMorphTargets(clip,root){
  const tracks=[];let changed=false;
  for(const track of clip.tracks){
    const suffix='.morphTargetInfluences';
    if(!track.name.endsWith(suffix)){tracks.push(track);continue;}
    const node=root.getObjectByName(track.name.slice(0,-suffix.length));
    if(node?.morphTargetInfluences){tracks.push(track);continue;}
    const meshes=[];node?.traverse(child=>{if(child.morphTargetInfluences)meshes.push(child);});
    if(!meshes.length)throw Error('Cannot bind facial animation: '+track.name);
    for(const mesh of meshes){
      if(mesh.morphTargetInfluences.length!==track.getValueSize())throw Error('Facial target count mismatch: '+track.name);
      const bound=track.clone();bound.name=mesh.name+suffix;tracks.push(bound);
    }
    changed=true;
  }
  if(!changed)return clip;
  const bound=clip.clone();bound.tracks=tracks;return bound;
}
