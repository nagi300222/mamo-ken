# マモ拳 BattleState V2 / MoveSpec V2 schema v0.2

- 更新日: 2026-08-06
- 工程: G01
- 状態: `PROTOTYPE_CANDIDATE`
- 権限: `shadow_only`
- live runtime authority: なし

## 1. 役割

G01はG00の統合契約v0.2を、後続shadow resolverが受け取れる型へ展開する。

この工程は型・factory・validator・deterministic hashだけを追加する。既存runtimeからのadapter、接触判定、同時解決、BAL昇格は行わない。

## 2. BattleState V2

BattleStateは次の直交領域を分離して保持する。

```text
BattleFlow
FighterControlState
PostureState
ActionState
DefenseState
AbilityState
SpatialPairState
RoundState
FreezeState
InputHoldState
BulletChargeState
```

`InputHoldState`と`BulletChargeState`を兼用しない。

## 3. 3時計

```text
simulationFrame
combatFrame
fighterActionFrame[P1/P2]
```

G00 freeze policyに従う。

- NONE: simulation / combat / active fighter actionが進む
- HITSTOP / ULTIMATE_FREEZE / GYUIIN_INTRO / KO_FREEZE: simulationだけ進む
- PAUSE: すべて停止

clock factoryは純粋関数であり、live loopへ接続しない。

## 4. FighterState V2

各fighterは以下を持つ。

```text
playerId
characterId
controlState
postureState
action
defense
ability
resources
timers
inputHold
bulletCharge
```

主要不変条件:

- idle actionはactionId / moveId / start frameを持たない
- fighterActionFrameとaction.actionFrameは一致する
- down / ko controlはDOWN posture
- BulletだけがBulletChargeStateを持つ
- non-BulletはbulletCharge=null
- resource current値は0..max
- hold開始Fは現在simulationFrameを越えない

## 5. Current gauge schema

G01.1 current gauge schema correction. 現行runtime正本に合わせ、fighter resourcesは次を保持する。

```text
hp / maxHp
guard / maxGuard
sGauge / maxSGauge
focusGauge / maxFocusGauge
ultimateStock / maxUltimateStock
```

Bulletのchargeはresourcesへ混ぜず、引き続きBulletChargeStateで管理する。独立したroarGaugeは現行正本に存在しないため削除する。ContactResultはS / focus / ultimate / Bullet chargeのdeltaを別々に持つ。

## 6. SpatialPairState V2

```text
engagement
clinchRemainingF
overextendedPlayer
sideSwap=false
lastPositionBatchId
```

CLINCH中は両fighterがCLINCH postureで、残りFが1以上。NORMAL中はclinchRemainingF=0。

## 7. Full MoveSpec V2

Full MoveSpec V2は以下を含む。

```text
identity / status / authority
moveKind / contactKind
timing
contactSchedule
reachClass / targetPostures
movement / result positions
down policy / wake profile
damage / hitstop
advantage policy
cancel windows
armor
invulnerability
resource policy
tags
```

## 8. TaggedValue

未決値と「明示的になし」を区別する。

```text
OPEN:
  status=OPEN
  value=null
  sourceRef optional

resolved:
  status=CURRENT_ANCHOR / PROTOTYPE_CANDIDATE / FORMAL
  value required
  sourceRef required
```

例:

- `armor=OPEN` はarmor有無が未決
- resolved `armor.value=null` はarmorなしが明示済み
- `wakeProfileId=null` は非down技
- down技の未決wake profileはTaggedValue OPEN

FORMAL MoveSpecはOPEN値を一つでも含められない。

## 9. G00 closureからの変換

G00の21技closureをFull MoveSpec V2へ変換する。

保持するもの:

- identity
- moveKind / contactKind
- contactSchedule
- movement kind / maximumApproachSteps
- downType / followupAllowed
- cancel windows
- resourcePolicyId
- advantage applicability

G01でOPENのままにするもの:

- timing
- damage / chip / guard damage / hitstop
- reach import
- end position results
- wake profile
- armor presence
- invulnerability presence
- standard advantage values

数値の実importと21技candidate validationはG08の責務。

## 10. Intent / Result

G01は同時batch resolver用のデータ型だけを定義する。

```text
ActionStartIntent / Result
PositionIntent / Result
ContactIntent / Result
FrameBatchIntent / Result
```

全Intentは以下を持つ。

```text
batchId
source frame
preStateHash
player identity
```

FrameBatchはP1/P2を同じpreStateHashから表現する。解決処理はG09まで追加しない。

## 11. 理由コード

```text
OK_*
REJECT_*
RESULT_*
```

少なくとも次を含む。

- REJECT_FAIL_CLOSED
- REJECT_OUT_OF_REACH
- REJECT_THROW_RANGE
- REJECT_CANCEL_WINDOW
- RESULT_HIT / BLOCK / MIKIRI / DODGE / ARMOR / THROW / WHIFF / TRADE / STANCE

表示文言とreason codeを分離する。

## 12. 対称性

FrameBatchIntentはP1/P2 swap関数を持つ。

```text
swap(swap(batch)) == batch
```

G01は型対称性だけを検証し、勝敗やdamageの同時解決は行わない。

## 13. 非目標

- live runtime adapter
- runtime authority切替
- 21技数値のFORMAL化
- 実際の接触batch resolver
- position resolver
- throw resolver
- down/wake resolver
- resource resolver
- online protocol変更
- prototype / dist / runtime / server / assets変更

## 14. 後続

```text
G02 read-only legacy adapter
G03 frame/advantage shadow
G04 posture/reach/position shadow
G05 throw shadow
G06 down/wake shadow
G07 resource/ability shadow
G08 21 MoveSpec candidate validation
G09 simultaneous resolver shadow
```
