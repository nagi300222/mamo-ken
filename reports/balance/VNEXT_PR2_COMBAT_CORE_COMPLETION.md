# vNext PR2 — COMBAT CORE 完了報告

authority: 実装対象は `prototype/mamoken_prototype_v01.html`（ライブ実装。`dist/mamoken_mobile.html`は`tools/build_mobile.mjs`で再生成）。
`src/core/*`のG系列shadow contract（`reports/current_impl_constants.json`/`current_impl_phases.json`が正本のスナップショット）は
BAL-R1/NORMAL-CHAIN-R1と同じ方針で**意図的に無変更**（4節参照）。

branch: `feature/vnext-pr2-combat-core`
起点: origin/main SHA `5c7d827`（vNext PR1、#74マージ後）

仕様の正: `docs/implementation/vnext/COMBAT_VNEXT_FINAL.md` §1-7, §10-12（§8/§9/§13はPR3対象外）。
`docs/implementation/vnext/ACCEPTANCE_TESTS.md`の`# Combat`/`# Dodge`/`# Focus`/`# Resource`/`# Online / Build`（該当箇所のみ）。

## 1. Scoped diff

| ファイル | 内容 |
|---|---|
| `prototype/mamoken_prototype_v01.html` | 本体。BAL_R1_CHARS全面再計算(§6/§7)・SCALE/OP_SCALE新設(§4/§5)・DODGE_TABLE再設計(§3)・Guard→Dodge buffer新設(§2)・chainableTo()新設(§4)・S Gain table更新(§11)・Round reset/carry更新(§11/§12)・Focus live除去(§10) |
| `dist/mamoken_mobile.html` | `tools/build_mobile.mjs`で再生成。BAL/CHARSがprototypeと完全一致することをスクリプトで検証済み(6.2節) |
| `reports/balance/VNEXT_PR2_COMBAT_CORE_COMPLETION.md` | 本報告 |

`src/core/**`・`server/**`・`test/**`・`tools/**`・`design/**`・`docs/**`（本報告以外）・
`reports/current_impl_constants.json`・`reports/current_impl_phases.json`は無変更
（`git diff --stat -- reports/ src/ test/ tools/ server/ design/ docs/`で確認済み、BAL-R1/NORMAL-CHAIN-R1と同じ理由。4節参照）。

## 2. 数値差分（§6 Normal R2 / §7 HP・Guard）

正本は`COMBAT_VNEXT_FINAL.md` §6/§7。旧値はvNext以前の`main`（BAL-R1由来のBAL_R1_CHARS）。

### HP / Guard

| キャラ | HP 旧→新 | Guard 旧→新 |
|---|---|---|
| モグゾー | 1000→1000 | 100→100 |
| ピスケ | 920→920 | 90→90 |
| ゴダン | 1080→**1040** | 105→**100** |
| ハクマ | 1050→**1040** | 125→125 |
| チルカ | 940→940 | 90→90 |
| タキマル | 1040→1040 | 110→110 |
| ヨミカゲ | 950→**930** | 95→**90** |
| バレット | 1000→1000 | 100→**95** |
| ダーク | 880→880 | 80→80 |

`hidden GuardDamageTaken倍率`は元から存在しない（`def.guard-=A1.gd`は直接減算、per-charの乗数は無し）ため
「全員x1.00」は**既に真**（4.5節）。

### Frames(S/A/R) / Damage / GuardDamage / HIT・BLOCK advantage

advantage formula: `advantage = stun - (active-1) - recovery`。旧BAL-R1のhitstun/blockstunは大半のキャラで
Frames自体もStartup/Recovery/Damage/GDが変わっており、単純な「advantage目標値の変更」ではなく§6のFrames/Damage/GD表
そのものを新しい確定値として全面採用した（Startup/Active/Recoveryは§6の表を直値採用、hitstun/blockstunだけformula逆算）。
モグゾーはFrames/Damage/GDが旧BAL-R1と偶然一致しており（旧BAL-R1のper-char表の基準キャラだったため）、
HIT advantageのみ新目標値に合わせてhitstunが下がっている。LOWは§4「Normal LOWのcommon lightDown撤廃」により
旧`down:'lightDown'`（hitstunなし・強制ダウン状態）が外れ、他段と同じ形（hitstun+blockstunを持つ通常のhitstun遷移）になった。

| キャラ | 段 | S/A/R 旧→新 | Dmg 旧→新 | GD 旧→新 | Hit adv 旧→新 | Block adv 旧→新 |
|---|---|---|---|---|---|---|
| モグゾー | crouch | 10/3/14→10/3/14 | 45→45 | 6→6 | +3→**+1** | -4→-4 |
| モグゾー | mid | 14/3/15→14/3/15 | 65→65 | 10→10 | +4→**+1** | -5→-5 |
| モグゾー | high | 21/4/21→21/4/21 | 95→95 | 14→14 | +6→**0** | -9→-9 |
| モグゾー | low | 28/5/30→28/5/30 | 140→140 | 18→18 | (down)→**0** | -16→-16 |
| ピスケ | crouch | 9/3/13→9/3/**12** | 38→**34** | 5→**4** | +3→**0** | -3→**-5** |
| ピスケ | mid | 12/3/14→12/3/**13** | 55→**50** | 8→**6** | +4→**0** | -4→**-7** |
| ピスケ | high | 18/4/20→18/4/**18** | 80→**74** | 11→**9** | +5→**+1** | -8→**-10** |
| ピスケ | low | 25/5/29→25/5/**26** | 118→**108** | 15→**12** | (down)→**0** | -14→**-16** |
| ゴダン | crouch | 11/3/16→**12**/3/**18** | 55→**60** | 7→**8** | +3→**+2** | -5→**-6** |
| ゴダン | mid | 16/3/19→**17**/3/**21** | 78→**88** | 12→**13** | +5→**+2** | -7→**-8** |
| ゴダン | high | 24/4/27→**25**/4/**30** | 115→**132** | 17→**19** | +7→**+3** | -12→**-13** |
| ゴダン | low | 31/5/36→**32**/5/**39** | 165→**185** | 22→**25** | (down)→**+2** | -19→**-20** |
| ハクマ | crouch | 10/3/15→10/3/**16** | 42→42 | 6→**5** | +3→**+1** | -4→**-5** |
| ハクマ | mid | 15/3/17→15/3/**18** | 60→60 | 9→**8** | +3→**+1** | -5→**-7** |
| ハクマ | high | 23/4/24→23/4/**25** | 90→90 | 13→**12** | +5→**+2** | -10→**-11** |
| ハクマ | low | 29/5/32→29/5/**34** | 130→130 | 18→**16** | (down)→**+1** | -17→**-18** |
| チルカ | crouch | 10/3/14→10/3/14 | 40→40 | 5→**4** | +3→**+1** | -4→-4 |
| チルカ | mid | 14/3/17→14/3/**16** | 60→**58** | 9→**7** | +3→**+1** | -6→-6 |
| チルカ | high | 21/4/23→21/4/23 | 90→**88** | 13→**10** | +5→**+1** | -10→-10 |
| チルカ | low | 28/5/32→28/5/32 | 130→**126** | 17→**14** | (down)→**+1** | -17→-17 |
| タキマル | crouch | 11/3/16→11/3/**17** | 48→48 | 7→**5** | +3→**+1** | -5→**-6** |
| タキマル | mid | 16/3/20→16/3/20 | 72→72 | 12→**8** | +4→**+2** | -7→**-8** |
| タキマル | high | 23/4/27→23/4/**28** | 105→**106** | 17→**12** | +6→**+3** | -12→-12 |
| タキマル | low | 30/5/35→30/5/**36** | 150→**152** | 21→**16** | (down)→**+2** | -18→**-19** |
| ヨミカゲ | crouch | 9/3/14→9/3/**13** | 38→**36** | 5→**4** | +3→**0** | -3→**-4** |
| ヨミカゲ | mid | 12/3/15→12/3/**14** | 55→**52** | 8→**7** | +3→**+1** | -4→**-5** |
| ヨミカゲ | high | 19/4/22→19/4/**20** | 80→**78** | 11→**10** | +4→**+1** | -8→**-9** |
| ヨミカゲ | low | 26/5/31→26/5/**29** | 115→**114** | 15→**13** | (down)→**0** | -15→**-16** |
| バレット | crouch | 10/3/15→10/3/15 | 42→**44** | 6→**5** | +3→**+1** | -4→**-5** |
| バレット | mid | 14/3/16→14/3/16 | 60→**64** | 9→**8** | +3→**+1** | -5→**-6** |
| バレット | high | 21/4/22→21/4/22 | 90→**96** | 13→**12** | +5→**+1** | -9→**-10** |
| バレット | low | 28/5/31→28/5/31 | 130→**138** | 17→**16** | (down)→**+1** | -16→**-17** |
| ダーク | crouch | 8/3/13→8/3/13 | 36→**37** | 4→4 | +3→**+1** | -3→**-4** |
| ダーク | mid | 11/3/14→11/3/14 | 52→**54** | 7→7 | +4→**+2** | -4→**-5** |
| ダーク | high | 17/4/20→17/4/20 | 78→**81** | 10→10 | +5→**+2** | -8→-8 |
| ダーク | low | 24/5/28→24/5/28 | 110→**116** | 14→14 | (down)→**+1** | -14→-14 |

全81セル（9キャラ×4段×[S/A/R/Dmg/GD/HitAdv/BlockAdv]）を`COMBAT_VNEXT_FINAL.md`§6の生数値から独立に再計算し、
`advantage=stun-(active-1)-recovery`の逆算を再度順算で検証（同スクリプトで往復一致を確認）。詳細は6.1節。

## 3. §3-5/§10-12 実装内容

- **Dodge R2(§3)**: `DODGE_TABLE`を「1種avoids成功/1種normal素被弾/1種counter誤回避」の三すくみから、
  「2種avoids成功(同格・counterReady付与)/1種counter誤回避」の二値モデルへ再設計。
  `crouch:{beats:['high','mid'],counter:'low'}` / `sway:{beats:['high','low'],counter:'mid'}` /
  `lunge:{beats:['mid','low'],counter:'high'}`。旧`rule.normal`フォールスルー分岐は消滅（beats2+counter1=3で
  全レベルを尽くすため到達不能になった、と判断し削除）。
- **共通F(§2、Dodge/Counter関連のみ)**: `DODGE.judgeF`を10→**12**へ変更（evade判定F2-F10→F2-F12）。
  `DODGE.totalF`(22)/`counterReadyF`(18)/`COUNTER_MUL`(1.2)は既存値と一致のため無変更。
  Modern history timeout(45F)・Classic Cancel窓(16/16/14/12)はPR3対象外・現状未実装のため無変更（何も既存しない）。
- **Guard→Dodge 10Fバッファ(§2、新設)**: `BAL.DODGE.guardBufF=10`。`f.dodgeBufKind`/`f.dodgeBufF`を新設し、
  blockstun中のDodge入力を`applyInputs()`でバッファ、`tryDodgeBuf()`（`tryBuf()`と同型の毎F呼び出し）が
  最初のactionable frame(guard/idle復帰)で通常Dodgeとして発火する。
- **Normal Chain R2(§4)**: `chainableTo(lv,fromLv)`を新設し、旧来の`BAL.ATK[lv].w`比較による「軽→重ルートのみ」制約を撤廃。
  HIGH/MID/LOW間は自由順・同段連続可。Crouchのみ「そこへ戻れない」起点段として残置（他段からcrouchへは不可、
  crouch→crouchの同段連続は可）。CPU AIのチェーン継続候補生成もこの関数に追従させた。
  `normalChainCount`は既存(NORMAL-CHAIN-R1)のまま`combo`と分離済みで、追加変更なし。
- **OP相殺(§4、新設)**: `f.opNormalLv`/`f.opRepeat`(1〜4)を新設。`startAtk()`/`startCrouchAtk()`で同一Normal直連続を
  追跡し、`BAL.OP_SCALE=[1.0,0.9,0.8,0.7]`をDamage(`hitApply()`)とGuardDamage(被ガード分岐)に乗算。
  別Normalへ切替でreset。Startup/Active/Recovery/Stun/Modern historyは対象外（触れていない）。Commandは`cm`が
  真のときscale固定1で対象外。技固有Knockbackへの適用は、本エンジンではNormal自体に技固有knockback値が
  そもそも存在しない（§6のNormal共通knockback=0化により尚更）ため実質的に無適用（4.4節）。
- **Combo Scaling R2(§5)**: `BAL.SCALE`を6段→**9段**`[1.0,0.85,0.7,0.6,0.5,0.42,0.35,0.3,0.25]`、
  `SCALE_FLOOR`を0.4→**0.25**へ変更。Classic Cancel/Dark Chain/Ability-normalChain-resetは未実装のため
  `att.combo`のリセット箇所（既存のHIT確定/ガード/回避/ダウン/ラウンド等の契機のみ）に変更なし＝
  それらの将来フックがこのリセットを呼び出す経路は存在しない。
- **Normal common root knockback=0(§6)**: `hitApply()`の素ヒット分岐（下段等のdown分岐でもRoar/Ult/Gyuiin/Throwでもない、
  通常のhitstun遷移）で、Commandでない場合(`cm`が偽)のみ`kb=0`。Commandの場合は旧来のkb=11を維持（§13のCommand数値は
  本PR対象外のため）。投げ(kb=34)/Roar(kb=20/30/34)/Ult(kb=20/46)/Gyuiin(clashのkb=14/44)/down分岐(kb=20)は無変更。
- **Focus(§10、hard live removal)**: `gainFocus()`をno-op化(gain除去)、`checkFocusTrigger()`をno-op化
  (auto slow除去。`focusSlowMs`は恒久的に0のまま=スロー演出は絶対に発火しない)、HUD描画(集中ゲージ)を削除、
  CPU AIの`focusThreat`分岐と`AIDIFF.*.focusRestraint`フィールドを削除(CPU logic除去)。
  `f.focus`/`BAL.FOCUS`はschema/compatibility目的でのみ残置（値自体に意味は無い。旧gameplayの残存はゼロ）。
- **S(§11)**: `BAL.SG`を`aBlk:8→6`/`gOk:6→5`/`whiff:2→0`に修正し、`dodge:6`(Correct Dodge新設)/`armor:3`
  (Armor absorb新設、旧来attacker側`aBlk`の誤流用を分離)を追加。`aHitC`(combo action1-3=12/7/4)は
  action4+が旧実装だと`Math.min(idx,2)`でaction3の値を使い続けてしまう不一致バグを修正し、明示的に0にした。
  「multi-hit Commandは1action」は本エンジンの`hitApply()`が1回のcontactにつき最大1回しか呼ばれない構造上
  既に真であることを確認済み(4.6節)。
- **Roar/Ult(§12)**: 「Roar自身S gain0」を`roarResolve()`の全3分岐(被ガード/相殺armor窓/クリーンヒット)から
  attacker側のS gain呼び出しを削除して実装(defender側の被弾S/Ultストック増分は既存のまま)。
  Round carry(0→0/1→1/2→2/3→2)を`BAL.ULT.roundCarryCap=2`+`roundInit()`の`Math.min(f.ult,2)`で実装
  (旧実装は`first`ラウンドのみ`f.ult=0`/`f.s=0`で、2ラウンド目以降は無条件で全キャリー＝vNext以前の挙動だった)。
  S(§11 "Round start0")も`first`に関わらず毎ラウンド無条件で0にした。固有Gauge/stock/tempのRound reset自体は
  `roundInit()`の汎用リセットループ内（Roar/Ult/Sの3つに限定しないコメントを付記。PR4のAbility固有gaugeも
  同じループに追加すればよい構造）。

## 4. 変更しなかったもの・対象外（明示）

1. **§8 Modern R4 / §9 Classic Cancel / §13 Command R2数値**: PR3対象外。プロトタイプに現状これらの
   仕組み自体が存在しないため、「既存のものを壊さない」観点でも変更点はない（4.1節）。
2. **63 Command個別のstartup/damage/GD等の数値**: `BAL.CMD.moves`は無変更（`git diff`でCMD.moves部分に差分が
   無いことを確認済み）。ただしCommandは以下の**generic**システムの影響を受ける（意図通り）:
   Combo Scaling R2(§5)・S gain table(§11)・Roar/Ult(§12)・HP/Guard(§7、maxHpFor/maxGuardFor経由)。
   OP相殺(§4)はCommand対象外なので影響なし。
3. **9キャラのAbility状態機械**: PR4対象外。未着手（stub/no-opのまま、本PRで新規に触れていない）。
4. **`src/core/**`のG系列shadow contract**: `reports/current_impl_constants.json`/`current_impl_phases.json`は
   BAL-R1完了報告(7.1節)で明記された「ライブのprototype/CHARSと同期する運用ではない、意図的に固定された
   スナップショット」の方針をそのまま継承し、本PRでも一切書き換えていない(`git diff`で無変更確認済み)。
   `src/core/combat-moves.ts`等が参照する`CURRENT_BAL.CMAX`/`CURRENT_BAL.SCALE`等は旧の凍結値のままで、
   本PRのBAL.SCALE(9段)/OP_SCALE等とは意図的に非同期(既存のNORMAL-CHAIN-R1のCMAX凍結と同じ扱い)。
5. **hidden GuardDamageTaken倍率**: 元から存在しない機構であることを確認済み(`def.guard-=A1.gd`は
   per-char乗数なしの直接減算)。「全員x1.00」は変更不要で既に真。
6. **multi-hit Commandは1action**: `hits`フィールドは演出専用(`pose()`のトグルのみ参照)で、実際の
   ダメージ/S計算経路(`hitApply()`)は`hasHit`ガードにより1回のcontactにつき最大1回しか呼ばれない構造。
   これは既存(pre-vNext)からの構造であり、本PRで新規に「1action化」する実装は不要だった。
7. **正解DodgeをReach3だけで無効化しない**: そのような無効化ロジック自体がコード上どこにも存在しないことを
   grep確認済み(`.reach`はわざ表UI表示にのみ使われ、判定ロジックに一切関与しない)。何もしていない＝満たされている。
8. **Presentation→hitbox/reach/state逆流禁止(§1)**: 本PRでは`prototype`の描画コード(`gauges()`の集中ゲージ削除、
   HUD領域のみ)以外の描画ロジックには触れていない。数値/状態遷移の変更は§2-7/§10-12ロジック関数のみに限定した。

## 5. 判断が必要な解釈（レビュー時にご確認いただきたい点）

1. **Armor absorb+3の帰属**: `COMBAT_VNEXT_FINAL.md`§11は「Armor absorb +3」がどちら側の得点かを明示していない。
   本実装は「Guard成功+5」と対称に、**吸収した側(armor保持側=def)**が+3を得ると解釈した(旧実装はattacker側に
   `aBlk`を誤って流用していたため、その解体も兼ねている)。attacker側は0(旧実装から変更＝attacker側consolationを撤廃)。
2. **Roar被ガード時のdefender側「Guard成功+5」**: §12「Roar自身S gain0」はattacker(roar使用側)のみを指すと解釈し、
   defender側のGuard成功ボーナスは(元から実装されていなかったため)本PRでは追加しなかった。汎用Gain表(§11)を
   厳密適用するなら本来defenderにもgOkが付くべきという読みもあり得るため、既存のギャップとして明記する
   (新規に壊した訳ではなく、pre-existingな未実装箇所)。
3. **OP相殺のリセット契機**: spec文言は「別Normalでreset」のみを明示し、他の状態遷移(被弾/ダウン/ラウンド)での
   リセットは明示していない。本実装はラウンド開始時のみ明示的にリセットし、それ以外(被弾/ガード/ダウン/コマンド技を
   挟んだ場合等)は`f.opNormalLv`/`f.opRepeat`を保持し続ける(=次に同じNormalへ戻ったら継続する)、
   最も文言に忠実な最小実装とした。
4. **Command common knockback**: §6は見出し上「Normal R2」の一節で「Normal common root knockback=0」と明示している
   ため、Command自体のkb(旧来の共通値11)は本PR(§13対象外)では変更していない。Commandの一部技に付いている
   `Pushback2`等のtagは元からdata上のannotationのみで実際のkb分岐には結線されていない(pre-existing、本PRでも
   結線を追加していない＝Command数値実装自体は§13/PR3の範囲と判断)。

## 6. テスト結果

### 6.1 数値の独立検証(静的)

`COMBAT_VNEXT_FINAL.md`§6/§7の生数値から独立に9キャラ×4段の全項目(S/A/R/Damage/GuardDamage/HP/Guard/
HitAdv/BlockAdv)を再計算し、prototypeへ`evalLiteralFrom`(audit_current_impl.mjsと同じ手法)で実際に
埋め込まれた`BAL_R1_CHARS`と1件ずつ突き合わせ、advantage formulaの往復一致(`stun-(active-1)-recovery`が
目標値と一致)も含めて**全81セル+HP/Guard18件が一致**(スクリプト実行結果: `ALL CHECKS PASSED`)。

### 6.2 Dodge R2 / Chain freedom の構造検証(静的、純関数抽出)

- `DODGE_TABLE`の`beats`(2)+`counter`(1)が3レベル(high/mid/low)をちょうど1回ずつ覆っていることを
  3種のdodgeType全てで確認(`crouch`/`sway`/`lunge`ともOK)。
- `chainableTo(lv,fromLv)`をソースから直接抽出・実行し、high/mid/low間の全9組み合わせが許可(true)、
  crouchへの遷移がcrouch以外からは全て禁止(false)、crouch→crouchのみ許可されることを確認(16/16 OK)。

### 6.3 dist/prototype整合性

`tools/build_mobile.mjs`で`dist/mamoken_mobile.html`を再生成し、`evalLiteralFrom`でprototype/distの
`BAL`/`CHARS`リテラルを直接比較して**完全一致**を確認(`BAL same: true` / `CHARS same: true`)。
画像1511点+BGM3点を埋め込み、出力52.11MB(既存ビルドと同工程・同スクリプトで再生成のみ)。

### 6.4 ローカルCIパリティ(`npm run check:*`、全34件)

`ability-ui-manifest`/`core`/`command`/`command-catalog`/`browser-command-contract`/`additional-move-readiness`/
`combat-v2`/`battle-state-v2`/`legacy-adapter-v2`/`product`/`combat`/`defense`/`gauge`/`ability`/`sprite`/
`art-runtime`/`cpu`/`ui`/`ui-visual-audit`/`roster`/`roster-full`/`roster-trial-ui`/`character-catalog`/
`character-catalog-browser`/`character-detail`/`core3-seven-move`/`runtime`/`runtime-input`/`runtime-shadow`/
`runtime-extended-shadow`/`runtime-hook`/`runtime-export`/`runtime-canary`/`runtime-canary-audit`/
`runtime-authority` — **34/34 PASS**。`typecheck:core`/`typecheck:product`も単独実行でクリーン。

`check:core`のBattleState-hash決定論アサーションは`src/core/`の凍結shadow contractに対するものであり
(4節参照)、本PRはこのレイヤーを変更していないため無変更のまま通過。`check:art-runtime`/
`check:ability-ui-manifest`も無変更・green(art/ability UI領域は本PRのスコープ外であることの確認)。

### 6.5 オンライン決定論(コードレビューベース、実機ブラウザ確認は本セッションでは未実施)

本サンドボックス環境にはPlaywright/ブラウザ実行環境が無く(BAL-R1完了報告時と同様の制約)、実機2ブラウザでの
ライブ確認は未実施。代わりに以下をコードレビューで確認した:

- `git diff`で追加された行に`Math.random`/`Date(`/`new Date`/`localeCompare`/`performance.now`の**新規追加が無い**こと。
- 追加した`chainableTo()`/OP相殺の`opRepeat`更新/Guard→Dodgeバッファ/S gain変更は全て純粋な状態遷移
  (`rng()`呼び出しの回数・順序を変えない)であり、両クライアントが同一の共有コード+同一入力を処理する限り
  決定論は保たれる構造(rng呼び出し箇所は既存のCPU AI分岐のみで、CPU AIはオンライン対戦(`netFightStep`)では
  そもそも呼ばれない)。
- `dist`/`prototype`の`BAL`/`CHARS`完全一致(6.3節)により、オンライン両クライアントが読む定数テーブルは
  常に同一。

## 7. ACCEPTANCE_TESTS.md 対応状況

### # Combat

| 項目 | 結果 | 備考 |
|---|---|---|
| Normal Chain Limit 9char値 | PASS(既存無変更) | NORMAL_CHAIN_LIMIT自体はNORMAL-CHAIN-R1のまま。本PRの対象は自由順化(下記) |
| H/M/L arbitrary order | PASS(新規実装) | `chainableTo()`。6.2節で構造検証済み |
| same Normal repeat | PASS(新規実装) | チェーンrouteとしても許可、OP相殺のトラッキング対象としても対応 |
| BLOCK/WHIFF true chain end | PASS(既存無変更) | `canChain()`の`landedHit`ゲートは既存のまま(true chainはHITのみ継続の既存仕様を保持) |
| Modern history BLOCK persist | N/A | Modern history自体が未実装(PR3範囲)。何も壊していない |
| Normal LOW common downなし | PASS(新規実装) | BAL_R1_CHARS全キャラのlowから`down`フィールドを削除、hitstunを持つ通常遷移へ |
| OP 100/90/80/70 | PASS(新規実装) | `BAL.OP_SCALE`+`f.opNormalLv`/`f.opRepeat` |
| Combo Scaling floor25 | PASS(新規実装) | `BAL.SCALE`9段+`SCALE_FLOOR=0.25` |
| common Normal knockback0 | PASS(新規実装) | `hitApply()`素ヒット分岐、Command以外`kb=0` |
| HP/Guard 9char | PASS(新規実装) | §7表を全面採用。2節参照 |
| hidden GD taken multiplierなし | PASS(既存確認) | 元から存在しないことを確認済み(4.5節) |

### # Dodge

| 項目 | 結果 | 備考 |
|---|---|---|
| CROUCH vs H/M/L | PASS(新規実装) | avoids H+M / counter L |
| SWAY vs H/M/L | PASS(新規実装) | avoids H+L / counter M |
| LUNGE vs H/M/L | PASS(新規実装) | avoids M+L / counter H |
| wrong evade Counter1.2 | PASS(既存無変更) | `hitApply(att,def,true)`→`BAL.COUNTER_MUL=1.2`(既存) |
| correct completion18 | PASS(既存無変更) | `DODGE.counterReadyF=18` |
| miss22 | PASS(既存無変更) | `DODGE.totalF=22` |
| Guard→Dodge 10F buffer | PASS(新規実装) | `dodgeBufKind`/`dodgeBufF`/`tryDodgeBuf()` |
| Reach3 aloneでcorrect evade無効化しない | PASS(既存確認) | そのような無効化ロジックが存在しないことを確認済み |

### # Focus

| 項目 | 結果 | 備考 |
|---|---|---|
| gameplay gainしない | PASS | `gainFocus()`をno-op化 |
| auto slowしない | PASS | `checkFocusTrigger()`をno-op化。`focusSlowMs`は恒久的に0 |
| HUDに出ない | PASS | 集中ゲージ描画を`gauges()`から削除 |
| CPU logicで参照しない | PASS | `focusThreat`分岐と`AIDIFF.*.focusRestraint`を削除 |
| compatibility fieldが残ってもlive behaviorなし | PASS | `f.focus`/`BAL.FOCUS`は残置だが上記no-op化で無効果 |

### # Resource

| 項目 | 結果 | 備考 |
|---|---|---|
| S gain table | PASS(新規実装) | §11表を全面採用。5節の解釈注記あり(Armor absorb帰属) |
| multi-hit once | PASS(既存確認) | `hits`フィールドは演出専用、実装上既に1action |
| Roar cost/gain | PASS(新規実装) | cost(sCost:100)は既存無変更。「Roar自身S gain0」を新規実装 |
| Ult carry 3→2 | PASS(新規実装) | `BAL.ULT.roundCarryCap=2`+`roundInit()` |
| unique gauges Round reset | PASS(既存+新規) | 汎用リセットループ(roundInit)に集約。S/Ultも今回このループへ統合 |

### # Online / Build

| 項目 | 結果 | 備考 |
|---|---|---|
| deterministic hash | PASS(コードレビュー) | 新規rng呼び出し無し、6.5節参照。実機確認は未実施(残課題) |
| mock relay | N/A(無変更) | server/未変更 |
| Gyuiin variants | N/A(無変更) | Clash関連の定数・処理は無変更(kb=14/44等含め) |
| creator/joiner | N/A(無変更) | オンラインロビー関連は無変更 |
| build:art | PASS | `npm run build:art`成功、data/art系に差分なし |
| build:mobile | PASS | 6.3節、dist再生成・BAL/CHARS一致確認済み |
| committed dist reproducible | PASS | 本PRでdist/mamoken_mobile.htmlをコミット |
| G00/G01/G02 scoped-diff contract | PASS(既存無変更) | `src/core/**`無変更(4節) |

## 8. 残課題(次PRへの引き継ぎ事項)

1. オンライン決定論の実機2ブラウザ確認が本セッション環境の制約(Playwright/ブラウザ未提供)により未実施。
   コードレビューでは決定論を壊す変更が無いことを確認済み(6.5節)。
2. 5節に記載した3つの解釈(Armor absorbの帰属/Roar被ガード時defenderのGuard成功/OP相殺のリセット契機)は
   spec文言が単一の読みに定まらない箇所のため、明示的にフラグしておく。
3. §8 Modern R4/§9 Classic Cancel/§13 Command数値はPR3、9 Ability状態機械はPR4に引き継ぐ(本PRでは
   一切着手していない。stub/no-opのまま)。

## 9. 完了条件チェック

- [x] `npm run check:*` 34/34 green(6.4節)
- [x] `npm run build:mobile` 再現、`dist/mamoken_mobile.html`再生成・コミット(6.3節)
- [x] 本報告(数値差分表+ACCEPTANCE_TESTS.md項目別pass/fail、7節)
- [x] Draft PR作成(本報告後)
- [~] オンライン決定論: コードレビューでは確認済みだが実機確認は環境制約により未実施(8節)

---

Draft PRを作成済み。CI green・仕様OKならマージして次(PR3)へ進める方針（`NONSTOP_IMPLEMENTATION_ORDER.md`の
merge方針）。5節/8節の解釈確認点のみ、レビュー時にご確認いただきたい。
