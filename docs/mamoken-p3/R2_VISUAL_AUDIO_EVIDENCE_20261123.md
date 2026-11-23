# P3 R2：実3D画像と打撃音の独立確認

対象は[Actions 45140810584](https://github.com/nagi300222/mamo-ken/actions/runs/45140810584)、ソース`8e98299c0b645c1defbe6967bdb144a7a95eb0ca`。実装担当とは別に、GitHubの原artifactを取得し、PNG・JSON・WAVを確認した。この文書は初回R2実行の証拠で、他ジョブや後続修正を一括して合格にするものではない。

| 原artifact | 検証ジョブ | ダウンロード後に照合したZIP SHA256 |
| --- | --- | --- |
| [motion 14801982314](https://github.com/nagi300222/mamo-ken/actions/runs/45140810584/artifacts/14801982314) | `137578040957`、成功 | `cb157eeed336b67d8f787e576c48f73c84091f7aa97de1006a0e630f1114e77e` |
| [feedback 14801922072](https://github.com/nagi300222/mamo-ken/actions/runs/45140810584/artifacts/14801922072) | `137578040826`、成功 | `58f41e05dd512769f0d5a324d3f24c907801d7d93a932252fb2babc30774296d` |

## R2通常技：画像と接触面

motion artifactには9体の立強・空強を両向きで保存した原PNG36枚と、実道場の元リグを使う`independent-exact-report.json`がある。右向きは全9体の立強・空強18枚、左向きはゴダン・チルカ・バレットの立強・空強6枚を目視した。原画像の加工はしていない。

画像ではピスケの足による横への蹴り、ハクマの両掌、ゴダンの前傾打撃と空中で横倒しになる姿勢、チルカの低い姿勢からの爪、タキマルの身体を丸める空中姿勢、バレットの前へ伸びる尾を確認した。これは接触時点の実描画確認で、全予備動作・軌道・戻りの動画レビューや、全9体の個性に対する本人の最終評価とは区別する。

JSONを独立集計した結果：

- 54通常技、実Battle時点の厳密比較211点。`failures:[]`、`errors:[]`。
- 接触面の設定値との最大差：reach約0.04992mm、height約0.05112mm（ゲーム座標の1単位を1mとして換算）。表示リーチと正本接触表の比較値であり、全対戦相性のバランス評価ではない。
- 左右反転の最大reach差は約`8.34e-8`ゲーム単位、height差は0。
- 地上技の足元baselineからの最小相対値は約−0.00639ゲーム単位。沈みが完全に0という主張はしない。
- タキマル屈強のphase0.5に`unmeasured-non-battle-phase`の診断1件がある。実Battleフレームではなく厳密比較の基準値もないため、211点の合格件数へ加えていない。

report内の制作revisionは`15977ff`、`productionApproval`は`v17-p3-normals-r2`。これらは制作素材・fixtureの識別情報で、本人のP1確認やP3完成承認を意味しない。

## 弱・強・ガード：実イベントと停止

feedback artifactの初回検査はピスケ・ゴダン・バレットの各3ケース、計9ケース。実Battleの接触イベント、両者のstop、使用中のクリップ時刻、Web Audioの実スケジュールがJSONに残り、`errors:[]`だった。

| キャラ | 弱ヒットstop | 強ヒットstop | 強ガードstop | 強接触音 |
| --- | --- | --- | --- | --- |
| ピスケ | 両者4 | 両者7 | 両者4 | `contact_kick` |
| ゴダン | 両者6 | 両者10 | 両者5 | `contact_stone` |
| バレット | 両者5 | 両者9 | 両者4 | `contact_tail` |

ピスケ強ヒット、ゴダン強ヒット・強ガード、バレット強ヒットの原PNGも目視した。接触FXとガードFXが異なり、実キャラが接触姿勢で表示されている。fixtureは測定のため実hitstopを延長して画像を保存するため、スクリーンショットだけで通常プレイ中の停止の長さやテンポが適切と判断しない。

## WAVの独立解析

8ファイルは全て48kHz・mono・16bit PCM・24,000サンプル、容器の長さ0.5秒。以下のRMS/peakはWAVのPCMを別途読み、32768で正規化して計算した。浮動小数のブラウザ原バッファとは量子化差がある。

| WAV | PCM RMS | PCM peak | ブラウザで予定した音源時間 |
| --- | --- | --- | --- |
| `light.wav` | 0.00139922 | 0.02444458 | 0.081秒 |
| `heavy.wav` | 0.00054933 | 0.00509644 | 0.190秒 |
| `guard.wav` | 0.00189321 | 0.01770020 | 0.116秒 |
| `swing.wav` | 0.00016751 | 0.00302124 | 0.095秒 |
| `quarter.wav` | 0.00034992 | 0.00610352 | 0.081秒 |
| `whiff.wav` / `muted.wav` / `zero.wav` | 0 | 0 | 接触音を再生しない |

ブラウザ原バッファでも有限値、予定時間後のquiet peakは0。heavyにはlight終了後の持続エネルギーがあり、quarterの原バッファRMSはlightの0.25倍だった。WAV上でも音量制御と無音条件が一致する。`whiff`は接触音が出ない検査で、別の`swing.wav`が存在するため、空振り動作全体を無音にする意味ではない。

heavyはlightより長い一方、PCM RMSやpeakは低い。音色・帯域・持続が違うことと、実機で重量感が心地よいことは別である。今回は音声ファイルを数値解析し、実スピーカーでの聴感・耳障り・屋外音量・実iPhone出力は評価していない。

## Chirka曲線FXと未検証事項

**この初回feedback artifactにはChirkaの接触画像・曲線FX測定は含まれていない。** motion側のチルカ画像は通常技の静止姿勢で、曲線FXの表示証明にはならない。

追加fixtureではChirka s3を両向きで実`_begin`から接触・表示へ進め、実シーンに加わった3本の曲線ShapeGeometry、有限頂点・bounds・接触位置・生存数と原PNGを検査する。fake eventやmesh/clip差し替えは使わない。追加fixtureの実CI完了までは、曲線FXの実表示成功と扱わない。

この文書だけでは、同runで失敗した別fixture、27必殺の全実接触、後続counter16ケース、カスタムリグAPI互換、実iPhoneのFPS/発熱、本人の完成度判断は検証済みにしない。元mainのマージ・P2着手・本人確認ゲート解除は行っていない。

## 追補：Chirka曲線FXの実表示を確認

[Actions 45142345050](https://github.com/nagi300222/mamo-ken/actions/runs/45142345050)、ソース`2dc707fbee841fef29c712f05c519404d22b242e`の**p3 feedback job `137583158447`が成功**した。[原artifact 14802472603](https://github.com/nagi300222/mamo-ken/actions/runs/45142345050/artifacts/14802472603)を独立取得し、`chirka-s3-right-curved-hit.png`と`chirka-s3-left-curved-hit.png`を加工せず目視した。両向きで実相手の接触位置に紫色の曲線3本が表示され、初回artifactに無かった表示証拠を確認できた。

`chirka-curve-evidence.json`には実`_begin`→hit→feedback→scene追加で観測した次の結果がある。生成イベント、mesh、clipの差し替えは行わず、本物のpause handlerで短命FXを撮影用に保持した。

| 項目 | 左右両ケースの実測 |
| --- | --- |
| 使用clip / move | `s3_v17` / `chirka.s3` |
| 実接触 / 両者停止 | `authored-special-surface` / 各7frames |
| 実シーンへの接続 | `attached:true` |
| 曲線 | ShapeGeometry、3shapes、各QuadraticBezierCurve 2本、segments8 |
| メッシュ | 48頂点、126index、全頂点finite |
| ローカルbounds | x約−0.1300〜0.10969、y約−0.1700〜0.1700 |
| 実配置 | x=±1.937430485、y=0.2222、z=0.23。各hitの実接触点と一致 |
| 色・scale / 生存数 | `dd9aff` / 1.05 / 各撮影時1instance |

このjobでは9弱/強/ガードケース、Chirka曲線2ケース、8ブラウザ音声バッファが全て通過し、`errors:[]`。接触FXの24instance上限に対して今回の生存数は1だったため、上限を超える連続発生の負荷試験まで合格したとは扱わない。停止させた原PNGは通常再生中のテンポや全軌道の動画評価とは別である。実iPhone出力・聴感・FPSは引き続き未検証。

原ZIPのSHA256は`7739104564a3cd7115eff4ea05ccffc4bf9ce4a5485238ecebd856536f30177b`。この追補はp3 feedback jobだけを対象とし、同runの他ジョブの成否を保証しない。
