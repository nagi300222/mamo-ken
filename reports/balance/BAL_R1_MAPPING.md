# BAL-R1 マッピング表

正本: 添付 `PLAYTEST_BAL_R1.json`（status: LOCKED_PROTOTYPE）。本表は実装前監査の記録であり、
数値の二重管理はしない（数値はコード側のみが正本）。

対象コード: `prototype/mamoken_prototype_v01.html` の `const BAL={...}` (旧48-150行付近) および
`attackResolve`/`hitApply`/`advance`/`roarResolve`/`grabResolve`/`ultStep`/`doBreak` 等の戦闘解決関数群。

## 0. 監査で確認した「既存契約式」

`specForLv(f,lv)` は現状 `BAL.ATK[lv]`（全キャラ共通1本）+ `f.c.sOfs`（startupのみ加算）+ `f.c.dMul`
（damageのみ乗算）で全キャラの通常技を解決している。recovery/activeはキャラ差なし。

ヒット判定窓は `f.pf>A.s && f.pf<=A.s+A.a`（＝最初のactiveフレームは `pf=s+1`）。
よって「最初のactive接触」でのアドバンテージは:

```
adv = defenderStunDur - (attackerActive + attackerRecovery - 1)
```

このゲームの `BAL.HITSTUN`/`BAL.ATK[lv].a/r` からhitAdvを逆算すると moguzo の
crouch/mid/high で新JSONのhitAdv値と完全一致(+3/+4/+6)することを確認済み。
→ この式が「既存契約式」。BAL-R1では前提を逆にして、JSONのhitAdv/blockAdvと
新しいper-char active/recoveryから **stunDur(=新HITSTUN/BLOCKSTUN)を算出**する。
（blockAdvは旧BLOCKSTUN値との逆算が一部合わないが、旧BLOCKSTUNは元々厳密に式から
算出された値ではなかったためと判断。式そのものはhit側で強く検証済みなのでblockにも
同一式を適用する）

## 1. per-character 共通4技（3.実装値 対象）

| JSONフィールド | 現行の対応 | 変更内容 |
|---|---|---|
| `characters.*.hp` | `BAL.HP`(全キャラ共通1000, `f.hp=BAL.HP`で初期化) | 各キャラCHARSに`hp`フィールドを新設し`f.hp=f.c.hp`に変更 |
| `characters.*.guard` | `CHARS[].gMax`(既にper-char) | 値をJSONに合わせて更新(godan110→105, hakuma110→125, yomikage90→95, bullet90→100, dark_moguzo100→80等) |
| `characters.*.{crouch,mid,high,low}.{startup,active,recovery,damage,guardDamage}` | `BAL.ATK[lv]`(全キャラ共通) + `f.c.dMul`(damageのみ)+`f.c.sOfs`(startupのみ) | 新設 `BAL.R1_CHARS[charId][lv]` にper-char値を格納。`specForLv()`を書き換え、この新テーブルを直接参照(dMul/sOfsは適用しない=二重適用回避)。`guardDamage`も新設(現行は共通`BAL.GDMG_A`のみ)→per-char`guardDamage`を`attackResolve`のguard分岐で使用 |
| `characters.*.{crouch,mid,high}.hitAdv/blockAdv` | `BAL.HITSTUN[lv]`/`BAL.BLOCKSTUN[lv]`(共通) | 上記契約式で`BAL.R1_CHARS[charId][lv].hitstun/blockstun`をper-charに算出して格納。`specForLv`/`hitApply`/guard分岐から共通表の代わりにper-char値を参照 |
| `characters.*.low.blockAdv`+`down:"lightDown"` | `BAL.BLOCKSTUN.low`(共通) + `BAL.DOWN`(単一・低に限らず共通) | blockstunはper-char算出。ヒット時は`down:"lightDown"`を経由し新設downWakeテーブルの`lightDown`を参照(3.4節) |

dMul/sOfsは **上記4技以外**（咆哮・奥義・コマンド技・投げ追撃）では従来通り適用し続ける
(非対象のため変更しない。二重適用ではなく元々の役割のまま)。

## 2. whiff extra recovery (新規実装, 現状は存在しない)

監査済み: 現行コードは`hasHit`の真偽に関わらず`total=A.s+A.a+A.r`固定(`advance()` L1141-1149)。
whiff時に追加recoveryを与える仕組みは無い。

実装方針: `advance()`の`attack`分岐で、`f.hasHit===false`かつ`f.phase==='attack'`(通常技のみ、
`cmdAtk`=コマンド技は対象外。コマンド技18種の正式化は非対象のため)の場合のみ
`total`に`WHIFF_EXTRA_F[f.atkLv]`(crouch0/mid2/high5/low9)を加算する。

## 3. hitstop (`BAL.HITSTOP`)

| JSON | 現行 | 変更 |
|---|---|---|
| crouch:5 | crouch:5 | 変更なし |
| mid:6 | mid:6 | 変更なし |
| high:9 | high:9 | 変更なし |
| low:12 | low:14 | 14→12 |
| throw:10 | (無し、投げは`BAL.HITSTOP.crouch`等を流用していない＝現状ヒットストップ加算箇所なし) | 新設し`grabResolve`のヒット成立箇所に適用 |
| roar:12 | roar:12 | 変更なし |
| gyuiin:16 | `BAL.HITSTOP.clash:16`(ギュイーン=clash処理で使用) | 名称据え置き(clash)で値は変更しない。ギュイーンは非対象(H.節)のため**キー名も数値も触らない** |
| counterBonus:2 | (無し) | 新設。`hitApply`のcounterHit分岐で`B.hitstop=Math.max(B.hitstop,BAL.HITSTOP[lv]+BAL.HITSTOP.counterBonus)`のように加算 |

## 4. throw (`BAL.GRAB`)

| JSON | 現行 | 変更 |
|---|---|---|
| startup:12 | `GRAB.s:12` | 変更なし |
| active:2 | `GRAB.a:2` | 変更なし |
| damage:90 | `GRAB.d:90` | 変更なし |
| whiffRecovery:32 | `GRAB.rec:28`(空振り硬直=`grabrec`フェーズで使用、監査済み) | 28→32 |
| downType:"throwDown" | 現状ヒット時は`hitstun`固定(`stunDur=BAL.GRAB.stun:30`、down状態にならない) | **挙動変更**: ヒット成立時に`hitstun`ではなく`down`(downType=throwDown)へ遷移させる。`BAL.GRAB.stun`は新构造導入後は未使用化(down系に統一) |
| followupAllowed:false | (down状態化していないため概念自体が無い) | downWake共通ロジックで`throwDown.followupAllowed=false`として扱う(=1発も追撃不可、即無敵) |
| `GRAB.seq:28`(投げヒット時の演出尺、監査済み`grabHit`フェーズで使用) | - | JSON非言及。down化に伴い`grabHit`(攻撃側の演出専用フェーズ)は維持し、**防御側**のみ`down`へ。値28は変更しない(非対象) |

## 5. down/wake (新設: 現状は`BAL.DOWN`1種類のみ)

現行は「LOW技のヒットでdown(45F)→wake(20F, 全身無敵)、down中1発だけ0.5倍追撃可、以降は
wake含め完全無敵」の1系統のみ(`BAL.DOWN`, `handleIfDowned`, 監査済み)。

新設 `BAL.DOWNWAKE={lightDown,hardDown,throwDown,ultimateDown}` の4系統+共通値
(`followupDamageScale:0.45`, `maxFollowupHits:1`, `followupExtendsDown:false`,
`wakeStrikeInvuln:true`, `wakeThrowInvuln:true`)。

- `lightDown`(downF36/wakeF18/followupAllowed:true): 現行LOW技のdown処理を差し替え先。
  現行`followupMul:0.5`→新設共通値`followupDamageScale:0.45`に変更
- `throwDown`(downF42/wakeF18/followupAllowed:false): 投げヒット時に新規適用(4節)
- `ultimateDown`(downF54/wakeF24/followupAllowed:false): 奥義ヒット時に新規適用(9節)
- `hardDown`(downF48/wakeF20/followupAllowed:false): **JSON中に発生源の明示的な紐付けが無い**
  （`characters.*`にも`throw`/`ultimate`にもhardDownへの参照が無い）。本パケットでは
  どの技もhardDownを発生させない前提と判断し、**テーブル定義のみ追加し発火経路は結線しない**
  (将来の技追加に備えたプレースホルダ)。完了報告に明記しFable5へ確認を仰ぐ。

`handleIfDowned`はdownType引数を取るよう変更し、`followupAllowed:false`の型は
1発も追撃を許さず即座に完全無敵(`return true`即時)とする。

## 6. guard regen / break (`BAL.GREGEN`,`BAL.DIZZY`,`BAL.GRECOVER`)

| JSON | 現行 | 変更 |
|---|---|---|
| `guard.regenDelayF:60` | (無し。被ガードダメージ直後から即regen対象、監査済み) | 新設: per-fighterに`guardRegenCooldownF`を追加し、ガードダメージを受ける度に60へリセット。0になるまでregen停止 |
| `guard.regenPerSecond:12`(=0.2/F @60fps) | `GREGEN:0.22`(全フェーズ共通のF単位固定値) | down/wake以外のフェーズで0.2/Fに変更 |
| `guard.downWakeRegenPerSecond:6`(=0.1/F) | 同上(down/wakeも0.22/Fで同一、監査済み) | down/wakeフェーズのみ0.1/Fに分離 |
| `guard.breakStunF:36` | `BAL.DIZZY:90`(dizzy継続フレーム) | 90→36 |
| `guard.breakMaxFollowupHits:2`+`breakMaxDamage:180` | (無し。dizzy中は無制限にフルダメージ通る、監査済み) | 新設: `doBreak()`で`def.dizzyHits=0,def.dizzyDamage=0,def.postBreakActive=true`初期化。**実装上の注意**: `dizzy`フェーズ自体は1発被弾すると即座に`hitstun`(またはdown)へ遷移してしまうため、`def.phase==='dizzy'`だけでは2発目を判定できない。そこで`postBreakActive`フラグを新設し、`doBreak()`から`resolveToIdle()`で自然にidle(または先行入力技)へ復帰するまでの間、hitstun/down状態をまたいで追撃キャップの集計を継続する。上限到達(2発 or 累計180)で即座に`NORMAL_RESET`(idleへ強制遷移・guardは`recoverTo`まで回復・`postBreakActive`もクリア)。上限到達回の被ダメージは180超過分をクランプ |

`GRECOVER:50`(dizzy明けのguard回復値)はJSON非言及のため変更しない。

## 7. combo scale / counter multiplier

| JSON | 現行 | 変更 |
|---|---|---|
| `comboScale:[1.0,0.85,0.7,0.6,0.52,0.46]` + `comboScaleFloor:0.4` | `BAL.SCALE:[1,0.9,0.8]`(3要素、`combo`は`Math.min(att.combo,2)`でindex clamp、監査済み) | 6要素に拡張。index計算を`Math.min(att.combo, arr.length-1)`のまま使い、配列長を超える分は起こり得ない(常に最終要素0.46が下限として使われる)ため`comboScaleFloor`は**将来combo数が配列長を超える形に拡張された場合の安全弁**として`Math.max(floor, arr[idx])`の形で併用する |
| `counterDamageMultiplier:1.2` | `BAL.DODGE.counterMul:1.25` と `BAL.GRAB.counterMul:1.25`(別々に定義、値は同一。監査済み) | 1本の`BAL.COUNTER_MUL=1.2`に統合し両箇所から参照。技専用`counterMul`上書き(昇撃1.5等)は非対象のため変更しない |

## 8. roar / focus

| JSON | 現行 | 変更 |
|---|---|---|
| `roar.startup:17` | `ROAR.s:16` | 16→17 |
| `roar.active:4` | `ROAR.a:4` | 変更なし |
| `roar.recovery:24` | `ROAR.r:24` | 変更なし |
| `roar.armorStartF:4/armorEndF:15/armorHits:1` | `ROAR.armor:14`(`def.pf<=14`で常にアーマー、0Fから、監査要件で確認要) | アーマー窓を`4<=pf<=15`に変更(**挙動変更**: 発生直後4Fはアーマー無し) |
| `roar.damage:120` | `ROAR.d:130` | 130→120 |
| `roar.guardDamage:38` | 共通`BAL.GDMG_S:45`を流用 | roar専用`guardDamage:38`に切替(共通値は他技のまま維持) |
| `roar.chipDamage:10` | 共通`BAL.CHIP_S:20`を流用 | roar専用`chipDamage:10`に切替 |
| `roar.hitstunF:34` | `ROAR.stun:34` | 変更なし |
| `roar.sCost:100` | `f.s>=BAL.SMAX(100)`(監査済み一致) | 変更なし |
| `roar.cleanHitUltGain:1` | 既存咆哮クリーンヒットで`gainUltStock(att)`(+1、v2.3で実装済み) | 変更なし |
| `focus.slowMul:0.5` | `FOCUS.slowMul:0.25` | 0.25→0.5 |
| `focus.realDurationSec:0.75` | `FOCUS.durationMs:600` | 600→750 |

## 9. ultimate

| JSON | 現行 | 変更 |
|---|---|---|
| `ultimate.baseDamage:300` | `ULT.d:300` | 変更なし |
| `ultimate.guardDamage:32`+`chipDamage:0`+ガード分岐 | **現状ガード分岐が存在しない**(`ultStep`は無条件で`hitstun`+フルダメージ、監査済み) | **挙動変更**: 着弾フレームで`def.phase==='guard'||'blockstun'&&held`ならguard-32・hp変化なし(chipDamage:0)。非ガード時のみhp-=300 |
| `ultimate.downType:"ultimateDown"` | 現状`hitstun`固定(stunDur=46) | 非ガード命中時は`down`(downType=ultimateDown)へ遷移 |
| `ultimate.endsCombo:true` | 既存`def.combo=0`で実質満たしている | 変更なし(確認のみ) |

## 9.5 CI互換性の注意点(監査で発見)

`tools/audit_current_impl.mjs`は`prototype`側`BAL`を実行時に抽出し、
`required=[BAL.BUF,BAL.CMD.buffer,BAL.CMD.bufF,BAL.ROAR.s,BAL.ROAR.armor,BAL.CLASH.d,...]`が
すべて非null/非0であることを要求する(違反時throw)。また`distContractChecks.balSame`で
prototype側BALとdist側BALの`JSON.stringify`完全一致を要求する(=CIの`core-check.yml`が
このスクリプトを実行しゲート化している)。

対応:
- `BAL.ROAR.armor`フィールドは**互換のため残す**(値は`armorEndF`と同じ15を設定。実際の
  アーマー判定ロジックは新設の`armorStartF`/`armorEndF`を参照し、`armor`はこの監査スクリプト
  専用の後方互換値とコメントで明記する)
- BAL変更後は必ず`node tools/build_mobile.mjs`→`node tools/audit_current_impl.mjs`の順で
  実行し、dist再生成→prototype/dist一致の確認→`reports/current_impl_constants.json`等の
  再生成、をこの順で行う

## 10. 変更しないもの(非対象/対象外と判断した項目)

- 63基本技の枠4〜7、P1暫定コマンド技18種の数値・フレーム
- Gyuiin(clash)関連の定数・処理 — 一切触れない
- `BAL.PINCH_HP`(300, 見切り猶予拡大の閾値。全キャラ共通の絶対値のまま。per-char HP導入後も
  相対値化はJSON非言及のため見送り、完了報告に明記)
- `BAL.MIKIRI.windowPinch:7`(JSON非言及)
- `GRECOVER:50`(dizzy明けguard回復値、JSON非言及)
- `GRAB.seq:28`(投げ演出尺、JSON非言及)
- `hardDown`の発火経路(上記5節)
- 新6体のonlinePlayable(P1契約のまま変更しない)
- G00/G01系shadow contract(src/core/)のauthority切替
