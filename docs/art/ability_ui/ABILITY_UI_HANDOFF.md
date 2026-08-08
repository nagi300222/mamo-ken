# ABILITY UI / VFX HANDOFF

GitHubへ入れるのはCURATEDのみ。

- ICON 8
- GAUGE 17
- VFX 22
- 合計47 PNG

ORIGINAL_SHEETSとUNUSEDはruntimeへ入れない。

Dark Gauge:
- 0 → phase0
- 30 → phase1
- 60 → phase2
- 90 → phase3
- 100 READY → phase4
- BODY → phase5
exact DARK 0-100はruntime numeric stateを正とする。

Bullet:
0-3はframe+off/on。
MAX/OVER専用。
UnblockableはCommon VFX使用。

Chilka Feintの`?`は視覚記号として採用。

VFXはpresentation-only。
combat state/propertyを画像から逆算しない。

Godan flinch replacementは今回即使用。
