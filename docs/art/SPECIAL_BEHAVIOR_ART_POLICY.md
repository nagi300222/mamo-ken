# 特殊挙動とアートの責任境界

`Delay / Feint / Pressure / Just / Charge / Overcharge / Iron Wall / 暗連 / CLINCH / CHASE_TO_CONTACT` 等は、
**アート実装側ではなく戦闘設計側を正**とする。

アート側は現在の1×4を「演技素材」として提供するだけで、特殊ルールを推測して戦闘コードへ追加しない。

## 仕様確定後に許可するmapping

- F1のみ
- F1→F2
- F2長時間hold
- F3成功時hold
- F1/F2をキャンセルしてidleへ戻す
- 同一frameの再利用
- render-only offset / scale / shake
- hitstop中のframe hold

## 追加アートを要求する基準

既存4Fとコード補間だけでは:
1. プレイヤーが技意図を誤認する
2. 攻撃前後の身体接続が成立しない
3. clinch等で相手との関係が視覚的に成立しない
4. MAX/成功版が通常版と区別不能でゲーム上重要

のいずれかになる場合だけ。

依頼形式:
- charId
- moveId
- 特殊挙動名
- 必要frame
- 既存F1〜F4で代用できない理由
- frameを表示するsimulation section
