# Codexへの依頼：戦闘ボタン6個と上部HUDを v2 ビジュアルにする

このファイルをそのままCodexへ渡す。仕様の正本は `docs/ui-bible/20_battle_visual_v2.md`。

## 前提
- ブランチ：`feat/mamoken-matte-battle-ui`（Draft PR #230）の上に、このデザインPRの変更を取り込んだ状態から始める。新しいブランチで作業し、Draft PRにする。**mainにはマージしない。**
- 素材はできている：`exp/fable-3d/shared-ui/battle-control-art-v2.js`（データ）と `exp/fable-3d/shared-ui/matte-battle-v2.css`（参照CSS）。この2ファイルは**中身を変えずに**使う。直す必要を見つけたら、変えずに理由をPRに書く。
- ローカルで起動するときは、先に `node exp/fable-3d/dojo/pack-showtime.mjs` を1回実行する（`*_animations.glb` は生成物）。

## やること（この順）
1. `exp/fable-3d/dojo/index.html` と `exp/fable-3d/story/index.html`：`matte-battle.css` の `<link>` の直後に `<link rel="stylesheet" href="../shared-ui/matte-battle-v2.css">` を足す。
2. `exp/fable-3d/shared-ui/battle-ui.js`
   - import を `import {battleControlArtV2 as battleControlArt, readyFlame} from './battle-control-art-v2.js';` に変える。
   - `battleControlsMarkup()`：`<span class="attack-art" aria-hidden="true">` の中身を `${art.svg}<span class="attack-label">${b.label}</span>` にする。それ以外（`button` の属性、`style="${art.style}"`、`<small id=status>`）は変えない。
   - `battleHUDMarkup()`：HP の `<i id="hp-${i}"></i>` の直後に `<b class="guard-line" id="guard-line-${i}" data-full aria-hidden="true"></b>` を足す。
   - `updateBattleHUD()`：`for(let i=0;i<2;i++)` の中に足す。
     ```js
     const g=find('guard-line-'+i);
     if(g){const v=clamp(p.guard/r.guardMax*100,0,100);g.style.width=v+'%';g.toggleAttribute('data-full',v>=100);}
     ```
3. `exp/fable-3d/shared-ui/battle-control-art.js` を削除する。`grep -rn "battle-control-art'" exp/fable-3d` が0件になること。
4. `exp/fable-3d/shared-ui/matte-battle.css` から、旧ボタンの色・押下の規則だけを消す：
   - 消す：`.attack { --art-rim… }`、`.attack-rim`／`.attack-face`／`.attack-edge` の `fill`、`.attack[data-wait]`、`.attack[data-ready]`、`.attack.held`（色変数）、`.attack.held :is(.attack-edge,.attack-label)` と、その `prefers-reduced-motion` 版、`.attack[data-ready] .attack-edge`、`.attack:focus-visible .attack-rim`、`.attack-label` の位置・フォント指定（v2 で視覚的に隠す）。
   - **残す**：`button.attack[data-control]` の位置・寸法・`min-*`・`transform`、`.gyuiin` の `--hit-offset` と `margin-top`、`.attack-art` の寸法と位置、`.attack-art svg`、`.attack.heavy`／`.attack.special` の `clip-path`、`.attack:focus-visible { clip-path:none }`。HUDの規則は v2 が上書きするので、今回は消さなくてよい。
5. 技表 `#commands-help`（dojo と story の両方）の `#button-guide` の直後に1行足す：
   `<small>ゲージ：長い緑＝体力／金の5ブロック＝奥義（満タンでXが金色）／青緑の10セル＝Drive（Zと咆哮で消費）／体力の下の白線＝ガード</small>`
6. テスト（下記）を足し、既存テストを通す。

## してはいけないこと
- `button[data-control]` の位置・寸法・`clip-path`・`margin`・`transform` を変えない。当たり判定は PR #230 と同じでなければならない。
- `BATTLE_INPUT_PROFILE`・`keyMap`・`data-control` の値・`.held` を付ける処理（`dojo/main.js`・`story/main.js`）・戦闘ルール・保存形式・カメラを変えない。
- 画面の記号（A/B/X/Y/Z/S）と物理キー（Z=弱、X=強、V=掴み、N=ギュイーン、B=必殺、M=奥義）を対応づけるコードを書かない。別物として扱う。
- HUDのDOM id（`hp-*`、`meter-*`、`drive-*`、`super-value-*`、`drive-value-*`、`ultimate-ready-*`、`guard-value-*`、`name-*`、`ability-*`、`trait-*`、`charge-pips-*`、`hud-eye-*`、`hud-side-*`、`timer`、`round-message`）を消したり名前を変えたりしない。
- ボタンに半透明・ぼかし・光沢グラデーションを足さない。READY演出をループさせない（炎の揺れを除く）。

## テスト
`exp/fable-3d/dojo/acceptance/matte-battle-browser.mjs` に足す（既存の5条件ループと6操作ループの中で）：
1. 当たり判定：5条件それぞれで全 `[data-control]` の矩形が `design/battle-ui-v2/evidence/hit-area-report.json` の `before[条件名]` と ±0.01px 以内。条件名の対応：`landscape-852`→`852x393`、`landscape-720`→`720x320`、`notch-left-720`、`notch-right-720`、`portrait-393`。
2. 層：各ボタンに `svg.bt` が1つ。`.bt-base`、`.bt-rim`、`.bt-face`、`.bt-dish`、`.bt-glyph-ink` が各1つ。S に `.bt-core`・`.bt-ticks`、X/Y に `.bt-groove`、Z に `.bt-pip` が2つ、X に `.bt-ring`。
3. 状態の色（`getComputedStyle(face).fill`）：
   - X 奥義<100（`data-wait`）＝`rgb(52, 50, 74)`、奥義100（`data-ready`）＝`rgb(216, 155, 36)` かつ `.bt-ring` の `opacity` が `1`
   - Z Drive<60＝`rgb(51, 57, 63)`、Drive100＝`rgb(47, 111, 134)`
   - A 押下中（touchStart直後）＝`rgb(104, 47, 38)`、`.bt-body` の `translate` が `0px 3px`
4. 重なり：横長4条件で、`max(#hud-side-0, #hud-side-1 の bottom)` < `[data-control=ultimateButton]` の `top`。
5. 隠したラベル：`#hud-side-0 .resource>span` の `getBoundingClientRect().width` が 1 以下、`textContent` は空でない。
6. ガード線：`mamoken3d.battle.fighters[0].guard` を `guardMax` の半分にしたら `#guard-line-0` の `style.width` が `50%`、満タンなら `data-full` がある。
7. モーション軽減時：`#ultimate-ready-0 svg` と X の `.bt-ring` の `animationName` が `none`。

既存の更新が必要なテスト：旧クラス `.attack-rim`／`.attack-edge` を参照している `native/test/browser.mjs`（デザインPR時点の grep で該当はこの1件）。念のため `grep -rn "attack-rim\|attack-edge\|attack-label\|battle-control-art" exp/fable-3d native` で洗い出す。

## 完了の条件
- `docs/ui-bible/20_battle_visual_v2.md` §7 のチェックリストの自動項目がすべて通る。
- Dojo・共通UI・Story・native のNodeテストと、GitHub ActionsのWebGL・P4回帰が成功する。
- PR本文に、852×393・720×320・奥義READY・押下中の画面（Dojo と Story）を載せる。目視項目（物理iPhoneでの押し心地など）は「未実施」と書く。
