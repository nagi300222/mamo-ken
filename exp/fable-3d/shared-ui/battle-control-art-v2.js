// Matte battle controls v2 — art direction: Claude (docs/ui-bible/20_battle_visual_v2.md).
// Data-only module. Not wired yet: Codex replaces the import of battle-control-art.js
// in battle-ui.js with this module (see the spec, section 6).
//
// Fixed from PR #230 (DO NOT EDIT): reference, bounds (x,y,w,h) and the rim/face/edge
// silhouettes. Hit boxes are computed from bounds exactly as before, so the tap area
// is unchanged. Only the drawn art is scaled by --art-scale.

export const ART_REFERENCE = Object.freeze({left:574, top:140});

// Stencil glyphs on a 24×24 grid, cap height y=3..21 (18 units). Stroked, not filled.
export const GLYPHS = Object.freeze({
 A:'M4.6 21L12 3L19.4 21M7.7 14.4H16.3',
 B:'M6.6 21V3H12.9C16.1 3 17.9 4.7 17.9 7.4C17.9 10.1 16.1 11.8 12.9 11.8H6.6M12.9 11.8H13.6C17 11.8 18.9 13.6 18.9 16.4C18.9 19.2 17 21 13.6 21H6.6',
 X:'M5.2 3L18.8 21M18.8 3L5.2 21',
 Y:'M5 3L12 12.4L19 3M12 12.4V21',
 Z:'M5.6 3.6H18.4L5.6 20.4H18.4',
 S:'M17.9 6.3C16.8 4.1 14.6 3 12 3C8.7 3 6.3 4.9 6.3 7.7C6.3 10.5 8.5 11.5 12 12.1C15.7 12.7 17.9 13.9 17.9 16.6C17.9 19.4 15.5 21 12 21C9 21 6.8 19.8 5.6 17.6',
});
export const GLYPH_STROKE = 4.4;

// Palette order: base(drop plate), rim, face, dish, glyph, shade(glyph emboss).
const P = (base,rim,face,dish,glyph,shade)=>({base,rim,face,dish,glyph,shade});
export const DISABLED = P('#0C0D0E','#1C1E21','#3A3D42','#34373B','#868C94','#1E2023');

const RIM = {
 S:'M95.4 27.7Q103.1 42.1 99.3 57.8Q95.6 73.4 85.3 85.8Q74.9 98.3 58.7 99.6Q42.6 100.9 27.9 94.3Q13.3 87.7 7.2 73Q1.1 58.3 2.2 42.3Q3.2 26.3 15.2 15.4Q27.1 4.5 42.8 2.5Q58.5 0.5 73.1 6.9Q87.8 13.2 95.4 27.7Z',
 A:'M64.7 16Q74.1 26.7 70.8 40.5Q67.6 54.3 56.8 63.3Q46.1 72.3 32.4 69.3Q18.8 66.2 9.2 55.7Q-0.5 45.3 2.8 31.3Q6.1 17.4 17.1 8.7Q28 -0.1 41.7 2.6Q55.4 5.4 64.7 16Z',
 B:'M55.9 23.7Q59 34.6 54 45.3Q49.1 56 37.5 58.4Q25.9 60.7 15.4 55.5Q4.8 50.4 2.7 38.9Q0.5 27.4 5.5 16.9Q10.4 6.5 21.9 3.1Q33.4 -0.2 43.2 6.3Q52.9 12.8 55.9 23.7Z',
 Y:'M3.8 38.4A102.5 102.5 0 0 1 34 5.6A15.5 15.5 0 0 1 53.9 29.4A67.5 67.5 0 0 0 39.2 54.9A19.5 19.5 0 0 1 3.8 38.4Z',
 X:'M16.1 3.6A102.5 102.5 0 0 1 60.6 5.5A19.5 19.5 0 0 1 47.3 42.2A67.5 67.5 0 0 0 18.9 34.5A15.5 15.5 0 0 1 16.1 3.6Z',
 Z:'M77.8 28.6A92 92 0 0 1 12.1 34.3A14 14 0 0 1 19.9 7.4A64 64 0 0 0 65.6 3.4A14 14 0 0 1 77.8 28.6Z',
};
const FACE = {
 S:'M89.1 29.4Q95.7 41.8 92.5 55.2Q89.3 68.7 80.4 79.4Q71.5 90.1 57.6 91.2Q43.7 92.3 31.1 86.7Q18.5 81 13.3 68.3Q8 55.7 8.9 41.9Q9.8 28.2 20.1 18.8Q30.4 9.4 43.9 7.7Q57.4 6 70 11.5Q82.6 16.9 89.1 29.4Z',
 A:'M60.8 17.3Q68.9 26.5 66.1 38.4Q63.3 50.2 54 58Q44.8 65.7 33.1 63.1Q21.4 60.5 13.1 51.5Q4.8 42.5 7.6 30.5Q10.4 18.5 19.9 11Q29.3 3.5 41 5.8Q52.8 8.2 60.8 17.3Z',
 B:'M52.2 23.2Q54.9 32.6 50.6 41.8Q46.4 51 36.4 53Q26.4 55 17.4 50.6Q8.3 46.1 6.4 36.3Q4.6 26.4 8.8 17.4Q13.1 8.4 23 5.5Q32.9 2.7 41.3 8.2Q49.6 13.8 52.2 23.2Z',
 Y:'M8.1 34.9A99.5 99.5 0 0 1 33.3 8.7A12.5 12.5 0 0 1 50 27.3A70.5 70.5 0 0 0 37.5 50A16.5 16.5 0 0 1 8.1 34.9Z',
 X:'M19.8 4.8A99.5 99.5 0 0 1 56.2 5.7A16.5 16.5 0 0 1 46.1 37.1A70.5 70.5 0 0 0 21.1 29.8A12.5 12.5 0 0 1 19.8 4.8Z',
 Z:'M73.4 25.8A89 89 0 0 1 16.3 30.8A11 11 0 0 1 21.5 9.5A67 67 0 0 0 64.5 5.7A11 11 0 0 1 73.4 25.8Z',
};
const DISH = {
 S:'M79.3 32.9Q84.2 42.1 81.8 52.1Q79.4 62.1 72.8 70.1Q66.2 78.1 55.8 78.9Q45.4 79.7 36.1 75.5Q26.7 71.3 22.8 61.9Q18.9 52.5 19.6 42.2Q20.2 32 27.9 25Q35.6 18 45.6 16.7Q55.6 15.5 65 19.5Q74.4 23.6 79.3 32.9Z',
 A:'M54.7 20.2Q60.7 27 58.7 35.9Q56.6 44.7 49.7 50.5Q42.8 56.2 34.1 54.3Q25.4 52.3 19.2 45.6Q13 38.9 15.1 30Q17.2 21.1 24.2 15.5Q31.3 9.9 40 11.6Q48.8 13.4 54.7 20.2Z',
 B:'M46.5 23.3Q48.4 30.3 45.2 37.2Q42.1 44 34.7 45.5Q27.2 47 20.5 43.7Q13.7 40.4 12.3 33.1Q11 25.7 14.1 19Q17.3 12.3 24.7 10.2Q32 8 38.3 12.2Q44.5 16.3 46.5 23.3Z',
 Y:'M13.9 31.2A95.5 95.5 0 0 1 32.8 13.2A8.5 8.5 0 0 1 44.7 25.3A74.5 74.5 0 0 0 35.6 43.7A12.5 12.5 0 0 1 13.9 31.2Z',
 X:'M24.4 7.2A95.5 95.5 0 0 1 50.6 6.7A12.5 12.5 0 0 1 44 30.8A74.5 74.5 0 0 0 24.5 24.2A8.5 8.5 0 0 1 24.4 7.2Z',
 Z:'M67.8 22.3A85 85 0 0 1 21.5 26.4A7 7 0 0 1 24.1 12.6A71 71 0 0 0 62.8 9.2A7 7 0 0 1 67.8 22.3Z',
};

// Role-specific extra layers (drawn between dish and glyph).
const S_CORE = {cx:51.4, cy:49.2, r:36.5};
const tick = deg => {
 const a = deg*Math.PI/180, p = r => [(S_CORE.cx+r*Math.cos(a)).toFixed(1),(S_CORE.cy+r*Math.sin(a)).toFixed(1)];
 const [x1,y1]=p(37.8),[x2,y2]=p(41.8);return `M${x1} ${y1}L${x2} ${y2}`;
};
const EXTRAS = {
 // S = core: dark iron collar (the face path) + inner core disc + four rivet ticks.
 S:`<circle class="bt-core" cx="${S_CORE.cx}" cy="${S_CORE.cy}" r="${S_CORE.r}"/>`
  +`<path class="bt-ticks" d="${[45,135,225,315].map(tick).join('')}"/>`,
 // X / Y = special: an engraved groove that follows the bean.
 X:'<path class="bt-groove" d="'+DISH.X+'"/>',
 Y:'<path class="bt-groove" d="'+DISH.Y+'"/>',
 // Z = auxiliary: two end pips, like the stops of a slide rail.
 Z:'<circle class="bt-pip" cx="21.3" cy="19.6" r="2.4"/><circle class="bt-pip" cx="66.6" cy="15.6" r="2.4"/>',
};

// bounds = PR #230 hit geometry (unchanged). glyph = [centerX, centerY, capHeight] in art units.
// artScale = drawn size ÷ hit size. palettes: normal / pressed / wait / ready (X only).
const SPEC = {
 S:{viewBox:'0 0 103 102',bounds:[699.4,199.6,103,102],glyph:[51.4,49.2,24],artScale:.95,
  normal:P('#120804','#2B140A','#3A2A21','#A34A18','#FFF1DE','#4A1C08'),
  pressed:P('#120804','#2B140A','#2B1F18','#793712','#E6D3BA','#3C1706'),
  core:{normal:'#B4521C',pressed:'#853D15',wait:'#B4521C',ready:'#B4521C'},tick:'#6B5444'},
 A:{viewBox:'0 0 74 73',bounds:[584.1,217.9,74,73],glyph:[37,36,19],artScale:.92,
  normal:P('#110908','#2A1714','#8C3F33','#7E382D','#F6EDE4','#3E1C16'),
  pressed:P('#110908','#2A1714','#682F26','#5D2921','#DED0C2','#30150F')},
 B:{viewBox:'0 0 60 62',bounds:[648.5,273.2,60,62],glyph:[29.4,29.8,17],artScale:.92,
  normal:P('#0A0C0F','#161B22','#4F5B6B','#46515F','#F1ECE4','#20262E'),
  pressed:P('#0A0C0F','#161B22','#3A434F','#343C46','#D8D1C6','#181D24')},
 Y:{viewBox:'0 0 62 69',bounds:[651.5,167.3,62,69],glyph:[30.6,30.4,16],artScale:.90,
  normal:P('#0E0C06','#241F10','#7B6731','#6E5C2B','#FBF5E6','#322A13'),
  pressed:P('#0E0C06','#241F10','#5B4C24','#514420','#E2D9C0','#272010')},
 X:{viewBox:'0 0 76 46',bounds:[725.1,146.3,76,46],glyph:[37,18.2,14],artScale:.90,
  normal:P('#0A0914','#17152B','#47407E','#3E3870','#F1EEFF','#1F1C3A'),
  pressed:P('#0A0914','#17152B','#352F5D','#2E2953','#D6D1EE','#17152D'),
  wait:P('#0A0A10','#17161F','#34324A','#2F2D42','#A6A2C2','#1A1926'),
  ready:P('#1A0E02','#3A2206','#D89B24','#C78A19','#2A1804','#EDBA4A'),
  readyPressed:P('#1A0E02','#3A2206','#A0731B','#936613','#2A1804','#C08A2A')},
 Z:{viewBox:'0 0 88 40',bounds:[712.5,304.1,88,40],glyph:[44.3,19.6,14],artScale:.92,
  normal:P('#07121A','#0F2230','#2F6F86','#296276','#EAF7FB','#143040'),
  pressed:P('#07121A','#0F2230','#235263','#1E4957','#D0E4EA','#0F2633'),
  wait:P('#0B0D0F','#15191D','#33393F','#2E3439','#929AA2','#1A1E22')},
};

const vars = (prefix, palette) => Object.entries(palette).map(([k,v])=>`--${prefix}-${k}:${v}`);

function build(symbol) {
 const s = SPEC[symbol], [x,y,w,h] = s.bounds, [gx,gy,cap] = s.glyph, k = cap/18;
 const style = [
  `--cx:${+(x+w/2-ART_REFERENCE.left).toFixed(2)}`, `--cy:${+(y+h/2-ART_REFERENCE.top).toFixed(2)}`,
  `--art-w:${w}`, `--art-h:${h}`, `--art-scale:${s.artScale}`,
  ...vars('n', s.normal), ...vars('p', s.pressed),
  ...(s.wait ? vars('w', s.wait) : []),
  ...(s.ready ? [...vars('r', s.ready), ...vars('rp', s.readyPressed)] : []),
  ...(s.core ? [`--core-n:${s.core.normal}`,`--core-p:${s.core.pressed}`,`--tick:${s.tick}`] : []),
 ].join(';');
 const glyphTransform = `translate(${+(gx-12*k).toFixed(2)} ${+(gy-12*k).toFixed(2)}) scale(${+k.toFixed(4)})`;
 const svg = `<svg class="bt" data-symbol="${symbol}" viewBox="${s.viewBox}" aria-hidden="true" focusable="false">`
  + `<path class="bt-base" d="${RIM[symbol]}"/>`
  + `<g class="bt-body">`
  +  `<path class="bt-rim" d="${RIM[symbol]}"/>`
  +  `<path class="bt-face" d="${FACE[symbol]}"/>`
  +  (symbol==='S' ? EXTRAS.S : '')
  +  `<path class="bt-dish" d="${DISH[symbol]}"/>`
  +  (symbol!=='S' && EXTRAS[symbol] ? EXTRAS[symbol] : '')
  +  `<g class="bt-glyph" transform="${glyphTransform}" stroke-width="${GLYPH_STROKE}">`
  +   `<path class="bt-glyph-shade" d="${GLYPHS[symbol]}" transform="translate(0 1.1)"/>`
  +   `<path class="bt-glyph-ink" d="${GLYPHS[symbol]}"/>`
  +  `</g>`
  + `</g>`
  + (symbol==='X' ? `<path class="bt-ring" d="${RIM.X}"/>` : '')
  + `</svg>`;
 return Object.freeze({symbol, viewBox:s.viewBox, bounds:s.bounds, artScale:s.artScale, style, svg});
}

export const battleControlArtV2 = Object.freeze(Object.fromEntries(Object.keys(SPEC).map(k=>[k,build(k)])));

// Unchanged from PR #230: the READY flame placed at the inner end of the 奥義 gauge.
export const readyFlame = Object.freeze({
 viewBox:'0 0 20 28',
 face:'M10 1C13 6 18 9 18 16C18 22.5 14.4 27 10 27C5.6 27 2 22.5 2 16.5C2 12.5 4.5 10 6 7.5C6.6 10 7.6 11.5 9 12.3C8.6 8.4 9 4.6 10 1Z',
 inner:'M10.3 11C12.6 14 14.2 16.4 14.2 19.6C14.2 23.2 12.4 25 10 25C7.6 25 5.8 23.2 5.8 20.2C5.8 18 7 16.6 8 15.4C8.4 17 9 17.8 9.8 18.2C9.6 15.6 9.7 13.2 10.3 11Z',
});
