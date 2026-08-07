# BGM-R1.2 完了報告 — BGM再生のWeb Audio統一（OSメディアコントロール非表示化）

OWNER: FABLE5_CODE
branch: `feature/bgm-r1-2-webaudio`（VIS-R1マージ後のmain SHA `84b8c3f311367a45ab28ae160f5130ea26b01202`から分岐）

発注者フィードバックへの対応: iPhoneで通知センターを降ろすと再生ボタン・曲名が表示されていたのは、
タイトル/選択BGMがHTMLAudioElementで再生されていたためOSがメディアプレーヤーとして認識していたことが
原因。今回タイトル/選択BGMも闘技場と同じWeb Audio API経路（decodeAudioData→AudioBufferSourceNode+
GainNode）に統一し、HTMLAudioElementベースのBGM再生コードを完全に撤去した。

## 1. scoped diff

| ファイル | 内容 |
|---|---|
| `prototype/mamoken_prototype_v01.html` | BGM管理セクション全体を書き換え。旧タイトル/選択のHTMLAudioElement実装+闘技場専用Web Audio実装(R2)を、`BGM_SOURCES`/`bgmBuffers`/`bgmGainNode`/`bgmSrcNode`/`bgmLoadStart()`/`bgmEnsureGain()`/`bgmStop()`/`bgmPlay()`による単一のWeb Audio経路に統一。`visibilitychange`ハンドラ新設(suspend/resume安全性)。`SE_VOLUME`新設+`tone()`/`noiseS()`へ適用。`?debug=bal`限定のBGM/SE音量スライダーUI新設 |
| `tools/build_bgm_b64.mjs`（新規） | 旧`tools/build_arena_bgm_b64.mjs`(闘技場単独)を置き換え、タイトル/選択/闘技場3曲分のbase64を`window.__BGM_B64__`(辞書形式)として`runtime/bgm-b64.js`に生成 |
| `runtime/bgm-b64.js`（新規、生成物） | 旧`runtime/arena-bgm-b64.js`を置き換え |
| `tools/build_arena_bgm_b64.mjs`/`runtime/arena-bgm-b64.js`（削除） | 全曲統一の上記2ファイルに一本化されたため撤去 |
| `tools/build_mobile.mjs` | `<script src>`除去対象タグを`bgm-b64.js`に更新（distは`__ASSET_MAP__`側の埋め込みを使うため元々不要な処理は変更なし） |
| `dist/mamoken_mobile.html` | 上記変更を反映して再生成 |

`src/core/*`・`server/*`・`test/*`は無変更（`git diff HEAD -- src/core server test`で確認済み）。
ゲームロジック・当たり判定・オンライン同期・戦闘バランス（BAL-R1）には一切触れていない。

## 2. (1)(2) Web Audio統一 + HTMLAudioElement撤去

旧arena専用実装（`arenaBuffer`/`arenaGainNode`/`arenaSrcNode`/`arenaBgmLoadStart()`/`arenaEnsureGain()`/
`arenaBgmStart()`/`arenaBgmStop()`）をキー付き（`key: 'title'|'select'|'arena'`）に一般化し、旧タイトル/
選択の`bgmEls`(HTMLAudioElement)・`BGM_TRACKS`・`bgmAssetSrc()`は完全に削除した。

- `BGM_SOURCES`: 3曲すべてのキー→アセットパスのマップ（旧`ARENA_BGM_SRC`を統合）
- `BGM_LOOP_START`: イントロ+ループが必要な曲のみ指定する疎マップ（`{arena:11.584}`）。無指定キー
  （title/select）は`AudioBufferSourceNode.loop=true`のみでフルトラックループする
- `bgmBuffers{}`/`bgmBufferLoading{}`: 3曲共通のデコード済みAudioBufferキャッシュ
- `bgmGainNode`/`bgmSrcNode`/`bgmCurrentKey`/`bgmPlaying`: 3曲共通の再生状態（単一のGainNode/
  SrcNode参照のため、構造上二重再生は発生しない）
- `bgmStop()`/`bgmPlay(key)`: 全曲で同一のAudioBufferSourceNode生成/破棄パスを通る単一実装

`BGM_SCREEN_MAP`・`bgmSyncToScreen()`・二重再生防止（同一曲・再生中は再スタートしない）・
画面遷移時の後始末は既存仕様のまま無変更（差分箇所の前後をdiffで確認済み）。

`base64→ArrayBuffer`基盤（loopStart実装時のもの）と`<script src>`経由のCORS回避策
（`window.__BGM_B64__`）は既存のものをそのまま再利用し、辞書形式（曲キー付き）に拡張した。
dist埋め込み時は既存の`__ASSET_MAP__`データURL解決を画像と同じ仕組みで使う（`bgmLoadStart()`の
dataSrc解決が`__ASSET_MAP__`→`window.__BGM_B64__`の順にフォールバックする、`loadImg()`と同じパターン）。

## 3. (3) autoplay制限・suspend/resume安全性

既存のユーザー操作によるAudioContext有効化（`pressRoute(p)`内の`audioInit()`→`bgmSyncToScreen()`呼び出し）
は無変更のまま維持。

新設した`visibilitychange`ハンドラは、画面が再表示された際に必ず以下を行う:
1. `AC.state==='closed'`（稀なケース: 長時間バックグラウンドでcontextが破棄された場合）→ `AC`/
   `bgmGainNode`を再生成対象としてnull化
2. `AC.state==='suspended'`→ `resume()`
3. 常に一旦`bgmStop()`してから`bgmSyncToScreen()`で再評価（インメモリの`bgmPlaying`/`bgmCurrentKey`
   フラグは外部要因でAudioBufferSourceNodeが破棄されたケースを検知できないため、明示的に停止→
   再開示させることで二重再生・無音固着の両方を防ぐ）

Playwrightで`document.visibilityState`/`hidden`を偽装+`AC.suspend()`でバックグラウンド遷移を再現し、
復帰後に`AC.state`が`'running'`へ復帰・BGMが単一の新規SrcNodeで再スタートすることを確認した
（詳細は5節）。

## 4. (4) 音量経路の一本化 + デバッグUI

`BGM_VOLUME`(初期値0.35、据え置き)は`bgmEnsureGain()`内で単一の`bgmGainNode.gain.value`に適用され、
全曲共通に効く（旧実装ではHTMLAudioElement.volumeとGainNode.gainの2箇所に分散していた）。

新設`SE_VOLUME`（初期値1.0=既存バランスのまま）を`tone()`/`noiseS()`のgain設定行に乗算する形で追加。
既存の各SE呼び出し（`sfx()`内の全パターン）の個別`vol`値は無変更。

`?debug=bal`限定のデバッグUI（`#debugAudioPanel`、canvas上に絶対配置したHTMLオーバーレイ）を新設。
BGM/SE音量の`<input type=range>`スライダー+現在値表示を追加し、スライダー操作で即座に
`BGM_VOLUME`/`SE_VOLUME`（再生中は`bgmGainNode.gain.value`も直接）を更新する。通常プレイ
（`?debug=bal`無し）では`display:none`のまま非表示。最適値の探索は発注者が実機で行い、
数値が確定した時点で後続コミットで初期値を定数化する想定（今回は仕組みのみ導入）。

## 5. 検証

### 5.1 ローカルCI相当チェック（全緑）

`npm run check:*`全項目 + `node tools/audit_current_impl.mjs`(build前後) + `npm run build:mobile` +
`git diff --exit-code -- dist/mamoken_mobile.html`（distの再現性）+ 監査ファイルのrestore +
`git diff --exit-code -- index.html server assets prototype dist runtime`（スコープ外差分なし）を
すべて実行し、**ALL GREEN**（実際のGitHub Actions `core-check.yml`と同じ手順・順序で確認）。

### 5.2 Playwright: 全画面遷移 + BGM切替 + suspend/resume

`prototype/mamoken_prototype_v01.html`・`dist/mamoken_mobile.html`の両方で、実クリックによる
gesture解禁→title→select→characterDetail→battle(`startBattle()`で正規に対戦を開始)→pause→
result→onlineLobby→titleの一連の画面遷移を行い、以下を確認（**JSエラー0件、両ファイルとも**）:

| 画面 | 期待するBGM | 確認結果 |
|---|---|---|
| title（実クリックでgesture解禁直後） | title、フルトラックloop | `bgmCurrentKey:"title"`, `loop:true`, `loopStart:0` ✅ |
| select | select、フルトラックloop | `bgmCurrentKey:"select"`, `loop:true`, `loopStart:0` ✅ |
| characterDetail | select維持 | `bgmCurrentKey:"select"`（切替なし） ✅ |
| battle | arena、イントロ+loop | `bgmCurrentKey:"arena"`, `loopStart:11.584`, `loopEnd:124.72...`(=バッファ長) ✅ |
| pause | arena維持 | `bgmCurrentKey:"arena"`（切替なし） ✅ |
| result | 停止 | `bgmCurrentKey:null`, `bgmPlaying:false`, `bgmSrcNode:null` ✅ |
| onlineLobby | 現状維持（専用曲なし） | 停止状態のまま ✅ |
| title（再訪） | title再スタート | `bgmCurrentKey:"title"`, `bgmPlaying:true` ✅ |

suspend/resume安全性: `document.visibilityState`を`'hidden'`に偽装+`AC.suspend()`でバックグラウンド
遷移を再現後、`'visible'`に戻すイベントを発火 → `AC.state`が`'suspended'`→`'running'`に復帰し、
titleBGMが単一の新規SrcNodeで正常に再スタート（二重再生・無音固着なし）。

### 5.3 Playwright: デバッグUI

- 通常プレイ（`?debug=bal`なし）: `#debugAudioPanel`は`display:none`（非表示）✅
- `?debug=bal`指定時: パネル`display:block`（表示）✅
- BGMスライダーを0.35→0.10へ操作 → `BGM_VOLUME===0.10`、再生中の`bgmGainNode.gain.value`も即時
  0.10へ反映、表示テキストも追従 ✅
- SEスライダーを1.0→0.50へ操作 → `SE_VOLUME===0.50`、表示テキストも追従 ✅
- JSエラー0件 ✅

### 5.4 iOS実機確認事項（発注者確認）

**以下はこのサンドボックス環境では確認不可能なため、発注者による実機確認が必要**:
- 実iPhoneで通知センター/ロック画面を表示した際に、再生ボタン・曲名が表示されなくなっていること
  （今回のWeb Audio統一により理論上は解消されるはずだが、iOS Safari側のメディアセッション検知の
  実機挙動はシミュレータ/Playwrightでは再現できない）
- BGM/SE音量スライダーで実機上の最適な音量バランスを探索し、数値を報告いただければ後続コミットで
  `BGM_VOLUME`/`SE_VOLUME`の初期値として定数化する

## 6. まとめ

タイトル/選択BGMをHTMLAudioElementからWeb Audio APIへ完全移行し、闘技場と同一の再生経路に統一した。
既存のBGM管理仕様（二重再生防止・切替・後始末・BGM_SCREEN_MAP）はすべて維持し、音量は単一の
GainNodeに一本化。suspend/resume安全性を新設のvisibilitychangeハンドラで確保し、デバッグ用の
BGM/SE音量スライダーを`?debug=bal`限定で追加した。ローカルCI相当チェックは全緑、Playwrightによる
全画面遷移・BGM切替・suspend/resume・デバッグUIの検証もすべてJSエラー0件で完了。iOS実機での
通知センター表示消失の確認と音量最適値の探索は発注者確認事項として残る。
