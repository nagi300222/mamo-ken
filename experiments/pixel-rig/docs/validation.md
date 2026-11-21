# 検証結果（自動生成）

`node tools/validate.mjs` が書き出したもの。手で編集しない。数値はすべて低解像度バッファ上のピクセル。

## 1. 足滑り

接地指定（`plant`）が続いている足について、連続する2コマの足先の地面座標の差を測った。
地面座標 = セル内の足先位置（描画と同じ整数丸め）＋ そのコマの移動量（`root` と `velocity × 開始フレーム`）。
ループするモーションは最後のコマ→最初のコマも測っている。「連続値」は丸める前の計算値での差。

| キャラ | モーション | 測った区間数 | 最大ずれ X (px) | 最大ずれ Y (px) | 連続値の最大ずれ (px) |
|---|---|---:|---:|---:|---:|
| moguzo | idle | 16 | 0 | 0 | 0 |
| moguzo | walk_f | 6 | 0 | 0 | 0 |
| moguzo | walk_b | 6 | 0 | 0 | 0 |
| moguzo | dash_f | 4 | 0 | 0 | 0 |
| moguzo | crouch | 30 | 0 | 0 | 0 |
| moguzo | jump_n | 4 | 0 | 0 | 0 |
| moguzo | stand_light | 10 | 0 | 0 | 0 |
| moguzo | stand_heavy | 13 | 0 | 0 | 0 |
| moguzo | guard_stand | 16 | 0 | 0 | 0 |
| moguzo | hurt_light | 12 | 0 | 0 | 0 |
| pisuke | idle | 16 | 0 | 0 | 0 |
| pisuke | walk_f | 6 | 0 | 0 | 0 |
| pisuke | walk_b | 6 | 0 | 0 | 0 |
| pisuke | dash_f | 4 | 0 | 0 | 0 |
| pisuke | crouch | 30 | 0 | 0 | 0 |
| pisuke | jump_n | 4 | 0 | 0 | 0 |
| pisuke | stand_light | 8 | 0 | 0 | 0 |
| pisuke | stand_heavy | 8 | 0 | 0 | 0 |
| pisuke | guard_stand | 16 | 0 | 0 | 0 |
| pisuke | hurt_light | 12 | 0 | 0 | 0 |
| godan | idle | 20 | 0 | 0 | 0 |
| godan | walk_f | 14 | 1 | 0 | 1.00 |
| godan | walk_b | 14 | 1 | 0 | 0.50 |
| godan | dash_f | 4 | 0 | 0 | 0 |
| godan | crouch | 30 | 0 | 0 | 0 |
| godan | jump_n | 8 | 0 | 0 | 0 |
| godan | stand_light | 10 | 0 | 0 | 0 |
| godan | stand_heavy | 20 | 0 | 0 | 0 |
| godan | guard_stand | 16 | 0 | 0 | 0 |
| godan | hurt_light | 12 | 0 | 0 | 0 |

キャラごとの最大値: moguzo 0px / pisuke 0px / godan 1px

補足: 歩きは絵の更新が毎フレームではない（`step` フレームごと）ので、ゲーム側が毎フレーム等速で動かすと、絵が更新されるまでの間は足が `velocity × (step−1)` px だけ先に進んで見える。これはコマ送りのスプライト全般に付く揺れで、上の表には含めていない。

| キャラ | モーション | velocity (px/f) | step (f) | コマ間の見かけの揺れ (px) |
|---|---|---:|---:|---:|
| moguzo | walk_f | 0.750 | 4 | 2.25 |
| moguzo | walk_b | -0.500 | 4 | 1.50 |
| pisuke | walk_f | 1.000 | 3 | 2.00 |
| pisuke | walk_b | -0.667 | 3 | 1.33 |
| godan | walk_f | 0.500 | 4 | 1.50 |
| godan | walk_b | -0.250 | 4 | 0.75 |

## 2. モーション間の大きさ・足元原点

パーツは拡大縮小せずに回転と移動だけで描いているので、頭や胴体そのものの大きさはどのコマでも同じ。
ここでは「単発モーションの最後のコマが構え（idle の1コマ目）と同じ高さに戻っているか」と、「接地しているコマの最下端がいつも同じ行か」を確かめた。

| キャラ | モーション | 最初のコマの高さ | 最後のコマの高さ | 最後のコマと構えの高さの差 | 接地コマの最下端の行（原点行=0） | コマ全体の高さの幅 |
|---|---|---:|---:|---:|---|---:|
| moguzo | idle | 110 | 110 | — | 0 | 109〜110 |
| moguzo | walk_f | 109 | 110 | — | 0 | 109〜110 |
| moguzo | walk_b | 111 | 111 | — | 0 | 111〜112 |
| moguzo | dash_f | 106 | 110 | — | 0 | 104〜110 |
| moguzo | crouch | 110 | 110 | 0 | 0 | 80〜110 |
| moguzo | jump_n | 103 | 110 | 0 | 0 | 103〜113 |
| moguzo | stand_light | 111 | 110 | 0 | 0 | 109〜111 |
| moguzo | stand_heavy | 111 | 110 | 0 | 0 | 105〜111 |
| moguzo | guard_stand | 110 | 110 | 0 | 0 | 109〜110 |
| moguzo | hurt_light | 111 | 110 | 0 | 0 | 110〜111 |
| pisuke | idle | 111 | 111 | — | 0 | 109〜111 |
| pisuke | walk_f | 110 | 110 | — | 0 | 110〜111 |
| pisuke | walk_b | 113 | 113 | — | 0 | 113〜114 |
| pisuke | dash_f | 103 | 111 | — | 0 | 95〜111 |
| pisuke | crouch | 111 | 111 | 0 | 0 | 88〜111 |
| pisuke | jump_n | 98 | 111 | 0 | 0 | 98〜117 |
| pisuke | stand_light | 111 | 111 | 0 | 0 | 109〜111 |
| pisuke | stand_heavy | 115 | 111 | 0 | 0 | 111〜116 |
| pisuke | guard_stand | 111 | 111 | 0 | 0 | 111〜112 |
| pisuke | hurt_light | 114 | 111 | 0 | 0 | 111〜114 |
| godan | idle | 117 | 117 | — | 0 | 116〜117 |
| godan | walk_f | 115 | 116 | — | 0 | 115〜117 |
| godan | walk_b | 118 | 118 | — | 0 | 118〜119 |
| godan | dash_f | 113 | 117 | — | 0 | 110〜117 |
| godan | crouch | 117 | 117 | 0 | 0 | 101〜117 |
| godan | jump_n | 107 | 117 | 0 | 0 | 107〜121 |
| godan | stand_light | 118 | 117 | 0 | 0 | 116〜118 |
| godan | stand_heavy | 119 | 117 | 0 | 0 | 111〜119 |
| godan | guard_stand | 117 | 117 | 0 | 0 | 116〜117 |
| godan | hurt_light | 120 | 117 | 0 | 0 | 117〜120 |

最下端の行 0 は、足裏の1px下に付く外周アウトラインの行。全モーションで 0 なら足元原点はそろっている。dash_f は移動して終わるので、最後のコマは「移動後の構え」。

## 3. 体格比

身長は、背骨の角度をすべて 0 にした基準姿勢（足の位置と腰の高さは構えのまま）で、耳の先から足裏までを測った。幅は胴体グループ（骨盤・腹・胸・近い側の太もも）だけを描いたときの最大幅。

| キャラ | 基準姿勢の身長 (px) | 比 | 目標 | 構えの高さ (px) | 胴体の最大幅 (px) | 比 | 目安 |
|---|---:|---:|---:|---:|---:|---:|---:|
| moguzo | 109 | 1.000 | 1 | 108 | 55 | 1.000 | 1 |
| pisuke | 112 | 1.028 | 1.03 | 109 | 49 | 0.891 | 0.9 |
| godan | 117 | 1.073 | 1.08 | 115 | 68 | 1.236 | 1.25 |

## 4. ソルバの警告

| キャラ | モーション | IKが届かないコマ | 地面めり込み補正が働いたコマ（最大押し上げ px） |
|---|---|---:|---|
| moguzo | idle | 0 | 0 |
| moguzo | walk_f | 0 | 0 |
| moguzo | walk_b | 0 | 0 |
| moguzo | dash_f | 0 | 0 |
| moguzo | crouch | 0 | 12（3.2） |
| moguzo | jump_n | 0 | 2（1.9） |
| moguzo | stand_light | 0 | 0 |
| moguzo | stand_heavy | 0 | 0 |
| moguzo | guard_stand | 0 | 0 |
| moguzo | hurt_light | 0 | 0 |
| pisuke | idle | 0 | 0 |
| pisuke | walk_f | 0 | 0 |
| pisuke | walk_b | 0 | 0 |
| pisuke | dash_f | 0 | 0 |
| pisuke | crouch | 0 | 0 |
| pisuke | jump_n | 0 | 0 |
| pisuke | stand_light | 0 | 0 |
| pisuke | stand_heavy | 0 | 0 |
| pisuke | guard_stand | 0 | 0 |
| pisuke | hurt_light | 0 | 0 |
| godan | idle | 0 | 0 |
| godan | walk_f | 0 | 0 |
| godan | walk_b | 0 | 0 |
| godan | dash_f | 0 | 0 |
| godan | crouch | 0 | 0 |
| godan | jump_n | 0 | 0 |
| godan | stand_light | 0 | 0 |
| godan | stand_heavy | 0 | 0 |
| godan | guard_stand | 0 | 0 |
| godan | hurt_light | 0 | 0 |

要確認の項目はありません（足滑り 1px 以下、原点・高さのずれなし、IK 警告なし、セルはみ出しなし）。
