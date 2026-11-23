# 自分の既知の到達範囲を使うCPU：中間検証

特殊技のexact面候補を使うときだけ、CPUが選ぼうとしたspecial2/3の持続中に、現在見えている相手の位置・姿勢へ届くか調べる。相手の入力・履歴・未公開コマンドは参照せず、自分の既知の軌道と移動だけを使う。届かなければ同じ攻撃beatで届く弱攻撃か接近を選ぶ。反応時間、攻撃周期、ガード確率は維持。元の基準データがnullなら旧CPU選択のまま。

input/prev getterを禁止したidle/crouch/block/air/hitでspecial/normal両方を検査し、500Fの非specialbeatは旧入力と一致した。

今回の入力表は同じR1特殊技候補（SHA256 `6c8589cb8d4d776b1ae6d545a92fd626681ad7dabce1b657badd12ac1814514b`）、通常技は双方v15/15.1-r3。3レベル×6方針×9×9の各1458試合が完走。6方針の外付けconfirm/air技指定にも、`MAMOKEN_KNOWN_REACH_POLICY=1`で同じ既知射程のgateを掛けた。攻撃回数を増やす補助ではない。

reference CPU1458行のSHA256 `88fd0c13fccd4080aff975cf960b00a54eec29af589a661b059f1970dc0cf2da`は修正前のreferenceと完全一致。未採用時の挙動を保った。

| キャラ | 未採用reference | R1面＋既知射程CPU |
|---|---:|---:|
| moguzo | 67.71% | 69.79% |
| pisuke | 64.41% | 61.46% |
| godan | 35.76% | 32.64% |
| hakuma | 31.94% | 32.47% |
| chirka | 64.58% | 65.10% |
| takimaru | 30.56% | 30.90% |
| yomikage | 55.21% | 61.46% |
| bullet | 28.99% | 28.82% |
| dark_moguzo | 70.83% | 67.36% |

勝敗変化は131/1458試合（同じR1面に旧距離CPUを使った比較では245試合）。CPU得点は対人バランスの合格を表さない。

候補s2の開始/実hit/完全空振りはモグゾー9/9/0、チルカ78/63/0、ダークモグゾー717/556/0、他6体は0開始。残りはhit前に中断されたケース等を含むため、開始数をhit＋whiffと同一視しない。

**届かない技の連打は避けたが、R1モーションの短い接触面が直ったわけではない。** モグゾー・ゴダン・タキマル・ヨミカゲ・バレットの対空初接触と、ハクマs3の遅い実接触について作者が調整中。修正後のexact表と新54通常技を合わせ、同じ生成器で再評価する。今回の数値を最終調整の採用値にしない。

再実行：`MAMOKEN_CPU_ONLY=1 MAMOKEN_KNOWN_REACH_POLICY=1 MAMOKEN_SPECIAL_CONTACT_DELIVERY=/path/to/exact.json node exp/fable-3d/dojo/p3-special-contact-audit.mjs`。実機性能、連続した映像品質と聴感は未検証。
