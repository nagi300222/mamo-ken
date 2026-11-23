# マモ拳 v17 P3｜9体×6通常技の全身モーション（Claude 制作・Issue #212）

基準は v16 統合 Draft PR #209（`8ab8972`）。PR #214 の `P3_FIGHT_FEEL_DIRECTION.md` の演技指示に沿って、54 通常技を**元リグへの手付け全身ポーズ**で作り直した素材。
元 9 GLB、既存の 54 本（`normal/v15` の `v15_<slot>`）、27 必殺、約 10 秒の 9 奥義、9 勝利映像、P2 の custom assets には触れていない。ゲーム本体（dojo / story / custom）も変更していない。

## 状態（正直な現在地）
- **初稿**。9 体 × 6 = 54 クリップをビルド済み。モグゾーは対戦カメラの静止画で目視済み、残り 8 体は目視と手直しの途中。
- **リーチ・高さの実測はまだ無い**（`normals_v17.json` にあるのは接触時刻と攻撃部位だけ）。実ゲームのスキン頂点からの実測と `NORMAL_CONTACTS` 形式の出力はこの PR に追記する。
- **27 必殺は未着手**（既存 v14 クリップの評価から始める）。比較映像も未作成。
- 実機では未確認。

## クリップ契約
| 項目 | 値 |
|---|---|
| ファイル | `exp/fable-3d/motion/v17/<id>_normals_v17.glb`（アニメ専用 GLB。メッシュ・テクスチャなし。元リグのボーン名のまま） |
| クリップ名 | `v17_stand_weak` `v17_stand_heavy` `v17_crouch_weak` `v17_crouch_heavy` `v17_air_weak` `v17_air_heavy` |
| 骨格 | 元 9 体の標準リグのみ。別骨格・パーツ互換（P2）は対象外 |
| 時刻 | 60fps。`normals_v17.json` の `contact_frame` / `frames` と、正規化した `contact` / `contact_end` |
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
