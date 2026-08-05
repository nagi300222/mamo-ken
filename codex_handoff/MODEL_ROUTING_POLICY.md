# Codex モデル切替ポリシー — マモ拳 T00／T02

## 目的

作業内容に対して過剰なモデルを常用せず、必要な局面だけ高推論モデルへ切り替える。

利用可能なモデル名はCodex環境・プラン・時期により異なるため、以下の役割へ読み替える。

- **FAST**：最も高速・低消費の実用モデル
- **CODE**：通常の実装・テストに適した標準Codexモデル
- **REASONING**：最も強い推論・設計レビュー向けモデル

環境に `Auto` があり、作業別の適切なモデル選択が保証される場合はAutoを使ってよい。ただし、下記のREASONING必須局面では明示的な高推論モデルを優先する。

## 重要な制約

Codex自身がセッション中にモデルを変更できない環境では、勝手に変更したと報告しない。

その場合は次のどちらかを行う。

1. 現在モデルで安全に完了できる範囲まで進める。
2. 切替が必要な地点で `MODEL_SWITCH_RECOMMENDED` を報告し、作業状態をファイルへ保存する。

モデル切替だけを理由に、監査・検索・テストなど安全な機械作業を止めない。

---

# 1. FASTを使う作業

次はFASTで行う。

- ファイル一覧・ブランチ確認
- `rg`、`find`、`git grep`
- 定数・phase・flow・poseIdの機械抽出
- 既知パターンのJSON化
- Markdownテンプレートへの転記
- `git diff --check`
- build／testの再実行
- ログ整理
- 既に設計が確定した小さな機械編集
- 同じテストの再試行
- Fable5向けレポートの事実欄作成

FASTで判断を伴う仕様変更を行わない。

---

# 2. CODEを使う作業

次はCODEを基本とする。

- `tools/audit_current_impl.mjs`の実装
- 監査JSON生成
- Core contractsの実装
- validationの実装
- current／provisional／legacy定数層の実装
- stable serializationの実装
- state hash utilityの実装
- Nodeテストの実装
- build scriptへの安全な接続
- source／dist整合テスト
- Draft PR作成
- 軽微なテスト失敗の修正

設計が指示書で決まっている限り、CODEで完了させる。

---

# 3. REASONINGを使う作業

次はREASONINGへ切り替えるか、切替推奨を報告する。

## T00

- 現行コードの処理順からKO／Ult／Gyuiin競合を解釈する
- `Math.random`がcore結果へ影響するか判定する
- Online lockstepの同期範囲と欠落状態を判定する
- stale commentと実挙動のどちらが正しいか確定する
- 正本との差が単なるLegacyかP0 blockerか判定する

## T02

- 単一HTMLから定数層を切り出す方式の選定
- 手書き二重管理を避けるbuild設計
- canonical snapshotのincluded／excluded field判断
- PRNG stateをsnapshotへ含める方式
- stable hashのversion設計
- 現行phaseとv2.7 target phaseのmapping
- Online protocolを変えずに決定論テストを成立させる設計
- 10,000Fテストで不一致が出た際の原因分離
- Runtime behavior 0差分の最終レビュー

## Merge前

- T00 Draft PRの最終自己レビュー
- T02 Draft PRの最終自己レビュー
- Fable5へ送る論点の圧縮
- `MERGE_GO / CHANGES_REQUIRED / HOLD`候補の根拠整理

---

# 4. モデル切替フロー

各Phase開始時に、次を内部判断する。

```text
TASK_COMPLEXITY: MECHANICAL / IMPLEMENTATION / ARCHITECTURE
CURRENT_MODEL_ROLE: FAST / CODE / REASONING / UNKNOWN
RECOMMENDED_MODEL_ROLE: FAST / CODE / REASONING
SWITCH_AVAILABLE: YES / NO / UNKNOWN
```

ユーザーへ毎回表示する必要はない。モデル切替が必要なのに不可能な場合、完了報告へ次を記載する。

```text
MODEL_SWITCH_RECOMMENDED
Task:
Current model:
Recommended role:
Reason:
Saved state:
Safe continuation point:
```

## 自動切替可能な場合

- 切替後、同じタスク状態から継続する。
- モデル変更をコミット理由にしない。
- モデルごとに別の設計判断を無断で採用しない。

## 自動切替不可能な場合

- FAST作業は続行する。
- CODE作業は、指示が明確なら続行する。
- REASONING必須判断だけを保留する。
- `reports/CODEX_SESSION_LOG.md`へ引継ぎ状態を残す。

---

# 5. トークン節約ルール

- リポジトリ全体を毎回読み直さない。
- 先に`rg`で対象行を絞る。
- 同じ巨大HTMLを複数モデルへ丸ごと渡さない。
- T00監査JSONをT02の入力として再利用する。
- build／testログは全文ではなく、失敗箇所と最終結果を保存する。
- 高推論モデルへ渡す情報は、該当関数、差分、正本箇所、質問に限定する。
- Fable5向けレポートは最後に一度だけ統合する。

---

# 6. T00推奨ルーティング

| 作業 | 役割 |
|---|---|
| Repo探索 | FAST |
| regex監査スクリプト | CODE |
| phase／flow抽出 | FAST → CODE |
| 咆哮／S Gauge数値抽出 | FAST |
| Gyuiin差分抽出 | FAST |
| KO／Ult／Gyuiin優先順位判定 | REASONING |
| Online同期範囲判定 | REASONING |
| JSON／Markdown生成 | CODE |
| build／test | FAST |
| T00最終レビュー | REASONING |

---

# 7. T02推奨ルーティング

| 作業 | 役割 |
|---|---|
| T00成果の読込 | FAST |
| Core contracts実装 | CODE |
| 定数分離方式選定 | REASONING |
| 定数・adapter実装 | CODE |
| Snapshot field設計 | REASONING |
| Snapshot／hash実装 | CODE |
| 10,000F fixture実装 | CODE |
| 不一致原因分析 | REASONING |
| build／test反復 | FAST／CODE |
| PR差分の最終監査 | REASONING |
| Fable5 rollup事実欄 | FAST |
| Fable5判断論点整理 | REASONING |

---

# 8. 品質優先順位

1. 現行挙動を変えない
2. 正本と現行実装を混同しない
3. Online決定論を壊さない
4. 証拠を残す
5. モデル消費を抑える

低消費を優先して誤った設計判断を確定しない。一方、単純検索やテスト再実行へ高推論モデルを浪費しない。
