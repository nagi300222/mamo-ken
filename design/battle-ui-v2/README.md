# battle-ui-v2：戦闘ボタンと上部HUDのビジュアル v2

- 仕様の正本：[docs/ui-bible/20_battle_visual_v2.md](../../docs/ui-bible/20_battle_visual_v2.md)
- Codexへの依頼文：[CODEX_TASK.md](CODEX_TASK.md)
- 素材（ゲームにはまだ接続していない）
  - `exp/fable-3d/shared-ui/battle-control-art-v2.js`：ボタン6個のSVGレイヤー・記号・状態色
  - `exp/fable-3d/shared-ui/matte-battle-v2.css`：ボタン状態とHUDの参照CSS
- `preview.html`：全ボタン×全状態のボード。リポジトリのルートで `python3 -m http.server 4173` を起動して `/design/battle-ui-v2/preview.html` を開く
- `verify-overlay.cjs`：v2 を PR #230 の実ゲームに重ね、当たり判定の不変・HUDとXボタンの重なりを測って撮影する
- `render-board.cjs`：`preview.html` を画像にする
- `evidence/`：`pr230-*` が現状、`v2-*` が v2 を重ねた画面。`hit-area-report.json` が当たり判定の実測値（`before`＝PR #230、`after`＝v2）
