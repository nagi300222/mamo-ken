# P2 交換 SkinnedMesh モジュール（Claude 制作・Issue #211）

host の体の一部（head / ears / hands / feet / tail）を、**別キャラ（donor）の実際のメッシュ**で置き換える部品。
v16 の「寸法 graft」（host の面のまま寸法だけ donor に寄せる）とは別物で、ここの GLB の面は donor の頂点・三角形そのもの。
元の 9 体の GLB、`custom/v16/assets`、通常 54・必殺 27・奥義 9 は読むだけで、変更していない。全員マーモット。

基準: PR #219 head `ba6200947b4c743b8ad30f31492b5cca88cc17ec`。ゲームの JS / UI は Codex 担当で、ここには入っていない。

## いま入っているもの

`assets/manifest.json` の `modules` に載っているものだけが制作・検査済み。載っていない組み合わせは **未制作**。
一覧と検査結果は `assets/inspection.json`、作ったときの数値（縮尺・動かした頂点数・接合帯の面数・ふた）は `assets/build_report.json`。

対象の全体は host 3 体（moguzo / godan / bullet）× 他 2 体の head / ears / hands / feet = 24、短尾どうし moguzo ↔ godan の tail 2 = 最大 26。
bullet の長い尾（6 骨）と短い尾（3 骨）の交換は **未対応**（骨を勝手に足さない）。自分自身が donor の組は作らない（base を使う）。

## 部品の作り方

1. donor の slot の三角形を `custom/v16/assets/<donor>_parts.glb` からそのまま取り出す。頂点数・面の張り方・UV・テクスチャは donor のまま。
2. 骨ごとの変換「host のバインド × 縮尺 × donor の逆バインド」を donor のスキンウェイトで混ぜて頂点・法線・モーフへ掛け、host の骨格のバインド姿勢へ移す（骨名で対応）。縮尺は境界ループの周長比（host / donor、0.8〜1.25 に制限）で、モジュールごとに 1 つ。
3. host の同じ slot が他の slot と接していた境界ループ（= host の既存の境界）を求める。donor の縁を、そのループの少し内側（接合帯の幅ぶん）へ寄せる。寄せる量は donor メッシュの上で調和関数として広げ、縁から離れると 0 になる。スキンウェイトとモーフも同じ重みで host の境界値へつなぐ。
4. host の境界頂点の**写し**（位置・法線・スキンウェイト・4 モーフが host の値そのまま）をモジュールに置き、donor の縁との間を三角形の帯でつなぐ（接合帯。モジュールの中に入っている）。
5. donor の slot に元からあった開いた穴（足の裏など）は、モジュールの中でふたをする。

結果として、モジュールの開いた境界は **host の継ぎ目ループだけ**。host の slot に元からあった開いた穴は持ち込んでいない（ふたをした donor の面に置き換わる）。新しい未接続の境界は無い。
どのモジュールも境界は「host の元の境界ループ」なので、別々の slot のモジュールを同時に使っても継ぎ目は一致する（例: head と ears を別の donor にしても、両方が host の耳の付け根ループで終わる）。

## GLB の中身

- ノード: host の骨ノード（名前・rest の TRS は host と同じ）＋モジュールのメッシュのノード。アニメーションは入っていない。
- skin: 骨名・順番・逆バインド行列は host の `<host>_parts.glb` と同じ（moguzo / godan 40 骨、bullet 39 骨）。実行時は host の共有 Skeleton へ bind し直す前提。
- メッシュ: `p2_<slot>_<donor>_for_<host>`。head だけ目が別メッシュで `…_eyes` が付く（manifest の `meshNames` に全部載せている）。1 メッシュ 1 プリミティブ、LOD0 のみ。
- 属性: `POSITION` `NORMAL` `TEXCOORD_0` `JOINTS_0` `WEIGHTS_0` `_AVATAR_REGION`（donor の値）`_AVATAR_PART`（slot の番号。v16 と同じ並び body0 head1 ears2 hands3 feet4 tail5 accessory6）。
- モーフ: `paw_open.L` `paw_open.R` `blink` `brow_angry` の 4 本、この順（`mesh.extras.targetNames`）。意味は元と同じ。`mesh.weights` は host の既定値。
- マテリアルとテクスチャ: donor のもの（donor のアルベド JPEG を GLB に埋め込み）。`material.extras = {avatarPart, sourceBase: donor, targetBase: host, p2Module: true}`。
- `extras.p2Module`（GLB のルート）: id・host・donor・slot・meshNames と、入力にした host / donor の `_parts.glb` の sha256。

## manifest

`assets/manifest.json` は Codex のパーサーの契約どおり: `{schemaVersion:1, version:"p2-exchange-1", coordinateSystem:"gltf-y-up-metres-host-bind-local", modules:[entry…]}`。

- `file` は `assets/` からの相対パス。`bytes` と `sha256` は GLB の実値。
- `jointNames` は host の全骨名を GLB の skin の順で。`palette` は実際の donor の色（v16 の manifest の値）。
- `seams = {kind:"matched-host-boundary", tolerance:0.00002}`。`socket = {bone, position:[0,0,0], space:"host-bind-local"}`（bone は head / ears → `head`、hands → `chest`、feet / tail → `pelvis`。頂点はすでに host のバインド空間にあるので、位置合わせの変換は要らない）。
- `source.path` は **`assets/` からの相対パス**で、作り方の本体 `../tools/p2lib.py` を指す。`source.sha256` はそのファイルの sha256。

## 検査

```bash
python3 exp/fable-3d/custom/p2/tools/build_modules.py      # 作る（numpy + scipy）
python3 exp/fable-3d/custom/p2/tools/inspect_modules.py    # GLB の検査 → assets/inspection.json（不合格があれば終了コード 1）
node exp/fable-3d/custom/p2/tools/evidence.mjs             # 比較画像・動画と継ぎ目の実測 → evidence/
```

`inspect_modules.py` は出来上がった GLB と host / donor の `_parts.glb` だけを読んで確かめる:
骨名・逆バインド・rest が host と同じ／属性と 4 モーフ／ウェイトの合計 1／**モジュールの開いた辺が host の継ぎ目ループとちょうど一致し、それ以外の開いた辺が無い**／
境界頂点が host の隣の slot の頂点と位置・法線・スキンウェイト・4 モーフで一致（許容 0.02mm、上限 0.1mm）／**donor の slot の三角形がそのまま全部入っていて、host の面の張り方とは違う**（寸法 graft ではない証拠）／manifest の bytes・sha256・名前が実ファイルと一致。

`evidence.mjs` は確認ページ `preview/index.html`（制作側の検査用。ゲームの実行時コードではない）で host に載せ、three.js の `SkinnedMesh.getVertexPosition`（描画と同じスキニング計算）で、
待機・歩行・ガード・立ち強・しゃがみ強・被弾の各 9 時刻について、継ぎ目の頂点と host の隣の slot の頂点の距離を測る → `evidence/seam_gap.json`。

## 証拠（`evidence/`）

- `<id>_poses.jpg` — 左 = host の元の姿、右 = モジュールを載せた姿。行 = 待機・歩行・ガード・攻撃 2 種・被弾。
- `<id>_seam.jpg` — 継ぎ目の寄り。肌色 = モジュール、青 = host の元の面、線 = モジュールの三角形。
- `<id>.mp4` — 待機 → 歩行 → ガード → 立ち強 → しゃがみ強を、base ／ 交換後 ／ 継ぎ目の寄りで並べた動画。1/30 秒刻みの連番（仮想時間。実機の fps ではない）。

## 確認していないこと・限界

- ゲーム本体（Codex の parts runtime）に組み込んだ表示・対戦は確認していない。確認ページでの表示と実測まで。実機（スマホ）も未確認。
- 色: モジュールは donor のテクスチャのまま。host の体との毛色の境目は、host の境界ループ（面の割り方がぎざぎざ）の形でそのまま見える。色をそろえるかどうかは実行時のパレット側の扱い。
- host の装身具（モグゾーのハチマキ、ゴダンの帯・腕輪、バレットの首ひも）は host のまま動かしていない。head や hands を換えると、装身具が donor の形に少し埋まる／浮く箇所がある（例: モグゾーにゴダンの頭 → ハチマキの前が額に埋まる）。
- 接合帯のあたりは donor の面を host の境界へ寄せているので、付け根の太さが大きく違う組（縮尺が 0.8 / 1.25 の制限に当たる組）は付け根の形が donor 本来とは変わる。`assets/build_report.json` の `scale` と `seam_max_shift_m` に出ている。
- 打点・被弾範囲は、交換後の実メッシュから測り直す必要がある（v16 の `measureContacts` 相当。ここでは測っていない）。
