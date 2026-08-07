// マモ拳（仮） VIS-R1 (0): 顔(鼻)基準の表示整備 — 顔検出ユーティリティ
//
// 目的: 透過PNG(RGBA)から「目・鼻」候補を検出し、鼻位置・顔中心・頭サイズを推定する。
// 今後キャラクターが追加されても同じ関数で再利用できるよう、入力はraw RGBA
// (sharpのensureAlpha().raw()で取得したBuffer/width/height)のみに依存する。
//
// アルゴリズム:
//   1. alpha>0の前景ピクセルのうち、明度(R+G+B)/3が52未満のものを「暗色ピクセル」とする
//      (瞳・鼻の穴・鼻の輪郭線などは地の毛色より明確に暗いことを前提とする)
//   2. 暗色ピクセルを4連結成分に分解する
//   3. 各成分について以下の条件で「目・鼻候補」を絞り込む:
//      - 面積: キャラ全体の前景ピクセル数(charArea)の0.03%〜1.2%
//      - アスペクト比(bboxW/bboxH): 0.4〜2.5
//      - 充填率(area/bboxArea): 0.45超
//      - 重心Yがキャラ全体bboxの上半分以内(画像上半分域)
//   4. 候補が0件なら検出失敗(detected:false)を返す。呼び出し側は寸法フォールバックを使うこと
//   5. 鼻 = 候補中で最大面積のクラスタ
//   6. 顔中心 = 面積上位クラスタ(最大3件、無ければ候補全件)の重心の平均(重み無し平均)
//   7. 頭サイズ = 鼻クラスタの√面積 × HEAD_SIZE_FACTOR
//
// 注意: X目・渦巻き目・閉じ目(まぶたの線のみ等)のポーズでは、暗色クラスタが
// 条件(面積/アスペクト/充填率)を満たさず自然に不採用となる想定。加えて、通常の瞳より
// 大幅に暗色ピクセルが少ない/多いケースも同様に弾かれる。

const DARK_LUMA_MAX = 52;
const CANDIDATE_AREA_MIN_RATIO = 0.0003; // 0.03%
const CANDIDATE_AREA_MAX_RATIO = 0.012;  // 1.2%
const CANDIDATE_ASPECT_MIN = 0.4;
const CANDIDATE_ASPECT_MAX = 2.5;
const CANDIDATE_FILL_MIN = 0.45;
const HEAD_SIZE_FACTOR = 6.2; // 鼻クラスタの√面積→頭サイズ(顔全体のおおよその半径相当)への係数。3.1節で実測校正
const FACE_CENTER_TOP_N = 3;

function luma(r, g, b) { return (r + g + b) / 3; }

// 前景(alpha>0)のtight bboxと前景ピクセル数を求める
function foregroundBBox(data, width, height) {
  let minX = width, maxX = -1, minY = height, maxY = -1, count = 0;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const a = data[(y * width + x) * 4 + 3];
      if (a === 0) continue;
      if (x < minX) minX = x; if (x > maxX) maxX = x;
      if (y < minY) minY = y; if (y > maxY) maxY = y;
      count++;
    }
  }
  if (maxX < minX) return { minX: 0, minY: 0, maxX: width - 1, maxY: height - 1, w: width, h: height, count: 0 };
  return { minX, minY, maxX, maxY, w: maxX - minX + 1, h: maxY - minY + 1, count };
}

// 暗色(前景かつluma<DARK_LUMA_MAX)ピクセルを4連結成分に分解する
function labelDarkComponents(data, width, height) {
  const n = width * height;
  const isDark = new Uint8Array(n);
  for (let i = 0; i < n; i++) {
    const o = i * 4;
    if (data[o + 3] === 0) continue;
    if (luma(data[o], data[o + 1], data[o + 2]) < DARK_LUMA_MAX) isDark[i] = 1;
  }
  const label = new Int32Array(n).fill(-1);
  const queue = new Int32Array(n);
  const components = [];
  for (let start = 0; start < n; start++) {
    if (!isDark[start] || label[start] !== -1) continue;
    const compId = components.length;
    let qh = 0, qt = 0;
    queue[qt++] = start; label[start] = compId;
    let minX = width, maxX = -1, minY = height, maxY = -1, sumX = 0, sumY = 0, count = 0;
    while (qh < qt) {
      const idx = queue[qh++];
      const x = idx % width, y = (idx / width) | 0;
      minX = Math.min(minX, x); maxX = Math.max(maxX, x);
      minY = Math.min(minY, y); maxY = Math.max(maxY, y);
      sumX += x; sumY += y; count++;
      const tryPush = (nx, ny) => {
        if (nx < 0 || nx >= width || ny < 0 || ny >= height) return;
        const nIdx = ny * width + nx;
        if (!isDark[nIdx] || label[nIdx] !== -1) return;
        label[nIdx] = compId; queue[qt++] = nIdx;
      };
      tryPush(x - 1, y); tryPush(x + 1, y); tryPush(x, y - 1); tryPush(x, y + 1);
    }
    components.push({
      id: compId, minX, maxX, minY, maxY,
      w: maxX - minX + 1, h: maxY - minY + 1,
      cx: sumX / count, cy: sumY / count, area: count,
    });
  }
  return components;
}

/**
 * @param {Buffer} data RGBAのraw pixelバッファ(sharpのensureAlpha().raw()出力)
 * @param {number} width
 * @param {number} height
 * @returns {{
 *   detected: boolean,
 *   noseX: number, noseY: number,
 *   faceCenterX: number, faceCenterY: number,
 *   headSize: number,
 *   fgBBox: {minX:number,minY:number,maxX:number,maxY:number,w:number,h:number},
 *   candidates: Array<object>,
 *   reason?: string,
 * }}
 */
export function detectFace(data, width, height) {
  const fgBBox = foregroundBBox(data, width, height);
  if (fgBBox.count === 0) return { detected: false, reason: 'no_foreground', fgBBox };
  const charArea = fgBBox.count;
  const upperHalfY = fgBBox.minY + fgBBox.h * 0.5;

  const components = labelDarkComponents(data, width, height);
  const areaMin = charArea * CANDIDATE_AREA_MIN_RATIO;
  const areaMax = charArea * CANDIDATE_AREA_MAX_RATIO;
  const candidates = components.filter((c) => {
    if (c.area < areaMin || c.area > areaMax) return false;
    const aspect = c.w / c.h;
    if (aspect < CANDIDATE_ASPECT_MIN || aspect > CANDIDATE_ASPECT_MAX) return false;
    const fill = c.area / (c.w * c.h);
    if (fill < CANDIDATE_FILL_MIN) return false;
    if (c.cy > upperHalfY) return false;
    return true;
  });
  if (candidates.length === 0) {
    return { detected: false, reason: 'no_candidates', fgBBox, candidates: [] };
  }
  candidates.sort((a, b) => b.area - a.area);
  const nose = candidates[0];
  const top = candidates.slice(0, Math.min(FACE_CENTER_TOP_N, candidates.length));
  const faceCenterX = top.reduce((s, c) => s + c.cx, 0) / top.length;
  const faceCenterY = top.reduce((s, c) => s + c.cy, 0) / top.length;
  const headSize = Math.sqrt(nose.area) * HEAD_SIZE_FACTOR;
  return {
    detected: true,
    noseX: nose.cx, noseY: nose.cy,
    faceCenterX, faceCenterY,
    headSize,
    fgBBox,
    candidates,
  };
}

/**
 * sharpから読み込んだRGBA rawバッファを使った便利関数(sharpは呼び出し側でimportして渡す)。
 * @param {import('sharp').Sharp} sharpInstance ensureAlpha()済みのsharpインスタンス
 */
export async function detectFaceFromSharp(sharpInstance) {
  const { data, info } = await sharpInstance.ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  return detectFace(data, info.width, info.height);
}

export const FACE_METRICS_CONSTANTS = {
  DARK_LUMA_MAX,
  CANDIDATE_AREA_MIN_RATIO,
  CANDIDATE_AREA_MAX_RATIO,
  CANDIDATE_ASPECT_MIN,
  CANDIDATE_ASPECT_MAX,
  CANDIDATE_FILL_MIN,
  HEAD_SIZE_FACTOR,
  FACE_CENTER_TOP_N,
};
