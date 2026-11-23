# v17 P3 モーション r2（接触姿勢の追加調整・7 本）

Codex の実戦プローブで「実測の表面どおりに判定すると当たらない／遅れる」と分かった技だけを直した追加版。
**r1（`motion/v17/` の GLB・表・`0ce6b85` までの成果）は 1 バイトも変えていない。** r2 は変更した体のパックだけをここへ別ファイルで置く。9 奥義・勝利ムービー・P2 の部品・元 GLB には触っていない。
`motion/v17/` の表にある「据え置き 24 本／作り直し 3 本」は r1 の監査としてそのまま残る。r2 はその上の追加調整。

## 何を直したか

| 技 | r2 のクリップ | r1 接触 reach / 高さ | r2 接触 reach / 高さ | r2 持続中の reach | r2 持続中の高さ |
|---|---|---|---|---|---|
| moguzo s2「昇り拳」 | `s2_v17r2` | 0.222 / 0.800 | 0.291 / 0.461 | 0.29 / 0.26 / 0.24 / 0.23 / 0.24 / 0.25 / 0.25 / 0.18 | 0.46 / 0.53 / 0.60 / 0.56 / 0.61 / 0.66 / 0.68 / 0.83 |
| godan s2「岩砕き」 | `s2_v17r2` | 0.172 / 0.582 | 0.346 / 0.526 | 0.35 / 0.33 / 0.32 / 0.30 / 0.29 / 0.27 / 0.26 | 0.53 / 0.55 / 0.58 / 0.61 / 0.64 / 0.66 / 0.69 |
| takimaru s2「抱え上げ」 | `s2_v17r2` | 0.015 / 0.512 | 0.447 / 0.555 | 0.45 / 0.42 / 0.40 / 0.38 / 0.36 / 0.34 / 0.31 | 0.55 / 0.60 / 0.65 / 0.70 / 0.74 / 0.79 / 0.83 |
| yomikage s2「昇り肘」 | `s2_v17r2` | 0.143 / 0.531 | 0.315 / 0.470 | 0.32 / 0.31 / 0.31 / 0.30 / 0.30 / 0.30 / 0.29 | 0.47 / 0.47 / 0.48 / 0.48 / 0.49 / 0.49 / 0.50 |
| bullet s2「尾跳ね」 | `s2_v17r2` | -0.104 / 0.380 | 0.286 / 0.535 | 0.29 / 0.28 / 0.27 / 0.27 / 0.27 / 0.27 / 0.27 | 0.54 / 0.51 / 0.50 / 0.51 / 0.51 / 0.52 / 0.52 |
| hakuma s3「連続突っ張り」 | `s3_v17r2` | 0.493 / 0.423 | 0.554 / 0.408 | 0.55 / 0.56 / 0.56 / 0.56 / 0.44 / 0.54 / 0.54 / 0.54 / 0.50 | 0.41 / 0.41 / 0.41 / 0.41 / 0.45 / 0.45 / 0.45 / 0.45 / 0.40 |
| takimaru しゃがみ強「すくい上げ」 | `v17r2_crouch_heavy` | 0.523 / 0.606 | 0.572 / 0.260 | 0.57 / 0.58 / 0.59 / 0.52 | 0.26 / 0.25 / 0.33 / 0.61 |

単位は m。reach は攻撃側 root から打撃部位表面の最前頂点まで（相手の hurt radius 0.16 は含まない）。高さは root 基準。全部、実ゲームのページ（WebGL）で正確なクリップ時刻に置いて測った値で、持続は Battle の active フレームごと。

- **対空 5 本（モグゾー・ゴダン・タキマル・ヨミカゲ・バレットの s2）**: 「最初は低く前、持続のあいだに上へ」の形にそろえた。接触フレームの高さは 0.46〜0.56m で、いちばん低い立ち姿（チルカ top 0.554 + 判定半径 0.06）にも当たる高さ。前方は 0.29〜0.45m。
  - モグゾー 昇り拳: 接触を、足がまだ地面にある低い右アッパーにした。回転と上昇はその後（r1 は接触の瞬間にもう回って跳んでいた）。空中に見える区間は F7〜F27（r1 は F5〜F26）。
  - ゴダン 岩砕き: 半歩出て、両拳を前上へ振り上げてから頭上へ。
  - タキマル 抱え上げ: 一歩踏み込み、両手を相手の胸の高さへ差し込んでから頭上へ持ち上げる。のけぞって止める絵は元のまま（判定の後）。
  - ヨミカゲ 昇り肘: 踏み込みを深くして腰を前足へ乗せ、肘を前上へ。
  - バレット 尾跳ね: 体を前へ深く折り、尾を背中越しに前上へ（さそりの形）。尾のばねの遅れで r1 は接触時に尾が体の後ろだったので、追従を強め（tail_follow 0.9）、接触フレームに間に合うよう 2F 早く振り出す。
- **ハクマ s3 連続突っ張り**: 3 発目（接触 F12）の踏み込みを深くし、接触時刻に実際にいちばん前へ出た姿勢を置いた（0.493 → 0.554m）。5 発の構成・時刻は同じ。持続 5 枚目（F16）は手の入れ替わりで 0.44m に下がる（r1 は 0.37m）。
- **タキマル しゃがみ強 すくい上げ**（通常技・下段）: 接触を、両手が床の近くで相手の足もとへ入る姿勢（クリップ F15）にし、持続の終わり（F19）で r1 の「腕が上がりきった形」になる。r1 は接触が F17→F21（上がりきった後の保持）で高さ 0.61m だった。属性は変えていない。全長 46F は同じ。

発生・持続・硬直・全体フレーム、ダメージ、属性、キューの種類はどれも変えていない（キューの時刻はモグゾー s2 の踏み切り・着地だけ空中区間に合わせて動いた）。見えない距離の水増しはしていない。数値は全部メッシュの実測。

## ファイルとクリップ名

| 体 | r2 のパック | 中のクリップ |
|---|---|---|
| moguzo / godan / takimaru / yomikage / bullet | `motion/v17r2/<id>_specials_v17r2.glb` | `s1_v17`, **`s2_v17r2`**, `s3_v17` |
| hakuma | `motion/v17r2/hakuma_specials_v17r2.glb` | `s1_v17`, `s2_v17`, **`s3_v17r2`** |
| takimaru（通常技） | `motion/v17r2/takimaru_normals_v17r2.glb` | `v17_stand_weak` など 5 本と **`v17r2_crouch_heavy`** |

- 直したクリップだけ名前に `r2` が入る。同じパックの残りのクリップは r1 と同じ関数から焼いた同名のもので、実測値も r1 と一致（表の生成時に照合済み）。
- pisuke / chirka / dark_moguzo の必殺と、takimaru 以外の通常技に r2 のパックは無い。r1（`motion/v17/`）をそのまま使う。
- GLB の形式は r1 と同じアニメ専用（元 9 体のリグ名そのまま。メッシュはモーフ用の最小スタブ）。

## メタデータ

- `special-contacts-v17r2.js` → `SPECIAL_CONTACTS_V17R2[id][slot]`（27 本ぜんぶ入り。r1 の `SPECIAL_CONTACTS_V17` と同じ項目に下を足したもの）
- `normal-contacts-v17r2.js` → `NORMAL_CONTACTS_V17R2[id][slot]`（54 本ぜんぶ入り）
- 同じ中身の JSON: `special_contacts_v17r2.json` / `normal_contacts_v17r2.json`。人が読む表: `SPECIAL_TABLE_V17R2.md` / `CONTACT_TABLE_V17R2.md`

r2 で足した項目:

| 項目 | 意味 |
|---|---|
| `file` | そのクリップが入っているパックのパス（`exp/fable-3d/` から）。r2 のパックがある体は 3 本（通常技は 6 本）とも r2 のパスを指す |
| `clip` | そのパックの中のクリップ名 |
| `revision` | `"r2"` = r2 で演技を直した技、`"r1"` = r1 と同じ |
| `changedFromR1` | 上と同じ意味の真偽値 |
| `r1` | 直した技だけ。r1 のクリップ名・パック・接触 reach / 高さ（比較用） |

つまり参照の切り替えは「`file` と `clip` をそのまま読む」だけで済む。ほかの項目（`contact` / `contactEnd` / `contactSeconds` / `reach` / `height` / `activeReach[]` / `strikeAxis` / `heightPeak` / `socket` / `cueTrack[]` / `referenceFrames` など）の意味は r1 の README（`motion/v17/README.md`）と同じ。
クリップごとの元データ: `specials_v17r2.json`（6 体）と `normals_v17r2.json`（takimaru）。実測の生データ: `audit_exact/`。

## 確認したこと・していないこと

- 確認した: 7 本とも実ゲームのページで全 active フレームを正確時刻で実測（上の表）。r2 の表は必殺 27/27・通常 54/54 が自動チェック通過。r1 の出力は再生成しても差分なし。直していないクリップは r1 と実測が一致。地上技の接触〜持続で足は床から −0.005m 以内。
- 既知でそのまま: ゴダン s2・タキマル s2 は、接触より前の深いしゃがみ（F7〜F9）で足の頂点が床下 0.03〜0.045m。r1 と同じ値で、今回は触っていない。
- していない: Battle に組み込んだヒット／ガード／空振りの実戦確認（Codex 側のプローブの領分）。ハクマ s3 の「F12→F16 の遅れ」はこちらでは再現手順を持っていないので、接触の reach を伸ばした結果で解消するかは Codex のプローブで見てほしい。実機（スマホ）での確認もしていない。
- バレット s2 は、接触時に頭（0.41m）のほうが尾の先（0.29m）より前にある。対空（上向き）なので自動チェックの対象外だが、見た目として頭が先に届く距離になる。

## 証拠

- `evidence/r1_vs_r2_7clips.mp4` — 左 = 修正前 r1、右 = 修正後 r2 を同じ相手の位置で並べた映像。画面上部に版・クリップ名・実測値が出る。1/60 秒刻みの連番を 60fps にしたもの（仮想時間。実機の fps ではない）。接触の瞬間は 0.4 秒止めて見せている。
- `evidence/r1_vs_r2_contact_frames.jpg` — それぞれの接触フレームの静止画（左 r1・右 r2）。

## 作り方

```bash
python3 exp/fable-3d/tools/build_specials_v17r2.py       # 必殺 6 体（編集正本 tools/mamo3d/motions_v17s_r2.py）
python3 exp/fable-3d/tools/build_motion_v17r2.py         # 通常技 takimaru（編集正本 tools/mamo3d/motions_v17_r2.py）
cd exp/fable-3d
python3 motion/v17/tools/specials_as_v15_pack.py _scratch/r2pack motion/v17r2 _specials_v17r2.glb
python3 motion/v17/tools/as_v15_pack.py _scratch/r2npack motion/v17r2 _normals_v17r2.glb
node motion/v17/tools/measure_exact.mjs --kind specials --pack _scratch/r2pack --out motion/v17r2/audit_exact/specials --ids moguzo,godan,hakuma,takimaru,yomikage,bullet --meta motion/v17r2/specials_v17r2.json
node motion/v17/tools/measure_exact.mjs --kind normals --pack _scratch/r2npack --out motion/v17r2/audit_exact/normals --ids takimaru --meta motion/v17r2/normals_v17r2.json
node motion/v17/tools/contacts_exact_v17.mjs --rev r2    # r2 の表だけを書く。--rev なしは r1 の表（差分は出ない）
```

Blender（bpy）が要る。`motion/v17/tools/` の 5 本（`measure_exact.mjs` / `contacts_exact_v17.mjs` / `as_v15_pack.py` / `specials_as_v15_pack.py` / `capture_compare.mjs`）は r2 用の引数を足しただけで、引数なしの動作は r1 のまま。
