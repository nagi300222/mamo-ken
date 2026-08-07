# マモ拳 アート素材 GitHub納品

更新日: 2026-08-08

このディレクトリは、現行の2D戦闘アートをゲームへ統合するための正規納品物です。

## 役割分担

- この納品: アート素材、監査、サイズ比、実装方法、差し替え方針を提供する。
- 戦闘設計側: BAL、63技の特殊挙動、固有能力を決定する。
- 新規の実装Chat / Work: GitHub上の素材と仕様を読んで実コードへ統合する。
- アート側は `Delay / Feint / Pressure / Just / Charge / Iron Wall / 暗連` 等を独自推測して実装しない。

## 重要な実装前提

`assets/art/current/**` の元画像は、現時点では **白背景を持つRGB PNG** です。runtime-ready alpha PNGではありません。

そのため、新しいimporterでは:

1. シートをセルへ分割
2. **外周から連結している近似白背景だけ**を透過
3. 内部の白色（ヨミカゲ包帯、明るい毛、ハイライト等）は保持
4. runtime用alpha PNGを生成
5. runtimeではalphaを正として読み込み、旧 `whitenAsset()` を適用しない

という順で処理してください。

## ディレクトリ

- `assets/art/current/` — 最新戦闘シート
- `assets/art/cutins/` — 奥義カットイン
- `assets/art/legacy_common24/` — 最新素材にない状態のfallback
- `assets/art/archive/` — 採用外だが履歴保持する素材
- `data/art/art_manifest.json` — 実装用のsource manifest
- `docs/art/IMPLEMENTATION_METHOD.md` — 実装仕様
- `docs/art/ART_AUDIT.md` — 現行監査
- `docs/art/KNOWN_DEBT_AND_REPLACEMENT_PLAN.md` — 妥協点と差し替え計画

## 基本方針

完璧な画像待ちで実装を止めません。
大きな破綻がないものは一度ゲームへ入れ、実機で目立つフレームだけ後日交換します。

VFXは今回含みません。別納品です。
