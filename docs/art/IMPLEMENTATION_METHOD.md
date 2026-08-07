# アート実装方法 — 新規 Implementation Chat / Work 用

## 0. 目的

現行アートを既存戦闘logicへ接続する。
アート統合によってBAL・入力・ダメージ・判定・online stateを変更しない。

## 1. Source と Runtime を分離

Source:
`assets/art/current/**`

Runtime推奨:
`assets/art/runtime/{charId}/{actionId}/{frameId}.png`

Sourceは白背景RGBシート。
Runtimeはsplit + safe background removal後のalpha PNG。

Sourceを直接runtime spriteとして使わない。

## 2. Sheet split

### 1×4
`J02`〜`J14`

左から:
F1 / F2 / F3 / F4

画像幅が4で割り切れない場合は、正規化した25%境界をroundして4領域へ分割する。
境界付近でforegroundが切れる場合は、各quarter内のforeground bboxを調べて安全marginを取る。
「幅÷4を整数切り捨てして最後を捨てる」処理は禁止。

### 2×2
`J01`
TL idle / TR guard / BL flinch / BR victory

`J15`
TL down / TR getup / BL ko / BR ult_charge

legacy common24のcell意味は `data/art/art_manifest.json` を正とする。

## 3. 背景除去

現行sourceはopaque RGB。

旧 `whitenAsset()` のような画像全体に対する白色削除は禁止。

安全処理:
- cell外周から開始するflood-fill / connected-background mask
- border由来のnear-whiteだけbackground候補
- 内部で輪郭に囲まれた白は消さない
- antialias edgeを過剰に削らない
- outputはalpha PNG

特に保護:
- ヨミカゲの白包帯
- タキマルの明るい毛
- 腹・口元の明色
- 目ハイライト

runtime loaderは生成済みalphaを正として、再度白抜きしない。

## 4. Animation timing

時間のauthorityは既存BAL。

1×4の基本表示:
- F1 startup前半
- F2 startup後半
- F3 active / impact
- F4 recovery前半
- recovery後半 F4→idle/guard

4枚だから時間を4等分、は禁止。

hitstop中は原則F3保持。

animation frame選択はsimulation `phase / pf / simulation frame` のみ。
`performance.now()`、独自wall-clock timerを使わない。

## 5. Special behavior

以下の特殊挙動は戦闘設計側がauthority:

- Delay
- Feint
- Pressure
- Just
- CLINCH
- CHASE_TO_CONTACT
- Charge / Overcharge
- Iron Wall
- 暗連
- 独立GRAB telegraph
- starterScale
- その他の派生条件

アート実装側は推測して戦闘logicを追加しない。

仕様確定後、既存4Fの:
- 部分利用
- F1/F2保持
- F3固定
- 再利用
- position/scale補間

で対応する。

「1枚ないと技意図が成立しない」場合のみ追加アート依頼へ戻す。

## 6. Size / anchor

`data/art/size_ratio_candidates.json` と `docs/art/SIZE_RATIO_GUIDE.md` を参照。

優先順:
1. bodyBounds
2. uniform battleScale
3. foot anchor
4. offsetX / offsetY
5. 必要時のみscaleX / scaleY微補正

bodyBoundsはhitboxではない。

## 7. Dark Moguzo

共通アクションはMoguzoからbuild-time palette transform。
固有J08〜J14とcutinはDark固有source。

geometry / alpha / pixel positionsを完全維持。

詳細: `docs/art/DARK_MOGUZO_POLICY.md`

## 8. 2P

build-time deterministic palette transform。
render-only。
戦闘stateへ色ID以外の画像由来値を逆流させない。

詳細: `docs/art/P2_COLOR_POLICY.md`

## 9. Cut-in

presentation layerのみ。
奥義の発生、hit、damage、freeze timing等をcutin画像ロード状況で変えない。

## 10. Fallback

新source/runtimeが存在しない状態はlegacy common24へfallback可能。
旧素材は即削除しない。

ただしlegacy用の旧頭サイズ補正をnew currentへ重ねない。

## 11. Acceptance

- 全9キャラ source load成功
- split順序正常
- 内部白色が消えていない
- F1→F4正常
- 足元anchor
- サイズ比
- 63技 move→art mapping
- Dark common recolor
- 2P
- cutin
- offline CPU smoke
- same seed / same input state hash維持
- 実機2台online確認
- BUILD_ID更新
- dist/prototype一致

## 12. VFX

今回は未実装。
後送素材を受け取るまでVFXを新規創作しない。


## 13. Normal Chain Limit / recovery短縮

戦闘runtime側のNormal Chain Limitを参照する。
詳細は `docs/art/NORMAL_CHAIN_ART_POLICY.md`。

対象:
- crouch attack
- MID
- HIGH
- LOW

通常打撃がHITし、合法な次の通常打撃へchain cancelする場合、
F4を全時間表示する義務はない。

BAL / cancel timingを正として:
`F3 -> 必要なrecovery表示 -> 次技F1`
へ遷移してよい。

F4はrecovery表現であり、chain cancelにより短縮または省略され得る。
画像枚数の都合でBALやcancel timingを変更してはいけない。

Normal Chain Limitのための追加中割り・chain専用画像は現時点では不要。

## 14. 共通ノックバック未確定

共通ノックバック / 攻守リセットの移動距離は未確定。

- 画像へ移動距離を焼き込まない
- sheet内の見た目上の移動量をgameplay knockbackへ直結しない
- runtime position補間で後から変更可能にする
- bodyBounds / visualBoundsは描画基準でありknockback authorityではない
