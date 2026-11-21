// Combat distances are logical pixels, time is measured in 60 Hz ticks.
function fighter(
  id,
  name,
  role,
  trait,
  color,
  fur,
  height,
  width,
  speed,
  jump,
  reach,
  power,
  skills,
  style,
) {
  return {
    id,
    name,
    role,
    trait,
    color,
    fur,
    height,
    width,
    speed,
    jump,
    reach,
    power,
    skills,
    style,
  };
}
export const roster = [
  fighter(
    "moguzo",
    "モグゾー",
    "正統派",
    "根性 · 体力35%以下で打撃強化",
    "#ef563b",
    ["#805134", "#be8953", "#e2b77b", "#ffe1a1"],
    53,
    26,
    1.18,
    3.6,
    1,
    1,
    ["茜玉", "昇陽拳", "岩戸崩し", "紅蓮一文字"],
    "standard",
  ),
  fighter(
    "pisuke",
    "ピスケ",
    "疾走脚",
    "チェイス · 命中後に歩行を加速",
    "#3698d8",
    ["#92734e", "#cba477", "#e5c79b", "#ffe6b5"],
    49,
    20,
    1.65,
    3.95,
    1.04,
    0.85,
    ["追風灯", "空紡ぎ", "風読み踵", "蒼燕乱舞"],
    "runner",
  ),
  fighter(
    "godan",
    "ゴダン",
    "重装拳",
    "黒帯 · 強打の構えで一撃耐える",
    "#393237",
    ["#544033", "#856a50", "#a68a68", "#cfb48d"],
    60,
    35,
    0.83,
    3.15,
    1.22,
    1.22,
    ["盤押し", "峰割り", "大岩槌", "千畳崩落"],
    "heavy",
  ),
  fighter(
    "hakuma",
    "ハクマ",
    "堅守突進",
    "鉄壁 · ガード成功で次の打撃に加算",
    "#387d65",
    ["#514b50", "#938b87", "#ccc4b8", "#fff1d5"],
    55,
    31,
    1.02,
    3.32,
    1.01,
    1.08,
    ["雪押し", "白壁返し", "氷棚割り", "雪崩街道"],
    "wall",
  ),
  fighter(
    "chirka",
    "チルカ",
    "毒霧奇襲",
    "毒染め · 霧と奇襲が持続ダメージ",
    "#ae78af",
    ["#544031", "#af7944", "#e3b354", "#ffe3a0"],
    48,
    23,
    1.31,
    3.74,
    1.03,
    0.9,
    ["蜜霧", "斑月爪", "蛇行みだれ", "紫煙庭園"],
    "venom",
  ),
  fighter(
    "takimaru",
    "タキマル",
    "組み投げ",
    "圧力 · 命中後の投げに威力加算",
    "#edba46",
    ["#38353d", "#888288", "#d4cbc7", "#fff1db"],
    57,
    32,
    0.98,
    3.38,
    1.13,
    1.06,
    ["浜鳴り", "磯返し", "縄落とし", "大潮結び"],
    "grapple",
  ),
  fighter(
    "yomikage",
    "ヨミカゲ",
    "反転機動",
    "影返し · 変化技の構えで迎撃し裏へ回る",
    "#eee3c5",
    ["#4d4440", "#7b6b56", "#b5a084", "#d8c49c"],
    52,
    24,
    1.16,
    3.87,
    1.07,
    0.96,
    ["月輪", "宵渡り", "影縫い返し", "夜半転輪"],
    "counter",
  ),
  fighter(
    "bullet",
    "バレット",
    "遠隔制圧",
    "遠見 · 長い強打と設置弾、接近戦は苦手",
    "#ed9454",
    ["#723c28", "#ac5e36", "#d58b4c", "#f5b872"],
    54,
    24,
    0.94,
    3.45,
    1.08,
    0.9,
    ["灯針", "斜光矢", "留め火", "七灯流星"],
    "zone",
  ),
  fighter(
    "dark_moguzo",
    "ダークモグゾー",
    "捨身連撃",
    "暗連 · 命中キャンセルと体力を削る高速弾",
    "#bd4654",
    ["#302932", "#514050", "#77616a", "#a68a86"],
    54,
    25,
    1.32,
    3.84,
    1.06,
    1.13,
    ["焦核", "黒曜牙", "裂帛", "夜明け喰い"],
    "shade",
  ),
];
export const rules = {
  round: 99 * 60,
  floor: 159,
  gravity: 0.135,
  dash: 11,
  doubleTap: 15,
  charge: 28,
  superCost: 60,
  stun: 14,
  guard: 9,
  stop: 4,
  push: 4,
};
const move = (start, active, end, damage, x, y, r, extra = {}) => ({
  start,
  active,
  end,
  damage,
  x,
  y,
  r,
  ...extra,
});
export const moves = {
  jab: move(4, 3, 9, 5, 24, 0.59, 4),
  cross: move(9, 4, 16, 10, 32, 0.62, 5),
  low: move(4, 3, 10, 5, 24, 0.25, 4, { low: true }),
  sweep: move(10, 5, 19, 10, 34, 0.15, 5, {
    low: true,
    down: true,
    kick: true,
  }),
  air: move(4, 5, 10, 6, 23, 0.3, 5, { high: true, kick: true }),
  dive: move(8, 7, 14, 11, 31, 0.16, 6, { high: true, kick: true }),
  throw: move(4, 2, 21, 15, 19, 0.42, 5, { grab: true, down: true }),
  wave: move(11, 2, 18, 10, 22, 0.5, 5),
  rise: move(4, 12, 22, 14, 20, 0.83, 8, { down: true }),
  trick: move(9, 5, 19, 13, 30, 0.61, 6, { high: true }),
  super: move(8, 10, 25, 28, 38, 0.52, 9, { down: true }),
  clinch: move(13, 4, 25, 11, 18, 0.48, 5, { grab: true, down: true }),
};
export function technique(c, key) {
  const m = { ...moves[key] };
  if (key === "super") Object.assign(m, finishers[c.style]);
  if (key === "trick" && c.style === "grapple") {
    m.grab = true;
    m.down = true;
    m.x = 22;
  }
  if (key === "rise" && ["runner", "venom", "counter"].includes(c.style))
    m.kick = true;
  m.x *= c.reach;
  m.damage = Math.round(m.damage * c.power);
  if (c.style === "runner" && ["jab", "cross", "trick"].includes(key)) {
    m.kick = true;
    m.start = Math.max(2, m.start - 2);
  }
  if (c.style === "heavy") {
    m.end += 3;
    m.start += 2;
  }
  if (c.style === "shade") m.start = Math.max(2, m.start - 2);
  if (c.style === "zone" && key === "cross") {
    m.x = 63;
    m.start = 14;
  }
  if (c.style === "grapple" && m.grab) {
    m.x += 6;
    m.damage += 5;
  }
  if (c.style === "zone" && key === "jab") m.end += 6;
  return m;
}
export const skillKeys = ["wave", "rise", "trick", "super"];
export function titleOf(c, key) {
  const i = skillKeys.indexOf(key);
  return i >= 0
    ? c.skills[i]
    : {
        jab: "差し手",
        cross: "踏み込み",
        low: "小払い",
        sweep: "裾払い",
        air: "飛び蹴り",
        dive: "落とし蹴り",
        throw: "巻き投げ",
        clinch: "ギュイーン",
      }[key];
}
export const shots = {
  standard: [2.3, 95, 5],
  shade: [3.1, 68, 5],
  runner: [1.1, 55, 5],
  venom: [1.45, 58, 6],
  grapple: [1.75, 85, 6],
  counter: [2.55, 110, 4],
  zone: [3.25, 115, 3],
};
// Per-fighter finishers share timing and collision primitives with ordinary moves.
export const finishers = {
  standard: { x: 44, r: 11 },
  runner: { x: 40, y: 0.38, kick: true },
  heavy: { x: 39, r: 14, damage: 35 },
  wall: { x: 34, end: 17 },
  venom: { x: 43, high: true },
  grapple: { x: 28, grab: true, damage: 36 },
  counter: { x: 47, start: 4 },
  zone: { x: 84, start: 14 },
  shade: { x: 42, start: 5, damage: 32 },
};
