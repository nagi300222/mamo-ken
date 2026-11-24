# 11｜ミクロ部品辞典・属性の決定表

設計した画面を本当に使えるUIにするには、画面数ではなく**状態と部品のかけ算**を管理する。各部品は1つのIDで識別し、文字・トリガー・効果・フォーカス・失敗・音・低刺激・長名をセットで決定する。

## 11-1 グローバル
| ID | 部品 | 主に出る場面 | 状態 | 再設計の視点 |
|---|---|---|---|---|
| G-01 | タイトル/ロゴ | MENU、起動 | idle/loading | いつ消すかを含めて設計 |
| G-02 | 戻る | 非対戦時 | focus/pressed/disabled | 行先と保存の影響 |
| G-03 | 決定/開始 | 全モード入口 | focus/loading/success | 1アクション1発火 |
| G-04 | 設定入口 | MENU/SELECT/Pause | open/closed | 主画面の体験を邪魔しない |
| G-05 | Pause | Battle/Story | open/closed | ゲーム時間と入力停止 |
| G-06 | Skip | VS/Ultimate/Result | show/hide/used | スキップ後の復帰 |
| G-07 | 音 | 全体 | on/off/unlock | 状態と音の矛盾なし |
| G-08 | ヘルプ | モード/技/Story | open/closed | 必要なタイミングにだけ |
| G-09 | ロード | 全モード開始・GLB読込 | loading/error/retry | 偽の無限スピナー禁止 |
| G-10 | 重要エラー | セーブ、WebGL | error/dismiss/retry | 復旧の道筋 |
| G-11 | テキストガイド | 初回/Practice | initial/dismissed | 説明で画面を占領しない |
| G-12 | フォーカス枠 | タッチ/キー/パッド | focus/blur | 異なる入力で共通の意味 |

## 11-2 選択画面
| ID | 部品 | 状態 | 注意 |
|---|---|---|---|
| S-01 | 9人の顔サムネイル | idle/focus/selected/missing | 全体は9人、画像欠落時は名前で判断 |
| S-02 | 主役の大立ち絵 | candidate/loading/ready | モデル原型を保ち、意味なくポーズ差し替えない |
| S-03 | キャラ名前 | selected/long-name | 一覧/詳細で意味なく2回大きく出さない |
| S-04 | 得意/苦手 | reveal/hidden | 説明は短く、技の全部をここに載せない |
| S-05 | 対戦条件表示 | default/changed | 検索可能な設定入口を持つ |
| S-06 | CPU難易度 | selected/changed | 難度選択と操作タイプを混同しない |
| S-07 | 対戦開始 | ready/loading/failed | 誤開始と二重開始を防ぐ |
| S-08 | 残キャラ/ロック | enabled/locked | 未実装のロック表示を勝手に追加しない |
| S-09 | 色替え/スキン | optional/disabled | 本体が機能する場合のみ出す |

## 11-3 戦闘
| ID | 部品 | 状態 | 注意 |
|---|---|---|---|
| B-01 | 左HP | full/damaged/low/empty/heal | 端末の両親指とキャラの動きに干渉しない |
| B-02 | 右HP | 同上 | 左右の読み順が自然 |
| B-03 | DRIVE | fill/spend/empty/recover | 実行可能入力との矛盾防止 |
| B-04 | 奥義 | fill/ready/spend | READYで格好良くても読みにくくならない |
| B-05 | タイマー | running/paused/zero | 中央定位置、数字揺れ防止 |
| B-06 | ラウンド勝利 | 0/1/2 | Arcadeで2本先取ルールを明瞭に |
| B-07 | 固有能力 | idle/active/cooldown | 色だけ依存しない |
| B-08 | 状態異常 | begin/ongoing/end | 弾や拳に被せすぎない |
| B-09 | 通常攻撃2 | held/released/disabled | 弱/強の差 |
| B-10 | 掴み | held/released/disabled | ガードや移動に誤触しない |
| B-11 | ギュイーン | ready/wait/use | 長名を折らず読める主名 |
| B-12 | 必殺 | command/ready/wait | 方向＋ボタンの案内分離 |
| B-13 | 奥義攻撃 | wait/ready/cinematic | ゲージ連動で認識 |
| B-14 | 左スティック | move/neutral/cancel | 複数PointerId |
| B-15 | 前後ステップ | ready/held/cooldown | 入力前後方向一致 |
| B-16 | 練習情報 | opened/closed | 通常対戦へ混ぜない |
| B-17 | Arcade進行 | between-match/battle | 8戦を常時文字で説明しない |
| B-18 | Survival継続 | between-round/battle | 残HPと回復の意味が伝わる |
| B-19 | KO/TIMEUP | confirmed/presented/skipped | 勝敗表示の因果 |
| B-20 | 結果CTA | next/rematch/back | モードで行動名が変わる |

## 11-4 制作・探索
| ID | 部品 | 状態 | 注意 |
|---|---|---|---|
| C-01 | 3Dプレビュー | idle/orbit/zoom/pose | UI操作と3D操作領域を分ける |
| C-02 | 体格と骨格 | selected/modified | 体型差をその場で理解 |
| C-03 | パーツ一覧 | compatible/incompatible/selected | 許可の理由を明示 |
| C-04 | 毛色／9領域 | region/color/preview | 色だけで領域を識別しない |
| C-05 | 模様 | one-of-four/preview | 既存データに変換影響なし |
| C-06 | スタイル | chosen/preview | 外見と戦闘性能の差を理解 |
| C-07 | 技3枠 | available/unavailable/selected | 未実測混成技を勝手に使わせない |
| C-08 | 名前 | edit/IME/invalid/long | IMEと文字表示 |
| C-09 | 保存 | dirty/saving/saved/error | 実際の保存結果のみ成功 |
| C-10 | 破棄と戻る | changed/unchanged | データを勝手に消さない |
| E-01 | 移動スティック | touch/release | 戦闘入力と移動を明確に分離 |
| E-02 | カメラ | drag/lock/reset | 左移動と右視点が独立 |
| E-03 | NPC/近接 | approach/near/out | 近づいてから表示 |
| E-04 | 話す | available/inactive | セリフへフォーカス |
| E-05 | 会話送り | next/end | 内容を読み切る |
| E-06 | 挑戦 | proposed/accepted/cancel | Battleへ移行前に選択可能 |
| E-07 | 帰還 | complete/reload | 元位置・向き・保存が保持 |

## 11-5 同じ部品に必要なレビュー物
**シート1枚につき** Default／Focus／Pressed／Disabled／Loading／Success／Error、通常表示／省スペース／720安全領域／長い名前／モーション軽減／音OFFのスクリーンショットを記録（適用しない状態はN/Aにして理由を書く）。設計稿と実DOMが一致するか、Figmaのnode-idとGitHubのコード位置で追跡できるようにする。
