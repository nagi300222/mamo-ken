# マモ拳 戦闘統合契約 v0.2

- 更新日: 2026-08-06
- 工程: G00 Combat Contract Closure
- 状態: `PROTOTYPE_CANDIDATE`
- 権限: `shadow_only`
- live runtime authority: **なし**
- FORMAL BAL authority: **なし**

## 1. 役割

本書は Battle Resolution / Frame & Actionability / Input & Cancel / Spatial & Reach と追加設計成果物を、後続のBattleState V2・MoveSpec V2 shadowへ渡す統合境界である。

既存v0.1資料は履歴として保持する。本書は数値正本を置換せず、G-F01〜G-F06のschema修正を閉じる。

## 2. 権限境界

```text
schema / validator / pure audit / shadow candidate = GO
live runtime / existing BAL / online protocol       = HOLD
FORMAL candidate promotion                           = HOLD
```

`PROTOTYPE_CANDIDATE`を検証なしで`FORMAL`へ昇格しない。

## 3. BattleState V2直交状態

```text
BattleFlow
FighterControlState
PostureState
ActionState
DefenseState
AbilityState
SpatialPairState
```

PostureStateは次だけを持つ。

```text
NORMAL
SWAY_SHALLOW
SWAY_DEEP
CROUCH
LUNGE
CLINCH
DOWN
```

旧`SWAY`はG02 legacy adapterだけの親概念とし、新enumへ併記しない。

## 4. 3時計

```text
simulationFrame
combatFrame
fighterActionFrame[P1/P2]
```

hitstop中はsimulationFrame・入力履歴・state hashだけ進む。combatFrame、action timeline、stun、down/wake、位置、CPU判断は止まる。

`globalFreeze`はhitstopと別管理する。PAUSEだけはsimulationFrame・入力履歴・hashも停止する。

## 5. 権威フレーム順

両者を同じpre-frame stateから処理する。

```text
01 input intake
02 history / hold / release
03 command candidate
04 prebuffer / branch
05 ActionStartIntent
06 simultaneous action apply
07 timeline / armor / invulnerability / dodge
08 PositionIntent
09 simultaneous position apply
10 ContactIntent
11 defense classification
12 batch ContactResult
13 simultaneous damage / guard / stun / down / resource
14 cancel / ability / counter windows
15 KO / guard break / gyuiin / timeout
16 recovery / expiry / cleanup
17 deterministic hash / validation log
```

P1を適用してからP2を判定しない。同一batchでHP0になった側の接触も消さない。

## 6. 入力契約

入力正規化順と行動選択優先順は別定数にする。

```text
normalization:
release → direction_press → guard/mikiri → attack/grab → roar/ultimate

action priority:
ULTIMATE → ROAR → ABILITY → long command → short command
→ throw branch → STEP_CANCEL → normal chain
```

候補入力値:

```text
commandPrebufferF       10
方向履歴F               40
directionGapMaxF        18
finalTriggerGraceF      10
guardTapThresholdF       6
sameDirectionMinGapF     2
commandTotal2F          24
commandTotal3F          30
commandTotal4F          40
```

`legacyGestureSlackF`と`rowBoundaryHysteresisPx`は現行adapter計測待ちでOPEN。

InputHoldStateとBulletChargeStateを分離する。

## 7. CLINCH

```text
standard duration              24F
simultaneous-forward duration  18F
expiry                         NORMAL_RESET
```

hitstop/globalFreeze中は減らない。throw成功、down、round transition、ultimate、gyuiinで消去する。

## 8. Reach / 空間

```text
Reach 0 = CLINCH
Reach 1 = CLINCH, NORMAL
Reach 2 = CLINCH, NORMAL, SWAY_SHALLOW
Reach 3 = CLINCH, NORMAL, SWAY_SHALLOW, SWAY_DEEP
```

CROUCHはtarget mask、LUNGEは属性三すくみで解決する。描画座標は戦闘権限にしない。

```text
forwardMovement:
NONE / ONE_STEP / TWO_STEP / CHASE_TO_CONTACT / ENTER_CLINCH

end position:
KEEP / NORMAL_RESET / CLINCH / OVEREXTENDED / DOWN_RESET
```

現行9体はsideSwap=false。

## 9. G-F01 CPU組合せ

9体について以下を必須とする。

```text
non-mirror unordered pairs = 36
mirror pairs               = 9
all runs                    = side-swapped symmetry required
```

CPUはraw input、future queue、0F反応を使わない。

## 10. G-F02 moveKind / contactKind

MoveSpecは`moveKind`を持ち、接触はtagged unionで表す。

```text
strike → { kind, level }
throw  → { kind, throwRange }
stance → { kind, stanceId }
```

throwの距離権威はreachClassではなく`throwRange`。

throw / stance / down結果へ通常hitAdv式を使わず、`advantagePolicy=not_applicable`とする。

## 11. G-F03 maximumApproachSteps

`CHASE_TO_CONTACT`だけが`maximumApproachSteps`を持てる。

ピスケ「つむじ返し」は次を候補採用する。

```text
forwardMovement       CHASE_TO_CONTACT
maximumApproachSteps  2
status                 PROTOTYPE_CANDIDATE
```

## 12. G-F04 contactSchedule

全技がcontactScheduleを持つ。

- 単発: count=1 / activeOffsetsF=[0]
- 二連牙: count=2
- かすみ連打: count=3

多段2技の正確なactive offsetは元資料で固定されていないため`OPEN_TIMING`とし、配列を捏造しない。

## 13. G-F05 cancel window

cancel windowは次を必須にする。

```text
basis
startOffsetF
endOffsetF
allowedMoveIds
oncePerCombo
statusTag
```

G00 overlayでは旧windowF候補を`FIRST_CONTACT`基準のoffsetへ変換したが、引き続きPROTOTYPE_CANDIDATEである。cancel graph cycle検査を必須とする。

## 14. G-F06 resource policy

技ごとの固定S gainを新schemaへ複写しない。

```text
resourcePolicyId = resource.action-contact-v0.2
```

多段でも1action分だけ集計する。policyの実数値はFORMAL未昇格。

## 15. ダウン候補

- 根こそぎ: `lightDown / comboEnd / followupAllowed=false`
- スライディング: lightDown候補、共通down follow-up契約の検証対象
- 地割れ / 天蓋落とし: hardDown候補
- 投げ: throwDown

通常の有利式は使わない。

## 16. 候補JSON

`MAMOKEN_CURRENT_3_CHARACTERS_MOVESPEC_CLOSURE_v0.2.json`はv0.1数値候補を継承するclosure overlayである。

- 21 unique moves
- current 3 characters × 7
- G-F02〜G-F06のみ追加
- 数値候補をFORMALへ昇格しない
- 未確定タイミングはOPENのまま保持

## 17. 後続

```text
G01 BattleState V2 / MoveSpec V2 full types
G02 read-only legacy adapter
G03 frame/advantage shadow
G04 posture/reach/position shadow
G05 throw shadow
G06 down/wake shadow
G07 resource/ability shadow
G08 21 MoveSpec candidate validation
G09 simultaneous resolver shadow
```
