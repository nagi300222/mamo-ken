# Fable5統合レビュー依頼 — T00／T02

## 依頼

T01マージ後にCodexで実行したT00監査とT02 Core型・定数レイヤーについて、添付レポートとDraft PRを確認してください。

本文の全面再設計ではなく、次を判定してください。

1. T00監査の事実認定
2. T02が現行挙動を維持しているか
3. Core型・定数責務が`docs/03_data_design.md v2.7`に整合するか
4. Online決定論を壊していないか
5. T00 PRのマージ可否
6. T02 PRのマージ可否
7. T03へ進めるか
8. T06へ渡すLegacy差分が正しいか

## Current Baseline

- T01：merged
- PR：#16
- Merge commit：`6f707d171da9dbbcfec1e3ba1bd08d333d480500`
- Docs：`docs/03_data_design.md v2.7`
- Integrated Design：v1.0.2
- Checkpoint 2：GO
- P0 blocker：なし

## T00

- PR：
- Branch：
- Base SHA：
- Head SHA：
- Result：
- Runtime diff：
- BAL diff：
- Asset diff：
- Server diff：
- dist diff：
- Build：
- Tests：
- New blocker：

### Confirmed current implementation

#### Input 10／12／24F

#### FighterPhase／BattleFlow

#### Roar

#### S Gauge

#### Gyuiin

#### Down／Wake／Round

#### KO／Time Up

#### Command moves

#### CPU／PRNG

#### Pose／Asset

#### Online Sync

#### Save

### Docs v2.7 differences

| ID | Current implementation | v2.7 target | Planned task |
|---|---|---|---|

### T02 inputs

### T06 inputs

## T02

- PR：
- Branch：
- Base SHA：
- Head SHA：
- Result：
- Runtime diff：
- Numeric diff：
- Online protocol diff：
- Server diff：
- Build：
- Unit tests：
- 10,000F determinism：
- P1／P2 swap：
- Source／dist consistency：
- State hash：
- New blocker：

### Architecture summary

### Contracts

### Current／Provisional／Legacy separation

### Runtime single source

### Canonical snapshot

#### Included fields

#### Excluded fields

### Stable serialization／hash

### Known Legacy preserved

### T03 inputs

### T06 inputs

## ChatGPT Hub Preliminary Review

- T00：
- T02：
- Risks：
- Recommended merge order：

## 添付・参照

- `reports/T00_COMPLETION.md`
- `reports/T02_COMPLETION.md`
- T00 Draft PR
- T02 Draft PR
- `reports/current_impl_constants.json`
- `reports/current_impl_phases.json`
- `reports/current_impl_sync_scope.md`
- T02テストログ

## Fable5へ求める回答形式

```text
T00: MERGE_GO / CHANGES_REQUIRED / HOLD
T02: MERGE_GO / CHANGES_REQUIRED / HOLD
T03: GO / HOLD
T06_INPUTS: ACCEPT / REVISE
BLOCKERS:
REQUIRED_CHANGES:
LEDGER_UPDATE:
```
