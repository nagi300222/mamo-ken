# Codex Cloud 新規チャット起動指示 — T00再実行

## Repository

- URL: `https://github.com/nagi300222/mamo-ken.git`
- Full name: `nagi300222/mamo-ken`
- Base branch: `main`
- Expected base commit: `6f707d171da9dbbcfec1e3ba1bd08d333d480500`
- Handoff branch: `ops/codex-handoff-t00-t02`

## 起動

現在地がGitリポジトリでなければ、作業領域へcloneしてください。

```bash
cd /workspace 2>/dev/null || cd "$HOME"
rm -rf mamo-ken

git clone https://github.com/nagi300222/mamo-ken.git mamo-ken
cd mamo-ken

git fetch origin main ops/codex-handoff-t00-t02
git switch main
git reset --hard origin/main

git show origin/ops/codex-handoff-t00-t02:codex_handoff/START_HERE_T00_T02.md
git show origin/ops/codex-handoff-t00-t02:codex_handoff/MODEL_ROUTING_POLICY.md
```

2つの指示書を適用し、まずT00のみ実行してください。

## T00

- Branch: `audit/current-impl-v1`
- Runtime / BAL-bearing source / assets / server / dist: 変更禁止
- 監査成果物、監査スクリプト、完了報告だけを追加
- Draft PRまで作成
- マージ禁止

## モデル

- 検索・抽出・ログ整理: FAST
- 監査スクリプト・成果物作成: CODE
- 同期・決定論・最終レビュー: REASONING

セッション中にモデルを切り替えられない場合は、虚偽の切替報告をせず、必要地点で`MODEL_SWITCH_RECOMMENDED`を記録してください。

## GitHub push成功時

```bash
git push -u origin audit/current-impl-v1
```

Draft PRを作成し、PR URLを完了報告へ記録してください。

## GitHub push失敗時の必須フォールバック

pushまたはPR作成に失敗しても、ローカルコミットだけを残して終了してはいけません。

必ず同じセッション内で次を実行してください。

```bash
BASE_SHA=$(git merge-base origin/main HEAD)
mkdir -p /workspace/codex_outputs

git format-patch --stdout "$BASE_SHA"..HEAD \
  > /workspace/codex_outputs/mamoken_T00.patch

git diff --binary "$BASE_SHA"..HEAD \
  > /workspace/codex_outputs/mamoken_T00.diff

cp reports/T00_COMPLETION.md /workspace/codex_outputs/ 2>/dev/null || true
cp reports/design_audit_v1.md /workspace/codex_outputs/ 2>/dev/null || true
cp reports/current_impl_constants.json /workspace/codex_outputs/ 2>/dev/null || true
cp reports/current_impl_phases.json /workspace/codex_outputs/ 2>/dev/null || true
cp reports/current_impl_sync_scope.md /workspace/codex_outputs/ 2>/dev/null || true
cp tools/audit_current_impl.mjs /workspace/codex_outputs/ 2>/dev/null || true

cd /workspace
zip -r mamoken_T00_fallback.zip codex_outputs
sha256sum mamoken_T00_fallback.zip codex_outputs/mamoken_T00.patch
```

次の2ファイルをユーザーがダウンロードできる添付として返してください。

- `/workspace/mamoken_T00_fallback.zip`
- `/workspace/codex_outputs/mamoken_T00.patch`

添付を確認せずにセッションを終了しないでください。

## T02

T00 Draft PRが作成できた場合のみ、`START_HERE_T00_T02.md`のゲートに従って開始してください。

push失敗時はT02を開始せず、T00のpatch／zipを返して停止してください。
