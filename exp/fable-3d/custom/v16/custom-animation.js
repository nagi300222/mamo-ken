// No renderer dependency: native THREE AnimationClip/KeyframeTrack objects are
// cloned and converted, while source rigs and clips remain untouched.
const multiply=(a,b)=>{const [x,y,z,w]=a,[p,q,r,s]=b;return [w*p+x*s+y*r-z*q,w*q-x*r+y*s+z*p,w*r+x*q-y*p+z*s,w*s-x*p-y*q-z*r];};
const inverse=q=>{const d=q.reduce((sum,v)=>sum+v*v,0);return [-q[0]/d,-q[1]/d,-q[2]/d,q[3]/d];};
const normalize=q=>{const d=Math.hypot(...q);return q.map(v=>v/d);};
const vector=(node,key)=>node[key].toArray();
export function inspectClipCompatibility(clip,sourceRoot,targetRoot,{moveKind}={}) {
  const missing=[],unsupported=[],optional=[],bones=new Set();
  for(const track of clip.tracks){
    const match=/^(.+)\.(position|quaternion|scale)$/.exec(track.name);
    if(!match){unsupported.push(track.name);continue;}
    const source=sourceRoot.getObjectByName(match[1]),target=targetRoot.getObjectByName(match[1]);
    if(source?.isBone&&!target?.isBone){
      if(/^(band_|scarf_|rope_)/.test(match[1])||moveKind==='projectile'&&/^tail_0[4-6]$/.test(match[1]))optional.push(match[1]);
      else missing.push(match[1]);
    }
    if(source?.isBone&&target?.isBone)bones.add(match[1]);
  }
  return {ok:missing.length===0&&bones.size>=3,missing:[...new Set(missing)],optional:[...new Set(optional)],unsupported,boneCount:bones.size};
}
export function retargetCustomClip(clip,sourceRoot,targetRoot,{name=clip.name,moveKind}={}) {
  const compatibility=inspectClipCompatibility(clip,sourceRoot,targetRoot,{moveKind});
  if(!compatibility.ok)throw new Error('モーション互換性を確認できません: '+(compatibility.missing.join(', ')||'必要な骨が不足'));
  const result=clip.clone();result.name=name;
  result.tracks=result.tracks.flatMap(track=>{
    const match=/^(.+)\.(position|quaternion|scale)$/.exec(track.name);
    // Morph targets belong to meshes rather than the shared skeleton. They are
    // excluded instead of binding a foreign mesh's mouth/eyes to the avatar.
    if(!match)return [];
    const source=sourceRoot.getObjectByName(match[1]),target=targetRoot.getObjectByName(match[1]);
    if(!source?.isBone||!target?.isBone)return [];
    const property=match[2],a=vector(source,property),b=vector(target,property),values=track.values;
    if(property==='quaternion'){
      const correction=multiply(b,inverse(a));
      for(let i=0;i<values.length;i+=4){const q=normalize(multiply(correction,Array.from(values.slice(i,i+4))));values.set(q,i);}
    }else if(property==='position'){
      const sourceLength=Math.hypot(...a),targetLength=Math.hypot(...b);
      const ratio=sourceLength>.025?Math.max(.6,Math.min(1.6,targetLength/sourceLength)):1;
      for(let i=0;i<values.length;i++)values[i]=b[i%3]+(values[i]-a[i%3])*ratio;
    }else for(let i=0;i<values.length;i++)values[i]=a[i%3]===0?b[i%3]:b[i%3]*values[i]/a[i%3];
    return [track];
  });
  result.userData={...(result.userData??{}),customRetarget:{sourceClip:clip.name,boneCount:compatibility.boneCount,dropped:[...compatibility.unsupported,...compatibility.optional]}};
  return result;
}

// Same source contact clocks as the original authored-special player. Only the
// game clock selects a pose; hitstop must hold this exact sampled time.
export function customSpecialTime(frame,move,spec,duration) {
  const contact=spec.contactSeconds??Math.min(duration*.45,duration-.001);
  if(frame<=move.startup)return Math.max(0,contact*frame/move.startup);
  const rest=move.active+move.recovery;
  return Math.min(duration,contact+(duration-contact)*(frame-move.startup)/Math.max(1,rest));
}
