# P3 モーション独立QA — 7f79ea2（候補・未採用）

制作正本: Claude Draft PR216 `7f79ea252d6f5c08de892bd11c0e85845a91af14`。このQAは読み取りと検査器追加のみ。P2パーツ生成・既存GLB・元77アセット・production承認moduleを変更していない。

## 現時点の結論

**構造は54本とも成立するが、接触メタデータをそのまま採用できない。** 最新JSONは54/54 status=okであり、READMEの50ok/4fixは古い。しかし独立の正確時刻CPUスキン再評価では20技に1.5cmを超えるreachまたはheight差がある。WebGLでの最終再現を別検査器へ実装した。

- 地上36技の全フレームで、足/爪に最も強く結合する実メッシュ頂点を追跡した。F0から1.2cmを超えて沈むものは0。絶対最下点は約−0.00673m。これはCPU線形スキニングの計算で、WebGL/目視/実機の合格認証ではない。
- 54本の元リグ名、6clip/体、有限キー・単位quaternion、60Hz時刻/尺、animation proxyだけで元メッシュなし、元77assetのGit blob一致をNodeで確認した（2tests成功）。
- 左右反転、実ゲームの発生/持続フレーム同期、GPU表示、足の滑りの美的評価はこのCPUレポート単独では未認証。

## 接触表の問題

作者の`tools/contacts_v17.mjs`は正規化時刻のN40サンプル曲線を線形補間する。手付けの鋭い接触/保持がその間にあると、正確な接触フレームの表面より短くなる。例えばゴダン立強の接触F21/54は0.60635mだが表のphase0は0.561m。phase0.5では0.606mと一致する。接触時刻そのものを直接サンプルし直す必要がある。

もう一つは**空中の負のローカル打点をゼロへ丸める問題**。バレット空強の尾はroot基準でphase0 −0.07250m、phase0.5 −0.16210m、phase1 −0.16974m。作者の生audit曲線にも負値があるが、生成器は`Math.max(0,height)`で0にする。実際の打点はfighter.yを加えた高さなので、空中のsigned offsetと地上の床侵入を分ける必要がある。元の演技を上げて帳尻を合わせると技の意図が変わるため、契約修正・実測・本人採否を別扱いにする。

### 独立CPU計算で1.5cmを超えた技

| キャラ/技 | 最大reach差 cm | 最大height差 cm |
|---|---:|---:|
| moguzo/stand_heavy | 3.027 | 0.397 |
| moguzo/crouch_heavy | 1.788 | 0.446 |
| pisuke/stand_heavy | 1.674 | 1.597 |
| pisuke/crouch_heavy | 1.943 | 0.364 |
| godan/stand_heavy | 4.535 | 3.675 |
| godan/crouch_heavy | 1.638 | 0.452 |
| godan/air_weak | 0.581 | 2.005 |
| godan/air_heavy | 1.043 | 2.424 |
| hakuma/crouch_heavy | 0.877 | 1.771 |
| hakuma/air_heavy | 0.736 | 2.063 |
| chirka/stand_heavy | 1.535 | 0.575 |
| chirka/air_heavy | 4.353 | 7.212 |
| takimaru/stand_heavy | 0.532 | 1.897 |
| takimaru/crouch_heavy | 0.773 | 4.429 |
| takimaru/air_heavy | 0.867 | 2.307 |
| yomikage/stand_heavy | 4.267 | 1.846 |
| yomikage/air_heavy | 0.752 | 2.948 |
| bullet/air_heavy | 0.346 | 16.974 |
| dark_moguzo/crouch_heavy | 1.801 | 0.957 |
| dark_moguzo/air_weak | 1.608 | 0.634 |

### 作り直された必殺3本の補助チェック

- ゴダンs3: 正確な接触表面body reach0.38925m、高さ0.26444m。表phase0のreach0.365mとの差2.425cm。mid/endは一致。足表面F0比−1.154cmで1.2cm基準の境界近く。
- チルカs3: armR reach0.49413m、高さ0.22218m。表0.494/0.222mと0.2mm以内。足表面F0比−0.352cm。
- ダークs1: armR reach0.41442m、高さ0.23406m。表0.390/0.218mとの差2.442/1.606cm。足表面F0比−0.083cm。

これらもCPU計算。専用必殺の実WebGLはspecial担当の検査器へ引き継ぐ。

## 再現手順

```sh
node --test exp/fable-3d/motion/v17/qa/motion-structure.test.mjs
python exp/fable-3d/motion/v17/qa/independent_skin_audit.py --out /tmp/mamoken-p3-skin.json
# Pythonの独立評価はnumpy2.3.5で実施。Blender/モデル生成器は起動しない。
```

実WebGL（rootのP3 provider統合ツリーで実行）:

```sh
node exp/fable-3d/dojo/server.mjs
NODE_PATH=/path/to/playwright-core CHROMIUM_PATH=/usr/bin/google-chrome \
  MAMOKEN_EVIDENCE=/tmp/mamoken-p3-exact \
  node exp/fable-3d/motion/v17/qa/independent-motion-browser.mjs
```

このページ内だけ`normal-contact-overrides-p3.js`のレスポンスを完全な候補へ差し替え、ゲーム本体のprovider/actor/clockを通す。productionの承認値nullはそのまま。実際のBattle.startupから持続の最終Fまで**各activeフレーム**を通し、source時刻・weight・Battleのreach/heightと実スキンを比較する。直接サンプルでもphase=i/(active−1)の全点に0/.5/1を加え、左右反転、全地上フレームの足表面を検査する。三点間の補間が途中フレームを外す場合も失敗させる。

`independent-exact-report.json`と`independent-exact-contacts.json`を先に保存してから、誤差があればCIを失敗させる。`MAMOKEN_QA_IDS=godan,chirka,bullet`で対象を絞れる。

独立測定した表を**明示候補**として同じ実Battleへ戻す場合だけ、次を指定する。無指定時は作者のJSONを使う。入力表のパス・SHA256、metadata/9packのSHA256をレポートへ保存し、productionの承認moduleがnullであることをファイルから確認する。候補を自動承認する処理はない。

```sh
MAMOKEN_NORMAL_CONTACTS=/tmp/previous-run/independent-exact-contacts.json \
  node exp/fable-3d/motion/v17/qa/independent-motion-browser.mjs
```

生のcharacter mapと`{characters: ...}`形式の候補deliveryを受け付ける。再検査でも全active実フレーム・左右・足接地を通し、右向き/左向きの立強・空強PNGを保存する。`MAMOKEN_QA_REPORT_ONLY=1`は調査専用で、差分が残っても出力を収集するモード。**成功ゲートの代わりに使わない。**

## 未認証/次のゲート

- 正確時刻のWebGL測定を作者の素材と同期し、signed空中height対応後に54技/左右/フレームを再検証する。
- 既存通常54と比較した実時間動画・関節貫通/足滑り・技の魅力の目視評価。
- 別骨格・任意パーツの互換（P2）は実装していない。
- iPhoneのFPS/熱/タッチと最終採否は未検証。
- 通常provider/必殺providerのglobalapprovalは未設定のまま。CIが通る前に採用済みと記録しない。


## exact battleActive表（0ce6b852以降）の比較方針

作者の新しい表は、実Battleの`i/(active−1)`全フレームを直接測定する。active=2の場合はphase0/1の2点で足り、実Battleで発生しないphase0.5を必須にしない。

検査器は実activeフレームすべてで1.5cmのstrict比較を維持する。直接sourceサンプルでは追加0.5も記録するが、そのphaseに作者の実測referenceが存在せず、実Battleフレームでもない場合だけ、補間expectedとの差をdiagnosticに分ける。明示referenceがある点と実Battleの全フレームは常にstrict。実フレームのreference欠落は一致して見えても失敗にする。

左右・先行部位は追加点も含む全source sampleで検査し、足接地は全地上フレームを維持する。`report.records[].exact`と候補出力の`activeReach`には追加点も省略せず保存する。候補出力は実測時の`battleActive`を明記する。diagnosticへの分離はglobal承認や品質合格を意味しない。
