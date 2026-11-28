import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import plist from 'plist';
import xcode from 'xcode';
import {createSaveMirror,SAVE_KEYS,validSaveValue} from '../runtime/save-mirror.js';
import {shouldRotateLandscape,isNativeRuntime} from '../../exp/fable-3d/dojo/landscape-lock.js';

const native=new URL('../',import.meta.url);
const story=JSON.stringify({version:1,avatar:{name:'山風'},progress:{version:1,battles:2,wins:1}});
const prefix='mamoken.native.backup.v1.';
class StorageFixture{constructor(){this.values=new Map();}getItem(k){return this.values.get(String(k))??null;}setItem(k,v){this.values.set(String(k),String(v));}removeItem(k){this.values.delete(String(k));}clear(){this.values.clear();}}
function preferenceFixture(values=new Map()){
 return {values,async get({key}){return {value:values.get(key)??null};},async set({key,value}){values.set(key,value);},async remove({key}){values.delete(key);}};
}
test('native UIKit owns portrait transition; ordinary touch browsers retain CSS lock',()=>{
 assert.equal(shouldRotateLandscape(393,852,true,true),false);
 assert.equal(shouldRotateLandscape(393,852,true,false),true);
 assert.equal(shouldRotateLandscape(852,393,true,false),false);
 assert.equal(isNativeRuntime({Capacitor:{isNativePlatform:()=>true}}),true);
 assert.equal(isNativeRuntime({mamokenNative:{isNative:true}}),true);
 assert.equal(isNativeRuntime({Capacitor:{isNativePlatform(){throw Error('not ready');}}}),false);
});
test('native save restores only a missing record and preserves corrupt/current local data',async()=>{
 const storage=new StorageFixture(),preferences=preferenceFixture(new Map([[prefix+SAVE_KEYS[0],story],[prefix+SAVE_KEYS[1],'9']]));
 const mirror=createSaveMirror({storage,preferences});await mirror.restore();await mirror.flush();
 assert.equal(storage.getItem(SAVE_KEYS[0]),story);assert.equal(storage.getItem(SAVE_KEYS[1]),'9');
 storage.setItem(SAVE_KEYS[0],'{broken');const second=createSaveMirror({storage,preferences});await second.restore();assert.equal(storage.getItem(SAVE_KEYS[0]),'{broken');
 await second.flush();assert.equal(preferences.values.get(prefix+SAVE_KEYS[0]),story);
 assert.equal(validSaveValue(SAVE_KEYS[0],JSON.stringify({version:9})),false);assert.equal(validSaveValue(SAVE_KEYS[1],'-1'),false);
});
test('write-through mirror copies only game keys, resets after removal, leaves another Storage untouched',async()=>{
 const storage=new StorageFixture(),other=new StorageFixture(),preferences=preferenceFixture();
 const mirror=createSaveMirror({storage,preferences});await mirror.restore();mirror.install();
 try{
  storage.setItem(SAVE_KEYS[0],story);storage.setItem(SAVE_KEYS[1],'12');storage.setItem('unrelated','private');other.setItem(SAVE_KEYS[1],'99');await mirror.flush();
  assert.equal(preferences.values.get(prefix+SAVE_KEYS[0]),story);assert.equal(preferences.values.get(prefix+SAVE_KEYS[1]),'12');assert.equal(preferences.values.size,2);
  storage.removeItem(SAVE_KEYS[0]);await mirror.flush();assert.equal(preferences.values.has(prefix+SAVE_KEYS[0]),false);
  storage.clear();await mirror.flush();assert.equal(preferences.values.size,0);assert.equal(other.getItem(SAVE_KEYS[1]),'99');
 }finally{mirror.dispose();}
});
test('backup failures do not block local saves and a later flush retries',async()=>{
 const storage=new StorageFixture(),preferences=preferenceFixture(),warnings=[];let failures=1;
 const set=preferences.set;preferences.set=async args=>{if(failures-->0)throw Error('test unavailable');return set(args);};
 storage.setItem(SAVE_KEYS[0],story);const mirror=createSaveMirror({storage,preferences,onWarning:warning=>warnings.push(warning)});await mirror.restore();await mirror.flush();
 assert.equal(storage.getItem(SAVE_KEYS[0]),story);assert.equal(warnings.length,1);await mirror.flush();assert.equal(preferences.values.get(prefix+SAVE_KEYS[0]),story);
});
test('an unreadable native backup is unknown, not absent: flush never deletes it and retries the read',async()=>{
 const preferences=preferenceFixture(new Map([[prefix+SAVE_KEYS[0],story],[prefix+SAVE_KEYS[1],'40']])),storage=new StorageFixture(),warnings=[];
 const get=preferences.get;let readFailures=2;preferences.get=async args=>{if(readFailures-->0)throw Error('test read unavailable');return get(args);};
 const mirror=createSaveMirror({storage,preferences,onWarning:w=>warnings.push(w)});await mirror.restore();mirror.install();
 try{
  assert.deepEqual(mirror.unknownKeys.sort(),[...SAVE_KEYS].sort());
  await mirror.flush();
  assert.equal(preferences.values.get(prefix+SAVE_KEYS[0]),story,'first flush must not delete the unread story backup');
  assert.equal(storage.getItem(SAVE_KEYS[0]),story,'flush retried the read and restored the local record');
  assert.equal(storage.getItem(SAVE_KEYS[1]),'40');assert.deepEqual(mirror.unknownKeys,[]);
  storage.removeItem(SAVE_KEYS[0]);await mirror.flush();assert.equal(preferences.values.has(prefix+SAVE_KEYS[0]),false,'explicit game removal still deletes');
 }finally{mirror.dispose();}
 assert.ok(warnings.length>=2);
});
test('a permanently unreadable backup survives repeated flushes, and an explicit clear still removes it',async()=>{
 const preferences=preferenceFixture(new Map([[prefix+SAVE_KEYS[0],story]])),storage=new StorageFixture();
 preferences.get=async()=>{throw Error('test read unavailable');};
 const mirror=createSaveMirror({storage,preferences});await mirror.restore();mirror.install();
 try{
  for(let i=0;i<5;i++)await mirror.flush();
  assert.equal(preferences.values.get(prefix+SAVE_KEYS[0]),story);
  storage.clear();await mirror.flush();assert.equal(preferences.values.has(prefix+SAVE_KEYS[0]),false);
 }finally{mirror.dispose();}
});
test('survival best keeps the higher of local and native copies in both directions',async()=>{
 const preferences=preferenceFixture(new Map([[prefix+SAVE_KEYS[1],'30']])),storage=new StorageFixture();
 storage.setItem(SAVE_KEYS[1],'12');
 const mirror=createSaveMirror({storage,preferences});await mirror.restore();mirror.install();
 try{
  await mirror.flush();assert.equal(storage.getItem(SAVE_KEYS[1]),'30');assert.equal(preferences.values.get(prefix+SAVE_KEYS[1]),'30');
  storage.setItem(SAVE_KEYS[1],'31');await mirror.flush();assert.equal(preferences.values.get(prefix+SAVE_KEYS[1]),'31');
  preferences.values.set(prefix+SAVE_KEYS[1],'50');storage.setItem(SAVE_KEYS[1],'32');await mirror.flush();
  assert.equal(preferences.values.get(prefix+SAVE_KEYS[1]),'50','a lower local write never lowers the native best');
  assert.equal(storage.getItem(SAVE_KEYS[1]),'50');
 }finally{mirror.dispose();}
});
test('generated iOS scene uses landscape on iPhone/iPad and includes UserDefaults privacy resource',async()=>{
 const info=plist.parse(await readFile(new URL('ios/App/App/Info.plist',native),'utf8'));
 const orientations=['UIInterfaceOrientationLandscapeLeft','UIInterfaceOrientationLandscapeRight'];
 assert.deepEqual(info.UISupportedInterfaceOrientations,orientations);assert.deepEqual(info['UISupportedInterfaceOrientations~ipad'],orientations);assert.equal(info.UIRequiresFullScreen,true);
 const scene=await readFile(new URL('ios/App/App/SceneDelegate.swift',native),'utf8');assert.match(scene,/rootViewController = MamoKenViewController/);assert.match(scene,/supportedInterfaceOrientations: UIInterfaceOrientationMask \{ \.landscape \}/);
 const privacy=plist.parse(await readFile(new URL('ios/App/App/PrivacyInfo.xcprivacy',native),'utf8'));assert.equal(privacy.NSPrivacyAccessedAPITypes[0].NSPrivacyAccessedAPIType,'NSPrivacyAccessedAPICategoryUserDefaults');assert.deepEqual(privacy.NSPrivacyAccessedAPITypes[0].NSPrivacyAccessedAPITypeReasons,['CA92.1']);
 const project=xcode.project(fileURLToPath(new URL('ios/App/App.xcodeproj/project.pbxproj',native)));project.parseSync();assert.ok(project.hasFile('PrivacyInfo.xcprivacy'));
 const pbx=await readFile(new URL('ios/App/App.xcodeproj/project.pbxproj',native),'utf8');assert.match(pbx,/PrivacyInfo\.xcprivacy in Resources/);assert.ok(!pbx.includes('= undefined;'));
});
test('native config has fixed origin and no remote app server; all direct dependencies and Swift core pinned',async()=>{
 const config=JSON.parse(await readFile(new URL('capacitor.config.json',native),'utf8')),pkg=JSON.parse(await readFile(new URL('package.json',native),'utf8')),lock=JSON.parse(await readFile(new URL('package-lock.json',native),'utf8'));
 assert.equal(config.server.url,undefined);assert.equal(config.server.hostname,'localhost');assert.equal(config.server.iosScheme,'capacitor');assert.equal(config.webDir,'www');
 for(const [name,version]of Object.entries({...pkg.dependencies,...pkg.devDependencies})){assert.match(version,/^\d+\.\d+\.\d+$/);assert.equal(lock.packages['node_modules/'+name].version,version);}
 const swift=await readFile(new URL('ios/App/CapApp-SPM/Package.swift',native),'utf8');assert.ok(swift.includes('exact: "'+pkg.dependencies['@capacitor/core']+'"'));assert.ok(swift.includes('path: "../../../node_modules/@capacitor/app"'));assert.ok(swift.includes('path: "../../../node_modules/@capacitor/preferences"'));
});
test('configuration is repeatable and never edits signing/scene settings on successive runs',async()=>{
 const paths=['ios/App/App/Info.plist','ios/App/App/SceneDelegate.swift','ios/App/App/PrivacyInfo.xcprivacy','ios/App/App.xcodeproj/project.pbxproj'];
 const before=await Promise.all(paths.map(p=>readFile(new URL(p,native),'utf8')));
 execFileSync(process.execPath,[fileURLToPath(new URL('tools/configure-ios.mjs',native))],{cwd:fileURLToPath(native),stdio:'pipe'});
 const after=await Promise.all(paths.map(p=>readFile(new URL(p,native),'utf8')));assert.deepEqual(after,before);
});
