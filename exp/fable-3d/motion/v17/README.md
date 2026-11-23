# マモ拳 v17 P3｜9体×6通常技と27必殺のモーション・接触データ・キュー（Claude 制作・Issue #212）

> **r2 の追加調整あり（7 本）**: 対空 5 本・ハクマ s3・タキマルしゃがみ強の接触姿勢を直した版を [`../v17r2/`](../v17r2/README.md) に別ファイルで置いた。このフォルダの GLB と表（r1）は変えていない。下の「据え置き 24 本／作り直し 3 本」は r1 の監査としてそのまま。

基準は v16 統合 Draft PR #209（`8ab8972`）。PR #214 の `P3_FIGHT_FEEL_DIRECTION.md` の演技指示に沿って、54 通常技を**元リグへの手付け全身ポーズ**で作り直した素材。
元 9 GLB、既存の 54 本（`normal/v15` の `v15_<slot>`）、27 必殺、約 10 秒の 9 奥義、9 勝利映像、P2 の custom assets には触れていない。ゲーム本体（dojo / story / custom）も変更していない。

## 状態（正直な現在地）
**通常技 54 本（`v17_<slot>`）**
- 方針書の演技指示に沿った手付けの全身ポーズ。9 体とも対戦カメラの静止画（予備・接触・保持の終わり・打ち抜き）で目視し、崩れていた技を手直しした。
- 接触：実ゲームのページ（WebGL）で、元 GLB のスキンメッシュを**正確なクリップ時刻**に置いて全頂点から測り直した（補間なし）。**54/54 が「指定した部位が接触時刻に最前」**（`CONTACT_TABLE_V17.md`）。
  最初の版は 40 分割の線形補間で、鋭い接触の瞬間を最大 4.5cm 外していた（独立 QA の指摘）。いまの値は QA の 3 件（ゴダン立強 0.606、チルカ空強 0.394、ヨミカゲ立強 0.468）と一致する。
- 足接地：地上技 36 本を元リグの FK で点検し、**36/36 で足先の沈みなし・軸足の動き 6cm 以内**（`FOOT_CHECK_V17.md`。ダークモグゾー立強は両足で滑り込む演技として記録）。

**必殺 27 本（`s1_v17` / `s2_v17` / `s3_v17`）**
- 既存の v14 必殺 27 本を対戦カメラの静止画で評価し、**24 本は演技を据え置き、3 本を作り直した**：
  ゴダン s3 肩当て突進（肩と上体が先頭でぶつかる形へ）、チルカ s3 影引き爪（背を見せて引く→上体を起こしたまま踏み込む形へ。以前は伏せて滑っていた）、ダークモグゾー s1 黒い地走波（低い姿勢から手首だけを払う形へ）。
- 27 本すべてを v17 の契約で書き出した：素の時間（v14 の「当たり姿勢を 2F 早める」時間詰めなし）、接触時刻、役割・重さ、キュー。
- 接触：同じく正確時刻で実測し **27/27 ok**（`SPECIAL_TABLE_V17.md`）。対空は上へ打つ技なので高さ（`heightPeak`）で見る。飛び道具 6 本は発射ソケット（`socket`：fx_anchor 骨の前方・高さ）を別に記録。
- **据え置いた 24 本は v14 とバイト同一ではない。** 同じ演技の関数を、v17 の契約（当たり姿勢を 2F 早める時間詰めなし）で焼き直しているので、キーの時刻が違う。
- 据え置いた 24 本のうち、方針書の文面と違う点が 2 つ残る（演技は変えていない）：ピスケ s1 は「手首の放出」ではなく蹴りで放つ、バレット s1 は「手元から」ではなく尾で放つ。

**まだ確認していないこと**
- 連続再生としての動きの通し見（比較動画は作ったが、抜き出しフレームでの確認まで）、実ゲームでの発生フレームとの同期（Codex の adapter が接触時刻を写す前提）、キューの実際の鳴り方、実機。
- 左右反転は、通常技 54 本の接触の瞬間を右向き・左向きで撮って並べた（`evidence/contact_sheets/`）。必殺は未撮影。
- 必殺の足接地の数値点検（通常技だけ実施）。
- ミオ／Codex の基準では、実ゲームに繋いで全クリップの接触と足接地が確認できるまで**品質未認証**。

## クリップ契約
| 項目 | 値 |
|---|---|
| ファイル | `exp/fable-3d/motion/v17/<id>_normals_v17.glb`（アニメ専用 GLB。メッシュ・テクスチャなし。元リグのボーン名のまま） |
| クリップ名 | `v17_stand_weak` `v17_stand_heavy` `v17_crouch_weak` `v17_crouch_heavy` `v17_air_weak` `v17_air_heavy` |
| 骨格 | 元 9 体の標準リグのみ。別骨格・パーツ互換（P2）は対象外 |
| 時刻 | 60fps。`normals_v17.json` の `contact_frame` / `frames` と、正規化した `contact` / `contact_end` |
| 接触データ | `normal-contacts-v17.js` の `NORMAL_CONTACTS_V17[id][slot]`：`clip` / `contact` / `contactEnd` / `contactSeconds` / `attackPart` / `attackLimb` / `reach` / `height` / `battleActive` / `activeReach[{phase,frame,reach,height,part}]` / `status` |
| reach | 攻撃側 root（足元の x）から、打撃部位のスキン後メッシュ表面の最前頂点までの前方距離 [m]。相手の hurt radius は含まない |
| height | その頂点の高さ [m]。**root 基準の符号付きで、0 に丸めない**。空中技で尾や足が root より下へ来る演技は負（例：バレット空強 −0.07〜−0.17）。判定側は `strikeY = a.y + height` |
| activeReach | Battle の各持続フレーム i（`phase = i/(active-1)`、`battleActive` 枚。枚数は `dojo/normal-balance-v151.js` の `active` の写し）に対応する**正確時刻**の reach / height。0 / .5 / 1 の 3 点補間ではない |
| 再生契約 | v15.1 と同じ：ゲームの発生 F → `contact`、持続の最終 F → `contact_end`、全体の最終 F → クリップ末尾。性能（発生・持続・硬直）はクリップに焼いていない |
| 攻撃部位 | `attack_limb`（pawL / pawR / footL / footR / elbowR / shoulderR / kneeL+elbowR / tail / body / 両手は `pawL+pawR`） |
| 表情 | brow_angry / paw_open / blink のモーフも入っている（アニメ専用 GLB の代理メッシュ経由。`bindMorphTargets` で元メッシュへ束ねる前提） |
| しゃがみ・空中 | しゃがみ技は元の `crouch` 保持姿勢から始まり同じ姿勢へ戻る。空中技は元の `jump_n` の空中姿勢。上下移動は入っていない（ゲーム側の放物線） |
| 体ごと回る技 | バレットの立強・屈強・空強は体が 1 回転する（尾の先端で打つ）。回転はクリップ内の骨盤と足に入っていて、root は動かない |

## 必殺の契約
| 項目 | 値 |
|---|---|
| ファイル | `exp/fable-3d/motion/v17/<id>_specials_v17.glb`（アニメ専用 GLB、3 クリップ） |
| クリップ名 | `s1_v17` `s2_v17` `s3_v17`（現行の command_map：236→s1、623→s2、214→s3 に対応） |
| データ | `special-contacts-v17.js` の `SPECIAL_CONTACTS_V17[id][slot]`：`clip` / `origin`（据え置き・作り直し）/ `kind` / `weight` / `contactSeconds` / `contact` / `contactEnd` / `attackPart` / `reach` / `reachPeak` / `height`（符号付き）/ `heightPeak` / `strikeAxis` / `battleActive` / `activeReach`（持続フレームごと。時刻は 接触フレーム + i）/ `socket` / `airborneFrames` / `projectileSpawnFrame` / `cueTrack` / `hitstopSuggest` / `referenceFrames` |
| 飛び道具の `socket` | 6 本（モグゾー・ピスケ・タキマル・ヨミカゲ・バレット・ダークモグゾーの s1）について、接触（弾の発生）時刻の fx_anchor 骨の位置 `{bone, forward, height}`（リグ root 座標）。`reach` は放つ手・尾の**表面**で、発射点とも弾の射程とも別 |
| 時間 | クリップは素の時間。接触の姿勢が `contactSeconds` にちょうど来る。`referenceFrames` は現行 balance.js の発生・持続・硬直の写しで、変更していない |
| キュー | `cueTrack[] = {at, type: sfx|vfx|shake, key, trigger, on, bone?}` |
| `trigger:'movement'` | 動作の音とエフェクト（溜めの声・風切り・踏み切り・着地・弾を放つ瞬間）。**時刻で必ず鳴らす**。空振りでも鳴る |
| `trigger:'contact'` | 打撃音・接触エフェクト・揺れ。**時刻では鳴らさない**。Battle が実際にヒット／ガードを出したときだけ、Battle 側のフィードバックが `on`（hit / guard）に合うものを使う |
| 音の種類 | `combat-audio.js` の既存キーだけ（新しい音素材は足していない） |
| `hitstopSuggest` | 重さ別の停止フレームの提案（light 4/2、mid 6/3、heavy 9/5 = ヒット／ガード）。採否と実値は戦闘側 |
| 9 奥義 | 触れていない（音・映像とも既存のまま） |

## 再生成
```bash
python3 exp/fable-3d/tools/build_motion_v17.py            # 通常技 9体（--only moguzo で1体）
python3 exp/fable-3d/tools/build_specials_v17.py          # 必殺 9体
```
編集正本は `exp/fable-3d/tools/mamo3d/motions_v17.py`（通常技）と `motions_v17s.py`（必殺の役割・キュー・作り直した 3 本。据え置いた 24 本の演技は `motions_v14.py` / `motions_v14b.py`）。`bpy`（Blender 5.3）が必要：`pip install bpy scikit-image scipy xatlas pillow numpy`。

## 実測のやり直し
```bash
python3 exp/fable-3d/motion/v17/tools/as_v15_pack.py exp/fable-3d/_scratch/v17pack                  # 計測用に、現行ゲームが読む名前へ付け替えた写しを作る
python3 exp/fable-3d/motion/v17/tools/specials_as_v15_pack.py exp/fable-3d/_scratch/v17spack
node exp/fable-3d/motion/v17/tools/measure_exact.mjs --kind normals  --pack exp/fable-3d/_scratch/v17pack  --out exp/fable-3d/motion/v17/audit_exact/normals
node exp/fable-3d/motion/v17/tools/measure_exact.mjs --kind specials --pack exp/fable-3d/_scratch/v17spack --out exp/fable-3d/motion/v17/audit_exact/specials
node exp/fable-3d/motion/v17/tools/contacts_exact_v17.mjs       # 6 つの出力（通常・必殺の .js / .json / 表）
node exp/fable-3d/motion/v17/tools/foot_check.mjs
```
計測は実ゲームのページ（ヘッドレス Chromium・WebGL）で行い、ゲームのソースと `normal/v15` の実ファイルは変えない（読み込みを差し替えるだけ）。
`audit_exact/` には、接触・中間・終わり、各持続フレーム、接触の前後 ±3F の実測（部位別の最前・最上・最下の頂点）が入っている。

## 比較映像と静止画（`evidence/`）
- `videos/<id>_normals_v15_vs_v17.mp4`（9 本）：左＝現行の 54 本（v15）、右＝v17。実ゲームの対戦カメラ（横画面）で、クリップを 1/60 秒ずつ進めて毎フレーム撮り、60fps で連結した。
  **仮想時間の 60fps で、実機の描画 fps を測ったものではない。** 接触の瞬間に 0.3 秒の静止を入れている（映像上の演出で、クリップの長さではない）。相手は両側とも「v17 の実測 reach + 0.16m」。
  ゲーム内の発生フレームへの写像（接触時刻の同期）は通していない素のクリップ再生。
- `contact_sheets/<id>_contact_right_left.jpg`（9 枚）：通常技 6 本の接触の瞬間を、右向きと左向き（反転）で並べたもの。
- `specials_v14_review_1〜3.jpg`：既存 27 必殺の評価に使った静止画。`specials_redesigned_3.jpg`：作り直した 3 本の既存／v17。
