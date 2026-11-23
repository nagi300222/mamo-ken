# P4改善R6 最終ソースの独立検証

対象固定SHA：`9ee89efafa76cb3ad80fbff46c7f56a1261baa48`。基準：`1391c49493eca193c3a49a22140e5b1c3d2c6417`。この受領書は品質採点を担当せず、別担当がソース・機能回帰・配信を照合した記録。

## R5からの修正を独立確認

- 保存確認の紙に不透明な明るい下地を追加。SVGの右上切欠きで長名末尾が暗い地色へ落ちる問題への対処。
- VS・intro・KO・victory・result時だけ非活動の左右操作レールをvisibility:hiddenへ。DOM/grid/cameraを詰めず、実入力処理は無変更。独立header/skipは対象外で、fightで可視へ戻る。
- 対応する実browser検査を追加。runtime JS、v18素材、nativeコード/起動ガードはR5から完全不変。

## 新たなローカル確認

| 項目 | 結果 |
|---|---|
| 元77素材保全 | 成功、不変 |
| 新geometry/presentation script構文 | 成功 |
| Pages build | 成功 |
| native bundle build | 成功、319ファイル／130,976,007bytes、remote serverなし |
| ビルドによる追跡ソース変更 | なし |
| 許可ゲート | 基準と同git blob、P4pending、P5/main許可false維持 |
| v18 runtime素材 | 前版と同一、21点／193,709bytes |
| 戦闘ルール | battle/balance/cpu/fighter-style/run-controllerは基準から不変 |

R4で独立に全Node298件をfresh実行し全成功。R6はCSSだけのruntime差分のため、ローカル全群の再々実行はせず、必要なbuild/構文/保全を取り直した。R6同SHA CIの完了jobログから、combat218＋custom/story/sharedUI60＋native14＋framework6＝全298件、fail0/skip0を確認。matrixによる重複実行は合算しない（`r6-ci-custom-job.log`・`r6-ci-native-job.log`・`r6-ci-framework-job.log`）。過去SHAのPASSを最終SHAへ貼り替えない。

## 最終配信とCI

Cloudflarecheckは同SHAでsuccess、[固定配信](https://19b355a1.mamoken-3d.pages.dev/)を表示。check原証拠は`r6-cloudflare-check.json`、実HTTPS GET34件は全200、CSS・runtime JS・v18のWebP/SVG/WAVを独立buildとbyte/hash一致確認（`r6-deploy-get-verification.json`）。

[WebGL45193206578](https://github.com/nagi300222/mamo-ken/actions/runs/45193206578)は同SHAでcompleted/success、実操作10suite＋frameworkの11jobすべて成功。原job/step receiptは`r6-webgl-ci-receipt.json`。p4原ログ`r6-ci-p4-job.log`で既存経路全PASS、追加geometry3,417checks PASS、実UI音声PASSを確認。artifact原ZIPのSHA256もAPI値と一致。`p4-r6-evidence/ci-provenance.json`・geometry原JSON・audio原JSONを同SHAへ照合し、3,417件すべてpass・errorsなし、音声failure:null/errors:[]を確認（`r6-p4-artifact-verification.json`）。初回gesture前・mute・pause・muted resumeのpeak RMSは0、弱/強の実action受理と非ゼロ音声出力を確認。raw2音声streamをFFmpegで独立decodeし非ゼロ実波形、最終MP4にaudio/videoの両streamがあることも確認。muxは概略同期で、人間による音質/物理遅延評価やsave音のlive経路評価は未実施。依存取得に時間を要したが初回jobのまま完了し、retryは行っていない。

別欄の[Mac45193206865](https://github.com/nagi300222/mamo-ken/actions/runs/45193206865)は同SHAでsuccess。unsigned build成功、Simulatorへ実install、PID20233でlaunchし同PIDの生存確認、framebuffer2枚採取まで実行。今回は4つの実migration段階への進行を検出して既存420秒延長を適用しboot完了（ガード不変）。`r6-mac-ci-receipt.json`と`mac-r6-evidence/evidence/simulator/report.json`に原記録。未加工PNGは縦1206×2622のframebufferに横向きの5モードLobbyが写っている。自動UI読込判定・touch gameplay・物理端末の横向き認証は対象外。

## 失敗履歴・未実施の維持

R5 Mac初回はbuild成功後、CoreLocationMigratorによるSimulator初期移行停滞でinstall前に失敗。原失敗とdiagnosisを`r5-mac-failure-diagnosis.json`に保持する。起動ガードは緩めていない。R6の結果とはSHAを分ける。

物理iPhone、人間の無説明タスク、本人P4採否、人間の音質評価は未実施。Browser/Simulatorの自動結果で合格にしない。ローカルBrowser起動やsandbox権限追加はしていない。採点担当のスコアは変更しない。
