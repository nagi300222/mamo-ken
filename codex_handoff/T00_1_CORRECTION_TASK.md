# T00.1監査補正

PR #17で追加された監査ツールは、source/dist比較元を実際のビルド元`prototype/mamoken_prototype_v01.html`ではなく、Pagesリダイレクト用`index.html`に設定している。

`tools/build_mobile.mjs`の実際の入力は`prototype/mamoken_prototype_v01.html`であるため、次を補正する。

- Runtime source / Pages entry / build script / distを別々に記録する。
- source/dist比較はruntime sourceとdistから`BAL`、`CHARS`、`POSE_IDS`を抽出して比較する。
- `index.html`はdistへのredirectだけを検証する。
- build scriptがruntime sourceを入力にしていることを検証する。
- 一致条件がfalseなら監査スクリプトを失敗させる。
- `reports/design_audit_v1.md`の「Mobile build source: index.html」を訂正する。
- `reports/current_impl_sync_scope.md`を再生成する。

Runtime/BAL/assets/server/distの変更は禁止。