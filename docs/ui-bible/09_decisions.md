# 09｜選択台帳・改訂履歴・本人の好みの扱い

## 大前提
- Figmaへ絵を置いたこと、ミオが推薦したこと、WorkがDraft PRを作ったことは**本人の採用決定ではない**。
- 本人が「この案で」「組合せはこれ」「この操作が良い」と明言した場合のみACCEPTED。曖昧な発言はUSER_PROPOSED。
- 「違う」「戻したい」は訂正の機会とし、以前の理由と変更理由の両方を残す。
- 選択候補は後で増やせる。選択済み案を含めた全画面統合を経て**人間が遊べるか**を別に確認する。

## 09-1 全候補のIDと状態
| スコープ | 候補 | 状態 | 参考 |
|---|---|---|---|
| AD-00 全体の表現 | A拳祭 / B山嶺 / C絵巻 / MIXを核に統合 | PENDING | 01 |
| MENU 5モード | MENU-A/B/C | PENDING | Figma3案 |
| SEL キャラ9人 | SEL-A/B/C | PENDING | Figma3案 |
| BATTLE 対戦舞台 | BATTLE-A/B/C | PENDING | Figma3案 |
| PRACTICE 教える場面 | PRACTICE-A/B/C | PENDING | 02 |
| RUN-A Arcade | RUN-A/B/C | PENDING | 02 |
| SURVIVAL | SURV-A/B/C | PENDING | 02 |
| CREATOR | CRE-A/B/C | PENDING | Figma3案 |
| EXPLORE | EXP-A/B/C | PENDING | Figma3案 |
| RESULT | RESULT-A/B/C | PENDING | Figma3案 |
| SETTINGS | SET-A/B/C | PENDING | 03/05 |
| モードナビ | NAV-A/B/C | PENDING | 03 |
| 主ボタン | BTN-A/B/C | PENDING | Figma部品 |
| キャラ選択の確定 | SEL-CONFIRM-01（別確定）/02（即決） | PENDING | 05 |
| 戻る | BACK-01/02/03 | PENDING | 05 |
| スキップ | SKIP-01（タップ）/02（長押し） | PENDING | 05 |
| 6攻撃 | ACT-A（弧）/B（3×2）/C（機能別） | PENDING | 05 |
| ジョイスティック | VIS-JOY-A/B/C | PENDING | 05 |
| 前後ステップ | DSH-A/B/C | PENDING | 05 |
| HP | HP-01/02/03 | PENDING | Figma部品 / 06 |
| HP数字 | HP-TEXT-01（常時）/02（必要時） | PENDING | 06 |
| DRIVE | DRV-01/02/03 | PENDING | Figma部品 / 06 |
| 奥義 | ULT-01/02/03 | PENDING | 06 |
| 時間/ラウンド | TIME-01/02/03 | PENDING | 06 |
| 能力/状態 | TRAIT-01/02/03 | PENDING | 06 |
| UI遷移/動作 | MOT-A/B/C | PENDING | 07 |
| SEの方向 | SE-A/B/C | PENDING | 07 |
| 対話 | TST-A/B/C | PENDING | 05 |
| 表示と操作の拡張 | READABILITY-01（初回）/02（詳細） | PENDING | 08 |

## 09-2 決定1件のフォーマット
| 欄 | 記入内容 |
|---|---|
| decision_id | 例 BATTLE / ACT / HP |
| status | PENDING / PROPOSED / USER_PROPOSED / ACCEPTED / REJECTED / SUPERSEDED |
| chosen | 例 BATTLE-B |
| requested_by | ナギ / ミオの提案 / Workの試作。主体を混同しない |
| decided_at | 実際の採用日。日付不明なら未確定 |
| why | どの目的・感情・操作問題を解決するためか |
| visual_ref | Figma node / 同SHAスクリーンショット / 操作動画 |
| functional_contract | 既存ゲームの入力・保存・CPUなど守る契約 |
| exclusions | 採用しなかった案と理由 |
| validation | WebGL / iOS Simulator / 実iPhone / 人の実試遊 |
| migration | 機能互換／旧素材の扱い |
| supersedes | 訂正した以前のdecision_id |
| next_check | 何がまだ不確かで次の比較が必要か |

## 09-3 初回の推奨組合せ（ミオ案・未承認）
- 世界の強い表現：AD-Aを核に、Battle-Bの広い競技ステージとCreator/Story-Cの世界内の手触りを取り入れる。
- 最大リスク：3つの美術方向を単に並べれば画面が別作品に見える。選ぶ前に同じタイポ/光/音/スキップの言語へ統一できるか、6場面の比較が必要。
- 初回の機能重視の比較：MENU-A/B/C、SEL-A/B/C、BATTLE-A/B/CとHP、ACTの順に本人に提示。
- スコア85点突破を理由に採用しない。**本人の満足と試遊検証を優先**。

## 09-4 未解決と今後の変化
- 実モデルのポーズ/登場の仕上げはFigmaのサンプルシルエットに未反映。
- ゲームパッド対応時に操作ボタンを隠すか、別レイアウトへ切り替えるかは未決定。
- 開幕チュートリアルの量、HUD資源の数字表示、キャラ設定のプロフィール量は初見者テストで調整。
- iPhone物理端末で親指が舞台を隠す実測結果が未取得。
- Audioの主観評価・サウンドバランスは未実施。
- P5の探索/技習得仕様は新しいナビゲーションに影響するため、後日追補する。

## 09-5 版管理
- **v0.1** 2026-11-24：3方向×6画面のFigma初稿、15部品コンポーネント、10+章の設計書、候補台帳。全件PENDING。ゲーム実装は変更していない。
- **v0.2** 本人の最初の候補選択後：AD/MENU/SEL/BATTLE/BTN/HPの採用と却下理由、Figma変数と全画面整合。
- **v0.3** 動くプロトタイプと音の追加後：同SHA実画面比較、実機条件、画面跨ぎの演出。
- **v1.0** 人間の使用感とデザイン合格後：実装決定。mainへのマージは別判断。

書き込み・改訂は毎回 **PR差分を残し、本人が明言していない決定を追記しない**。
