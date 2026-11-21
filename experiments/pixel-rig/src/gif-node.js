// 依存なしの GIF89a エンコーダ（256色以下の RGBA フレーム列 → アニメGIF）。
export function encodeGIF(w, h, frames, { loop = true, bg = [72, 84, 104] } = {}) {
  // frames: [{ data: RGBA, delay: 1/100秒 }]
  const pal = [bg], map = new Map([[(bg[0] << 16) | (bg[1] << 8) | bg[2], 0]]);
  const indexed = frames.map((f) => {
    const out = new Uint8Array(w * h);
    for (let i = 0; i < w * h; i++) {
      if (f.data[i * 4 + 3] < 128) continue;
      const k = (f.data[i * 4] << 16) | (f.data[i * 4 + 1] << 8) | f.data[i * 4 + 2];
      let ci = map.get(k);
      if (ci === undefined) {
        if (pal.length >= 256) throw new Error('GIF: 色数が256を超えました');
        ci = pal.length; map.set(k, ci); pal.push([f.data[i * 4], f.data[i * 4 + 1], f.data[i * 4 + 2]]);
      }
      out[i] = ci;
    }
    return out;
  });
  let bits = 1;
  while ((1 << bits) < pal.length) bits++;
  bits = Math.max(2, bits);
  const out = [];
  const u16 = (v) => out.push(v & 255, (v >> 8) & 255);
  out.push(...Buffer.from('GIF89a'));
  u16(w); u16(h); out.push(0x80 | (bits - 1), 0, 0);
  for (let i = 0; i < 1 << bits; i++) out.push(...(pal[i] || [0, 0, 0]));
  if (loop) out.push(0x21, 0xff, 11, ...Buffer.from('NETSCAPE2.0'), 3, 1, 0, 0, 0);
  indexed.forEach((px, fi) => {
    out.push(0x21, 0xf9, 4, 0x04); u16(frames[fi].delay); out.push(0, 0);
    out.push(0x2c); u16(0); u16(0); u16(w); u16(h); out.push(0);
    // LZW
    const min = bits; out.push(min);
    const clear = 1 << min, eoi = clear + 1;
    let size = min + 1, next = eoi + 1, dict = new Map();
    let cur = 0, nb = 0; const bytes = [];
    const emit = (code) => { cur |= code << nb; nb += size; while (nb >= 8) { bytes.push(cur & 255); cur >>>= 8; nb -= 8; } };
    emit(clear);
    let prefix = px[0];
    for (let i = 1; i < px.length; i++) {
      const c = px[i], key = prefix * 256 + c;
      const hit = dict.get(key);
      if (hit !== undefined) { prefix = hit; continue; }
      emit(prefix);
      if (next < 4096) { dict.set(key, next++); if (next > (1 << size) && size < 12) size++; }
      else { emit(clear); dict = new Map(); size = min + 1; next = eoi + 1; }
      prefix = c;
    }
    emit(prefix); emit(eoi);
    if (nb > 0) bytes.push(cur & 255);
    for (let i = 0; i < bytes.length; i += 255) { const b = bytes.slice(i, i + 255); out.push(b.length, ...b); }
    out.push(0);
  });
  out.push(0x3b);
  return Buffer.from(out);
}
