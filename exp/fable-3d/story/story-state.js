// Small, deterministic village state. No Battle or renderer state is persisted.
export const STORY_VERSION=1;
export const SAVE_KEY='mamoken.story.v16.1';
export const WORLD=Object.freeze({minX:-5.8,maxX:5.8,minZ:-5.8,maxZ:5.8,speed:1.65,radius:.22});
export const BUILDINGS=Object.freeze([
 {x:-4,z:-3,w:2,d:1.7,name:'山の道場'}, {x:3.6,z:-3.8,w:2.2,d:1.6,name:'旅人の宿'},
 {x:-4,z:3.1,w:2,d:1.7,name:'染物の工房'}, {x:4,z:3,w:1.8,d:1.8,name:'集会所'}
]);
export const NPCS=Object.freeze([
 ['moguzo',0,-2.4,'一緒に稽古してみよう。自分の間合いを探すんだ。'],
 ['pisuke',2,-1.7,'動きやすい体になった？ 速さ比べ、してみよう！'],
 ['godan',-2,-1.7,'大事なのは踏み込みだ。拳を交わせばわかる。'],
 ['hakuma',-2.6,0,'雪山への旅は、ここで身につけた守りが頼りになる。'],
 ['chirka',2.6,0,'その模様、かわいいね。どっちが本物か、見抜けるかな？'],
 ['takimaru',-2.2,1.7,'近づいてきたな！ 一勝負、付き合ってくれ。'],
 ['yomikage',2.2,1.7,'……静かに。構えを見せてくれ。'],
 ['bullet',0,2.8,'新しい木の実を見つけたんだ。試してみてもいい？'],
 ['dark_moguzo',0,-4.6,'……その拳、どこまで届く。']
].map(([id,x,z,line])=>Object.freeze({id,x,z,line,kind:'roster'})));
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
export function freshProgress(seed=2401123){return {version:STORY_VERSION,seed:seed>>>0,position:{x:0,z:0},heading:Math.PI,encounters:{},battles:0,wins:0,lastResult:null};}
export function validateProgress(raw){
 if(raw?.version!==STORY_VERSION||!Number.isSafeInteger(raw.seed)||raw.seed<0||raw.seed>0xffffffff)throw Error('保存データの形式が異なります');
 if(!Number.isFinite(raw.position?.x)||!Number.isFinite(raw.position?.z)||!Number.isFinite(raw.heading))throw Error('保存位置を読み込めません');
 if(!Number.isSafeInteger(raw.battles)||raw.battles<0||!Number.isSafeInteger(raw.wins)||raw.wins<0||raw.wins>raw.battles)throw Error('戦績の形式が異なります');
 const encounters={};
 for(const [id,e] of Object.entries(raw.encounters??{})){
  if(!/^(moguzo|pisuke|godan|hakuma|chirka|takimaru|yomikage|bullet|dark_moguzo|mob-[0-2])$/.test(id))continue;
  if(!Number.isSafeInteger(e?.battles)||e.battles<0||!Number.isSafeInteger(e.wins)||e.wins<0||e.wins>e.battles)throw Error('対戦記録を読み込めません');
  encounters[id]={battles:e.battles,wins:e.wins};
 }
 return {...freshProgress(raw.seed),position:{x:clamp(raw.position.x,WORLD.minX,WORLD.maxX),z:clamp(raw.position.z,WORLD.minZ,WORLD.maxZ)},heading:raw.heading,encounters,battles:raw.battles,wins:raw.wins,lastResult:typeof raw.lastResult==='string'?raw.lastResult.slice(0,120):null};
}
export function obstructed(x,z,obstacles=BUILDINGS,radius=WORLD.radius){
 return obstacles.some(b=>Math.abs(x-b.x)<b.w/2+radius&&Math.abs(z-b.z)<b.d/2+radius);
}
export function moveInVillage(position,input,dt,obstacles=BUILDINGS){
 const seconds=clamp(Number(dt)||0,0,.05), length=Math.max(1,Math.hypot(input.x||0,input.z||0));
 const dx=(input.x||0)/length*WORLD.speed*seconds,dz=(input.z||0)/length*WORLD.speed*seconds;
 const x=clamp(position.x+dx,WORLD.minX,WORLD.maxX), z=clamp(position.z+dz,WORLD.minZ,WORLD.maxZ);
 // Slide along a wall instead of tunnelling through it at low frame rates.
 const next={...position};if(!obstructed(x,next.z,obstacles))next.x=x;if(!obstructed(next.x,z,obstacles))next.z=z;return next;
}
export function nearestNpc(position,npcs,maxDistance=1.0){
 return npcs.map(npc=>({npc,distance:Math.hypot(position.x-npc.x,position.z-npc.z)})).filter(x=>x.distance<=maxDistance).sort((a,b)=>a.distance-b.distance||a.npc.id.localeCompare(b.npc.id))[0]?.npc??null;
}
export function recordEncounter(progress,id,winner){
 const next=validateProgress(progress);const previous=next.encounters[id]??{battles:0,wins:0};
 next.encounters[id]={battles:previous.battles+1,wins:previous.wins+(winner===0?1:0)};next.battles++;if(winner===0)next.wins++;
 next.lastResult=winner===0?'勝利':winner===1?'敗北':'引き分け';return next;
}
export function readSave(storage,normalizeAvatar){
 try{const raw=storage.getItem(SAVE_KEY);if(!raw)return {save:null,error:null};if(raw.length>100000)throw Error('保存データが大きすぎます');
  const json=JSON.parse(raw);if(json.version!==STORY_VERSION)throw Error('保存バージョンが異なります');
  return {save:{version:STORY_VERSION,avatar:normalizeAvatar(json.avatar),progress:validateProgress(json.progress)},error:null};
 }catch(error){return {save:null,error:'セーブを読み込めません。元データを残して新規作成できます（'+error.message+'）'};}
}
export function writeSave(storage,avatar,progress){
 const save={version:STORY_VERSION,avatar,progress:validateProgress(progress)};
 try{storage.setItem(SAVE_KEY,JSON.stringify(save));return null;}catch{return '端末に保存できません。空き容量やブラウザ設定を確認してください';}
}
export function mobPlacements(seed){return [0,1,2].map(i=>({id:'mob-'+i,seed:((seed>>>0)+Math.imul(i+1,2654435761))>>>0,x:[-3.5,3.6,0][i],z:[-4.8,1,4.8][i],kind:'custom',line:'旅の途中でここに寄ったんだ。君の拳を見せてくれる？'}));}
