# マモ拳 v17 P3｜9体×6通常技の全身モーション（Claude 制作・Issue #212）

基準は v16 統合 Draft PR #209（`8ab8972`）。PR #214 の `P3_FIGHT_FEEL_DIRECTION.md` の演技指示に沿って、54 通常技を**元リグへの手付け全身ポーズ**で作り直した素材。
元 9 GLB、既存の 54 本（`normal/v15` の `v15_<slot>`）、27 必殺、約 10 秒の 9 奥義、9 勝利映像、P2 の custom assets には触れていない。ゲーム本体（dojo / story / custom）も変更していない。

## 状態（正直な現在地）
- 9 体 × 6 = 54 クリップをビルド済み。全員を対戦カメラの静止画（予備・接触・保持の終わり・打ち抜き）で一度目視し、崩れていた技を手直しした。
- **実測済み**：実ゲームのページで元 GLB のスキンメッシュを測り、`normal-contacts-v17.js` / `normal_contacts_v17.json` / `CONTACT_TABLE_V17.md` を出した。
  54 本中 50 本は「指定した部位が接触時刻に最前」。残り 4 本は `status:'fix'`（頭が 3〜5cm 先、または前へ出切るのが接触より少し後）で、表に理由を書いてある。
- **未確認**：足の接地（滑り・床へのめり込み）、左右反転、連続再生としての動き、実ゲームでの発生フレームとの同期（接触時刻は Codex の adapter が写す前提）、実機。
  ミオ／Codex の基準では、接触と足接地が全クリップで確認できるまで**品質未認証**。
- **27 必殺は未着手**（既存 v14 クリップの評価から始める）。既存 54 本との比較映像も未作成。

## クリップ契約
| 項目 | 値 |
|---|---|
| ファイル | `exp/fable-3d/motion/v17/<id>_normals_v17.glb`（アニメ専用 GLB。メッシュ・テクスチャなし。元リグのボーン名のまま） |
| クリップ名 | `v17_stand_weak` `v17_stand_heavy` `v17_crouch_weak` `v17_crouch_heavy` `v17_air_weak` `v17_air_heavy` |
| 骨格 | 元 9 体の標準リグのみ。別骨格・パーツ互換（P2）は対象外 |
| 時刻 | 60fps。`normals_v17.json` の `contact_frame` / `frames` と、正規化した `contact` / `contact_end` |
| 接触データ | `normal-contacts-v17.js` の `NORMAL_CONTACTS_V17[id][slot]`：`clip` / `contact` / `contactEnd` / `attackPart` / `attackLimb` / `reach` / `height` / `activeReach[{phase,reach,height}]` / `status`。定義は v15.1 の `NORMAL_CONTACTS` と同じ（reach は root から打撃部位表面までの前方距離、hurt radius は含まない） |
| 再生契約 | v15.1 と同じ：ゲームの発生 F → `contact`、持続の最終 F → `contact_end`、全体の最終 F → クリップ末尾。性能（発生・持続・硬直）はクリップに焼いていない |
| 攻撃部位 | `attack_limb`（pawL / pawR / footL / footR / elbowR / shoulderR / kneeL+elbowR / tail / body / 両手は `pawL+pawR`） |
| 表情 | brow_angry / paw_open / blink のモーフも入っている（アニメ専用 GLB の代理メッシュ経由。`bindMorphTargets` で元メッシュへ束ねる前提） |
| しゃがみ・空中 | しゃがみ技は元の `crouch` 保持姿勢から始まり同じ姿勢へ戻る。空中技は元の `jump_n` の空中姿勢。上下移動は入っていない（ゲーム側の放物線） |
| 体ごと回る技 | バレットの立強・屈強・空強は体が 1 回転する（尾の先端で打つ）。回転はクリップ内の骨盤と足に入っていて、root は動かない |

## 再生成
```bash
python3 exp/fable-3d/tools/build_motion_v17.py            # 9体（--only moguzo で1体）
```
編集正本は `exp/fable-3d/tools/mamo3d/motions_v17.py`。`bpy`（Blender 5.3）が必要：`pip install bpy scikit-image scipy xatlas pillow numpy`。

## 実測のやり直し
```bash
python3 exp/fable-3d/motion/v17/tools/as_v15_pack.py exp/fable-3d/_scratch/v17pack        # 計測用に、現行ゲームが読む名前へ付け替えた写しを作る
node exp/fable-3d/normal-art/v15_1/tools/sample_clips.mjs --pack exp/fable-3d/_scratch/v17pack --out exp/fable-3d/motion/v17/audit
node exp/fable-3d/motion/v17/tools/contacts_v17.mjs
```
計測は実ゲームのページ（ヘッドレス Chromium）で行い、ゲームのソースと `normal/v15` の実ファイルは変えない（読み込みを差し替えるだけ）。
