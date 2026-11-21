# マモ拳3D 山岳道場｜全9キャラ・横画面CPU対戦

GitHub [Issue #142](https://github.com/nagi300222/mamo-ken/issues/142) に基づく**独立した遊べる試作**。
元の3D実験（[Draft PR #141](https://github.com/nagi300222/mamo-ken/pull/141)）にある9体のGLB（10共通＋1固有モーション）を読み込む。mainへのマージは行わない。

## プレイ内容
- 9キャラから選択、CPU相手の1ラウンド対戦、75秒／体力／スーパーゲージ／KO／再戦
- 立弱・立強・しゃがみ弱強・空中弱強、各キャラ3必殺・奥義・投げ
- 前後移動、後ろガード、しゃがみガード、ジャンプ、前後ステップ（左右2回タップ、または方向＋ステップ）
- 飛び道具、尾薙ぎ、hitstop、押し合いと暫定的な固有能力
- PCキーボードとスマホ横画面のマルチタッチ入力

## Windows / Macでローカル実行
Node.js 20以上、WebGL2対応のブラウザ。依存追加不要。

リポジトリのルートから:
```bash
cd exp/fable-3d/dojo
npm test
npm start
```
ブラウザ: `http://127.0.0.1:4173/exp/fable-3d/dojo/`

PC操作: 矢印またはWASDで移動とジャンプ/しゃがみ、Z弱、X強、1/2/3で必殺、V投げ、Q奥義、Cステップ。後ろ方向でガード。方向キーを素早く2回でもステップ。

スマホ: 左側の方向ボタンと右側の攻撃パネルを同時押し。低負荷のため9GLBを一度に転送せず、選択した2キャラだけを読み込む。ボタンは対戦ステージの下段に分けてある。

## Cloudflare Pages
まず最小アセットのみ出力:
```bash
npm run build:pages
```
リポジトリルートからでも `node exp/fable-3d/dojo/build-pages.mjs` で同じ。出力は `exp/fable-3d/_pages/`。9GLB、Three.jsローカルモジュール、選択画像、ゲームコードだけを含み、元の動画や.blendは配信しない。

**Cloudflare Pages Git連携の場合**：
- GitHub: `nagi300222/mamo-ken`
- プレビュー対象ブランチ: `feat/mamoken-3d-mobile-fight`
- ビルドコマンド: `node exp/fable-3d/dojo/build-pages.mjs`
- ビルド出力ディレクトリ: `exp/fable-3d/_pages`
- ルート `/ `から`/dojo/`へ自動案内。キャラ選択後に対戦可能。
- 実際のプレビューURLはCloudflareにビルド結果が存在してから確認すること。GitHub PRがあるだけではデプロイ済みと扱わない。

**Wrangler Direct Upload**（Cloudflareに認証済みで既存Pagesプロジェクト名が分かる場合）:
```bash
npx wrangler pages deploy exp/fable-3d/_pages --project-name <既存Pagesプロジェクト名> --branch feat/mamoken-3d-mobile-fight
```
Cloudflareアカウント認証とアップロード権限が必要。<プロジェクト名>は例ではなく実名に置き換える。GitHub Actionsのプレビュー自動アップロードは`CLOUDFLARE_API_TOKEN`・`CLOUDFLARE_ACCOUNT_ID`のSecretsと`CLOUDFLARE_PAGES_PROJECT`の変数がある場合のみ動作。

## モデル差し替え（造形修正後）
**ゲームロジックを変更せず**差し替え可能。
1. `exp/fable-3d/chars/<id>/<id>.glb` を新モデルへ更新する（同じIDとクリップ名を推奨）。
2. 必要なら `<id>_motions.json` も更新。バレットの尾先端軌道が変わる場合は `balance.js`の`tailTipAt`も形状に合わせて再生成・再検証する。
3. `dojo/models.js` の `MODEL_REVISION` を更新してキャッシュを更新。
4. `npm test` → `npm run build:pages` → Cloudflareプレビューで差し替え確認。

強攻撃等のアニメ名の対応表は `models.js` にあり、GLB側に専用モーションがない場合は既存クリップを仮流用する。造形修正が技フレーム・ダメージ・判定へ勝手に影響しない設計。

## 未完成・未検証
これは**対戦可能な最初のバランス試作**であり、完成ゲームではない。
技の6種はゲームロジック側にはあるが、個別の完成アニメは未制作。音声・ギュイーン・オンライン・投げ演出・高度なコンボ・全キャラ新しい必殺専用モーションは未対応。
CPU強度と対人バランスは未調整。スマホ実機（iOS Safari/Android Chrome）のGPU、発熱、指での押しやすさは未測定。
描画・操作のブラウザ実機検証はCloudflareにプレビューをデプロイした後の追加ゲートにする。
数値と技の一覧は [BALANCE.md](BALANCE.md)。
