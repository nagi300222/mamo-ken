# VIS-R1.1 (1) facesq_*.png 再生成レポート(手動テーブル方式)

ソース: assets/portraits/{id}.png。自動顔検出(tools/face_metrics.mjs)は拳・爪を鼻と誤検出
するため、tools/facesq_manual_table.mjsの手動クロップテーブル(発注者検収済み)を一次ソースとし、
未登録キャラのみ自動検出へフォールバックする。

| charId | ソース | クロップ辺(px) |
|---|---|---|
| moguzo | manual(cx=0.619,cy=0.159,r=0.221) | 365 |
| pisuke | manual(cx=0.476,cy=0.111,r=0.221) | 379 |
| godan | manual(cx=0.52,cy=0.105,r=0.235) | 426 |
| hakuma | manual(cx=0.395,cy=0.144,r=0.221) | 447 |
| chirka | manual(cx=0.365,cy=0.203,r=0.221) | 485 |
| takimaru | manual(cx=0.504,cy=0.142,r=0.221) | 474 |
| yomikage | manual(cx=0.55,cy=0.17,r=0.18) | 316 |
| bullet | manual(cx=0.68,cy=0.101,r=0.221) | 405 |
| dark_moguzo | manual(cx=0.619,cy=0.159,r=0.221) | 381 |

チェックシート: `reports/vis/facesq_check_sheet.png`
