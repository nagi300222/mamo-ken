// Real native Simulator smoke test. No UIKit, process, image or simctl is mocked.
import assert from 'node:assert/strict';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {access,appendFile,mkdir,readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {selectIPhoneSimulator,pngDimensions} from './simulator-policy.mjs';
const execute=promisify(execFile);

export async function simulatorSmoke(){
 const native=new URL('../',import.meta.url),directory=path.resolve(process.env.MAMOKEN_SIMULATOR_EVIDENCE??fileURLToPath(new URL('evidence/simulator/',native)));
 await mkdir(directory,{recursive:true});
 const commandLog=path.join(directory,'commands.log');await writeFile(commandLog,'');
 const report={schemaVersion:1,passed:false,platform:process.platform,simulatorTested:false,physicalDeviceTested:false,
  scope:'Actual iOS Simulator boot/install/launch/framebuffer capture; no touch gameplay or physical-device certification',
  uiLoadedAutomaticallyVerified:false,webglGameplayTested:false,touchControlsTested:false,captureWaitSeconds:8,
  commands:[],screenshots:[],diagnosticErrors:[],startedAt:new Date().toISOString()};
 let selected,bootedHere=false,bundleId;
 async function command(program,args,{timeout=30000,diagnostic=false}={}){
  const row={program,args,timeoutMs:timeout,startedAt:new Date().toISOString()};report.commands.push(row);
  await appendFile(commandLog,JSON.stringify({program,args,timeoutMs:timeout})+'\n');
  try{
   const output=await execute(program,args,{timeout,maxBuffer:8*1024*1024});row.exitCode=0;
   await appendFile(commandLog,output.stdout+output.stderr+'\n');return output.stdout;
  }catch(error){
   row.exitCode=error.code??null;row.timedOut=!!error.killed;
   await appendFile(commandLog,String(error.stdout??'')+String(error.stderr??'')+error.message+'\n');
   if(diagnostic){report.diagnosticErrors.push({program,args,error:error.message});return null;}
   throw error;
  }finally{row.finishedAt=new Date().toISOString();}
 }
 async function screenshot(name){
  const file=path.join(directory,name);await command('xcrun',['simctl','io',selected.udid,'screenshot','--type=png',file]);
  const data=await readFile(file),size=pngDimensions(data);report.screenshots.push({file:name,bytes:data.length,...size});
 }
 try{
  if(process.platform!=='darwin')throw Error('Actual iOS Simulator smoke requires macOS and Xcode; no simulated pass is substituted');
  report.xcode=(await command('xcodebuild',['-version'])).trim();
  report.sdk=(await command('xcrun',['--sdk','iphonesimulator','--show-sdk-version'])).trim();
  const inventory=await command('xcrun',['simctl','list','devices','available','--json']);
  const runtimes=await command('xcrun',['simctl','list','runtimes','--json']);
  await writeFile(path.join(directory,'devices.json'),inventory);await writeFile(path.join(directory,'runtimes.json'),runtimes);
  selected=selectIPhoneSimulator(JSON.parse(inventory),JSON.parse(runtimes));report.device=selected;
  const app=path.resolve(process.env.MAMOKEN_SIMULATOR_APP??fileURLToPath(new URL('DerivedData/Build/Products/Debug-iphonesimulator/App.app',native)));
  await access(path.join(app,'Info.plist'));report.app=path.relative(fileURLToPath(native),app);
  bundleId=(await command('/usr/libexec/PlistBuddy',['-c','Print :CFBundleIdentifier',path.join(app,'Info.plist')])).trim();
  assert.ok(/^[A-Za-z0-9.-]+$/.test(bundleId),'Invalid compiled app bundle ID');report.bundleId=bundleId;
  const executable=(await command('/usr/libexec/PlistBuddy',['-c','Print :CFBundleExecutable',path.join(app,'Info.plist')])).trim();
  report.supportedOrientations=(await command('/usr/libexec/PlistBuddy',['-c','Print :UISupportedInterfaceOrientations',path.join(app,'Info.plist')])).trim();
  if(selected.state!=='Booted'){await command('xcrun',['simctl','boot',selected.udid],{timeout:60000});bootedHere=true;}
  await command('xcrun',['simctl','bootstatus',selected.udid,'-b'],{timeout:180000});report.simulatorTested=true;
  await command('xcrun',['simctl','install',selected.udid,app],{timeout:120000});report.installed=true;
  const launch=await command('xcrun',['simctl','launch','--terminate-running-process','--stdout='+path.join(directory,'app-stdout.log'),'--stderr='+path.join(directory,'app-stderr.log'),selected.udid,bundleId],{timeout:60000});
  const pid=/\:\s*(\d+)\s*$/.exec(launch)?.[1];assert.ok(pid,'simctl did not report a launched application PID');report.launchedPid=Number(pid);
  // Capture delay only: no assertion about DOM, GPU gameplay or UIKit touches.
  await new Promise(resolve=>setTimeout(resolve,8000));
  const processes=await command('xcrun',['simctl','spawn',selected.udid,'launchctl','list']);
  await writeFile(path.join(directory,'processes.txt'),processes);
  const running=processes.split('\n').find(line=>line.trim().split(/\s+/)[0]===pid);
  assert.ok(running,'Installed app exited before native screenshot capture');report.runningProcess=running.trim();
  await screenshot('01-native-launcher.png');await new Promise(resolve=>setTimeout(resolve,2000));await screenshot('02-native-launcher-stable.png');
  const log=await command('xcrun',['simctl','spawn',selected.udid,'log','show','--last','2m','--style','compact','--predicate','process == '+JSON.stringify(executable)],{timeout:30000,diagnostic:true});
  if(log!==null)await writeFile(path.join(directory,'unified-app.log'),log);
  report.passed=true;
 }catch(error){
  report.error=error.stack??error.message;
  if(selected&&report.simulatorTested){try{await screenshot('failure.png');}catch(captureError){report.diagnosticErrors.push({error:captureError.message});}}
 }finally{
  if(selected&&report.installed&&bundleId)await command('xcrun',['simctl','terminate',selected.udid,bundleId],{diagnostic:true});
  if(selected&&bootedHere)await command('xcrun',['simctl','shutdown',selected.udid],{timeout:60000,diagnostic:true});
  report.finishedAt=new Date().toISOString();await writeFile(path.join(directory,'report.json'),JSON.stringify(report,null,2)+'\n');
 }
 console.log(JSON.stringify({passed:report.passed,device:report.device,xcode:report.xcode,sdk:report.sdk,screenshots:report.screenshots,physicalDeviceTested:false,directory},null,2));
 if(!report.passed)throw Error('Actual iOS Simulator smoke failed; inspect native/evidence/simulator/report.json and commands.log');
 return report;
}
if(process.argv[1]&&pathToFileURL(path.resolve(process.argv[1])).href===import.meta.url)await simulatorSmoke();
