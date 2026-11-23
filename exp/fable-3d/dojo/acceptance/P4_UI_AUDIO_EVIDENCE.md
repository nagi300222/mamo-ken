# 実UI音声の収録

`p4-ui-audio-browser.mjs` はbuilt `_pages` を同梱配信し、単一のDojoページで実際のクリック・タップ・キー操作を行う。Playwrightの画面録画が無音であることを補う開発検証用で、ゲーム本体の音を置換しない。

```sh
npm --prefix exp/fable-3d/dojo run build:pages
CHROMIUM_PATH=/usr/bin/google-chrome MAMOKEN_EVIDENCE=/tmp/mamoken-ui-evidence \
  node exp/fable-3d/dojo/acceptance/p4-ui-audio-browser.mjs
node exp/fable-3d/dojo/acceptance/mux-p4-ui-audio.mjs \
  /tmp/mamoken-ui-evidence/ui-audio/report.json
```

CIではPlaywright CoreとPlaywright同梱ffmpeg（画面録画用）、Chromium、日本語フォントを既存P4 jobと同じように用意する。任意muxにはCLI `ffmpeg` が必要。`MAMOKEN_UI_URL` で配信済みサイトのoriginを指定することもできる。URLは `_pages` のルートとして扱う。

## 実測するもの

- 最初のgesture前にAudioContext生成・音がないこと。
- キャラ選択、対戦確定、実Practice攻撃、戻るの際、実WebAudioのdestinationに信号があること。
- 音OFFでのキャラ選択とPracticeのpause→resume→攻撃に、全context合計でRMS `1e-4` 以上の信号が出ないこと。
- UIの実WAVが成功応答し、実AudioBufferSourceで再生されたこと。
- 全AudioContextの生成・状態変更・source開始時刻、各観測区間とRMSをページのperformance時刻とともに記録。

各実AudioContextの最終出力を、そのcontext内のAnalyserとMediaStreamDestinationへ追加分岐して、contextごとの音声WEBMを保存する。元のスピーカー接続を保ち、新しい再生用AudioContextの生成、強制resume、偽のヒット、マイク入力、保存成功の偽イベントは使わない。close時や収録終了時にはrecorderとcapture trackを停止する。

## 出力と限界

- `report.json`、`audio-context-<id>.webm`、`video/*.webm`、最終画面PNG。
- 任意の`ui-with-audio.webm`はレビュー用合成。原音声と原画面は保存する。複数contextを時刻で遅延整列してmixするが、Playwright画面録画の最初のframe時刻は公開APIでは直接取れない。ページ生成時刻の前後区間を記録し、その中点で近似する。**frame単位の同期・実機遅延の証明には使わない**。
- 保存音はStoryの実保存経路が必要なので、この単一Dojo検査では未実施と記録する。4種すべてを実操作したと主張しない。
- RMSと信号の有無は、聴いたときの気持ちよさ・音色・音量バランスの人間評価ではない。物理iPhone、スピーカー品質、実ユーザーの評価は別。
- 実行環境のChromium socket制限でローカル起動できない場合は、その制限を報告してGitHub Actionsで実行する。構文検査やNodeテストだけを録音成功としない。

## 初回の実録音で見つかった問題と再検査

R3 `3ee53a7` / Actions `45187508538` / artifact `14824247940` は音声検査で失敗した。原音声・JSON・画面は失敗証拠として保持する。

- 弱入力には実信号（RMS約0.000362）があり、その直後の強入力にはAudioNode source開始自体が無かった。650msの実時間待ちをゲームの技硬直終了と同一視していたため、再検査では実Battleのaction/stun/stopが終わるまで読み取りだけで待ち、強が実際に開始したframeも確認する。
- 70msの選択音や短い戻る音を、tap完了後に始める別プロセスの採取で取り逃さないよう、ページ内の16ms採取をgesture以前から継続し、操作前後のmarker区間を切り出す。音を延長したり閾値を緩めたりはしない。
- 開始ボタンの有効なクリック直後にローディングでdisabledへ切り替わると、bubble段階のUI音処理がその意図を捨てていた。音処理はcapture段階で有効な操作を受け付ける。既にdisabledのボタンと戦闘ボタンは除外したまま。実200ms確認WAVのsource開始と実信号を新たに検査する。

これは実装・検査方法の修正であり、再実行が通る前に音声合格へ変更しない。
