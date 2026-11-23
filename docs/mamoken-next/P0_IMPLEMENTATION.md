# P0 探索操作・共通対戦UIの実装

基準: PR209 `8ab8972295d059426b858d9b8edabfda6068a7a3`。Issue210と本人のP0→P1連続制作指示による。PR214のP4共通InputProfile/BattleHUD方針に対応する。P2モデル/技互換の追加はしていない。

## 操作の変更

- 左スティックとキーボードは、独立カメラのyawを基準にXZ方向へ移動。右側ドラッグはyaw/pitchだけを変更し、移動状態を書き換えない。
- 左右のPointerIdを別々に保持し、他のpointerを奪わない。会話ボタンの3本目のタッチも受け、会話/戦闘への遷移で両方のcaptureと残入力を解放する。
- 視点リセット、後方追従ON/OFF、pitch制限、デッドゾーン、壁沿い移動。追従ONでは手動旋回後の猶予を置き、移動時に身体の背後へ穏やかに戻す。OFFでは移動してもyawを変えない。
- ポーズ/blur/hidden/native inactiveでスティック・カメラ・攻撃・キー・コマンド履歴を消し、時間の積算をリセット。復帰で勝手に再開しない。
- 位置・身体の向きに加え、yaw/pitch/追従設定を保存する。既存version1セーブは維持し、cameraの無い旧保存からは身体の後方を初期視点にする。対戦帰還時も同じ視点を復元する。

## Battleの共通化

`shared-ui/battle-ui.js` が道場とStoryの共通契約。

- `BATTLE_INPUT_PROFILE`：6ボタンの順序/ラベル、8方向、F/R前後ステップ、B必殺、M奥義、Nギュイーン、スティック閾値を同じ定義へ。
- `createCombatInput`：短タップのキュー、独立タッチ、方向サンプル、ダブルタップのステップ入力。実際のガード/ジャンプ/必殺/当たり判定は従来Battleが処理する。
- `battleHUDMarkup/updateBattleHUD`：HP/名前、Drive、奥義/READY、ガード、固有能力、バレットの装填、残り時間を同じDOM/データから表示する。HUDは技を勝手に無効化しない。
- 左スティック直下に前後ステップ、右に弱/強/掴み/ギュイーン/必殺/奥義。短辺320とノッチを考慮して左右の操作領域を確保し、中央canvasを指から分離。ムービーは全画面へ戻す。
- Storyは独自の戦闘ロジックを追加せず、既存`createCustomBattle`と約10秒奥義の凍結/スキップ/KO/帰還を維持。

## P1接続契約

`boot`は`window.mamokenNative.ready`を待ち、Native Preferencesから復元された既存ローカル保存を読める。`mamoken:native-state`のactive=falseで入力解除・ポーズ・セーブ、active=trueでも自動再開しない。iOSの横向き/二重CSS回転対策はP1のnative bridgeとlandscape-lockで所有する。

## 検証

- `node --test exp/fable-3d/shared-ui/battle-ui.test.mjs exp/fable-3d/story/exploration-controls.test.mjs exp/fable-3d/story/story-state.test.mjs`: 16/16成功。
- カメラ基準移動4方向、左右pointer独立、pitch/デッドゾーン、follow/reset、壁沿い、保存互換、同じInputProfileからBattleのジャンプ/前後step/方向必殺を検証。
- `story/p0-browser.mjs`: 実WebGL、CDPの実touch dispatchで左移動+右旋回+3本目会話、blur reset、共有HUD/6ボタン/step、pause、同位置/同視点帰還、横667×375/568×320/portrait-lock、通常Dark VS不要文言を検査する。実ブラウザ結果は統合CIで取得後に追記する。ソースを作っただけでは成功としない。

iPhone実機の手触り・FPS・熱・ノッチ寸法は未測定。P1本人確認前のP2を実装していない。mainと既存Draftは未マージ。
