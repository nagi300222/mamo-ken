# ミオ統合工程｜Showtime v0.8–v0.11 のブラウザ実地回帰

このレーンは大きなUI/VFX/音の変更がブラウザで一緒に動くことを確認する**検査専用**。操作/バランスの正本 `battle.js`・`balance.js`・`cpu.js`・`commands.js` と元GLBは変更しない。

## Chromium headlessを使うテスト
- iPhone横画面相当852x393で左右レール、右6ボタン/左前後2ボタン、中央ステージ寸法が破綻しない
- 9体のうちチルカで奥義を発動し、分身がactiveになりカットイン/ポートレートがあること
- 演出OFFで分身が消える。BGMと効果音のON/OFFが独立
- バレットを選択しチャージ3段をHUDで表示
- ページ例外や404なし。撮影した検証画像をGitHub Actions artifactへ保存

iPhone Safari実機のタッチ、音量・音質、FPS、温度や描画乱れは別の人間ゲート。このCIに成功してもそれらを合格扱いしない。

親: [Astra UI #172](https://github.com/nagi300222/mamo-ken/pull/172) / チルカ分身 #168 / 音響 #170。
