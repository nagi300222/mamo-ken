# COMBAT vNEXT FINAL

60fps。

# 1. 最上位原則

- キャラ差と楽しさを最優先。数値均一化で個性を消さない。
- マモ拳は自由移動・助走がほぼないインファイト型。
- 強技の税はStartup / Recovery / Telegraph / Block disadvantage中心。
- 入力難度だけではraw Damage bonusを与えない。
- 同じCommandはModern/ClassicでDamage・性能同一。
- Modern報酬=入力容易性。
- Classic報酬=直接入力とcancel route自由度。
- presentation値をhitbox/reach/stateへ逆流させない。

# 2. 共通F

- Prebuffer 10F
- Dodge total 22F
- Dodge evade F2-F12
- Correct Dodge completion F18
- Miss/empty Dodge completion F22
- Guard→Dodge 10F buffer
- Correct Dodge counterReady 18F
- Counter x1.20
- Modern history timeout 45F
- Classic Cancel Quick16 / Standard16 / Heavy14 / Finisher12

# 3. Dodge R2

- CROUCH avoids HIGH+MID / loses LOW
- SWAY avoids HIGH+LOW / loses MID
- LUNGE avoids MID+LOW / loses HIGH
- wrong Dodge被弾=Counter x1.20
- Blockstun中Dodge入力は10F bufferし最初のactionable frameから通常Dodge
- 正解DodgeはReach3だけを理由に失敗させない

# 4. Normal Chain R2

Limit:
moguzo3 / pisuke4 / godan2 / hakuma2 / chirka3 /
takimaru2 / yomikage2 / bullet3 / dark_moguzo4

- HIGH/MID/LOW自由順
- 同Normal連続可
- HITのみtrue chain継続
- BLOCKはtrue chain終了だがModern history維持可
- WHIFF chainなし
- `normalChainCount` とgeneric combo counterを分離
- Normal LOWのcommon lightDownを撤廃
- Modernで最終NormalをCommandへ置換した場合、そのNormalはchainCountへ加算しない

OP相殺:
同一normal直連続
100 / 90 / 80 / 70% floor
対象 Damage / GuardDamage / 技固有Knockback
非対象 Startup/Active/Recovery/Stun/Modern history
別Normalでreset
Command対象外

# 5. Combo Scaling R2

100 / 85 / 70 / 60 / 50 / 42 / 35 / 30 / 25% floor

Classic Cancel / Dark Chain / Ability normalChain resetでresetしない。

# 6. Normal R2

表記 Crouch / MID / HIGH / LOW。

Frames S/A/R:
- Moguzo: 10/3/14, 14/3/15, 21/4/21, 28/5/30
- Pisuke: 9/3/12, 12/3/13, 18/4/18, 25/5/26
- Godan: 12/3/18, 17/3/21, 25/4/30, 32/5/39
- Hakuma: 10/3/16, 15/3/18, 23/4/25, 29/5/34
- Chilka: 10/3/14, 14/3/16, 21/4/23, 28/5/32
- Takimaru: 11/3/17, 16/3/20, 23/4/28, 30/5/36
- Yomikage: 9/3/13, 12/3/14, 19/4/20, 26/5/29
- Bullet: 10/3/15, 14/3/16, 21/4/22, 28/5/31
- Dark: 8/3/13, 11/3/14, 17/4/20, 24/5/28

Damage:
- Moguzo 45/65/95/140
- Pisuke 34/50/74/108
- Godan 60/88/132/185
- Hakuma 42/60/90/130
- Chilka 40/58/88/126
- Takimaru 48/72/106/152
- Yomikage 36/52/78/114
- Bullet 44/64/96/138
- Dark 37/54/81/116

GuardDamage:
- Moguzo 6/10/14/18
- Pisuke 4/6/9/12
- Godan 8/13/19/25
- Hakuma 5/8/12/16
- Chilka 4/7/10/14
- Takimaru 5/8/12/16
- Yomikage 4/7/10/13
- Bullet 5/8/12/16
- Dark 4/7/10/14

HIT/BLOCK advantage targets:
- Moguzo +1/-4, +1/-5, 0/-9, 0/-16
- Pisuke 0/-5, 0/-7, +1/-10, 0/-16
- Godan +2/-6, +2/-8, +3/-13, +2/-20
- Hakuma +1/-5, +1/-7, +2/-11, +1/-18
- Chilka +1/-4, +1/-6, +1/-10, +1/-17
- Takimaru +1/-6, +2/-8, +3/-12, +2/-19
- Yomikage 0/-4, +1/-5, +1/-9, 0/-16
- Bullet +1/-5, +1/-6, +1/-10, +1/-17
- Dark +1/-4, +2/-5, +2/-8, +1/-14

Formula:
advantage = stun - (active-1) - recovery

Whiff extra:
C0 / M2 / H5 / L9

Normal common root knockback=0。
投げ/Roar/Ult/Gyuiin/down/明示Pushbackのみ例外。

# 7. HP / Guard

- Moguzo 1000 / 100
- Pisuke 920 / 90
- Godan 1040 / 100
- Hakuma 1040 / 125
- Chilka 940 / 90
- Takimaru 1040 / 110
- Yomikage 930 / 90
- Bullet 1000 / 95
- Dark 880 / 80

hidden GuardDamageTaken倍率撤廃。全員x1.00。

# 8. Modern R4

History:
- Normal HIT/BLOCK記録
- BLOCKはtrue chainを切るがhistory維持
- 次qualifying normal開始は前HIT/BLOCKから45F以内
- WHIFF/EVADE/被弾/Throw/Roar/Ult/Command/Down/Roundでreset
- pattern完成時 final normalをCommandへ置換
- state/resource不足ならnormal fallback
- patternは一意

Patterns:
Moguzo:
H-L-M 地走り
L-H-H 昇撃
M-L-M 胴押し

Pisuke:
H-H-H-M 二連牙
L-M-M-L スライディング
M-H-H-H 宙返り蹴
L-H-H-M つむじ返し

Godan:
L-M 岩砕き
M-M 大山押し

Hakuma:
M-M 雪壁掌
H-H 白峰打ち

Chilka:
H-L-M だまし突き
L-M-L 影踏み
M-H-H 戻り蹴り

Takimaru:
L-H 熊手払い
H-L 丸抱え

Yomikage:
H-M 影縫い
M-H 月かすめ

Bullet:
H-L-M 弾み突き
M-M-L 尾払い
L-H-H 跳ね上げ

Dark:
H-L-L-M 黒走り
L-H-H-H 逆昇撃
M-L-L-M 闇押し
L-M-M-L 黒砂払い

Takimaru Modern Grab:
target throw-eligibleなら丸抱え14F startup。
throw-ineligibleならpending。
最初のthrow-eligible Fから14F startup。
即確定投げにしない。
被弾/投げ/別行動/Roundでpending cancel。

# 9. Classic Cancel

- Command HITのみ
- current Commandの出所はModern/Classic/Ability不問
- 次Commandを正式Classic入力で完成した場合のみcancel
- Modern patternはcancel inputにならない
- Hitstop中方向仕込み可
- final triggerがwindow内で成立
- Command Grab対象
- 同一Command→同一Command direct loop禁止
- 1combo回数上限なし
- combo/scaling resetなし
- `comboEnd` tagだけで絶対禁止しない
- Dark Chainと独立

Window:
Quick16 / Standard16 / Heavy14 / Finisher12

# 10. Focus

vNextで gameplay Focusを廃止。

外す:
- gain
- auto slow
- HUD
- CPU focus logic

shadow/schema compatibilityでfieldが必要なら、
live disableとschema cleanupを安全に分割可。
旧Focus gameplayを残すのは禁止。

Drama Slowは今回外。

# 11. S

max100 / Round start0

Gain:
- combo action1 HIT +12
- action2 +7
- action3 +4
- action4+ +0
- attack BLOCK +6
- Guard成功 +5
- 被弾 +5
- Correct Dodge +6
- Armor absorb +3
- Whiff/Mikiri/Gyuiin/down followup/Roar +0

multi-hit Commandは1action。

# 12. Roar / Ult

Roar:
17/4/24
dmg120
GD38
chip10
cost S100
Clean HIT Ult+1
Roar自身S gain0

Ult:
max3 / cost3
Gyuiin win +1
Roar clean +1

Round carry:
0→0
1→1
2→2
3→2

固有Gauge/stock/tempはRound reset。

# 13. Command R2

## Moguzo
地走り 18/3/20 dmg95 GD10 H+2 B-8 Standard Modern
昇撃 24/3/30 dmg120 GD14 H0 B-16 Heavy Modern counterMul1.5
引き寄せ投げ S14 dmg100 whiff34
砂払い 20/4/24 dmg90 GD10 H+2 B-10
山越え拳 25/4/30 dmg130 GD18 H+2 B-14
胴押し 12/3/18 dmg60 GD11 H+1 B-6 Modern small Pushback
土煙突き 30/4/36 dmg150 GD18 H0 B-18 Finisher comboEnd Reach3

## Pisuke
二連牙 9/3/17 dmg76 GD7 H+1 B-6 Modern
スライディング 22/4/27 dmg92 GD11 lightDown B-14 Modern
宙返り 18/3/23 dmg88 GD9 H+1 B-9 Modern
かすみ連打 10/8/19 dmg74 GD9 H+1 B-6 multi
風切り 15/3/21 dmg80 GD9 H+1 B-8
すり抜け足 11/3/17 dmg64 GD7 H+4 B-5 Lunge success only
つむじ返し 23/4/30 dmg120 GD14 H0 B-15 Finisher Modern comboEnd

## Godan
地割れ 29/4/34 dmg145 GD28 chip15 lightDown B-20 whiff+13
山掴み S18 dmg130 whiff44 ArmorStock1
巌の構え Startup5 CounterActive8 FailRecovery22 counter125 Stock1
岩砕き 21/4/30 dmg140 GD19 H+2 B-14 Stock1 Modern
天蓋 30/4/37 dmg190 GD23 hardDown B-21 whiff+14
根こそぎ 23/4/31 dmg135 GD16 throwDown B-16
大山押し 24/5/33 dmg150 GD24 H+2 B-15 Stock2 Hyper Modern small push

## Hakuma
雪壁掌 15/3/21 dmg72 GD10 H+1 B-7 Modern
氷柱返し 24/4/28 dmg110 GD15 H+2 B-12
雪崩抱え S15 dmg105 whiff38 no armor
地伏せ 23/4/28 dmg95 GD12 H+1 B-11
不動押し 13/4/19 dmg62 GD16 H0 B-4 small push
白峰打ち 22/4/27 dmg105 GD14 H+1 B-11 Modern
雪煙崩し 28/4/35 dmg135 GD18 H0 B-17

Iron Wall consume:
雪壁掌 startup11 dmg83
白峰打ち recovery21 dmg121
雪煙崩し dmg155 GD28

## Chilka
だまし突き 15/3/21 dmg82 GD10 H+2 B-7 Modern Feint Delay
空鳴り爪 22/4/28 dmg115 GD14 H+2 B-12 Delay
すかし抱き S15 dmg105 whiff38
影踏み 20/4/26 dmg95 GD12 H+2 B-10 Modern Delay
つんのめり 12/3/20 dmg72 GD8 H+1 B-8 Reach0
戻り蹴り 20/4/26 dmg108 GD13 H+2 B-10 Modern
あと出し頭突き 30/4/36 dmg150 GD17 H0 B-18
Delay版 startup38 unblockable dmg150

## Takimaru
丸抱え S14 dmg115 whiff36 Modern special
巻き投げ S18 dmg135 whiff44
ぶちかまし 16/4/24 dmg100 GD14 H+2 B-6 Pressure
足さらい 19/4/26 dmg95 GD11 H+1 B-11
熊手払い 22/4/29 dmg115 GD16 H+3 B-9 Modern Pressure
肩車崩し Pressure+Grab S12 dmg125 whiff36
大回転落とし S22 dmg160 whiff50 Classic-only armor

## Yomikage
影縫い 10/3/18 dmg66 GD8 Modern
霞落とし 18/4/25 dmg84 GD10 Classic
月かすめ 16/3/22 dmg88 GD10 Modern
腕返し Return Grab S11 dmg105
後の先・天 8/3/18 dmg100 GD11 / Just 6F dmg110
後の先・地 10/4/23 dmg110 GD12 lightDown / Just 8F dmg121
後の先・芯 13/3/27 dmg118 GD13 / Just 11F dmg130

## Bullet
弾み突き 13/3/20 dmg72 GD8 gain Modern
尾払い 20/4/25 dmg88 GD11 gain Modern
跳ね上げ 18/3/24 dmg94 GD11 gain Modern
蓄圧タックル 18/4/27 dmg120 GD16 H+2 B-10 cost1 armor
抱え弾き S15 dmg105 whiff37 gain
圧抜き 16/3/22 dmg78 GD12 H+3 B0 cost1 Guard+15
弾丸頭突き 31/4/42 dmg200 unblockable hardDown cost3 whiff+15

## Dark
黒走り 11/3/19 dmg70 GD8 chain Modern
逆昇撃 14/3/22 dmg88 GD10 chain Modern
闇引き S16 dmg100 whiff40 no chain
黒砂払い 16/4/23 dmg78 GD9 chain Modern
裏山越え 22/4/29 dmg115 GD13 chain Classic
闇押し 10/3/17 dmg60 GD8 chain Modern
黒煙突き 27/4/35 dmg140 GD16 H0 B-18 Finisher comboEnd no chain
