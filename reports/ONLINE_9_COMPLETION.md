# ONLINE-9 Completion Report — 全9キャラのオンライン解禁

## 前提確認

BAL-R1・BAL-R1.1・CMD-R1 は全てマージ済みの最新main(`d3fa85fc63e117a5b5adab5c40a744199f9320db`、G02マージ後)から
`feature/online-roster9` を分岐して作業した。G02は本タスクの前提条件には含まれていない
(ONLINE-9の前提テキストは「BAL-R1・BAL-R1.1・CMD-R1」のみを列挙)が、結果的にG02マージ後のmainから
分岐しても支障はない(G02はshadow_onlyでprototype/dist等に触れていないため)。

## 実装内容

### (1) 全9キャラのonlinePlayableをtrueへ変更

`prototype/mamoken_prototype_v01.html` の `ROSTER` 配列で、hakuma/chirka/takimaru/yomikage/bullet/dark_moguzo の
`onlinePlayable` を `false` → `true` に変更(既存3体は元々true)。

**ダークモグゾーのBossRuleSet無参照の保証**: 実コードを調査した結果、`BossRuleSet` という型・オブジェクトは
`prototype/` `server/` `src/` のいずれにも一切存在しない(design docsにのみ登場する設計概念)。dark_moguzoは
`CHARS`/`ROSTER`/`BAL_R1_CHARS`/`BAL.CMD.moves` の全てで他8体と全く同じフィールド形状を持ち、専用のボス統計
ブロックやランタイムの補正分岐は存在しない。唯一の関連物は `src/core/cpu.ts` の `DARK_MOGUZO_BOSS_OVERRIDES`
(CPU AIの反応遅延・行動重みだけを調整する shadow-only の一覧で、live prototypeからは一切import/参照されていない
死コード)。この事実は grep による確認結果であり、コード変更は不要(元から参照されていない)。テストでの保証は
下記「検証」節に記載。

### (2) ロビー/オンラインキャラ選択を9体表示に更新

- `onlineSelectPress`/`rOnlineSelect` の `for(let i=0;i<3;i++)` ハードコード制限を `i<9` に変更。
- 旧 `selRect(i)` (3枚縦カード、オンライン専用の1列3行レイアウト)を廃止し、新設の `onlineSlotRect(i)`
  (画面幅いっぱいの3x3グリッド)に置き換えた。offline選択の `slotRect`/`SELECT_GRID_BOX` とは別ジオメトリ
  (offline側は左に大型立ち絵パネルがあるため専有幅が狭く、online選択には立ち絵パネルが無いため画面幅を
  そのまま3x3グリッドに使える)。
- 青ドット(オンライン対戦可の表示)は元からロジック変更不要(`entry.onlinePlayable` を見るだけで、(1)の
  データ変更により自動的に全員へ表示される)。凡例テキストを「●青=オンライン対戦可(モグゾー/ピスケ/ゴダン)」
  →「●青=オンライン対戦可(全員可)」に変更。
- **ビルド識別子によるバージョン不一致対策**: `BUILD_ID` という手動採番の版数タグ定数を新設。ルーム確立時
  (`welcome`受信直後、既存のRTT計測ping送信と同じタイミング)に `{t:'hello',buildId:BUILD_ID}` を相手へ送信する。
  `server/`(`worker.mjs`)は`matchOver`/`ping`以外の全メッセージ種別の意味を解釈せずそのまま中継するだけなので、
  **この機能はサーバー変更なしでクライアント側だけで実装できる**(実際に `git diff main -- server` は無変更)。
  相手の `buildId` が自分のものと不一致なら `onlineVersionMismatch()` を呼び、既存の `onlineInterrupted` 画面へ
  「バージョンが違います。ページを更新してください」を表示して対戦を開始しない。`maybeStartOnlineBattle()` にも
  同じ判定を保険として追加(相手のbuildId未着ならまだ開始しない/不一致なら同様に停止する)。
  `BUILD_ID`は手動で採番する文字列であり、今後オンライン同期仕様やロスターに互換性を破る変更を配布する際は
  発注者側で値を更新する運用を前提とする(自動的なコンテンツハッシュ生成は本タスクのスコープ外として見送った。
  理由: `tools/build_mobile.mjs` へのビルド時ハッシュ注入は実現可能だが、「検出+表示+開始しない」という受け入れ
  条件に対して手動採番の文字列で十分であり、ビルドスクリプトの変更を伴う実装は本タスクの本質的スコープを
  超えると判断したため)。

### (3) 決定論回帰(受け入れ条件の中核)

実際のオンラインlockstepコードパス(`startOnlineBattle`/`netLogicTick`)を、2つの独立したPlaywrightページ
(それぞれ独立したJSグローバル状態=B/NET/online/game)で駆動し、`netSend({t:'cmd',...})` の中継をNode側で
模擬した(サーバーはメッセージの意味を解釈せずそのまま中継するだけのため、この模擬は実際のWSリレーと機能的に
同一)。ページ自前の `requestAnimationFrame` メインループが `logic()`(オンライン中は`netLogicTick()`)を
実時間で自動的に呼び続けてしまう問題を発見し、`window.logic` をno-opへ差し替えることでテスト側の手動駆動のみ
が唯一の時間源になるよう修正した(この修正自体はテストハーネス側の問題であり、prototypeへの変更ではない)。

9キャラの周回ペア(サイクルグラフ、各キャラが必ず2試合登場)に対し、同一seed・同一入力列を両インスタンスへ
与え、20フレームごとの状態(B.f/flow/round/wins/timer/各fighterのhp/phase/pf/combo/s/ult/landedHit/cmdMove名)
をハッシュ化して比較した。入力列はコマンド技(2方向+トリガー)・通常技連打(chain)・見切り・投げ・回避(3種)・
咆哮・奥義・同時攻撃によるギュイーン誘発を、奇数/偶数インデックスのマッチアップで分担して全て網羅した
(咆哮・奥義発動直前にS/ultゲージを両インスタンスへ同一の値で直書きし、ゲージ蓄積に数百フレームを要する
ことを回避した — 両インスタンスへ全く同一の操作を行っているため決定論検証の妥当性に影響しない)。

**結果(same seed same input → same hash、全て一致)**:

| # | マッチアップ | 網羅した機構 | hashA | hashB | 判定 |
|---|---|---|---|---|---|
| 1 | moguzo vs pisuke | コマンド技/通常技/投げ/回避/見切り + 咆哮 + 奥義 | `204bddd38c6d` | `204bddd38c6d` | OK |
| 2 | pisuke vs godan | コマンド技/通常技/投げ/回避/見切り + ギュイーン | `ecb6c15c7648` | `ecb6c15c7648` | OK |
| 3 | godan vs hakuma | 同上 + 咆哮 + 奥義 | `34756700a351` | `34756700a351` | OK |
| 4 | hakuma vs chirka | 同上 + ギュイーン | `20cf882ea8e8` | `20cf882ea8e8` | OK |
| 5 | chirka vs takimaru | 同上 + 咆哮 + 奥義 | `632338fa7469` | `632338fa7469` | OK |
| 6 | takimaru vs yomikage | 同上 + ギュイーン | `f92788365cf1` | `f92788365cf1` | OK |
| 7 | yomikage vs bullet | 同上 + 咆哮 + 奥義 | `a4c119caa7d0` | `a4c119caa7d0` | OK |
| 8 | bullet vs dark_moguzo | 同上 + ギュイーン | `8633a23e9972` | `8633a23e9972` | OK |
| 9 | dark_moguzo vs moguzo | 同上 + 咆哮 + 奥義 | `3c10ddbc97c4` | `3c10ddbc97c4` | OK |

9/9 マッチアップ全てで両インスタンスのハッシュが一致(デシンクなし)。9キャラ全員が2試合以上登場
(各キャラちょうど2試合)。固有能力(アイアンウォール/フェイント等)は本タスクでは未実装のままで、
これは投入文の想定通り(「固有能力は本タスクでは未実装のままでよい」)。

### (4) dist再生成

`npm run build:mobile` を実行し `dist/mamoken_mobile.html` を再生成。

## 検証(ローカルCIパリティ)

- 全 `check:*` スクリプト(check:core/ui/roster/roster-full/roster-trial-ui/character-detail/
  character-catalog/command系/combat系/defense/gauge/ability/sprite/cpu/ui-visual-audit/
  core3-seven-move/character-catalog-browser/browser-command-contract/runtime系全て/combat-v2/
  battle-state-v2/legacy-adapter-v2/product): 全てgreen。
- `test/full-roster-art.test.mjs` / `test/roster-trial-select-ui.test.mjs`: 旧「オンラインは既存3体のみ」を
  検証していたアサーションを、ONLINE-9で意図的にリフトされた制限に合わせて更新(9体対応後の
  `onlineSlotRect`/`i<9` ループを検証する内容へ)。
- `test/ui-contract.test.mjs` / `src/core/ui-contract.ts` / `src/core/ui-types.ts`: shadowのUI契約層が
  `onlinePlayableCount:3` を保持していたため、ライブ実装との整合を保つため `9` へ更新(この契約層は
  live prototypeからimportされないが、ライブ実装のドキュメント役を担っているため追従させた)。
- `node tools/audit_current_impl.mjs`(ビルド前後2回)+ `git restore` で生成物を復元、`distContractChecks`
  全てtrue。
- `git diff --exit-code main -- runtime server assets src/product design/product`: 無変更を確認
  (サーバー変更なし。デプロイ待ちは発生しない)。
- Playwrightでのオンライン選択画面・バージョン不一致画面のスクリーンショット確認: 9キャラグリッド表示、
  青ドット、選択ハイライト、エラー画面とも正常表示、JSエラーなし。

## 変更ファイル

```text
prototype/mamoken_prototype_v01.html   (ROSTER onlinePlayable/BUILD_ID/hello handshake/online select grid)
dist/mamoken_mobile.html               (再生成)
src/core/ui-contract.ts                (onlinePlayableCount 3→9)
src/core/ui-types.ts                   (onlinePlayableCount 3→9)
test/ui-contract.test.mjs              (追従)
test/full-roster-art.test.mjs          (旧3体限定アサーションを更新)
test/roster-trial-select-ui.test.mjs   (旧3体限定アサーションを更新)
reports/ONLINE_9_COMPLETION.md         (本報告書)
```

`runtime/` `server/` `assets/` `src/product/` `design/product/` は無変更。

## 停止(マージ前の実機確認待ち)

投入文の明示的指示により、本タスクはCI状況に関わらずマージ前に必ず停止し、発注者の実機2台での
オンライン対戦確認(デシンク・バージョン照合の実地検証)を待つ。上記の決定論回帰は2つの独立した
ブラウザインスタンスによるシミュレーションであり、実際のWebSocketリレー(本番Workers URL)・
実機2台での往復遅延・実際のバージョン不一致(異なるBUILD_IDを持つ2つのビルドを同時に動かす)は
未検証。
