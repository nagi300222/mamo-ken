import {meshPartOptions} from '../custom/p2/part-contract.js';

// Read model only: a new body or compatibility result never clears a choice.
export function editorMeshOptions(manifest,definition,slot){
 const selected=definition.appearance.meshParts?.[slot]??'',baseId=definition.appearance.baseId;
 const legacy=definition.appearance.parts?.[slot]??'base',conflict=!['base',baseId].includes(legacy);
 const options=meshPartOptions(manifest,baseId,slot).map(option=>conflict?{...option,available:false,reason:'先に同じ部位の「形の調整」を標準に戻してください。実パーツとは同時に使えません。'}:option);
 if(selected&&!options.some(option=>option.id===selected))options.push({id:selected,label:'保存された部品 '+selected,available:false,reason:'この保存部品は現在の部品表では未対応です。別の部品には置き換えません。'});
 const chosen=options.find(option=>option.id===selected);
 return {selected,options,reason:chosen?.reason??'',unavailable:options.filter(option=>!option.available)};
}

export function applyEditorValues(original,values){
 const next=structuredClone(original);
 next.name=values.name;next.appearance.baseId=values.baseId;
 next.appearance.parts={...next.appearance.parts,...values.parts};
 next.appearance.palette={...next.appearance.palette,...values.palette};
 next.appearance.pattern=values.pattern;
 const meshParts={...next.appearance.meshParts};
 for(const [slot,donor]of Object.entries(values.meshParts??{}))if(donor)meshParts[slot]=donor;else delete meshParts[slot];
 if(Object.keys(meshParts).length)next.appearance.meshParts=meshParts;
 else if(original.appearance.meshParts!==undefined)next.appearance.meshParts={};
 next.combat.styleId=values.styleId;next.combat.specials=[...values.specials];
 return next;
}

export function selectedMoveProblems(catalog,refs){
 return refs.flatMap((ref,slot)=>{
  const move=catalog.find(move=>move.ref===ref);
  return move?.supported?[]:[{slot,ref,name:move?.name??ref??'未選択',reason:move?.reason||'装備する技を選んでください。'}];
 });
}
