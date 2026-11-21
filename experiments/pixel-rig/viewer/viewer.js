// ブラウザ用ビューワー。リグ計算と描画は ../src/rig.js（書き出しスクリプトと同じモジュール）。
import { createRig, bakeMotion, renderPose } from '../src/rig.js';

const $ = (id) => document.getElementById(id);
const getJSON = async (url) => { const r = await fetch(url); if (!r.ok) throw new Error(`${url}: ${r.status}`); return r.json(); };

function loadImageData(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const c = document.createElement('canvas');
      c.width = img.width; c.height = img.height;
      const g = c.getContext('2d', { willReadFrequently: true });
      g.imageSmoothingEnabled = false;
      g.drawImage(img, 0, 0);
      resolve({ w: img.width, h: img.height, data: g.getImageData(0, 0, img.width, img.height).data });
    };
    img.onerror = () => reject(new Error(`画像を読めません: ${url}`));
    img.src = url;
  });
}

async function loadChar(id) {
  const dir = `chars/${id}`;
  const [rigJson, palette, manifest] = await Promise.all([getJSON(`${dir}/rig.json`), getJSON(`${dir}/palette.json`), getJSON(`${dir}/manifest.json`)]);
  const images = {};
  await Promise.all(Object.keys(rigJson.parts).map(async (n) => { images[n] = await loadImageData(`${dir}/parts/${n}.png`); }));
  const rig = createRig(rigJson, palette, images);
  const motions = {};
  await Promise.all(manifest.motions.map(async (m) => { motions[m] = bakeMotion(rig, { name: m, ...(await getJSON(`${dir}/motions/${m}.json`)) }); }));
  return { id, name: manifest.name, rig, manifest, motions };
}

const state = { chars: {}, ids: [], t: 0, playing: true, last: 0 };

function currentIds() { return $('all').checked ? state.ids : [$('char').value]; }

function frameAt(baked, t) {
  const tt = baked.loop ? ((t % baked.total) + baked.total) % baked.total : Math.min(t, baked.total - 1);
  let f = baked.frames[0];
  for (const fr of baked.frames) if (fr.start <= tt) f = fr;
  return { f, tt, cycles: baked.loop ? Math.floor(t / baked.total) : 0 };
}

function buildStage() {
  const stage = $('stage');
  stage.textContent = '';
  for (const id of currentIds()) {
    const ch = state.chars[id];
    const slot = document.createElement('div');
    slot.className = 'slot';
    const h = document.createElement('h2');
    h.textContent = `${ch.name} (${id})`;
    const row = document.createElement('div');
    row.className = 'row';
    const canvas = document.createElement('canvas');
    canvas.dataset.id = id;
    row.append(canvas);
    if ($('ref').checked) {
      const img = document.createElement('img');
      img.alt = `${ch.name} の元絵`;
      img.src = `../../assets/portraits/${id}.png`;
      img.onerror = () => img.remove(); // リポジトリ直下から配信していない場合は出さない
      row.append(img);
    }
    slot.append(h, row);
    stage.append(slot);
  }
}

const low = document.createElement('canvas');

function draw() {
  const scale = +$('scale').value;
  const motion = $('motion').value;
  const flip = $('flip').checked;
  const warns = [];
  let infoText = '';
  for (const canvas of document.querySelectorAll('#stage canvas')) {
    const ch = state.chars[canvas.dataset.id];
    const baked = ch.motions[motion];
    const { w, h, origin } = ch.rig.cell;
    const pad = 40; // 移動を反映するときの左右の余白（低解像度 px）
    const W = w + pad * 2;
    if (canvas.width !== W * scale || canvas.height !== h * scale) { canvas.width = W * scale; canvas.height = h * scale; }
    const g = canvas.getContext('2d');
    g.imageSmoothingEnabled = false;
    g.clearRect(0, 0, canvas.width, canvas.height);
    // 地面
    g.fillStyle = '#3a4456';
    g.fillRect(0, origin[1] * scale, canvas.width, canvas.height - origin[1] * scale);
    if (!baked) { g.fillStyle = '#fff'; g.fillText('このモーションはありません', 8, 16); continue; }
    const { f, tt, cycles } = frameAt(baked, Math.floor(state.t));
    let rx = 0, ry = 0;
    if ($('travel').checked) {
      rx = f.root[0] + Math.round(baked.velocity[0] * (f.start + cycles * baked.total));
      ry = f.root[1];
      const span = W - 60;
      if (baked.velocity[0]) rx = ((rx % span) + span) % span - span / 2; // 歩きは画面内を回り込ませる
    }
    const dir = flip ? -1 : 1;
    const ox = pad + origin[0] + dir * rx, oy = origin[1] + ry;
    const rgba = renderPose(ch.rig, f.solved, { w: W, h, origin: [ox, oy], flip });
    low.width = W; low.height = h;
    low.getContext('2d').putImageData(new ImageData(rgba, W, h), 0, 0);
    g.drawImage(low, 0, 0, W * scale, h * scale);
    if ($('cell').checked) {
      g.strokeStyle = '#ffffff55'; g.lineWidth = 1;
      const cx = flip ? ox - (w - origin[0]) : ox - origin[0];
      g.strokeRect(cx * scale + 0.5, (oy - origin[1]) * scale + 0.5, w * scale, h * scale);
      g.fillStyle = '#ff5';
      g.fillRect(ox * scale - 3, oy * scale - 1, 7, 2); g.fillRect(ox * scale - 1, oy * scale - 3, 2, 7);
    }
    const X = (x) => (ox + dir * x) * scale, Y = (y) => (oy + y) * scale;
    if ($('bones').checked) {
      g.lineWidth = 2;
      for (const [name, b] of Object.entries(f.solved.bones)) {
        const def = ch.rig.bones[name];
        const p = def && def.parent ? f.solved.bones[def.parent] : null;
        if (p && def.parent !== 'root_ground') {
          g.strokeStyle = name.endsWith('_l') ? '#5cf' : name.endsWith('_r') ? '#fc5' : '#fff';
          g.beginPath(); g.moveTo(X(p.x), Y(p.y)); g.lineTo(X(b.x), Y(b.y)); g.stroke();
        }
        if (def && def.len) { // ボーンの先端まで
          const a = (b.rot * Math.PI) / 180;
          g.strokeStyle = '#8f8';
          g.beginPath(); g.moveTo(X(b.x), Y(b.y)); g.lineTo(X(b.x + def.len * Math.cos(a)), Y(b.y + def.len * Math.sin(a))); g.stroke();
        }
      }
      for (const b of Object.values(f.solved.bones)) { g.fillStyle = '#f36'; g.fillRect(X(b.x) - 2, Y(b.y) - 2, 5, 5); }
      for (const [k, c] of Object.entries(f.solved.contacts)) {
        g.strokeStyle = f.plant.includes(k) ? '#3f6' : '#888';
        g.strokeRect(X(c.x) - 5, Y(c.y) - 5, 10, 10); // 接地点（緑 = 接地指定中）
      }
    }
    if ($('pivots').checked) {
      g.strokeStyle = '#0ff'; g.lineWidth = 1;
      for (const p of Object.values(ch.rig.parts)) {
        const b = f.solved.bones[p.bone];
        if (!b) continue;
        g.beginPath(); g.arc(X(b.x), Y(b.y), 4, 0, 7); g.moveTo(X(b.x) - 6, Y(b.y)); g.lineTo(X(b.x) + 6, Y(b.y)); g.moveTo(X(b.x), Y(b.y) - 6); g.lineTo(X(b.x), Y(b.y) + 6); g.stroke();
      }
    }
    if (f.solved.warn.length) warns.push(`${ch.name}: ${f.solved.warn.join(' / ')}`);
    if (!infoText) {
      infoText = `コマ ${f.index + 1}/${baked.frames.length}　キー ${f.key + 1}　60Hz ${tt + 1}/${baked.total}f　保持 ${f.dur}f　root (${f.root[0]}, ${f.root[1]})`;
      $('scrub').max = baked.total - 1; $('scrub').value = tt;
    }
  }
  $('info').textContent = infoText;
  $('warn').textContent = warns.join('\n');
}

function tick(now) {
  const dt = Math.min(100, now - state.last); state.last = now;
  if (state.playing) {
    state.t += (dt / 1000) * 60 * +$('speed').value;
    const m = state.chars[currentIds()[0]].motions[$('motion').value];
    if (m && !m.loop && state.t >= m.total + 30) state.t = 0; // 単発モーションは少し間を置いて繰り返す
    draw();
  }
  requestAnimationFrame(tick);
}

function stepFrame(d) {
  const m = state.chars[currentIds()[0]].motions[$('motion').value];
  if (!m) return;
  state.playing = false; $('play').textContent = '再生';
  const cur = frameAt(m, Math.floor(state.t)).f.index;
  const n = m.frames.length;
  state.t = m.frames[(cur + d + n) % n].start;
  draw();
}

function fillMotions() {
  const sel = $('motion'), keep = sel.value;
  const names = [...new Set(currentIds().flatMap((id) => state.chars[id].manifest.motions))];
  sel.textContent = '';
  for (const n of names) sel.append(new Option(n, n));
  if (names.includes(keep)) sel.value = keep;
}

async function main() {
  const index = await getJSON('chars/index.json');
  state.ids = index.chars;
  for (const id of state.ids) {
    state.chars[id] = await loadChar(id);
    $('char').append(new Option(state.chars[id].name, id));
  }
  fillMotions(); buildStage();
  for (const id of ['char', 'all', 'ref']) $(id).onchange = () => { fillMotions(); buildStage(); state.t = 0; draw(); };
  $('motion').onchange = () => { state.t = 0; draw(); };
  for (const id of ['scale', 'bones', 'pivots', 'flip', 'travel', 'cell']) $(id).onchange = draw;
  $('play').onclick = () => { state.playing = !state.playing; $('play').textContent = state.playing ? '一時停止' : '再生'; };
  $('prev').onclick = () => stepFrame(-1);
  $('next').onclick = () => stepFrame(1);
  $('scrub').oninput = () => { state.playing = false; $('play').textContent = '再生'; state.t = +$('scrub').value; draw(); };
  addEventListener('keydown', (e) => {
    if (e.target.tagName === 'SELECT') return;
    if (e.code === 'Space') { e.preventDefault(); $('play').click(); }
    else if (e.code === 'ArrowLeft') stepFrame(-1);
    else if (e.code === 'ArrowRight') stepFrame(1);
    else if (e.code === 'KeyB') { $('bones').checked = !$('bones').checked; draw(); }
    else if (e.code === 'KeyF') { $('flip').checked = !$('flip').checked; draw(); }
  });
  draw();
  requestAnimationFrame((t) => { state.last = t; tick(t); });
}
main().catch((e) => { $('warn').textContent = `読み込みに失敗しました: ${e.message}\nexperiments/pixel-rig かリポジトリ直下で静的サーバーを起動して開いてください。`; });
