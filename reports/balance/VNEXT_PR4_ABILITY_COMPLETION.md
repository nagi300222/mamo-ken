# vNext PR4: ABILITY — Completion Report

Fourth of 5 PRs implementing the Fable5 vNext FINAL handoff
(`docs/implementation/vnext/NONSTOP_IMPLEMENTATION_ORDER.md`), against
`docs/implementation/vnext/ABILITY_STATE_MACHINES_FINAL.md` (the sole
authority for this PR, per explicit instruction). Base: `origin/main` @
PR3 (`#76`, already merged).

## 1. Scope

All 9 character-specific Ability state machines, wired as live gameplay
state (not presentation-only), matching the doc's common rules:
deterministic simulation frames, UI/internal state separation, Round reset
of all Ability state, spend-on-start with no refunds, Ability normalChain
resets are not combo-scaling resets, no multi-gain of the same resource from
one multi-hit action, and all new internal state included in the hashable
fighter object (nothing lives outside `f`/`B.p[i]`, so it is naturally part
of the existing lockstep hash surface — no new `Date.now`/`Math.random`
call sites were introduced anywhere in this PR).

- **Moguzo — GUTS / 踏ん張り**: `gutsActive` flips on once `dealDamage()`
  resolves HP to ≤30% (checked at the point of damage resolution, not
  polled), persists for the round. `gutsOutgoing()` multiplies the
  attacker's outgoing damage ×1.10 for Normal/Command/Grab/Roar/Ult (chained
  into every one of those five resolution sites, immediately before
  `dealDamage()`), explicitly excluded from GuardDamage/chip/Gyuiin per
  spec. 踏ん張り (`gritAvailable`, one-shot per round) is centralized in
  `dealDamage()` itself — the single HP-mutation entry point — so it applies
  uniformly to every damage source without each call site needing to know
  about it.
- **Pisuke — CHASE**: `chaseReadyUntilF` opens on a Normal HIT only,
  `B.hitstop`-end+12F, computed after `B.hitstop` is actually finalized
  (moved to after the dizzyCapped/down/else branches close in `hitApply()`,
  since `B.hitstop` isn't final earlier in the function). SWAY/LUNGE inputs
  within the window cancel the remaining Normal recovery straight into a
  real Dodge (`startDodge()`); CROUCH is explicitly excluded by the input
  branch's `kind` check. `resetModernHist()` gained the shared clear list
  (BLOCK/被弾/Throw/Command/Roar/Ult/Down/Round) since it's identical to
  Modern R4's own reset triggers.
- **Godan — ARMOR STOCK**: `armorStock` (3/round, no regen) gates 山掴み/
  巌の構え (cost1) and 大山押し (cost2) via the new generic
  `hasResourceFor()`/`spendResourceFor()` pair (`m.cost={res,amt}`), checked
  at every trigger site (direct input, Classic Cancel, Modern substitution,
  buffered-command auto-fire) — on insufficient resource the surrounding
  `if/else if` chain falls through to the pre-existing plain-Normal/plain-
  grab fallback, satisfying "resource不足→Command unavailable/normal
  fallback" without duplicated fallback code. 山掴み/岩砕き/大山押しの
  armor windows use the generalized `armorStartF/armorEndF/armorDmgMul`
  fields (岩砕き's window is F5-20 per this doc, superseding PR3's
  placeholder F4-19); 大山押し's `hyperArmor:true` skips the single-use
  `cmdArmorUsed` gate so it can absorb multiple hits across its whole
  active window. 巌の構え's counterActive window is exactly the
  Startup(5)/CounterActive(8)/FailRecovery(22) split PR3 had already
  structured; PR4 only adds the Stock1 cost gate on top.
- **Hakuma — IRON WALL**: boolean `ironWallReady`, gained on Guard success,
  Correct Dodge, and Mikiri success (one gain per action — each of those
  three outcomes is itself a single per-action event, so "max1/1action1回"
  is satisfied for free), consumed only by 雪壁掌/白峰打ち/雪煙崩し's
  `ironWallAlt` stat swap (`Object.assign` over the base move at
  `startCmdAtk()` time — the other Command moves leave `ironWallReady`
  untouched, matching "他技はready保持"), lost on any HP-reducing event
  (被弾/Throw/Down/GuardBreak — centralized in `dealDamage()`), no timeout.
- **Chilka — FEINT / DELAY**: new `trickMove/trickChoice/trickResolved/
  trickSuccess` per-action state. Delay (same-height reinput inside the
  move's `trickWindow`) adds +8 startup with zero other stat changes
  (`specForCmd()`); あと出し頭突きのDelay版はさらに`delayedVariant.
  unblockable` を`cmdUnblockable()`経由で有効化する。Feint（だまし突きのみ）は
  telegraph窓中のMikiri入力（Guard Tap）を横取りしてtrickChoiceへ振り替える
  （元々cmdAtk中はMikiriの`idle/guard`前提が不成立なため、この1分岐の追加だけで
  「Mikiriより優先」を満たす）。Telegraph終了直後の1Fで相手のphaseを見て成否判定
  し（`dodge`/`mikiriRec`＝CROUCH/SWAY/LUNGE/MIKIRI開始とみなす）、以後
  `specForCmd()`がactive0＋recovery6(success)/12(fail)へ数値を丸ごと差し替える
  （＝実際には一切攻撃判定を出さない）。
- **Takimaru — PRESSURE**: `pressureState` (`none|ready|throwQueued`)
  triggers on ぶちかまし/熊手払いのHIT**とBLOCK**両方（既存の被ガード分岐にも
  同じフックを追加）。opponent actionableの6F前(`pressureUntilF-18`)から
  Grabの先行入力を受け付け、まだthrow-eligibleでなければ`throwQueued`へ
  積んで`tickPressureQueue()`が最初のactionable Fで発火させる（guaranteed
  throwにしない＝相手はその間も普通に行動できる）。肩車崩しは`pressureOnly:
  true`でdirect Classic/Modern入力からは完全除外。
- **Yomikage — RETURN / JUST**: 通常のCorrect Dodge（Mikiri不可）成立時、
  Dodgeのpf5-9でのcontactを`yomiJust`として記録し、Correct-Dodgeの
  completion frameそのものをキャラ専用に18F→14F(Just)へ短縮。Dodge
  recovery中にH/M/L/Grabを1つだけprebuffer(`yomiQueuedLv`)でき、
  actionable到達時に即発動、なければ`ready`(14F/Just22F)へ移行して手動
  入力を待つ。天/地/芯/腕返しへのマッピングはH=天/L=地/M=芯/Grab=腕返し。
  Justで発動したReturn(天/地/芯のみ。腕返しはこの解釈では対象外— §2参照)は
  `-2F startup / dmg×1.10 / GD不変`。Return自体はnormalChain/Modern/OP外
  (専用トリガー経路のみから開始されるため自然に満たされる)。Classic windows
  もこのdocの通りへ修正: 後の先・地`ccWindow16→14`、後の先・芯`16→12`
  (PR3時点のプレースホルダをこのdocの確定値へ更新)。
- **Bullet — CHARGE**: `charge`(0-3)は弾み突き/尾払い/跳ね上げのHITと
  抱え弾き(Grab)のsuccessでのみ`chargeGainOnHit()`が"current!=last→+1、
  same→+0"のsignatureルールで加算(A-A/A-B-A/A-normal-Aの3ケースとも
  targeted testで確認済み)。蓄圧タックル(cost1)/弾丸頭突き(cost3)は
  `hasResourceFor`でゲート、圧抜き掌(cost1)はHIT/BLOCK双方でGuard+15 cap。
  弾丸頭突きは`unblockable:true`のまま(この技はDelay等の条件分岐なしで
  常時Unblockable — PR3から変更なし)。
- **Dark Moguzo — DARK CHAIN / BODY**: 黒走り/逆昇撃/黒砂払い/裏山越え/
  闇押しの5技(暗連可)のHITで`darkChainTrigger()`が uses上限未満
  (Normal2/Body3)かつdifferent-from-lastの条件下でuses+1・last更新・
  normalChainCount=0・Modern history reset・gauge+30(Body外)・Normal
  window(16F/Body20F)を一括処理(combo/scalingはここでは触らない=resetなし)。
  Normal windowが開いている間の`atk`入力はcanChain()の通常ゲート
  (`phase==='attack'`前提)をバイパスする専用分岐でstartAtk(chain=true)へ
  直接cancelし、combo維持のままnormalChainCountだけ0から数え直す
  ("cancel to new normal chain")。formal Classic Cancel(既存のccOk分岐)は
  この専用分岐より前で評価されるため自動的に優先される。gauge100でreadyに
  なった後、「Dark idle/guard かつ opponent not hit/blockstun/grab/down」を
  満たした最初のtickで`tickDarkBody()`がBodyを起動(gauge0/ready false/
  body true/360F)。Body中はNormal startup-1、Command startup-2、
  outgoing damage×1.08(Guts同様Normal/Command/Grab/Roar/Ult対象)。
  いずれもaction開始時点で`darkBodyActive`へsnapshotするため、360Fタイマー
  がaction実行中に切れても既に開始済みのactionの数値は最後まで変わらない
  ("current action snapshot保持、next action normal")。

## 2. Explicit interpretation calls (flagging for reviewer)

The doc is even terser than §13 was in PR3; these are the calls made, each
chosen to match the nearest existing precedent or the plain reading of the
common rules section, and each is a real behavioral delta worth a second
look:

1. **Chilka Feint success window = the single frame right after
   `trickWindow.e` closes**, sampling the opponent's `phase` at that
   instant (`dodge` or `mikiriRec` = success). The doc's "telegraph後、
   相手がCROUCH/SWAY/LUNGE/MIKIRI開始" doesn't give an explicit sampling
   window; a successful opponent Mikiri (which immediately forces both
   fighters into `phase='clash'` via `startClash()`) pre-empts this check
   entirely before it can run, which is consistent with Gyuiin's existing
   priority over ordinary per-move resolution elsewhere in the engine.
2. **Yomikage Just bonus (`-2F`/`×1.10`) applies only to 後の先・天/地/芯,
   not 腕返し (Grab).** The doc lists "Just限定" per-move tags only on the
   three attack Returns (already present, pre-PR4, as inert
   `未結線`-tagged notes whose numbers exactly match this doc's uniform
   `-2F`/`×1.10` formula once computed — 8→6/100→110, 10→8/110→121,
   13→11/118→130), and never tags 腕返し the same way. Absent an explicit
   statement either way for the Grab Return, this PR follows that existing
   per-move tag convention rather than extending the bonus to Grab.
3. **Dark Moguzo `chainUses`/`lastChainMove` reset scope: the current
   combo, not "ever, per Round."** The doc's only explicit reset statement
   for this pair is the blanket common-rules "Round reset all"; taken
   completely literally that would mean a Dark Moguzo could only ever gain
   the dark-chain Normal-window bonus twice (3 in Body) in an entire round,
   which reads as an unintended consequence of a terse spec rather than
   the actual intent of a per-string combo mechanic. This PR resets both
   fields whenever the fighter's own `combo` counter itself resets to 0
   (`startAtk(!chain)` / `startCmdAtk(!preserveCombo)`), i.e. scoped to
   "the current ongoing string," which is the reading consistent with how
   every other per-combo mechanic in this codebase (OP相殺, Classic Cancel
   preserve-combo, etc.) is scoped.
4. **Dark Moguzo Body's `first neutral` gate reads `phase==='idle'||
   phase==='guard'`** for "Dark idle/actionable," and excludes the
   opponent's phase from `{hitstun, blockstun, grab, grabrec, grabHit,
   grabbed, down, wake, dizzy}` for "opponent not hit/blockstun/grab/down"
   (the doc names four categories; `wake`/`dizzy` were folded in as the
   directly-adjacent knockdown-recovery and guard-break-stun sub-phases,
   neither of which reads as "neutral" either).
5. **Dark Moguzo/Guts outgoing-damage multiplier scope (Normal/Command/
   Grab/Roar/Ult, excluding GD/chip/Gyuiin) is copied verbatim from the
   Guts precedent** for Body's "Damage x1.08," since the doc states the
   number without repeating the scope list Guts got explicitly. Both
   multipliers are applied through the same call chain
   (`gutsOutgoing()`→`darkBodyOutgoing()`) at every one of Guts' five
   existing sites, so the two abilities can never silently diverge in
   scope in the future without an explicit edit to both.
6. **Bullet 圧抜き掌's trailing "Block0/Hit+3" fragment is left
   unimplemented.** The already-wired `selfGuardRestore:15` (Guard+15 cap
   on both HIT and BLOCK, carried over unchanged from before this PR) is
   confirmed to satisfy the doc's own headline "HIT/BLOCK Guard+15 cap"
   line. The immediately-following "Block0/Hit+3" clause is genuinely
   ambiguous in isolation (it could describe a second, distinct
   S-gain/advantage number, or something else) and doesn't parse as an
   addendum to the Guard number already implemented; rather than guess at
   an unverifiable second mechanic, it is left as-is pending a
   clarification pass, matching this PR's "true blocker" bar of only
   stopping for things that can't be resolved by nearest-precedent
   reasoning.
7. **Godan 岩砕き's armor window corrected to `F5-F20`** (was PR3's
   placeholder `F4-F19`), matching this doc's explicit number.
8. **Fields explicitly still out of PR4's scope, confirmed against this
   doc rather than assumed:** Moguzo's/Pisuke's 小Pushback (still
   `(未結線)`), Hit→CLINCH on Pisuke's すり抜け足, and Pisuke's
   CHASE_TO_CONTACT/maximumApproachSteps2 on つむじ返し are Normal-R2/
   positioning-level nuances that do not appear anywhere in this doc's
   9 Ability sections — left untouched exactly as PR3 left them.

## 3. Verification

- `npm run build:mobile`: reproducible, `git diff --exit-code -- dist/mamoken_mobile.html`
  clean after a second consecutive rebuild.
- All 34 `npm run check:*` scripts green (`src/core/**`'s frozen
  shadow/design-catalog layer is untouched by this PR, matching the
  documented "intentionally frozen shadow contract" posture from every
  prior BAL/vNext PR).
- `git diff --stat`: only `prototype/mamoken_prototype_v01.html`,
  `dist/mamoken_mobile.html`, and this report changed — `src/core/**`,
  `test/**`, `tools/**`, `server/**`, `design/**` untouched (no
  pre-merge deploy wait required per the standing instruction, since no
  `server/` file changed).
- `node -e "new Function(...)"` syntax check on the extracted `<script>`
  body after every character's implementation pass.
- Headless Playwright functional checks against the live prototype,
  directly driving internal engine functions to exercise each mechanic
  deterministically (no RNG dependency):
  1. Moguzo GUTS: `dealDamage()` crossing the 30% HP threshold correctly
     flips `gutsActive` (confirmed the flag does *not* flip merely from
     inspecting a pre-set low HP value without an actual damage-resolution
     call, matching "damage resolution後" wording exactly).
  2. Moguzo 踏ん張り: a lethal hit at HP=2 with `gritAvailable` clamps to
     HP=1 and consumes the flag; a second lethal hit then KOs normally.
  3. Godan ARMOR STOCK: `armorStock=0` blocks 山掴み's `startCmdGrab()`
     (returns `false`, no state change); `armorStock=3` succeeds and
     debits to 2. 巌の構え's Startup(5)/CounterActive(8)/FailRecovery(22)
     read back correctly off the live `cmdMove`.
  4. Hakuma IRON WALL: `ironWallReady` correctly swaps 雪壁掌 to its
     `ironWallAlt` numbers (s15→11, d72→83) and consumes the flag on
     start; a subsequent `dealDamage()` (被弾) independently clears the
     flag when set again.
  5. Chilka DELAY: reinputting the same height inside だまし突き's
     trickWindow sets `trickChoice='delay'` and `spec().s` becomes 23
     (15+8).
  6. Chilka FEINT: a Guard-Tap (`mikiri` input) inside the same window
     sets `trickChoice='feint'`; once the opponent is put into `dodge` and
     the telegraph closes, `trickResolved`/`trickSuccess` both flip true
     and `spec()` reports `a:0, r:6` (success recovery, no active frames).
  7. Yomikage RETURN: a Correct Dodge (SWAY vs a `high` attack) at pf=3
     (outside the Just window) opens `yomiState='pending'`, completes at
     the normal 18F mark into `ready`, and a manual `high` input fires
     後の先・天 and clears the state to `none`.
  8. Yomikage JUST: the same setup with contact at pf=6 (inside 5-9) sets
     `yomiJust=true`, completes in 14F instead of 18F, and firing 後の先・
     天 reports `s:6` (8-2) and `d:110` (100×1.10) — both exact spec
     values.
  9. Dark Moguzo DARK CHAIN: landing 黒走り opens the Normal window
     (`darkChainUses:1`, `darkGauge:30`), and a subsequent Normal input
     correctly cancels into a fresh `attack` phase and closes the window
     (`darkWindowUntilF:0`).
  10. Dark Moguzo BODY: forcing `darkGauge=100/darkReady=true` with both
      fighters idle activates Body on the next tick
      (`darkBody:true, darkBodyRemainingF:360`); a subsequent Command and
      Normal both report their spec `s` reduced by 2 and 1 respectively.
  11. Pisuke CHASE: a Normal HIT opens `chaseReadyUntilF`; a SWAY input
      inside the window cancels into `dodge` with `chaseActive:true`; the
      same setup with a CROUCH input is correctly rejected (phase stays
      in its post-hit recovery, matching "CROUCH不可").
  12. Bullet CHARGE: the three documented gain sequences (A-A→+1,+0;
      A-B-A→all gain; the cap at 3) all reproduce exactly via direct
      `chargeGainOnHit()` calls. `charge=0` blocks 蓄圧タックル's
      `startCmdAtk()`; `charge=3` succeeds and debits to 2. 弾丸頭突き
      confirmed `cmdUnblockable()===true`.
  - CPU-vs-CPU crash-smoke run, all 9 characters each fighting their
    "next" roster neighbor (9 pairings covering all 9 as either side),
    12000 logic ticks each (108000 total `fightStep()` calls) at HARD AI
    difficulty — zero thrown exceptions, zero console errors across all
    pairings; spot-checked HP progression on one pairing confirmed a real
    KO occurs mid-run (the harness's own `fightStep()`-only loop doesn't
    drive the separate round-transition timer that runs alongside the
    real game loop, so `B.round` staying at 1 for the rest of the 12000
    ticks after a KO is expected harness behavior, not a regression —
    identical to the harness limitation noted in the PR3 report).
- Not run this session (no online 2-browser device available, same
  environmental note as every prior vNext report): a real cross-client
  online determinism check. Nothing in this PR reads
  `Date.now`/`Math.random`/`performance.now`, and every new field lives on
  the existing per-fighter `f` object (already part of the lockstep-synced
  state), so the reasoning-level case for determinism holds, but flagging
  per the vNext report format for whoever has real-device access.

## 4. Explicitly out of scope for this PR (flagging for the orchestrator before merge)

- PR5 CLOSURE: full regression (all 9 offline/online), deterministic
  replay/hash verification, dist reproducibility re-confirmation, stale
  Focus UI/AI cleanup, art manifest integrity, docs final update,
  out-of-scope feature absence audit.
- Online protocol/rollback mechanics — not redesigned; only reasoned about
  above for determinism (same posture as every prior vNext PR).
- `src/core/**`'s shadow contract — intentionally frozen, not resynced.
- Bullet 圧抜き掌's "Block0/Hit+3" fragment (§2.6 above) — flagged for
  clarification, not blocking merge.
