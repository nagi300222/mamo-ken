// モグゾーのパーツ描画。座標は各パーツの関節（回転中心）を (0,0) とした相対座標。
// 形はすべてここで新規に設計したもので、参照画像からの変換・トレースは行っていない。
import { Part } from '../lib/paint.mjs';

const F = 'fur.3', FS = 'fur.2', FD = 'fur.1', FL = 'fur.0';
const C = 'cream.3', CS = 'cream.2';
const D = 'dark.3', DL = 'dark.4', DK = 'dark.1';
const R = 'red.3', RS = 'red.2';

export function paint() {
  const P = [];
  const part = (name, fn) => { const p = new Part(name); fn(p); P.push(p); return p; };

  // ---- 胴体（洋梨型: 骨盤が一番大きく、胸に向けて細くなる） ----
  part('pelvis', (p) => {
    p.ell(-2, -9, 27, 25, F);
    p.tufts(-2, -9, 27, 25, [150, 170, 192, 212], F);   // 腰の後ろの毛
    p.ell(13, -9, 13, 21, C, 'in');           // 腹の明るい毛
    p.saw(C, F);
    p.ticks([[-22, -12], [-17, -3], [-23, 0], [-12, 6], [-19, 8, 1, 2]], FS);
    p.ticks([[8, -14, -1], [14, -4, -1], [7, 3, -1], [16, 6, -1, 2]], CS);
  });
  part('torso', (p) => {
    p.ell(0, -8, 23, 19, F);
    p.tufts(0, -8, 23, 19, [165, 195], F);
    p.ell(11, -8, 11, 17, C, 'in');
    p.saw(C, F);
    p.ticks([[-17, -12], [-13, -3], [-19, -4, 1, 2]], FS);
    p.ticks([[9, -14, -1], [13, -5, -1]], CS);
  });
  part('chest', (p) => {
    p.ell(0, -9, 19, 15, F);
    p.tufts(0, -9, 19, 15, [185, 15, 40], F);
    p.ell(9, -7, 10, 12, C, 'in');
    p.tufts(0, -9, 19, 15, [15, 40], C);                // 胸の前の毛
    p.saw(C, F);
    p.ticks([[-14, -12], [-10, -5]], FS);
    p.ticks([[10, -10, -1], [6, -3, -1]], CS);
  });
  part('neck', (p) => {
    p.ell(0, 2, 12, 9, F);
    p.ell(8, 5, 6, 6, C, 'in');
  });

  // ---- 脚 ----
  for (const s of ['l', 'r']) {
    part(`thigh_${s}`, (p) => {
      p.cap(0, 0, 11, 0, 14, 8, F);
      if (s === 'r') p.line(-9, 4, -7, 13, FS, 'in');   // 太ももの前縁のしわ（回転後に前側へ来る）
    });
    part(`shin_${s}`, (p) => p.cap(0, 0, 7, 0, 12, 5, F));
    part(`foot_${s}`, (p) => {
      // 足首が関節。かかとは後ろへ 5px、母指球（つま先の付け根）は前へ 12px。足裏は y=5。
      p.rows(-5, -3, [
        '...FFFFFFF........',
        '..FFFFFFFFFF......',
        '.FFFFFFFFFFFFF....',
        'FFFFFFFFFFFFFFFF..',
        'FFFFFFFFFFFFFFFFF.',
        'FFFFFFFFFFFFFFFFF.',
        'FFFFFFFFFFFFFFFFF.',
        'FFFFFFFFFFFFFFFFF.',
      ], { F });
    });
    part(`toe_${s}`, (p) => {
      // 足先は濃色、爪は黒
      p.rows(-1, -5, [
        'DDDD......',
        'DDDDDDD...',
        'DDDDDDDDD.',
        'DDcDDcDDDc',
        'DDcDDcDDcc',
      ], { D, c: 'claw' });
    });
  }

  // ---- 腕 ----
  for (const s of ['l', 'r']) {
    part(`upperarm_${s}`, (p) => p.cap(0, 0, 7, 0, 14, 6.5, F));
    part(`forearm_${s}`, (p) => {
      p.cap(0, 0, 6.5, 0, 13, 5.5, F);
      p.cap(0, 13, 5.5, 0, 15, 5.5, D, 'in');          // 手首の際だけ焦げ茶
    });
  }
  // 拳。手の甲側に指の筋は描かない。遠い手（l）は親指側から見た形で、親指は下半分。
  const m = { D, d: DK, L: DL };
  part('fist_l_punch', (p) => p.rows(-1, -6, [
    '...DDDDDDD...',
    '.DDDDDDDDDDD.',
    'DDDDDDDDDDDDD',
    'DDDDDDDDDDDDd',
    'DDDDDDDDDDDDD',
    'DDDDDDDDDDDDd',
    'DDdddddddDDDD',
    'DDDLLLLLLLdDD',
    'DDDLLLLLLLdDD',
    '.DDDddddddDD.',
    '..DDDDDDDDD..',
    '....DDDDD....',
  ], m));
  part('fist_r_punch', (p) => p.rows(-1, -6, [
    '...DDDDDDD...',
    '.DDDDDDDDDDD.',
    'DDDDDDDDDDDDD',
    'DDDDDDDDDDDDd',
    'DDDDDDDDDDDDD',
    'DDDDDDDDDDDDd',
    'DDDDDDDDDDDDD',
    'DDDDDDdddDDDd',
    'DDDDDdDDDdDDD',
    '.DDDDDddDdDD.',
    '..DDDDDDDDD..',
    '....DDDDD....',
  ], m));
  part('fist_l_guard', (p) => p.rows(-6, -13, [
    '..DDdDdDD...',
    '.DDDDDDDDD..',
    'DDDDDDDDDDD.',
    'DDDDDDDDDDDD',
    'DDDDDDdDDDDD',
    'DDDDDDdLLdDD',
    'DDDDDDdLLdDD',
    'DDDDDDdLLdDD',
    'DDDDDDdLLdDD',
    'DDDDDDdLLdDD',
    '.DDDDDDddDD.',
    '.DDDDDDDDDD.',
    '..DDDDDDDD..',
    '...DDDDDD...',
  ], m));
  part('fist_r_guard', (p) => p.rows(-6, -13, [
    '..DDdDdDD...',
    '.DDDDDDDDD..',
    'DDDDDDDDDDD.',
    'DDDDDDDDDDDD',
    'DDDDDDDDDDDD',
    'DDDDDDDDdDDD',
    'DDDDDDDdDdDD',
    'DDDDDDDdDdDD',
    'DDDDDDDDdDDD',
    'DDDDDDDDDDDD',
    '.DDDDDDDDDD.',
    '.DDDDDDDDDD.',
    '..DDDDDDDD..',
    '...DDDDDD...',
  ], m));

  // ---- 頭（横顔。鼻先が右）。c = 頭の中心 ----
  const cx = 6, cy = -11;
  const headShape = (p) => {
    p.ell(cx, cy, 17, 15, F);                 // 頭蓋
    p.ell(cx - 8, cy + 5, 10, 10, F);         // うなじ
    p.ell(cx + 3, cy + 8, 15, 9, F);          // 頬
    p.ell(cx + 12, cy + 4, 9.5, 7.5, F);      // マズル（短く丸い）
  };
  part('head', (p) => {
    headShape(p);
    p.tufts(cx + 3, cy + 8, 15, 9, [120, 150], F);          // 頬の毛
    p.ell(cx + 14, cy + 7, 8, 5.5, C, 'in');  // マズルの明るい毛
    p.ell(cx + 8, cy + 12, 10, 5, C, 'in');   // 頬〜あご下
    p.rows(cx + 17, cy - 2, ['.NNN.', 'NnnNN', 'NNNNN', '.NNN.'], { N: 'nose', n: 'nosehi' });
    p.dots([[cx + 19, cy + 2], [cx + 19, cy + 3], [cx + 19, cy + 4]], FL);   // 人中
    p.dots([[cx + 13, cy + 5], [cx + 11, cy + 7]], CS);   // ひげの付け根
    p.ticks([[cx - 12, cy + 2], [cx - 7, cy + 8], [cx - 13, cy + 9, 1, 2]], FS);
  });
  part('jaw', (p) => {
    // 関節 = 口角のやや後ろ。あご先は +x 方向
    p.ell(7, 2, 7, 3.5, C);
  });
  part('mouth_closed', (p) => p.dots([[3, -1], [4, -1], [5, -1], [6, -1], [7, -1], [8, -2], [9, -2], [10, -2], [11, -2], [12, -2], [13, -2]].map(([x, y]) => [x, y + 1]), 'mouth'));
  part('mouth_open', (p) => p.ell(cx + 13, cy + 10, 5, 3, 'mouth'));
  part('mouth_grit', (p) => {
    p.dots([[3, 0], [4, 0], [5, 0], [6, -1], [7, -1], [8, -1], [9, -1], [10, -1], [11, -1], [12, -1], [13, -1]], 'mouth');
    p.dots([[8, 0], [9, 0], [10, 0], [11, 0], [12, 0]], 'tooth');
    p.dots([[7, 1], [8, 1], [9, 1], [10, 1], [11, 1], [12, 1]], 'mouth');
  });
  const ex = cx + 3, ey = cy - 4;
  const em = { E: 'eye', H: 'eyehi', L: FL };
  part('eye_open', (p) => p.rows(ex, ey, ['.EEEE.', 'EEEHHE', 'EEEEHE', 'EEEEEE', 'EEEEEE', '.EEEE.'], em));
  part('eye_half', (p) => p.rows(ex, ey, ['......', 'LLLLLL', 'EEEEHE', 'EEEEEE', 'EEEEEE', '.EEEE.'], em));
  part('eye_closed', (p) => p.rows(ex, ey, ['......', '......', 'L....L', '.LLLL.', '......', '......'], em));
  part('eye_hurt', (p) => p.rows(ex, ey, ['......', 'L.....', '.LL...', '...LLL', '.LL...', 'L.....'], em));
  part('brow_angry', (p) => p.rows(ex, ey - 1, ['LLL....', '..LLLLL'], em));

  part('ear_r', (p) => { p.ell(0, -1.5, 4.2, 4, F); p.ell(0.5, -1, 2, 2.3, FD); });
  part('ear_l', (p) => { p.ell(0, -1, 3.4, 3.2, F); p.ell(0.5, -0.5, 1.6, 1.8, FD); });

  // ---- ハチマキ ----
  part('hachi_band', (p) => {
    // 額から後頭部へ、後ろ下がりに巻く。頭の輪郭より 1px 外にはみ出す厚み。
    const head = new Part('tmp'); headShape(head);
    const band = new Part('tmp2');
    band.poly([[cx + 18, cy - 12.5], [cx + 18, cy - 8.5], [cx - 19, cy - 3], [cx - 19, cy - 7.5]], R);
    for (const k of band.px.keys()) {
      const [x, y] = k.split(',').map(Number);
      let near = false;
      for (const [dx, dy] of [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]]) if (head.get(x + dx, y + dy)) near = true;
      if (near) p.px.set(k, R);
    }
    p.ticks([[cx + 2, cy - 10, 1, 2], [cx - 9, cy - 8, 1, 2]], RS);   // 布のしわ
  });
  part('hachi_knot', (p) => { p.ell(-12, -15, 3, 3.2, R); p.dots([[-12, -15], [-13, -14]], RS); });
  part('hachi_a1', (p) => p.poly([[0, -2], [9, -2.5], [9, 2.5], [0, 2]], R));
  part('hachi_a2', (p) => { p.poly([[0, -2.5], [9, -3], [7, 0], [9, 3], [0, 2.5]], R); p.dots([[2, 0], [3, 0]], RS); });
  part('hachi_b1', (p) => p.poly([[0, -1.5], [8, -2], [8, 2], [0, 1.5]], R));
  part('hachi_b2', (p) => p.poly([[0, -2], [8, -2.5], [6, 0], [8, 2.5], [0, 2]], R));

  // ---- 尻尾（短く太い） ----
  part('tail_base', (p) => p.cap(0, 0, 5, 6, 0, 4.5, F));
  part('tail_mid', (p) => p.cap(0, 0, 4.5, 5, 0, 4, F));
  part('tail_tip', (p) => { p.cap(0, 0, 4, 4, 0, 2.5, F); p.cap(3, 0, 2.5, 5, 0, 2, FD, 'in'); });

  return P;
}
