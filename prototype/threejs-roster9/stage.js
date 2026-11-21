import * as THREE from './node_modules/three/build/three.module.js';
import { boxes } from './battle.js';

export function createStage(host, onError) {
  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  host.prepend(renderer.domElement);
  const scene = new THREE.Scene(),
    camera = new THREE.OrthographicCamera(-410, 410, 250, -50, 0.1, 20);
  camera.position.z = 10;
  const loader = new THREE.TextureLoader();
  const outline = new THREE.EdgesGeometry(new THREE.PlaneGeometry(1, 1));
  const markerGeometry = new THREE.CircleGeometry(1, 32);
  const impact = new THREE.Mesh(
    new THREE.RingGeometry(0.74, 1, 8),
    new THREE.MeshBasicMaterial({
      color: 0xffdc77,
      transparent: true,
      depthTest: false,
    }),
  );
  impact.renderOrder = 4;
  scene.add(impact);
  const slots = [0, 1].map((i) => {
    const sprite = new THREE.Sprite(
      new THREE.SpriteMaterial({ transparent: true, depthTest: false }),
    );
    sprite.renderOrder = 2;
    const shadow = new THREE.Mesh(
      markerGeometry,
      new THREE.MeshBasicMaterial({ color: 0x261c19, opacity: 0.28, transparent: true }),
    );
    shadow.scale.set(43, 6, 1);
    const guides = ['#49caff', '#ffc057', '#f53751'].map((color) => {
      const line = new THREE.LineSegments(
        outline,
        new THREE.LineBasicMaterial({ color, depthTest: false }),
      );
      line.renderOrder = 3;
      scene.add(line);
      return line;
    });
    const origin = new THREE.Mesh(
      markerGeometry,
      new THREE.MeshBasicMaterial({ color: 0xffff55, depthTest: false }),
    );
    origin.scale.set(3, 3, 1);
    origin.renderOrder = 4;
    scene.add(sprite, shadow, origin);
    return { i, sprite, shadow, guides, origin, cache: new Map(), frames: null, id: null };
  });
  async function select(slot, id) {
    const token = (slot.token = Symbol());
    slot.id = id;
    slot.frames = null;
    slot.sprite.material.map = null;
    slot.sprite.visible = false;
    for (const entry of slot.cache.values()) entry.texture.dispose();
    slot.cache.clear();
    try {
      const r = await fetch('./generated/' + id + '.json');
      if (!r.ok) throw Error('ポーズ定義を読み込めません');
      const frames = await r.json();
      if (slot.token === token) slot.frames = frames;
    } catch (e) {
      onError(e.message);
    }
  }
  function texture(slot, path) {
    if (slot.cache.has(path)) {
      const current = slot.cache.get(path);
      slot.cache.delete(path);
      slot.cache.set(path, current);
      return current.ready ? current.texture : null;
    }
    if (slot.cache.size >= 24) {
      for (const [key, old] of slot.cache) {
        if (old.texture === slot.sprite.material.map) continue;
        old.texture.dispose();
        slot.cache.delete(key);
        break;
      }
    }
    const entry = { ready: false };
    entry.texture = loader.load(
      '../../' + path,
      (tex) => {
        if (slot.cache.get(path) !== entry) {
          tex.dispose();
          return;
        }
        tex.colorSpace = THREE.SRGBColorSpace;
        entry.ready = true;
      },
      undefined,
      () => onError('画像読込失敗 ' + path),
    );
    slot.cache.set(path, entry);
    return null;
  }
  const observer = new ResizeObserver(() => {
    const w = host.clientWidth,
      h = host.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    const width = Math.max(820, (368 * w) / h),
      height = (width * h) / w;
    Object.assign(camera, {
      left: -width / 2,
      right: width / 2,
      bottom: -height * 0.17,
      top: height * 0.83,
    });
    camera.updateProjectionMatrix();
  });
  observer.observe(host);
  function draw(g, debug) {
    for (const slot of slots) {
      const f = g.fighters[slot.i],
        m = f.action;
      if (slot.id !== f.id) select(slot, f.id);
      const pose = m?.art ?? f.pose;
      const frames = slot.frames?.[pose] ?? slot.frames?.idle;
      if (frames) {
        const index = !m?.s
          ? 0
          : m.age < m.s
            ? 0
            : m.age < m.s + m.a
              ? 1
              : m.age < m.s + m.a + m.r / 2
                ? 2
                : 3;
        const frame = frames[Math.min(index, frames.length - 1)];
        const tex = texture(slot, frame[slot.i ? 'p2' : 'p1']);
        if (tex) {
          const { sprite } = slot;
          sprite.visible = true;
          if (sprite.material.map !== tex) {
            sprite.material.map = tex;
            sprite.material.needsUpdate = true;
          }
          tex.repeat.x = f.face;
          tex.offset.x = f.face === 1 ? 0 : 1;
          const w = frame.width * frame.scale,
            h = frame.height * frame.scale;
          sprite.scale.set(w, h, 1);
          const anchor = -frame.offset.x / frame.width;
          sprite.center.set(f.face === 1 ? anchor : 1 - anchor, 1 + frame.offset.y / frame.height);
          const walking = f.walk && !f.crouch && !m && !f.stun && !f.y && !g.result;
          const stride = Math.sin(g.frame * 0.32);
          const bob = walking
            ? Math.abs(stride) * 3
            : !m && !f.stun && !g.result
              ? Math.sin(g.frame * 0.12 + slot.i) * 1.4
              : 0;
          sprite.material.rotation = walking ? stride * 0.025 : f.y ? -0.06 * f.face : 0;
          sprite.position.set(f.x, f.y + bob, 1);
        }
      }
      slot.shadow.position.x = f.x;
      slot.shadow.scale.x = 43 - f.y * 0.09;
      const { hurt, push, hit } = boxes(f, g.reach);
      for (const [j, r] of [hurt, push, hit].entries()) {
        const guide = slot.guides[j];
        guide.visible = !!(debug && r);
        if (r) {
          guide.position.set(r.x + r.w / 2, r.y + r.h / 2, 2);
          guide.scale.set(r.w, r.h, 1);
        }
      }
      slot.origin.visible = debug;
      slot.origin.position.set(f.x, f.y, 2);
    }
    impact.visible = g.stop > 0;
    if (impact.visible) {
      const [a, b] = g.fighters;
      impact.position.set((a.x + b.x) / 2, Math.max(a.y, b.y) + 76, 3);
      impact.scale.setScalar(10 + (5 - g.stop) * 4);
      impact.material.opacity = g.stop / 5;
    }
    renderer.render(scene, camera);
  }
  function clear() {
    for (const slot of slots) {
      slot.token = null;
      slot.id = null;
      slot.frames = null;
      slot.sprite.material.map = null;
      slot.sprite.visible = false;
      for (const entry of slot.cache.values()) entry.texture.dispose();
      slot.cache.clear();
    }
  }
  return { draw, clear };
}
