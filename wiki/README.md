# マモ拳 攻略Wiki

## 2つの版を区別する

- [旧2D版 攻略Wiki](index.html)：現行mainの既存の技・固有能力・コンボ・モードの資料。以前のPRESENTATION-R1／WEB-R2の経緯は保持する。**v14の操作や奥義を旧版の確定性能値として混ぜない**。
- [Three.js 3D開発版 v14](v14-development.html)：スマホ横画面の入力（試作）、9体の奥義演出、最新の技制作と自動検証状況、未確認項目の解説。2026-11-22時点の開発資料で、**Draft PR・未マージ／未公開**。

## 旧2D版Wikiの扱い

旧版のWikiは `wiki/index.html` の単体HTML。キャラクター画像等はリポジトリの `assets/` を参照する。本文の数値は旧2Dエンジンから同期された技性能・固有能力・検証済みコンボを正本とする。古いPRESENTATION-R1での27コンボと、後続WEB-R2の再検証後の24コンボを混同しない。

検索エンジン向けのmeta、配布ファイルのバイト長・SHA-256は `WIKI_ENTRY_MANIFEST.json` を参照。旧版indexへ変更を加える場合は同manifestを再計算する。

## 3D版の更新ルール

- 3D版のゲーム本体は `dojo/` とv14制作・統合Draft PRのGitHub実体が技術的正本。公開Wikiが自動で追従するわけではない。
- 本人の確定要件、AIの演出案、実装済みコード、自動検証、実機・見た目の合格を明確に分ける。
- v14の新演出は命中時奥義ムービー。空振り／ガードではムービーに移らない。9体の奥義は約10秒。
- 2026-11-22時点で統合[Draft PR #180](https://github.com/nagi300222/mamo-ken/pull/180)は成功CIあり。続く仕上げ[PR #183](https://github.com/nagi300222/mamo-ken/pull/183)と軽量化[PR #184](https://github.com/nagi300222/mamo-ken/pull/184)は制作・検証中。mainへのマージ、実機採用は未確認。
- 旧2D版の性能・コンボ、3D v0.7の試作ボタン割当、v14演出をひとつの確定版の仕様として混ぜない。

GitHubの変更は目的別のDraft PRを通し、main直接pushをしない。
