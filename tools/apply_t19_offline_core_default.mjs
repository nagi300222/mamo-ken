import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname=path.dirname(fileURLToPath(import.meta.url));
const ROOT=path.resolve(__dirname,'..');

function replaceOnce(text,from,to,label){
  const count=text.split(from).length-1;
  if(count!==1)throw new Error(`${label}: expected exactly one match, found ${count}`);
  return text.replace(from,to);
}
function replaceAllChecked(text,from,to,expected,label){
  const count=text.split(from).length-1;
  if(count!==expected)throw new Error(`${label}: expected ${expected} matches, found ${count}`);
  return text.split(from).join(to);
}
function patchFile(relativePath,patch){
  const target=path.join(ROOT,relativePath);
  const original=readFileSync(target,'utf8');
  const updated=patch(original);
  if(updated===original)throw new Error(`${relativePath}: patch produced no change`);
  writeFileSync(target,updated,'utf8');
  console.log(`patched ${relativePath}`);
}

patchFile('runtime/runtime-command-shadow-browser.js',(source)=>{
  let text=source;
  text=replaceOnce(text,"const VERSION='runtime-command-shadow-browser-v4';\n  const REPORT_VERSION='mamoken-command-shadow-report-v2';","const VERSION='runtime-command-shadow-browser-v5';\n  const REPORT_VERSION='mamoken-command-shadow-report-v3';",'browser version');
  text=replaceOnce(text,"  const requestedShadow=/(?:^|[?&])mamokenShadow=1(?:&|$)/.test(search);\n  const requestedCanary=/(?:^|[?&])mamokenCoreCommand=1(?:&|$)/.test(search);\n  const requestedEnabled=requestedShadow||requestedCanary;","  const requestedShadow=/(?:^|[?&])mamokenShadow=1(?:&|$)/.test(search);\n  const requestedCanary=/(?:^|[?&])mamokenCoreCommand=1(?:&|$)/.test(search);\n  const requestedLegacy=/(?:^|[?&])mamokenLegacyCommand=1(?:&|$)/.test(search);\n  const requestedEnabled=requestedShadow||requestedCanary;",'browser query flags');
  text=replaceOnce(text,"  function createCanaryEvent(payload,decision){\n    const event={\n      attemptId:++canaryAttemptSeq,\n      frame:payload.frame,\n      player:payload.player,\n      characterId:payload.characterId,\n      trigger:payload.trigger,\n      decision:decision?clone(decision):null,\n      outcome:'pending',\n      reason:null\n    };\n    return appendCanaryEvent(event);\n  }\n\n  function buildReport(){","  function createCanaryEvent(payload,decision){\n    const event={\n      attemptId:++canaryAttemptSeq,\n      frame:payload.frame,\n      player:payload.player,\n      characterId:payload.characterId,\n      trigger:payload.trigger,\n      decision:decision?clone(decision):null,\n      outcome:'pending',\n      reason:null\n    };\n    return appendCanaryEvent(event);\n  }\n  function offlineAuthority(){\n    if(requestedLegacy)return'legacy-override';\n    if(disabledReason!==null)return'legacy-rollback';\n    return'core-default';\n  }\n\n  function buildReport(){",'offline authority helper');
  text=replaceOnce(text,"      requestedShadow:requestedShadow,\n      requestedCanary:requestedCanary,\n      enabled:api.enabled,","      requestedShadow:requestedShadow,\n      requestedCanary:requestedCanary,\n      requestedLegacy:requestedLegacy,\n      enabled:api.enabled,",'report requested legacy');
  text=replaceOnce(text,"      disabledReason:disabledReason,\n      summary:buildSummary(),","      disabledReason:disabledReason,\n      authority:{offline:offlineAuthority(),online:'legacy'},\n      summary:buildSummary(),",'report authority');
  text=replaceOnce(text,"      canary:{\n        requested:requestedCanary,\n        enabled:api.canaryEnabled,","      canary:{\n        requested:requestedCanary,\n        defaultEnabled:true,\n        legacyOverride:requestedLegacy,\n        enabled:api.canaryEnabled,",'report canary policy');
  text=replaceOnce(text,"    get requestedCanary(){return requestedCanary;},\n    get canaryEnabled(){return requestedCanary&&disabledReason===null;},","    get requestedCanary(){return requestedCanary;},\n    get requestedLegacy(){return requestedLegacy;},\n    get offlineAuthority(){return offlineAuthority();},\n    get canaryEnabled(){return !requestedLegacy&&disabledReason===null;},",'api authority getters');
  text=replaceOnce(text,"        requested:requestedCanary,\n        enabled:api.canaryEnabled,\n        disabledReason:disabledReason,","        requested:requestedCanary,\n        defaultEnabled:true,\n        legacyOverride:requestedLegacy,\n        offlineAuthority:offlineAuthority(),\n        enabled:api.canaryEnabled,\n        disabledReason:disabledReason,",'canary status policy');
  text=replaceOnce(text,"        requestedCanary:requestedCanary,\n        canaryEnabled:api.canaryEnabled,","        requestedCanary:requestedCanary,\n        requestedLegacy:requestedLegacy,\n        offlineAuthority:offlineAuthority(),\n        canaryEnabled:api.canaryEnabled,",'snapshot authority');
  if(!text.includes('mamokenLegacyCommand=1'))throw new Error('browser legacy override query missing');
  return text;
});

patchFile('tools/compare_runtime_shadow_reports.mjs',(source)=>{
  let text=source;
  text=replaceOnce(text,"const REPORT_V2='mamoken-command-shadow-report-v2';\nconst SUPPORTED_REPORTS=new Set([REPORT_V1,REPORT_V2]);","const REPORT_V2='mamoken-command-shadow-report-v2';\nconst REPORT_V3='mamoken-command-shadow-report-v3';\nconst SUPPORTED_REPORTS=new Set([REPORT_V1,REPORT_V2,REPORT_V3]);",'comparator report constants');
  text=replaceOnce(text,"  if(source.requested!==topLevel.requestedCanary)fail(`${label}.requested`,'must match requestedCanary');\n  if(source.enabled!==(source.requested&&disabledReason===null))fail(`${label}.enabled`,'does not match requested/disabled state');\n  if(disabledReason!==topLevel.disabledReason)fail(`${label}.disabledReason`,'must match top-level disabledReason');","  if(source.requested!==topLevel.requestedCanary)fail(`${label}.requested`,'must match requestedCanary');\n  let defaultEnabled=false,legacyOverride=false;\n  if(topLevel.reportVersion===REPORT_V3){\n    if(source.defaultEnabled!==true)fail(`${label}.defaultEnabled`,'must be true');\n    if(typeof source.legacyOverride!=='boolean')fail(`${label}.legacyOverride`,'must be boolean');\n    if(source.legacyOverride!==topLevel.requestedLegacy)fail(`${label}.legacyOverride`,'must match requestedLegacy');\n    defaultEnabled=true;\n    legacyOverride=source.legacyOverride;\n    if(source.enabled!==(!legacyOverride&&disabledReason===null))fail(`${label}.enabled`,'does not match default/override/disabled state');\n  }else if(source.enabled!==(source.requested&&disabledReason===null)){\n    fail(`${label}.enabled`,'does not match requested/disabled state');\n  }\n  if(disabledReason!==topLevel.disabledReason)fail(`${label}.disabledReason`,'must match top-level disabledReason');",'comparator canary policy validation');
  text=replaceOnce(text,"  return{requested:source.requested,enabled:source.enabled,disabledReason,summary,events};","  return{requested:source.requested,defaultEnabled,legacyOverride,enabled:source.enabled,disabledReason,summary,events};",'comparator canary policy return');
  text=replaceOnce(text,"  if(!SUPPORTED_REPORTS.has(source.reportVersion))fail(`${label}.reportVersion`,`must be ${REPORT_V1} or ${REPORT_V2}`);","  if(!SUPPORTED_REPORTS.has(source.reportVersion))fail(`${label}.reportVersion`,`must be ${REPORT_V1}, ${REPORT_V2}, or ${REPORT_V3}`);",'comparator supported report message');
  const oldNormalize=`  if(typeof source.requestedShadow!=='boolean')fail(\`${'${label}'}.requestedShadow\`,'must be boolean');
  if(typeof source.requestedCanary!=='boolean')fail(\`${'${label}'}.requestedCanary\`,'must be boolean');
  if(source.requestedEnabled!==(source.requestedShadow||source.requestedCanary))fail(\`${'${label}'}.requestedEnabled\`,'must match requestedShadow/requestedCanary');
  if(source.enabled!==(source.requestedEnabled&&disabledReason===null))fail(\`${'${label}'}.enabled\`,'does not match requested/disabled state');
  const topLevel={requestedCanary:source.requestedCanary,disabledReason};
  const canary=normalizeCanarySection(source.canary,\`${'${label}'}.canary\`,source.observerVersion,topLevel);
  return{
    reportVersion:REPORT_V2,
    observerVersion:source.observerVersion,
    requestedEnabled:source.requestedEnabled,
    requestedShadow:source.requestedShadow,
    requestedCanary:source.requestedCanary,
    enabled:source.enabled,
    disabledReason,
    summary:observationSection.summary,
    observations:observationSection.observations,
    canary
  };`;
  const newNormalize=`  if(typeof source.requestedShadow!=='boolean')fail(\`${'${label}'}.requestedShadow\`,'must be boolean');
  if(typeof source.requestedCanary!=='boolean')fail(\`${'${label}'}.requestedCanary\`,'must be boolean');
  if(source.requestedEnabled!==(source.requestedShadow||source.requestedCanary))fail(\`${'${label}'}.requestedEnabled\`,'must match requestedShadow/requestedCanary');
  if(source.enabled!==(source.requestedEnabled&&disabledReason===null))fail(\`${'${label}'}.enabled\`,'does not match requested/disabled state');
  let requestedLegacy=false,authority=null;
  if(source.reportVersion===REPORT_V3){
    if(typeof source.requestedLegacy!=='boolean')fail(\`${'${label}'}.requestedLegacy\`,'must be boolean');
    requestedLegacy=source.requestedLegacy;
    if(!isObject(source.authority))fail(\`${'${label}'}.authority\`,'must be an object');
    const expectedOffline=requestedLegacy?'legacy-override':(disabledReason===null?'core-default':'legacy-rollback');
    if(source.authority.offline!==expectedOffline)fail(\`${'${label}'}.authority.offline\`,'does not match override/disabled state');
    if(source.authority.online!=='legacy')fail(\`${'${label}'}.authority.online\`,'must be legacy');
    authority={offline:source.authority.offline,online:'legacy'};
  }
  const topLevel={reportVersion:source.reportVersion,requestedCanary:source.requestedCanary,requestedLegacy,disabledReason};
  const canary=normalizeCanarySection(source.canary,\`${'${label}'}.canary\`,source.observerVersion,topLevel);
  return{
    reportVersion:source.reportVersion,
    observerVersion:source.observerVersion,
    requestedEnabled:source.requestedEnabled,
    requestedShadow:source.requestedShadow,
    requestedCanary:source.requestedCanary,
    requestedLegacy,
    enabled:source.enabled,
    disabledReason,
    authority,
    summary:observationSection.summary,
    observations:observationSection.observations,
    canary
  };`;
  text=replaceOnce(text,oldNormalize,newNormalize,'comparator report v3 normalize');
  text=replaceOnce(text,"  const canaryIdentical=stableStringify(leftCanary)===stableStringify(rightCanary);\n  const identical=compatible&&observationsIdentical&&canaryIdentical;","  const canaryIdentical=stableStringify(leftCanary)===stableStringify(rightCanary);\n  const authorityIdentical=stableStringify(left.authority)===stableStringify(right.authority);\n  const identical=compatible&&observationsIdentical&&canaryIdentical&&authorityIdentical;",'comparator authority identity');
  text=replaceOnce(text,"    canaryIdentical,\n    left:{","    canaryIdentical,\n    authorityIdentical,\n    left:{",'comparator authority result');
  text=replaceOnce(text,"      observationHash:left.summary.observationHash,\n      canary:leftCanaryMetrics","      observationHash:left.summary.observationHash,\n      authority:left.authority,\n      canary:leftCanaryMetrics",'comparator left authority');
  text=replaceOnce(text,"      observationHash:right.summary.observationHash,\n      canary:rightCanaryMetrics","      observationHash:right.summary.observationHash,\n      authority:right.authority,\n      canary:rightCanaryMetrics",'comparator right authority');
  return text;
});

patchFile('test/runtime-command-canary.test.mjs',(source)=>{
  let text=replaceAllChecked(source,'runtime-command-shadow-browser-v4','runtime-command-shadow-browser-v5',2,'canary test browser version');
  text=replaceAllChecked(text,'mamoken-command-shadow-report-v2','mamoken-command-shadow-report-v3',2,'canary test report version');
  const oldDefault=`{
  const api=loadApi('');
  assert.equal(api.requestedCanary,false);
  assert.equal(api.canaryEnabled,false);
  assert.equal(api.resolveTrigger({}).accepted,false);
  assert.equal(api.resolveTrigger({}).reason,'disabled');
  const status=plain(api.canaryStatus());
  assert.equal(status.requested,false);
  assert.equal(status.enabled,false);
  assert.equal(status.disabledReason,null);
  assert.equal(status.summary.attemptCount,0);
}`;
  const newDefault=`{
  const api=loadApi('');
  assert.equal(api.requestedCanary,false);
  assert.equal(api.requestedLegacy,false);
  assert.equal(api.enabled,false);
  assert.equal(api.canaryEnabled,true);
  assert.equal(api.offlineAuthority,'core-default');
  const status=plain(api.canaryStatus());
  assert.equal(status.requested,false);
  assert.equal(status.defaultEnabled,true);
  assert.equal(status.legacyOverride,false);
  assert.equal(status.offlineAuthority,'core-default');
  assert.equal(status.enabled,true);
  assert.equal(status.disabledReason,null);
  assert.equal(status.summary.attemptCount,0);
}`;
  text=replaceOnce(text,oldDefault,newDefault,'canary test default authority');
  text=replaceOnce(text,"{\n  const api=loadApi('?mamokenShadow=1');\n  assert.equal(api.requestedShadow,true);\n  assert.equal(api.requestedCanary,false);\n  assert.equal(api.enabled,true);\n  assert.equal(api.canaryEnabled,false);\n  assert.equal(api.resolveTrigger({}).accepted,false);\n}","{\n  const api=loadApi('?mamokenShadow=1');\n  assert.equal(api.requestedShadow,true);\n  assert.equal(api.requestedCanary,false);\n  assert.equal(api.enabled,true);\n  assert.equal(api.canaryEnabled,true);\n  assert.equal(api.offlineAuthority,'core-default');\n}",'canary test shadow-only authority');
  text=replaceOnce(text,"const canary=loadApi('?mamokenCoreCommand=1');","{\n  const api=loadApi('?mamokenLegacyCommand=1');\n  assert.equal(api.requestedLegacy,true);\n  assert.equal(api.canaryEnabled,false);\n  assert.equal(api.offlineAuthority,'legacy-override');\n  assert.deepEqual(plain(api.resolveTrigger({})),{accepted:false,reason:'disabled'});\n}\n\n{\n  const api=loadApi('?mamokenCoreCommand=1&mamokenLegacyCommand=1');\n  assert.equal(api.requestedCanary,true);\n  assert.equal(api.requestedLegacy,true);\n  assert.equal(api.canaryEnabled,false);\n  assert.equal(api.offlineAuthority,'legacy-override');\n}\n\nconst canary=loadApi('?mamokenCoreCommand=1');",'canary test override cases');
  text=replaceOnce(text,"  assert.equal(status.requested,true);\n  assert.equal(status.enabled,false);","  assert.equal(status.requested,true);\n  assert.equal(status.defaultEnabled,true);\n  assert.equal(status.legacyOverride,false);\n  assert.equal(status.offlineAuthority,'legacy-rollback');\n  assert.equal(status.enabled,false);",'canary test rollback status');
  text=replaceOnce(text,"  assert.equal(api.canaryEnabled,true);\n  assert.equal(api.canaryStatus().summary.attemptCount,0);","  assert.equal(api.canaryEnabled,true);\n  assert.equal(api.offlineAuthority,'core-default');\n  assert.equal(api.canaryStatus().summary.attemptCount,0);",'canary test reset authority');
  text=replaceOnce(text,"assert.ok(dist.includes('mamokenCoreCommand=1'));","assert.ok(dist.includes('mamokenCoreCommand=1'));\nassert.ok(dist.includes('mamokenLegacyCommand=1'));",'canary test dist override');
  text=replaceOnce(text,'defaultOff=true; onlineAuthority=false; rollback=legacy','defaultOn=true; onlineAuthority=legacy; rollback=legacy', 'canary test summary');
  return text;
});

patchFile('test/runtime-shadow-hook.test.mjs',(source)=>{
  let text=replaceAllChecked(source,'runtime-command-shadow-browser-v4','runtime-command-shadow-browser-v5',2,'hook test browser version');
  text=replaceAllChecked(text,'mamoken-command-shadow-report-v2','mamoken-command-shadow-report-v3',2,'hook test report version');
  text=replaceAllChecked(text,'assert.equal(api.canaryEnabled,false);','assert.equal(api.canaryEnabled,true);',1,'hook default canary');
  text=replaceAllChecked(text,'assert.equal(currentApi.canaryEnabled,false);','assert.equal(currentApi.canaryEnabled,true);',1,'hook shadow canary');
  text=replaceOnce(text,"  assert.equal(api.requestedCanary,false);\n  assert.equal(api.canaryEnabled,true);","  assert.equal(api.requestedCanary,false);\n  assert.equal(api.requestedLegacy,false);\n  assert.equal(api.canaryEnabled,true);\n  assert.equal(api.offlineAuthority,'core-default');",'hook authority assertions');
  text=replaceOnce(text,"  assert.equal(api.report().canary.summary.attemptCount,0);","  assert.equal(api.report().canary.enabled,true);\n  assert.equal(api.report().canary.defaultEnabled,true);\n  assert.equal(api.report().canary.summary.attemptCount,0);",'hook report policy');
  text=replaceOnce(text,'defaultOff=true; ring=256; report=v2','shadowDefaultOff=true; coreDefaultOn=true; ring=256; report=v3','hook summary');
  return text;
});

patchFile('test/runtime-shadow-export.test.mjs',(source)=>{
  let text=replaceAllChecked(source,'runtime-command-shadow-browser-v4','runtime-command-shadow-browser-v5',1,'export browser version');
  text=replaceAllChecked(text,'mamoken-command-shadow-report-v2','mamoken-command-shadow-report-v3',2,'export report version');
  text=replaceOnce(text,"assert.equal(first.report.requestedCanary,false);","assert.equal(first.report.requestedCanary,false);\nassert.equal(first.report.requestedLegacy,false);\nassert.equal(first.report.authority.offline,'core-default');\nassert.equal(first.report.authority.online,'legacy');",'export authority fields');
  text=replaceOnce(text,"assert.equal(first.report.canary.requested,false);\nassert.equal(first.report.canary.enabled,false);","assert.equal(first.report.canary.requested,false);\nassert.equal(first.report.canary.defaultEnabled,true);\nassert.equal(first.report.canary.legacyOverride,false);\nassert.equal(first.report.canary.enabled,true);",'export canary policy');
  text=replaceOnce(text,"assert.equal(first.text.includes('mamokenCoreCommand=1'),false);","assert.equal(first.text.includes('mamokenCoreCommand=1'),false);\nassert.equal(first.text.includes('mamokenLegacyCommand=1'),false);",'export query privacy');
  text=replaceOnce(text,"assert.equal(identical.canaryIdentical,true);","assert.equal(identical.canaryIdentical,true);\nassert.equal(identical.authorityIdentical,true);",'export authority comparison');
  return text;
});

patchFile('test/runtime-canary-audit.test.mjs',(source)=>{
  let text=replaceAllChecked(source,'runtime-command-shadow-browser-v4','runtime-command-shadow-browser-v5',1,'audit browser version');
  text=replaceAllChecked(text,'mamoken-command-shadow-report-v2','mamoken-command-shadow-report-v3',1,'audit report version');
  return text;
});

patchFile('test/runtime-command-authority.test.mjs',(source)=>replaceOnce(source,"const normalReport=plain(normal.report());","const normalReport=plain(loadApi('').report());",'authority clean report'));

console.log('T19 offline default Core command authority patch applied');
