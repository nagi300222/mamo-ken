import { roster, rules, titleOf } from "./data.js";
import { match, step, cpu } from "./engine.js";
import { stage, portraitRig } from "./stage.js";
import { unlock, playCue } from "./sound.js";
const $ = (id) => document.getElementById(id);
const screen = stage($("screen")),
  preview = portraitRig($("sample"));
let chosen = 0,
  game = null,
  acc = 0,
  last = 0,
  ticks = 0,
  notice = "",
  until = 0;
const tapped = new Set();
const keys = new Set(),
  touch = new Map(),
  stick = { x: 0, y: 0 };
let padPointer = null;
const map = {
  ArrowLeft: "left",
  KeyA: "left",
  ArrowRight: "right",
  KeyD: "right",
  ArrowUp: "up",
  KeyW: "up",
  ArrowDown: "down",
  KeyS: "down",
  KeyZ: "light",
  KeyX: "heavy",
  KeyC: "special",
  KeyV: "throw",
  KeyB: "super",
};
function resetInput() {
  tapped.clear();
  keys.clear();
  touch.clear();
  stick.x = stick.y = 0;
  padPointer = null;
  $("pad").lastElementChild.style.transform = "";
  document
    .querySelectorAll(".actions .active")
    .forEach((b) => b.classList.remove("active"));
}
function input() {
  const pressed = (key) =>
    tapped.has(key) ||
    [...keys].some((code) => map[code] === key) ||
    [...touch.values()].includes(key);
  return {
    x: stick.x || Number(pressed("right")) - Number(pressed("left")),
    y: stick.y || Number(pressed("down")) - Number(pressed("up")),
    ...Object.fromEntries(
      ["light", "heavy", "special", "throw", "super"].map((k) => [
        k,
        pressed(k),
      ]),
    ),
  };
}
window.addEventListener("keydown", (e) => {
  if (game && !$("help").open && map[e.code]) {
    e.preventDefault();
    if (!e.repeat) tapped.add(map[e.code]);
    keys.add(e.code);
  }
});
window.addEventListener("keyup", (e) => keys.delete(e.code));
window.addEventListener("blur", resetInput);
for (const b of document.querySelectorAll("[data-key]")) {
  b.onpointerdown = (e) => {
    e.preventDefault();
    b.setPointerCapture(e.pointerId);
    touch.set(e.pointerId, b.dataset.key);
    tapped.add(b.dataset.key);
    b.classList.add("active");
  };
  b.onlostpointercapture = (e) => {
    touch.delete(e.pointerId);
    b.classList.remove("active");
  };
}
const pad = $("pad");
function position(e) {
  const r = pad.getBoundingClientRect(),
    x = ((e.clientX - r.left) / r.width) * 2 - 1,
    y = ((e.clientY - r.top) / r.height) * 2 - 1;
  stick.x = Math.abs(x) > 0.27 ? Math.sign(x) : 0;
  stick.y = Math.abs(y) > 0.34 ? Math.sign(y) : 0;
  pad.lastElementChild.style.transform =
    "translate(" + stick.x * 26 + "px," + stick.y * 10 + "px)";
}
pad.onpointerdown = (e) => {
  if (padPointer !== null) return;
  e.preventDefault();
  padPointer = e.pointerId;
  pad.setPointerCapture(e.pointerId);
  position(e);
};
pad.onpointermove = (e) => {
  if (e.pointerId === padPointer) position(e);
};
pad.onlostpointercapture = () => {
  padPointer = null;
  stick.x = stick.y = 0;
  pad.lastElementChild.style.transform = "";
};
const url = (c) => "./portraits/" + c.id + ".webp";
function select(i) {
  chosen = i;
  const c = roster[i];
  $("number").textContent = String(i + 1).padStart(2, "0") + " / 09";
  $("hero").src = url(c);
  $("hero").alt = c.name + "の選択用原画";
  $("roman").textContent = c.id.replace("_", " ").toUpperCase();
  $("watermark").textContent = c.role.slice(0, 2);
  $("name").textContent = c.name;
  $("role").textContent = c.role + "　／　" + c.trait;
  $("skills").textContent = c.name + "　" + c.skills.join(" ／ ");
  [...$("grid").children].forEach((b, j) =>
    b.setAttribute("aria-pressed", String(j === i)),
  );
  preview(c, 0);
}
for (const [i, c] of roster.entries()) {
  const b = document.createElement("button");
  b.className = "tile";
  b.innerHTML = '<img alt="" src="' + url(c) + '"><span>' + c.name + "</span>";
  b.onclick = () => select(i);
  $("grid").append(b);
  $("opponent").add(new Option(c.name, i));
}
$("opponent").selectedIndex = Math.min(2, roster.length - 1);
select(0);
function start() {
  unlock();
  resetInput();
  const a = roster[chosen],
    b = roster[Number($("opponent").value)];
  game = match(a, b);
  screen.set(a, b);
  $("p0").textContent = a.name;
  $("p1").textContent = b.name;
  $("result").hidden = true;
  $("lobby").hidden = true;
  $("battle").hidden = false;
  notice = "勝負開始";
  until = 52;
  acc = 0;
  last = performance.now();
  render();
}
function lobby() {
  game = null;
  resetInput();
  $("battle").hidden = true;
  $("lobby").hidden = false;
  select(chosen);
}
function render() {
  screen.draw(game);
  game.p.forEach((f, i) => {
    const panel = $("p" + i).closest(".side");
    panel.dataset.motion = f.move?.key ?? f.mode;
    panel.dataset.x = f.x.toFixed(1);
    panel.dataset.guard = String(f.prev.x * f.face < 0);
    const status = f.poison
      ? "毒"
      : f.c.style === "counter" && f.stored
        ? "溜め完了"
        : f.boost
          ? { wall: "鉄壁", runner: "追走", grapple: "圧力" }[f.c.style]
          : "";
    $("p" + i).textContent = f.c.name + (status ? "　· " + status : "");
    $("meter" + i).classList.toggle("ready", f.meter >= rules.superCost);
    $("hp" + i).style.width = f.hp + "%";
    $("meter" + i).style.width = f.meter + "%";
    $("hp" + i).parentElement.title = "HP " + f.hp;
  });
  $("timer").textContent = String(Math.ceil(game.time / 60)).padStart(2, "0");
  $("cue").textContent = game.frame < until ? notice : "";
  if (game.winner !== null) {
    $("result").hidden = false;
    $("verdict").textContent =
      game.winner === 2 ? "引き分け" : game.winner === 0 ? "勝利！" : "敗北";
  }
}
function frame(now) {
  const delta = Math.min(120, now - (last || now));
  last = now;
  if (game && !$("help").open) {
    acc += delta;
    while (acc >= 1000 / 60) {
      const f = game.p[0],
        old = f.move,
        combo = f.combo;
      const frozen = game.freeze > 0,
        priorFx = game.fx.at(-1),
        priorShot = game.shots.at(-1);
      step(game, input(), cpu(game));
      if (!frozen) tapped.clear();
      if (game.fx.at(-1) && game.fx.at(-1) !== priorFx)
        playCue(game.fx.at(-1).kind);
      else if (game.shots.at(-1) && game.shots.at(-1) !== priorShot)
        playCue("launch");
      if (
        f.move !== old &&
        f.move &&
        ["wave", "rise", "trick", "super", "clinch"].includes(f.move.key)
      ) {
        notice = titleOf(f.c, f.move.key);
        until = game.frame + 30;
      }
      if (f.combo > 1 && f.combo !== combo) {
        notice = f.combo + " HIT";
        until = game.frame + 30;
      }
      acc -= 1000 / 60;
    }
    render();
  } else if (!game && ++ticks % 4 === 0) preview(roster[chosen], ticks);
  requestAnimationFrame(frame);
}
$("start").onclick = $("again").onclick = start;
$("back").onclick = $("leave").onclick = lobby;
$("guide").onclick = () => {
  resetInput();
  $("help").showModal();
};
$("close").onclick = () => $("help").close();
requestAnimationFrame(frame);
