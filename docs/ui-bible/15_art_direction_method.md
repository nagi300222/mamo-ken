# 15｜Anything Frontend Art Direction をマモ拳へ適用する方法

> 調査日：2026-11-24。参照時点のコミット Art Direction `046e42c7de149373993109cf4a211a577b1c3bcc` / Product Design `af656d5fafc982daabcbccffe5a331802977f492` / Motion Atlas `8cff76041b06a30d7f4b4b9f79979b8e30512f60`。外部の手法は**検討・評価の道具**として使い、ゲームUIのデザインやコードを自動変更するものではない。
> 一次資料： [Anything Frontend Art Direction](https://github.com/RNA4219/anything-frontend-art-direction) / [SKILL.md](https://github.com/RNA4219/anything-frontend-art-direction/blob/main/SKILL.md)。関連：[Product Design](https://github.com/RNA4219/anything-frontend-product-design/blob/main/SKILL.md) / [Motion Atlas](https://github.com/RNA4219/motion-atlas/blob/main/SKILL.md)。

## 1. このスキルから確認できた内容と限界

Art Directionは題材・利用目的から配色・書体・余白・構図を選び、**主役/行動/判断/採用理由**の関係を確かめる資料。見本を調べる場合には制作側の原文と実物・掲載図の双方を確認し、見ていないものを観察済みにしない。意匠が未確定なら、同じ具体内容を使い、単なる色替えではない二案以上で構図・文字・地色・線の役割を比較する。狭い初期表示と広い表示で「何を見て何ができるか」を確かめる。

このリポジトリは**Webフロントエンドのデザインスキル**で、格闘ゲーム特有の60Hz入力・ガード・カメラ・奥義・親指重なりなどの設計を自動生成するものではない。そのため、Product Designに利用課題/状態/受入条件、Motion Atlasにパラメータの異なる動きの試作を分担し、ゲーム固有の判定と実機品質はマモ拳既存ロジック＋新QAで判断する。

## 2. マモ拳へ適用するプロセス

| 段階 | 使う資料 | マモ拳への変換 | 記録する証拠 |
|---|---|---|---|
| A 主役と行動 | [visual-direction](https://github.com/RNA4219/anything-frontend-art-direction/blob/main/references/visual-direction.md) | 誰が何を見て、どんな技を押したくなるか。プレイヤーではなくキャラと攻防を主役に | 利用課題ID・画面の最初の視線 |
| B 画面の構図 | [visual-composition](https://github.com/RNA4219/anything-frontend-art-direction/blob/main/references/visual-composition.md) | 同じ対戦・HP/Drive/奥義・6ボタンを保持し、ACT-D1/D2/D3・HUD-G1/G2/G3・LAYOUT-F1/F2/F3を比較 | 実寸852×393、720×320、被り |
| C 文字・色・線 | [visual-craft](https://github.com/RNA4219/anything-frontend-art-direction/blob/main/references/visual-craft.md) | マーモットの耳・拳・毛並み・山の地形などの形が、何の意味のUIになるか決めて使う | 要素ごとの意味、無意味な線・札の削除理由 |
| D 入力と状態 | [Product Design](https://github.com/RNA4219/anything-frontend-product-design/blob/main/SKILL.md) | 6操作の押下と無効、奥義READY/発動、指ID、入力/保存失敗、モード間遷移 | 状態ID、受入条件、再現手順 |
| E 動き | [Motion Atlas](https://github.com/RNA4219/motion-atlas/blob/main/SKILL.md) | 追従遅延、ゲージ先端火炎、ボタンの押下、ヒットとKOの演出をパラメータ比較 | 使用したデモID、変更値、映像、低刺激対応 |
| F 実証 | Art Directionの採用条件＋マモ拳QA | Web/Simulator/物理iPhone/人の実プレイを区別して試す | 同じSHA、端末、条件、成功/失敗・未検証 |

## 3. 同じ利用課題を共有する（上流→下流）
- `COMBAT-READ-01`: 1秒以内に自分/相手のHP・奥義READYを識別できるか。失敗時は「見つからない」「読み違う」を別々に記録。
- `COMBAT-HIT-02`: 両親指で6操作を連続入力でき、指とボタンがキャラ・弾の動きを隠さないか。
- `COMBAT-TRACK-03`: ダッシュ・ジャンプ・端寄りの攻防でも、中央追従の軽い遅れを感じながら両キャラを追えるか。
- `COMBAT-ULT-04`: 満タン時、ゲージ先端の火炎と奥義ボタンの色でREADYを見落とさず、減光時にも意味が伝わるか。
- `COMBAT-AD-05`: 固有UIの目アップ・弧・奥義炎・山の舞台に**マモ拳の題材とのつながり**があるか。単なるテンプレ「ゲーミングUI」と区別できるか。

Product Designからの入力は `taskId, acceptanceId, player, neededState, width, input`。Art Directionが追加するのは `shape, typography, color, effect, rationale, rejectedAlternative, screenshot`。実装とQAは同じIDで結果を返す。詳細は[元の受け渡し仕様](https://github.com/RNA4219/anything-frontend-product-design/blob/main/references/handoff.md)。

## 4. 新しい意匠の採用ルール
- 意匠比較は**内容・残量・操作数を同一**にして行う。格好いいけど実ゲームの違う状態になっている比較を禁止。
- 同じ操作が可能なら、**マモ拳らしい微細な手触り**（耳・拳・山・毛並みなど）で選ぶ余地を残す。機能差がないからといって無意味な表現扱いしない。
- 世界観の説明を増やすだけのものは却下。ただし必要な技名や意味も「削って綺麗」は禁止。
- 作品実例を引用する場合、元の制作者の意図と自分の観察/想像を明確に分離。画面や素材のコピーはしない。
- 外部コードや作例の著作権条件は参照元[LICENSE (MIT)](https://github.com/RNA4219/anything-frontend-art-direction/blob/main/LICENSE) と[NOTICE](https://github.com/RNA4219/anything-frontend-art-direction/blob/main/NOTICE.md)に沿う。本書は独自の設計であり、元のコードを複製していない。第三者事例/フォントは独自の許諾条件を確認する。
- この方法は今後のモード選択/キャラ選択/対戦/Creator/Story/結果にも同じ受入条件IDの運用で広げる。単発UIの改修手順ではない。

## 5. 今回の実装/検証実体
- 比較用HTMLのソース：[`prototypes/actd-hud-layout-lab.html`](prototypes/actd-hud-layout-lab.html)。外部ネットワーク/ライブラリなし、HTML+SVG+CSS+JSで作った独自試作。
- **ACT-D×HUD-G×LAYOUT-F の組合せを比較する独立モック**。実マモ拳のGLB、ダメージ計算、指の実操作、SEはない。
- 構図の座標と継続QA条件は[16章](16_combat_ui_blueprints.md)に記録する。
- Figmaの従来のB×A案と今回のモックを比較することはできるが、**Figma自体の最終UIグラフィックは未承認**のまま。

## 6. 一行レビューで終わらせない
失敗例：「画面がまだAIっぽいから線を減らす」。採用可能なレビュー例：「残HPと奥義の炎が同じ位置へ注意を奪う。奥義READYはゲージ先端に限定し、ダメージ直後のHP読み取りが一瞬でも妨げられないようにする」。つまり**現象→利用者の判断→原因→必要な変更→同条件での再検証**までが1件のレビュー。
