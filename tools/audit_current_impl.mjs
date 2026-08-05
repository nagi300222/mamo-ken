import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { relative } from 'node:path';

const runtime = 'prototype/mamoken_prototype_v01.html';
const mobileSource = 'index.html';
const dist = 'dist/mamoken_mobile.html';
const server = 'server/src/worker.mjs';
const src = readFileSync(runtime, 'utf8');
const idx = readFileSync(mobileSource, 'utf8');
const distSrc = readFileSync(dist, 'utf8');
const serverSrc = readFileSync(server, 'utf8');

function lineOf(text, pos){ return text.slice(0,pos).split('\n').length; }
function findBalanced(text, start){
  const open = text[start]; const close = open === '{' ? '}' : ']';
  let depth = 0, quote = null, esc = false, lineComment = false, blockComment = false;
  for(let i=start;i<text.length;i++){
    const c=text[i], n=text[i+1];
    if(lineComment){ if(c==='\n') lineComment=false; continue; }
    if(blockComment){ if(c==='*'&&n==='/'){ blockComment=false; i++; } continue; }
    if(quote){ if(esc){ esc=false; continue; } if(c==='\\'){ esc=true; continue; } if(c===quote) quote=null; continue; }
    if(c==='/'&&n==='/'){ lineComment=true; i++; continue; }
    if(c==='/'&&n==='*'){ blockComment=true; i++; continue; }
    if(c==='"'||c==="'"||c==='`'){ quote=c; continue; }
    if(c===open) depth++;
    if(c===close){ depth--; if(depth===0) return text.slice(start, i+1); }
  }
  throw new Error(`unbalanced block at ${start}`);
}
function evalLiteral(name){
  const m = src.match(new RegExp(`const\\s+${name}\\s*=\\s*`));
  if(!m) throw new Error(`missing const ${name}`);
  const start = m.index + m[0].length;
  const block = findBalanced(src, start);
  return Function(`return (${block});`)();
}
const BAL = evalLiteral('BAL');
const CHARS = evalLiteral('CHARS');
const POSE_IDS = evalLiteral('POSE_IDS');
const levels = evalLiteral('LEVELS');
const choices = evalLiteral('CHOICES');

function uniqueMatches(re){
  const out = new Map(); let m;
  while((m=re.exec(src))){ out.set(m[1], { value:m[1], line:lineOf(src,m.index) }); }
  return [...out.values()].sort((a,b)=>a.value.localeCompare(b.value));
}
const phases = uniqueMatches(/\.phase\s*(?:=|===|!==)\s*['"]([A-Za-z0-9_]+)['"]/g);
const flows = uniqueMatches(/B\.flow\s*(?:=|===|!==)\s*['"]([A-Za-z0-9_]+)['"]/g);
const screens = uniqueMatches(/game\.screen\s*(?:=|===|!==)\s*['"]([A-Za-z0-9_]+)['"]/g);
const clashPhases = uniqueMatches(/\.phase\s*(?:=|===|!==)\s*['"](in|select|reveal)['"]/g);
const eventTypes = uniqueMatches(/\bt\s*:\s*['"]([A-Za-z0-9_]+)['"]/g);
const rngCalls = [...src.matchAll(/\b(rng|Math\.random)\s*\(/g)].map(m=>({ call:m[1], line:lineOf(src,m.index), context:src.slice(Math.max(0,m.index-80),m.index+120).replace(/\s+/g,' ').trim() }));
const localStorage = [...src.matchAll(/localStorage(?:\.([A-Za-z0-9_]+)|\[['"]([^'"]+)['"]\])?/g)].map(m=>({line:lineOf(src,m.index), text:m[0]}));

const commands = Object.fromEntries(Object.entries(BAL.CMD.moves).map(([charId, moves])=>[charId, moves.map((m,i)=>({slot:i+1,...m}))]));
const constants = {
  source: runtime,
  bal: BAL,
  characters: CHARS.map(c=>({id:c.id,name:c.name,type:c.type,ult:c.ult,dMul:c.dMul,sMul:c.sMul,sOfs:c.sOfs,gMax:c.gMax,pips:c.pips,stats5:c.stats5,usability:c.usability})),
  characterIds: CHARS.map(c=>c.id),
  levels,
  choices,
  commandMoves: commands,
  inputTiming: { BUF:BAL.BUF, CMD_buffer:BAL.CMD.buffer, CMD_bufF:BAL.CMD.bufF, FLICK_MS:BAL.FLICK_MS, JUST_TAP_MS:BAL.JUST_TAP_MS },
  roar: BAL.ROAR,
  sGauge: BAL.SG,
  clash: BAL.CLASH,
  down: BAL.DOWN,
  ult: BAL.ULT,
  net: BAL.NET,
  aiDifficulty: BAL.AIDIFF,
  sprites: { poseIds: POSE_IDS, spriteH: BAL.SPRITE_H, portraitRatio: BAL.PORTRAIT_RATIO }
};
const phasesReport = { source: runtime, fighterPhases: phases, battleFlows: flows, gameScreens: screens, clashMiniGamePhases: clashPhases, eventTypes };
const sync = {
  source: runtime,
  server,
  netQueues: ['NET.localQ','NET.peerQ','NET.matchSeq','NET.simF','NET.capTick','NET.delayF'],
  onlineInputMessages: eventTypes.map(e=>e.value).filter(v=>['cmd','mgPick','mgTap','mgHit','ult','roar','atk','grab','dodge','mikiri'].includes(v)),
  comments: [
    'Client lockstep advances B.flow only when both delayed inputs for the same sim frame are present.',
    'Server relays cmd/pick-like payloads without interpreting battle semantics.',
    'Gyuiin minigames use mgPick/mgTap/mgHit through the same lockstep cmd queue online.'
  ],
  rngCalls,
  mathRandomCoreRisk: rngCalls.filter(r=>r.call==='Math.random' && !/(noise|spark|shake|select|standing|rot|scl|ox|oy)/i.test(r.context)),
  localStorage,
  distStringChecks: {
    balBufSame: idx.includes('BUF:10') && distSrc.includes('BUF:10'),
    cmdBufferSame: idx.includes('buffer:12') && distSrc.includes('buffer:12'),
    cmdBufFSame: idx.includes('bufF:24') && distSrc.includes('bufF:24'),
    roarSame: idx.includes('ROAR:{s:16,armor:14,a:4,r:24,d:130,stun:34}') && distSrc.includes('ROAR:{s:16,armor:14,a:4,r:24,d:130,stun:34}'),
    serverRelayMentionsCmd: /cmd/.test(serverSrc)
  }
};

mkdirSync('reports',{recursive:true});
writeFileSync('reports/current_impl_constants.json', JSON.stringify(constants,null,2)+'\n');
writeFileSync('reports/current_impl_phases.json', JSON.stringify(phasesReport,null,2)+'\n');
writeFileSync('reports/current_impl_sync_scope.md', `# T00 current implementation sync scope\n\n- Source: \`${runtime}\`\n- Server boundary: \`${server}\`\n- Lockstep queues: ${sync.netQueues.map(q=>`\`${q}\``).join(', ')}\n- Online minigame input events found: ${sync.onlineInputMessages.map(v=>`\`${v}\``).join(', ')}\n- localStorage references: ${localStorage.length === 0 ? 'none' : localStorage.map(x=>`line ${x.line}: ${x.text}`).join('; ')}\n- Math.random/rng call count: ${rngCalls.length}\n- Potential Math.random core-risk calls after heuristic filter: ${sync.mathRandomCoreRisk.length}\n- Source/dist string checks: ${Object.entries(sync.distStringChecks).map(([k,v])=>`${k}=${v}`).join(', ')}\n\n## Notes\n\n${sync.comments.map(c=>`- ${c}`).join('\n')}\n`);

const required = [BAL.BUF, BAL.CMD.buffer, BAL.CMD.bufF, BAL.ROAR.s, BAL.ROAR.armor, BAL.CLASH.d, Object.keys(commands).length, phases.length, flows.length];
if(required.some(v=>v==null || v===0)) throw new Error('audit extraction failed required values');
console.log(JSON.stringify({ok:true, files:['reports/current_impl_constants.json','reports/current_impl_phases.json','reports/current_impl_sync_scope.md'], phaseCount:phases.length, flowCount:flows.length, commandMoveCount:Object.values(commands).flat().length, rngCallCount:rngCalls.length, localStorageCount:localStorage.length}, null, 2));
