import { roster, guidance, round, step, cpu } from './battle.js';
import { createStage } from './stage.js';

const el = (id) => document.getElementById(id);
const picks = ['moguzo', 'godan'];
let side = 0,
  stage = null,
  game = null,
  paused = false,
  acc = 0,
  last = 0;
const keys = new Set(),
  fingers = new Map();
let taps = {};
function resetInput() {
  keys.clear();
  fingers.clear();
  taps = {};
}
function error(text) {
  el('error').textContent = text;
  el('error').hidden = false;
}
function selectView() {
  const c = roster[picks[side]];
  el('name').textContent = c.nameJa;
  el('style').textContent = c.styleJa;
  el('hero').src = '../../' + c.selectionAssetPath;
  el('hero').alt = c.nameJa + 'の立ち絵';
  el('desc').textContent = guidance[c.id];
  el('moves').textContent = '技　' + c.commands.map((m) => m.name).join('・');
  el('matchup').textContent = picks.map((id) => roster[id].nameJa).join('　対　');
  for (const [i, id] of ['pick1', 'pick2'].entries())
    el(id).setAttribute('aria-pressed', side === i);
  for (const card of el('grid').children) {
    const id = card.dataset.id;
    card.classList.toggle('selected', id === c.id);
    card.setAttribute('aria-pressed', id === c.id);
    const badge = card.querySelector('b');
    badge.textContent = picks
      .map((p, i) => (p === id ? (i ? 'CPU' : '1P') : ''))
      .filter(Boolean)
      .join(' / ');
    badge.hidden = !badge.textContent;
  }
}
for (const c of Object.values(roster)) {
  const card = document.createElement('button');
  card.className = 'card';
  card.dataset.id = c.id;
  card.innerHTML = '<img alt=""><span></span><b></b>';
  card.firstChild.src = '../../assets/ui/facesq_' + c.id + '.png';
  card.querySelector('span').textContent = c.nameJa;
  card.onclick = () => {
    picks[side] = c.id;
    selectView();
  };
  el('grid').append(card);
}
el('pick1').onclick = () => {
  side = 0;
  selectView();
};
el('pick2').onclick = () => {
  side = 1;
  selectView();
};
selectView();
function newRound() {
  game = round(...picks);
  game.reach = Number(el('reach').value);
  resetInput();
  paused = false;
  acc = 0;
  last = 0;
  el('pause').textContent = '一時停止';
  paint();
}
el('start').onclick = () => {
  try {
    stage ??= createStage(el('arena'), error);
    el('select').hidden = true;
    el('fight').hidden = false;
    el('back').hidden = false;
    el('skill').replaceChildren(
      ...roster[picks[0]].commands.map((m, i) => new Option(i + 1 + ' ' + m.name, i)),
    );
    newRound();
    window.scrollTo(0, 0);
  } catch (e) {
    error('WebGL 2 を起動できません。' + e.message);
  }
};
el('back').onclick = () => {
  game = null;
  stage.clear();
  resetInput();
  el('fight').hidden = true;
  el('select').hidden = false;
  el('back').hidden = true;
};
el('reset').onclick = newRound;
el('tools').onclick = () => {
  el('debug').hidden = !el('debug').hidden;
  el('tools').setAttribute('aria-expanded', !el('debug').hidden);
  if (!el('debug').hidden) el('debug').scrollIntoView({ block: 'nearest' });
};
el('pause').onclick = () => {
  paused = !paused;
  el('pause').textContent = paused ? '再開' : '一時停止';
  acc = 0;
};
el('step').onclick = () => {
  paused = true;
  el('pause').textContent = '再開';
  tick();
  paint();
};
el('reload').onclick = () => {
  el('reach').value = 1;
  el('slow').checked = false;
  newRound();
};
el('reach').oninput = () => {
  game.reach = Number(el('reach').value);
};
for (const select of [el('skill'), el('ai')]) select.onchange = () => select.blur();
const keyboard = {
  ArrowLeft: 'left',
  ArrowRight: 'right',
  ArrowDown: 'down',
  ArrowUp: 'jump',
  KeyZ: 'light',
  KeyX: 'heavy',
  KeyC: 'dodge',
  KeyV: 'grab',
  KeyB: 'skill',
};
function tap(key) {
  if (key === 'skill') taps.command = Number(el('skill').value);
  else taps[key] = true;
}
addEventListener('keydown', (e) => {
  if (!game || e.target.matches('select,input') || e.altKey || e.ctrlKey || e.metaKey) return;
  const k = keyboard[e.code],
    digit = /^Digit([1-7])$/.exec(e.code);
  if (!k && !digit) return;
  e.preventDefault();
  if (e.repeat) return;
  if (digit) {
    taps.command = +digit[1] - 1;
    return;
  }
  keys.add(k);
  if (!['left', 'right', 'down'].includes(k)) tap(k);
});
addEventListener('keyup', (e) => keys.delete(keyboard[e.code]));
addEventListener('blur', resetInput);
document.addEventListener('visibilitychange', () => {
  resetInput();
  last = 0;
  acc = 0;
});
for (const button of document.querySelectorAll('.pad button')) {
  button.onpointerdown = (e) => {
    e.preventDefault();
    button.setPointerCapture(e.pointerId);
    if (button.dataset.hold) fingers.set(e.pointerId, button.dataset.hold);
    else tap(button.dataset.tap);
  };
  button.onlostpointercapture = (e) => fingers.delete(e.pointerId);
  button.onpointerup = button.onpointercancel = (e) => fingers.delete(e.pointerId);
  button.onclick = (e) => {
    if (e.detail === 0 && button.dataset.tap) tap(button.dataset.tap);
  };
}
function tick() {
  const held = new Set([...keys, ...fingers.values()]);
  const inputs = {
    axis: Number(held.has('right')) - Number(held.has('left')),
    down: held.has('down'),
    ...taps,
  };
  if (!game.stop) taps = {};
  step(game, [inputs, cpu(game, el('ai').value)]);
}
function resource(f) {
  switch (f.id) {
    case 'moguzo':
      return [f.guts ? '根性発動' : '根性', f.grit ? '踏ん張り有' : '使用済'].join('・');
    case 'pisuke':
      return f.chase ? 'CHASE 受付' : 'CHASE';
    case 'godan':
      return '装甲 ' + f.armorStock + '/3';
    case 'hakuma':
      return '鉄壁 ' + (f.iron ? '準備完了' : '待機');
    case 'chirka':
      return f.action?.trick === 'delay' ? 'ディレイ中' : 'フェイント';
    case 'takimaru':
      return f.pressure ? '投げ受付' : 'プレッシャー';
    case 'yomikage':
      return f.ret ? (f.just ? 'JUST RETURN' : 'RETURN 受付') : 'RETURN';
    case 'bullet':
      return '蓄圧 ' + f.charge + '/3';
    case 'dark_moguzo':
      return f.body ? 'BODY ' + f.body + 'F' : '暗連 ' + f.dark + '/100';
  }
}
for (const id of ['s1', 's2'])
  el(id).innerHTML = '<strong></strong> <span></span><div class="hp"><i></i></div>';
function paint() {
  stage.draw(game, el('guide').checked);
  for (const [i, f] of game.fighters.entries()) {
    const root = el(i ? 's2' : 's1'),
      c = roster[f.id];
    root.querySelector('strong').textContent = (i ? 'CPU ' : '1P ') + c.nameJa;
    root.querySelector('span').textContent = f.hp + ' HP · ' + resource(f);
    root.querySelector('i').style.width = (100 * f.hp) / c.hp + '%';
  }
  el('clock').textContent = Math.ceil(game.left / 60);
  el('result').textContent = game.result;
  el('event').textContent = game.stop ? game.event : '';
  if (!el('debug').hidden) {
    const states = game.fighters.map((f) =>
      f.action ? (f.action.name ?? f.action.art) + ' ' + f.action.age + 'F' : f.pose,
    );
    el('frames').textContent =
      'F ' +
      game.frame +
      ' ／ STOP ' +
      game.stop +
      ' ／ ' +
      states.join(' ⇄ ') +
      ' ／ リーチ ×' +
      game.reach;
  }
}
function frame(now) {
  if (game && !document.hidden) {
    if (!paused) {
      acc += Math.min(100, last ? now - last : 0) * (el('slow').checked ? 0.25 : 1);
      while (acc >= 1000 / 60) {
        tick();
        acc -= 1000 / 60;
      }
    }
    paint();
  }
  last = now;
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
