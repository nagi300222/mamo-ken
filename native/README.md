# マモ拳 P1：横向きiOSアプリの検証用ソース

Issue #210 / PR #214のP1。Three.jsの5モードをそのまま同梱し、Cloudflare Web版と併存する。P2の新しいパーツ互換・技混成の拡張は含めない。**本人のP1確認が済むまでP2ゲートは解除しない。** mainや既存Draftのマージ、App Storeへの提出、署名設定の変更は行っていない。

## 再生成・更新

Node 22以上で、リポジトリルートから実行する。

```sh
npm ci --prefix native
npm --prefix native run ios:generate
npm --prefix native test
```

初回は固定したCapacitor CLIのSPMテンプレートからiOSプロジェクトを生成する。ソースが既にある場合は`cap sync ios`で更新し、既存プロジェクトを削除しない。Info.plist、SceneDelegateとPrivacyInfoの設定は`tools/configure-ios.mjs`で繰り返し適用できる。Web素材だけ更新するときは次を使う。

```sh
npm --prefix native run ios:sync
```

`www/`と`ios/App/App/public/`は生成物で、コミットしない。ビルドは元のPages生成器を使い、同じGLB・モーション・映画・UIをコピーする。`server.url`は設定せず、外部サイトをWebViewで開いてゲームを配信する構成ではない。初回ビルドにはnpmとSwift依存取得の通信が必要だが、生成アプリのゲーム素材は端末内にある。

依存は`package.json`の正確なバージョンと`package-lock.json`に固定。Capacitor core/cli/iosは8.6.2、Appは8.1.2、Preferencesは8.0.1。Swift coreも`Package.swift`の`exact: "8.6.2"`で固定する。

## Macで起動

公式要件はmacOS＋Xcode 26以上。リポジトリをMacへ取得し、上記`ios:sync`を実行した後に開く。

```sh
npm --prefix native run ios:open
```

SPM版なので、手動で開く場合は`native/ios/App/App.xcodeproj`を選ぶ。`App`スキームとiPhone Simulatorを選んでRunする。署名不要のコンパイルだけなら次を使う。

```sh
xcodebuild -project native/ios/App/App.xcodeproj -scheme App -configuration Debug \
  -sdk iphonesimulator -destination 'generic/platform=iOS Simulator' \
  -derivedDataPath native/DerivedData CODE_SIGNING_ALLOWED=NO CODE_SIGNING_REQUIRED=NO build
```

iPhoneへ入れる場合は本人のMacのXcodeで対象iPhoneを選び、Signing & CapabilitiesのTeamと必要ならBundle Identifierを本人の環境に合わせる。初期ID`jp.nagi.mamoken.poc`は検証用の仮IDで、登録済みの本番IDではない。Developer Modeや初回の開発元信頼が端末から要求された場合も本人の端末で操作する。Apple ID・証明書・Provisioning ProfileをGitHubへ保存しない。Simulator用`.app`は実機用IPAではない。

## Simulatorへ実インストールして画面を保存

unsigned simulatorアプリをビルドしたMacで、次を実行する。

```sh
npm --prefix native run ios:smoke
```

`simctl`の実inventoryから利用可能なiPhoneとiOS runtimeを選び、boot完了待ち→App.appの実インストール→起動→8秒後と10秒後のPNG撮影を行う。起動PIDが残っていることも確認する。Xcode/SDK、選択したSimulator、実PNGの縦横ピクセル数、実行コマンド、アプリログを`native/evidence/simulator/`へ保存する。既存のSimulatorデータを消去せず、この工程で起動したSimulatorだけ終了する。

Simulatorが無い、bootに失敗する、アプリが終了する、PNGを取得できない場合はCIを失敗にし、成功へ置換しない。`MAMOKEN_SIMULATOR_APP`でビルド済み.appの場所、`MAMOKEN_SIMULATOR_EVIDENCE`で証拠出力先を指定できる。

これは**実iOS Simulatorのインストール・プロセス起動・画面保存**の検査。自動撮影しただけでは、画面内のゲームUIが正しいこと、WebGLで対戦できたこと、タッチ操作やiPhone実機性能が合格したとは扱わない。PNGの縦横は実測値として残し、UIKitのinterface orientationは画像の目視確認と合わせて判断する。P1本人確認ゲートは解除しない。

## 横向き・復帰・音

- Info.plistはiPhone／iPadとも左右のLandscapeのみ。iPadの全画面要件も指定する。
- Capacitor 8.6.2のUISceneテンプレートを使い、`SceneDelegate`が横向き専用`MamoKenViewController`を作る。旧`AppDelegate.self.window!`を参照するコードは追加しない。
- native判定時はWeb用のCSS90度回転を止める。通常ブラウザとPWAの回転処理は残す。ノッチの配置は既存`viewport-fit=cover`とsafe-areaを使う。
- nativeのApp通知は`mamoken:native-state`へ変換する。背景移行時に入力を解除・対戦を停止し、復帰だけでは自動再開しない。音は停止・AudioContextをsuspendし、再開ボタン等の次の本人操作内でunlockする。
- AppIconとSplashはCapacitorの初期テンプレートの仮素材。P4の完成アートと区別する。

## 保存の扱い

既存の同期localStorage保存形式は維持する。アプリ内のStoryキーとSurvival自己ベストだけ、Capacitor PreferencesのUserDefaultsにも直列複製する。起動時にWebKit側の記録が欠けている場合だけ復元し、既存の記録や壊れた記録を勝手に上書きしない。一時的な複製失敗はローカル保存を妨げず、次のflushで再試行する。定期flushは2秒間隔で、背景移行時にも実行する。

アプリのUserDefaultsとCloudflareをSafariで開いた際のlocalStorageは別領域。**Web版の既存セーブが自動移転するとは主張しない。** アプリ内での更新・再起動を検証対象とし、Webとの転送UIはこのPoCに追加していない。アンインストールするとアプリの保存は消える。

## 検証の範囲

[端末確認表](IPHONE_REVIEW.md)に実測と未確認を分けて記録する。Linux上では依存固定、実Xcodeソース生成、9つの元GLBを含む同梱ビルド、native判定・保存・音のNodeテストを確認する。macOS CIの実際の`xcodebuild.log`が成功するまではiOSコンパイル済みとしない。実ブラウザはWKWebViewやUIKitそのものの代わりにはならない。

## 参照した公式資料（2026-11-23）

- [環境要件](https://capacitorjs.com/docs/getting-started/environment-setup)
- [iOSプロジェクト](https://capacitorjs.com/docs/ios)
- [画面方向の設定](https://capacitorjs.com/docs/guides/screen-orientation)
- [App lifecycle API](https://capacitorjs.com/docs/apis/app)
- [Preferences・UserDefaultsのPrivacy Manifest](https://capacitorjs.com/docs/apis/preferences)
- [GitHub macOS 26 runnerのXcode一覧](https://github.com/actions/runner-images/blob/main/images/macos/macos-26-arm64-Readme.md)


アプリのアイコンとLaunchScreen画像はCapacitor公式ひな形です。P4のオリジナルアートへ差し替える前のPoCであり、最終アートの完成認証ではありません。
