# P3必殺技モーションの統合境界

Claude制作正本はPR #216 `7f79ea25`。`motion/v17`の9パック・27クリップ、`specials_v17.json`と`special_contacts_v17.json`を取り込む。元のGLB、54通常技、9奥義は置き換えない。

## 実装API

- `createShowtimeLoader(base, {specialMotionSource})` は検証済みsourceまたはそのPromiseを任意指定できる。省略時は`special-motion-overrides-p3.js`の承認値を確認する。初期値は`null`でv14の動作を維持する。
- `loadV17SpecialMotionSource()` は制作の2つのJSONを取得し、9体×3技のID、実測面、尺とキューを検証する。`createSpecialMotionSource({version:'v17',metadata,contacts})`は同じ検証の同期版。
- 有効時は`s1/s2/s3`だけ、アニメの読み込み先を`motion/v17/<id>_specials_v17.glb`と`<slot>_v17`へ変える。`loadClip(source,url)`の既存コールバックは新しい`url`を使うので変更不要。カスタム側の既存retargetにも元の`kind`を渡す。
- `ultimate`のspec、カメラ、攻撃側/被弾側ソース、reactionsは元の参照を保つ。接触の数値、発生・持続・硬直・ダメージは変更しない。
- `specialClipTime(entry.spec, fighter.action, fighter.frame, clip.duration)`をDojoとStoryの専用クリップ再生に使う。P3は最初の接触をstartup、最後の接触をactive最終フレームへ合わせ、残りをrecoveryへ対応させる。stop中はBattle.frameが進まないため、同じ時刻を保つ。既存v14は従来の時間写像を維持する。
- `spec.cueTrack`は風切り・構え・弾の放出などの動作キューだけ。`spec.contactCueTrack`は監査情報で、時間再生しない。ヒット/ガードの音・FX・shakeは既存の実Battle feedbackに委譲する。空振りで打撃音を出さない。

Pagesに`special-motion-source.js`、`special-motion-overrides-p3.js`、上記2JSONと9GLBをコピーする必要がある。読込パスはmodule URLに基づくのでPages/WKWebViewで同じ。P2の部品作成、技互換の拡張、既存GLB再生成は行わない。

## 確認済みと残り

Nodeで実GLBを読んで全27クリップの存在・121系列の骨格/表情トラック・実時間と接触時刻を検証。元の9奥義specが変わらないこと、接触キューが時間再生キューに入らないこと、未承認時に新素材を取得しないことを確認する。

作者による内訳は3本再設計（ゴダンs3、チルカs3、ダークモグゾーs1）と24本維持・再出力。24本は旧GLBとチャンネルのバイト一致ではない。再サンプルや変換の差があるため、旧モーションと完全同一とは断言せず、比較映像/独立スキン検査で評価する。

実ブラウザの9体、左右、実ヒット/ガード/空振りとカスタム側の追従は別検証。独立検証前は承認スイッチを有効化しない。iPhoneの実性能・操作の合格をNode検証から推定しない。
