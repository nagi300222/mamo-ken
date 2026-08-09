# PRESENTATION-R1 (D): Engine-Verified Combo Routes

Replaces the old shared, stale `COMBO_ROUTES` (4 character-agnostic routes
with §6.6-era damage numbers that never updated when vNext R2/R4 rewrote
every Command/Normal value) and the character-catalog's
`UNVERIFIED_COMBOS` placeholder ("コンボは全枠 未検証", 5 empty slots the
catalog's own validator forces to stay theoretical) with 3 per-character
routes, each **actually executed in the real engine** and measured — not
computed from frame data on paper.

## 1. Methodology

`presentation_r1_d_combo_verify.mjs` (Playwright script, run this session,
deleted after use per this repo's "manual verification tool" convention —
see `tools/audit_command_motion_runtime.mjs`'s header comment for the same
pattern) drove the live `prototype/mamoken_prototype_v01.html` directly:

- **Single choke-point functions only.** Every step calls `startAtk()` or
  `startCmdAtk()`/`startCmdGrab()` — the exact same functions every real
  input path (tap, buffered command, Modern substitution) ultimately calls.
  No hand-computed frame numbers are used anywhere.
- **Real gate functions decide timing, not guesses.** A Normal Chain
  continuation is injected the instant the engine's own `canChain(f, lv)`
  first returns true. A Classic Cancel continuation is injected the instant
  `f.ccActive && B.f<=f.ccWindowUntil` first becomes true (with the same
  `move!==f.cmdMove` direct-loop-ban and phase restrictions
  `applyInputs()` itself enforces). This is "execute the input sequence,"
  not "assert the numbers should work."
- **A pure passive dummy opponent.** The harness replicates `fightStep()`'s
  body minus `aiStep()`/`applyInputs()` — no AI, no buffered input for
  either side. The defender only reacts via `advance()`/`resolveHits()`.
  This is deliberate: a route that only "connects" because the CPU AI
  happened not to interrupt would not prove anything about the route's
  actual safety.
- **Damage measured directly from `opp.hp` deltas** at the exact tick each
  step's confirming hit resolves — never read from a move's static `d`
  field, since scaling/counter/ability multipliers can change the number
  actually dealt.
- **True-combo vs. pressure/setup classification**: `actionable(opp)`
  (`f.phase==='idle'||f.phase==='guard'`) is sampled every tick strictly
  *after* the current step's own confirming hit has landed and *before*
  the next step's hit lands. If the opponent is ever actionable in that
  window, the route is not a guaranteed true combo (labeled `PRESSURE`
  instead of `TRUE COMBO`) — even though it still connected against this
  passive dummy.
- **A whiff kills the candidate.** Any step dealing `0` damage — meaning it
  never actually connected — disqualifies the whole route; it is never
  listed. See §2 for the one candidate this caught.

### Adversarial control (proves the harness isn't rubber-stamping)

`presentation_r1_d_combo_control.mjs` deliberately drove a known-bad
sequence — Moguzo's 地走り (a Command atk, which puts the opponent in
`hitstun`) Classic-Canceled into 引き寄せ投げ (a Command grab) — and
confirmed the harness correctly reports `0` damage (whiff), not a false
success. This is because `throwEligible()` does **not** include `hitstun`
among throw-eligible defender phases (only `guard`/`blockstun`/`idle`/
`dizzy`/`mikiriRec`/`dodge`/specific armor windows) — a grab thrown at an
opponent already staggered by a strike always misses in this engine. This
is a genuine mechanical fact, not a harness bug; it's why no listed route
ends in a grab canceled from a strike hit.

## 2. What was tried and discarded

The first candidate set included a Route C for Moguzo of 地走り→引き寄せ投げ
(strike into grab via Classic Cancel). It failed exactly as the control
predicts (`0` damage, confirmed a whiff) and was replaced with 地走り→昇撃
(strike into strike, both eligible Classic Cancel targets) before any
number from the failed attempt was recorded anywhere player-facing. No
other candidate needed replacement — all remaining 26 candidates connected
on the first attempt with real measured damage.

## 3. Results — all 27 routes (9 characters × 3 routes), all TRUE COMBO

| Character | Route | Sequence | Measured damage | Classification |
|---|---|---|---|---|
| Moguzo | A | 中段→上段 (2-hit chain) | 146 | TRUE COMBO |
| Moguzo | B | 下段→中段→上段 (3-hit chain) | 262 | TRUE COMBO |
| Moguzo | C | 地走り→昇撃 (Classic Cancel) | 197 | TRUE COMBO |
| Pisuke | A | 中段→上段 (2-hit chain) | 113 | TRUE COMBO |
| Pisuke | B | 下段→中段→上段→下段 (4-hit chain, chain limit) | 268 | TRUE COMBO |
| Pisuke | C | 二連牙→宙返り蹴 (Classic Cancel) | 151 | TRUE COMBO |
| Godan | A | 中段→上段 (2-hit chain, chain limit) | 200 | TRUE COMBO |
| Godan | B | 上段→下段 (2-hit chain) | 289 | TRUE COMBO |
| Godan | C | 岩砕き→天蓋落とし (Classic Cancel) | 302 | TRUE COMBO |
| Hakuma | A | 中段→上段 (2-hit chain, chain limit) | 137 | TRUE COMBO |
| Hakuma | B | 下段→中段 (2-hit chain) | 181 | TRUE COMBO |
| Hakuma | C | 雪壁掌→氷柱返し (Classic Cancel) | 166 | TRUE COMBO |
| Chirka | A | 中段→上段 (2-hit chain) | 133 | TRUE COMBO |
| Chirka | B | 下段→中段→上段 (3-hit chain) | 237 | TRUE COMBO |
| Chirka | C | だまし突き→戻り蹴り (Classic Cancel) | 174 | TRUE COMBO |
| Takimaru | A | 中段→上段 (2-hit chain, chain limit) | 162 | TRUE COMBO |
| Takimaru | B | 下段→中段 (2-hit chain) | 213 | TRUE COMBO |
| Takimaru | C | ぶちかまし→熊手払い (Classic Cancel) | 198 | TRUE COMBO |
| Yomikage | A | 中段→上段 (2-hit chain, chain limit) | 118 | TRUE COMBO |
| Yomikage | B | 下段→中段 (2-hit chain) | 158 | TRUE COMBO |
| Yomikage | C | 影縫い→月かすめ (Classic Cancel) | 141 | TRUE COMBO |
| Bullet | A | 中段→上段 (2-hit chain) | 146 | TRUE COMBO |
| Bullet | B | 下段→中段→上段 (3-hit chain) | 259 | TRUE COMBO |
| Bullet | C | 弾み突き→尾払い (Classic Cancel) | 147 | TRUE COMBO |
| Dark Moguzo | A | 中段→上段 (2-hit chain) | 123 | TRUE COMBO |
| Dark Moguzo | B | 下段→中段→上段→下段 (4-hit chain, chain limit) | 289 | TRUE COMBO |
| Dark Moguzo | C | 黒走り→逆昇撃 (Classic Cancel) | 145 | TRUE COMBO |

Every route above is a genuine true combo: sampled every tick between each
pair of hits, the opponent was never `idle`/`guard` (never had a window to
block, dodge, or act) until after the route's final hit landed. Full
per-step breakdown (per-hit damage, wait-ticks until each cancel window
opened) is preserved in this session's tool output; the totals above are
what's now surfaced in-game.

## 4. Where this is wired

- **わざ表 COMBO tab** (`drawMovelistCombo()`, `prototype/
  mamoken_prototype_v01.html`): new 4th tab (COMMAND/MODERN/COMBO/ABILITY)
  reading `VERIFIED_COMBO_ROUTES[charId]` live.
- **Character-select detail screen's Combos tab** (`drawDetailCombos()`):
  replaced the catalog's `UNVERIFIED_COMBOS` rendering with the same
  `VERIFIED_COMBO_ROUTES` table, so both surfaces show identical,
  consistent numbers from a single source.
- `test/character-detail-panel.test.mjs` updated: the two assertions that
  literally checked for the old "コンボは全枠 未検証" / "入力列: 未確定"
  placeholder strings now check for the new verified-route rendering
  instead (this file's own point is precisely to remove that placeholder).

## 5. Also fixed while building this

A real Codex review finding from PR #82 was addressed in the preceding PR
(#83): the ABILITY tab's Yomikage description mis-described Just timing as
based on when the player's input is *queued*, when it's actually based on
when the dodge itself *intercepts the opponent's attack* — noted here only
because it was discovered while cross-checking Yomikage's move data for
this task's Route C pairing, not new work in this PR.

## 6. Verification

- Syntax check on the extracted `<script>` body: OK.
- All 35 `npm run check:*` scripts green (including the updated
  `check:character-detail`).
- The adversarial control script (§1) confirms the harness itself
  correctly distinguishes a real connect from a whiff, rather than
  reporting success unconditionally.
- Manual screenshot review of both the わざ表 COMBO tab and the
  character-detail Combos tab (Godan) — no overflow/overlap, all 3 routes
  render with correct damage/classification.
- No combat-logic (`fightStep()`/`advance()`/`hitApply()`/`canChain()`/
  Classic Cancel gating) code was modified — the verification harness
  only *reads* those functions' existing behavior from outside the file
  being shipped; the only prototype.html changes are the new
  `VERIFIED_COMBO_ROUTES` data table and its two render call sites.
