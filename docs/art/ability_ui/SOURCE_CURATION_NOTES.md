# 目視確認・トリミング結果

## ICON
- Moguzo: GUTS / LAST STAND を分離済み
- Piske: CHASEを分離済み
- Chilka: FEINT SUCCESS / DELAYを分離済み
  - FEINTの箱に `?` 記号が描かれている。文字ではなく視覚記号として扱う想定。
  - 完全な記号禁止にする場合は再生成候補。
- Takimaru: PRESSURE READYを分離済み
- Yomikage: RETURN READY / JUST SUCCESSを分離済み

## GAUGE
### Godan
- base/frame
- OFF shield
- ON shield
をCURATEDに採用。
別のOFF風shieldが1点余ったため `UNUSED/godan_gauge_alt_off_segment.png` へ退避。

### Hakuma
左→右の3状態を frame / OFF / ON として分離。

### Bullet
元シートは6個の視覚要素。
必要5要素だけをCURATEDへ分離。
余分なduplicate OFF候補はUNUSEDへ退避。
**実装ではUNUSEDを使わない。**

### Dark Moguzo
6段階の月食画像として返却されたため、全6枚を左→右でphase_0～5として分離。
continuous fill素材ではない。

## VFX
### Common
3点とも明確に分離。

### Moguzo / Piske
3点とも明確に分離。

### Godan / Hakuma
3点を位置で分離。

### Chilka / Takimaru
source上は3つの大きな視覚グループ。
- Chilka FEINT
- Chilka DELAY
- Takimaru swipe+impact

Takimaru Armor Throwは、右端hit spark部分を追加トリミングした派生候補。
独立生成物ではない。

### Yomikage / Bullet
source上は4つの大きな視覚グループ。
- Yomikage RETURN
- Yomikage JUST
- Bullet OVERCHARGE
- Bullet steam+impact

Bullet steam+impactを
- tackle Armorのimpact端
- pressure releaseのsteam側
に分けて派生cropを作成。

Bullet UNBLOCKABLEは独立生成物がないためCommon UNBLOCKABLEを共用候補とする。

### Dark Moguzo
4点を明確に分離。
