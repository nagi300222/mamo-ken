# ボーン構造とリグ仕様書

対象: `chars/{id}/{id}.blend` と `chars/{id}/{id}.glb`。9体（moguzo / pisuke / godan / hakuma / chirka / takimaru / yomikage / bullet / dark_moguzo）で共通の構造。

## 座標と単位

| | Blender（.blend） | glTF / Three.js（.glb） |
|---|---|---|
| 上 | +Z | +Y |
| 正面 | −Y | +Z |
| 本人の左 | +X | +X |
| 原点 | 両足の間の床（`root_ground`） | 同じ |

単位はメートル扱いで、仮の全高（耳を除く頭頂）は moguzo 0.60 / pisuke 0.63 / godan 0.66 / hakuma 0.70 / chirka 0.58 / takimaru 0.74 / yomikage 0.64 / bullet 0.62 / dark_moguzo 0.60。
レスト姿勢は腕を横に開いたTポーズ寄りで、膝は軽く曲げてある（スキニングとIKの曲げ方向のため）。構えは idle クリップが持つ。

## 変形ボーンの階層（GLB に入るもの）

```
root_ground
└─ pelvis
   ├─ spine ─ chest ─ neck ─ head ─ jaw
   │              │            └─ band_a_01 ─ band_a_02 / band_b_01 ─ band_b_02   （moguzo: ハチマキの垂れ）
   │              ├─ shoulder.L ─ upper_arm.L ─ forearm.L ─ wrist.L ─ paw.L
   │              │      │                         └─ forearm_twist.L   （前腕のひねり補助）
   │              │      └─ shoulder_fix.L                              （肩の変形補正）
   │              └─ shoulder.R … 同じ
   │        └─ belt_a_01 ─ belt_a_02 / belt_b_01 ─ belt_b_02            （godan: 帯の垂れ。親は spine）
   ├─ thigh.L ─ shin.L ─ ankle.L ─ foot.L ─ toe.L
   ├─ thigh_fix.L                                                       （股関節の変形補正）
   ├─ thigh.R … 同じ
   └─ tail_01 ─ tail_02 ─ tail_03 （─ tail_04 ─ tail_05 ─ tail_06: bullet のみ）
```

ジョイント数: moguzo 40、pisuke 36、godan 40、hakuma 36、chirka 36、takimaru 36、yomikage 36、bullet 39、dark_moguzo 40。

尻尾のボーン数はキャラごとに変えられる（`characters.py` の `tail_n`）。bullet は長い尻尾のため6本で、`{id}_motions.json` の `tail_bones` に実際の一覧が入る。
スカーフ・首飾り・たすき縄・包帯は専用ボーンを持たず、首・胴・前腕のボーンに追従する。

必須ボーン（root_ground, pelvis, spine, chest, neck, head, jaw, shoulder / upper_arm / forearm / wrist / paw、
thigh / shin / ankle / foot / toe の左右、tail_01〜03）は9体ともこの名前で入っている。`validation/{id}.json` の `required_bones` で確認済み。

### 名前の対応表（重要）

Blender の `.` 入りの名前は、GLB の JSON にはそのまま書き出される。
ただし **Three.js の GLTFLoader は読み込み時にノード名から `.` を取り除く**（`PropertyBinding.sanitizeNodeName`）。
ゲーム側でボーンを名前で探すときは右の列を使う。

| Blender / GLB 内の名前 | Three.js 読み込み後 |
|---|---|
| `root_ground`, `pelvis`, `spine`, `chest`, `neck`, `head`, `jaw` | 同じ |
| `tail_01`, `tail_02`, `tail_03` | 同じ |
| `shoulder.L` / `shoulder.R` | `shoulderL` / `shoulderR` |
| `shoulder_fix.L` / `.R` | `shoulder_fixL` / `shoulder_fixR` |
| `upper_arm.L` / `.R` | `upper_armL` / `upper_armR` |
| `forearm.L` / `.R` | `forearmL` / `forearmR` |
| `forearm_twist.L` / `.R` | `forearm_twistL` / `forearm_twistR` |
| `wrist.L` / `.R` | `wristL` / `wristR` |
| `paw.L` / `.R` | `pawL` / `pawR` |
| `thigh.L` / `.R` | `thighL` / `thighR` |
| `thigh_fix.L` / `.R` | `thigh_fixL` / `thigh_fixR` |
| `shin.L` / `.R` | `shinL` / `shinR` |
| `ankle.L` / `.R` | `ankleL` / `ankleR` |
| `foot.L` / `.R` | `footL` / `footR` |
| `toe.L` / `.R` | `toeL` / `toeR` |
| `band_a_01` など、`belt_a_01` など | 同じ |

シェイプキー名（`paw_open.L` など）は `morphTargetDictionary` のキーとしてそのまま残る（`.` は取り除かれない）。
キャラごとの完全な対応表は `validation/{id}.json` の `bone_name_map_three` にある。

## 制御ボーン（.blend のみ。GLB には書き出さない）

| ボーン | 役割 |
|---|---|
| `ik_hand.L` / `.R` | 手のIKターゲット。位置で手首の位置、回転で拳の向きを決める |
| `pole_elbow.L` / `.R` | 肘の向き |
| `ik_foot.L` / `.R` | 足のIKターゲット（足首の位置と足の向き） |
| `pole_knee.L` / `.R` | 膝の向き |

コンストレイント:

| 対象 | 種類 | 内容 |
|---|---|---|
| `forearm.*` | IK（2ボーン） | ターゲット `ik_hand.*`、ポール `pole_elbow.*` |
| `shin.*` | IK（2ボーン） | ターゲット `ik_foot.*`、ポール `pole_knee.*` |
| `wrist.*` / `ankle.*` | Copy Rotation（ワールド） | `ik_hand.*` / `ik_foot.*` の向きに従う |
| `shoulder_fix.*` | Copy Rotation（ローカル、影響0.5） | `upper_arm.*` の回転の半分だけ回る。肩と脇のつぶれを減らす |
| `thigh_fix.*` | Copy Rotation（ローカル、影響0.5） | `thigh.*` の回転の半分。脚を上げたとき付け根が薄くなるのを減らす |
| `forearm_twist.*` | Transformation（Swing/Twist Y） | `wrist.*` のひねりの半分を前腕の中ほどへ配る |

ポール角はビルド時に数値探索で合わせていて、レスト姿勢でIKを有効にしてもボーンが動かない（誤差0.06度以下）ことを確認している。
補助ボーンが実際に半分だけ回っていることは `{id}_motions.json` の `rig_checks`（比 0.5）に記録してある。

## 書き出し時のベイク

GLB には変形ボーンだけを書き出す（`export_def_bones`）。IKと補助コンストレイントの結果は、
glTF エクスポーターの強制サンプリングで60fpsの毎フレーム、変形ボーンの回転へ焼き込まれる。
Three.js 側では IK の計算は不要で、普通のボーンアニメーションとして再生される。

## スキンウェイト

- 1頂点あたり最大4ボーン、合計は1に正規化（検証で最大誤差 1e-7 程度）。
- ウェイトは手塗りではなく、体を作っているSDFプリミティブへの帰属と、その軸に沿った分布から計算して平滑化している。
  体型パラメータを変えるとウェイトも一緒に作り直される。
- 拳は `paw` に固定（平滑化しない）。帯は胴の上下方向の分布だけを使い、腕や脚の影響を受けない。

## シェイプキー（GLB ではモーフターゲット）

| 名前 | 内容 |
|---|---|
| `paw_open.L` / `paw_open.R` | 0=握り拳、1=指を伸ばした手（しゃがみで地面につく手に使用） |
| `blink` | まばたき・目をつぶる |
| `brow_angry` | 目の上を内側へ下げる（godan は常時0.65） |

モーフの値はクリップ内でアニメーションする（スパースアクセサで格納）。

## 二次動作

尻尾（`tail_01`〜`03`）、ハチマキの垂れ（`band_*`）、帯の垂れ（`belt_*`）は、ビルド時にバネのシミュレーションを行って
キーとして焼き込む。モーションを書く人は何もしなくてよい。ループするクリップは周期が閉じるまで回し、
単発クリップは最後の8フレームで揺れを収束させる。リストバンドとハチマキ本体はボーンに直接ウェイトを持つ。

## ゲーム側での使い方

### 左右の向き

モデルの正面は +Z。横視点の格闘ゲームなら、1P（右向き）はモデルの +Z を画面の右へ向ける。
構えは「左手・左足が前、胸がカメラ側へ開く」形で作ってある。

左向き（2P側）は2通りあり、プレビューの「向き」で両方確認できる。`chars/{id}/renders/facing.png` に並べてある。

| 方法 | やり方 | 見え方 |
|---|---|---|
| ミラー（推奨） | モデルを入れた親グループに `scale.z = -1` | 2Dスプライトの左右反転と同じ。胸がカメラへ開いたまま。ハチマキの結び目や利き手は左右が入れ替わる |
| 回転 | 親グループに `rotation.y = Math.PI` | 左右は入れ替わらないが、背中がカメラ側を向く構えになる |

ミラーでは Three.js が面の向きを自動で直すので、顔・装飾・ライティングは崩れない。
ミラー時に結び目の位置を変えたくない場合は、左向き専用のクリップを別に作る必要がある（今回は未作成）。

### 移動量

クリップはすべてその場（インプレース）。移動は `{id}_motions.json` を読んでゲーム側で与える。

| キー | 意味 |
|---|---|
| `frames`, `fps`, `duration_sec`, `loop` | 長さ（60fps基準）とループ可否 |
| `startup`, `active`, `recovery` | 攻撃の発生・持続・硬直の目安（フレーム） |
| `move_per_loop_leg` | 歩き1周期の移動量。脚の長さ `metrics.leg` を1とした値。この速度で動かせば接地中の足が滑らない |
| `move_total_leg`, `move_frames` | ダッシュの総移動量と、移動させる区間 |
| `prejump`, `airborne`, `land_recovery`, `jump_height_leg` | ジャンプの予備動作、空中の区間、着地硬直、高さの目安。上下移動はクリップに含まない |
| `enter_frames`, `loop_from` | しゃがみ・ガードの入り終わりと、保持ループの開始フレーム |
| `common_clips`, `unique_clips` | 共通10種と、キャラ固有モーション（`sp_*`）の名前 |
| `unique`, `provisional`, `name_jp`, `proposal` | 固有モーションの印。技名・フレーム・性能はAIの仮案 |
| `hits` | 多段技の各ヒットの持続区間 `[[開始, 終了], ...]` |
| `tail_tip_max_forward_m`, `tail_tip_max_forward_frame`, `tail_tip_height_at_max_m` | bullet の尾打撃: 尻尾先端が最も前へ届く距離（原点から）、そのフレーム、そのときの高さ |
| `tail_tip_path` | 尻尾先端の軌道（2フレームごと。列は `frame, forward_m, left_m, height_m`）。当たり判定を実際の尻尾の位置に合わせるために使う |
| `tail_tip_min_height_m`, `tail_to_body_axis_min_m` | 尻尾先端の最低の高さ、尻尾と胴の軸の最小距離（床・胴への潜り込みの確認用） |
| `v2_clips` | モーション拡張 v2 で足したクリップの名前（Issue #147 / #148） |
| `command_map` | コマンド入力（`236` / `623` / `214` / `236236`）→ 再生するクリップ名 |
| `group`, `priority` | 追加クリップの分類（`universal` / `reaction` / `normal` / `command`）と優先度（1が最優先） |
| `start_pose`, `end_pose` | 追加クリップが始まる・終わる姿勢（`idle` / `guard` / `guard_crouch` / `crouch` / `air` / `down` / `clinch` / `clinch_end`） |
| `game_action`, `game_reaction`, `game_state` | ゲーム側（`dojo/battle.js`）のどの技・反応・状態に当てる想定か |
| `pair_spacing_m`, `palm_contact_m` | 組み合い（`clinch_hold`）の2体の間隔と、手のひらを合わせる位置（横・前・高さ m） |

### つなぎ

単発クリップ（攻撃・被弾・ダッシュ・ジャンプ）は idle の0フレーム目と同じ姿勢で終わる（本体ボーンの差は0）。
実際の切り替えは 0.1 秒前後のクロスフェードを推奨する。

## 既知の制限

- 口は開かない（`jaw` はあごの部分を少し下げるだけで、口の中は作っていない）。
- 指は1本ずつ動かせない（握りと開きのシェイプキーのみ）。
- 脚が短い体型のため、脚を高く上げると太ももが胴の毛に引っ張られる。`thigh_fix` で軽減しているが残る。
- 尻尾と垂れ布の揺れは焼き込みなので、ゲーム中の移動速度には反応しない。
- bullet の長い尻尾は、移動や被弾ではバネで遅れて揺れ、尾打撃のときだけキーで決めた形へ強く寄せている（`tail_follow`）。尻尾と脚・床の接触は自動では防いでいない。
