# Fable5共有 — アート実装の役割分離

2026-08-08時点で、アート実装は専用の新規Chat / Workへ分離する。

Fable5 / 戦闘設計側は:
- 63技特殊挙動
- 固有能力
- BAL
- Delay / Feint / Pressure / Just / Charge / Iron Wall / 暗連 等
- online deterministic上の整合
をauthorityとして管理する。

アート納品側は:
- 画像
- manifest
- サイズ比
- 監査
- Dark recolor仕様
- 2P仕様
- animation mapping方針
をGitHubへ置く。

実際の統合コードはアート実装専用Chat / Workで行う。

特殊挙動の結果として追加アートが本当に必要な場合だけ、以下でアート側へ返す:

- charId
- moveId
- 特殊挙動
- 必要な追加frame
- 既存4Fで成立しない理由

VFXはさらに別工程。今回の納品には含めない。
