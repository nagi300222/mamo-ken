# 当て身・組み投げの継続演出：r2ソース調査

対象は現行のDojo/Story consumer、元のマニフェスト、r1/r2技メタデータ、polishメタデータと元9GLB。ここでは通し映像や実機を確認したとは扱わない。

## ヨミカゲs3

元special manifestには`inGameStartClip`や特殊なtarget sourceは無い。旧`s3_v14`は51F/0.85秒の待ち姿勢（F4〜20）で、`s3_v17`も同じ待ちの演技。r2ではこの技を変更していない。長い待ちクリップを成功時の反撃に流用していない。

成功用は`character.reactions`にある別ファイル`yomikage_polish_anim.glb`の`counter_success_v14`、21F/0.35秒。後ろの掌で受け流すF3→手前の掌底F7〜12→構えF21の既存素材。`createShowtimeLoader`はreactionsをspecial overrideより前に元URLから読み込むため、r2にしてもこの参照を保持する。

Dojoは実counterイベントでそのreactionをLoopOnce再生する。`counterFrame`中もBattleを止めず、本人の新行動・被弾・KOなら中断する。既存21サンプルのconsumer（初期frame1＋20回の更新）のままで、R2待ち51Fに置き換わっていない。今回のsource helperに修正は不要。

**Storyの不足**：`battleEvents`にはcounter専用reactionを再生する分岐が無く、feedbackの音/FXだけを処理する。新しい素材が欠けているのではなく、既存の成功素材を消費していない。全5モードで同じ成果を活かすには、Story側で以下を追加する必要がある。

1. `combatActors[event.slot].showtime.reactions.counter_success_v14`を`Avatar.bindAvatarClip`と`bindMorphTargets`で自作モデルへbindする。
2. native同様にLoopOnceで起動し、21サンプルの専用カウンタを使う。
3. `syncCombatActor`でBattleのactionがnull/idle・stun/KOなしの場合だけ継続し、新行動/被弾で直ちに止める。Battleの硬直・ダメージ・入力可能時刻を変えない。

## タキマルs3

`s3_v17`は49Fで、掴みに行く動作と空振りの戻りだけを担当する。metadataの`on_hit_clips`は既存`throw_hit`/`thrown`を指す。r2でもこの技は変更していない。

実ヒットで`Battle._beginThrow`が両者のactionをnullにして、攻撃側を`throw_hit`、被弾側を`thrown`へ切り替える。`chooseClip`はそのstateをspecial actionより優先するため、元GLBの共通ペアへ戻る。DojoもStoryも同じ状態選択を利用する。

ペア時計は48F。元の攻撃側clipは48F/0.8秒、被弾側は44F/0.7333秒なので、被弾側は最後の4Fをclampして待つ。その後は既存の40F起き上がり。新specialの49Fを成功投げへ押し付けたり、両者を別々の新クリップで回したりしない。

元special manifestにも専用target sourceが無く、overrideの`animationSources`切替で消えるペア素材はない。元9GLBを保全している限り、helper修正は不要。実際の左右ペアの手位置・接地・被弾アニメのつながりは別途ブラウザ/連続動画で評価する。
