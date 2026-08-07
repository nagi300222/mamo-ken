# VIS-R1 (3) ポーズ別スケール補正レポート

## キャラ別基準(reference headSize)

| charId | reference | source | 計測ポーズ数 | 信頼できたポーズ数 |
|---|---|---|---|---|
| moguzo | 131.42 | median(fallback: idle unreliable) | 27 | 6 |
| pisuke | 129.90 | median(fallback: idle unreliable) | 27 | 12 |
| godan | 81.78 | median(fallback: idle unreliable) | 27 | 3 |
| hakuma | 150.73 | idle | 24 | 20 |
| chirka | 179.80 | idle | 24 | 11 |
| takimaru | 112.29 | median(fallback: idle unreliable) | 24 | 7 |
| yomikage | 117.47 | idle | 24 | 14 |
| bullet | 109.51 | idle | 24 | 19 |
| dark_moguzo | 120.86 | median(fallback: idle unreliable) | 24 | 3 |

## ±10%超の補正が入ったポーズ(50件)

| charId | poseId | headSize | scale | note |
|---|---|---|---|---|
| moguzo | cmd1 | 164.6 | 0.850 | クランプ前0.798 |
| moguzo | cmd2 | 98.2 | 1.200 | クランプ前1.338 |
| pisuke | cmd2 | 92.0 | 1.200 | クランプ前1.413 |
| pisuke | cmd3 | 161.2 | 0.850 | クランプ前0.806 |
| pisuke | grab_lift | 115.0 | 1.130 |  |
| pisuke | hurt | 58.2 | 1.200 | クランプ前2.234 |
| pisuke | sway | 152.8 | 0.850 |  |
| godan | getup | 70.4 | 1.161 |  |
| hakuma | atk_high | 114.8 | 1.200 | クランプ前1.313 |
| hakuma | atk_low | 126.8 | 1.189 |  |
| hakuma | atk_mid | 127.8 | 1.179 |  |
| hakuma | crouch | 169.8 | 0.888 |  |
| hakuma | getup | 127.8 | 1.179 |  |
| hakuma | grab_lift | 110.6 | 1.200 | クランプ前1.363 |
| hakuma | grab_reach | 85.7 | 1.200 | クランプ前1.759 |
| hakuma | mikiri | 118.9 | 1.200 | クランプ前1.267 |
| hakuma | roar | 134.1 | 1.124 |  |
| hakuma | roar_charge | 133.3 | 1.131 |  |
| hakuma | tele_low | 131.2 | 1.149 |  |
| hakuma | ult_charge | 126.0 | 1.196 |  |
| hakuma | win | 111.1 | 1.200 | クランプ前1.357 |
| chirka | crouch_atk | 157.7 | 1.140 |  |
| chirka | lunge | 157.3 | 1.143 |  |
| chirka | roar_charge | 144.9 | 1.200 | クランプ前1.241 |
| chirka | sway | 159.2 | 1.130 |  |
| chirka | win | 156.0 | 1.153 |  |
| takimaru | atk_low | 69.6 | 1.200 | クランプ前1.613 |
| takimaru | grabbed | 41.1 | 1.200 | クランプ前2.730 |
| takimaru | roar_charge | 69.3 | 1.200 | クランプ前1.620 |
| takimaru | tele_low | 132.4 | 0.850 | クランプ前0.848 |
| takimaru | tele_mid | 139.6 | 0.850 | クランプ前0.804 |
| yomikage | atk_low | 85.2 | 1.200 | クランプ前1.378 |
| yomikage | crouch | 94.4 | 1.200 | クランプ前1.244 |
| yomikage | crouch_atk | 91.5 | 1.200 | クランプ前1.283 |
| yomikage | getup | 101.3 | 1.160 |  |
| yomikage | grab_lift | 95.8 | 1.200 | クランプ前1.226 |
| yomikage | grab_reach | 93.0 | 1.200 | クランプ前1.263 |
| yomikage | hurt | 47.6 | 1.200 | クランプ前2.467 |
| yomikage | ko | 61.7 | 1.200 | クランプ前1.904 |
| yomikage | mikiri | 83.2 | 1.200 | クランプ前1.412 |
| yomikage | roar | 98.4 | 1.194 |  |
| bullet | atk_high | 96.0 | 1.140 |  |
| bullet | atk_low | 88.6 | 1.200 | クランプ前1.237 |
| bullet | atk_mid | 97.2 | 1.126 |  |
| bullet | getup | 92.0 | 1.191 |  |
| bullet | grab_reach | 96.2 | 1.138 |  |
| bullet | mikiri | 94.8 | 1.155 |  |
| bullet | roar_charge | 96.8 | 1.131 |  |
| bullet | tele_low | 99.0 | 1.106 |  |
| bullet | ult_charge | 90.7 | 1.200 | クランプ前1.207 |

全データ: `reports/vis/pose_scale_corrections.csv`
