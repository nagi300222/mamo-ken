# 09｜選択台帳・改訂履歴・本人の好みの扱い

## 大前提
- Figmaへ絵を置いたこと、ミオが推薦したこと、WorkがDraft PRを作ったことは**本人の採用決定ではない**。
- 本人が「この案で」「組合せはこれ」「この操作が良い」と明言した場合のみACCEPTED。曖昧な発言はUSER_PROPOSED。
- 「違う」「戻したい」は訂正の機会とし、以前の理由と変更理由の両方を残す。
- 選択候補は後で増やせる。選択済み案を含めた全画面統合を経て**人間が遊べるか**を別に確認する。

## 09-1 全候補のIDと状態
| スコープ | 候補 | 状態 | 参考 |
|---|---|---|---|
| AD-00 全体の表現 | **B 山嶺**（初回方向） | USER_PROPOSED | [13](13_selected_direction.md) |
| MENU 5モード | **B 大ステージ＋切替**（初回方向） | USER_PROPOSED | [13](13_selected_direction.md) |
| SEL キャラ9人 | **A 拳祭**（初回方向） | USER_PROPOSED | [13](13_selected_direction.md) |
| BATTLE 対戦舞台 | **A 舞台**（初回方向） | USER_PROPOSED | [13](13_selected_direction.md) |
| BATTLE-SUB 詳細構図 | BA-01/BA-02/BA-03 | PENDING | [13](13_selected_direction.md) / [Figma](https://www.figma.com/design/afaB1eVmV6uOnDZR40t0Kr?node-id=23-170) |
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
| 6攻撃 | **ACT-D 独自弧型**：詳細3形状は保留 | USER_PROPOSED | [16章](16_combat_ui_blueprints.md) |
| ジョイスティック | VIS-JOY-A/B/C | PENDING | 05 |
| 前後ステップ | DSH-A/B/C | PENDING | 05 |
| HP | **HP-01 長い競技バー**：色/演出は保留 | USER_PROPOSED | [16章](16_combat_ui_blueprints.md) |
| HP数字 | HP-TEXT-01（常時）/02（必要時） | PENDING | 06 |
| DRIVE | **DRV-02 分割目盛**：分割数未定 | USER_PROPOSED | [16章](16_combat_ui_blueprints.md) |
| 奥義 | **ULT-04 分割＋満タン先端火炎＋ボタン変色** | USER_PROPOSED | [16章](16_combat_ui_blueprints.md) |
| 時間/ラウンド | TIME-01/02/03 | PENDING | 06 |
| 能力/状態 | TRAIT-01/02/03 | PENDING | 06 |
| UI遷移/動作 | MOT-A/B/C | PENDING | 07 |
| SEの方向 | SE-A/B/C | PENDING | 07 |
| 対話 | TST-A/B/C | PENDING | 05 |
| 表示と操作の拡張 | READABILITY-01（初回）/02（詳細） | PENDING | 08 |

## 09-1a 初回の方向選択：2026-11-24
ナギ本人の明言は「全体=B、モード選択=B、キャラ選択=A、対戦画面=A」。本人による**初回方向の選択**として記録した。4項目はUSER_PROPOSEDとselected候補を併記している。色や形、Figmaの完成稿、個々のボタン/ゲージ、ゲーム実装の確定採用ではない。

**本人の個別理由**：未共有。ミオが推察する理由（競技的な読みやすさ、モードの選択速度、キャラの存在感、戦闘の舞台性）は [13](13_selected_direction.md) に仮説として記録し、本人理由と混同しない。

**保留**：新しいBATTLE-SUB構図、ACTの6操作、HP、Drive、ULTその他すべての部品・音・色・未決定画面。未決定を自動的にA/Bにしない。

## 09-1b 次段のユーザー指定（2026-11-24）
- **ACT-D**：必殺が芯より右の大核。左下から1/4弧にギュイーン→弱→掴み→奥義、強は弱の上。弱は可視サイズで必殺の約1/3、掴み/奥義はGCコンX/Yのボタンの押し心地を発想元とする（形の複製ではない）。
- **HP-01**：長い競技バー。**DRV-02**：分割。**ULT-04**：分割＋READY時先端が燃える＋奥義ボタン変色。**HUD-ORDER**：HP→奥義→Drive。
- **EYE-PORTRAIT**：HP左上へキャラの目アップ。**CAMERA-CHASE**：両キャラを中央へ少しラグを残して追う。**STAGE-FULLBLEED**：ボタン下にも全画面ステージ。**CHAR-BUTTON-OVERLAP**：キャラと操作部品を重ねない。
- **保留**：ACT-D1/D2/D3、HUD-G1/G2/G3、LAYOUT-F1/F2/F3、全画面のグラフィック仕上げなど、24グループ。
- 色、材質、炎の形、目の正式画像、時間定数、実際の親指タップとsafe areaはまだ未採用。実際のHTML試作と寸法は[16章](16_combat_ui_blueprints.md)にある。本人の指定とミオの暫定寸法を混同しない。

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
