import test from 'node:test';
import assert from 'node:assert/strict';
import {createDefaultAvatar,normalizeAvatar,validateAvatar,isUnmodifiedCombatShape} from './avatar-schema.js';
test('legacy schema-one avatars do not opt into physical mesh exchange during normalization',()=>{
 const definition=createDefaultAvatar('moguzo');definition.appearance.parts.head='pisuke';
 const before=structuredClone(definition),normalized=normalizeAvatar(definition);
 assert.deepEqual(normalized,before);assert.equal(Object.hasOwn(normalized.appearance,'meshParts'),false);assert.deepEqual(definition,before);
});
test('explicit physical donor selections survive serialization independently of legacy parts',()=>{
 const definition=createDefaultAvatar('godan');definition.appearance.meshParts={head:'moguzo',hands:'bullet'};
 const before=JSON.stringify(definition),normalized=normalizeAvatar(JSON.parse(before));
 assert.deepEqual(normalized.appearance.meshParts,{head:'moguzo',hands:'bullet'});assert.deepEqual(normalized.appearance.parts,definition.appearance.parts);assert.equal(JSON.stringify(definition),before);
 assert.equal(isUnmodifiedCombatShape(normalized),false);
});
test('unknown mesh slots, donors and simultaneous grafts fail visibly without mutating saved choices',()=>{
 for(const meshParts of [null,[],{unknown:'godan'},{head:'pisuke'},{head:3}]){
  const definition=createDefaultAvatar('moguzo');definition.appearance.meshParts=meshParts;const before=JSON.stringify(definition),result=validateAvatar(definition);
  assert.equal(result.ok,false);assert.ok(result.errors.some(error=>error.path.startsWith('appearance.meshParts')));assert.equal(JSON.stringify(definition),before);
 }
 const definition=createDefaultAvatar('moguzo');definition.appearance.meshParts={head:'godan'};definition.appearance.parts.head='pisuke';
 const before=structuredClone(definition);assert.throws(()=>normalizeAvatar(definition),/同時/);assert.deepEqual(definition,before);
});
test('a current-body physical part is unchanged while foreign physical parts require real measurements',()=>{
 const definition=createDefaultAvatar('godan');definition.appearance.meshParts={head:'godan',tail:'godan'};
 assert.equal(isUnmodifiedCombatShape(normalizeAvatar(definition)),true);
 definition.appearance.meshParts.head='bullet';assert.equal(isUnmodifiedCombatShape(normalizeAvatar(definition)),false);
 definition.appearance.parts.head='godan';assert.equal(validateAvatar(definition).ok,true,'explicit own-body legacy shape is nonconflicting');
});
