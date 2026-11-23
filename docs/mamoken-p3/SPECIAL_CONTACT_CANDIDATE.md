# P3必殺技の見た目と判定：独立した候補実装

従来はv17の`authoredContact`が演出specに入るだけで、Battleの特殊技リーチは旧値だった。新しい`special-contact-runtime-p3.js`で、**新モーションと同じ時計で計測した判定候補**を別管理する。

- 19近接打撃は実スキンの接触面・各持続フレームの前方距離と高さへ対応。上下の命中も既存の実測hurt boundsで調べる。左右は相手方向の同じ局所座標を使う。尾薙ぎの最低間合いは維持する。
- 6飛び道具は先端頂点を発射点に流用せず、放出時の実ボーン位置`projectileSocket`を使う。カスタム側の既存の実測socketコールバックが優先する。弾速・弾の判定・寿命は変えない。
- 抱え込みの組み投げと受け返し、通常技、奥義は元の規則を維持する。hitstop・キャンセル・威力・発生・持続・硬直・移動量はこの候補で変えない。
- ヒットのfeedback位置も同じ接触面を使い、見えていない旧リーチの先端に接触FXを置かない。

## 受け入れデータとゲート

`createP3SpecialContactDelivery(metadata, {source:'runtime-skinned-mesh',sampling:'exact-clip-clock',characters})`で完全な9体×3技を検証する。各行には実測の`sampledContactSeconds`、`sampling`、19技の全持続フレームを含む`activeReach`、6弾の`projectileSocket`が必要。疎なN40曲線の補間、接触時計が異なる表、未解決`status:fix`は最終データにできない。

現時点の`special-contact-overrides-p3.js`は**null**。作者の時計補正と独立検証が終わるまで値を固定しない。モーション承認がv17なのに最終接触データが無ければ明示的に失敗する。旧判定のまま新モーションだけを完成扱いしない。

隔離した検証では`new Battle(id,opponent,level,{specialContactDelivery:candidate})`を使う。通常のrematchはその候補を維持する。Storyの`createCustomBattle`からも同じoptionを渡せる。

既存のカスタム打撃は`move.customSpecialContact`の自分の実スキン計測を優先する。ref・クリップ・版・接触時計・全持続フレームが一致しない、または自分の計測が無い場合は新打撃を開始しない。元キャラの面を流用して見た目一致を装わない。既存`move.projectileSocket`とStoryの発射点コールバックは、canonical socketより優先する。技の新しい混成・部品互換を追加する変更ではない。

## 検証器

`dojo/acceptance/p3-special-contact-browser.mjs`は実WebGLで次を行う。

1. 元の9体の実actorへ27本の新GLBをbind。実頂点をThree.jsでskinし、全持続フレームと左右、6発射骨を直接測定する。
2. 測定した候補tableを生成する。productionの承認ファイルは変更しない。
3. ゴダンs3・チルカs3・ダークモグゾーs1を実Battleで左右・命中・ガード・空振り・放出の14ケース検証。実画面と接触feedbackの位置差、実socket由来の弾位置を調べ、PNGとJSONを保存する。

この検証器の追加は実行成功を意味しない。CIの実行結果と映像を別途確認する。Nodeの5つの新テストは意図を明記した合成の幾何fixtureによる境界検査であり、実GLBの品質認証ではない。
