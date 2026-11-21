import { rules as R, technique, shots } from "./data.js";
const clamp = (n, a, b) => Math.min(b, Math.max(a, n));
export const neutral = () => ({ x: 0, y: 0 });
export function player(c, x, face) {
  return {
    c,
    x,
    face,
    y: 0,
    vy: 0,
    vx: 0,
    hp: 100,
    meter: 20,
    mode: "idle",
    age: 0,
    move: null,
    stun: 0,
    down: 0,
    boost: 0,
    poison: 0,
    charge: 0,
    stored: 0,
    combo: 0,
    comboTime: 0,
    dash: 0,
    dashDir: 0,
    prev: neutral(),
    history: [],
    lastTap: [-100, -100],
    stride: 0,
  };
}
export function match(a, b) {
  return {
    p: [player(a, 133, 1), player(b, 251, -1)],
    frame: 0,
    time: R.round,
    freeze: 0,
    shots: [],
    fx: [],
    winner: null,
  };
}
function spark(g, x, y, color, kind = "hit") {
  g.fx.push({ x, y, color, kind, t: 0 });
}
function begin(p, key) {
  p.move = { key, ...technique(p.c, key), t: 0, hit: false };
  p.mode = "attack";
  p.age = 0;
  p.dash = 0;
}
function cmd(p, end) {
  return p.history
    .map((d) => d.code)
    .join("")
    .endsWith(end);
}
function inputs(g, p, i) {
  const rel = i.x * p.face;
  const d = 5 + rel - i.y * 3; // down is positive in screen/input space
  if (d !== p.dir) {
    if (d !== 5) p.history.push({ code: d, t: g.frame });
    p.dir = d;
  }
  p.history = p.history.filter((v) => g.frame - v.t <= 24).slice(-10);
  if (rel < 0) {
    p.charge++;
    if (p.charge >= R.charge) p.stored = 10;
  } else {
    p.charge = 0;
    p.stored = Math.max(0, p.stored - 1);
  }
  const tap = i.x && i.x !== p.prev.x;
  const index = Number(i.x > 0);
  const twice = tap && g.frame - p.lastTap[index] <= R.doubleTap;
  if (tap) p.lastTap[index] = g.frame;
  return { rel, twice };
}
function update(g, p, e, i) {
  const { rel, twice } = inputs(g, p, i);
  const press = (k) => i[k] && !p.prev[k];
  if (p.comboTime > 0 && --p.comboTime === 0) p.combo = 0;
  if (p.boost > 0) p.boost--;
  if (p.poison > 0 && --p.poison % 30 === 0) p.hp = Math.max(1, p.hp - 1);
  p.age++;
  if (p.down > 0 || p.stun > 0) {
    if (p.down > 0) {
      p.down--;
      p.mode = p.down > 9 ? "down" : "wake";
    } else p.stun--;
  } else {
    const canCancel =
      p.move?.hit &&
      p.move.t >= p.move.start &&
      (p.c.style === "shade" || ["jab", "low", "air"].includes(p.move.key));
    if (!p.move || canCancel) {
      let key;
      const attack = press("light") || press("heavy");
      if (
        (press("super") ||
          (press("special") && i.heavy) ||
          (press("heavy") && i.special)) &&
        p.meter >= R.superCost
      ) {
        key = "super";
        p.meter -= R.superCost;
      } else if (attack && cmd(p, "623")) key = "rise";
      else if (attack && cmd(p, "214")) key = "trick";
      else if (
        attack &&
        (p.c.style === "counter" ? p.stored > 0 && rel > 0 : cmd(p, "236"))
      )
        key = "wave";
      else if (press("special")) {
        key = i.y > 0 ? "rise" : rel < 0 ? "trick" : "wave";
        if (key === "wave" && p.c.style === "counter" && !p.stored) key = null;
      } else if (press("throw") && !p.y) key = rel > 0 ? "clinch" : "throw";
      else if (
        attack &&
        (!p.move ||
          (p.c.style === "shade" && p.move.key === "jab" && press("heavy")))
      ) {
        key = p.y
          ? press("heavy")
            ? "dive"
            : "air"
          : i.y > 0
            ? press("heavy")
              ? "sweep"
              : "low"
            : press("heavy")
              ? "cross"
              : "jab";
      }
      if (key === "rise" && p.y > 0) key = null;
      if (key) {
        begin(p, key);
        p.history = [];
        if (key === "wave") p.stored = 0;
      }
    }
    if (p.move) {
      const m = p.move;
      m.t++;
      p.mode = "attack";
      if (m.key === "rise" && m.t === m.start) {
        p.vy = p.c.jump * 0.88;
        p.vx = p.face * (p.c.style === "counter" ? 1.7 : 0.95);
      }
      if (m.key === "super" && m.t === m.start) {
        spark(g, p.x, p.y + p.c.height * 0.55, p.c.color, "burst");
        if (p.c.style === "zone" || p.c.style === "venom")
          g.shots.push({
            owner: p,
            x: p.x + 19 * p.face,
            y: p.y + 19,
            vx: p.face * (p.c.style === "zone" ? 4 : 2),
            r: 9,
            life: 80,
            m,
          });
      }
      if (m.key === "super" && p.c.style === "wall" && m.t <= m.start)
        p.x += p.face * 2.6;
      if (m.key === "trick" && p.c.style === "venom" && m.t === 6) {
        p.x += p.face * 18;
      }
      if (
        m.key === "trick" &&
        p.c.style === "counter" &&
        m.t === m.start &&
        Math.abs(e.x - p.x) < 49
      ) {
        p.x = e.x + 16 * p.face;
        p.face *= -1;
      }
      if (
        ((m.key === "wave" && !shots[p.c.style]) ||
          m.key === "clinch" ||
          m.key === "super") &&
        m.t <= m.start
      )
        p.x += p.face * (m.key === "wave" ? 1.9 : 1.35);
      if (m.key === "wave" && shots[p.c.style] && m.t === m.start) {
        const [speed, life, r] = shots[p.c.style];
        const low = p.c.style === "grapple";
        g.shots.push({
          owner: p,
          x: p.x + 16 * p.face,
          y: p.y + (low ? 5 : p.c.height * 0.48),
          vx: speed * p.face,
          r,
          life,
          low,
          m,
        });
        if (p.c.style === "shade") p.hp = Math.max(1, p.hp - 3);
      }
      if (m.key === "trick" && p.c.style === "zone" && m.t === m.start)
        g.shots.push({
          owner: p,
          x: clamp(p.x + p.face * 67, 8, 376),
          y: 9,
          vx: 0,
          r: 8,
          life: 100,
          low: true,
          m,
        });
      if (m.t > m.start + m.active + m.end) p.move = null;
    } else {
      if (twice && !p.y) {
        p.dash = R.dash;
        p.dashDir = i.x;
      }
      if (!p.y && i.y < 0 && p.prev.y >= 0) {
        p.vy = p.c.jump;
        p.vx = i.x * p.c.speed * 1.35;
        p.dash = 0;
      }
      if (p.dash) {
        p.x += p.dashDir * p.c.speed * 2.5;
        p.dash--;
        p.mode = "dash";
      } else if (p.y || p.vy) p.mode = "jump";
      else {
        p.mode =
          i.y > 0 ? "crouch" : rel < 0 ? "guard" : rel > 0 ? "walk" : "idle";
        if (i.y <= 0)
          p.x +=
            i.x * p.c.speed * (p.c.style === "runner" && p.boost ? 1.55 : 1);
      }
    }
  }
  if (p.y || p.vy) {
    p.y = Math.max(0, p.y + p.vy);
    p.vy -= R.gravity;
    p.x += p.vx;
    if (!p.y) {
      p.vy = 0;
      p.vx = 0;
    }
  }
  p.x = clamp(p.x, 10, 374);
  p.stride += Math.abs(p.x - (p.lastX ?? p.x)) * 0.15;
  p.lastX = p.x;
  p.prev = { ...i };
}
export function target(p) {
  const m = p.move;
  return { x: p.x + p.face * m.x, y: p.y + p.c.height * m.y };
}
function overlaps(p, x, y, r) {
  const h =
    p.c.height *
    (p.mode === "crouch" || ["low", "sweep"].includes(p.move?.key) ? 0.66 : 1);
  return (
    Math.abs(p.x - x) < p.c.width * 0.46 + r && y + r >= p.y && y - r < p.y + h
  );
}
function damage(g, p, e, m, x, y, projectile = false) {
  if (e.down) return false;
  const back = e.prev.x * e.face < 0;
  const guard =
    back &&
    !e.y &&
    !e.move &&
    (!m.low || e.prev.y > 0) &&
    (!m.high || e.prev.y <= 0) &&
    !m.grab &&
    (!e.stun || e.mode === "block");
  if (
    e.c.style === "counter" &&
    e.move?.key === "trick" &&
    e.move.t < e.move.start &&
    !m.grab
  ) {
    p.stun = 18;
    p.move = null;
    p.mode = "hurt";
    e.meter = Math.min(100, e.meter + 12);
    spark(g, x, y, "#94ffe1", "counter");
    return true;
  }
  if (guard) {
    e.stun = R.guard;
    e.mode = "block";
    e.meter = Math.min(100, e.meter + 5);
    if (e.c.style === "wall") e.boost = 150;
  } else {
    const armor =
      e.c.style === "heavy" &&
      e.move?.key === "cross" &&
      !e.move.armored &&
      e.move.t < e.move.start &&
      !m.grab;
    let hit =
      m.damage +
      (p.c.style === "standard" && p.hp <= 35 ? 3 : 0) +
      (p.c.style === "wall" && p.boost ? 4 : 0) +
      (p.c.style === "grapple" && p.boost && m.grab ? 6 : 0);
    e.hp = Math.max(0, e.hp - (armor ? Math.ceil(hit / 2) : hit));
    if (armor) e.move.armored = true;
    else {
      e.move = null;
      e.stun = R.stun + (m.damage > 9 ? 5 : 0);
      e.down = m.down ? 32 : 0;
      e.mode = e.down ? "down" : "hurt";
      e.dash = 0;
    }
    if (p.c.style === "venom" && ["wave", "trick", "super"].includes(m.key))
      e.poison = 150;
    if (p.c.style === "runner" || p.c.style === "grapple") p.boost = 70;
    if (p.c.style === "wall") p.boost = 0;
    p.combo = p.comboTime ? p.combo + 1 : 1;
    p.comboTime = e.stun + 3;
    p.meter = Math.min(100, p.meter + 9);
    e.meter = Math.min(100, e.meter + 5);
  }
  e.x = clamp(
    e.x + Math.sign(e.x - p.x || p.face) * (guard ? 2 : R.push),
    10,
    374,
  );
  const color = guard ? "#85e6ff" : m.key === "super" ? "#ff8060" : "#ffdf70";
  spark(g, x, y, color, guard ? "guard" : "hit");
  g.freeze = R.stop + (m.damage >= 13 ? 3 : 0);
  if (!projectile && p.move) p.move.hit = !guard;
  return true;
}
export function step(g, a = neutral(), b = neutral()) {
  if (g.winner !== null) return;
  if (g.freeze) {
    g.freeze--;
    return;
  }
  g.frame++;
  g.time--;
  g.fx = g.fx.filter((f) => ++f.t < 14);
  const [p, e] = g.p;
  for (const [f, other, input] of [
    [p, e, a],
    [e, p, b],
  ]) {
    if (!f.move) f.face = other.x >= f.x ? 1 : -1;
    update(g, f, other, input);
  }
  const gap = e.x - p.x,
    min = (p.c.width + e.c.width) * 0.23;
  if (Math.abs(gap) < min && Math.abs(e.y - p.y) < 23) {
    const push = (min - Math.abs(gap)) * 0.5 * Math.sign(gap || 1);
    p.x = clamp(p.x - push, 10, 374);
    e.x = clamp(e.x + push, 10, 374);
  }
  const contacts = [];
  for (const [f, other] of [
    [p, e],
    [e, p],
  ]) {
    const m = f.move;
    if (!m || m.used || m.t < m.start || m.t >= m.start + m.active) continue;
    if (
      (m.key === "wave" && shots[f.c.style]) ||
      (m.key === "trick" && f.c.style === "zone") ||
      (m.key === "super" && ["venom", "zone"].includes(f.c.style))
    )
      continue;
    const { x, y } = target(f);
    if (m.grab && (other.y > 1 || Math.abs(other.x - f.x) > m.x + 3)) continue;
    // The full striking limb can make contact at point-blank range.
    const inside = (other.x - f.x) * f.face >= 0 && (other.x - x) * f.face < 0;
    const contactX = inside ? other.x : x;
    if (overlaps(other, contactX, y, m.r))
      contacts.push({ f, other, m, x: contactX, y });
  }
  // Resolve all active limbs sampled on this tick, including genuine trades.
  for (const { f, other, m, x, y } of contacts) {
    if (damage(g, f, other, m, x, y)) m.used = true;
  }
  for (const s of g.shots) {
    s.x += s.vx;
    s.life--;
  }
  for (const s of g.shots) {
    if (s.life <= 0) continue;
    const clash = g.shots.find(
      (t) =>
        t.owner !== s.owner &&
        t.life > 0 &&
        Math.abs(s.x - t.x) < t.r + s.r &&
        Math.abs(s.y - t.y) < t.r + s.r,
    );
    if (clash) {
      s.life = clash.life = 0;
      spark(g, s.x, s.y, "#fff4ab");
      continue;
    }
    const foe = s.owner === p ? e : p;
    if (
      overlaps(foe, s.x, s.y, s.r) &&
      damage(g, s.owner, foe, { ...s.m, low: s.low }, s.x, s.y, true)
    )
      s.life = 0;
  }
  g.shots = g.shots.filter((s) => s.life > 0 && s.x >= 0 && s.x <= 384);
  if (p.hp === 0 || e.hp === 0 || g.time <= 0)
    g.winner = p.hp === e.hp ? 2 : Number(e.hp > p.hp);
}
export function cpu(g, index = 1) {
  const p = g.p[index],
    e = g.p[1 - index],
    d = Math.abs(e.x - p.x),
    t = g.frame + index * 19;
  const zoner = p.c.style === "zone",
    toward = e.x > p.x ? 1 : -1;
  const i = { x: d > (zoner ? 89 : 30) ? toward : 0, y: 0 };
  if (e.move && t % 43 < 22) {
    i.x = -toward;
    i.y = Number(!!e.move.low);
  }
  if (zoner && d < 42 && t % 73 < 42) i.x = -toward;
  if (t % 71 === 0 && d > 55) {
    i.y = -1;
    i.x = toward;
  }
  if (t % 23 === 0) {
    if (e.y > 5 && !p.y && d < 62) {
      i.y = 1;
      i.special = true;
    } else if (p.meter >= 60 && d < 55) i.super = true;
    else if (d < 23 && t % 4 === 0) i.throw = true;
    else if (d > 44 || t % 5 === 0) i.special = true;
    else if (t % 3 === 0) i.heavy = true;
    else i.light = true;
  }
  return i;
}
