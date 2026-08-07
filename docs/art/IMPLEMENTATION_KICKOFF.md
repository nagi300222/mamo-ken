# 新規アート実装 Chat / Work — KICKOFF

この作業はマモ拳のアート統合専用です。

最初に以下を読む:
1. `docs/art/README_ART_ASSETS.md`
2. `data/art/art_manifest.json`
3. `docs/art/IMPLEMENTATION_METHOD.md`
4. `docs/art/NORMAL_CHAIN_ART_POLICY.md`
5. `docs/art/ART_AUDIT.md`
6. `docs/art/SIZE_RATIO_GUIDE.md`
7. `docs/art/SPECIAL_BEHAVIOR_ART_POLICY.md`
8. `docs/art/DARK_MOGUZO_POLICY.md`
9. `docs/art/P2_COLOR_POLICY.md`
10. `docs/art/VFX_LATER.md`

## 絶対条件

- BALを変更しない
- 63技の戦闘挙動を独自設計しない
- new source sheetへ旧global `whitenAsset()` を直接使わない
- sourceは白背景RGBなので、split後に外周連結背景だけ安全に透過する
- derived alpha runtime spriteへwhite removalを再適用しない
- frame selectionはsimulation phase/pf依存
- presentation値をhitbox/reach/state hashへ逆流させない
- VFXはまだ作らない

- Normal Chain Limitはcombat runtimeを正とし、アート側で数値を再定義しない
- 合法なnormal chain cancel時はF4完走を要求せず、BAL/cancel timingに従って次技F1へ移行してよい
- 共通ノックバック距離は未確定。画像へ移動距離を焼き込まない
- 既知の軽微アート不備で作業を止めない
- 1frame単位で後日差し替え可能なmanifest駆動を維持

## 最初の作業

コード変更前に現行sprite pipelineを読み、
今回どのファイルを変更/追加するか、
fallbackとdeterministic境界を含む実装planを短く提示する。

その後、
source importer → runtime frame生成 → manifest resolver → common mapping → 63技mapping → Dark recolor → 2P → cutin → regression
の順に進める。
