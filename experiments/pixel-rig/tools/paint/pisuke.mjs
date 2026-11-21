// ピスケのパーツ描画。細身で軽快、明るい砂色。拳は体と同系の明るい色、両手首に青いリストバンド。
// 筋肉の線は描かない（丸い毛の塊として描く）。座標は各パーツの関節を (0,0) とした相対座標。
import { Part } from '../lib/paint.mjs';

const F = 'fur.3', FS = 'fur.2', FD = 'fur.1', FL = 'fur.0';
const C = 'cream.3', CS = 'cream.2', CL = 'cream.4';
const B = 'blue.3', BS = 'blue.2';

export function paint() {
  const P = [];
  const part = (name, fn) => { const p = new Part(name); fn(p); P.push(p); return p; };

  // ---- 胴体（モグゾーより縦長で幅が狭い。ただし痩せさせない） ----
  part('pelvis', (p) => {
    p.ell(-1, -9, 24, 22, F);
    p.tufts(-1, -9, 24, 22, [155, 180, 205], F);
    p.ell(11, -9, 12, 18, C, 'in');
    p.saw(C, F);
    p.ticks([[-18, -11], [-13, -2], [-17, 3, 1, 2], [-8, 7]], FS);
    p.ticks([[7, -13, -1], [11, -3, -1], [6, 4, -1, 2]], CS);
  });
  part('torso', (p) => {
    p.ell(0, -8, 20.5, 18, F);
    p.tufts(0, -8, 20.5, 18, [170, 200], F);
    p.ell(9, -8, 9, 15, C, 'in');
    p.saw(C, F);
    p.ticks([[-14, -11], [-10, -2]], FS);
    p.ticks([[8, -12, -1], [10, -3, -1]], CS);
  });
  part('chest', (p) => {
    p.ell(0, -8, 17.5, 14, F);
    p.tufts(0, -8, 17.5, 14, [190], F);
    p.ell(8, -7, 8, 11, C, 'in');
    p.tufts(0, -8, 17.5, 14, [20], C);
    p.saw(C, F);
    p.ticks([[-11, -11], [-8, -4]], FS);
    p.ticks([[8, -9, -1]], CS);
  });
  part('neck', (p) => { p.ell(0, 2, 11, 8, F); p.ell(7, 4, 5, 5, C, 'in'); });

  // ---- 脚（3体でいちばん長い。蹴りに使う） ----
  for (const s of ['l', 'r']) {
    part(`thigh_${s}`, (p) => {
      p.cap(0, 0, 10, 0, 16, 7, F);
      if (s === 'r') p.line(-8, 5, -6, 14, FS, 'in');
    });
    part(`shin_${s}`, (p) => p.cap(0, 0, 6.5, 0, 15, 4.5, F));
    part(`foot_${s}`, (p) => {
      // 細長い足。足裏は y=5。
      p.rows(-4, -2, [
        '..FFFFFF.........',
        '.FFFFFFFFFF......',
        'FFFFFFFFFFFFFF...',
        'FFFFFFFFFFFFFFFF.',
        'FFFFFFFFFFFFFFFF.',
        'FFFFFFFFFFFFFFFF.',
        'FFFFFFFFFFFFFFFF.',
      ], { F });
    });
    part(`toe_${s}`, (p) => {
      // 足先も体と同じ明るい毛。爪だけ黒
      p.rows(-1, -4, [
        'FFFF......',
        'FFFFFFF...',
        'FFsFFsFFFc',
        'FFcFFcFFcc',
      ], { F, s: FS, c: 'claw' });
    });
  }

  // ---- 腕 ----
  for (const s of ['l', 'r']) {
    part(`upperarm_${s}`, (p) => p.cap(0, 0, 6, 0, 14, 5.5, F));
    part(`forearm_${s}`, (p) => p.cap(0, 0, 5.5, 0, 14, 5, F));
    part(`band_${s}`, (p) => {
      // リストバンド。前腕より 1px 太く、手首の手前 5px を覆う。
      p.poly([[-6.5, 8], [6.5, 8], [6.5, 13], [-6.5, 13]], B);
      p.dots([[-6, 8], [5, 8], [-6, 12], [5, 12]], null);
      p.line(-4, 12, 3, 12, BS);
    });
  }
  // 拳は明るい毛色。指先に小さな黒い爪。手の甲側に指の筋は描かない。
  const m = { D: C, d: FD, L: CL, c: 'claw' };
  const fl = part('fist_l_punch', (p) => p.rows(-1, -6, [
    '...DDDDDD...',
    '.DDDDDDDDDD.',
    'DDDDDDDDDDDD',
    'DDDDDDDDDDDd',
    'DDDDDDDDDDDD',
    'DDDDDDDDDDcd',
    'DDddddddDDDD',
    'DDDLLLLLLdcD',
    'DDDLLLLLLdDD',
    '.DDDdddddDD.',
    '..DDDDDDDD..',
  ], m));
  const fr = part('fist_r_punch', (p) => p.rows(-1, -6, [
    '...DDDDDD...',
    '.DDDDDDDDDD.',
    'DDDDDDDDDDDD',
    'DDDDDDDDDDDd',
    'DDDDDDDDDDDD',
    'DDDDDDDDDDcd',
    'DDDDDDDDDDDD',
    'DDDDDDdddDcd',
    'DDDDDdDDDdDD',
    '.DDDDDddDDD.',
    '..DDDDDDDD..',
  ], m));
  P.push(fl.rotCCW('fist_l_guard'), fr.rotCCW('fist_r_guard'));

  // ---- 頭（モグゾーより小ぶりで、マズルが少し細い。丸く大きい目） ----
  const cx = 6, cy = -10;
  part('head', (p) => {
    p.ell(cx, cy, 16, 13.5, F);
    p.ell(cx - 7, cy + 4, 9, 9, F);
    p.ell(cx + 3, cy + 7, 13, 8, F);
    p.ell(cx + 12, cy + 3, 8.5, 6.5, F);
    p.tufts(cx + 3, cy + 7, 13, 8, [125], F);
    p.ell(cx + 14, cy + 6, 7, 4.5, C, 'in');
    p.ell(cx + 8, cy + 11, 9, 4, C, 'in');
    p.rows(cx + 17, cy - 1, ['.NN.', 'NnNN', '.NN.'], { N: 'nose', n: 'nosehi' });
    p.dots([[cx + 18, cy + 2], [cx + 18, cy + 3]], FL);
    p.dots([[cx + 13, cy + 3], [cx + 11, cy + 5]], FS);
    p.ticks([[cx - 11, cy + 2], [cx - 6, cy + 7]], FS);
  });
  part('jaw', (p) => p.ell(7, 2, 7, 3, C));
  // 口角が少し上がる
  part('mouth_closed', (p) => p.dots([[2, -1], [3, 0], [4, 0], [5, 0], [6, 0], [7, -1], [8, -1], [9, -1], [10, -1], [11, -1], [12, -1], [13, -1]], 'mouth'));
  part('mouth_open', (p) => p.ell(cx + 13, cy + 8.5, 5, 2.8, 'mouth'));
  part('mouth_grit', (p) => {
    p.dots([[3, 0], [4, 0], [5, 0], [6, -1], [7, -1], [8, -1], [9, -1], [10, -1], [11, -1], [12, -1], [13, -1]], 'mouth');
    p.dots([[8, 0], [9, 0], [10, 0], [11, 0], [12, 0]], 'tooth');
    p.dots([[7, 1], [8, 1], [9, 1], [10, 1], [11, 1], [12, 1]], 'mouth');
  });
  const ex = cx + 3, ey = cy - 4;
  const em = { E: 'eye', H: 'eyehi', L: FL };
  part('eye_open', (p) => p.rows(ex, ey, ['.EEEE.', 'EEEHHE', 'EEEEHE', 'EEEEEE', 'EHEEEE', '.EEEE.'], em));
  part('eye_half', (p) => p.rows(ex, ey, ['......', 'LLLLLL', 'EEEEHE', 'EEEEEE', 'EHEEEE', '.EEEE.'], em));
  part('eye_closed', (p) => p.rows(ex, ey, ['......', '......', 'L....L', '.LLLL.', '......', '......'], em));
  part('eye_hurt', (p) => p.rows(ex, ey, ['......', 'L.....', '.LL...', '...LLL', '.LL...', 'L.....'], em));
  part('brow_angry', (p) => p.rows(ex - 1, ey - 2, ['LL.....', '.LLLL..', '...LLLL'], em));

  part('ear_r', (p) => { p.ell(0, -1.5, 3.8, 3.8, F); p.ell(0.5, -1, 1.8, 2, FD); });
  part('ear_l', (p) => { p.ell(0, -1, 3.4, 3.4, F); p.ell(0.5, -0.5, 1.6, 1.8, FD); });

  // ---- 尻尾（3体でいちばん長く、ふさふさ） ----
  part('tail_base', (p) => p.cap(0, 0, 5, 8, 0, 5.5, F));
  part('tail_mid', (p) => { p.cap(0, 0, 5.5, 7, 0, 5, F); p.ticks([[1, -3, 1, 2], [3, 1, 1, 2]], FS); });
  part('tail_tip', (p) => { p.cap(0, 0, 5, 6, 0, 2.5, F); p.cap(5, 0, 2.5, 7, 0, 1.5, FS, 'in'); });

  return P;
}
