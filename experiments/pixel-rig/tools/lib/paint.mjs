// パーツを「ピクセル単位の図形」で描くための小さな描画ライブラリ。
// アンチエイリアスなし・パレット色名のみ。座標は関節（回転中心）を (0,0) とした相対座標。
// ピクセル (x,y) は [x,x+1)×[y,y+1) を覆い、図形の内外はピクセル中心で判定する。
import fs from 'node:fs';
import path from 'node:path';
import { writePNG } from '../../src/png-node.js';

export class Part {
  constructor(name) { this.name = name; this.px = new Map(); }
  _set(x, y, col, clip) {
    const k = `${x},${y}`;
    const has = this.px.has(k);
    if (clip === 'in' && !has) return;
    if (clip === 'out' && has) return;
    if (typeof clip === 'string' && clip.includes('.') && this.px.get(k) !== clip) return; // 指定色の上だけ
    if (col === null) this.px.delete(k); else this.px.set(k, col);
  }
  get(x, y) { return this.px.get(`${x},${y}`); }
  /** 楕円 */
  ell(cx, cy, rx, ry, col, clip) {
    for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++)
      for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
        const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry;
        if (dx * dx + dy * dy <= 1) this._set(x, y, col, clip);
      }
    return this;
  }
  /** 両端の太さが違うカプセル（手足向け） */
  cap(x1, y1, r1, x2, y2, r2, col, clip) {
    const dx = x2 - x1, dy = y2 - y1, dd = dx * dx + dy * dy || 1e-6;
    for (let y = Math.floor(Math.min(y1 - r1, y2 - r2)); y <= Math.ceil(Math.max(y1 + r1, y2 + r2)); y++)
      for (let x = Math.floor(Math.min(x1 - r1, x2 - r2)); x <= Math.ceil(Math.max(x1 + r1, x2 + r2)); x++) {
        const px = x + 0.5 - x1, py = y + 0.5 - y1;
        const t = Math.max(0, Math.min(1, (px * dx + py * dy) / dd));
        const r = r1 + (r2 - r1) * t, ex = px - dx * t, ey = py - dy * t;
        if (ex * ex + ey * ey <= r * r) this._set(x, y, col, clip);
      }
    return this;
  }
  /** 多角形（偶奇規則） */
  poly(pts, col, clip) {
    const ys = pts.map((p) => p[1]), xs = pts.map((p) => p[0]);
    for (let y = Math.floor(Math.min(...ys)); y <= Math.ceil(Math.max(...ys)); y++)
      for (let x = Math.floor(Math.min(...xs)); x <= Math.ceil(Math.max(...xs)); x++) {
        const px = x + 0.5, py = y + 0.5;
        let inside = false;
        for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
          const [xi, yi] = pts[i], [xj, yj] = pts[j];
          if ((yi > py) !== (yj > py) && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) inside = !inside;
        }
        if (inside) this._set(x, y, col, clip);
      }
    return this;
  }
  rect(x, y, w, h, col, clip) {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this._set(x + i, y + j, col, clip);
    return this;
  }
  /** 個別ピクセル。dots([[x,y],...], col) */
  dots(list, col, clip) { for (const [x, y] of list) this._set(x, y, col, clip); return this; }
  /** 1px 線（Bresenham） */
  line(x1, y1, x2, y2, col, clip) {
    let dx = Math.abs(x2 - x1), dy = -Math.abs(y2 - y1), sx = x1 < x2 ? 1 : -1, sy = y1 < y2 ? 1 : -1, e = dx + dy;
    for (;;) {
      this._set(x1, y1, col, clip);
      if (x1 === x2 && y1 === y2) break;
      const e2 = 2 * e;
      if (e2 >= dy) { e += dy; x1 += sx; }
      if (e2 <= dx) { e += dx; y1 += sy; }
    }
    return this;
  }
  /** 文字で打つドット絵。map = {文字: 色名}、'.' は何もしない、'_' は消す。 */
  rows(x, y, rows, map, clip) {
    rows.forEach((row, j) => [...row].forEach((ch, i) => {
      if (ch === '.') return;
      if (ch === '_') return this._set(x + i, y + j, null);
      if (!(ch in map)) throw new Error(`${this.name}: rows の未定義文字 '${ch}'`);
      this._set(x + i, y + j, map[ch], clip);
    }));
    return this;
  }
  /** 毛の房の刻み。短い斜め線を並べる（意図した位置にだけ置く。ノイズにしない）。 */
  ticks(list, col, clip = 'in') {
    for (const [x, y, dir = 1, len = 3] of list) for (let i = 0; i < len; i++) this._set(x + i * dir, y + i, col, clip);
    return this;
  }
  /** 反時計回りに90°回した写し（ピクセルは劣化しない）。右向きの拳 → 上向きの拳 など。 */
  rotCCW(name) {
    const q = new Part(name);
    for (const [k, col] of this.px) { const [x, y] = k.split(',').map(Number); q.px.set(`${y},${-x - 1}`, col); }
    return q;
  }
  /**
   * 毛の房: 楕円の縁の指定角度（度。0=右, 90=下）に小さな三角の房を足す。輪郭を「意図した位置だけ」毛羽立たせる。
   */
  tufts(cx, cy, rx, ry, angles, col, len = 2, droop = 1) {
    for (const a of angles) {
      const c = Math.cos((a * Math.PI) / 180), s = Math.sin((a * Math.PI) / 180);
      const bx = cx + rx * c, by = cy + ry * s;
      const nl = Math.hypot(c / rx, s / ry), nx = c / rx / nl, ny = s / ry / nl;
      this.poly([[bx - ny * 1.6 - nx, by + nx * 1.6 - ny], [bx + ny * 1.6 - nx, by - nx * 1.6 - ny], [bx + nx * len, by + ny * len + droop]], col);
    }
    return this;
  }
  /** 2色の境目をのこぎり状にする（腹の明るい毛と体毛の境目など）。a 側の左隣が b の箇所に、period 行ごとの歯を作る。 */
  saw(a, b, period = 4) {
    const edits = [];
    for (const [k, col] of this.px) {
      if (col !== a) continue;
      const [x, y] = k.split(',').map(Number);
      if (this.get(x - 1, y) !== b) continue;
      const ph = ((y % period) + period) % period;
      if (ph === 0) edits.push([x, y, b], [x + 1, y, b]);
      else if (ph === 1) edits.push([x, y, b]);
      else if (ph === 3) edits.push([x - 1, y, a]);
    }
    for (const [x, y, c] of edits) this.px.set(`${x},${y}`, c);
    return this;
  }
  bounds() {
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    for (const k of this.px.keys()) {
      const [x, y] = k.split(',').map(Number);
      x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y);
    }
    return [x0, y0, x1, y1];
  }
}

function hexToRgb(hex) { const n = parseInt(hex.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }

export function paletteMap(palette) {
  const m = {};
  for (const [r, list] of Object.entries(palette.ramps)) list.forEach((hex, i) => (m[`${r}.${i}`] = hexToRgb(hex)));
  for (const [n, hex] of Object.entries(palette.flat || {})) m[n] = hexToRgb(hex);
  return m;
}

/** rig.json を「1エントリ1行」の読みやすい形で書き戻す。 */
export function formatRig(obj) {
  const one = (v) => JSON.stringify(v).replace(/,"/g, ', "').replace(/":/g, '": ');
  const lines = ['{'];
  const keys = Object.keys(obj);
  keys.forEach((k, ki) => {
    const v = obj[k], end = ki < keys.length - 1 ? ',' : '';
    if (Array.isArray(v) && v.length && typeof v[0] === 'object') {
      lines.push(`  ${JSON.stringify(k)}: [`);
      v.forEach((e, i) => lines.push(`    ${one(e)}${i < v.length - 1 ? ',' : ''}`));
      lines.push(`  ]${end}`);
    } else if (v && typeof v === 'object' && !Array.isArray(v) && Object.values(v).some((e) => e && typeof e === 'object')) {
      lines.push(`  ${JSON.stringify(k)}: {`);
      const ks = Object.keys(v);
      ks.forEach((kk, i) => lines.push(`    ${JSON.stringify(kk)}: ${one(v[kk])}${i < ks.length - 1 ? ',' : ''}`));
      lines.push(`  }${end}`);
    } else lines.push(`  ${JSON.stringify(k)}: ${one(v)}${end}`);
  });
  lines.push('}');
  return lines.join('\n') + '\n';
}

/**
 * 描いたパーツを chars/<id>/parts/*.png に書き出し、rig.json の各パーツの size / pivot を更新する。
 * 関節位置（bones）や描画順などリグ定義の他の項目には触れない。
 */
export function savePartSet(charDir, partsList) {
  const palette = JSON.parse(fs.readFileSync(path.join(charDir, 'palette.json'), 'utf8'));
  const pm = paletteMap(palette);
  const rigPath = path.join(charDir, 'rig.json');
  const rig = JSON.parse(fs.readFileSync(rigPath, 'utf8'));
  fs.mkdirSync(path.join(charDir, 'parts'), { recursive: true });
  const seen = new Set();
  for (const p of partsList) {
    if (!rig.parts[p.name]) throw new Error(`rig.json に ${p.name} の定義がありません`);
    seen.add(p.name);
    const [x0, y0, x1, y1] = p.bounds();
    const w = x1 - x0 + 1, h = y1 - y0 + 1;
    const data = new Uint8Array(w * h * 4);
    for (const [k, col] of p.px) {
      const [x, y] = k.split(',').map(Number);
      const rgb = pm[col];
      if (!rgb) throw new Error(`${p.name}: パレットにない色名 ${col}`);
      data.set([rgb[0], rgb[1], rgb[2], 255], ((y - y0) * w + (x - x0)) * 4);
    }
    writePNG(path.join(charDir, 'parts', `${p.name}.png`), w, h, data);
    rig.parts[p.name].size = [w, h];
    rig.parts[p.name].pivot = [-x0, -y0];
  }
  for (const n of Object.keys(rig.parts)) if (!seen.has(n)) throw new Error(`${n} が描かれていません`);
  fs.writeFileSync(rigPath, formatRig(rig));
  return partsList.length;
}
