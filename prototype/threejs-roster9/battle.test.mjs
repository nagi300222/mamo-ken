import { test } from 'node:test';
import assert from 'node:assert/strict';
import { round, roster, step, cpu, boxes } from './battle.js';
const near = (id, other = 'hakuma') => {
  const g = round(id, other);
  g.fighters[0].x = -36;
  g.fighters[1].x = 36;
  return g;
};
function play(g, a = {}, b = {}) {
  while (g.stop) step(g);
  step(g, [a, b]);
}
function until(g, predicate, a = {}, b = {}) {
  for (let i = 0; i < 180 && !predicate(); i++) play(g, a, b);
  assert.ok(predicate(), 'expected combat state at frame ' + g.frame);
}
function idle(g) {
  until(g, () => g.fighters.every((f) => !f.stun && !f.action));
}
function strike(g, input, defense = {}) {
  const f = g.fighters[0];
  play(g, input, defense);
  assert.ok(f.action, 'attack accepted');
  until(g, () => f.action?.landed, {}, defense);
}
test('GUTS and one lethal save affect the actual HP ledger', () => {
  const g = near('moguzo');
  const [a, b] = g.fighters;
  a.hp = 20;
  play(g, {}, { light: true });
  until(g, () => a.hp === 1);
  assert.equal(a.grit, false);
  assert.equal(a.guts, true);
  idle(g);
  strike(g, { light: true });
  assert.equal(b.hp, roster.hakuma.hp - Math.round(roster.moguzo.mid.d * 1.1));
  idle(g);
  play(g, {}, { light: true });
  until(g, () => !!g.result);
  assert.equal(a.hp, 0);
});
test('CHASE only after normal HIT and before recovery ends', () => {
  const g = near('pisuke');
  const [a] = g.fighters;
  strike(g, { light: true });
  assert.equal(a.chase, 12);
  play(g, { dodge: true, axis: 1 });
  assert.equal(a.action.art, 'lunge');
  assert.equal(a.chase, 0);
  const h = near('pisuke');
  h.fighters[0].x = 253;
  h.fighters[1].x = 345;
  strike(h, { light: true }, { axis: 1 });
  assert.equal(h.fighters[0].chase, 0);
  const k = near('pisuke');
  strike(k, { light: true });
  until(k, () => !k.fighters[0].chase);
  play(k, { axis: 1, dodge: true });
  assert.notEqual(k.fighters[0].action?.art, 'lunge');
});
test('Armor spends on startup, absorbs a strike, counter retaliates, throws pierce', () => {
  for (const [index, attack, expected] of [
    [3, { light: true }, Math.round(60 * 0.6)],
    [2, { light: true }, 0],
    [3, { grab: true }, 90],
  ]) {
    const g = near('godan');
    const [a, b] = g.fighters;
    play(g, {}, attack);
    for (let n = 0; n < 6; n++) play(g);
    play(g, { command: index });
    assert.equal(a.armorStock, 2);
    until(g, () => g.stop > 0);
    assert.equal(roster.godan.hp - a.hp, expected);
    if (index === 2) assert.equal(roster.hakuma.hp - b.hp, 125);
    else assert.equal(!!a.action, !attack.grab);
  }
});
test('IRON WALL guard gain, empowered start, loss on injury', () => {
  const g = near('hakuma');
  const [a, b] = g.fighters;
  a.x = -345;
  b.x = -253;
  play(g, {}, { light: true });
  until(g, () => a.iron, { axis: -1 });
  assert.equal(a.pose, 'guard');
  idle(g);
  play(g, { command: 0 });
  assert.equal(a.action.s, 11);
  assert.equal(a.action.d, 83);
  assert.equal(a.iron, false);
  idle(g);
  a.iron = true;
  play(g, {}, { light: true });
  until(g, () => a.stun > 0);
  assert.equal(a.iron, false);
});
test('FEINT has recovery; DELAY commits once and delayed headbutt breaks guard', () => {
  const g = near('chirka');
  const [a, b] = g.fighters;
  a.x = 253;
  b.x = 345;
  play(g, { command: 0 });
  until(g, () => a.action.age === 3);
  play(g, { dodge: true });
  assert.equal(a.action.kind, 'feint');
  assert.equal(a.action.end, 12);
  idle(g);
  play(g, { command: 6 });
  until(g, () => a.action.age === 7);
  play(g, { command: 6 });
  assert.equal(a.action.s, 38);
  assert.ok(a.action.unblockable);
  play(g, { command: 6, dodge: true });
  assert.equal(a.action.s, 38);
  until(g, () => g.fighters[1].hp < roster.hakuma.hp, {}, { axis: 1 });
});
test('PRESSURE prequeue starts on release, throw can miss a jump', () => {
  const g = near('takimaru');
  const [a, b] = g.fighters;
  play(g, { command: 5 });
  assert.equal(a.action, null);
  strike(g, { command: 2 });
  assert.ok(a.pressure);
  until(g, () => b.stun === 6);
  play(g, { grab: true });
  assert.ok(a.queued);
  until(g, () => a.action?.pressureOnly);
  assert.equal(a.action.age, 1);
  play(g, {}, { jump: true });
  const hp = b.hp;
  until(g, () => !a.action);
  assert.equal(b.hp, hp);
  assert.equal(a.pressure, 0);
});
test('RETURN queues the first reply, JUST changes its startup and damage; expires unused', () => {
  for (const buffered of [true, false]) {
    const g = near('yomikage');
    const [a, b] = g.fighters;
    play(g, {}, { light: true });
    until(g, () => b.action.age === 9);
    play(g, { dodge: true, axis: 1 });
    until(g, () => a.ret > 0);
    assert.ok(a.just);
    if (buffered) {
      play(g, { heavy: true });
      until(g, () => a.action?.name === '後の先・天');
      assert.equal(a.action.s, 6);
      assert.equal(a.action.power, 1.1);
      assert.equal(a.ret, 0);
    } else {
      until(g, () => !a.ret);
      assert.equal(a.just, false);
    }
  }
});
test('CHARGE only alternating successes, spending does not refund on whiff', () => {
  const g = near('bullet');
  const [a, b] = g.fighters;
  for (const [index, expected] of [
    [0, 1],
    [0, 1],
    [1, 2],
    [0, 3],
  ]) {
    strike(g, { command: index });
    assert.equal(a.charge, expected);
    idle(g);
  }
  b.x = 330;
  play(g, { command: 6 });
  assert.equal(a.charge, 0);
  assert.ok(a.action.unblockable);
  idle(g);
  play(g, { command: 1 });
  idle(g);
  assert.equal(a.charge, 0);
  play(g, { command: 6 });
  assert.equal(a.action.kind, 'normal');
});
test('DARK earns gauge on compatible hits, cancels to normal, activates only at neutral and expires', () => {
  const g = near('dark_moguzo');
  const [a, b] = g.fighters;
  for (const [i, expected] of [
    [0, 30],
    [1, 60],
    [3, 90],
    [4, 100],
  ]) {
    strike(g, { command: i });
    assert.equal(a.dark, expected);
    assert.equal(a.body, 0);
    play(g, { light: true });
    assert.equal(a.action.kind, 'normal');
    if (expected !== 100) idle(g);
  }
  until(g, () => a.body > 0);
  assert.equal(a.body, 360);
  assert.equal(a.dark, 0);
  play(g, { command: 0 });
  assert.equal(a.action.s, 9);
  assert.equal(a.action.power, 1.08);
  b.x = 330;
  for (let n = 0; n < 360; n++) play(g);
  assert.equal(a.body, 0);
});
test('all 81 pairings finish and restart, all attacks use valid numeric geometry', () => {
  for (const left of Object.keys(roster))
    for (const right of Object.keys(roster)) {
      const g = near(left, right),
        fresh = round(left, right);
      for (let n = 0; n < 8500 && !g.result; n++) {
        const [a, b] = g.fighters;
        const input =
          Math.abs(a.x - b.x) > 95
            ? { axis: Math.sign(b.x - a.x) }
            : {
                light: g.frame % 32 === 0,
                command: g.frame % 127 === 1 ? Math.floor(g.frame / 127) % 7 : undefined,
              };
        step(g, [input, cpu(g, 'fight')]);
        for (const f of g.fighters) assert.ok(Number.isFinite(f.hp + f.x + boxes(f).hurt.h));
      }
      assert.ok(g.result, left + ' vs ' + right);
      assert.ok(g.fighters.some((f) => f.hp < roster[f.id].hp));
      assert.deepEqual(round(left, right), fresh);
    }
});
