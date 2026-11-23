import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {AnimationClip} from '../preview/vendor/three.module.min.js';
import {loadV17R2SpecialMotionSource,specialMotionOverride} from '../dojo/special-motion-source.js';
import {showtimeFor} from '../dojo/showtime-profiles.js';
import {specialMove} from '../dojo/balance.js';
import {feedbackForMove,presentCombatFeedback} from '../dojo/fight-feel.js';
import {createDefaultAvatar} from '../custom/v16/avatar-schema.js';
import {P2_MELEE_REFS,P2_MELEE_TARGETS,p2MeleeCompatibility} from '../custom/v16/melee-compatibility-p2.js';
import {specialPlaybackKey,presentEquippedSpecial} from './equipped-special.js';
const json=url=>readFile(url,'utf8').then(JSON.parse),source=await loadV17R2SpecialMotionSource(json);

test('all seven supported foreign melee pairs retain the actual authored movement sound and VFX owner',async()=>{
 let pairs=0;
 for(const baseId of P2_MELEE_TARGETS)for(const ref of P2_MELEE_REFS){
  const definition=createDefaultAvatar(baseId),[owner,slot]=ref.split('.');
  if(owner===baseId||!p2MeleeCompatibility(definition,ref).supported)continue;
  const url=new URL('../cinematic/v14/'+owner+'/manifest.json',import.meta.url),manifest=await json(url);
  const {spec}=specialMotionOverride(source,owner,manifest.moves.find(move=>move.moveId===slot),url);
  const actor={id:'yomikage',specialCueIndex:0},fighter={action:{id:'s1',customRef:ref,sourceCharacterId:owner}},entry={sourceRef:ref,sourceCharacterId:owner,spec};
  const sounds=[],visuals=[],audio={play:(key,id)=>{sounds.push({key,id});return true;}};
  const visual=(cue,id)=>{visuals.push({cue,id});return {material:{color:{getHex:()=>showtimeFor(id).color}}};};
  const seconds=spec.cueTrack.at(-1).at+.001;
  presentEquippedSpecial(actor,fighter,entry,seconds,{audio,visual});
  const log=structuredClone(actor.specialCueLog);presentEquippedSpecial(actor,fighter,entry,seconds,{audio,visual});
  assert.deepEqual(actor.specialCueLog,log,'a frozen/repeated clip clock replayed movement cues');
  assert.ok(sounds.length,ref+' lacks actual authored movement audio');
  assert.equal(visuals.length,spec.cueTrack.filter(cue=>cue.type==='vfx').length,'invented or lost a movement VFX cue');
  assert.ok(sounds.every(sound=>sound.id===owner)&&visuals.every(effect=>effect.id===owner),ref+' used the visual body or fighting style as the move owner');
  assert.ok(log.every(cue=>cue.ref===ref&&cue.characterId===owner));
  assert.ok(log.filter(cue=>cue.type==='vfx').every(cue=>cue.color===showtimeFor(owner).color&&cue.rendered));
  const feedback=feedbackForMove({id:'yomikage'},{...specialMove(owner,2),id:'s1',sourceCharacterId:owner,sourceMoveId:slot},'hit',{x:0,y:.3});
  const impacts=[];presentCombatFeedback({feedback},{audio:{playFeedback(){}},impact:value=>impacts.push({profile:value.id,owner:value.characterId,color:showtimeFor(value.characterId).color})});
  assert.deepEqual(impacts,[{profile:ref,owner,color:showtimeFor(owner).color}],ref+' actual hit feedback used the equipped slot/style instead of the move source');
  pairs++;
 }
 assert.equal(pairs,7);
});
test('same-name s3 clips in different slots retain distinct playback identities even with equal serials',()=>{
 const actor={id:'moguzo'},action=ref=>({getClip:()=>({name:'s3_v17',uuid:ref})});
 const fighter={state:'attack',action:{id:'s1',serial:4}},first={sourceRef:'godan.s3',action:action('uuid-a')},second={sourceRef:'chirka.s3',action:action('uuid-b')};
 const a=specialPlaybackKey(actor,fighter,first,'s3_v17'),b=specialPlaybackKey(actor,fighter,second,'s3_v17');
 assert.notEqual(a,b);fighter.action.id='s2';assert.notEqual(specialPlaybackKey(actor,fighter,first,'s3_v17'),a);
 const clipA=new AnimationClip('s3_v17',1,[]),clipB=clipA.clone();assert.notEqual(clipA.uuid,clipB.uuid);
 const entry={sourceRef:'godan.s3',action:{getClip:()=>clipA}},clone={sourceRef:'godan.s3',action:{getClip:()=>clipB}};
 assert.notEqual(specialPlaybackKey(actor,fighter,entry,clipA.name),specialPlaybackKey(actor,fighter,clone,clipB.name));
});
test('native movement cues keep their source and reduced visuals stay silent without changing audio identity',()=>{
 const actor={id:'moguzo',specialCueIndex:0},fighter={action:{id:'s1',sourceCharacterId:'moguzo'}},entry={sourceRef:'moguzo.s1',sourceCharacterId:'moguzo',spec:{motionVersion:'v17',cueTrack:[{at:.1,type:'sfx',key:'wind',trigger:'movement'},{at:.1,type:'vfx',key:'special',trigger:'movement'}]}};
 const played=[];presentEquippedSpecial(actor,fighter,entry,.2,{audio:{play:(key,id)=>played.push({key,id})},visual:()=>null});
 assert.deepEqual(played,[{key:'wind',id:'moguzo'}]);assert.equal(actor.specialCueLog.find(cue=>cue.type==='vfx').rendered,false);
});

test('actual authored projectile movement VFX keeps its source palette on a different style',async()=>{
 const owner='moguzo',url=new URL('../cinematic/v14/moguzo/manifest.json',import.meta.url),manifest=await json(url);
 const {spec}=specialMotionOverride(source,owner,manifest.moves.find(move=>move.moveId==='s1'),url);
 const actor={id:'godan',specialCueIndex:0},entry={spec,sourceRef:'moguzo.s1',sourceCharacterId:owner},effects=[];
 presentEquippedSpecial(actor,{action:{id:'s2'}},entry,spec.cueTrack.at(-1).at+.001,{audio:{play(){}},visual:(cue,id)=>{effects.push({key:cue.key,id});return {material:{color:{getHex:()=>showtimeFor(id).color}}};}});
 assert.ok(effects.length>0);assert.ok(effects.every(effect=>effect.id===owner));
 assert.ok(actor.specialCueLog.filter(cue=>cue.type==='vfx').every(cue=>cue.color===showtimeFor(owner).color));
});
