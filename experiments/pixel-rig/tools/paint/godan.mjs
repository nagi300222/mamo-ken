// ゴダンのパーツ描画。幅広の肩、太い腕、重い胴体。濃いチョコブラウンで胸だけ少し明るい。黒帯。
// 拳は大きく濃色。横拳を親指側から見た形（遠い手）は、親指を下半分に置く。手の甲に指の筋は描かない。
import { Part } from '../lib/paint.mjs';

const F = 'fur.3', FS = 'fur.2', FD = 'fur.1', FL = 'fur.0', FH = 'fur.4';
const C = 'cream.3', CS = 'cream.2', CL = 'cream.4';
const D = 'dark.3', DL = 'dark.4', DK = 'dark.1', DS = 'dark.2';
const K = 'black.3', KS = 'black.2', KL = 'black.4';

export function paint() {
  const P = [];
  const part = (name, fn) => { const p = new Part(name); fn(p); P.push(p); return p; };

  // ---- 胴体（骨盤・腹・胸の3つとも幅が広い。胸の上部だけ明るい毛） ----
  const pelvisShape = (p) => p.ell(-2, -11, 31, 24, F);
  const torsoShape = (p, ox = 0, oy = 0) => p.ell(ox, oy - 9, 31, 22, F);
  part('pelvis', (p) => {
    pelvisShape(p);
    p.tufts(-2, -11, 31, 24, [140, 158, 176, 194, 212], F, 3);
    p.ticks([[-27, -12], [-20, -4], [-27, 0, 1, 2], [-14, 5], [-21, 7, 1, 2]], FS);
    p.ticks([[14, -8, -1], [20, 0, -1], [9, 5, -1]], FS);
  });
  part('torso', (p) => {
    torsoShape(p);
    p.tufts(0, -9, 31, 22, [160, 180, 200], F, 3);
    p.ell(14, -17, 14, 11, C, 'in');
    p.saw(C, F);
    p.ticks([[-24, -14], [-18, -5], [-26, -4, 1, 2], [-10, -16]], FS);
    p.ticks([[12, -18, -1], [18, -11, -1]], CS);
  });
  part('chest', (p) => {
    p.ell(1, -9, 27, 19, F);
    p.tufts(1, -9, 27, 19, [170, 190, 212], F, 3);
    p.ell(13, -6, 14, 14, C, 'in');
    p.tufts(1, -9, 27, 19, [10, 30], C, 3);
    p.saw(C, F);
    p.ticks([[-20, -14], [-14, -6], [-22, -5, 1, 2]], FS);
    p.ticks([[12, -10, -1], [18, -3, -1], [8, -1, -1]], CS);
  });
  part('neck', (p) => { p.ell(0, 2, 16, 11, F); p.ell(10, 5, 7, 7, C, 'in'); });

  // ---- 脚（太く短い） ----
  for (const s of ['l', 'r']) {
    part(`thigh_${s}`, (p) => {
      p.cap(0, 0, 13.5, 0, 16, 10, F);
      if (s === 'r') p.line(-11, 5, -9, 15, FS, 'in');
    });
    part(`shin_${s}`, (p) => p.cap(0, 0, 8.5, 0, 13, 6.5, F));
    part(`foot_${s}`, (p) => {
      // 大きく厚い足。足裏は y=5。
      p.rows(-6, -4, [
        '...FFFFFFFF..........',
        '..FFFFFFFFFFFF.......',
        '.FFFFFFFFFFFFFFF.....',
        'FFFFFFFFFFFFFFFFFF...',
        'FFFFFFFFFFFFFFFFFFFF.',
        'FFFFFFFFFFFFFFFFFFFF.',
        'FFFFFFFFFFFFFFFFFFFF.',
        'FFFFFFFFFFFFFFFFFFFF.',
        'FFFFFFFFFFFFFFFFFFFF.',
      ], { F });
    });
    part(`toe_${s}`, (p) => {
      p.rows(-1, -6, [
        'DDDDD.......',
        'DDDDDDDD....',
        'DDDDDDDDDD..',
        'DDDDDDDDDDD.',
        'DDcDDDcDDDDc',
        'DDcDDDcDDDcc',
      ], { D, c: 'claw' });
    });
  }

  // ---- 腕（肩が大きく、手首まで太い。手首に濃色のバンド状の境目） ----
  for (const s of ['l', 'r']) {
    part(`upperarm_${s}`, (p) => {
      p.cap(0, 0, 11.5, 0, 15, 9, F);
      p.tufts(0, 0, 11.5, 11.5, [200, 235, 270], F, 3, 0);      // 肩の毛
      p.ticks([[-7, 2], [-4, 9], [3, 4, -1]], FS);
    });
    part(`forearm_${s}`, (p) => {
      p.cap(0, 0, 8.5, 0, 14, 8, F);
      p.poly([[-9, 10], [9, 10], [9, 14], [-9, 14]], DK, 'in');
    });
  }
  const m = { D, d: DK, L: DL };
  const fl = part('fist_l_punch', (p) => p.rows(-1, -8, [
    '....DDDDDDDDD....',
    '..DDDDDDDDDDDDD..',
    '.DDDDDDDDDDDDDDD.',
    'DDDDDDDDDDDDDDDDd',
    'DDDDDDDDDDDDDDDDD',
    'DDDDDDDDDDDDDDDDd',
    'DDDDDDDDDDDDDDDDD',
    'DDDDDDDDDDDDDDDDd',
    'DDDdddddddddDDDDD',
    'DDDLLLLLLLLLLdDDd',
    'DDDLLLLLLLLLLdDDD',
    'DDDLLLLLLLLLdDDD.',
    '.DDDddddddddDDDD.',
    '..DDDDDDDDDDDDD..',
    '....DDDDDDDDD....',
  ], m));
  const fr = part('fist_r_punch', (p) => p.rows(-1, -8, [
    '....DDDDDDDDD....',
    '..DDDDDDDDDDDDD..',
    '.DDDDDDDDDDDDDDD.',
    'DDDDDDDDDDDDDDDDd',
    'DDDDDDDDDDDDDDDDD',
    'DDDDDDDDDDDDDDDDd',
    'DDDDDDDDDDDDDDDDD',
    'DDDDDDDDDDDDDDDDd',
    'DDDDDDDDDDDDDDDDD',
    'DDDDDDDDddddDDDDd',
    'DDDDDDDdDDDDdDDDD',
    'DDDDDDDdDDDdDDDD.',
    '.DDDDDDDdddDDDDD.',
    '..DDDDDDDDDDDDD..',
    '....DDDDDDDDD....',
  ], m));
  P.push(fl.rotCCW('fist_l_guard'), fr.rotCCW('fist_r_guard'));

  // ---- 頭（大きく角ばった頭、張り出した眉、広く明るいマズル。耳は小さく後ろ寄り） ----
  const cx = 7, cy = -12;
  part('head', (p) => {
    p.ell(cx, cy, 20, 17, F);
    p.ell(cx + 10, cy - 6, 10, 6.5, F);        // 眉の張り出し
    p.ell(cx - 10, cy + 5, 12, 12, F);         // 太い首の後ろ
    p.ell(cx + 2, cy + 9, 17, 10, F);
    p.tufts(cx + 2, cy + 9, 17, 10, [115, 140, 165], F, 3);
    p.ell(cx + 14, cy + 6, 11, 8.5, F);        // 幅広で短いマズル
    p.ell(cx + 15, cy + 8, 10, 6.5, C, 'in');
    p.ell(cx + 9, cy + 14, 10, 4, C, 'in');
    p.ell(cx + 9, cy - 9, 7, 2.6, C, 'in');    // 眉の明るい毛
    p.rows(cx + 20, cy - 1, ['.NNNN.', 'NnnNNN', 'NNNNNN', 'NNNNNN', '.NNNN.'], { N: 'nose', n: 'nosehi' });
    p.dots([[cx + 23, cy + 4], [cx + 23, cy + 5], [cx + 23, cy + 6]], FL);
    p.dots([[cx + 15, cy + 6], [cx + 13, cy + 8], [cx + 16, cy + 9]], CS);
    p.ticks([[cx - 16, cy + 1], [cx - 9, cy + 9], [cx - 17, cy + 10, 1, 2], [cx - 5, cy - 13, 1, 2]], FS);
  });
  part('jaw', (p) => p.ell(8, 3, 9, 4.5, C));
  // への字口（口角が下がる）
  part('mouth_closed', (p) => p.dots([[1, 2], [2, 1], [3, 1], [4, 0], [5, 0], [6, 0], [7, -1], [8, -1], [9, -1], [10, -1], [11, -1], [12, -1], [13, -1], [14, -1], [15, -1], [16, -1]], 'mouth'));
  part('mouth_open', (p) => p.ell(cx + 15, cy + 13, 6.5, 3.4, 'mouth'));
  part('mouth_grit', (p) => {
    p.dots([[2, 1], [3, 1], [4, 0], [5, 0], [6, 0], [7, -1], [8, -1], [9, -1], [10, -1], [11, -1], [12, -1], [13, -1], [14, -1], [15, -1], [16, -1]], 'mouth');
    p.dots([[8, 0], [9, 0], [10, 0], [11, 0], [12, 0], [13, 0], [14, 0], [15, 0]], 'tooth');
    p.dots([[7, 1], [8, 1], [9, 1], [10, 1], [11, 1], [12, 1], [13, 1], [14, 1], [15, 1]], 'mouth');
  });
  const ex = cx + 4, ey = cy - 6;
  const em = { E: 'eye', H: 'eyehi', L: FL };
  // 目は細く、太い眉が鼻側へ下がる
  part('eye_open', (p) => p.rows(ex, ey, ['LLLL.....', '.LLLLLL..', '...LLLLLL', '...EEEHE.', '...EEEEE.', '....EEE..'], em));
  part('eye_half', (p) => p.rows(ex, ey, ['LLLL.....', '.LLLLLL..', '...LLLLLL', '...LLLLL.', '...EEEHE.', '....EEE..'], em));
  part('eye_closed', (p) => p.rows(ex, ey, ['LLLL.....', '.LLLLLL..', '...LLLLLL', '.........', '...LLLLL.', '.........'], em));
  part('eye_hurt', (p) => p.rows(ex, ey, ['LLLL.....', '.LLLLLL..', '...LLLLLL', '...L.....', '....LLLL.', '...L.....'], em));
  part('brow_angry', (p) => p.rows(ex, ey - 1, ['LLLLL....', '..LLLLLL.'], em));

  part('ear_r', (p) => { p.ell(0, -1.5, 4.2, 3.8, F); p.ell(0.5, -1, 2, 2, FD); });
  part('ear_l', (p) => { p.ell(0, -1, 3.4, 3.2, F); p.ell(0.5, -0.5, 1.6, 1.6, FD); });

  // ---- 黒帯（腰に巻き、腹の前で結ぶ。垂れ2本は揺れる骨） ----
  part('belt', (p) => {
    const body = new Part('tmp'); pelvisShape(body); torsoShape(body, 1, -21);
    const band = new Part('tmp2');
    band.poly([[-36, -26], [34, -22], [34, -15], [-36, -19]], K);
    for (const k of band.px.keys()) {
      const [x, y] = k.split(',').map(Number);
      let near = false;
      for (const [dx, dy] of [[0, 0], [1, 0], [-1, 0]]) if (body.get(x + dx, y + dy)) near = true;
      if (near) p.px.set(k, K);
    }
    p.line(-20, -24, 8, -22, KL, 'in');
  });
  part('belt_knot', (p) => { p.ell(20.5, -18, 4, 3.6, K); p.dots([[19, -19], [20, -19], [21, -18]], KL); });
  part('belt_a1', (p) => p.poly([[0, -2.5], [9, -3], [9, 3], [0, 2.5]], K));
  part('belt_a2', (p) => { p.poly([[0, -3], [9, -3], [9, 3], [0, 3]], K); p.line(2, -2, 7, -2, KL); });
  part('belt_b1', (p) => p.poly([[0, -2.5], [8, -3], [8, 3], [0, 2.5]], K));
  part('belt_b2', (p) => { p.poly([[0, -3], [8, -3], [8, 3], [0, 3]], K); p.line(2, 2, 6, 2, KS); });

  // ---- 尻尾（短い） ----
  part('tail_base', (p) => p.cap(0, 0, 5, 5, 0, 4.5, F));
  part('tail_mid', (p) => p.cap(0, 0, 4.5, 4, 0, 4, F));
  part('tail_tip', (p) => { p.cap(0, 0, 4, 3, 0, 2.5, F); p.cap(2, 0, 2.5, 4, 0, 2, FD, 'in'); });

  return P;
}
