# v17 P3｜27必殺の評価・接触実測表（正確時刻・補間なし）｜r2 版

「据え置き（時計を焼き直し）」は v14 と同じ演技の関数を、v17 の契約（当たり姿勢を 2F 早める時間詰めなし）で焼き直したもの。**v14 のクリップとバイト同一ではない**（キーの時刻が違う）。「作り直し」は評価で直した 3 本。
reach は接触時刻、「最大」は持続中のいちばん前（i は持続フレーム）。高さは root 基準の符号付き。飛び道具の「発射ソケット」は fx_anchor 骨の 前方 / 高さ。

| キャラ | 技 | 名前 | 扱い | 種類 / 重さ | 攻撃部位 | reach | 最大 | 高さ | 発射ソケット | 持続F | 注意 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| moguzo | s1 | 大地の波 | 据え置き（時計を焼き直し） | projectile / mid | pawR | 0.526 | 0.526 (i=0) | 0.167 | pawR 0.469 / 0.122 | 2 |  |
| moguzo | s2 | 昇り拳 | r2 で調整（r1 は reach 0.222 / 高さ 0.800） | antiair / mid | pawR | 0.291 | 0.291 (i=0) | 0.461 |  | 8 |  |
| moguzo | s3 | 地走り | 据え置き（時計を焼き直し） | rush / mid | pawL+pawR | 0.490 | 0.490 (i=0) | 0.369 |  | 5 |  |
| pisuke | s1 | 風の気弾 | 据え置き（時計を焼き直し） | projectile / light | footR | 0.345 | 0.345 (i=0) | 0.222 | footR 0.256 / 0.211 | 1 |  |
| pisuke | s2 | 空牙蹴り | 据え置き（時計を焼き直し） | antiair / light | footR | 0.186 | 0.186 (i=1) | 0.436 |  | 8 |  |
| pisuke | s3 | 連脚 | 据え置き（時計を焼き直し） | rush / light | footR | 0.400 | 0.400 (i=0) | 0.129 |  | 9 |  |
| godan | s1 | 地割り | 据え置き（時計を焼き直し） | strike / heavy | footR | 0.297 | 0.297 (i=0) | 0.008 |  | 5 |  |
| godan | s2 | 岩砕き | r2 で調整（r1 は reach 0.172 / 高さ 0.582） | antiair / heavy | pawL+pawR | 0.346 | 0.346 (i=0) | 0.526 |  | 7 |  |
| godan | s3 | 肩当て突進 | 作り直し | rush / heavy | shoulderL | 0.389 | 0.389 (i=0) | 0.264 |  | 7 |  |
| hakuma | s1 | 雪壁掌 | 据え置き（時計を焼き直し） | strike / mid | pawR | 0.488 | 0.501 (i=5) | 0.421 |  | 6 |  |
| hakuma | s2 | 白峰対空 | 据え置き（時計を焼き直し） | antiair / mid | pawR | 0.221 | 0.223 (i=6) | 0.622 |  | 7 |  |
| hakuma | s3 | 連続突っ張り | r2 で調整（r1 は reach 0.493 / 高さ 0.423） | rush / mid | pawL+pawR | 0.554 | 0.558 (i=3) | 0.408 |  | 9 |  |
| chirka | s1 | だまし突き | 据え置き（時計を焼き直し） | strike / light | pawL | 0.449 | 0.453 (i=3) | 0.210 |  | 4 |  |
| chirka | s2 | 跳ね爪 | 据え置き（時計を焼き直し） | antiair / light | pawR | 0.215 | 0.226 (i=1) | 0.667 |  | 7 |  |
| chirka | s3 | 影引き爪 | 作り直し | rush / mid | pawR | 0.494 | 0.494 (i=0) | 0.222 |  | 5 |  |
| takimaru | s1 | 大地走り | 据え置き（時計を焼き直し） | projectile / mid | pawL+pawR | 0.485 | 0.485 (i=0) | 0.105 | pawR 0.392 / 0.010 | 1 |  |
| takimaru | s2 | 抱え上げ | r2 で調整（r1 は reach 0.015 / 高さ 0.512） | antiair / heavy | pawL+pawR | 0.447 | 0.447 (i=0) | 0.555 |  | 7 |  |
| takimaru | s3 | 抱え込み | 据え置き（時計を焼き直し） | grab / heavy | pawL+pawR | 0.649 | 0.649 (i=0) | 0.323 |  | 3 |  |
| yomikage | s1 | 残月の波 | 据え置き（時計を焼き直し） | projectile / light | pawR | 0.301 | 0.301 (i=0) | 0.403 | pawR 0.236 / 0.394 | 1 |  |
| yomikage | s2 | 昇り肘 | r2 で調整（r1 は reach 0.143 / 高さ 0.531） | antiair / mid | elbowR | 0.315 | 0.315 (i=0) | 0.470 |  | 7 |  |
| yomikage | s3 | 受け返し | 据え置き（時計を焼き直し） | counter / mid | pawL | 0.164 | 0.164 (i=0) | 0.439 |  | 13 |  |
| bullet | s1 | 木の実弾 | 据え置き（時計を焼き直し） | projectile / mid | tail | -0.083 | -0.083 (i=0) | 0.234 | tail_03 -0.239 / 0.276 | 1 |  |
| bullet | s2 | 尾跳ね | r2 で調整（r1 は reach -0.104 / 高さ 0.380） | antiair / mid | tail | 0.286 | 0.286 (i=0) | 0.535 |  | 7 |  |
| bullet | s3 | 尾薙ぎ | 据え置き（時計を焼き直し） | strike / heavy | tail | 0.473 | 0.682 (i=5) | 0.217 |  | 6 |  |
| dark_moguzo | s1 | 黒い地走波 | 作り直し | projectile / light | pawR | 0.415 | 0.415 (i=0) | 0.234 | pawR 0.342 / 0.220 | 1 |  |
| dark_moguzo | s2 | 逆昇撃 | 据え置き（時計を焼き直し） | antiair / mid | pawL | 0.264 | 0.264 (i=7) | 0.551 |  | 8 |  |
| dark_moguzo | s3 | 暗連 | 据え置き（時計を焼き直し） | rush / light | pawL+pawR | 0.461 | 0.531 (i=7) | 0.146 |  | 9 |  |
