# ABILITY STATE MACHINES FINAL

# 共通

- deterministic simulation frames
- UI stateとinternal stateを分離
- Roundで全固有Gauge/stock/temp/pending reset
- spendはmove start、refundなし
- Ability normalChain resetはcombo scaling resetではない
- multi-hit 1actionから同resource複数gain禁止
- onlineで必要なinternal stateはhash対象
- KO/Round/Matchでpending clear

# Moguzo — GUTS / 踏ん張り

State:
gutsActive
gritAvailable

Round:
false / true

Guts:
damage resolution後HP<=30%でactive、Round中維持。
outgoing HP damage x1.10。
Normal/Command/Grab/Roar/Ult対象。
GD/chip/Gyuiin対象外。
防御/速度buffなし。

踏ん張り:
currentHP>=2、
incoming致死、
gritAvailableならHP1、grit=false。
Normal/Command/Grab/Roar/Ult/Gyuiin対象。
timeout/forfeit/disconnect/system loss除外。
Ultも対象。

# Pisuke — CHASE

State:
chaseReadyUntilF
chaseSourceActionId
chaseActive

Normal HITのみtrigger。
Hitstop end +12F ready。
SWAY/LUNGEでremaining normal recovery cancel→通常Dodge。
CROUCH不可。
start時 normalChainCount=0 / Modern history reset。
evade success不要。
次NormalはDodge終了後。

clear:
BLOCK/被弾/Throw/Command/Roar/Ult/Down/Round/timeout。

# Godan — ARMOR STOCK

stock3 Round。自然回復なし。

山掴み:
cost1
F6-F16 1hit armor
incoming dmg x0.60
Grab/Roar/Ult pierce

岩砕き:
cost1
F5-F20 1hit armor
incoming dmg x0.60
Grab/Roar/Ult pierce

巌の構え:
cost1
startup5 / counter8 / fail recovery22
Normal/Command strike incl unblockableをcounter
Grab/Roar/Ult/Gyuiin不可
success dmg125
standalone、Classic Cancel不可

大山押し:
cost2
F5-active end Hyper Armor
multi-hit
incoming dmg x0.30
Grab/Roar/Ult pierce

resource不足→Command unavailable / normal fallback。

# Hakuma — IRON WALL

boolean start false。

Gain:
Guard success / Correct Dodge / Mikiri
max1 / 1action1回。

Lose:
consume start / 被弾 / Throw / Down / GuardBreak / Round。
timeoutなし。

Spend only:
雪壁掌 S15→11 dmg72→83
白峰打ち R27→21 dmg105→121
雪煙崩し dmg135→155 GD18→28

他技はready保持。

# Chilka — FEINT / DELAY

per action:
trickChoice none|feint|delay
first accepted only

window:
だまし突き F4-F10 both
空鳴り爪 F6-F14 delay
影踏み F5-F13 delay
あと出し頭突き F8-F18 delay

だまし突きtelegraph中Guard Tapは自身FeintとしてMikiriより優先。

Feint success:
telegraph後、相手がCROUCH/SWAY/LUNGE/MIKIRI開始。
Guard/Attack/Grabはsuccessでない。
追加相手stunなし。
success recovery6 / fail12。

Delay:
same height reinput
startup +8
Damage/GD/stun/armor bonusなし。

Delayed あと出し:
total startup38
Unblockable
dmg150
Dodge/Mikiri/Interrupt可
Armorなし
接触前約10F cue。

Feint/Delay inputはnormalChain/Modern/OP外。

# Takimaru — PRESSURE

state none|ready|throwQueued。

trigger:
ぶちかまし/熊手払い HIT/BLOCK。
WHIFF/EVADEなし。

opponent actionableの6F前からGrab prequeue可。
Pressure activeはopponent actionableから12F。
queued肩車崩しはopponent最初のactionable Fからstartup12。
active中入力なら入力時から12F。
guaranteed throwにしない。

clear:
throw start/expire/被弾/Throw/Down/Roar/Ult/non-pressure action/Round。

肩車崩し:
Pressure-only
direct Classic/Modern不可
dmg125 whiff36
新Damage sequence 100%。

大回転落とし:
Classic-only
S22 dmg160 whiff50
F5-F21 1hit armor
incoming dmg x0.80
2hit目break
Grab/Roar/Ult pierce。

# Yomikage — RETURN / JUST

state:
none|pending|ready
just bool
queued action

Correct ordinary Dodgeのみ。
Mikiri不可。

Just:
evade contact at Dodge pf F5-F9。

Correct actionable:
normal F18
Just F14。

Dodge recovery中H/M/L/Grab 1つprebuffer。
actionable時queued即start、なければReady。

Ready:
normal14F
Just22F。

H=天
L=地
M=芯
Grab=腕返し

Return:
normalではない
normalChain/Modern/OP外。

Just:
Return startup -2F
dmg x1.10
GD unchanged。

clear:
Return/Normal/Normal Command/Guard/another Dodge/Roar/Ult/被弾/Throw/timeout/Round。

Classic windows:
天16 / 地14 / 芯12 / 腕16。

# Bullet — CHARGE

state:
charge0..3
lastSuccessfulChargeGainMove

Round 0/null。

Gain:
弾み HIT
尾払い HIT
跳ね HIT
抱え弾き success

current gain move != lastSuccessful → +1 cap3、store。
same→+0。

A-A +1,+0
A-B-A 全gain
A-normal-A second no
failed B signature不変。

Spendはsignature不変。
start consume / refundなし。

蓄圧:
cost1
F6-F17 1hit armor
incoming dmg x0.85
Grab/Roar/Ult pierce。

圧抜き:
cost1
HIT/BLOCK Guard+15 cap
whiff/interrupted回復なし
Block0 / Hit+3。

弾丸頭突き:
cost3
Unblockable
Dodge/Mikiri/Interrupt可
Armorなし
dmg200 hardDown
clear cue。

resource不足→normal fallback。
Charge3 OverchargeはUIのみ。passive buffなし。

# Dark Moguzo — DARK CHAIN / BODY

state:
gauge0..100
ready
body
remainingF
chainUses
lastChainMove
normalWindow

Round reset all。

compatible:
黒走り / 逆昇撃 / 黒砂払い / 裏山越え / 闇押し

HITで:
uses上限未満
different from last
→ uses+1
→ last=current
→ normalChain=0
→ Modern history reset
→ gauge +30 outside Body
→ Normal window
combo/scaling resetなし。

Normal:
max2/window16。

Body:
max3/window20。

next input:
Normal→cancel to new normal chain
formal Classic→Classic Cancel path優先
nothing→natural recovery

Classicを選んでも既発生chain event/gauge/usesは維持。
Normal windowは閉じる。

Gauge:
successful dark chain +30 only。
100=ready。
midcombo activateしない。

first neutralでBody activate。
条件:
Dark idle/actionable
opponent not hit/blockstun/grab/down。

activate:
gauge0
readyfalse
bodytrue
360F

Body:
no gauge gain
Normal startup -1
Command startup -2
Damage x1.08
window20
max3
HP/Guard/armor/defense buffなし。

timer simulation frame。
midaction expiryはcurrent action snapshot保持、next action normal。
