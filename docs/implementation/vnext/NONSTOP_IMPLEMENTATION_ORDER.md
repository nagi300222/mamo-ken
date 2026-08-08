# FABLE5 / CODE NONSTOP IMPLEMENTATION ORDER

Fable5は必要に応じPRをさらに分割してよい。
仕様自体は変えない。

## PR 1 — HANDOFF + ART/UI + SIZE

- repo_payloadをGitHubへ格納
- ability UI/Gauge/VFX asset追加
- ability_ui_manifest接続
- Godan flinch差し替え
- 9master正式身長比
- 全motion / 全Command F1-F4 face normalization
- Ground Line
- build current art / dist

このPRではBAL値を変えない。

Acceptance:
- all asset paths exist
- Godan new flinch live
- Dark common geometry shared
- Bullet tail excluded from scale basis
- no animation breathing
- grounded transitionsでvertical popなし
- render-only changeでcombat result/hash不変
- build reproducible

## PR 2 — COMBAT CORE vNEXT

- Normal R2
- Dodge R2
- OP相殺
- Combo Scaling R2
- HP/Guard
- S
- Roar/Ult round
- common normal knockback0
- Focus live removal

Acceptance:
normal numeric
arbitrary chain
same normal repeat
OP
scaling
Dodge matrix
Guard→Dodge
round reset/carry
offline/online determinism

## PR 3 — COMMAND / MODERN / CLASSIC

- 63 Command R2
- Modern R4
- Takimaru pending grab
- Classic Cancel

Acceptance:
63 command values
all pattern HIT/BLOCK
history timeout/reset
fallback
CC window
grab cancel
same-command loop ban
scaling continuity
online determinism

## PR 4 — ABILITY

9 state machines:
Moguzo / Pisuke / Godan / Hakuma / Chilka /
Takimaru / Yomikage / Bullet / Dark

- UI/VFX state binding
- VFX presentation-only
- resource shortage fallback
- all pending/reset/hash

Acceptance:
trigger/gain/consume/reset
round reset
Dark vs Classic priority
UI reads state only
online deterministic hash

## PR 5 — CLOSURE

- full regression
- all 9 offline
- all 9 online
- deterministic replay/hash
- dist reproducibility
- stale Focus UI/AI cleanup
- art manifest integrity
- docs final update
- out-of-scope feature absence

## merge方針

CI green・仕様OKならmergeして次へ。
ユーザー承認待ちで止めない。

真のBLOCKERだけ停止。
