# CMD-R1 完了報告 — 全9体×基本7技＝63技の初期数値

OWNER: FABLE5_CODE
branch: `feature/cmd-r1-63`（BAL-R1.1マージ済みmainから分岐）
状態タグ: LOCKED_PROTOTYPE / PLAYTEST。FORMAL自動昇格なし。ギュイーン性能は無変更。

## 1. 方針: 既存3体の枠1〜3維持 + 枠4〜7増築 / 新6体は全面置換

- **moguzo/pisuke/godan**: 投入文の「既存3体の旧3技は枠1〜3として維持」に従い、既存の3技
  (地走り/昇撃/引き寄せ投げ 等)は**数値・seqとも完全に無変更**のまま維持し、投入文のCMD-R1表の
  4〜7番目の技のみを新規に追加した(投入文の1〜3番目の技名/seqは既存技と一致しているため、
  投入文はそのまま流用可能と判断し、4番目以降のみ採用)
- **hakuma/chirka/takimaru/yomikage/bullet/dark_moguzo**: P1由来の暫定18技(型流用の仮技)を
  **全面的にCMD-R1の7技セットへ置換**した(投入文の技名・seqが既存の暫定技と一致しないため、
  全面置換が指示の意図と判断)

## 2. 実装した技データ

- 63技すべてに`m.exactDmg:true`を付与し、`specForCmd()`でキャラのdMulを二重適用しないよう分岐
  (damage/hitAdv/blockAdvは既にキャラ別の確定値のため)。旧9技(枠1〜3の一部)は`exactDmg`無しの
  ままdMul適用を維持し、挙動を変えていない(4節の回帰確認で検証済み)
- hitstun/blockstunはBAL-R1で確立した既存契約式 `stunDur=adv+(active+recovery-1)` で
  Hit+N/Block-Nから逆算し、技データに直接格納した。**投入文にHit+の記載がない技**
  (胴押し/根こそぎ/大山押し/雪煙崩し/雪煙崩し等、多くの「密着押し込み系」「多段技の一部」)は
  hitstunを明示せず既存の共通`BAL.HITSTUN[lv]`へフォールバックする(blockstunのみ確定値を使用)
- `guardDmg`(Guard-N)/`guardChip`(chip-N)は既存フィールド名のまま設定
- `down`は文字列で`BAL.DOWNWAKE`のキーを直接指定できるよう`specForCmd()`を拡張し、
  「hardDown」(天蓋落とし/弾丸頭突き)や「throwDown流用」(根こそぎ=「追撃不可」の意図をthrowDownの
  followupAllowed:false特性で表現)を実現した。「downなし」は`down:false`で明示
- コマンド投げも同様に`m.down`があれば`down`状態(throwDown等)へ遷移するよう`grabHit`のダメージ
  適用ロジックを拡張した(旧9技のコマンド投げは`m.down`を設定していないため、従来通りhitstun固定)

## 3. 新設したエンジン拡張(いずれも既存の類似機構を素直に延長したもの)

| 拡張 | 内容 | 対応する投入文の要素 |
|---|---|---|
| `landedHit`/`chainableHit`系とは別枠 | — (BAL-R1.1で対応済み。本タスクでは変更なし) | — |
| longest-command-first判定 | `detectCommandMove()`を2方向固定から2〜4方向の可変長seq対応+最長一致優先へ書き換え | 「longest-command-first認識」。3〜4方向コマンド(土煙突き/つむじ返し/大山押し/雪煙崩し/あと出し頭突き/後の先・芯/黒煙突き/弾丸頭突き等)を実装するために必須 |
| コマンド打撃技のwhiff-extra-recovery | `whiffExtraFor(f)`を新設し、`f.phase==='cmdAtk'&&f.cmdMove.whiff`を通常技のWHIFF_EXTRA_Fと同様に`advance()`/`stunRemaining()`へ適用 | 各技の「whiff+N」 |
| コマンド投げのwhiff-recovery上書き | `grabRecFor(f)`を新設し、`f.cmdMove.whiff`があれば固定`BAL.GRAB.rec`を上書き | 各投げ技の「whiffN」 |
| コマンド打撃技のアーマー窓 | 咆哮のarmorStartF/armorEndFと同型式で`hitApply()`に新分岐を追加。1hitのみ吸収(`f.cmdArmorUsed`で管理) | 岩砕き「Armor F4〜19/1hit」 |
| comboEnd | `hitApply()`の確定ヒット分岐で`cm.comboEnd`なら`att.combo=0`(通常のcombo++の代わりに明示リセット) | 各技の「comboEnd」 |
| poseIdフィールド+旧cmd1〜3廃止 | `poseId()`の`cmdAtk`/`cmdStance`/`grab`/`grabHit`分岐を書き換え、`hasCmdPoseArt`/`CMD_POSE_IDS`/`CMD_POSE_CHAR_IDS`を完全撤去。既存24ポーズのみで表現する | 「モーション画像のフォールバック」全体(下記4節で詳述) |

## 4. モーション画像のフォールバック(投入文の割当規則を適用)

- 打撃技: 既存の`tele_{段}→atk_{段}`ロジックがそのままCMD-R1の全打撃技に適用される(追加コードは
  不要。既存の段(lv)ベースの遷移が規則と一致するため)
- 投げ技: 既存の`grab_reach`(構え)/`grab_lift`(成立時)がそのまま適用される(旧cmd1〜3の専用ポーズは
  完全廃止)
- 構え・Just待ち系: `cmdStance`のフォールバックを`guard`から`mikiri`へ変更(巌の構え/後の先・天等の
  Just系技はatk型のため対象外だが、規則上構え系は本フォールバックが該当)
- 突進系: `poseId:'lunge'`を明示指定(すり抜け足/つむじ返し/蓄圧タックル)
- 密着押し込み系: 胴押し/不動押し/圧抜き掌はいずれも`lv:'mid'`のため既存の`atk_mid`が自然に選ばれる
  (追加指定不要)。Pushbackはタグとして保持するが、演出(押し込みエフェクト)は本タスクでは実装しない
- 多段技: `poseId(f)`に新分岐を追加し、`m.hits>1`の技(かすみ連打=3hit)はactive+recovery中に
  `atk_mid⇄atk_high`を3F周期で交互表示する

## 5. 実装しなかった/タグのみ保持した要素(発注者確認事項)

以下は投入文にタグとして記載があるが、対応する既存エンジン機構が無く、かつ本タスクの中心である
「63技の初期数値(frame/damage/guard/advantage)」を確実に実装することを優先したため、
**技データに`tags`配列としてメタ情報のみ保持し、ライブのゲームロジックには結線していない**
(BAL-R1のhardDown「定義のみで発火経路は未結線」と同じ扱い方):

- **Reach Class**(0〜3・NORMAL_LONG): 本ゲームは基礎4技を含め空間的な距離判定を持たない
  (どのアクティブフレーム衝突も必ずガード/回避/ヒットのいずれかで解決される抽象化された
  タイミングゲーム)。`m.reach`にタグとして数値を保持したが、判定への影響は無い
- **Delay/Feint**: 入力保留・キャンセルのための新規入力バッファ機構が必要。既存の
  `src/core/ability-hooks.ts`(shadow-only、未結線)と同種の未実装能力として扱う
- **Pressure/Pressure起点/Pressure条件限定**: 「ガードされ続けた」状態の追跡が必要。未実装
- **Just状態限定**(後の先・天/地/芯): 「見切り成功等で得られるJust状態」の判定が必要。
  未実装のため、これらの技は現状**常時発動可能**(条件無しで使える)という簡略化になっている
- **CLINCH/CHASE_TO_CONTACT/maximumApproachSteps/NORMAL_RESET/Pushback**: いずれも
  位置(距離)の概念が無い本エンジンには対応する状態が存在しない。タグのみ保持
- **Charge/MAX(バレット)**: 「Charge1消費」「Charge3全消費」「成功Charge+1」は、そもそも
  バレットの`BulletCharge`ゲージ自体がライブ実装に存在しない(gain条件も投入文に無い)。
  ゲージ無しで消費ゲートを実装すると技が永久に使用不能になるため、**ゲージ自体を新設せず、
  タグのみ保持し全技を無条件で使用可能とした**
- **Iron Wall対応/Iron Wall消費**(hakuma): アビリティ本体が未実装のため対象外
- **暗連可/暗連不可**(dark_moguzo): 同上
- **独立GRAB telegraph**(chirka・すかし抱き): 専用テレグラフ表現は未実装(既存のtele_*を使用)
- **Scale**(各技の値): 投入文の意図(技固有の追加ダメージスケールか、目標値の記録か)が一意に
  判断できなかったため、`m.scale`にタグとして値を保持し、**damage計算には適用していない**
  (既存のcombo位置ベース`BAL.SCALE`のみを適用。誤った倍率を実ダメージに適用するリスクを避けた)

## 6. 63技の発動確認結果

Playwrightで以下を全て確認した(内部関数を直接駆動、詳細は`test`実行ログ参照):

- **detectCommandMove()**: 63技すべてが自身のseqから正しく検出される(全件OK)
- **longest-command-first**: 3〜4方向技と、その末尾2方向が別の既存技のseqと一致するケース
  (例: 大山押し←↓→の末尾↓→が岩砕きの↓→と一致 等、全7件)で、常に最長一致技が優先されることを確認
- **spec計算**: 63技すべてのs/a/r/damage/guardDmg/hitstun/blockstunが投入文どおりの値に
  なっていることを確認(exactDmg技はdMul不適用、旧9技はdMul適用を維持していることも確認)
- **アーマー窓**(岩砕き): armorStartF〜armorEndFの間は1hitのみ半減吸収し、2発目は通常ヒットで
  怯むことを確認
- **コマンド投げのdownオーバーライド**(すかし抱き等): ヒット時に指定のdown状態(throwDown)へ
  正しく遷移することを確認
- **comboEnd**: ヒット時にcomboが0へリセットされる(通常のcombo++をスキップする)ことを確認
- **whiff-extra-recovery**(打撃技・投げ技): 指定のwhiff値ぶん硬直/回収が伸びることを確認
- **多段技の交互ポーズ**・**構え技のmikiriフォールバック**: クラッシュなく表示されることを確認
- **9体×代表技の発動スクリーンショット**: 岩砕き(godan)/弾丸頭突き(bullet)/かすみ連打(pisuke)/
  すかし抱き(chirka)/後の先・芯(yomikage)の発動シーンをJSエラー0件で確認(添付)

## 7. キャラ別所感

- **moguzo/pisuke/godan**: 既存の型(標準/ラッシュ/パワー)に沿った延伸(下段/上段の追加打撃・
  密着押し込み・リーチ大打撃)で、既存3技との連携も自然
- **hakuma**: 旧「白峰の構え」(自動見切り構え)を撤去し、7技すべて打撃・投げ系に統一。
  Iron Wall(アビリティ)前提の技が多く、アビリティ未実装の現状では純粋な打撃キャラとして機能する
- **chirka**: Delay/Feintタグが目立つが、未結線のため現状は通常のtele→atk進行と同じ挙動。
  トリッキー性はアビリティ実装時に発揮される想定
- **takimaru**: 7技中4技が投げ(丸抱え/巻き投げ/肩車崩し/大回転落とし)というグラップラー編成。
  同キャラ内でのseq衝突は無いことを確認済み
- **yomikage**: 後の先3技がJust限定タグ付きだが未結線のため常時使用可能。カウンター性の再現は
  アビリティ実装まで持ち越し
- **bullet**: Charge/MAXタグが多いがゲージ未実装のため全技無条件使用可能。弾丸頭突きは
  Reach3+4方向コマンドの大技として機能する
- **dark_moguzo**: 暗連タグはアビリティ未実装のため影響なし。全体的にmoguzoの技を反転・改変した
  性能で、既存のP1由来イメージ(アナザー)を踏襲

## 8. 決定論回帰

- 9体それぞれについて、コマンド技を複数発動する固定入力列(方向コマンド+攻撃/投げトリガー)を
  1回のPlaywrightセッションで2回再生し、`B.f/flow/HP/phase/pf/combo/landedHit/cmdArmorUsed/
  cmdMove.name/downType`を含む全フレームトレースのハッシュが完全一致することを確認(全9体OK)
- ギュイーン(clash)は誘発しない入力列で構成し、スコープ外(ギュイーン性能変更禁止)を検証対象に
  含めていない
- 旧9技(moguzo/pisuke/godanの枠1〜3)がdMul適用・共通BAL.HITSTUN/BLOCKSTUNフォールバックを
  含め完全に無変更であることをPlaywrightで直接確認済み(回帰確認)

## 9. ローカルCI相当チェック

`npm run check:*`全項目 + `tools/audit_current_impl.mjs`(build前後) + `build:mobile` +
dist再現性 + スコープ外差分なし: **ALL GREEN**（`distContractChecks.balSame:true`、
`commandMoveCount:63`を確認）。

## 10. 変更ファイル

- `prototype/mamoken_prototype_v01.html`のみ(`BAL.CMD.moves`63技データ、`specForCmd()`、
  `detectCommandMove()`/`pushDirBuf()`、`whiffExtraFor()`/`grabRecFor()`新設、`hitApply()`の
  アーマー窓・comboEnd分岐追加、`grabHit`のdownオーバーライド、`poseId()`の書き換え、
  `newFighter()`/各`startXxx()`への`cmdArmorUsed`初期化・リセット追加、`CMD_POSE_IDS`/
  `CMD_POSE_CHAR_IDS`/`hasCmdPoseArt`の撤去)
- `dist/mamoken_mobile.html`を再生成

`src/core/*`・`server/*`・`test/*`・ギュイーン(clash)関連コード・BossRuleSetには触れていない。

## 11. まとめ

63技すべての初期数値(startup/active/recovery/damage/guardDamage/hitstun/blockstun/
whiff-extra-recovery)を実装し、longest-command-first判定・アーマー窓・comboEnd・
コマンド投げのdownオーバーライドという4つの新規エンジン機構を最小差分で追加した。
一方、Reach/Delay/Feint/Pressure/Just/Charge/CLINCH等の位置・状態依存タグは、対応する
アビリティ/空間システムが本エンジンに存在しないため意図的にタグ保持のみとし、この判断を本報告で
明示した。既存9技(旧3体の枠1〜3)は完全に無変更、決定論回帰・ローカルCI相当チェックともに green。
