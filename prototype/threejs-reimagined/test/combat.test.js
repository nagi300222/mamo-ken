import test from "node:test";
import assert from "node:assert/strict";
import { match, step, cpu, target } from "../src/engine.js";
import { roster, technique, shots } from "../src/data.js";
const idle = { x: 0, y: 0 };
function tick(g, n = 1, i = {}, j = {}) {
  for (let f = 0; f < n; f++) step(g, { ...idle, ...i }, { ...idle, ...j });
}
function setup(c, dist = 21) {
  const g = match(c, roster[0]);
  g.p[0].x = 100;
  g.p[1].x = 100 + dist;
  return g;
}
for (const c of roster) {
  test(c.name + " · 6 normals, 3 specials, finisher, grab", () => {
    for (const [key, button, y] of [
      ["jab", "light", 0],
      ["cross", "heavy", 0],
      ["low", "light", 1],
      ["sweep", "heavy", 1],
      ["air", "light", 0],
      ["dive", "heavy", 0],
      ["wave", "special", 0],
      ["rise", "special", 1],
      ["trick", "special", 0],
      ["super", "super", 0],
      ["throw", "throw", 0],
    ]) {
      const g = setup(c, key === "trick" && c.style === "zone" ? 67 : 20),
        p = g.p[0];
      p.meter = 100;
      if (["air", "dive"].includes(key)) {
        p.y = 8;
        p.vy = 0.5;
      }
      if (key === "wave" && c.style === "counter") {
        tick(g, 30, { x: -1 });
        p.x = 100;
      }
      tick(g, 1, {
        [button]: true,
        y,
        x:
          key === "trick"
            ? -1
            : key === "wave" && c.style === "counter"
              ? 1
              : 0,
      });
      assert.equal(p.move?.key, key);
      if (key === "super") assert.equal(p.meter, 40);
      tick(g, 50);
      assert.ok(g.p[1].hp < 100, c.id + " " + key + " misses");
    }
  });
  test(c.name + " · forward/back dash and standing/crouching guard", () => {
    for (const x of [-1, 1]) {
      const g = setup(c, 100);
      tick(g, 1, { x });
      tick(g);
      tick(g, 1, { x });
      assert.equal(g.p[0].mode, "dash");
      assert.equal(g.p[0].dashDir, x);
    }
    for (const y of [0, 1]) {
      const g = setup(c);
      tick(g, 1, { light: true, y }, { x: 1, y });
      tick(g, 10, {}, { x: 1, y });
      assert.equal(g.p[1].hp, 100);
      assert.equal(g.p[1].mode, "block");
    }
  });
}
test("motion inputs are facing-relative and charge is earned", () => {
  for (const sign of [-1, 1])
    for (const [seq, key] of [
      ["236", "wave"],
      ["623", "rise"],
      ["214", "trick"],
    ]) {
      const g = setup(roster[0], 100);
      if (sign < 0) g.p.reverse();
      for (const [idx, d] of [...seq].entries())
        tick(g, 1, {
          x: (((Number(d) - 1) % 3) - 1) * sign,
          y: Number(d) < 4 ? 1 : 0,
          light: idx === seq.length - 1,
        });
      assert.equal(g.p[0].move?.key, key);
    }
  const g = setup(roster[6], 120);
  tick(g, 1, { special: true });
  assert.equal(g.p[0].move, null);
  tick(g, 30, { x: -1 });
  tick(g, 1, { x: 1, light: true });
  assert.equal(g.p[0].move.key, "wave");
});
test("opposing shots cancel and airborne targets can be intercepted", () => {
  const g = setup(roster[0], 110);
  tick(g, 1, { special: true }, { special: true });
  tick(g, 12);
  assert.equal(g.shots.length, 2);
  tick(g, 48);
  assert.equal(g.shots.length, 0);
  assert.deepEqual(
    g.p.map((f) => f.hp),
    [100, 100],
  );
  for (const c of roster) {
    const g = setup(c, 24);
    g.p[1].y = 24;
    g.p[1].vy = 1;
    tick(g, 1, { special: true, y: 1 });
    tick(g, 16);
    assert.ok(g.p[1].hp < 100, c.name);
  }
});
test("close light hit can cancel into a damaging special combo", () => {
  const g = setup(roster[0]);
  tick(g, 1, { light: true });
  while (!g.p[0].move.hit) tick(g);
  while (g.freeze) tick(g);
  tick(g, 1, { special: true, y: 1 });
  tick(g, 10);
  assert.ok(g.p[0].combo >= 2);
});
test("all 81 CPU pairings reach a result with damage", () => {
  for (const a of roster)
    for (const b of roster) {
      const g = match(a, b);
      let ticks = 0;
      while (g.winner === null && ticks++ < 8500) step(g, cpu(g, 0), cpu(g, 1));
      assert.notEqual(g.winner, null, a.id + "/" + b.id);
      assert.ok(g.p.some((f) => f.hp < 100));
    }
});
test("trait effects change the battle state", () => {
  const by = (style) => roster.find((c) => c.style === style);
  function strike(style, key, init = () => {}, defender = {}) {
    const g = setup(by(style), 16);
    init(...g.p);
    tick(g, 1, key);
    tick(g, 22, {}, defender);
    return g;
  }
  const normal = strike("standard", { heavy: true }),
    grit = strike("standard", { heavy: true }, (p) => (p.hp = 30));
  assert.ok(grit.p[1].hp < normal.p[1].hp);
  const chase = strike("runner", { light: true });
  assert.ok(chase.p[0].boost);
  const armor = match(by("standard"), by("heavy"));
  armor.p[1].x = armor.p[0].x + 20;
  tick(armor, 1, { light: true }, { heavy: true });
  tick(armor, 4);
  assert.equal(armor.p[1].move.armored, true);
  const wall = match(by("standard"), by("wall"));
  wall.p[1].x = wall.p[0].x + 20;
  tick(wall, 1, { light: true }, { x: 1 });
  tick(wall, 5, {}, { x: 1 });
  assert.ok(wall.p[1].boost > 0);
  const venom = strike("venom", { special: true });
  assert.ok(venom.p[1].poison > 0);
  const hp = venom.p[1].hp;
  tick(venom, 60);
  assert.ok(venom.p[1].hp < hp);
  const grip = strike("grapple", { throw: true }, (p) => (p.boost = 70));
  assert.ok(grip.p[1].hp < strike("grapple", { throw: true }).p[1].hp);
  const counter = match(by("standard"), by("counter"));
  counter.p[1].x = counter.p[0].x + 20;
  tick(counter, 1, { light: true }, { x: 1, special: true });
  tick(counter, 13);
  assert.ok(counter.p[1].hp === 100 && counter.p[0].stun > 0);
  tick(counter, 14);
  assert.ok(counter.p[1].x < counter.p[0].x);
  const dark = strike("shade", { special: true });
  assert.equal(dark.p[0].hp, 97);
  const trap = setup(by("zone"), 120);
  tick(trap, 1, { x: -1, special: true });
  tick(trap, 15);
  assert.equal(trap.shots[0].vx, 0);
});
test("rise cannot reset vertical velocity again before landing", () => {
  const g = setup(roster[6], 100);
  tick(g, 1, { y: -1 });
  tick(g);
  tick(g, 1, { special: true, y: 1 });
  assert.equal(g.p[0].move, null);
});
