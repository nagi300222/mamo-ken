# VFX後送

**このGitHub納品には新規VFX素材を含めない。**

# VFXは後送 — 今回は実装しない

現方針:
- 通常わざ: 専用VFXなし
- コマンドわざ: VFXあり（別途生成して後送）
- 奥義: さらに別格のVFX（別途）

今回のアート監査から、後続VFX生成で準備すべきカテゴリ:
1. command hit spark: light / medium / heavy
2. forward dash / speed pressure lines
3. rising / overhead swing arc
4. low sweep / ground skid trail
5. heavy ground crack / dust / debris
6. grab contact / constriction / throw rotation
7. counter / parry / just ring
8. pressure wave / roar / air burst
9. charge / compression / release burst
10. character-specific: Chilka feint afterimage, Bullet long-tail arc, Dark Moguzo black-purple trail

注意: 現在の生成シートには火花・土煙・軌跡が焼き込まれたものがある。初回実装では許容するが、後送VFXを追加する時に二重表示しない。通常技に焼き込まれた火花は優先差し替え候補。
