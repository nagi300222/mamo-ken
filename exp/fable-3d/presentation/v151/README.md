# マモ拳 v15.1 Presentation（Issue #201・Claude 制作）

VS 画面 → 顔アップ → FIGHT → K.O. スロー → 9体別の勝利ムービー → 結果。ベースは統合 Draft PR #199（`78dd0c6`）。
元9GLB・既存の9奥義／27必殺／54通常技／Practice／横持ちは変更しない。`Battle`（60Hz・単一正本）にも触れない。

## 状態遷移
`SELECT → VS → FACE INTRO → FIGHT → (奥義ムービー) → KO/TIME UP → (NEXT ROUND | VICTORY) → RESULT`

| ファイル | 役割 |
|---|---|
| `dojo/presentation-flow.js` | 表示側の状態機械（純ロジック）。「Battle を進めてよいか」「表示クロックの倍率」を返すだけ |
| `dojo/presentation-data.js` | 9体の勝利ムービー（題・台詞・光・カメラ・音・揺れ）、顔アップ、VS の文言。編集はここ |
| `dojo/main.js` の Presentation ブロック | DOM／Three.js への接続。VS、顔アップ用と勝利用の透視カメラ、KO の寄りとスロー |
| `tools/mamo3d/motions_v151.py` | 勝利モーション 9 本の編集正本（Blender 用の手続き的ポーズ） |
| `tools/build_victory.py` | 元 `.blend` のリグへ焼いて `presentation/v151/<id>_victory.glb`（アニメ専用 GLB）を書き出す |
| `presentation/v151/victory_motions.json` | クリップの長さ・見せ場のフレーム・短縮版の開始位置 |

- **Battle は減速しない。** KO が確定した後、役者のミキサーとエフェクトだけを `flow.koSlow` 倍で進める（静止 0.28 秒 → 0.22 倍 → 等速）。
  攻撃側の振り抜きは、確定済みの `fighter.frame` に表示専用の仮フレームを足した写しを `syncActor` に渡して続ける（`battle.tick` は呼ばない）。
- **KO は 1 回だけ。** `hud()` が毎フレーム報告しても `flow.roundEnd()` は `fight` のときに 1 度だけ受理する。奥義 KO は 10 秒ムービーが終わってから。
- **入力解禁は FIGHT 表示の後。** 導入・KO・勝利中はスティックとボタンを受けず、解禁時に押しっぱなしを捨てる。
- **スキップ**：VS はロード完了後（0.9 秒以降）、顔アップは FIGHT 表示へ、KO と勝利は次の状態へ。Battle が先へ進むことはない。
- **低刺激**（OS の動き軽減／演出 小）：KO スロー・寄り・揺れなし、顔アップは寄りの動きなしで短縮。
- **プラクティス／演出確認（`?check=1`）**：VS と顔アップを通らず、ロード完了ですぐ操作可能（従来どおり）。
- **勝利クリップは勝者専用の新規制作**（`victory_v151`）。敗者用の `ko` は流用しない。読み込めないときは勝利ムービーを飛ばして結果へ進み、コンソールに警告を出す。

## 連戦コントローラ（#202）との接点
```js
mamoken3d.startMatch({ ids:[p1,cpu], level, round, roundLabel, victoryVariant:'full'|'short', vsVariant:'full'|'short',
  carryHp:[p1Hp,cpuHp], instant, onRoundEnd, onNextRound, onResult, onRematch });
// onRoundEnd({winner, reason:'ko'|'double_ko'|'timeout'|'timeout_draw', round, viaUltimate})
//   → 'nextRound' | 'victory' | 'result'（または {next, victoryVariant}）。省略時は「勝者がいれば victory、引き分けは result」
mamoken3d.nextRound({ round, roundLabel, carryHp, level, face });   // await_round のとき、同じ2体で新しい Battle を作って短い導入へ
mamoken3d.presentation   // {state, time, context, log, loaded, inputEnabled, koSlow, camera, victoryClip, victoryTime}
mamoken3d.skipPresentation(); mamoken3d.setRoundHook(fn);
```
勝利ムービーは通常対戦でフル版（約 5 秒）、`victoryVariant:'short'` で後半の決めだけ（約 2.2〜3.4 秒）。アーケードはマッチ勝利時だけ `victory` を返す想定。

## 再生成
```bash
python3 exp/fable-3d/tools/build_victory.py            # 9体（1体は --only godan）
npm --prefix exp/fable-3d/dojo test
npm --prefix exp/fable-3d/dojo run build:pages
```
`build_victory.py` には Blender の `bpy` が必要（`pip install bpy scikit-image scipy xatlas pillow numpy`）。

## 未完（このPRへ追記）
- 9本の勝利ムービーのカメラ・ポーズの仕上げと、60fps・実時間速度の映像
- 実 WebGL Chromium での受入テスト（横画面・縦回転ロック・タッチ・低刺激・スキップ・時間切れ・ダブルKO・奥義KO・CPU勝利）
