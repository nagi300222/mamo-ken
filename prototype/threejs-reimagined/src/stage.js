import * as T from "three";
import { sheet, poly, rig } from "./art.js";
import { player } from "./engine.js";
function harbor(ctx) {
  let seed = 12345;
  const rand = (max) => {
    seed = (1664525 * seed + 1013904223) >>> 0;
    return (seed >>> 12) % max;
  };
  const rect = (c, x, y, w, h) => {
    ctx.fillStyle = c;
    ctx.fillRect(x, y, w, h);
  };
  const line = (c, x, y, X, Y) => {
    const n = Math.max(Math.abs(X - x), Math.abs(Y - y));
    for (let i = 0; i <= n; i++)
      rect(
        c,
        Math.round(x + ((X - x) * i) / n),
        Math.round(y + ((Y - y) * i) / n),
        1,
        1,
      );
  };
  const p = (color, ...pts) => poly(ctx, color, pts);
  for (const [y, col] of [
    [0, "#515681"],
    [20, "#82658b"],
    [37, "#b87a8c"],
    [55, "#e9958c"],
    [74, "#fbb18a"],
    [91, "#ffd798"],
  ])
    rect(col, 0, y, 384, 128 - y);
  for (let i = 0; i < 110; i++) {
    const x = rand(384),
      y = rand(92);
    rect(y < 40 ? "#94799a" : "#f7ac92", x, y, 3 + rand(25), 1);
  }
  for (let y = -20; y <= 20; y++) {
    const w = Math.floor(Math.sqrt(400 - y * y));
    rect("#ffdf93", 247 - w, 66 + y, 2 * w, 1);
  }
  p(
    "#a48496",
    [0, 101],
    [25, 82],
    [38, 90],
    [66, 78],
    [85, 86],
    [141, 61],
    [158, 73],
    [172, 70],
    [198, 89],
    [223, 78],
    [255, 91],
    [291, 69],
    [328, 89],
    [364, 63],
    [384, 77],
    [384, 124],
    [0, 124],
  );
  p(
    "#79768b",
    [0, 116],
    [43, 94],
    [58, 98],
    [81, 87],
    [100, 103],
    [165, 87],
    [197, 101],
    [228, 89],
    [248, 98],
    [290, 80],
    [319, 92],
    [345, 87],
    [384, 102],
    [384, 126],
    [0, 126],
  );
  for (let x = 0; x < 384; ) {
    const w = 5 + rand(9),
      h = 3 + rand(15);
    rect("#686779", x, 115 - h, w, h);
    for (let k = 1; k < w; k += 4) rect("#c1a39d", x + k, 119 - h, 2, 1);
    x += w + 2;
  }
  rect("#9b8891", 0, 115, 384, 21);
  for (let i = 0; i < 160; i++)
    rect(
      i % 5 ? "#c5a09b" : "#eee0b1",
      rand(384),
      115 + rand(17),
      3 + rand(12),
      1,
    );
  // Dock crane with truss, suspended hook and ladder.
  rect("#52546b", 283, 78, 4, 39);
  rect("#737087", 284, 76, 2, 38);
  line("#55586c", 263, 76, 313, 62);
  line("#55586c", 263, 80, 313, 66);
  for (let x = 264; x < 313; x += 5) {
    const y = 76 - Math.floor((x - 263) * 0.28);
    line("#5e5b71", x, y, x + 4, y + 3);
  }
  line("#52546b", 307, 66, 307, 89);
  rect("#555667", 305, 89, 3, 2);
  for (let i = 0; i < 3; i++) {
    const x = 116 + i * 59,
      y = 122 - (i % 2) * 4;
    p("#515362", [x, y], [x + 23, y], [x + 18, y + 4], [x + 4, y + 4]);
    rect("#e9ba97", x + 7, y - 4, 10, 4);
    rect("#676176", x + 9, y - 3, 5, 2);
  }
  // Near stalls frame the play space. Signs, cloth, lamps and crates have separate planes of light.
  function stall(x, w, label) {
    rect("#383746", x, 80, w, 56);
    rect("#5d4851", x + 3, 85, w - 6, 49);
    for (let i = 3; i < w; i += 6) rect("#463e49", x + i, 90, 1, 43);
    p(
      "#3a3747",
      [x - 4, 74],
      [x + 5, 63],
      [x + w - 6, 62],
      [x + w + 4, 73],
      [x + w + 2, 77],
      [x - 4, 78],
    );
    for (let i = 0; i < w; i += 6) {
      rect("#645362", x + i, 70, 4, 2);
      rect("#90717a", x + i + 2, 65, 4, 1);
    }
    rect("#2e3644", x - 4, 75, w + 8, 4);
    rect("#e7b47c", x + 4, 80, w - 8, 10);
    ctx.fillStyle = "#5b3740";
    ctx.font = "bold 8px sans-serif";
    ctx.fillText(label, x + 7, 88);
    for (let i = 0; i < w - 5; i += 10) {
      rect(i % 3 ? "#af4e4a" : "#c96652", x + 2 + i, 91, 9, 11);
      rect("#e38865", x + 3 + i, 92, 7, 1);
    }
    rect("#2b3342", x + 5, 105, w - 10, 18);
    rect("#b98864", x + 3, 122, w - 6, 3);
    for (let i = 7; i < w - 6; i += 8) {
      rect("#b97d59", x + i, 115, 5, 7);
      rect("#dfac78", x + i + 1, 114, 3, 2);
    }
  }
  stall(-5, 70, "夕 凪 魚 店");
  stall(335, 53, "港 市 場");
  for (const x of [9, 87, 323, 373]) {
    rect("#494450", x, 32, 3, 105);
    rect("#746072", x, 33, 1, 96);
    rect("#494450", x - 5, 38, 13, 2);
  }
  for (let x = 0; x < 384; x++) {
    const y = 36 + Math.round(15 * Math.sin(((x - 10) / 314) * Math.PI));
    rect("#494151", x, y, 1, 1);
    if (x % 23 === 9) {
      rect("#674754", x, y, 1, 3);
      rect("#883f48", x - 3, y + 3, 7, 6);
      rect("#ffc180", x - 2, y + 3, 5, 5);
      rect("#ee805b", x, y + 3, 1, 5);
      rect("#844454", x - 2, y + 9, 5, 1);
    }
  }
  rect("#57515b", 0, 131, 384, 3);
  for (let x = 0; x < 384; x += 19) {
    rect("#5b525c", x, 127, 3, 12);
    rect("#9a807e", x, 127, 1, 12);
  }
  rect("#8c716d", 0, 138, 384, 5);
  rect("#f1b68c", 0, 141, 384, 2);
  rect("#b89985", 0, 143, 384, 41);
  for (let y of [146, 153, 166, 182]) {
    rect("#8e7880", 0, y, 384, 1);
    rect("#cfaf95", 0, y + 1, 384, 1);
    for (let x = rand(34); x < 384; x += 37 + rand(16))
      line("#937c7c", x, y + 1, x - 4, y + 8);
  }
  for (let i = 0; i < 200; i++)
    rect("#a88b80", rand(384), 144 + rand(40), 1 + rand(4), 1);
}
export function stage(canvas) {
  const renderer = new T.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: false,
  });
  renderer.setSize(768, 368, false);
  renderer.outputColorSpace = T.SRGBColorSpace;
  const scene = new T.Scene(),
    cam = new T.OrthographicCamera(0, 384, 0, 184, 0.1, 100);
  cam.position.z = 50;
  const bg = sheet(384, 184, harbor);
  bg.position.set(192, 92, -5);
  bg.renderOrder = -10;
  scene.add(bg);
  let actors = [],
    shadows = [];
  const shadow = () =>
    sheet(32, 8, (ctx) => {
      ctx.fillStyle = "#59485799";
      ctx.fillRect(3, 2, 26, 4);
      ctx.fillRect(7, 1, 18, 6);
    });
  function discard(obj) {
    obj.traverse((m) => {
      if (m.isMesh) {
        m.geometry.dispose();
        m.material.map?.dispose();
        m.material.dispose();
      }
    });
    scene.remove(obj);
  }
  function set(c, d) {
    actors.forEach((a) => discard(a.root));
    shadows.forEach(discard);
    actors = [rig(c), rig(d)];
    shadows = [shadow(), shadow()];
    for (let i = 0; i < 2; i++) {
      scene.add(actors[i].root, shadows[i]);
      shadows[i].renderOrder = 0;
    }
  }
  const particles = [];
  const stamp = (n, x, y, w, h, color) => {
    if (!particles[n]) {
      const m = new T.Mesh(
        new T.PlaneGeometry(1, 1),
        new T.MeshBasicMaterial({ side: T.DoubleSide, depthTest: false }),
      );
      m.renderOrder = 20;
      scene.add(m);
      particles[n] = m;
    }
    const m = particles[n];
    m.visible = true;
    m.position.set(Math.round(x), Math.round(y), 2);
    m.scale.set(w, h, 1);
    m.material.color.set(color);
  };
  function draw(g) {
    let n = 0;
    for (let i = 0; i < 2; i++) {
      const f = g.p[i];
      actors[i].pose(
        g.winner !== null && g.winner !== i && g.winner !== 2
          ? { ...f, mode: "ko" }
          : f,
        g.frame,
      );
      shadows[i].position.set(f.x, 159, 0);
      shadows[i].scale.x = ((1 - Math.min(0.55, f.y / 130)) * f.c.width) / 28;
    }
    for (const s of g.shots) {
      const y = 159 - s.y,
        x = s.x,
        r = s.r;
      const col = s.owner.c.color;
      if (s.owner.c.style === "counter") {
        for (let k = -3; k < 4; k++)
          stamp(
            n++,
            x - Math.abs(k) * 2 * Math.sign(s.vx),
            y + k * 2,
            4,
            2,
            "#d0f9e4",
          );
      } else if (s.low) {
        for (let k = 0; k < 4; k++)
          stamp(
            n++,
            x - k * 2 * Math.sign(s.vx || 1),
            y + 3 - k,
            2,
            4 + k,
            col,
          );
      } else if (s.owner.c.style === "venom") {
        for (let k = 0; k < 4; k++)
          stamp(
            n++,
            x - 3 * k * Math.sign(s.vx),
            y + Math.sin(g.frame * 0.2 + k) * 5,
            3,
            3,
            "#eba2cf",
          );
      }
      stamp(n++, x - s.vx * 3, y, r * 3, 3, s.owner.c.color);
      stamp(n++, x, y, r * 2, r * 1.5, s.owner.c.color);
      stamp(n++, x + Math.sign(s.vx) * 2, y, r, r, "#fff1b5");
    }
    for (const f of g.fx)
      for (let k = 0; k < 9; k++) {
        const a = k * 2.4,
          r = 3 + f.t * 0.8 + (k % 3) * 2;
        stamp(
          n++,
          f.x + Math.cos(a) * r,
          159 - f.y + Math.sin(a) * r,
          Math.max(1, 6 - f.t * 0.35),
          k % 2 ? 2 : 4,
          f.color,
        );
      }
    for (let j = n; j < particles.length; j++) particles[j].visible = false;
    renderer.render(scene, cam);
  }
  return { set, draw };
}
export function portraitRig(canvas) {
  const renderer = new T.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: false,
  });
  renderer.setSize(128, 144, false);
  const scene = new T.Scene(),
    cam = new T.OrthographicCamera(-30, 30, -64, 4, 0.1, 100);
  cam.position.z = 15;
  let actor;
  return (c, t) => {
    if (actor?.c !== c) {
      if (actor) {
        scene.remove(actor.root);
        actor.root.traverse((o) => {
          if (o.isMesh) {
            o.geometry.dispose();
            o.material.map.dispose();
            o.material.dispose();
          }
        });
      }
      actor = rig(c);
      actor.c = c;
      scene.add(actor.root);
    }
    const f = player(c, 0, 1);
    actor.pose(f, t);
    actor.root.position.set(0, 0, 0);
    renderer.render(scene, cam);
  };
}
