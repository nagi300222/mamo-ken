# Showtime v14 必殺と奥義ムービー（9体）

[Issue #177](https://github.com/nagi300222/mamo-ken/issues/177) の制作物。第一弾（モグゾー／ゴダン／チルカ）と第二弾（ピスケ／ハクマ／タキマル／ヨミカゲ／バレット／ダークモグゾー）。
ゲーム本体（`dojo/`）と元の GLB（`chars/`）は変更していない。

- 36技の監査と再設計カタログ: [`docs/mamoken-showtime-v14/AUDIT_AND_REDESIGN_36.md`](../../../../docs/mamoken-showtime-v14/AUDIT_AND_REDESIGN_36.md)
- Codex 向けのデータ仕様: [`MANIFEST_SPEC.md`](MANIFEST_SPEC.md)
- 納品一覧（ハッシュつき）: [`DELIVERY_MANIFEST.json`](DELIVERY_MANIFEST.json)

## できているもの

| 内容 | 対象 | 場所 |
|---|---|---|
| 新しい必殺モーション 26 本 | 9 体 × s1/s2/s3（バレットの s3 だけは現行のまま） | 各 `<id>_v14.glb` の `s1_v14` `s2_v14` `s3_v14` |
| 対戦中の奥義始動 9 本 | 9 体 | `ult_v14` |
| 奥義ムービーの攻撃側の演技（約10秒）9 本 | 9 体 | `cin_<id>_atk`（チルカは分身用 `cin_chirka_dive` も） |
| 奥義ムービーの相手役の演技（約10秒） | **9 体すべて** × 9 本 | `cinv_<id>`（どの GLB にも 9 本入っている） |
| カメラ・役者の移動・キュー | 9 本 | `manifest/<id>_ultimate.json`（正本は `storyboard/<id>.mjs`） |
| 参照プレイヤー | — | `player/` |
| 動画・コマ並び | — | `evidence/` |

できていないもの: 音素材（キューの位置だけ）、ゲームへの統合（Codex の PR #180 側）。

バレットの s3「尾薙ぎ」は、当たりの間合いがクリップの尻尾先端の軌道と結び付いているので現行 `sp_tail_whip` のままにした（`command_map` の 214 も元のまま）。

## ファイルの置き方

```
cinematic/v14/
  <id>/<id>_v14.glb            元 GLB の造形・骨格・既存37クリップ ＋ v14 クリップ（9体）
  <id>/<id>_v14_motions.json   元の motions.json ＋ v14 クリップの情報と command_map の差し替え案
  <id>/<id>_v14.blend          編集用（モグゾー・ゴダン・チルカのみ同梱。他の 6 体は build_v14.py --save-blend で出せる）
  storyboard/<id>.mjs          絵コンテの正本（人が編集する）
  manifest/<id>_ultimate.json  ゲームが読むデータ（storyboard から生成）
  player/                      参照プレイヤー（cine-player.js = 評価規則, fx.js = VFX, main.js = ページ）
  tools/                       撮影・書き出し・検証
  evidence/                    監査シート・新旧比較動画・ムービー
  validation/                  検証結果
```

モーションの正本は `../../tools/mamo3d/motions_v14.py`（第一弾と共通の道具）と `motions_v14b.py`（第二弾）。キーポーズの記述で、書き方は [`docs/motion_authoring.md`](../../docs/motion_authoring.md) と同じ。

## 元 GLB を守る仕組み

`tools/build_v14.py` は元の `chars/<id>/<id>.blend` を**開くだけ**で、新クリップを焼き足して `cinematic/v14/<id>/` へ別名で書き出す。メッシュは作り直さない。
書き出し後、`tools/verify_glb.mjs` が元 GLB と中身を突き合わせる。結果（`validation/glb_identity.json`）:

| | 9 体の結果 |
|---|---|
| メッシュ（頂点・法線・UV・ウェイト・シェイプキー） | バイト一致 |
| 骨格（ノード名・階層・初期姿勢・逆バインド行列） | 一致 |
| テクスチャ・マテリアル | バイト一致 |
| 既存 37 クリップのキー値 | 37/37 一致 |

ヨミカゲだけ、元 GLB の `idle` の先頭 2 フレームに `blink=1` が入っている（元の書き出し時の状態に由来すると見られる）。再書き出しでは 0 になるので、**元の値へ戻して一致させてある**。直してはいない。

戻し方: v14 を使わなければ元のまま。`models.js` の `MODEL_ASSETS` を v14 のパスへ向けた場合も、`<id>_v14_motions.json` の `v14.base_command_map` に元の割当が残っている。

## ゲームへの入れ方（Codex 向けの最短経路）

1. `MODEL_ASSETS[id].glb` / `.motion` を `cinematic/v14/<id>/<id>_v14.glb` / `_v14_motions.json` に向ける（9 体。相手役クリップが全員に要るため）。
2. 必殺と奥義始動はこれだけで替わる。現行の `chooseClip` は `command_map` を最優先で引くので、`236→s1_v14` `623→s2_v14` `214→s3_v14` `236236→ult_v14` が選ばれる（バレットの 214 だけは元の `sp_tail_whip`）。
3. 奥義ムービーは `manifest/<id>_ultimate.json` を `MANIFEST_SPEC.md` の規則で再生する。

`balance.js`・`battle.js`・入力は触らない。新クリップは現行の発生・持続・硬直に長さを合わせてある。

### 対戦用クリップの決まりごと

- クリップ長 = 発生 + 持続 + 硬直（`main.js` の再生速度が 1.0 になる）。
- 当たりの姿勢は「発生 − 2F」から見える。`main.js` は技の出始めに構えから約 3F 混ぜるので、そのぶん早く置いた。発生・持続の数値は変えていない（`ingame_lead_frames: 2`）。
- 跳ぶ技（モグゾー s2・チルカ s2）の高さはクリップの中の見た目。当たり判定・無敵は現行のまま。見た目と判定のずれが気になる場合は、判定側を変えるかどうかを別途相談（数値変更は別提案にする）。

## 作り直す手順

```bash
pip install bpy scikit-image scipy xatlas pillow numpy
```

```bash
python3 exp/fable-3d/tools/build_v14.py
```

```bash
node exp/fable-3d/cinematic/v14/tools/build_manifest.mjs
```

```bash
node exp/fable-3d/cinematic/v14/tools/validate_v14.mjs
```

- 1 体だけ: `build_v14.py --only chirka`。編集用 .blend も出す: `--save-blend`。初回は 1 体 30〜40 秒、2 回目以降 10〜20 秒。Blender 5.3 の bpy で確認。
- 姿勢の確認: `node cinematic/v14/tools/pose_sheet.mjs --id moguzo --clip s1_v14 --frames 0,6,11,13 --views match,34 --out /tmp/p.jpg`
- ムービーの確認: `node cinematic/v14/tools/render_movie.mjs --movie moguzo --target pisuke --fps 30 --out /tmp/mv --mp4 /tmp/mv.mp4 --sheet /tmp/mv.jpg`
- ブラウザで見る: リポジトリの直下で静的サーバーを立て、`exp/fable-3d/cinematic/v14/player/index.html?movie=moguzo&target=pisuke` を開く（`&mirror=1` で攻撃側が左向きのとき、`&reduced=1` で揺れなし）。
- 実ゲームでの撮影: `node cinematic/v14/tools/capture_specials.mjs --out DIR --ids moguzo --v14`（通信の差し替えだけで v14 GLB を読ませる。ゲームのファイルは変えない）。

## 確かめたこと／確かめていないこと

`validation/summary.json` と、目で見た確認。

**確かめた**
- 元 GLB との一致（上の表）。9 体とも。
- 実ゲーム（Chromium・WebGL・852×393）で、現行の `chooseClip` が新クリップを再生し、新クリップのある 35 技すべてで相手の残り体力が旧クリップのときと同じ（＝当たりの成否とダメージが変わっていない）。ヨミカゲの s3（当て身）は旧・新とも相手が攻撃しないので当たらず、体力は減らないまま同じ。
- 対戦画面での新旧の見え方（`evidence/specials/*.mp4`、`evidence/audit_after/*.jpg`）。
- 9 本のムービーを参照プレイヤーで 852×393・30fps で通し描画し、コマ並びを目で確認（`evidence/movies/`）。相手役は 1 本につき 1〜2 通り。左向きで当てたときの再生は第一弾のゴダンで 1 本。
- manifest の形式・クリップ・骨・相手役 9 体ぶんの存在（`build_manifest.mjs`）。
- 既存のゲームのテストが通る（`dojo/` は無変更）。

**確かめていない**
- iPhone 実機、FPS、発熱、メモリ。描画はソフトウェア（SwiftShader）のみ。
- 音。効果音・BGM は作っていない（キューの位置だけ）。
- 相手役 9 体 × 9 本 = 81 通りのうち、自分で目で見たのは十数通り。残りは「同じ記述で焼いた・クリップが存在する」ことだけ自動で確認した。体格差で手が体に入る・当たりの位置がずれる箇所は残っていると思う。
- 60fps の通し再生での体感。確認は 10〜30fps のコマ並びと動画。
- ヨミカゲの当て身が成立したときに何のクリップが出るか（ゲーム側の扱い）。
- GLB の容量の影響。相手役 9 本ぶんで 1 体 6〜7MB（元は 2.5〜2.9MB）になった。読み込み時間・メモリはゲーム側で要確認。

ゲームに組み込んだ状態での再生は Codex の PR #180 側の検証（第一弾 3 本と、第二弾の前半 3 本 × 相手 9 体の再生合格の報告あり）。後半 3 本（ヨミカゲ・バレット・ダークモグゾー）は、この README を書いた時点では未統合。

## 統合レビューで直した点

- **ピスケ 04-charge-slide（約 3 秒）**: 相手に寄りすぎて、滑り込む脚と接触が画面の下へ外れていた（ゴダン相手で顕著、同キャラ相手でも相手だけが見えていた）。カメラを滑走路の真横・地面の高さに置き直し、接触点を画面中央にして、伸ばした脚・接触・浮く相手が同じ画面に入るようにした。ゴダン相手とピスケ相手で描画して確認。
- **左向きで当てたとき**: x だけの鏡映だと決めポーズが背中を向くので、ムービー全体を 180 度回す方式にした（`MANIFEST_SPEC.md` 2 節）。

## 自分で気づいている弱点

- 参照プレイヤーの VFX と舞台は簡素。光・岩・雪・爆発は「いつ・どこに・どの大きさで」を示すための仮の見た目。
- 手足の短い体型なので、蹴りは脚が細く短く見える。ピスケの蹴りは体全体の傾きと残像の筋で補っている。
- 対戦画面の必殺は、体が小さい（身長 約70px）ぶん、第二弾の一部（ヨミカゲの s3 の「待ち」など）は変化が控えめ。
- モグゾーの頂点カット、ピスケの「宙」カットは遠景で、役者が小さい。
- 接触の精度は相手の体格で変わる。当たりの瞬間は火花とカメラの寄りで補っている。
- ダークモグゾーとヨミカゲは暗い舞台。輪郭は出しているが、明るい環境のスマホ画面で見えるかは実機で要確認。
