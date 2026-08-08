# SIZE NORMALIZATION FINAL

今回の実装に含める。
この文書で、代表12motionだけでなく残りmotionも全て処理済み扱いにする。

# 1. 絶対順序

1. 9キャラ `00_master` の正式身長比を反映
2. 各キャラ全motion / 全Command frameを、そのキャラ自身のmaster顔サイズへ合わせる
3. 最後にGround Lineを合わせる

scaleとground補正を同時に行わない。

# 2. 正式身長比

Moguzo=1.00

- moguzo 1.00
- pisuke 1.03
- godan 1.08
- hakuma 1.05
- chirka 0.98
- takimaru 1.07
- yomikage 1.00
- bullet 1.03
- dark_moguzo 1.00

この値をFINALとする。

raw masterのimage bboxをそのまま身長比にしない。
tail / headband ends / rope / accessory等はbody-height authorityにしない。

# 3. 顔サイズ正本

各charの `00_master` がデザイン正本。

実装時:
- まずmasterを正式身長比で同一Ground上へrender
- その表示状態の顔をtarget face sizeとする
- Idleをtargetへ一致させる
- 以後すべてのmotion/frameを同じtargetへ合わせる

安定landmark優先:
- 頬〜頬
- crown→muzzle base
- eye spacing
- eye→nose
- nose/muzzle size

open-mouth Roar等で口の開き自体をface scaleとして数えない。
腕や拳による顔の隠れもbbox縮小として扱わない。

`face_ratio_measurements.csv` は手動cropによる比較補助。
過去のsingle-template自動face判定は決定根拠にしない。

目標:
通常poseはstable landmarkでおおむね±3%以内。
prone/強いforeshorteningは±5%以内を目安にFable5が目視裁定。

# 4. 補正分類

A. KEEP / EXPECTED_POSE
顔scaleは合っており姿勢による全身高差だけ。
scaleを触らない。

B. RUNTIME_FACE_SCALE
顔自体が大小ずれている。
等比render scaleで補正。
bodyが低い/横長という理由だけで補正しない。

C. OFFSET_ONLY
scale後、顔/体の大きさは正しいが位置だけずれ。
offsetのみ。

D. ART_REPLACE
素材そのものを採用しない。
今回確定しているのはGodan flinchだけ。

# 5. 代表motion

対象:
Idle / Guard / Flinch / Crouch / CrouchAttack /
LOW / MID / HIGH / Sway / Lunge / Grab

全て「own master face targetへ確認→必要ならB→位置C」の共通処理。
姿勢だけで一律倍率を決めない。

Idleは運用基準。
Guardで腕が顔を隠してもcrop bboxだけで拡大しない。
Flinchは反り角度を維持。
Crouch/LOWは全身が低いのは正常。
Sway/Lungeは移動表現を壊さない。
Grabは伸ばした腕をsize basisにしない。

# 6. 全Command 1-7

9キャラ、全63Commandが対象。

各1x4:
F1 / F2 / F3 / F4を**個別**にface-normalize。

1Commandにつき1倍率で済ませない。
必要ならper-frame battleScale/offset presentation metadataを持つ。

狙い:
F1→F2→F3→F4で顔が膨張/縮小するbreathingをなくす。

F3 active/hit poseの大振り姿勢でも、顔サイズはown masterに維持。

Dark common motionはMoguzo correctionを共有。
Dark unique CommandだけDark master基準で個別。

# 7. 残りmotion — 今回すべて処理

以下を「後回し」にしない。

## Mikiri

全キャラ:
FACE CHECK → 必要なら RUNTIME_FACE_SCALE。
身体のひねり・腕の動きは維持。
groundedなので最後にGround Line。

## Roar

F1-F4全て:
FACE CHECK → 必要なら RUNTIME_FACE_SCALE。

open mouth / 頬膨らみは表情なので、
口全体bboxではなくeye/nose/crown/cheekの安定landmarkで合わせる。
grounded。

## Victory

FACE CHECK。
腕を上げた高さを身長に数えない。
顔が合えばKEEP。
groundedなので最後に足。

## GetUp

FACE CHECK。
片膝・前傾による全身高低下はEXPECTED。
顔が小さい/大きい時だけuniform scale。
最後に支持足/膝ではなく意図した床接地点を合わせる。

## UltCharge

FACE CHECK。
拳・腕上げの高さを身長basisにしない。
grounded。
scale後に足。

## Grabbed

FACE CHECK。
持ち上げ/浮きはGround Line例外。
scaleだけown master顔へ合わせる。
投げ側のsimulation位置へ影響させない。

## Down

prone pose。
全身heightをstandingへ合わせない。
顔はcheek / eye→nose / muzzle幅で確認。
faceが明確に縮小している場合だけuniform scale。
最後は足ではなく**身体の床接触面**をGroundへ。

## KO

Downと同じ。
渦目/表情差をface size判定へ混ぜない。
身体床接触面をGroundへ。

# 8. Godan flinch

現行flinchは今回不採用。
同梱:
`assets/art/overrides/godan/flinch/godan_flinch_replacement_alpha_fullcanvas.png`

へ即差し替え。

その後:
- Godan正式身長比1.08
- Godan master face
- Ground
の順で新flinchを調整。

BAL / timing / hitbox / hurt / reach変更禁止。

# 9. Bullet

tailをbody/face scale basisにしない。
木の実は常に3個維持。
tailを画面に収めるため本体を縮めない。

scale後にtail cropが問題になる場合、
canvas/visual bounds/offset側を拡張し、本体scaleを犠牲にしない。

# 10. Dark Moguzo

共通motion:
Moguzo geometry correctionをそのまま共有。
Dark側だけ別scaleにしない。

Dark unique Command:
Dark master face基準。

# 11. Ground Line

現行manifestの
`offset.y = -footAnchor.y`
構造は維持可能。

grounded:
Idle/Guard/Flinch/Crouch/CrouchAtk/H/M/L/
Mikiri/Roar/Sway/Lunge/grounded Grab/grounded Command/Victory/GetUp/UltCharge
→ 最終rendered groundを共通化。

Down/KO:
身体床接触面。

Grabbed/明示airborne:
例外。

raw footAnchor_yを全frame同値にしない。
各local anchor→offset→scale→fighter rootで同じGroundへ写像する。

# 12. 禁止

- face correctionをhitbox/reachへ反映
- tailでBullet縮小
- Dark commonへ独自geometry
- body bboxだけでauto-fit
- Command F1-F4を一括倍率
- scaleとgroundを一工程で雑に処理
- Godan旧flinch維持

# 13. 監査資料

- `docs/art/audit/face_ratio_measurements.csv`
- `docs/art/audit/FINAL_per_frame_detail.csv`
- `docs/art/audit/standing_height_table.json`

機械的に信頼できる既確認:
- battleScaleは旧manifest全監査frameで0.5
- offset.y + footAnchor.y = 0
- manifest/alpha bbox差は最大3px
- Dark common geometry alias整合

これらは「旧scaleが正しい」という意味ではない。
今回、上記FINALルールでpresentation scaleを再調整する。
