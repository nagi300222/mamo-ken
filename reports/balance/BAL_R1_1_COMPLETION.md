# BAL-R1.1 完了報告 — GAP／割り込み契約の修正

OWNER: FABLE5_CODE
branch: `feature/bal-r1-1-gap`（BAL-R1マージ済みmainから分岐）
状態タグ: LOCKED_PROTOTYPE / PLAYTEST_RUNTIME。FORMAL自動昇格なし。ギュイーン(clash)は無変更。

## 1. 目的

「1Fでもhitstun/blockstunが切れればコンボ／連続ガードは終了する」という基準を維持しつつ、
1F GAPが即・万能脱出にならないよう防御行動の効果発生Fを調整する(投入文のGAP帯定義に沿う)。

## 2. 監査結果: 既存実装とGAP契約の対比

投入文のGAP帯・防御行動の効果発生Fを実コードと照合した結果、以下は**既に契約どおり**だった
(数値変更不要、対応済みとして確認のみ実施):

| 防御/攻撃行動 | 契約上の効果発生F | 実コード | 判定 |
|---|---|---|---|
| Guard | F1 | `applyInputs()`: `idle&&held`の同フレームで`phase='guard'`即時遷移 | 一致(変更不要) |
| 通常打撃 | キャラ固有startup | `BAL_R1_CHARS[charId][lv].s`(per-char) | 一致(変更不要) |
| 通常投げ | 12F | `BAL.GRAB.s:12` | 一致(変更不要) |
| 咆哮 | attack 17F / armor F4〜 | `BAL.ROAR.s:17`, `armorStartF:4` | 一致(変更不要) |

GAP帯の4-7F(アーマー)/8-11F(高速通常技)/12F+(通常技・投げ)も、上記の既存数値(armorStartF:4,
GRAB.s:12等)がそのまま境界値に一致しており、追加のコード変更は不要と判断した。

## 3. 実施した変更(2件)

### 3.1 回避(CROUCH/SWAY/LUNGE)の効果発生をF1→F2へ

`dodgeActive()`(判定関数)の窓を`pf>=1`→`pf>=2`に変更(投入文の明示指示「dodge active F1〜10
はF2〜10へ変更する」に対応)。1F目は入力受付のみで無防備のまま推移し、2F目から回避が有効になる。
これにより GAP=1F では回避が間に合わずガードのみ有効、GAP=2F以上で回避が有効、という契約どおりの
挙動になる(4節の検証で確認)。`BAL.DODGE.judgeF`/`totalF`自体の数値は変更していない
(境界の起点だけを1F後ろへ)。

### 3.2 chain(通常技の連打継続)を確定ヒット時のみに限定

監査で発見した既存バグ: `resolveHits()`は攻撃側の`hasHit`を「activeウィンドウで解決を試みた
(ガード/回避された場合も含む)」の意味で`true`にしていたが、`canChain()`はこの`hasHit`を
「HITした」の意味で流用してチェーン可否を判定していた。結果、**ガードされた場合や回避された場合
でも次のチェーン技(中→上→下)が発動可能**になっていた(投入文の要求
「BLOCK: 通常chain cancel不可」「ガードされた時点で通常攻撃連打のターン継続は終了する」に違反)。

修正: 新設フィールド`f.landedHit`を追加し、`hitApply()`内の確定ヒット分岐
(`att.combo++`と同じ箇所)でのみ`true`にする(ガード/回避/アーマー吸収では立たない)。
`canChain()`のゲートを`!f.hasHit`→`!f.landedHit`に変更。`hasHit`自体は既存の空振り判定
(`WHIFF_EXTRA_F`)・再解決防止用途のまま変更していない。

`f.landedHit`は`hasHit`と同じ全リセット箇所(`startAtk`/`startCrouchAtk`/`startCmdAtk`/
`startCmdGrab`/`startCmdStance`/`startDodge`/咆哮開始/`roundInit`/通常投げ開始)で
一律`false`に戻すよう追従させた。

### 3.3 MIKIRIについて(変更なし)

「MIKIRI有効: F2」との対応関係を検討したが、MIKIRIは既存実装上、フェーズ遷移を持たない
"入力の瞬間に相手のpfとの相対窓(±5F、ピンチ時±7F)で即時判定"する反応型の仕組みであり、
単純な"自分の経過F"に対する効果発生Fという概念が存在しない。この生成的な猶予窓は既にF2相当の
反応余裕を十分に含んでおり、コード変更の必要はないと判断した(投入文に具体的な変更指示がないため
非対象として扱う)。

## 4. GAP挙動の検証結果(Playwright、内部関数を直接駆動)

`resolveHits()`/`canChain()`/`dodgeActive()`を実際のB.p状態を構築して直接駆動し、以下すべてを確認:

| ケース | 期待 | 結果 |
|---|---|---|
| `dodgeActive({pf:1})` | false(旧仕様ではtrue) | OK |
| `dodgeActive({pf:2})` | true | OK |
| `dodgeActive({pf:10})` | true | OK |
| `dodgeActive({pf:11})` | false | OK |
| GAP=1F相当(sway回避側pf=1でmid攻撃を受ける) | 回避間に合わずヒットが通る | OK(hp減少) |
| GAP=2F相当(同上、pf=2) | 回避成立(ノーダメ+counterReady) | OK |
| midがガードされた直後 | `hasHit=true`(解決は試みた)だが`landedHit=false` | OK |
| ガード後、chain窓内で`canChain(f,'high')` | false(連打継続不可) | OK |
| midが確定ヒット(素立ちに命中) | `landedHit=true` | OK |
| 確定ヒット後、chain窓内で`canChain(f,'high'/'low')` | true(軽→重ルート) | OK |
| 確定ヒット後、`canChain(f,'mid')`(同レベル) | false(same move不可) | OK |

## 5. 決定論回帰

ギュイーン(clash)にはBAL-R1.1のスコープが一切及ばない(投入文「ギュイーン変更禁止」)ため、
本タスクの変更が影響する範囲(通常技のヒット/ガード/回避/chain解決)に限定した決定論検証を実施した。

- 片側のみが入力する固定入力列(mid/high/low連打+dodge+chain)を1200F分、フレッシュページから
  2回再生し、`B.f/flow/HP/guard/phase/pf/combo/landedHit/dodgeType`の全フレームトレースの
  ハッシュが完全一致することを確認(`aiStep`を明示的に無効化し、両者とも決定論的な明示コマンド列
  のみで駆動=オンラインlockstepと同じ入力駆動方式)
- 両側が独立した入力列(P1=mid中心、P2=high/low中心)で相互に攻撃・回避しあう1200F分のシナリオも
  同様に2回再生してハッシュ一致を確認(KOまで到達、`landedHit`を含む全フレームが完全一致)
- 上記いずれも同atkLv完全同時ヒット(ギュイーン誘発条件)を意図的に避けて構成しており、
  「ギュイーン変更禁止」のスコープを検証対象に含めていない
- 実機2ブラウザでのオンラインwrangler dev接続確認は本サンドボックス環境では実施不可
  (BAL-R1と同じ環境制約)。コードレビューでは、今回の変更(`dodgeActive()`の境界値変更、
  `landedHit`フィールドの追加とその参照)にMath.random/Date.now/performance.now等の
  非決定的APIは一切含まれておらず、両クライアントが同一の`B`状態から独立に同じ計算を行う
  既存の決定論構造を壊す変更ではないことを確認済み

## 6. ローカルCI相当チェック

`npm run check:*`全項目 + `tools/audit_current_impl.mjs`(build前後) + `build:mobile` +
dist再現性 + スコープ外差分なし: **ALL GREEN**（`distContractChecks.balSame:true`を含む、
BAL自体の数値は無変更であることを確認）。

## 7. 変更ファイル

- `prototype/mamoken_prototype_v01.html`のみ(`BAL.DODGE`コメント更新、`dodgeActive()`、
  `canChain()`、`hitApply()`、`newFighter()`および各`startXxx()`/`roundInit()`の
  `landedHit`初期化・リセット箇所)
- `dist/mamoken_mobile.html`を再生成

`src/core/*`・`server/*`・`test/*`・アセット・UI表示には触れていない。BAL数値
(`DODGE.judgeF/totalF`等)自体は無変更(境界チェックの起点のみ変更)。

## 8. まとめ

投入文のGAP帯契約のうち、既存実装が既に満たしていた項目(Guard F1、通常打撃/投げ/咆哮の既存
startup/armor窓)は変更なしで確認のみとし、明示的な変更指示(回避F1→F2)と監査で発見した契約違反
(ブロック/回避時のchain継続バグ)の2点のみを最小差分で修正した。決定論回帰・ローカルCI相当チェック
ともに green。
