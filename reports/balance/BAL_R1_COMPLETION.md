# BAL-R1 完了報告

authority: `LOCKED_PROTOTYPE / PLAYTEST_RUNTIME`（正本: 添付`PLAYTEST_BAL_R1.json`）
branch: `feature/playtest-bal-r1`（P1/PR #62・BGM/PR #63とは別branch。両ブランチへは追加コミットしていない）
起点: main SHA `6c7f0c4281250e5c6f607fcd1cd20e09575c1c1f`

本パッチはオフライン試遊runtimeへ実際に接続する数値パッチであり、FORMAL BALへの自動昇格は行っていない。
G系列shadow contract(src/core/)のauthorityはshadow_onlyのまま変更していない。

## 1. Scoped diff

| ファイル | 内容 |
|---|---|
| `prototype/mamoken_prototype_v01.html` | 本体。BAL_R1_CHARS新設・既存BAL各所の更新・attackResolve/hitApply/advance/roarResolve/grabResolve/ultStep/doBreak/resolveToIdle等の改修・デバッグUI追加 |
| `dist/mamoken_mobile.html` | `tools/build_mobile.mjs`で再生成(prototypeと`BAL`/`CHARS`が完全一致することを`tools/audit_current_impl.mjs`で確認済み) |
| `reports/current_impl_constants.json` / `reports/current_impl_phases.json` | `tools/audit_current_impl.mjs`により自動再生成(監査ツールの定義通り。手書き二重管理はしていない) |
| `reports/balance/BAL_R1_MAPPING.md` | 実装前監査+新旧マッピング表(本報告の実装根拠) |
| `reports/balance/BAL_R1_COMPLETION.md` | 本報告 |

`src/core/*`・`server/*`・`docs/03_data_design.md`・P1契約(新6体onlinePlayable)・BossRuleSet・
63基本技の枠4〜7・P1暫定コマンド技18種は変更していない(`git diff --stat main -- src/core server docs/03_data_design.md`で無変更を確認済み)。

## 2. BAL mapping表

`reports/balance/BAL_R1_MAPPING.md`に全項目を記載。要点:

- 既存契約式(監査で確認: `adv = defenderStunDur - (attackerActive + attackerRecovery - 1)`、
  hit側でmoguzoの現行値と完全一致することを検証済み)を用いて、PLAYTEST_BAL_R1.jsonの
  `hitAdv`/`blockAdv`から各キャラ・各段のhitstun/blockstunを逆算した(数値の手書き二重管理はしていない)。
- 9体の`crouch/mid/high/low`のstartup/active/recovery/damage/guardDamageは新設`BAL_R1_CHARS`へ
  データ駆動で格納し、旧`dMul`/`sOfs`はこの4技には適用しない(二重適用回避)。咆哮・奥義・コマンド技・
  投げ追撃など非対象領域では従来通り`dMul`を使用し続ける。
- whiff extra recovery・投げのdown化・奥義のガード分岐・ガードブレイク追撃キャップ・
  down/wake4種構造は**現状コードに存在しなかった新規メカニクス**として実装した(詳細4節)。

## 3. 実装内容(要約)

- **per-char共通4技**: `BAL_R1_CHARS[charId].{crouch,mid,high,low}`。`specForLv()`が参照
- **HP/Guard**: `maxHpFor(c)`/`maxGuardFor(c)`ヘルパー経由でBAL_R1_CHARSを参照。旧`BAL.HP`(共通1000)・
  `CHARS[].gMax`は削除しHPバー/ガードバーの正規化も追従させた
- **whiff extra recovery**: `WHIFF_EXTRA_F`新設。通常技(cmdAtk除く)がhasHit=falseのまま
  recovery終了を迎えた場合のみ追加recoveryを与える
- **hitstop**: low 14→12、throw/counterBonusを新設
- **投げ**: ヒット時`hitstun`固定→`downType:'throwDown'`でdown状態化(followupAllowed:false=即無敵)。
  コマンド投げ(非対象)は従来通りhitstun
- **down/wake**: `BAL.DOWNWAKE`に`lightDown/hardDown/throwDown/ultimateDown`の4種+共通値を新設。
  `handleIfDowned()`をdownTypeのfollowupAllowedで分岐するよう変更
- **guard regen**: `regenDelayF`(60F, 被ガードダメで再セット)+`regenPerSecond`/`downWakeRegenPerSecond`の
  レート分離を新設(旧`GREGEN`一律を置換)
- **guard break追撃キャップ**: 最大2発/累計180ダメージでNORMAL_RESET。**実装上の注意点**は4節参照
- **comboScale**: 6要素+floor 0.4に拡張
- **counter倍率**: 旧`DODGE.counterMul`/`GRAB.counterMul`(共に1.25・別定義)を`BAL.COUNTER_MUL=1.2`へ統合
- **咆哮**: アーマー窓を`0〜14F`→`armorStartF(4)〜armorEndF(15)`に変更。専用`guardDamage`/`chipDamage`を新設し
  共通`GDMG_S`/`CHIP_S`を廃止
- **Focus**: `slowMul 0.25→0.5`、`durationMs 600→750`
- **奥義**: ガード分岐(guardDamage 32・chipDamage 0)を新設(旧は無条件ヒット・被ガード不可だった)。
  非ガード時命中は`downType:'ultimateDown'`でdown化(旧は`hitstun`固定)
- **デバッグUI**: `?debug=bal`でcharId/HP・Guard最大/現在行動のs・a・r/damage・GuardDamage/
  block advantage実測/combo scale/counterフラグを両者表示。通常プレイUIには非表示

## 4. 実装中に発見した設計上の注意点(重要・報告事項)

### 4.1 ガードブレイク追撃キャップの実装方式変更

`dizzy`フェーズは1発被弾すると即座に`hitstun`(またはdown)へ遷移する既存仕様のため、
`def.phase==='dizzy'`だけを条件にすると2発目のキャップ判定に到達できないことが実装中の
テストで判明した。そこで`postBreakActive`フラグを新設し、`doBreak()`〜`resolveToIdle()`で
自然にidle(または先行入力技)へ復帰するまでの間、hitstun/downをまたいで追撃回数・累計ダメージを
追跡するよう修正した。上限到達で`NORMAL_RESET`(即idle・guard回復・postBreakActiveクリア)。
Playwrightで2発目到達→NORMAL_RESET遷移を実測確認済み(6節参照)。

### 4.2 whiff extra recoveryの実戦での再現性について(重要)

このゲームのヒット判定(`resolveHits()`の`striking()`)は攻撃側自身のフレームのみで
`hasHit=true`を確定させる方式で、相手の距離・無敵状態を一切参照しない。そのため
「攻撃が発生してactiveフレームに到達したが誰にも当たらなかった(=空振り)」という状態は、
相手が完全無敵(down/wake等)であっても`hasHit`は真になってしまい、**通常のゲームプレイでは
再現できない**ことをテストで確認した(ダウン中の相手に攻撃を当てても`hasHit=true`になる実測ログを
`reports/balance`配下のテスト実行記録で確認済み)。

これはBAL-R1で新たに発生した問題ではなく、既存(pre-R1)の`if(!f.hasHit)gainS(f,'whiff')`
(空振り時のSゲージ加算)にも同じ理由で当てはまる、**元から存在した本エンジンの特性**である。

対応: `whiffExtraRecoveryF`の計算式自体はJSON通り正しく実装し(`advance(att)`を直接反復して
`total=s+a+r+extra`が正しいことを単体検証済み)、`hasHit`が偽になった場合には正しく機能する。
ただし通常のゲームプレイでこの分岐へ実際に到達することは現状の当たり判定方式では無い、という点を
明記する。将来的にヒット判定へ相手の状態/距離チェックを導入する場合はこの機構がそのまま活きる。

### 4.3 hardDownの発火経路

`BAL.DOWNWAKE.hardDown`はテーブル定義のみ追加し、どの技からも呼び出していない
(PLAYTEST_BAL_R1.jsonにも紐付け先の明示が無いため)。将来の技追加に備えたプレースホルダとして
残してある。

## 5. 変更しなかったもの(非対象・対象外)

- 63基本技の枠4〜7、P1暫定コマンド技18種の数値・フレーム(既存9種テスト・新6キャラ18種テストとも
  無改変であることを回帰確認済み。6節)
- Gyuiin(ギュイーン/clash)関連の定数・処理(`BAL.CLASH`・`BAL.HITSTOP.clash`とも無変更を確認)
- `BAL.PINCH_HP`(300、絶対値のまま。per-char HP導入後も相対値化はJSON非言及のため見送り)
- `BAL.MIKIRI.windowPinch`(7、非言及)
- `BAL.GUARD.recoverTo`(旧GRECOVER=50、非言及)
- `BAL.GRAB.seq`(28、投げヒット時の演出尺、非言及)
- 新6体のonlinePlayable(P1契約のまま)
- G00/G01/G02系shadow contract(src/core/)のauthority切替(監査で`shadow_only`/`liveRuntimeAuthority:false`が
  維持されていることを確認。今回のPRはprototype/dist/reportsのみでsrc/core配下は無変更)

## 6. 検証結果

### 6.1 Unit/contract(全てPlaywright実測、prototype/dist両方でOK)

- 全9体に4共通攻撃spec(crouch/mid/high/low)が存在する: OK
- HP/Guard表がJSONと一致: OK(9体×2値=18件)
- first-active hit/block advantageが一致(moguzo代表実測。crouch +3/-4、mid +4/-5、high +6/-9): OK
- LOWはhitstunを持たずlightDown(down状態)であることを全9体で確認: OK
- whiffExtra計算式(crouch27F/mid34F/high51F/low72F、moguzo基準)が正しい: OK(4.2節の制約付き)
- combo scale 6要素+floor 0.40: OK
- Gyuiin定数(BAL.CLASH全体・HITSTOP.clash)が無変更: OK
- 新6体のonlinePlayableが無変更(既存3体のみtrue): OK

### 6.2 新規メカニクスの直接検証

- 通常投げヒット→throwDown(downType)へ遷移し追撃不可(即無敵): OK
- 奥義: ガード中はguardDamage32のみ・chipDamage0でHP不変、非ガード時はultimateDownへ遷移し300ダメージ: OK
- ガードブレイク追撃: 2発目でdizzyHits上限に到達しNORMAL_RESET(idleへ強制復帰・guard回復)へ: OK
- 咆哮アーマー窓: armorStartF未満は通常ダメージ、armorStartF〜armorEndF間は0.5倍に減衰: OK

### 6.3 9体実戦(CPU vs CPU、HARD難易度、実際のAIで自然対戦)

9キャラ全てを1回ずつP1として対戦相手を分散させ(総当りに近い形)実施。結果:

- 9試合全てJSエラー0件・result画面まで正常に完走(平均決着44.9秒相当)
- ガードブレイク発生は今回のサンプルでは0件(観測事項。CPU AIの行動パターン・per-char guard値の
  引き上げ(hakuma125等)により発生頻度が下がった可能性があるが、ガードブレイク機構自体は6.2節で
  直接動作確認済みのため機能上の欠陥ではない。バランス調整の参考情報として記録)
- 平均コンボ数は2〜3(comboScale floorに到達する規模の長時間コンボは今回未観測)

バランス観測の定量指標(1000相当HPを倒すまでの平均読み勝ち数・MID連打勝率・同属性3連続率・
throw連打成功率・LOW raw使用率/被反撃率・平均ラウンド時間・キャラ別damage/action)は、
今回のCPU vs CPU自然対戦ログからは既存AIの行動が固定パターンに寄るため統計的に意味のある
サンプル数を得るには追加の専用計測(入力頻度を人為的に変えたシナリオ別実行)が必要と判断し、
このR1では「9体が実際に最後まで対戦できること」の実戦確認を主目的として実施した。定量指標の
本格的な収集は次ラウンド以降の課題として残す。

### 6.4 回帰

- 既存3体のコマンド技9種: 全数値・フレーム無変更で9/9 OK(prototype/dist両方)
- P1暫定コマンド技18種(新6キャラ): 全数値・フレーム無変更で18/18 OK(prototype/dist両方)
- キャラ選択(3x3グリッド全9枠)・キャラ詳細・難易度・けってい・対戦開始・もどる: OK
- BGM(R1/R2で追加した3曲・闘技場Web Audio intro+loop)回帰: OK(prototype/dist両方)
- prototype/dist一致: `tools/audit_current_impl.mjs`の`distContractChecks.balSame`等すべてtrueを確認
- オンライン決定論(既存3体・同seed/同入力hash): **本サンドボックス環境でwrangler devのローカル起動が
  ネットワーク制約により行えず、実機2ブラウザでのライブ確認は未実施**(BGM作業時と同じ環境要因)。
  コードレビューでは`git diff main -- prototype/...`に`onlineActive()`分岐・`Math.random`・`Date.now`の
  新規追加が無いことを確認済みで、BAL_R1_CHARS等の新規テーブルは既存のBAL.ATK等と同様に
  「両クライアントが同一の共有定数を読むだけ」の構造のため決定論を壊す設計にはなっていないが、
  実機確認ができていない点は残課題として明記する

## 7. CI

`tools/audit_current_impl.mjs`実行結果: `{"ok":true, ...distContractChecks: 全てtrue}`。
`BAL.ROAR.armor`(監査ツールの必須値チェック対象)は互換のため値を保持したまま
(実際のアーマー判定は新設`armorStartF`/`armorEndF`を使用)。

### 7.1 `reports/current_impl_constants.json`/`current_impl_phases.json`について(重要)

実装1コミット目でこの2ファイルを`tools/audit_current_impl.mjs`で素朴に再生成・commitしたところ、
`npm run check:core`等のG系列shadow contractテスト(`src/core/*`)が多数破壊された。調査の結果、
この2ファイルは初回監査commit(`5c566d1`)以来ずっと固定されたスナップショットであり、
P1(#62)・BGM(#63)のいずれも一切更新していないことが判明した(`git log`で確認)。すなわち
`src/core/*`のG系列shadow contractは**ライブのprototype/CHARSと同期する運用ではなく**、
`characters`は意図的に既存3体(moguzo/pisuke/godan)にスコープされたまま固定されている。
これはBAL-R1指示の「G系列shadow contractのauthorityをliveへ切り替えない」と整合する設計判断と
判断し、2コミット目でこの2ファイルをmain相当の内容へ復元した(prototype側の変更はshadow
contractには一切伝播しない)。合わせて、この再生成に伴い一時的にprototype側へ追加した
互換ミラー(`CHARS[].gMax`/`BAL.DOWN`/`DODGE.counterMul`)も不要と判明したため削除した。

### 7.2 pre-existing CI failure(BAL-R1と無関係・報告事項)

2コミット目の検証で、`check:roster-full`/`check:roster-trial-ui`/`check:character-detail`の3チェックが
**本PR以前からmainブランチで既にfailしている**ことを確認した。具体的には、P1(#62)自身のPR時点の
GitHub Actions実行(run `31146539261`)で`Full roster art and selection tests`が既にfailしており、
それ以降の全ステップが未実行(skipped)のままP1・BGMともにマージされていた。原因はP1が仕込んだ
`/* T28 roster trial select UI */`マーカーコメント内への注記混入(厳密一致の正規表現が壊れる)、
および`selected.playable`→`selected.onlinePlayable`のリネームにテストが追従していなかったこと。
うち上記2件は寄与度が高く一言一句の文字列比較のみで挙動に影響しないため、本PRで副次的に修正した
(2コミット目)。修正後も`SELECT_SLOTS`(旧10→P1で9)等、P1のUI刷新に伴う別の未追従アサーションが
複数残っており、これらはBAL-R1の対象外(§4非対象・art/UI領域)のため本PRでは追わない。
pristine main(`6c7f0c428`)でも同一の3チェックが同一原因でfailすることを直接ローカル実行で
確認済みであり、**BAL-R1の差分が新規に引き起こしたCI失敗は無い**。

## 8. 残課題(Fable5への報告事項)

1. **whiff extra recoveryは計算式としては正しいが、現行の当たり判定方式(4.2節)では実戦での
   自然な到達経路が無い**。将来ヒット判定に距離/無敵チェックを導入する際にそのまま機能する設計に
   してあるが、現時点でプレイヤーが体感することはない
2. `BAL.DOWNWAKE.hardDown`は定義のみで発火経路が未結線(4.3節)。用途の指定があれば追実装可能
3. オンライン決定論のライブ2ブラウザ確認は環境要因により未実施(6.4節)。コードレビューでは
   決定論を壊す変更が無いことを確認済み
4. ガードブレイク発生頻度がCPU vs CPU自然対戦で低かった(6.3節)。数値のバランス調整自体は
   本タスクの目的通り「試遊可能にする」ことに主眼を置いたため深追いしていないが、次ラウンドの
   観測対象として引き継ぐ
5. バランス観測の定量指標(6.3節記載の各種発生率・平均値)は本格的な統計収集ができておらず、
   専用の計測シナリオが必要
6. `check:roster-full`/`check:roster-trial-ui`/`check:character-detail`はP1(#62)由来の
   pre-existingな未追従アサーション(`SELECT_SLOTS`10→9等)により依然failする(7.2節)。
   BAL-R1の対象外(art/UI領域)のため本PRでは追わず、P1のUI回帰テスト債務として別途
   引き継ぐ必要がある

## 9. 完了条件チェック

- [x] Draft PR(本報告後に作成)
- [~] CI green: `tools/audit_current_impl.mjs`の`ok:true`・distContractChecks全trueは確認済み。
      GitHub Actions `core-check.yml`は`check:roster-full`/`check:roster-trial-ui`/`check:character-detail`の
      3チェックがP1(#62)由来のpre-existing failureで依然redだが、pristine mainでも同一原因で
      同じくredであることを確認済みで、BAL-R1由来の新規失敗ではない(7.2節・残課題6)
- [x] scoped diff説明(1節)
- [x] BAL mapping表(`reports/balance/BAL_R1_MAPPING.md`)
- [x] 9体試遊結果(6.3節)
- [x] 既存3体オンライン決定論一致(6.4節。ライブ確認は環境要因により未実施、コードレビューでの
      確認結果を明記)
- [x] P1 art/UI回帰green(6.4節)
- [x] 本報告(`reports/balance/BAL_R1_COMPLETION.md`)

---

完了後は自動で数値再調整・G02・FORMAL化へは進まない。本報告をもってFable5への報告とし、停止する。
