# T04 Completion — MoveSpec・通常技・コンボ基盤

## PR / branch / baseline

- PR: #26 (`feature/combat-movespec-v1`, Draft)
- Base: `main` at `090c7ffe2f7bad3e88db342e83e801fffe43a0df`
- Implementation head before completion-report commits: `a12095f53024fe3433009cb92921e974536b38c5`
- Source of truth: `docs/03_data_design.md` v2.7 §§6, 8, 10.1, 16.2、T00 audit、T02/T03 Core contracts。

## Exact changed files

- `.github/workflows/core-check.yml`
- `package.json`
- `src/core/index.ts`
- `src/core/combat-types.ts`
- `src/core/combat-moves.ts`
- `src/core/combo.ts`
- `src/core/combat-validation.ts`
- `test/combat-moves.test.mjs`
- `reports/T04_COMPLETION.md`
- `reports/FABLE5_ROLLUP.md`

`package-lock.json`、runtime HTML、server、UI、assets、generated distは変更しない。

## API summary

- `CombatMoveSpec`: v2.7 §6.1のMoveSpec契約。T02の監査用`MoveSpec`名との衝突を避け、runtime移行前は明示名で分離する。
- `CombatCharacterSpec`: v2.7 §6.2のCharacterCombatSpec契約。
- `CurrentMoveMigrationRecord`: 現行通常技をtarget構造へ写すrecordとフィールド単位の状態ラベル。
- `CURRENT_NORMAL_MOVE_RECORDS` / `CURRENT_NORMAL_MOVES`: 現行4通常技。
- `CURRENT_COMBO_PROFILE`: 現行3Hitチェーン、補正、カウンターroute、S獲得、ダウン追撃。
- `createTargetProvisionalComboProfile()`: Capacity、Hit補正、反復補正、高さ上限を隔離した検証profile。
- `resolveComboStep()` / `evaluateComboRoute()`: cancel、Capacity、repeat、height、Knockback終端を固定順で判定するpure evaluator。
- `resolveDownFollowup()`: 現行ダウン中1回追撃を独立解決する。
- `areSameMoveForClash()`: Move IDとlevelによる同一攻撃identity比較。
- `validateCombatMoveSpec()` / `validateCombatCharacterSpec()` / `validateComboRuleProfile()`。

## Current implementation migration

現行4通常技の以下は`CURRENT_CONTRACT.bal`から生成する。

- Startup / Active / Recovery / Damage / runtime weight
- Telegraph
- Guard Damage / low chip
- 現行Combo max、scale、chain window、counter scale、S獲得、down followup

v2.7 §16.2の現行表からHit/Block advantageを記録する。下段の`hitAdvF=0`はDownを数値欄へ置くためのsentinelで、`audit_required`扱いとする。

Target interfaceへ写す際に未監査となる概念値は個別に`audit_required`を付ける。

- しゃがみ突きのtarget `level='mid'` mapping
- Reach Class
- 非下段のHit Knockback Class
- Block Knockback Class

これらはT04でruntimeへ接続しない。

## Contact frame audit

現行runtimeは接触候補を`phaseFrame === startup + 1`で扱う。

- しゃがみ突き: 11F
- 中段: 15F
- 上段: 23F
- 下段: 31F

`CURRENT_CONTACT_FRAME_OFFSET = 1`としてfixture化した。Startup値自体は変更しない。

## Current combo compatibility

- Max hits / capacity: `3`
- Cancel window: `14F`
- Rule: runtime weightの小さい技から大きい技のみ
- Damage scales: `[1.0, 0.9, 0.8]`
- Counter route scales: `[1.0, 1.0, 0.9]`
- Counter starter multiplier: `1.25`
- Hit S gains: `[12, 7, 4]`
- Down followup: 1回、damage `0.5`
- 同技repeat: 現行cancel route上で不許可
- Block / whiff cancel: なし

Fixture results:

- `中→上→下`: `70 / 90 / 120`、total `280`
- `しゃがみ→中→上`: total `193`、4Hit目は`max_hits`
- counter `中→上→下`: `88 / 100 / 135`、total `323`
- down followup with low base 150: `75`、2回目拒否

## Target / provisional isolation

次は`PROVISIONAL` profileだけに置き、current runtimeでは使用しない。

- Capacity: standard 3.5 / rush 4.5 / power 2.5 / defense 2.5 / tricky 4.0 / grappler 3.5 / counter 3.5 / charge 3.5 / charge MAX 4.5 / Dark Moguzo PvP 5.5
- Weight: 0.5 / 1.0 / 1.5 / 2.0 / 2.5、追撃可能投げ1.5＋専用補正
- Hit scales: `[1.00, 0.88, 0.76, 0.66, 0.58, 0.52]`
- Minimum scale: `0.40`
- Counter starter: `1.20`
- Repeat Damage: `[1.00, 0.85, 0.70, 0.55]`
- Repeat Hitstun: `[1.00, 0.90, 0.75, 0.60]`
- Repeat Roar gain: `[1.00, 0.70, 0.45, 0.20]`
- Style別high/mid/low段数上限

技別target cancel配列は`UNDECIDED`のため、evaluatorは配列を消費できる形だけを実装し、新しいrouteを現行ゲームへ有効化しない。

## Determinism / validation results

- Independent 10,000F replay hash: `7fab5c7a`
- Changed route hash: `b9bd6d05`
- Negative divergence frame: `731`
- Current MoveSpecs: validator pass
- Current / all provisional combo profiles: validator pass
- Invalid startup / duplicate cancel negative tests: pass
- Forbidden APIs: no `Math.random`、wall-clock Date、locale comparison、DOM、Canvas、Audio、timer。

## Runtime / BAL / protocol scope

- Current runtime behavior: diff 0
- Existing BAL numeric values: diff 0
- Existing normal attack behavior: diff 0
- Existing combo behavior: diff 0
- Existing command moves: diff 0
- Fighter phase order: diff 0
- CPU decisions: diff 0
- Online message schema: diff 0
- Server / UI / assets / generated dist behavior: diff 0

## Known constraints / handoff

- T04はCore contractとfixtureのみ。`prototype/mamoken_prototype_v01.html`をrewireしない。
- Reach / Knockbackのtarget class確定は接触・仕切り直し移行PRで監査する。
- しゃがみ突きのtarget level mappingはT05の防御・回避契約と同時に確定する。
- 技別target cancel配列と通常技family候補値は別BAL PRで検証する。
- T05はT03 input resultとT04 MoveSpecを消費できるが、runtime統合はオンライン長時間決定論回帰を含む別scopeとする。
- GitHub Actions `Core contract check`がmerge gate。
