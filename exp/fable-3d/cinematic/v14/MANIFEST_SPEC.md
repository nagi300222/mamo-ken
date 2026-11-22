# Showtime v14 奥義ムービー manifest 仕様（Claude → Codex）

対象: `manifest/<id>_ultimate.json`。[CINEMATIC_CONTRACT.md](../../../../docs/mamoken-showtime-v14/CINEMATIC_CONTRACT.md) の既定形式を土台にし、足りなかった部分を足した。
足した点は末尾の「契約からの差分」にまとめた。演出の内容は [ULTIMATE_10S_DIRECTION.md](../../../../docs/mamoken-showtime-v14/ULTIMATE_10S_DIRECTION.md)（本人指定）に従う。

参照実装は `player/cine-player.js`（評価規則）と `player/fx.js`（VFX）。この2つを読めば同じ絵になる。

## 1. 時間

- 単位は**ムービー秒**。`t=0` は命中が確定した次のフレーム。戦闘フレームとは無関係に進む。
- 役者クリップは 60fps で焼いてあり、**クリップ時刻 = ムービー秒**（`segments` で別指定が無い限り）。
- 再生は `seek(t)` の純関数として書ける。役者の位置・クリップ時刻・カメラ・VFX はすべて `t` だけで決まるので、スキップ・一時停止・巻き戻しで状態が壊れない。
- **ヒットストップは役者クリップに焼き込み済み**（同じ姿勢が続く）。`hitstop` キューは音・FX・カメラを合わせるための印で、再生を止める指示ではない。再生側でさらに止めると二重になる。

## 2. 座標

| 項目 | 定義 |
|---|---|
| 原点 | 命中時の両者の中点・地面 |
| +X | 攻撃側が向いている方向 |
| +Y | 上 |
| +Z | 対戦カメラ側 |
| 単位 | m（GLB の単位そのまま。キャラの身長は 0.58〜0.74） |
| 開始位置 | `t=0` で攻撃側を `x=-stage.contactDistance/2`、相手を `x=+stage.contactDistance/2` に置き直す（1カット目が寄りなので見えない） |
| 左右反転 | 攻撃側が左向き（-X 向き）で当てたときは、位置の x・`rotY`・`rotZ`・カメラ `roll` の符号を反転する。`rotX` はそのまま |

ムービー中の位置は表示だけのもの。終了・スキップ時は役者を戦闘の位置へ戻し、ムービーの位置を戦闘へ持ち込まない。

## 3. 役者 `actorTracks`

```jsonc
"attacker": {
  "segments": [ { "start": 0, "clip": "cin_moguzo_atk" } ],          // どのクリップをいつから。後ろの要素ほど優先
  "pivotHeight": 0.45,                                               // 宙返りの回転中心の高さ（身長比）
  "root": [ { "t": 0, "pos": [-0.23, 0, 0], "rotY": 90, "ease": "hold" }, ... ],
  "visible": [[0, 3.05], [5.6, 10.01]],                              // 省略時は常に表示
  "opacity": [ { "t": 1.42, "v": 0 }, { "t": 1.62, "v": 1 } ],       // 省略時は 1
  "cloneOf": "attacker", "material": "illusion"                      // 分身だけ。攻撃側 GLB の複製を半透明で描く
}
```

- `segments[i]`: `start`（ムービー秒）以降はこのクリップ。クリップ時刻 = `clipStart + (t - start) × rate`（既定 `clipStart=0`, `rate=1`）。`loop:true` はクリップ長で折り返す。
- `root[i]`: 足元原点の位置 `pos`、向き `rotY`（Three.js の `rotation.y` を度で。90 = +X 向き、-90 = -X 向き、0 = +Z 向き）、宙返り `rotZ` / `rotX`（度。**ステージ軸**まわり。回転中心は足元から `pivotHeight × 身長` 上）、`scale`。
- 行列の順番: `T(pos) · T(0,pivot,0) · Rz(rotZ) · Rx(rotX) · T(0,-pivot,0) · Ry(rotY)`。
- キー間は「行き先のキー」の `ease` で補間する。`hold` は直前の値を保って瞬間に切り替える（カットをまたぐ位置替えに使う）。
- 上昇・落下・打ち上げは `root` の y が受け持つ。クリップの中では役者は足元原点の近くで演技している。
- **相手役（`target`）のクリップは 9 体すべての `<id>_v14.glb` に同じ名前で入っている**（`cinv_moguzo` / `cinv_godan` / `cinv_chirka`）。体格に依らない書き方で焼いたので、相手が誰でも同じ芝居になる。
- 分身（`cloneOf`）は見た目だけ。当たり判定もダメージも持たせない。

## 4. ショットとカメラ `shots[]`

```jsonc
{ "id": "02-upper-one", "title": "一段目", "start": 1.1, "end": 2.3, "intent": "...",
  "actorPose": { "attacker": "...", "target": "..." },
  "camera": {
    "rig": "fist-ride-to-chin",          // このカットの型の名前（人が読む用。全体で使い回しが無いことを検証している）
    "projection": "perspective", "move": "...",
    "position": {...}, "lookAt": {...}, "fov": 36, "rollDeg": 8, "easing": "outCubic",   // 最初のキーと同じ内容（契約の既定フィールド）
    "keys": [ { "t": 1.10, "pos": {"anchor": "attacker.pawR", "offset": [-0.10, -0.04, 1.00]},
                           "look": {"anchor": "attacker.pawR", "offset": [0.10, 0.06, 0]}, "fov": 36, "roll": 8, "ease": "inOutCubic" }, ... ] },
  "fxCues": [...], "sfxCues": [...] }
```

- ショットは隙間なく並ぶ（`shots[i].start == shots[i-1].end`）。カットは瞬間切り替え。
- `keys[].t` は**ムービー秒の絶対値**。カメラはそのショットのキーだけで動く。
- `pos` / `look` の `anchor`: `stage`（原点）、`<役者>` または `<役者>.root`（足元）、`<役者>.<骨>`。`offset` はステージ軸の m（反転時は x を反転）。
- 骨の別名 → GLB のノード名（Three.js が読み込んだ後の名前）: `head`→`head`, `chest`→`chest`, `pelvis`→`pelvis`, `pawL`/`pawR`→`pawL`/`pawR`, `footL`/`footR`→`footL`/`footR`, `jaw`→`jaw`, `tail`→`tail_02`。骨が無ければ足元 + 身長比（head 0.9 / chest 0.62 / pelvis 0.42 / paw 0.55 / foot 0.05）で代用する。
- **anchor は「いま」の骨位置で毎フレーム解決してから補間する。** キーを打った時点の位置を覚えておくのではない。こうすると、打ち上げられる相手や跳ぶ攻撃側をカメラが追い続ける。
- `fov` は縦の画角（度）。`roll` は視線まわりの傾き（度）。キー間は行き先の `ease`。
- 揺れは `cues` の `shake` を全部足し合わせ、カメラのローカル x・y と roll に乗せる（式は `cine-player.js` の `applyShake`）。

### 画面の安全域

- 852×393（スマホ横）で確認した。上下に 6.5% ずつの黒帯を出す前提で構図を取っている。主役の頭と当たりの位置は中央 80% に入れた。
- 21:9 より横長・16:9 より縦長では左右が増減するだけで、縦の画角は変わらない。

## 5. キュー `cues[]`

全ショットのキューを時刻順に並べたもの（各ショットの `fxCues` / `sfxCues` にも同じものが入っている）。

| `type` | 内容 |
|---|---|
| `vfx` | `key` と位置（`anchor`+`offset`、または `from`/`to`）と個別パラメータ。下の語彙表 |
| `sfx` | `key` だけ。音は未制作で、鳴らす位置の指定（7 節） |
| `shake` | `dur` 秒・振幅 `amp`（m）。減衰つき |
| `hitstop` | `dur` 秒・`strength`（`light` / `heavy` / `max`）。**印であって停止指示ではない**（1 節） |
| `caption` | 技名の字幕。`text`・`sub`・`dur` |

### VFX 語彙（`player/fx.js` に参照実装）

すべて「キューからの経過秒」の純関数。

| key | 見た目 | 主なパラメータ |
|---|---|---|
| `flash` | 画面全体の光 | `dur`, `opacity`, `color` |
| `dim` | 画面を暗く落とす（止めの間） | `dur`, `opacity`, `color` |
| `speed_lines` | 集中線 | `dur`, `opacity`, `color` |
| `impact_burst` | 打撃の火花（放射のトゲ＋光の玉） | `size`, `rays`, `color` |
| `shock_ring` | 広がる輪 | `radius`, `dur`, `plane`: `ground`（地面）/ `camera`（正対） |
| `slash_arc` | 三日月の軌跡 | `size`, `angle`, `sweep` |
| `sparks` | 光の粒 | `count`, `power`, `up`, `size` |
| `dust` | 土煙 | `count`, `spread`, `dur`, `size` |
| `debris` | 破片（放物線） | `count`, `power` |
| `ground_crack` | 地面を走る亀裂 | `from:[x,z]`, `to:[x,z]`, `dur`（伸びる時間）, `hold` |
| `rock_spikes` | 地面から突き出す岩 | `count`, `height`, `radius`, `hold` |
| `boulders` | 浮き上がって落ちる岩 | `count`, `radius`, `height`, `fallAt` |
| `aura` | 役者を包む気 | `height`, `dur`, `opacity` |
| `energy_pillar` | 地面から空へ抜ける光の柱 | `height`, `radius`, `dur` |
| `rock_wall` | 岩壁。`breakAt` 秒後に +X 側へ砕ける | `width`, `height`, `depth`, `breakAt`, `crackLead`（砕ける前に震える秒数）, `power` |
| `claw_mark` | 空間に残る三本の爪痕 | `size`, `angle`, `hold`、または `convergeAt`（絶対秒）+ `convergeTo`（集まる先の anchor） |
| `poison_mist` | 湧き続ける紫の泡 | `radius`, `count`, `dur` |
| `puff` | 霧になって消える（分身の出入り） | `count` |

`rock_wall`・雲（`stage.clouds`）・雪山などは**ムービー内だけの舞台装置**。通常の対戦ステージには置かない。

ゲーム側は同じ key を自前の表現へ対応づければよい。見た目を揃える必要があるのは「いつ・どこに・どのくらいの大きさで」の3点。

## 6. 舞台 `stage`

`contactDistance`（開始時の間合い）、背景・霧・照明・床の色、アクセント色、`illusion`（分身の色と透明度）、`clouds`（高さの手がかり用の雲の層）。参照プレイヤーは簡易な床・遠景の山・柱で描いている。ゲーム側の v13 の「キャラ色の舞台」に色だけ合わせれば足りる。

## 7. 音

音素材は作っていない。`sfx` キューの key は「ここでこういう音」の指定で、現行 `combat-audio.js` の種類（`hit` / `special` / `ultimate` / `ko` など）への対応づけは Codex 側に任せる。
最低限そろえたい同期点は `hitstop` キューと同時刻の `ult_hit_*`、`hitstop_release`、`ground_slam_big` / `rock_wall_break`。

## 8. 動きを減らす設定 `reducedMotion`

`useShots` の 3 カットだけを、各ショットの最初のキーで固定して見せる。`disable` の種類（揺れ・光・集中線・暗転）は出さない。役者とキューの時刻は変えないので、終了時刻は通常版と同じ。

## 9. 検証（`tools/build_manifest.mjs` が書き出し時に行う）

- 尺が 9〜11 秒、ショット数が 6〜10、ショットが隙間なく並ぶ、最後のショットの終わり = `durationSeconds`
- カメラの型（`rig`）が 4 種類以上
- カメラのキーがショットの範囲内、anchor の役者と骨が存在する、fov が 12〜80
- 攻撃側クリップが GLB にあり、ムービーより短くない
- **相手役クリップが 9 体すべての GLB にあり、ムービーより短くない**
- `hitstop` キューが 1 つ以上ある
- キューの時刻が範囲内

1 つでも欠けると失敗で終わる（共通ズームへ黙って落とさない）。

## 10. 契約からの差分

| CINEMATIC_CONTRACT の既定 | 変更 | 理由 |
|---|---|---|
| ショットごとにカメラ位置 1 つ + `easing` | `camera.keys[]`（時刻つきの複数キー）を追加。既定の `position` / `lookAt` / `fov` / `rollDeg` / `easing` は最初のキーの値で残した | 1 カットの中でカメラを動かすため（追尾・回り込み・当たりで寄る） |
| `lookAt: "target.head"`（文字列） | `{anchor, offset}` の形。位置にも同じ形を使う | 骨からずらした位置を狙う・骨に付いて動くカメラを書くため |
| `animationSources.target.clip` 1 つ | 加えて `actorTracks`（`segments` と `root`）を追加 | 役者のステージ上の移動・上昇・宙返り、クリップの切り替え、分身 |
| `fxCues` / `sfxCues`（ショット内） | 同じものを時刻順に並べた `cues[]` も出力。`shake` / `hitstop` / `caption` を追加 | Codex 案の `cueTrack` と同じ読み方ができるように |
| 尺 4〜6 秒・4〜7 カット | 9〜11 秒・6〜10 カット | ULTIMATE_10S_DIRECTION.md（本人指定） |
| 記載なし | `coordinateSystem`, `stage`, `reducedMotion`, `skip`, `inGameStartClip` | 契約 2 節が「最終版で定義すること」としていた項目 |
