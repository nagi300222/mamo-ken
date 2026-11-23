import {readFile,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import plist from 'plist';
import xcode from 'xcode';
const app=new URL('../ios/App/App/',import.meta.url);
const file=new URL('Info.plist',app);
const config=plist.parse(await readFile(file,'utf8'));
const orientations=['UIInterfaceOrientationLandscapeLeft','UIInterfaceOrientationLandscapeRight'];
// Repair only incorrectly nested orientation/status keys from an early local
// generator attempt; UIKit reads these at the top level, never per scene.
function cleanScene(value){if(!value||typeof value!=='object')return;for(const key of ['UIRequiresFullScreen','UIStatusBarHidden'])delete value[key];for(const child of Object.values(value))cleanScene(child);}
cleanScene(config.UIApplicationSceneManifest);
config.UISupportedInterfaceOrientations=orientations;config['UISupportedInterfaceOrientations~ipad']=orientations;
config.UIRequiresFullScreen=true;config.UIStatusBarHidden=true;
await writeFile(file,plist.build(config)+'\n');
const delegateFile=new URL('SceneDelegate.swift',app);let delegate=await readFile(delegateFile,'utf8');
delegate=delegate.replace('window?.rootViewController = CAPBridgeViewController()','window?.rootViewController = MamoKenViewController()');
if(!delegate.includes('class MamoKenViewController'))delegate+=`

// UIKit, rather than browser CSS, owns landscape orientation in the installed app.
final class MamoKenViewController: CAPBridgeViewController {
    override var supportedInterfaceOrientations: UIInterfaceOrientationMask { .landscape }
    override var preferredInterfaceOrientationForPresentation: UIInterfaceOrientation { .landscapeRight }
    override var shouldAutorotate: Bool { true }
    override var prefersStatusBarHidden: Bool { true }
}
`;
await writeFile(delegateFile,delegate);
// The explicit UserDefaults reason belongs to this app's local save backup.
const privacy=`<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
<key>NSPrivacyTracking</key><false/>
<key>NSPrivacyCollectedDataTypes</key><array/>
<key>NSPrivacyAccessedAPITypes</key><array><dict>
<key>NSPrivacyAccessedAPIType</key><string>NSPrivacyAccessedAPICategoryUserDefaults</string>
<key>NSPrivacyAccessedAPITypeReasons</key><array><string>CA92.1</string></array>
</dict></array>
</dict></plist>\n`;
await writeFile(new URL('PrivacyInfo.xcprivacy',app),privacy);
const projectFile=new URL('../App.xcodeproj/project.pbxproj',app),project=xcode.project(fileURLToPath(projectFile));
project.parseSync();
if(!project.hasFile('PrivacyInfo.xcprivacy')){
 const group=project.findPBXGroupKey({path:'App'});
 if(!group)throw Error('Missing native App resource group');
 project.addResourceFile('PrivacyInfo.xcprivacy',{target:project.getFirstTarget().uuid},group);
}
const privacyReference=project.hasFile('PrivacyInfo.xcprivacy');
privacyReference.lastKnownFileType='text.xml';
for(const [key,value]of Object.entries(privacyReference))if(value===undefined||value==='undefined')delete privacyReference[key];
await writeFile(projectFile,project.writeSync());
// CLI resolves symlinked npm installs to their physical worktree. Keep this
// generated source portable when a local QA checkout reuses node_modules.
const swiftPackage=new URL('../CapApp-SPM/Package.swift',app);
let swift=await readFile(swiftPackage,'utf8');
for(const [name,folder]of [['CapacitorApp','app'],['CapacitorPreferences','preferences']]){
 const pattern=new RegExp('\\.package\\(name: "'+name+'", path: "[^"]+"\\)');
 if(!pattern.test(swift))throw Error('Missing native plugin package: '+name);
 swift=swift.replace(pattern,'.package(name: "'+name+'", path: "../../../node_modules/@capacitor/'+folder+'")');
}
await writeFile(swiftPackage,swift);
console.log('Configured iPhone/iPad landscape and local-save privacy manifest; signing untouched.');
