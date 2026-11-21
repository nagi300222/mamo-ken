# マモ拳3D v0.4｜Claudeモーション拡張と対戦ゲームの接続

## 位置づけ
2026-11-21。ナギ本人が試遊してOKした低めジャンプと二者追従カメラの[v0.3 PR #154](https://github.com/nagi300222/mamo-ken/pull/154)、Codexの入力修正[PR #151](https://github.com/nagi300222/mamo-ken/pull/151)、AstraのHUD演出を選択的に統合した[PR #155](https://github.com/nagi300222/mamo-ken/pull/155)を基準に、Claudeの全9体×37クリップ[PR #156](https://github.com/nagi300222/mamo-ken/pull/156)からゲーム向け3Dモデルとデータを選んで取り込む。

独立作業ブランチ：`feat/mamoken-3d-motion-live-v04`。既存#155は変更しない。main・旧本番にはマージしない。

## 取り込んだもの
- 全9体のGLB、.blend、モーションJSON（各37本）と生成/検証ソース、最新validation、比較用静止画の一部。元PR #156の動画はそちらに残し、ゲーム配信には含めない。
- GLB参照パスは変更なし。`models.js` の`MODEL_REVISION`を`motion-v2-20261121`へ変更してキャッシュ更新。
- `main.js` が各キャラ`{id}_motions.json.command_map`を読み、236/s1、623/s2、214/s3、236236/ultimateを各固有のアニメーションへ接続。ゲーム技のダメージ・発生・当たり判定は`balance.js`の仮値を維持。モーションと技性能の不一致は**独立レビュー対象**。
- 通常技：しゃがみ弱/強と空中弱/強を専用の`crouch_*` / `air_*`へ変更（クリップ自体の定義はv2 GLB）。
- 防御・特殊技：`roar`、`gyuiin`、`clinch_hold`、`clinch_recoil`、`guard_hit`、`guard_impact`、`guard_crouch`、`guard_crouch_hit`、`roar_hit`、`hurt_heavy`。
- `KO`で専用`ko`クリップ再生。ゲーム終了後もMixerを進め、倒れる最後まで表示する。
- モデルが本物のV2クリップを再生中なら、旧ゲーム側のモデル全体の傾け/拡大演出を重ねない。
- 投げヒット：互いの原点間隔を0.36mに合わせ、攻撃側`throw_hit`と被投げ側`thrown`を48F同期、被投げ側は`wakeup`40F（**試作の演出値であり本人確定の格ゲーバランスではない**）。通常投げ空振りは`throw_reach`を使用する。
- ギュイーン終了後は両者`clinch_recoil`を26F表示。ジャンプ着地時は`land`の動きを非ロック式で12F優先。

## 明確な未対応
- `down`を使う一般のノックダウン、`dash_stop`、空中掴み、投げ抜け・中段崩しの詳細、格ゲー式コンボ・KO後追撃はまだ未実装。
- 連続投げや弾との干渉など、試作の新状態が対人バランスに与える影響は検証が必要。元レポートにあるタキマルの技名（「天地大回転」→「天地落とし」）は**動画上の仮称変更**であり、ゲーム技名の正式採用・数値変更はしていない。
- 造形の口は咆哮中も開かず、手/装飾の貫通や床への毛・尾沈みなどは残る。元PR #156の撮影はヘッドレスChromium。今回のv0.4について物理スマホ端末の再生、FPS、押しやすさは別の受け入れチェックが必要。

## テスト
- `dojo/motion-live.test.mjs`で9 GLBの実バイナリJSON chunkを読んでクリップ名37・各キャラのコマンドJSONが実アニメーションと一致するか確認。咆哮/ギュイーン/guard/KO、通常技接続、ペア投げ・起き上がり、81CPU戦を回帰。
- ロジック単体のJavaScript実行では、統合後も81CPU戦（左35勝／右35勝／引分11）、飛び越え162通りを確認。
- 現在は新GLBとアニメ接続を作業ブランチにコミットした段階。**Cloudflareのデプロイ成功通知、GitHub CI/Nodeの実行とスマホ実機を別途確認し、未実施の検証を「合格」と扱わないこと。**
- `npm --prefix exp/fable-3d/dojo test`、`node exp/fable-3d/dojo/build-pages.mjs`、ブラウザで`/dojo/`を確認。自動配信はゲーム/GLB/モーションJSONだけを含む。元の動画やBlenderデータはCloudflareへ配信しない。

## 次の検証優先
1. モグゾーvsゴダン、ピスケvsタキマルで咆哮→受け、ギュイーン接近→両者組み合い→反発、投げ→倒される→起き上がりがゲーム画面で同期するか。
2. 9キャラそれぞれの236/623/214/236236で新モーションを再生し、攻撃判定が見た目と乖離していないか。
3. iPhone Safari/Android Chromeの実物で、カメラフレーミング、FPS、タップ、端末発熱を確認。個性技・数値の最終調整はその後。
4. デフォルトのUIとカメラ/ジャンプをv0.3でナギがOKした状態から勝手に改変しない。

関連：[#147](https://github.com/nagi300222/mamo-ken/issues/147)／[#148](https://github.com/nagi300222/mamo-ken/issues/148)／[Claude #156](https://github.com/nagi300222/mamo-ken/pull/156)／[v0.3 #155](https://github.com/nagi300222/mamo-ken/pull/155)。
