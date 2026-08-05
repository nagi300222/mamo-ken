# マモ拳 Codex継続指示 — T00 → T02

## 現在地

- Repository: `nagi300222/mamo-ken`
- T01: 完了・マージ済み
- PR: `#16`
- T01 merge commit: `6f707d171da9dbbcfec1e3ba1bd08d333d480500`
- 正本: `docs/03_data_design.md v2.7`
- Fable5: 利用枠回復待ち
- 今回の担当: T00残監査を完了し、条件を満たす場合だけT02をDraft PRまで進める

## 最初の操作

このファイルは `ops/codex-handoff-t00-t02` ブランチにあります。現在の作業ブランチへ取り込まず、指示書として読んでください。

```bash
git fetch origin ops/codex-handoff-t00-t02
git show origin/ops/codex-handoff-t00-t02:codex_handoff/START_HERE_T00_T02.md
```

T00とT02は別ブランチ・別Draft PRにしてください。どちらも自動マージ禁止です。

---

# Phase 1 — T00残監査

## Branch / Commit

- Branch案: `audit/current-impl-v1`
- Base: main最新
- Commit案: `audit: record current implementation contract`
- PR: Draft

## 目的

現行mainを推測なしで記録し、v2.7の `CURRENT_IMPL / PROVISIONAL / LEGACY / AUDIT_REQUIRED` を混同しない監査証拠を作る。ゲーム挙動は変更しない。

## 変更禁止

- Runtime挙動
- BAL
- 入力・コマンド成立
- CPU判断
- アセット
- Online protocol
- Server
- `dist`

## 追加する成果物

```text
reports/design_audit_v1.md
reports/current_impl_constants.json
reports/current_impl_phases.json
reports/current_impl_sync_scope.md
tools/audit_current_impl.mjs
reports/T00_COMPLETION.md
```

同等の分割は可。ただし、監査報告、JSON、再実行可能な監査スクリプト、完了報告は必須。

## 監査対象

### A. リポジトリ構造

- Runtime source
- Mobile build source
- package scripts
- test有無
- server / worker境界
- `dist`生成方式

### B. 入力10 / 12 / 24F

コード参照付きで用途を確定する。

先行確認候補:

```text
BAL.BUF = 10
BAL.CMD.buffer = 12
BAL.CMD.bufF = 24
BAL.FLICK_MS = 300
BAL.JUST_TAP_MS = 100
```

特に、Fable5台帳の「10F=タップ・フリック判定の遊び」と、現コードの `BAL.BUF` 通常攻撃buffer使用が一致するか確認する。名称混同か実装差かを明記する。

### C. FighterPhase

全ての代入、比較、描画pose選択から、実在phaseを列挙する。

最低候補:

```text
idle attack cmdAtk cmdStance guard blockstun hitstun mikiriRec
dodge roar grab grabrec grabHit grabbed down wake dizzy clash
ultAtk ko win
```

未使用、候補外、表記揺れも報告する。

### D. BattleFlow / game.screen

実在flowを列挙し、`game.screen`と分離する。

最低候補:

```text
intro fight clash ultCine ko roundEnd matchEnd
```

`pendKO / ultUser / clash / koSide`など補助状態も記録する。

### E. 咆哮

コード条件式で報告する。

- Startup
- 接触F
- Active
- Recovery
- Armor開始・終了
- 1Hit消費式か区間持続か
- Armor中の被ダメージ倍率
- Guard / Chip / Guard Damage
- Clean Hit条件
- Ult stock
- Hitstun
- 咆哮同士
- 投げとの優先関係
- KO処理

先行確認候補:

```text
BAL.ROAR = { s:16, armor:14, a:4, r:24, d:130, stun:34 }
接触 = pf === s + 1
Armor = phase === 'roar' && pf <= 14
Armorは複数Hitに対して区間中50%減衰、1Hit消費fieldなし
Guard -45 / Chip -20 / Blockstun 16
Clean Hit = Guardでも相手Roar Armorでもない
Clean HitでUlt +1
```

v0.12候補の17F、4〜15F、1Hit、125Damageへ変更しない。

### F. S Gauge

全獲得経路とキャラ倍率を確定する。

先行候補:

```text
aHit:12
aHitC:[12,7,4]
aBlk:8
whiff:2
gOk:6
got:5
moguzo:1.00 / pisuke:1.25 / godan:0.90
```

通常Hit、被Hit、攻撃被Guard、Guard成功、Whiff、Grab、咆哮、見切り、巌の構えcounter、ギュイーン、ラウンド保持を確認する。

### G. ギュイーン

v2.7正本と現行コードを別表にする。監査PRでは修正しない。

先行確認した重大差分:

```text
Current:
- 基準Damage 120
- streakBonus +30
- 勝者S Gauge +30
- Ult +1
- 敗者Hitstun 40F
- 追撃チャンス表示

v2.7:
- Damage 120
- Ult stock +1
- S Gauge 0
- Focus 0
- Charge 0
- streak bonus 0
- guaranteed follow-up stun 0
```

発生条件、抽選率、`clashStreak` reset、KO保留、Online入力同期、CPU精度、`charId`参照も確認する。この修正先はT06。

### H. Down / Wake / Round

- Down総F
- 追撃回数
- 追撃倍率
- 追撃後無敵
- Wake総F
- Wake接触処理
- Round reset項目
- S / Ult / Focus保持
- `clashStreak`
- 入力履歴

先行候補:

```text
downF=45
wakeF=20
followupMul=0.5
Down中1回追撃
S / Ult / Focusはラウンド間保持
clashStreakはラウンドごとreset
```

### I. KO / Time Up

- damage、stock、Gyuiin、KOの処理順
- `pendKO`
- Ult中KO
- Clash中KO
- HP同値Time Up
- Draw
- KO後入力停止

先行候補: HP同値Time Upは双方へ1勝を加算し、双方が必要勝利数へ達した場合DRAW。

### J. 既存9コマンド技

入力、trigger、type、段、Startup、Active、Recovery、Damage、特殊fieldをJSON化する。既存3技は各キャラの技枠1〜3として継続採用する。

### K. CPU / PRNG

- Observation
- Telegraphを見る時点
- reaction delay
- `mulberry32`
- `Math.random`
- Online中AI停止
- Gyuiin CPU精度
- 難易度config
- 非公開入力参照

VFX `Math.random`が戦闘結果へ影響するかを確認する。

### L. Pose / Asset

- S1〜S6 / CMD実ファイル
- `crouch / sway / lunge / crouch_atk`
- 既存3キャラ接続
- pose選択関数
- Sprite height
- Portrait ratio
- stale comment
- build時asset埋め込み

### M. Online同期

- shared seed
- localQ / peerQ
- `matchSeq`
- 同期Input command
- flow同期
- Gyuiin実入力同期
- state hash有無
- replay有無
- 決定論検証方法

ソース上部の「Online Gyuiinは実タップを相互送信しない」というcommentが、現実装の `mgPick / mgTap / mgHit` lockstep送信と矛盾していないか確認する。

### N. Save

リポジトリ全体で `localStorage`、save key、settings schema、CPU difficulty、volume、vibration、ultModeを検索する。存在しない場合は未実装と明記する。

## 監査スクリプト要件

`tools/audit_current_impl.mjs`は最低限次を抽出・検証する。

- BAL主要定数
- Character IDs
- 既存9 command moves
- phase文字列
- flow文字列
- poseId
- `Math.random` / `rng()`
- `localStorage`
- source / dist主要文字列差

抽出失敗を成功扱いしない。

## T00完了報告

`reports/T00_COMPLETION.md`に次を記載する。

- Branch / PR / Commit / Base / Head SHA
- Added / Modified files
- 監査スクリプト結果
- build / test
- Runtime / BAL / asset / server / dist差分0の確認
- 正本との差分一覧
- T02へ渡す確定事項
- T06へ渡す事項
- 新しいblocker

## T00受け入れ条件

- Runtime、BAL、asset、server、dist差分0
- 再実行可能な監査スクリプト
- 主要定数JSON
- phase / flow JSON
- Online同期範囲
- 10 / 12 / 24F確定
- 咆哮確定
- S Gauge全経路確定
- Gyuiin Legacy差分確定
- Down / Wake / Round確定
- KO / Time Up確定
- 既存9技JSON化
- CPU / PRNG確定
- S6接続確定
- Save有無確定

---

# T00 → T02 自動進行ゲート

次の全条件を満たす場合だけT02へ進む。

- T00 Runtime / BAL / Asset / Server / dist差分0
- audit script成功
- build成功
- 未解決P0なし
- phase / flow確定
- 入力10 / 12 / 24F確定
- 咆哮、S Gauge、Gyuiin、Down、Online同期範囲確定
- T02でOnline message schema変更不要
- T02でServer変更不要
- T02でBAL値変更不要
- T02で現行挙動を完全維持できる

一つでも満たさない場合、T02を開始せず次を返す。

```text
STATUS: BLOCKED_BEFORE_T02
BLOCKER:
EVIDENCE:
RECOMMENDED_DECISION:
FILES:
PR:
```

---

# Phase 2 — T02 Core型・定数レイヤー

## Branch / PR

- Branch案: `feature/core-spec-v1`
- Base: T00完了後のmain最新
- PR: Draft
- 自動マージ禁止

## 目的

現行挙動を変えず、v0.12系の安全な足場を作る。

1. Core ID / 状態契約
2. Current / Provisional / Legacy分離
3. `MoveSpec`
4. `CharacterCombatSpec`
5. canonical snapshot
6. stable serialization / versioned hash
7. Node標準テスト
8. source / dist単一ソース

## T02で変更禁止

- BAL数値
- Attack / Guard / Roar / Gyuiin挙動
- phase遷移
- Input受付
- Command成立
- CPU判断
- Online message schema
- UI layout
- Sprite / asset
- Server

T00で発見したLegacy差分も維持し、修正先taskをmetadataで示す。ギュイーンのS+30、連勝、40F硬直はT06。

## 必須契約

- `Level`
- `AttackButton`
- `Direction`
- `ArchetypeId`
- `CharacterId`
- `DataStatus`
- T00で確定した現行`FighterPhase`
- T00で確定した現行`BattleFlow`
- `MoveSpec`
- `CharacterCombatSpec`

状態ラベル:

```text
confirmed
current_impl
provisional
audit_required
undecided
legacy
```

現行phaseを大量リネームしない。現行phase unionか、現行→target mappingを使う。

## 定数責務

最低限、論理的に分ける。

- Core rules
- Current implementation BAL
- Provisional BAL
- Input timing
- AI difficulty
- Asset config
- Online config
- Legacy fields

現行値と候補値を同一runtime keyへ置かない。Provisional値はruntimeで参照しない。

## 単一ソース原則

HTML内BALとmodule内BALを手書き二重管理しない。

- runtime参照値は一箇所
- prototypeとmobile buildが同値
- source `file://`試遊維持
- dist単一HTML維持
- build再現可能
- T03以降から参照可能

全面TypeScript化や全面リライトは禁止。

## Canonical Snapshot

含める候補:

- frame / round / wins / timer
- flow / flowF / hitstop / pending KO
- clashロジック状態
- fighter HP / Guard / S / Ult / Focus
- phase / pf
- attack / command / combo
- dodge / counter / clinch
- input history
- PRNG state
- Online simulation frameに必要なロジック状態

除外候補:

- DOM / Canvas / Image / Audio / WebSocket
- visual FX
- interpolated shownHp
- wall-clock timestamp

ロジックに影響するfieldを欠落させない。

## Stable Serialization / Hash

- key順非依存
- JSON互換
- NaN / Infinity拒否
- Function / DOM / WebSocket拒否または除外
- 同state→同文字列→同hash
- 1field差→hash差
- version化
- `Math.random`不使用

Debug interfaceは本番UIへ出さず許可する。

## 必須テスト

1. enum / union重複なし
2. Current / Provisional混入防止
3. CharacterId / ArchetypeId validation
4. MoveSpec validation
5. CharacterCombatSpec validation
6. snapshotにDOM / function / socketなし
7. key順変更でもhash一致
8. 1field変更でhash変更
9. 同seed・同入力fixtureで2 instance一致
10. 10,000F以上一致
11. P1 / P2入替
12. Offline / Online core契約
13. build後distにも同specVersion
14. source / dist主要current values一致
15. 旧save互換。Save未実装なら対象なしを報告

## T02停止条件

以下を発見した時点で、Draft PRへ保存して停止する。

- Online protocol変更が必要
- state hash導入に戦闘処理順変更が必要
- source / dist一致にruntime値変更が必要
- Current / Provisional分離不能
- build再現不能
- 10,000Fで現行非決定性を検出
- VFX `Math.random`がcore結果へ影響
- server deployが必要
- 正本再解釈が必要

## T02完了報告

`reports/T02_COMPLETION.md`へ記載する。

- Branch / PR / Commits / Base / Head
- Changed files
- Architecture
- Runtime single source
- Current / Provisional / Legacy
- Snapshot included / excluded fields
- Hash algorithm / version
- Numeric diff 0の証拠
- build / tests / 10,000F / P1-P2 swap
- source / dist consistency
- Online protocol unchanged
- Runtime behavior unchanged
- T03 inputs
- T06 inputs
- risks

---

# Fable5回復後レポート

T00とT02のDraft PRが揃ったら、`codex_handoff/FABLE5_ROLLUP_TEMPLATE.md`を埋めてください。

Fable5には以下を一度に送る前提です。

- T00完了報告
- T02完了報告
- Fable5 rollup
- 各Draft PR URL
- 監査JSON
- テスト結果
- 重大diff要約

Fable5へ求める最終回答:

```text
T00: MERGE_GO / CHANGES_REQUIRED / HOLD
T02: MERGE_GO / CHANGES_REQUIRED / HOLD
T03: GO / HOLD
T06_INPUTS: ACCEPT / REVISE
BLOCKERS:
REQUIRED_CHANGES:
LEDGER_UPDATE:
```
