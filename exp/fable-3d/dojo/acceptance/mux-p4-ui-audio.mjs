// Optional review copy. Preserve report.json and raw streams as the evidence.
// Usage: node acceptance/mux-p4-ui-audio.mjs <ui-audio/report.json>
import {readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
const reportPath=path.resolve(process.argv[2]??'report.json'),directory=path.dirname(reportPath);
const report=JSON.parse(await readFile(reportPath,'utf8'));
assert.ok(report.video?.file,'raw Playwright video missing');
const rows=report.receipt?.contexts?.filter(row=>row.file&&row.byteLength>0&&row.startPerformanceMs!==null)??[];
assert.ok(rows.length,'no recorded context streams');
const bounds=report.video.pageCreationEpochBounds,videoEpoch=(bounds.before+bounds.after)/2;
const args=['-y','-i',path.resolve(directory,report.video.file)];
for(const row of rows)args.push('-i',path.resolve(directory,row.file));
const filters=rows.map((row,index)=>`[${index+1}:a]adelay=${Math.max(0,Math.round(report.receipt.timeOrigin+row.startPerformanceMs-videoEpoch))}:all=1[a${index}]`);
filters.push(rows.map((_,index)=>`[a${index}]`).join('')+`amix=inputs=${rows.length}:duration=longest:normalize=0[audio]`);
const output=path.join(directory,'ui-with-audio.webm');
args.push('-filter_complex',filters.join(';'),'-map','0:v:0','-map','[audio]','-c:v','copy','-c:a','libopus','-shortest',output);
const result=spawnSync(process.env.FFMPEG_PATH??'ffmpeg',args,{encoding:'utf8'});
await writeFile(path.join(directory,'mux-receipt.json'),JSON.stringify({sourceReport:path.basename(reportPath),output:path.basename(output),
 alignment:'Approximate; page-creation midpoint and actual recorder start timestamps. Does not certify frame-accurate audiovisual synchronization or physical device latency.',
 videoEpochBounds:bounds,inputs:rows.map(row=>({id:row.id,file:row.file,delayMilliseconds:Math.max(0,Math.round(report.receipt.timeOrigin+row.startPerformanceMs-videoEpoch))})),
 exitCode:result.status,error:result.error?.message??null},null,2)+'\n');
if(result.error)throw result.error;
if(result.status!==0){console.error(result.stderr);throw Error('ffmpeg mux failed; keep raw evidence for inspection');}
console.log(output);
