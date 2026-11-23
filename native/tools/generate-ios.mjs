import {access} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
const native=new URL('../',import.meta.url),cli=new URL('node_modules/@capacitor/cli/bin/capacitor',native);
execFileSync(process.execPath,[fileURLToPath(new URL('tools/build-native.mjs',native))],{cwd:fileURLToPath(native),stdio:'inherit'});
let existing=true;try{await access(new URL('ios/App/App.xcodeproj/project.pbxproj',native));}catch{existing=false;}
execFileSync(process.execPath,[fileURLToPath(cli),existing?'sync':'add','ios'],{cwd:fileURLToPath(native),stdio:'inherit'});
execFileSync(process.execPath,[fileURLToPath(new URL('tools/configure-ios.mjs',native))],{cwd:fileURLToPath(native),stdio:'inherit'});
