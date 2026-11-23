// P2 is opt-in: existing v16 appearance.parts keeps its shape-graft meaning.
export const MESH_PART_VERSION='p2-exchange-1';
export const MESH_PART_SLOTS=Object.freeze(['head','ears','hands','feet','tail','accessory']);
export const MESH_PART_DONORS=Object.freeze(['moguzo','godan','bullet']);
export const MESH_PART_MORPHS=Object.freeze(['paw_open.L','paw_open.R','blink','brow_angry']);
const names={moguzo:'モグゾー',godan:'ゴダン',bullet:'バレット'};
const fail=message=>{throw Error('実パーツ交換: '+message);};
const hash=value=>typeof value==='string'&&/^[a-f0-9]{64}$/.test(value);
export function validateMeshPartManifest(manifest){
 if(manifest?.schemaVersion!==1||manifest.version!==MESH_PART_VERSION||!Array.isArray(manifest.modules))fail('未対応の部品表です');
 const keys=new Set();
 for(const module of manifest.modules){
  const key=[module.targetBaseId,module.slot,module.donorId].join('/');
  if(keys.has(key))fail('部品の重複: '+key);keys.add(key);
  if(!MESH_PART_DONORS.includes(module.targetBaseId)||!MESH_PART_DONORS.includes(module.donorId)||!MESH_PART_SLOTS.includes(module.slot)||module.targetBaseId===module.donorId)fail('対象・提供元・部位が不正: '+key);
  if(module.slot==='tail'&&(module.donorId==='bullet'||module.targetBaseId==='bullet'))fail('長尾の異骨格交換は未承認: '+key);
  if(typeof module.id!=='string'||!/^[a-z0-9_-]+$/.test(module.id)||typeof module.file!=='string'||!/^modules\/[a-z0-9_/-]+\.glb$/.test(module.file)||module.file.includes('..'))fail('部品ファイルが不正: '+key);
  if(!Array.isArray(module.meshNames)||!module.meshNames.length||module.meshNames.some(n=>typeof n!=='string'||!n)||new Set(module.meshNames).size!==module.meshNames.length)fail('部品メッシュ名が不正: '+key);
  if(!Number.isSafeInteger(module.bytes)||module.bytes<=0||!hash(module.sha256)||module.lod!==0)fail('サイズ・ハッシュ・LOD0の指定が必要: '+key);
  if(JSON.stringify(module.morphTargets)!==JSON.stringify(MESH_PART_MORPHS)||!Array.isArray(module.jointNames)||!module.jointNames.length||new Set(module.jointNames).size!==module.jointNames.length)fail('4表情と対象骨名の指定が必要: '+key);
  if(module.seams?.kind!=='matched-host-boundary'||!Number.isFinite(module.seams.tolerance)||module.seams.tolerance<=0||module.seams.tolerance>.0001)fail('継ぎ目許容値は0超〜0.1mmまでです: '+key);
  if(!module.palette||['fur','belly','muzzle','paw','foot','ear','tail','accent'].some(k=>!/^#[a-f0-9]{6}$/i.test(module.palette[k])))fail('提供元の部位別基準色が必要: '+key);
  if(!module.socket||typeof module.socket.bone!=='string'||module.socket.space!=='host-bind-local'||!Array.isArray(module.socket.position)||module.socket.position.length!==3||module.socket.position.some(v=>!Number.isFinite(v)))fail('対象骨ソケットが不正: '+key);
  if(!module.source||typeof module.source.path!=='string'||!hash(module.source.sha256))fail('編集元とソースハッシュが必要: '+key);
 }
 return manifest;
}
export function meshPartOptions(manifest,baseId,slot){
 validateMeshPartManifest(manifest);
 if(!MESH_PART_SLOTS.includes(slot))fail('部位が不明: '+slot);
 return MESH_PART_DONORS.map(id=>{
  const module=manifest.modules.find(m=>m.targetBaseId===baseId&&m.slot===slot&&m.donorId===id);
  const own=id===baseId,available=own||Boolean(module);
  return {id,label:names[id]+(own?'（現在の部品）':'の実パーツ'),available,reason:available?'':slot==='tail'&&(id==='bullet'||baseId==='bullet')?'長尾6骨と短尾3骨の交換用アセットは未制作です':'この骨格へ適合した実パーツは未制作です',moduleId:module?.id??null};
 });
}
export function resolveMeshParts(manifest,baseId,meshParts={},legacyParts={}){
 validateMeshPartManifest(manifest);
 if(!meshParts||typeof meshParts!=='object'||Array.isArray(meshParts))fail('保存された部品指定が不正です');
 return Object.entries(meshParts).map(([slot,donorId])=>{
  if(!MESH_PART_SLOTS.includes(slot)||!MESH_PART_DONORS.includes(donorId))fail('未対応の保存部品: '+slot+'/'+donorId);
  if(legacyParts[slot]&&!['base',baseId].includes(legacyParts[slot]))fail('同じ部位の寸法変更と実交換を同時指定できません: '+slot);
  if(baseId===donorId)return null;
  const module=manifest.modules.find(m=>m.targetBaseId===baseId&&m.slot===slot&&m.donorId===donorId);
  if(!module)fail('保存された実部品を利用できません（別部品には置換しません）: '+slot+'/'+donorId);
  return module;
 }).filter(Boolean);
}
