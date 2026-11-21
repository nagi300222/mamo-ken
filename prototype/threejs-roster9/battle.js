import roster from './generated/roster.js';
export { roster };

export const guidance = {
  moguzo: 'HP30%以下で威力+10%。致死の一撃を一度だけHP1で耐える。',
  pisuke: '通常技の命中後12F以内に前後＋回避。後隙を消して追走する。',
  godan: '山掴み・岩砕き・大山押しは装甲、巌の構えはカウンター。合計3ストック。',
  hakuma: 'ガード・回避成功で鉄壁を獲得。雪壁掌・白峰打ち・雪煙崩しを一度強化。',
  chirka: 'だまし突きの出始めに回避でフェイント。対応技を再入力すると8Fディレイ。',
  takimaru: 'ぶちかまし・熊手払いが触れたら、相手の硬直終了に合わせて投げを予約。',
  yomikage: '対応する方向＋回避に成功すると返し技を予約可能。接触が5〜9Fなら威力増。',
  bullet: '異なる蓄圧技を当てて最大3点。蓄圧タックル・圧抜き掌に1、弾丸頭突きに3消費。',
  dark_moguzo: '対応技の命中で暗連。通常技へキャンセル可能。100で双方の硬直解除後にBODY。',
};
const PUSH_WIDTH = 92;
const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
const trickWindows = {
  だまし突き: [4, 10],
  空鳴り爪: [6, 14],
  影踏み: [5, 13],
  あと出し頭突き: [8, 18],
};
const dodgeLoss = { crouch: 'low', sway: 'mid', lunge: 'high' };
function fighter(id, x, face) {
  const c = roster[id];
  return {
    id,
    x,
    y: 0,
    vy: 0,
    face,
    hp: c.hp,
    guard: c.guard,
    action: null,
    stun: 0,
    pose: 'idle',
    back: false,
    crouch: false,
    grit: id === 'moguzo',
    guts: false,
    armorStock: id === 'godan' ? 3 : 0,
    iron: false,
    charge: 0,
    lastGain: null,
    chase: 0,
    pressure: 0,
    queued: false,
    ret: 0,
    just: false,
    reply: null,
    dark: 0,
    body: 0,
    chain: 0,
    lastDark: null,
    window: 0,
    lastDodge: -100,
    note: '',
  };
}
export function round(left, right) {
  return {
    fighters: [fighter(left, -80, 1), fighter(right, 80, -1)],
    frame: 0,
    stop: 0,
    left: 99 * 60,
    result: '',
    event: '',
    reach: 1,
  };
}
function clearWindows(f) {
  Object.assign(f, {
    pressure: 0,
    queued: false,
    ret: 0,
    just: false,
    reply: null,
    chase: 0,
    window: 0,
  });
}
function begin(f, move, kind, art, extra = {}) {
  const body = f.body > 0;
  f.action = {
    ...move,
    kind,
    art,
    age: 1,
    landed: false,
    armorUsed: false,
    s: Math.max(1, (move.s ?? move.startupF) - (body ? (kind === 'normal' ? 1 : 2) : 0)),
    a: move.a ?? move.counterActiveF ?? 1,
    r: move.r ?? move.failRecF ?? move.whiff ?? 16,
    power: body ? 1.08 : 1,
    ...extra,
  };
}
function normal(f, heavy) {
  const lv =
    f.y > 0
      ? heavy
        ? 'high'
        : 'mid'
      : f.crouch
        ? heavy
          ? 'low'
          : 'crouch'
        : heavy
          ? 'high'
          : 'mid';
  begin(f, roster[f.id][lv], 'normal', lv === 'crouch' ? 'crouch_atk' : lv, {
    lv: lv === 'crouch' ? 'low' : lv,
    type: 'atk',
    name: (f.y ? '空中' : f.crouch ? 'しゃがみ' : '立ち') + (heavy ? '強' : '弱'),
  });
}
function command(f, index, permission = '') {
  const move = roster[f.id].commands[index];
  if (
    !move ||
    (move.pressureOnly && permission !== 'pressure') ||
    (f.id === 'yomikage' && index >= 3 && permission !== 'return')
  )
    return false;
  if (move.cost) {
    if (f[move.cost.res] < move.cost.amt) {
      normal(f, false);
      return true;
    }
    f[move.cost.res] -= move.cost.amt;
  }
  const iron = f.iron && move.ironWallAlt;
  const spec = iron ? { ...move, ...move.ironWallAlt } : move;
  begin(f, spec, 'command', 'cmd_' + String(index + 1).padStart(2, '0'), { index });
  if (iron) {
    f.iron = false;
    f.note = '鉄壁強化';
  }
  if (permission === 'return' && f.just) {
    f.action.s = Math.max(1, f.action.s - 2);
    f.action.power *= 1.1;
    f.note = 'JUST RETURN';
  }
  return true;
}
function dodge(f, input, frame) {
  const dir = input.down
    ? 'crouch'
    : input.axis === f.face
      ? 'lunge'
      : input.axis === -f.face
        ? 'sway'
        : 'mikiri';
  clearWindows(f);
  f.action = { kind: 'dodge', art: dir, age: 1, end: 22, success: false };
  f.lastDodge = frame;
}
function control(g, f, op, i) {
  f.walk = 0;
  f.back = i.axis === -f.face && !f.y;
  f.crouch = !!i.down && !f.y;
  const m = f.action;
  if (f.stun) return;
  if (f.pressure && i.grab && op.stun <= 6) f.queued = true;
  if (f.pressure && f.queued && !op.stun) {
    clearWindows(f);
    command(f, 5, 'pressure');
    return;
  }
  const reply = i.grab ? 3 : i.heavy ? (i.down ? 5 : 4) : i.light ? 6 : i.command;
  if (f.ret && reply >= 3 && reply <= 6 && f.reply === null) f.reply = reply;
  if (f.ret && !m && f.reply !== null) {
    command(f, f.reply, 'return');
    clearWindows(f);
    return;
  }
  if (m) {
    if (f.id === 'chirka' && m.kind === 'command' && !m.trick) {
      const w = trickWindows[m.name];
      if (w && m.age >= w[0] && m.age <= w[1]) {
        if (m.name === 'だまし突き' && i.dodge) {
          const success = op.lastDodge >= g.frame - m.age + 1;
          f.action = { kind: 'feint', art: 'sway', age: 1, end: success ? 6 : 12 };
          f.note = success ? 'フェイント成功' : 'フェイント';
          return;
        }
        if (i.command === m.index) {
          m.s += 8;
          m.trick = 'delay';
          m.unblockable = m.name === 'あと出し頭突き';
          f.note = 'ディレイ';
        }
      }
    }
    if (f.chase && i.dodge && i.axis && !i.down) {
      dodge(f, i, g.frame);
      f.note = 'CHASE';
    }
    if (m.kind === 'normal' && m.hit && i.command !== undefined && command(f, i.command)) {
      clearWindows(f);
      return;
    }
    if (f.window && (i.light || i.heavy)) {
      clearWindows(f);
      normal(f, i.heavy);
    }
    return;
  }
  if (i.dodge) {
    dodge(f, i, g.frame);
    return;
  }
  if (i.jump && !f.y) {
    f.vy = 9;
    f.y = 0.01;
    f.crouch = false;
    f.back = false;
  }
  if (i.command !== undefined && command(f, i.command)) {
    clearWindows(f);
    return;
  }
  if (i.grab || i.light || i.heavy) {
    clearWindows(f);
    if (i.grab) begin(f, { type: 'grab', s: 12, d: 90, whiff: 32, name: '投げ' }, 'grab', 'grab');
    else normal(f, i.heavy);
    return;
  }
  if (f.back) {
    f.ret = 0;
    f.reply = null;
  }
  const speed = { pisuke: 4.6, godan: 2.8, takimaru: 3, dark_moguzo: 4.1 }[f.id] ?? 3.6;
  f.walk = i.axis || 0;
  if (!f.crouch) f.x += speed * f.walk;
  f.pose = f.crouch ? 'crouch' : 'idle';
}
const rect = (x, y, w, h) => ({ x, y, w, h });
export function boxes(f, reach = 1) {
  const m = f.action;
  const low = f.crouch || m?.art === 'crouch_atk' || m?.art === 'crouch';
  const h = low ? 67 : 122;
  const hurt = rect(f.x - 29, f.y, 58, h);
  const push = rect(f.x - PUSH_WIDTH / 2, f.y, PUSH_WIDTH, h);
  let hit = null;
  if (m?.s && m.type !== 'stance' && !m.landed && m.age >= m.s && m.age < m.s + m.a) {
    const w =
      (m.type === 'grab' ? 69 : m.kind === 'command' ? 114 : m.lv === 'high' ? 102 : 90) * reach;
    const y = m.type === 'grab' ? 7 : m.lv === 'low' ? 12 : m.lv === 'high' ? 75 : 39;
    hit = rect(f.x + (f.face === 1 ? 0 : -w), f.y + y, w, m.type === 'grab' ? 43 : 38);
  }
  return { hurt, push, hit };
}
const overlaps = (a, b) =>
  a && b && a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
function injure(f, damage) {
  const old = f.hp;
  f.hp = Math.max(0, old - damage);
  if (f.grit && old >= 2 && !f.hp) {
    f.hp = 1;
    f.grit = false;
    f.note = '踏ん張り';
  }
  if (f.id === 'moguzo' && f.hp <= roster.moguzo.hp * 0.3) f.guts = true;
}
function contact(g, f, op, m) {
  const defense = op.action,
    grab = m.type === 'grab';
  if (grab && (op.y || op.stun || defense?.kind === 'dodge')) return;
  m.landed = true;
  if (
    !grab &&
    defense?.kind === 'dodge' &&
    defense.age >= 2 &&
    defense.age <= 12 &&
    (defense.art === 'mikiri' ? defense.age <= 5 : dodgeLoss[defense.art] !== m.lv)
  ) {
    defense.success = true;
    defense.end = 18;
    if (op.id === 'hakuma') op.iron = true;
    if (op.id === 'yomikage' && defense.art !== 'mikiri') {
      op.just = defense.age >= 5 && defense.age <= 9;
      defense.end = op.just ? 14 : 18;
      op.ret = defense.end - defense.age + (op.just ? 22 : 14) - 1;
    }
    g.event = op.just ? '見切った！ JUST' : '回避成功';
    return;
  }
  if (
    !grab &&
    defense?.type === 'stance' &&
    defense.age >= defense.s &&
    defense.age < defense.s + defense.a
  ) {
    injure(f, defense.counterDmg);
    clearWindows(f);
    f.iron = false;
    f.action = null;
    f.stun = 20;
    f.pose = 'flinch';
    op.action = null;
    g.stop = 5;
    g.event = '返し技';
    return;
  }
  const block = !grab && !m.unblockable && op.back && !defense && (!op.stun || op.pose === 'guard');
  let damage = Math.round(m.d * m.power * (f.guts ? 1.1 : 1));
  if (block) {
    op.guard = Math.max(0, op.guard - (m.guardDmg ?? m.gd ?? 8));
    op.stun = m.blockstun ?? 14;
    op.pose = 'guard';
    if (op.id === 'hakuma') op.iron = true;
    if (!op.guard) {
      op.stun = 40;
      op.pose = 'flinch';
      op.iron = false;
      op.guard = roster[op.id].guard;
    }
  } else {
    m.hit = true;
    const armor =
      !grab &&
      defense?.armorStartF &&
      defense.age >= defense.armorStartF &&
      defense.age <= defense.armorEndF &&
      (!defense.armorUsed || defense.hyperArmor);
    if (armor) {
      damage = Math.round(damage * defense.armorDmgMul);
      defense.armorUsed = true;
    }
    if (defense?.kind === 'dodge') damage = Math.round(damage * 1.2);
    injure(op, damage);
    op.iron = false;
    clearWindows(op);
    if (!armor) {
      op.stun = m.hitstun ?? (grab ? 30 : 20);
      op.action = null;
      op.pose = m.down ? 'down' : 'flinch';
    }
    if (f.id === 'pisuke' && m.kind === 'normal') f.chase = 12;
    if (m.chargeGain && f.lastGain !== m.name) {
      f.charge = Math.min(3, f.charge + 1);
      f.lastGain = m.name;
    }
    if (m.tags?.includes('暗連可') && f.lastDark !== m.name && f.chain < (f.body ? 3 : 2)) {
      f.chain++;
      f.lastDark = m.name;
      f.window = f.body ? 20 : 16;
      if (!f.body) f.dark = Math.min(100, f.dark + 30);
    }
  }
  if (m.selfGuardRestore) f.guard = Math.min(roster[f.id].guard, f.guard + m.selfGuardRestore);
  if (m.name === 'ぶちかまし' || m.name === '熊手払い') f.pressure = op.stun + 12;
  g.stop = block ? 3 : 5;
  g.event = block ? 'ガード' : m.name + '  −' + damage;
}
function advance(f) {
  if (f.body) f.body--;
  if (f.stun && !--f.stun) f.pose = 'idle';
  const m = f.action;
  if (m) {
    m.age++;
    if (m.kind === 'dodge' && m.age < 12 && ['sway', 'lunge'].includes(m.art))
      f.x += f.face * (m.art === 'sway' ? -2 : 3);
    if (m.age > (m.end ?? m.s + m.a + m.r - 1)) {
      f.action = null;
      f.pose = 'idle';
    }
  }
  if (f.y || f.vy) {
    f.y = Math.max(0, f.y + f.vy);
    f.vy = f.y ? f.vy - 0.52 : 0;
  }
}
export function step(g, inputs = [{}, {}]) {
  if (g.result) return;
  if (g.stop) {
    g.stop--;
    return;
  }
  const [a, b] = g.fighters;
  g.frame++;
  g.left--;
  for (const f of g.fighters) advance(f);
  for (const [i, f] of g.fighters.entries()) {
    const op = g.fighters[1 - i];
    if (!f.action) f.face = op.x >= f.x ? 1 : -1;
    if (!op.stun && !f.window) {
      f.chain = 0;
      f.lastDark = null;
    }
    if (f.dark === 100 && !f.action && !f.stun && !op.stun) {
      f.dark = 0;
      f.body = 360;
      f.note = 'BODY';
    }
    control(g, f, op, inputs[i] ?? {});
  }
  for (const f of g.fighters) f.x = clamp(f.x, -345, 345);
  if (overlaps(boxes(a).push, boxes(b).push)) {
    const left = a.x <= b.x ? a : b,
      right = left === a ? b : a;
    left.x = clamp((a.x + b.x - PUSH_WIDTH) / 2, -345, 345 - PUSH_WIDTH);
    right.x = left.x + PUSH_WIDTH;
  }
  for (const f of g.fighters) {
    for (const key of ['ret', 'pressure', 'chase', 'window']) if (f[key]) f[key]--;
    if (!f.ret) {
      f.just = false;
      f.reply = null;
    }
    if (!f.pressure) f.queued = false;
  }
  const targets = g.fighters.map((f, i) =>
    overlaps(boxes(f, g.reach).hit, boxes(g.fighters[1 - i]).hurt) ? f.action : null,
  );
  for (const [i, m] of targets.entries()) if (m) contact(g, g.fighters[i], g.fighters[1 - i], m);
  if (!a.hp || !b.hp || !g.left) {
    const lead = a.hp / roster[a.id].hp - b.hp / roster[b.id].hp;
    g.result = lead === 0 ? '引き分け' : (lead > 0 ? '1P' : 'CPU') + ' 勝利';
    for (const f of g.fighters) {
      clearWindows(f);
      f.action = null;
      f.pose = f.hp ? 'victory' : 'ko';
    }
  }
}
export function cpu(g, mode) {
  const [enemy, me] = g.fighters;
  const toward = Math.sign(enemy.x - me.x);
  if (mode === 'idle') return {};
  if (mode === 'guard') return { axis: -toward };
  if (Math.abs(me.x - enemy.x) > PUSH_WIDTH + 3) return { axis: toward };
  const clock = g.frame % 150;
  if (clock === 74) return { command: Math.floor(g.frame / 150) % 7 };
  return { light: clock % 39 === 1, heavy: clock === 120 };
}
