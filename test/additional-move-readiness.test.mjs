import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  ADDITIONAL_MOVE_IMPLEMENTATION_DRAFTS,
  ADDITIONAL_MOVE_READINESS_VERSION,
  SUPPORTED_ADDITIONAL_MOVE_CAPABILITIES,
  UNSUPPORTED_ADDITIONAL_MOVE_CAPABILITIES,
  assertAdditionalMoveAuthorityReady,
  buildAdditionalMoveReadinessReport,
} from '../src/core/index.ts';

const plain=(value)=>JSON.parse(JSON.stringify(value));

const report=buildAdditionalMoveReadinessReport();
assert.equal(ADDITIONAL_MOVE_READINESS_VERSION,'additional-move-readiness-v1');
assert.equal(report.version,'additional-move-readiness-v1');
assert.equal(report.totalMoves,12);
assert.deepEqual(report.counts,{
  designReady:12,
  inputReady:12,
  schemaReady:10,
  moveSpecReady:0,
  runtimeReady:0,
  verificationReady:0,
  authorityReady:0,
});
assert.deepEqual(report.unsupportedCapabilities,['forward_movement','down_on_hit']);
assert.deepEqual(SUPPORTED_ADDITIONAL_MOVE_CAPABILITIES,[
  'conditional_command','one_hit_armor','combo_end','combo_limit','guard_pressure',
]);
assert.deepEqual(UNSUPPORTED_ADDITIONAL_MOVE_CAPABILITIES,['forward_movement','down_on_hit']);
assert.match(report.commandContractHash,/^[0-9a-f]{8}$/);
assert.match(report.hash,/^[0-9a-f]{8}$/);
assert.equal(report.records.length,12);
assert.deepEqual(report.records.map((record)=>record.commandId),[
  'moguzo:slot-4','moguzo:slot-5','moguzo:slot-6','moguzo:slot-7',
  'pisuke:slot-4','pisuke:slot-5','pisuke:slot-6','pisuke:slot-7',
  'godan:slot-4','godan:slot-5','godan:slot-6','godan:slot-7',
]);
assert.ok(report.records.every((record)=>record.stages.design&&record.stages.input));
assert.ok(report.records.every((record)=>!record.stages.moveSpec&&!record.stages.runtime&&!record.stages.verification&&!record.stages.authority));
assert.ok(report.records.every((record)=>record.missingMoveSpecFields.includes('startupF')));
assert.ok(report.records.every((record)=>record.missingMoveSpecFields.includes('damage')));
assert.ok(report.records.every((record)=>record.missingRuntimeItems.includes('behaviorId')));
assert.ok(report.records.every((record)=>record.missingRuntimeItems.includes('poseStrategy')));
assert.ok(report.records.every((record)=>record.missingRuntimeItems.includes('poseId')));
assert.ok(report.records.every((record)=>record.missingRuntimeItems.includes('seToken')));
assert.ok(report.records.every((record)=>record.missingVerificationItems.includes('moveSpecUnit')));
assert.ok(report.records.every((record)=>!record.missingVerificationItems.includes('commandResolution')));

const moguzo7=report.records.find((record)=>record.commandId==='moguzo:slot-7');
assert.deepEqual(moguzo7.requiredCapabilities,['combo_limit']);
assert.equal(moguzo7.requiredConstraintIds.length,3);
assert.equal(moguzo7.reachClass,3);
assert.equal(moguzo7.stages.schema,true);

const pisuke6=report.records.find((record)=>record.commandId==='pisuke:slot-6');
assert.equal(pisuke6.conditionId,'pisuke.lunge-success');
assert.deepEqual(pisuke6.requiredCapabilities,['conditional_command']);
assert.equal(pisuke6.stages.schema,true);

const pisuke7=report.records.find((record)=>record.commandId==='pisuke:slot-7');
assert.deepEqual(pisuke7.requiredCapabilities,['forward_movement','combo_end']);
assert.deepEqual(pisuke7.unsupportedCapabilities,['forward_movement']);
assert.equal(pisuke7.stages.schema,false);
assert.ok(pisuke7.blockers.includes('schema.forward_movement'));
assert.deepEqual(pisuke7.overlaps,[{shorterId:'pisuke:slot-1',longerId:'pisuke:slot-7',resolution:'longest-command-first'}]);

const godan4=report.records.find((record)=>record.commandId==='godan:slot-4');
assert.deepEqual(godan4.requiredCapabilities,['one_hit_armor']);
assert.ok(godan4.missingMoveSpecFields.includes('armorStartF'));
assert.ok(godan4.missingMoveSpecFields.includes('armorEndF'));
assert.equal(godan4.stages.schema,true);

const godan6=report.records.find((record)=>record.commandId==='godan:slot-6');
assert.deepEqual(godan6.requiredCapabilities,['down_on_hit']);
assert.deepEqual(godan6.unsupportedCapabilities,['down_on_hit']);
assert.equal(godan6.stages.schema,false);
assert.ok(godan6.blockers.includes('schema.down_on_hit'));

const godan7=report.records.find((record)=>record.commandId==='godan:slot-7');
assert.deepEqual(godan7.requiredCapabilities,['guard_pressure']);
assert.deepEqual(godan7.overlaps,[{shorterId:'godan:slot-4',longerId:'godan:slot-7',resolution:'longest-command-first'}]);

assert.throws(()=>assertAdditionalMoveAuthorityReady(),/moguzo:slot-4/);
assert.throws(()=>assertAdditionalMoveAuthorityReady(),/schema\.forward_movement/);
assert.throws(()=>buildAdditionalMoveReadinessReport(ADDITIONAL_MOVE_IMPLEMENTATION_DRAFTS.slice(0,11)),/exactly twelve/);
const duplicate=[...ADDITIONAL_MOVE_IMPLEMENTATION_DRAFTS.slice(0,11),ADDITIONAL_MOVE_IMPLEMENTATION_DRAFTS[0]];
assert.throws(()=>buildAdditionalMoveReadinessReport(duplicate),/duplicate/);

function completeSpec(draft){
  return{
    ...draft.moveSpec,
    weight:1,
    telegraphF:5,
    startupF:10,
    activeF:2,
    recoveryF:15,
    damage:60,
    chipDamage:0,
    guardDamage:10,
    hitAdvF:3,
    blockAdvF:-4,
    whiffExtraRecoveryF:0,
    hitKnockbackClass:0,
    blockKnockbackClass:0,
    starterScale:1,
    comboProration:1,
    comboWeight:1,
    repeatLimit:1,
    cancelOnHit:[],
    cancelOnBlock:[],
    cancelOnWhiff:[],
    armorHits:0,
    roarGainOnHit:8,
    roarGainOnBlock:4,
  };
}
const verified={
  moveSpecUnit:true,
  commandResolution:true,
  deterministicCombat:true,
  comboInteraction:true,
  runtimeIntegration:true,
  cpuPolicy:true,
  onlineDeterminism:true,
  mobileSmoke:true,
};
const upgraded=ADDITIONAL_MOVE_IMPLEMENTATION_DRAFTS.map((draft)=>draft.commandId==='moguzo:slot-4'?{
  ...draft,
  moveSpec:completeSpec(draft),
  runtimeBehaviorId:'generic.command.attack',
  poseStrategy:'reuse_existing',
  poseId:'atk_low',
  seToken:'cmdHit',
  verification:verified,
}:draft);
const upgradedReport=buildAdditionalMoveReadinessReport(upgraded);
assert.equal(upgradedReport.counts.moveSpecReady,1);
assert.equal(upgradedReport.counts.runtimeReady,1);
assert.equal(upgradedReport.counts.verificationReady,1);
assert.equal(upgradedReport.counts.authorityReady,1);
assert.equal(upgradedReport.records.find((record)=>record.commandId==='moguzo:slot-4').blockers.length,0);
assert.notEqual(upgradedReport.hash,report.hash);

const mutated=plain(report);
mutated.records.length=0;
assert.equal(report.records.length,12);
assert.equal(Object.isFrozen(report),true);
assert.equal(Object.isFrozen(report.records),true);
assert.equal(Object.isFrozen(report.records[0]),true);
assert.equal(buildAdditionalMoveReadinessReport().hash,report.hash);

for(const path of ['../src/core/additional-move-readiness.ts','../src/core/additional-move-readiness-types.ts']){
  const source=readFileSync(new URL(path,import.meta.url),'utf8');
  for(const forbidden of ['Math.random','Date.now','performance.now','document.','window.','localStorage','sessionStorage','fetch(','setTimeout(','setInterval(']){
    assert.equal(source.includes(forbidden),false,`${path} contains forbidden API: ${forbidden}`);
  }
}

console.log(`additional move readiness tests passed; moves=12; design=12; input=12; schema=10; authority=0; unsupported=2; hash=${report.hash}`);