# NORMAL-CHAIN-R1 Completion Report — キャラ別通常打撃chain上限

## 概要

共通定数 `BAL.CMAX=3` を、通常打撃(crouch/mid/high/low)chainの上限判定に限ってキャラ別の値へ置き換えた。
既存のHIT時のみchain可能というルール、GAP/BLOCK/WHIFFルール、chain route(軽→重: crouch→mid→high→low)、
BAL-R1/CMD-R1の数値は一切変更していない。

## 旧CMAX=3 → キャラ別normalChainLimitのmapping

```text
旧: BAL.CMAX = 3 (全キャラ共通)

新: NORMAL_CHAIN_LIMIT = {
  moguzo:      3   (旧CMAXと同値)
  pisuke:      4   (旧CMAXより緩和。現行route(crouch/mid/high/low)は4段に対応しているためroute変更なしで到達可能)
  godan:       2   (旧CMAXより厳格化)
  hakuma:      2   (旧CMAXより厳格化)
  chirka:      3   (旧CMAXと同値)
  takimaru:    2   (旧CMAXより厳格化)
  yomikage:    2   (旧CMAXより厳格化)
  bullet:      3   (旧CMAXと同値)
  dark_moguzo: 4   (旧CMAXより緩和。pisukeと同様、現行routeで4段到達可能)
}
```

`BAL.CMAX=3` 自体は削除していない(据え置き)。理由は「実装形」節参照。

## 実装

### データ構造(データ駆動)

```js
// prototype/mamoken_prototype_v01.html: BAL_R1_CHARSの直後
const NORMAL_CHAIN_LIMIT={moguzo:3,pisuke:4,godan:2,hakuma:2,chirka:3,takimaru:2,yomikage:2,bullet:3,dark_moguzo:4};
// r1Char()の直後
function normalChainLimitFor(c){return NORMAL_CHAIN_LIMIT[skeletonIdOf(c)];}
```

`r1Char()`(BAL-R1で導入済みのper-charデータ取得口)と全く同じ形(`skeletonIdOf(c)`経由の単一取得口)にしたため、
将来CharacterDef/BALデータへ移す際は`normalChainLimitFor`の中身だけ差し替えれば済む。

### 専用カウンタ(既存comboとは別概念)

`f.normalChainCount`(newFighter初期値0)を新設。既存の`f.combo`(ダメージスケール/S ゲージボーナス/UI表示/
CPU AIの一般的な「連続被弾中」判定に使う既存概念)とは完全に分離し、`canChain()`のゲート判定にのみ使う。

- **増加**: `hitApply()`の確定ヒット分岐で、コマンド技でない場合(`!cm`)のみ`+1`。コマンド技のヒットは
  `att.normalChainCount`を増やさない(既存comboの`comboEnd`処理とは独立)。多段技(`m.hits>1`)はコマンド技側
  でのみ存在する概念で、そもそも`hitApply()`は1回のcontact(1回の呼び出し)につき最大1回しか呼ばれない
  (`hasHit`ガードにより同一active windowの再ヒットは発生しない)ため、多段技がchain action数を余計に
  増やすことはない。
- **上限判定**: `canChain(f,lv)`で`f.combo>=BAL.CMAX`だった判定を`f.normalChainCount>=normalChainLimitFor(f.c)`
  へ置き換え。GAP/BLOCK/WHIFF/chain routeの判定条件(`f.phase!=='attack'`/`!f.landedHit`/
  `BAL.ATK[lv].w<=BAL.ATK[f.atkLv].w`/アクティブ+キャンセル窓のpf判定)は一切変更していない。
- **リセット**: 既存の`f.combo=0`リセット箇所(roundInit/startAtkの非chain分岐/startDodge/startCrouchAtk/
  startCmdAtk/startCmdGrab/startCmdStance/roar開始/通常grab開始/advance()の攻撃action満了/
  attackResolveのカウンター被弾/hitApply確定ヒット分岐の被弾側3分岐/roarResolveクリーンヒット/
  grabResolve成立/startClash/ultStepダウン分岐)の全箇所に`f.normalChainCount=0`を並記した。加えて、
  投入文で明示された「奥義へ移った場合はreset」に対応するため、既存combo処理には無かった
  `fireUlt()`にも新規で`att.normalChainCount=0`を追加した(既存comboの挙動は変更していない)。
  chain継続時(`startAtk(f,lv,true)`)は既存combo同様にリセットしない。

### CPU AI追従(バランス変更ではない整合性修正)

CPU AIの「chain継続を試みるか」の判定(`if(me.phase==='attack'&&me.hasHit&&me.combo<BAL.CMAX&&me.atkLv)`)も
旧CMAXを直接参照していたため、`me.normalChainCount<normalChainLimitFor(me.c)`へ追従させた。これはAIが
実際のゲートと同じ上限を認識するようにする整合性修正であり、新しい「連打対策」ではない(禁止事項の
「アンチ連打対策として別のBAL調整を追加しない」に抵触しない)。

### デバッグ表示

`?debug=bal`のオーバーレイに`nChain{count}/{limit}`の1行を追加した(QA確認用。通常プレイUIには出さない)。

## 今回やらないこと(投入文の指示通り、未変更)

共通ノックバック再設計/Pushback Class/repeat penalty/通常技のstartup・damage変更/hitstun・blockstun変更/
GAP変更/固有能力実装/コマンド技特殊挙動実装/アート/VFX/Gyuiin変更 — いずれも変更していない。
既存BAL/CMD数値(damage/startup/active/recovery/guardDmg/hitstun/blockstun等)も一切変更していない。

## `BAL.CMAX=3`を削除しなかった理由

`src/core/combat-moves.ts`の`CURRENT_COMBO_PROFILE`(shadow layer、`reports/current_impl_constants.json`
経由で`CURRENT_BAL.CMAX`を参照)が既存でこの値を読んでいる。削除すると`undefined`化し
`test/combat-moves.test.mjs`等が壊れる。本タスクは「軽量実装」かつ「共通定数CMAX=3への直書きを、
live側のcanChain()判定においてのみ辞める」ことが目的であり、shadow layer(3キャラのみを対象とする別の
契約)の再設計は範囲外と判断し、`BAL.CMAX:3`はコメントを更新した上で凍結値として残した。

**既知の限界(発注者判断が必要な点)**: `CURRENT_COMBO_PROFILE`(id:`'current-normal-chain-v1'`)の
`maxHits`/`capacity`は依然として単一の`CMAX=3`を指しており、moguzo(3)は一致するがpisuke(4)/godan(2)とは
一致しない。この shadow layer は元から「現行3キャラ共通の単一値」というモデルで、per-character化されて
いない。per-character化するにはshadow layer自体の構造変更(`ComboRuleProfile`をper-character化する等)が
必要で、本タスクの「軽量実装」の範囲を超えるため今回は手を付けていない。

## テスト結果

Playwrightで実行した動作確認スクリプト(scratchpad、リポジトリには未コミット。BAL-R1.1/CMD-R1と同じ
established precedent):

### 挙動確認(`normal_chain_r1_verify.cjs`) — 21/21 pass

```text
OK   limit[moguzo]===3
OK   limit[pisuke]===4
OK   limit[godan]===2
OK   limit[hakuma]===2
OK   limit[chirka]===3
OK   limit[takimaru]===2
OK   limit[yomikage]===2
OK   limit[bullet]===3
OK   limit[dark_moguzo]===4
OK   godan: chain 1st->2nd allowed under limit=2
OK   godan: chain blocked once normalChainCount>=limit(2)
OK   block: canChain false when landedHit is false after a blocked hit
OK   whiff: normalChainCount reset to 0 after full whiff recovery
OK   whiff: phase returns toward idle
OK   dodge: normalChainCount reset to 0 on startDodge
OK   roundInit: normalChainCount reset to 0 for both fighters
OK   cmdAtk: normalChainCount reset to 0 on transition
OK   cmdGrab: normalChainCount reset to 0 on transition
OK   cmdStance: normalChainCount reset to 0 on transition
OK   multi-hit cmd move: normalChainCount unaffected (cmd hits never counted)
OK   normal hit: normalChainCount increments by exactly 1 per hitApply call
```

9キャラ全員の設定値、limit到達前後のchain可否、BLOCK/WHIFF/dodge/neutral return/command技移行での
リセット、多段技の非加算を確認済み。見切り(mikiriRec)のリセットも実装済み(idle/guardからのみ発生する
ため到達時は既にnormalChainCount=0だが、投入文の明示リストに従い明示的なリセットも追加した)。

### 決定論回帰(オフライン、`normal_chain_r1_determinism.cjs`)

limit=2(godan)/3(moguzo・chirka代表)/4(pisuke・dark_moguzo代表)を横断する4マッチアップで、通常chain
連打(mid→high→low)を試みる同一入力列を2回(フレッシュなページ読み込みごと)実行し、hash一致を確認:

```text
godan vs pisuke: hash1=09df4fa72183 hash2=09df4fa72183 OK
moguzo vs godan: hash1=33816573f048 hash2=33816573f048 OK
pisuke vs dark_moguzo: hash1=afed93ddc571 hash2=afed93ddc571 OK
chirka vs hakuma: hash1=811d96cca6f3 hash2=811d96cca6f3 OK

ALL DETERMINISTIC (same seed/input -> same hash)
```

### online hash回帰(`normal_chain_r1_online.cjs`、ONLINE-9の2ページlockstepハーネスを再利用)

実際のonline lockstepコードパス(`startOnlineBattle`/`netLogicTick`)を2つの独立したPlaywrightページで
駆動し、状態ハッシュに`normalChainCount`を含めて比較(limit=2/3/4を横断する代表4マッチアップ、
ONLINE-9で確立済みの手法をそのまま再利用):

```text
godan vs hakuma [roarUlt]: hashA=4d83f49dbd4e hashB=4d83f49dbd4e OK
moguzo vs chirka [gyuiin]: hashA=8a57f14e3927 hashB=8a57f14e3927 OK
pisuke vs dark_moguzo [roarUlt]: hashA=e9b2debb7094 hashB=e9b2debb7094 OK
bullet vs takimaru [gyuiin]: hashA=b3c842da2fa3 hashB=b3c842da2fa3 OK

ALL MATCHUPS DETERMINISTIC (same seed -> same hash across two independent client instances)
```

(全9キャラの網羅ではなく、chain limitの3値(2/3/4)を横断する代表4ペアに絞って時間短縮した。ONLINE-9
自体の全9キャラ決定論回帰は別途完了済み。)

## ローカルCIパリティ

`check:core`/`check:combat`/`check:defense`/`check:gauge`/`check:ability`/`check:cpu`/`check:command`/
`check:command-catalog`/`check:runtime`/`check:runtime-shadow`/`check:runtime-extended-shadow`/
`check:combat-v2`/`check:roster`/`check:roster-full`/`check:roster-trial-ui`/`check:character-detail`/
`check:character-catalog`/`check:sprite`/`check:ui`/`check:additional-move-readiness`/
`check:core3-seven-move`/`check:browser-command-contract`/`check:ui-visual-audit`: 全てgreen(変更前と
同一のhash/件数を維持。既存BAL/CMD数値・shadow contractの値は変更していないため、これらのテストの
期待値も変更不要だった)。

`node tools/audit_current_impl.mjs`(ビルド前後)+ `git restore`で生成物復元、`distContractChecks`全てtrue。

## 変更ファイル

```text
prototype/mamoken_prototype_v01.html  (NORMAL_CHAIN_LIMIT/normalChainLimitFor/f.normalChainCount新設、
                                        canChain()・CPU AI追従、全リセット箇所への並記、デバッグ表示追加)
dist/mamoken_mobile.html              (再生成)
reports/balance/NORMAL_CHAIN_R1_COMPLETION.md (本報告書)
```

`src/core/**` `server/**` `runtime/**` `assets/**` `test/**` は無変更(`git diff main -- runtime server
assets src/product design/product src/core test/`で確認済み)。

## 停止

Draft PRを作成済み。CI・回帰結果・旧CMAX=3からのmappingは上記の通り。個別のマージ指示を待って停止する。
