// Each small canvas is an original cut-paper-like pixel plate. Bones transform
// the plates separately in Three.js. Portrait files never enter this module.
import * as T from "three";
export function sheet(w, h, paint) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d");
  ctx.imageSmoothingEnabled = false;
  paint(ctx);
  const texture = new T.CanvasTexture(c);
  texture.flipY = false;
  texture.colorSpace = T.SRGBColorSpace;
  texture.magFilter = texture.minFilter = T.NearestFilter;
  texture.generateMipmaps = false;
  const mesh = new T.Mesh(
    new T.PlaneGeometry(w, h),
    new T.MeshBasicMaterial({
      map: texture,
      transparent: true,
      depthWrite: false,
      side: T.DoubleSide,
    }),
  );
  return mesh;
}
export function poly(ctx, color, points) {
  ctx.fillStyle = color;
  ctx.beginPath();
  points.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  ctx.closePath();
  ctx.fill();
}
function fur(ctx, w, h, c, n, seed) {
  // Clip to the opaque silhouette when layering tufts and angular highlights.
  ctx.save();
  ctx.globalCompositeOperation = "source-atop";
  for (let i = 0; i < n; i++) {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    const x = (seed >>> 8) % w,
      y = (seed >>> 19) % h;
    ctx.fillStyle = c[i % c.length];
    ctx.fillRect(x, y, 1 + (i % 3), 1);
    if (i % 3 === 0) ctx.fillRect(x - 1, y + 1, 2, 1);
  }
  ctx.restore();
}
const outline = "#332a30";
function plate(c, type, far = false) {
  const [dark, mid, light, cream] = c.fur,
    sty = c.style;
  return sheet(48, 48, (ctx) => {
    const P = (color, ...points) => poly(ctx, color, points);
    const R = (x, y, w, h, color) => {
      ctx.fillStyle = color;
      ctx.fillRect(x, y, w, h);
    };
    if (type === "body") {
      P(
        outline,
        [15, 3],
        [29, 2],
        [37, 8],
        [41, 19],
        [40, 32],
        [43, 36],
        [35, 43],
        [24, 46],
        [10, 43],
        [5, 36],
        [8, 24],
        [7, 19],
        [12, 11],
      );
      P(
        mid,
        [16, 5],
        [29, 4],
        [35, 10],
        [39, 20],
        [37, 29],
        [40, 35],
        [32, 41],
        [21, 44],
        [11, 40],
        [8, 34],
        [10, 21],
      );
      P(
        light,
        [24, 7],
        [32, 9],
        [34, 17],
        [37, 20],
        [35, 24],
        [38, 31],
        [35, 37],
        [26, 41],
        [18, 38],
        [17, 27],
        [20, 19],
        [18, 17],
      );
      P(
        cream,
        [27, 9],
        [32, 12],
        [31, 16],
        [35, 20],
        [31, 20],
        [32, 24],
        [27, 22],
        [25, 26],
        [22, 23],
        [22, 17],
      );
      if (sty === "heavy") {
        P(
          dark,
          [5, 16],
          [10, 8],
          [19, 5],
          [23, 11],
          [20, 16],
          [14, 15],
          [12, 19],
          [10, 17],
          [7, 20],
        );
        P(light, [11, 12], [16, 9], [20, 9], [17, 12], [14, 12], [12, 15]);
        P(dark, [29, 9], [37, 10], [42, 18], [40, 24], [35, 20], [32, 21]);
      }
      if (sty === "wall") {
        P(
          cream,
          [19, 13],
          [32, 12],
          [36, 18],
          [35, 21],
          [39, 27],
          [39, 34],
          [33, 41],
          [22, 42],
          [13, 37],
          [13, 27],
        );
      }
      if (sty === "grapple") {
        P(dark, [7, 25], [15, 29], [16, 35], [12, 39], [7, 36]);
        P(
          cream,
          [21, 12],
          [30, 11],
          [35, 21],
          [32, 26],
          [34, 32],
          [27, 36],
          [19, 31],
        );
      }
      if (sty === "venom")
        P(
          "#a85636",
          [18, 22],
          [25, 21],
          [30, 29],
          [30, 39],
          [23, 42],
          [17, 36],
        );
      if (sty === "shade")
        P(
          dark,
          [8, 13],
          [14, 10],
          [18, 13],
          [15, 16],
          [20, 17],
          [13, 19],
          [14, 23],
          [9, 22],
          [6, 25],
        );
      fur(ctx, 48, 48, [mid, dark, light, light], 98, 28);
      if (sty === "heavy") {
        P("#24202a", [7, 30], [19, 33], [39, 28], [40, 34], [18, 39], [7, 36]);
        P("#3f3440", [21, 34], [29, 34], [26, 46], [21, 45]);
      }
      if (sty === "grapple")
        for (let i = 0; i < 12; i++) {
          R(8 + i * 2, 34 - i * 2, 6, 6, "#855229");
          R(9 + i * 2, 33 - i * 2, 5, 4, "#ffcf5a");
        }
      if (["wall", "venom", "zone"].includes(sty)) {
        P(c.color, [11, 8], [23, 12], [36, 7], [34, 14], [24, 18], [12, 13]);
        if (sty !== "wall")
          R(23, 16, 4, 6, sty === "zone" ? "#ffc876" : "#8948aa");
      }
    } else if (type === "head") {
      P(
        outline,
        [6, 14],
        [5, 7],
        [9, 4],
        [14, 7],
        [20, 5],
        [29, 5],
        [33, 7],
        [36, 5],
        [39, 8],
        [37, 14],
        [40, 20],
        [45, 24],
        [45, 30],
        [39, 34],
        [34, 39],
        [21, 41],
        [13, 38],
        [7, 39],
        [9, 34],
        [4, 31],
        [7, 27],
        [5, 22],
      );
      P(
        mid,
        [8, 15],
        [7, 8],
        [10, 6],
        [15, 10],
        [22, 7],
        [30, 7],
        [35, 11],
        [36, 8],
        [37, 9],
        [35, 15],
        [39, 22],
        [43, 25],
        [43, 30],
        [37, 32],
        [33, 37],
        [22, 39],
        [14, 35],
        [9, 36],
        [11, 32],
        [7, 30],
        [10, 27],
        [7, 22],
      );
      R(9, 9, 4, 5, dark);
      R(10, 9, 2, 2, cream);
      P(
        light,
        [14, 17],
        [21, 12],
        [31, 11],
        [34, 15],
        [31, 18],
        [27, 18],
        [25, 23],
        [19, 26],
        [12, 25],
        [14, 22],
        [11, 23],
      );
      if (["venom", "grapple", "wall", "counter"].includes(sty))
        P(
          dark,
          [13, 11],
          [21, 7],
          [30, 8],
          [35, 14],
          [30, 16],
          [23, 14],
          [20, 18],
          [17, 17],
        );
      if (sty === "grapple")
        P(cream, [24, 9], [28, 9], [31, 18], [35, 23], [31, 25], [26, 19]);
      P(
        cream,
        [19, 28],
        [26, 24],
        [30, 20],
        [35, 21],
        [38, 24],
        [43, 25],
        [42, 31],
        [36, 31],
        [32, 36],
        [26, 35],
        [22, 32],
        [18, 32],
      );
      fur(ctx, 48, 48, [dark, light, mid], 36, 84);
      P("#201e25", [26, 19], [30, 18], [32, 20], [31, 24], [28, 25], [25, 23]);
      R(27, 19, 2, 2, "#fff5ce");
      if (["heavy", "shade", "counter"].includes(sty))
        P(dark, [22, 15], [28, 16], [32, 19], [31, 20], [25, 18], [21, 18]);
      if (sty === "grapple")
        P("#38333a", [6, 10], [10, 7], [13, 10], [16, 14], [14, 19], [9, 18]);
      if (sty === "venom")
        P(
          "#4d3b34",
          [15, 9],
          [24, 7],
          [30, 9],
          [32, 12],
          [26, 11],
          [24, 15],
          [21, 12],
          [19, 14],
        );
      R(38, 21, 2, 3, outline);
      P(outline, [38, 24], [44, 24], [44, 27], [41, 29], [38, 27]);
      R(40, 24, 3, 1, "#ac947e");
      R(39, 29, 1, 2, dark);
      R(36, 31, 4, 1, outline);
      R(32, 30, 4, 1, dark);
      R(30, 27, 1, 1, dark);
      R(33, 28, 1, 1, dark);
      if (sty === "standard" || sty === "shade") {
        P(
          c.color,
          [5, 16],
          [13, 13],
          [26, 11],
          [36, 12],
          [36, 15],
          [23, 14],
          [7, 20],
        );
        P(
          c.color,
          [7, 16],
          [3, 17],
          [0, 25],
          [3, 24],
          [0, 32],
          [5, 28],
          [9, 20],
        );
        R(14, 14, 9, 1, "#ffad77");
      }
    } else if (type === "toes") {
      P(
        outline,
        [4, 22],
        [8, 16],
        [18, 15],
        [24, 19],
        [28, 22],
        [36, 22],
        [42, 25],
        [45, 30],
        [42, 33],
        [11, 34],
        [4, 31],
      );
      P(
        far ? dark : mid,
        [6, 23],
        [10, 18],
        [17, 17],
        [22, 21],
        [28, 24],
        [36, 24],
        [42, 28],
        [42, 30],
        [12, 32],
        [7, 29],
      );
      P(
        far ? mid : light,
        [12, 19],
        [17, 19],
        [24, 24],
        [35, 25],
        [38, 28],
        [25, 27],
        [17, 24],
      );
      R(33, 28, 2, 3, dark);
      R(38, 28, 2, 3, dark);
      R(40, 29, 2, 1, cream);
      R(35, 30, 2, 1, cream);
    } else if (type === "tail") {
      P(
        dark,
        [3, 15],
        [7, 11],
        [14, 11],
        [20, 16],
        [27, 21],
        [41, 24],
        [45, 31],
        [37, 36],
        [26, 34],
        [14, 29],
        [7, 23],
      );
      P(
        mid,
        [5, 16],
        [9, 13],
        [14, 14],
        [25, 23],
        [36, 26],
        [40, 30],
        [34, 32],
        [20, 27],
        [11, 21],
      );
      fur(ctx, 48, 48, [light, mid], 38, 437);
    } else {
      // Long axis is horizontal. A cuff or toes belong to the distal bone.
      const foot = type === "foot",
        paw = type === "paw",
        leg = type === "thigh";
      P(
        outline,
        [3, 19],
        [8, 13],
        [20, 12],
        [30, 15],
        [38, 16],
        [44, 20],
        [46, 26],
        [42, 32],
        [31, 35],
        [21, 32],
        [9, 33],
        [3, 28],
      );
      P(
        far ? dark : mid,
        [5, 20],
        [10, 16],
        [19, 14],
        [28, 17],
        [37, 18],
        [43, 22],
        [44, 26],
        [40, 30],
        [31, 32],
        [20, 29],
        [10, 31],
        [5, 27],
      );
      P(
        far ? mid : light,
        [9, 19],
        [18, 16],
        [27, 19],
        [36, 19],
        [39, 22],
        [32, 24],
        [21, 21],
        [14, 23],
        [9, 23],
      );
      fur(ctx, 48, 48, [dark, mid, light], leg ? 40 : 22, leg ? 118 : 249);
      if (foot || paw) {
        for (let i = 0; i < 3; i++) {
          R(35 + i * 3, 24 + (i % 2) * 3, 2, 5, dark);
          R(36 + i * 3, 25 + (i % 2) * 3, 1, 2, cream);
        }
        if (paw && sty === "grapple")
          P(
            "#292834",
            [15, 16],
            [28, 18],
            [37, 19],
            [43, 23],
            [42, 29],
            [32, 32],
            [22, 29],
            [15, 31],
          );
        if (paw && (sty === "runner" || (sty === "counter" && !far))) {
          P(c.color, [9, 15], [25, 15], [28, 19], [23, 32], [10, 32], [14, 22]);
          R(15, 19, 4, 2, "#d8e8d3");
        }
      }
    }
  });
}
export function rig(c) {
  const root = new T.Group(),
    body = new T.Group();
  root.add(body);
  function part(type, z, far = false) {
    const p = plate(c, type, far);
    p.renderOrder = z;
    body.add(p);
    return p;
  }
  const tail = part("tail", 1),
    torso = part("body", 5),
    head = part("head", 8);
  const limbs = [];
  for (const far of [true, false])
    for (const leg of [true, false]) {
      const order = far ? 2 : leg ? 6 : 9;
      limbs.push({
        far,
        leg,
        a: part(leg ? "thigh" : "arm", order, far),
        b: part(leg ? "foot" : "paw", order + 1, far),
        toe: leg ? part("toes", order + 2, far) : null,
      });
    }
  const prop = c.width / 26,
    h = c.height;
  function size(p, x, y, w, hh, angle = 0) {
    p.position.set(x, y, 0);
    p.scale.set(w / 48, hh / 48, 1);
    p.rotation.z = angle;
  }
  function bone(p, a, b, r) {
    const dx = b[0] - a[0],
      dy = b[1] - a[1];
    size(
      p,
      (a[0] + b[0]) / 2,
      (a[1] + b[1]) / 2,
      Math.hypot(dx, dy) * 1.14 + 3,
      r * 2.08,
      Math.atan2(dy, dx),
    );
  }
  return {
    root,
    pose(f, t) {
      const m = f.move,
        mode = f.mode,
        walk = ["walk", "guard", "dash"].includes(mode);
      const gait = walk ? Math.sin(f.stride) : 0,
        breath = Math.sin(t * 0.075) * 0.75;
      const squat =
        mode === "crouch" ||
        ["low", "sweep"].includes(m?.key) ||
        (mode === "block" && f.prev.y > 0);
      const low = squat ? h * 0.24 : 0,
        air = f.y > 1;
      let ext = 0;
      if (m)
        ext =
          m.t < m.start
            ? -0.22 * Math.sin((Math.PI * m.t) / m.start)
            : m.t < m.start + m.active
              ? 1
              : Math.max(
                  0,
                  1 - (m.t - m.start - m.active) / Math.max(5, m.end * 0.65),
                );
      const hurt = mode === "hurt",
        guard = mode === "guard" || mode === "block";
      const stance = {
        heavy: -1.5,
        runner: 2,
        zone: -2,
        venom: 3,
        wall: -1,
        counter: 1.5,
      };
      const lean = (stance[c.style] ?? 0) + (mode === "dash" ? 4 : ext * 2.5);
      const lanky = ["runner", "zone", "counter"].includes(c.style);
      const center =
        -h * (lanky ? 0.49 : 0.46) + low + breath + Math.abs(gait) * 1.2;
      root.position.set(f.x, 159 - f.y, 0);
      root.scale.x = f.face;
      const fallen = mode === "down" || mode === "ko" || mode === "wake";
      body.rotation.z = fallen
        ? (mode === "wake" ? Math.min(1, f.down / 9) : 1) * -1.25
        : hurt
          ? -0.18
          : mode === "dash"
            ? 0.16
            : 0;
      body.position.y = fallen ? -3 : 0;
      size(
        tail,
        -c.width * 0.39,
        center + h * 0.25,
        c.width * (c.style === "zone" ? 1.5 : 0.85),
        h * 0.39,
        Math.sin(t * 0.09) * 0.16 - gait * 0.12,
      );
      size(
        torso,
        lean,
        center,
        c.width *
          (c.style === "wall" ? 1.3 : c.style === "heavy" ? 1.25 : 1.16),
        h * (lanky ? 0.55 : 0.62),
        ext * 0.07,
      );
      const neck =
        c.style === "heavy" ? 0.26 : c.style === "zone" ? 0.35 : 0.31;
      size(
        head,
        lean + 2,
        center - h * neck,
        c.width * (c.style === "runner" ? 1.02 : 1.14),
        h * (c.style === "wall" ? 0.41 : 0.46),
        ext * 0.08 + gait * 0.04 + (c.style === "venom" ? 0.12 : 0),
      );
      for (const l of limbs) {
        const s = l.far ? 1 : -1,
          phase = gait * s * (mode === "guard" ? -1 : 1);
        const base = l.leg
          ? [lean + s * 4 * prop, center + h * 0.17]
          : [lean + s * 5 * prop, center - h * 0.13];
        let end = l.leg
          ? [
              s * 8 * prop + phase * 7,
              -3 - Math.max(0, phase) * 4 - (air ? (l.far ? 13 : 7) : 0),
            ]
          : [
              lean + (l.far ? 13 : 5) * prop - phase * 3,
              center - (guard ? 11 : 4) + (l.far ? -2 : 1),
            ];
        const strike = m && !l.far && l.leg === !!m.kick;
        if (strike) {
          const reach = [m.x, -h * m.y];
          end = end.map((v, i) => v + (reach[i] - v) * ext);
        }
        if (c.style === "runner" && l.leg && !l.far && !m && !walk && !air)
          end[1] -= 4;
        if (guard && !l.leg) {
          end[0] += 3;
          end[1] -= 2;
        }
        if (
          m?.key === "trick" &&
          c.style === "counter" &&
          !l.leg &&
          m.t < m.start
        ) {
          end[0] += 7;
          end[1] -= 6;
        }
        // Both arms participate in a throw; the rear arm braces a ranged release.
        if (m && !l.leg && l.far) {
          if (m.grab) {
            end[0] += ext * 12;
            end[1] -= ext * 5;
          }
          if (m.key === "wave") {
            end[0] += ext * 9;
            end[1] += ext * 3;
          }
          if (m.key === "rise") {
            end[0] -= ext * 5;
            end[1] += ext * 6;
          }
        }
        if (m?.key === "rise" && !l.leg && !l.far) end[1] -= ext * 3;
        if (mode === "hurt" && !l.leg) {
          end[0] -= 5;
          end[1] -= 4;
        }
        if (mode === "dash" && !l.leg) {
          end[0] += l.far ? 5 : -8;
          end[1] += 3;
        }
        if (mode === "ko" || mode === "down") {
          end[0] += l.far ? 4 : -7;
          end[1] += l.leg ? 0 : 6;
        }
        const dx = end[0] - base[0],
          dy = end[1] - base[1],
          len = Math.hypot(dx, dy) || 1;
        const bend =
          (l.leg ? 1 : -1) *
          Math.max(1, (l.leg ? 5 : 6) * (1 - (strike ? ext : 0)));
        const mid = [
          (end[0] + base[0]) / 2 + (dy / len) * bend,
          (end[1] + base[1]) / 2 - (dx / len) * bend,
        ];
        if (l.toe) {
          const kicking = strike && m.kick;
          size(
            l.toe,
            end[0] + (kicking ? 1 : 2) * prop,
            end[1] - 0.3,
            (c.style === "runner" ? 12 : 10.5) * prop,
            10 * prop,
            kicking ? -0.55 * ext : air ? -0.3 : gait * s * 0.12,
          );
        }
        bone(l.a, base, mid, (l.leg ? 11 : 9) * prop);
        bone(l.b, mid, end, (l.leg ? 9 : 8) * prop);
      }
    },
  };
}
