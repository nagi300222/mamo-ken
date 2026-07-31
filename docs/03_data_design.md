# マモ拳（仮） データ設計 v2.0

> **v2.0: 再設計「見合いと交差」（再設計提案書v1＋発注者決定を正とする。v0.5実装のターゲット仕様）**。
> 操作刷新（ボタン枠廃止・右=高さタップ攻撃・左=ホールドガード/ジャストタップ見切り/下フリックつかみ）/ Punch-Out!!文法のテレグラフ＋発生14-22-30F / 下段ダウン化＋スマブラ式ダウン連（追撃1発・無敵起き上がり）/ ジャストガード廃止→見切りへ一本化 / 集中（自動スロー）/ 読まれ表示 / パッドはリングマット風の薄ロゴ。
>
> > v1.3: **ガード統一＆つかみ追加（プロトタイプv0.4準拠）**。ガードは段分割を廃止し1ボタン全段防御（ジャスト仕様は維持: 置きガードのみ・窓8F・ピンチ+4F）。つかみ（GRAB）を追加し三すくみ確立: **こうげき＞つかみ＞ガード＞こうげき**。つかみはガード/blockstun/idle/dizzy/咆哮アーマー中に成立（dmg100・叩きつけ演出28F・成立でS+10）、攻撃中の相手には潰され後隙26F+被カウンター1.25倍。**つかみ同士は競り合い（ギュイーン）発生**。パッド左列=ガード(上60%)+つかみ(下40%)。phase追加: grab/grabHit/grabbed/grabrec。
>
> > v1.2: SF2型バランス（プロトタイプv0.3準拠）。発生を遅く（12-20F）して読み合い主体化 / コンボは軽→重チェーンルート（中→上→下）のみ / **同段の振り合いは±8Fで競り合い化（相殺緩和）** / 競り合い=逆転装置: 敗者dmg120+連勝ごと+30・勝者S+30・敗者硬直40F=勝者追撃1発確定 / ジャスト窓8F・ピンチ時+4F / 咆哮を割り込み技化（発生14/dmg130）/ 奥義300。

実装の正となる型・定数・処理順を定義する。数値は初期値であり、すべて `balance.ts` / `characters.ts` で一元管理（マジックナンバー禁止）。

---

## 1. 基本型

```ts
type Level = 'high' | 'mid' | 'low';
type ClashChoice = 'up' | 'rightDown' | 'leftDown';

/** key が value に勝つ（上→右下→左下→上） */
export const CLASH_BEATS: Record<ClashChoice, ClashChoice> = {
  up: 'rightDown',
  rightDown: 'leftDown',
  leftDown: 'up',
};

type FighterPhase =
  | 'idle' | 'attack' | 'guard' | 'blockstun' | 'hitstun'
  | 'roar' | 'clash' | 'dizzy' | 'ko' | 'win';

interface AttackSpec { startup: number; active: number; recovery: number; dmg: number; }

interface CharacterDef {
  id: string; nameJa: string; typeJa: string;
  maxHp: number;
  atk: Record<Level, AttackSpec>;   // spdAdj適用済みの実値を持つ
  guardMax: number;
  sGainMul: number;
  dmgMul: number;
  ultName: string; ultDamage: number;
  palette: { body: string; belly: string };
}

interface FighterState {
  charId: string;
  hp: number; guard: number; sGauge: number; ultStock: 0 | 1 | 2 | 3;
  phase: FighterPhase; pf: number;          // phase frame
  atkLevel: Level | null; contactDone: boolean; atkHit: boolean; hitAtPf: number;
  chainHits: number;                        // 自分のコンボ段数(攻撃側)
  guardLevel: Level | null; guardAge: number; // ジャスト判定用。blockstun復帰で引き継ぐ
  comboTaken: number;                       // 被コンボ数(補正用)。hitstun離脱/roar発動で0
  stunLen: number;
}

interface BattleState {
  frame: number; seed: number;              // PRNG stateはseedに内包
  round: number; wins: [number, number]; timerF: number;
  p: [FighterState, FighterState];
  flow: 'intro' | 'fight' | 'clashSelect' | 'clashReveal'
      | 'ultCinema' | 'koCinema' | 'roundResult' | 'matchEnd';
  flowT: number;
  clash?: { picks: [ClashChoice | null, ClashChoice | null]; deadline: number; result?: -1 | 0 | 1 };
  ultBy?: 0 | 1;
  hitstop: number;
}

type InputCommand =
  | { t: 'attack'; level: Level }
  | { t: 'guardHold'; level: Level | null }  // ホールド状態そのものを毎F伝える
  | { t: 'roar' }
  | { t: 'ult' }
  | { t: 'clashPick'; c: ClashChoice };
```

## 2. balance.ts（初期値・全て調整前提）

| 定数 | 値 | 備考 |
|---|---|---|
| LOGIC_FPS | 60 | 固定tick |
| MAX_HP / ROUND_TIME_F / WINS_NEED | 1000 / 3600 / 2 | |
| ATK.mid | 発生14 / 持続3 / 硬直18 / dmg70 / 重さ1 / テレグラフ8F | 主力・差し合い。ヒット+4 / 被ガード**-6** / 見てから不可 |
| ATK.high | 発生22 / 持続3 / 硬直24 / dmg100 / 重さ2 / テレグラフ13F | リターン枠。ヒット+6 / 被ガード**-10** / 集中時のみ見てから可 |
| ATK.low | 発生30 / 持続4 / 硬直30 / dmg150 / 重さ3 / テレグラフ18F / 削り10 | 大技。ヒット=**ダウン** / 被ガード**-18** / 常時見てから可（読ませて通す） |
| HITSTUN / BLOCKSTUN | mid24 / high32 / low=ダウン ・ blockstun: mid14 / high16 / low15 | 上記硬直差の根拠値 |
| DOWN（スマブラ式ダウン連） | ダウン45F / **ダウン中1発だけ追撃可（ダメ補正×0.5・ダウン継続・のけぞり無し）** / 以後無敵 → 起き上がり20F**全身無敵** → 強制起き上がりで仕切り直し（起き攻め不可） | フルコン+追撃 ≒ 315 |
| CHAIN_WINDOW / ルート / COMBO_MAX / COMBO_SCALE | 14 / **軽→重のみ（中→上→下）** / 3 / [1.0, 0.9, 0.8] | コンボはチェーンでのみ成立 |
| MIKIRI（見切り・ジャストガード廃止の後継） | 左ゾーンのジャストタップ（100ms以内離し） / 窓=相手攻撃接触±5F（HP300以下は±7F） / 成功→**ギュイーン発生**+集中+30 / 空振り→硬直22F（**ガード不能**） | ストIIIブロッキングのタッチ翻訳 |
| FOCUS（集中・自動スロー） | ゲージ100 / 獲得: 被ダメ×0.15・ガード成功+8・見切り成功+30 / 満タン中に相手攻撃が発生した瞬間**自動発動**: 0.25倍速×実0.6秒+ズーム1.3（全消費） | 疑似ハイスピード演出を兼ねる |
| YOMARE（読まれ） | 同系統行動3連続→頭上に「読まれ!」表示 / 次の同行動への相手カウンター率UP | mash検知の可視化 |
| TELEGRAPH | 各攻撃の発生前半に構えポーズ+段色フラッシュ+固有SE（上=高音/中=タッ/下=低音） | 見てから対応の成立条件 |
| GUARD_MAX / GUARD_DMG_A / GUARD_DMG_S / CHIP_S | 100 / 10 / 45 / 20 | |
| GUARD_REGEN / DIZZY / BREAK_RECOVER | 0.22/F(非ガード時) / 90F / 50 | |
| S_MAX | 100 | |
| S_GAIN | aHit=コンボ減衰[12,7,4] / aBlockedAtk8 / guardOk6 / mikiri12 / gotHit5 / (aWhiff2) | 攻撃側優遇（咆哮ヒットはaHit12固定） |
| ROAR | 発生16 / アーマー1〜14F / 持続4 / 硬直24 / dmg130 / hitstun34 / 被ガード-10（削り45+チップ20） / アーマー被ダメ×0.5 | 全段判定・割り込み技 |
| CLASH | 選択90F / dmg120+連勝ごと+30 / 勝者S+30 / 敗者硬直40F(勝者追撃確定) / **発生条件: 同段攻撃の振り合い±8F or 見切り成功 or 同一F同段 or つかみ同士** / reveal60F / あいこ=仕切直し | |
| GRAB | 発生12 / 持続2 / スカ後隙28 / dmg90 / 演出28F / 叩きつけ後hitstun30 / 成立時S+10 / 被カウンター倍率1.25 | ガード・咆哮アーマーに勝ち、攻撃に負ける |
| ULT | stock3 / dmg300 / 演出110F / 貫通・必中・競り合い不可 / モードA既定 | モードB長押し18F |
| HITSTOP | mid6 / high9 / low14 / 咆哮12 / ギュイーン16 | |
| FLICK | dx≥60(論理px) / 300ms以内 | |
| INPUT_BUFFER | 10F | |

## 3. characters.ts（v1: 3体）

| id | 名前 | タイプ | 差分（基準=モグゾー） |
|---|---|---|---|
| moguzo | モグゾー | バランス | 基準値 |
| pisuke | ピスケ | スピード | 発生-2F / dmg×0.85 / sGainMul 1.25 / guardMax 90 |
| godan | ゴダン | パワー | 発生+2F / dmg×1.18 / guardMax 110 / sGainMul 0.9 |

奥義名（仮）: モグゾー「大地烈掌」/ ピスケ「音速連咆」/ ゴダン「山崩し」

## 4. 1フレームの処理順（core、必ずこの順）

```
1. 入力適用（バッファ消化: ult > roar > attack。guardHoldは状態同期）
2. フェーズ進行（pf++、満了処理、guardAge++、dizzy/stun復帰）
3. 接触イベント収集（attack: pf===startup && !contactDone / roar: pf===ROAR.startup）
4. 接触解決:
   a. 双方A同一F: 同段→競り合い(相打ち) / 段違い→双方被弾
   b. 片方A → 防御側判定:
      - roarアーマー中 → 被ダメ×0.5・のけぞりなし（攻撃側は aBlockedAtk 獲得）
      - guard段一致: guardAge≤JUST_WINDOW → 競り合い(ジャスト) / それ以外 → block処理
      - それ以外 → hit処理（補正・comboTaken++・hitstop）
   c. roar接触 → 防御側が任意段guard中: block(GUARD_DMG_S+CHIP_S) / roar同士: 相打ち / それ以外: hit(hitstun30)
5. ゲージ更新（S加算・ガード回復・上限クリップ）
6. ガードブレイク / KO 判定
7. flow遷移（clash/ult/ko/timeup）・タイマー減算（fight中のみ、hitstop中停止）
```

## 5. 入力→コマンド変換（input層）

**v2.0「見合いと交差」方式（ボタン枠廃止・ゾーン&ジェスチャー）**
- パッド矩形: 画面下50%。中央縦ラインで左右2ゾーン。ボタン描画はせず、薄いゾーンヒント＋**リングマット風の薄い「マモ拳」ロゴ**を敷く。
- **右ゾーン（攻め）**: タップの高さ＝段（上1/3=high / 中1/3=mid / 下1/3=low）。発火は**リリース時**。段境界は±20pxスナップ＋直前段の残像ガイド。右フリック成立かつ sGauge=MAX → `roar`（攻撃発生中ならキャンセル移行）。
- **左ゾーン（守り）**: ホールド（100ms超）＝`guardHold`。**ジャストタップ（100ms以内離し）＝`mikiri`**。左ゾーン開始の下フリック＝`grab`。ガード中の下フリックはガード解除＋`grab`。
- ultStock=3（モードA）: パッド全域タップ = `ult`。他コマンド生成停止。
- flow=clashSelect: 三択ボタン（上=中央上 / 左下 / 右下の三角配置）のみ `clashPick`。
- FOCUS発動中もコマンド受付は通常どおり（時間だけが遅くなる）。
- PC: mousedown/move/up を同経路にマップ。

## 6. 競り合い解決表（ユニットテスト必須・全9通り）

| P1\P2 | up | rightDown | leftDown |
|---|---|---|---|
| **up** | あいこ | P1勝ち | P2勝ち |
| **rightDown** | P2勝ち | あいこ | P1勝ち |
| **leftDown** | P1勝ち | P2勝ち | あいこ |

未入力はPRNGで一様抽選してから判定（決定論維持）。勝者 ultStock+1 / 敗者 CLASH.dmg + hitstun。

## 7. CPU AI v1（ai層）

```ts
interface AiPersona {
  reactionF: [number, number]; // 6..18
  guardSkill: number;          // 0.55: 反応時に正段ガードを選ぶ率
  aggro: number;               // 0.22: 思考tickでの自発攻撃率
  atkWeights: { high: 0.3; mid: 0.4; low: 0.3 };
  burstRate: number;           // 0.65: 被コンボ2発目以降＆S満タンで割り込み
  counterRoarRate: number;     // 0.35: 相手A中にS差し込み
  clashBias: [number, number, number]; // v1は等確率
  guardHoldF: [number, number];        // 26..46
  ultDelayF: number;                   // 30
}
```
- 思考tick12F。相手attack検知（pf=1）→ reactionF後に guardSkill 判定。
- 乱数はcoreとは別seed系列のPRNG（決定論維持）。

## 8. アセット規約（差し替え前提）

- `/assets/characters/{id}/sheet.png` + `sheet.json`（frames: name, x, y, w, h, pivotX, pivotY）
- 必須ポーズ: idle×2 / atkHigh×2 / atkMid×2 / atkLow×2 / guardH・M・L / hit / block / roar×2 / clash / dizzy×2 / win / lose / cutinFace(高解像度1枚)
- v1はプログラム描画シルエットで代替可。**sheet.json規約に従うローダを先に実装**し、後日PNG差し替えのみで完成させる。
- SE: hit / guard / gyuiin / roar / break / ko / ult / ui。BGM: battle01（ループ点メタ付き）。

## 9. セーブ（localStorage）

- `mamoken.settings.v1`: `{ volume: number, vibration: boolean, ultMode: 'A' | 'B' }`
- 対戦データ・戦績の保存はv1では行わない。

## 10. 将来拡張メモ（v2）

- オンライン: core決定論を前提に、入力交換型（lockstep→将来rollback）。Cloudflare Workers Durable Objects + WebSocket。
- リプレイ: seed + 入力列の記録で再生可能（決定論テストがそのまま資産になる）。
