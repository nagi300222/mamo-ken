#!/usr/bin/env python3
"""マモ拳 UI 音 4 種を数式だけで作る（録音素材・他作品の音は使っていない）。
  python3 exp/fable-3d/ui-art/v18/tools/make_ui_sounds.py   → ../audio/ui-select.wav, ui-confirm.wav, ui-back.wav, ui-save.wav と audio.json
木札・木の拍子・小さな鈴の音色。モノラル 44.1kHz 16bit。戦闘音より控えめにするため、ピークは -12dBFS 前後に抑えている。"""
import os, json, wave, hashlib
import numpy as np
HERE = os.path.dirname(os.path.abspath(__file__)); OUT = os.path.normpath(os.path.join(HERE, '..', 'audio')); os.makedirs(OUT, exist_ok=True); SR = 44100; rng = np.random.default_rng(18)
def t(dur): return np.arange(int(SR * dur)) / SR
def env(x, a, d): n = np.arange(len(x)) / SR; return x * np.minimum(1, n / a) * np.exp(-np.maximum(0, n - a) / d)
def wood(freq, dur, decay, noise=0.25):
    """木を叩く音: 倍音が整数比から少しずれた減衰の速い部分音 + ごく短い打撃ノイズ"""
    x = t(dur); y = sum(a * np.sin(2 * np.pi * freq * r * x) * np.exp(-x / (decay / (1 + i * .7))) for i, (r, a) in enumerate(((1, 1), (2.76, .45), (5.4, .2), (8.9, .08))))
    click = rng.standard_normal(len(x)) * np.exp(-x / 0.003) * noise; return env(y + click, 0.0008, dur)
def bell(freq, dur, decay):
    x = t(dur); return env(sum(a * np.sin(2 * np.pi * freq * r * x) * np.exp(-x / (decay / (1 + i * .5))) for i, (r, a) in enumerate(((1, 1), (2.0, .35), (3.01, .18), (4.2, .07)))), 0.002, dur)
def place(parts, dur):
    y = np.zeros(int(SR * dur))
    for at, s in parts: i = int(SR * at); y[i:i + len(s)] += s[:len(y) - i]
    return y
def lp(y, k=6): return np.convolve(y, np.ones(k) / k, mode='same')          # 角を落として耳に刺さらないようにする
SOUNDS = dict(
    select=dict(dur=0.07, peak_db=-15, use='フォーカス移動・項目選択', make=lambda: lp(place([(0, wood(1180, .06, .014, .18))], .07), 4)),
    confirm=dict(dur=0.20, peak_db=-12, use='決定', make=lambda: lp(place([(0, wood(620, .09, .03, .3)), (0.035, 0.55 * bell(1568, .16, .06))], .20), 3)),
    back=dict(dur=0.13, peak_db=-14, use='戻る・取り消し', make=lambda: lp(place([(0, wood(520, .07, .022, .2)), (0.045, 0.7 * wood(390, .08, .026, .12))], .13), 5)),
    save=dict(dur=0.34, peak_db=-12, use='保存できた', make=lambda: lp(place([(0, 0.5 * wood(700, .06, .02, .25)), (0.03, 0.6 * bell(1046.5, .2, .07)), (0.13, 0.7 * bell(1568, .2, .08))], .34), 3)))
meta = dict(version='v18-p4-ui-polish-r1', sampleRate=SR, channels=1, bitDepth=16, source='tools/make_ui_sounds.py', note='既存の戦闘音（dojo/combat-audio.js の合成音）より小さく鳴らす想定。再生時の音量はさらに 0.6〜0.8 倍を目安に', sounds={})
for name, s in SOUNDS.items():
    y = s['make'](); y[-int(SR * .008):] *= np.linspace(1, 0, int(SR * .008)); y = y / np.abs(y).max() * 10 ** (s['peak_db'] / 20); pcm = (np.clip(y, -1, 1) * 32767).astype('<i2'); p = os.path.join(OUT, 'ui-%s.wav' % name)
    with wave.open(p, 'wb') as w: w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())
    b = open(p, 'rb').read(); rms = 20 * np.log10(np.sqrt(np.mean(y ** 2)) + 1e-12)
    meta['sounds'][name] = dict(file='audio/ui-%s.wav' % name, use=s['use'], durationMs=round(len(y) / SR * 1000), peakDbfs=s['peak_db'], rmsDbfs=round(float(rms), 1), bytes=len(b), sha256=hashlib.sha256(b).hexdigest())
    print(name, len(b), meta['sounds'][name]['durationMs'], 'ms', 'rms %.1f' % rms)
json.dump(meta, open(os.path.join(OUT, 'audio.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
