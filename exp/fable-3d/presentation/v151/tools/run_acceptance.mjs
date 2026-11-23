#!/usr/bin/env node
// 受入テストをローカルで回す: リポジトリを配信して dojo/acceptance/v151-presentation-browser.mjs を実行する。
//   node run_acceptance.mjs [--root exp/fable-3d/_pages（Pages ビルド成果物で回すとき）] [--evidence DIR] [--test FILE]
import { spawn } from 'node:child_process'; import path from 'node:path'; import { serve, arg, REPO, FABLE } from './lib.mjs';
const root = arg('root', null) ? path.resolve(String(arg('root'))) : REPO; const pages = root !== REPO;
const { srv, url } = await serve(root);
const test = path.resolve(String(arg('test', path.join(FABLE, 'dojo/acceptance/v151-presentation-browser.mjs'))));
const child = spawn(process.execPath, [test], { stdio: 'inherit', env: { ...process.env, MAMOKEN_URL: url + (pages ? '/dojo/' : '/exp/fable-3d/dojo/'), CHROMIUM_PATH: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium', MAMOKEN_EVIDENCE: path.resolve(String(arg('evidence', path.join(FABLE, '_scratch/p151/acceptance')))) } });
child.on('exit', code => { srv.close(); process.exit(code ?? 1); });   // 同期実行だと配信サーバが応答できないので非同期で待つ
