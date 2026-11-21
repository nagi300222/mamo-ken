// Short original synthesized cues. The first user gesture unlocks audio.
let audio;
export function unlock() {
  try {
    audio ??= new AudioContext();
    audio.resume().catch(() => {});
  } catch {}
}
export function playCue(kind) {
  if (audio?.state !== "running") return;
  const t = audio.currentTime,
    osc = audio.createOscillator(),
    gain = audio.createGain();
  const [hi, lo, duration] = {
    guard: [510, 240, 0.07],
    burst: [185, 640, 0.18],
    hit: [140, 42, 0.11],
    counter: [720, 320, 0.09],
    launch: [260, 490, 0.09],
  }[kind] ?? [180, 70, 0.08];
  osc.type = kind === "guard" ? "triangle" : "square";
  osc.frequency.setValueAtTime(hi, t);
  osc.frequency.exponentialRampToValueAtTime(lo, t + duration);
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(0.045, t + 0.005);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
  osc.connect(gain);
  gain.connect(audio.destination);
  osc.start(t);
  osc.stop(t + duration + 0.01);
  osc.onended = () => {
    osc.disconnect();
    gain.disconnect();
  };
}
