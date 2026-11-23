import test from 'node:test';
import assert from 'node:assert/strict';
import {createDefaultAvatar,normalizeAvatar,validateAvatar,isUnmodifiedCombatShape} from '../custom/v16/avatar-schema.js';
import {applyEditorValues,editorMeshOptions,selectedMoveProblems} from './editor-model.js';
import {freshProgress,readSave,writeSave,SAVE_KEY} from './story-state.js';
const manifest={schemaVersion:1,version:'p2-exchange-1',modules:[]};
const storage=()=>{const data=new Map();return {data,getItem:key=>data.get(key),setItem:(key,value)=>data.set(key,value)};};
test('old v1 saves retain their appearance, loadout and journey through re-edit with no mesh opt-in',()=>{
 const saved=createDefaultAvatar('godan');saved.appearance.parts.head='pisuke';saved.appearance.palette.futureShade='#123456';
 const disk=storage(),progress=freshProgress(57);progress.position={x:1.2,z:-.7};progress.wins=2;progress.battles=3;
 assert.equal(writeSave(disk,saved,progress),null);const loaded=readSave(disk,normalizeAvatar);
 const values={name:'改名',baseId:'moguzo',parts:{},palette:{fur:'#456789'},pattern:'stripes',meshParts:{},styleId:loaded.save.avatar.combat.styleId,specials:loaded.save.avatar.combat.specials};
 const edited=applyEditorValues(loaded.save.avatar,values);
 assert.equal(edited.appearance.parts.head,'pisuke');assert.equal(edited.appearance.palette.futureShade,'#123456');assert.ok(!Object.hasOwn(edited.appearance,'meshParts'));
 assert.deepEqual(edited.combat,saved.combat);assert.equal(writeSave(disk,edited,loaded.save.progress),null);
 assert.deepEqual(readSave(disk,normalizeAvatar).save.progress,loaded.save.progress);
});
test('explicit mesh choices survive normalization and unavailable host changes without silent replacement',()=>{
 const saved=createDefaultAvatar('moguzo');saved.appearance.meshParts={head:'godan',hands:'bullet'};
 const copy=normalizeAvatar(saved);assert.deepEqual(copy.appearance.meshParts,saved.appearance.meshParts);assert.equal(isUnmodifiedCombatShape(copy),false);
 copy.appearance.baseId='pisuke';const options=editorMeshOptions(manifest,copy,'head');assert.equal(options.selected,'godan');assert.ok(options.reason.includes('未制作'));assert.equal(options.options.find(o=>o.id==='godan').available,false);
 const same=createDefaultAvatar('godan');same.appearance.meshParts={head:'godan'};assert.equal(isUnmodifiedCombatShape(normalizeAvatar(same)),true);
});
test('invalid or conflicting saved mesh choices remain on disk and return visible validation reasons',()=>{
 for(const meshParts of [null,[],{unknown:'godan'},{head:'missing'}]){
  const raw=createDefaultAvatar('moguzo');raw.appearance.meshParts=meshParts;const disk=storage();writeSave(disk,raw,freshProgress());const before=disk.getItem(SAVE_KEY);
  const result=readSave(disk,normalizeAvatar);assert.equal(result.save,null);assert.ok(result.error);assert.equal(disk.getItem(SAVE_KEY),before);
 }
 const raw=createDefaultAvatar('moguzo');raw.appearance.parts.head='pisuke';raw.appearance.meshParts={head:'godan'};
 assert.equal(validateAvatar(raw).ok,false);assert.ok(editorMeshOptions(manifest,raw,'head').reason.includes('同時'));
});
test('clearing a mesh is explicit and leaves all other choices untouched',()=>{
 const raw=createDefaultAvatar('moguzo');raw.appearance.meshParts={head:'godan',ears:'bullet'};
 const next=applyEditorValues(raw,{name:raw.name,baseId:'moguzo',parts:{},palette:{},pattern:'solid',meshParts:{head:''},styleId:'moguzo',specials:raw.combat.specials});
 assert.deepEqual(next.appearance.meshParts,{ears:'bullet'});assert.deepEqual(raw.appearance.meshParts,{head:'godan',ears:'bullet'});
 const problems=selectedMoveProblems([{ref:'bullet.s3',name:'尾薙ぎ',supported:false,reason:'長尾6骨が必要です'}],['bullet.s3']);
 assert.deepEqual(problems,[{slot:0,ref:'bullet.s3',name:'尾薙ぎ',reason:'長尾6骨が必要です'}]);
});
