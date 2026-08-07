# ダークモグゾー 共通モーション一括色変換仕様

## 原則
ダークモグゾーはモグゾーと**完全に同じ骨格・顔・身長・横幅・ポーズ**。共通素材を画像生成で描き直さない。

## 変換対象
モグゾーの以下を色変換してダークモグゾーへ生成:
- J01 common basic
- J02 HIGH
- J03 MID
- J04 LOW
- J05 MIKIRI
- J06 ROAR
- J07 GRAB
- J15 DOWNSET
- legacy common24で実装に残す grabbed / crouch / sway / lunge / crouch_atk 等も同じ変換

**J08〜J14は変換しない。** `assets/art/current/dark_moguzo/` の固有7技を使用。

## パレット目標
変換元: `current/moguzo/00_master.png`
色目標: `current/dark_moguzo/00_master.png`

- warm brown main fur → dark brown / black-purple
- cream chest/belly/muzzle → muted gray-taupe
- darker forearms → near-black dark brown-purple
- bright red headband → dark wine-red
- eyes/nose/claws/outlinesは暗部コントラストを保持

## 推奨アルゴリズム
1. 2枚のmasterが同じ構図であることをedge/foreground maskで確認。
2. source/target masterの対応foreground pixelから、main fur / light fur / dark limb / headbandの領域別色変換を推定。
3. RGB単純置換ではなくLab/HSVで輝度階調を保持するpiecewise color transformまたはLUTを構築。
4. 全Moguzo共通フレームへ同じtransformを決定論的に適用。
5. geometry / alpha / edge / pixel positionは変更禁止。
6. 出力後、sourceとtargetのalpha/edge geometry hashが一致することを検証。

焼き込みの白/黄エフェクトや土煙は原則色変換対象外。後送VFXとの整理時に扱う。


Runtime出力はMoguzo由来frameと同一alpha/geometryであること。runtime loaderでは旧white removalを再適用しない。
