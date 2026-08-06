# マモ拳 製品正本・命名・差分管理 v1.0

- 更新日: 2026-08-06
- 工程: P00
- 状態: COMPLETE
- 対象: 非アート・非ゲーム性の製品レイヤー

## 1. 目的

P00は、P01〜P11を進める前に以下を固定する。

- 製品正本の優先順位
- 安定したP番号・owner・依存関係
- setting ID / save key / error class / release channel
- 未決値をpending/openのまま保持する規則
- FORMAL昇格条件
- completion gate
- scoped diff gate
- rollback note
- CI

P00は戦闘runtimeと別系列であり、戦闘仕様を決めない。

## 2. 正本優先順位

```text
1. explicit current decision
2. versioned product contract
3. completion report
4. implementation and tests
5. roadmap or proposal
```

下位資料だけで上位決定を上書きしない。

## 3. 安定Phase ID

| ID | Name | Owner | P00時点 |
|---|---|---|---|
| P00 | Product source-of-truth / naming / diff governance | product | COMPLETE |
| P01 | QA foundation | qa | PENDING |
| P02 | Save and migration | save | PENDING |
| P03 | Menus and product navigation | ux | PENDING |
| P04 | Accessibility | accessibility | PENDING |
| P05 | Device lifecycle | platform | PENDING |
| P06 | Performance budgets | performance | PENDING |
| P07 | Online operations UX | online_ops | PENDING |
| P08 | Rights and compliance | legal | PENDING |
| P09 | Tutorial and onboarding | tutorial | PENDING |
| P10 | Localization | localization | PENDING |
| P11 | Release readiness | release | PENDING |

IDを再利用・改名しない。工程を廃止する場合もIDを欠番化せず、状態と理由を残す。

## 4. 状態schema

### Work status

```text
PENDING
OPEN
IN_PROGRESS
BLOCKED
COMPLETE
```

許可遷移はコード正本`PRODUCT_CONTRACT.statusTransitions`に従う。COMPLETEからの暗黙再開は禁止し、新しい変更はOPENへ戻す明示契約が必要。

### Decision status

```text
PENDING
OPEN
FORMAL
```

- PENDING / OPEN: `value=null`
- FORMAL: resolved valueとsourceRefが必須
- `UNKNOWN`をFORMALにしない
- PENDINGからFORMALへ直接昇格しない

## 5. Stable setting IDs

```text
settings.audio.master
settings.audio.bgm
settings.audio.sfx
settings.accessibility.screen_shake
settings.accessibility.flashes
settings.input.haptics
settings.language.locale
```

表示文言を変更してもIDは変えない。

## 6. Save keys

```text
mamoken.save.v1
mamoken.settings.v1
mamoken.replay.v1
```

schema変更時は既存keyを上書き再解釈せず、version付きkeyとmigrationを追加する。

## 7. Error code classes

```text
VALIDATION
STORAGE
NETWORK
PROTOCOL
ASSET
LIFECYCLE
UNKNOWN
```

ユーザー向け文言と内部classを分離する。UNKNOWNは観測用fallbackであり、既知エラーをUNKNOWNへ押し込まない。

## 8. Release channels

```text
local
preview
staging
production
```

前段channelを飛ばしてproductionへ昇格しない。P11がchannel gateを所有する。

## 9. Completion gate

Phase COMPLETEにはすべて必要。

1. 登録deliverableがtrue
2. 対象decisionがすべてFORMAL
3. FORMAL value/sourceRefが解決済み
4. tests passed
5. scoped diff passed
6. rollback noteあり
7. rollback noteのtrigger / target / verificationが埋まっている

一つでも欠ければCOMPLETEにしない。

## 10. Scoped diff gate

P00許可範囲:

```text
design/product/**
src/product/**
test/product-*.test.mjs
reports/product/**
.github/workflows/product-contract.yml
package.json
tsconfig.product.json
```

禁止範囲:

```text
prototype/**
dist/**
runtime/**
server/**
assets/**
src/core/**
design/combat/**
```

P00は戦闘BAL、入力、オンラインプロトコル、キャラ性能へ権限を持たない。

## 11. Rollback note

各Phaseは最低限以下を記録する。

```text
trigger
rollbackTarget
preservedData
verification
```

P00既定:

- trigger: completion gate regression or scoped-diff violation
- target: last green product contract commit
- preserve: user save data / user settings / diagnostic evidence
- verify: product contract test + affected phase smoke test

## 12. 差分・命名規則

- 1 PR = 1 P工程または明確な単一subtask
- G工程とP工程を同じPRへ入れない
- stable IDは表示名から生成しない
- pending値を仮値で埋めない
- candidate/proposalをFORMALと呼ばない
- completion reportにはscope / gate / rollback / non-goalsを残す

## 13. P00完了成果物

```text
src/product/product-types.ts
src/product/product-contract.ts
src/product/index.ts
test/product-contract.test.mjs
tsconfig.product.json
.github/workflows/product-contract.yml
reports/product/P00_COMPLETION.md
```

P01はこの契約を前提にQA matrix、smoke、regressionの正本化から開始する。
