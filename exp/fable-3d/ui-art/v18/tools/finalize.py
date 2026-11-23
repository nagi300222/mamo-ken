#!/usr/bin/env python3
"""manifest.json を書く（全素材の用途・寸法・バイト数・sha256）。build_ui_art_v18.py → render_outputs.mjs → make_ui_sounds.py の後に実行する。"""
import os, json, hashlib
from PIL import Image
HERE = os.path.dirname(os.path.abspath(__file__)); OUT = os.path.normpath(os.path.join(HERE, '..')); rd = lambda p: json.load(open(os.path.join(OUT, p), encoding='utf-8'))
idx = rd('source/build_index.json'); tok = rd('tokens.json'); aud = rd('audio/audio.json'); cuts = rd('tools/cutouts.json')
def ent(rel, **kw): b = open(os.path.join(OUT, rel), 'rb').read(); return dict(file=rel, bytes=len(b), sha256=hashlib.sha256(b).hexdigest(), **kw)
A = []
for m, info in idx['modes'].items():
    w, h = info['size']; large = m == 'vs-large'; key = 'vs' if large else m
    A.append(ent('png/mode-%s.webp' % m, id='mode-' + m, kind='mode-illustration', mode=key, size=[w * 2, h * 2], displayBase=[w, h], alpha=True, use='大きい対戦カードの絵（4:3）' if large else 'モードカードの絵（主に使う）', motif=info['motif'],
                 textSafe=tok['modeArt']['large']['textSafe'] if large else tok['modeArt']['textSafe'], **(dict(buttonSafe=tok['modeArt']['large']['buttonSafe']) if large else dict(hero=tok['modeArt']['hero'])), fit='cover / right bottom' if large else 'cover / right center', accent=tok['modes'][key]['accent']))
    A.append(ent('png/mode-%s.png' % m, id='mode-%s-png' % m, kind='mode-illustration-fallback', mode=key, size=[w, h], alpha=True, use='WebP を使わない場合の予備'))
    if not large: A.append(ent('png/mode-%s@thumb.png' % m, id='mode-%s-thumb' % m, kind='mode-illustration-thumb-check', mode=key, size=[180, 80], alpha=True, use='縮小確認用（右寄せ切り）。小さな枠にそのまま使ってもよい'))
    A.append(ent('source/mode-%s.svg' % m, id='mode-%s-source' % m, kind='editable-source', mode=key, size=[w, h], use='編集元。source/cutouts/*.png を相対参照する'))
for n, info in idx['icons'].items(): A.append(ent('svg/%s.svg' % n, id=n, kind='symbol', size=[24, 24], color='currentColor', use=info['meaning'], minDisplayPx=16, padding='24 の枠の内側 2px は空けてある'))
for n, info in idx['states'].items(): A.append(ent('svg/%s.svg' % n, id=n, kind='state-decoration', size=info['viewBox'][2:], slice=info['slice'], use=info['use'], distinguishBy=info['distinguishBy'], apply='border-image か、枠の上に重ねる要素として 9 スライスで伸ばす'))
for n, s in aud['sounds'].items(): A.append(dict(id='ui-' + n, kind='ui-sound', **s))
for c in cuts: A.append(ent('source/cutouts/%s.png' % c['name'], id='cutout-' + c['name'], kind='source-cutout', size=list(Image.open(os.path.join(OUT, 'source/cutouts/%s.png' % c['name'])).size), character=c['id'], clip=c.get('clip', 'idle'), use='編集元の部品（元の GLB から描いた切り抜き）'))
for rel, use in (('tokens.json', '色・寸法・状態の決めごと'), ('motion.json', '動きと音の対応')): A.append(ent(rel, id=rel.split('.')[0], kind='spec', use=use))
man = dict(version='v18-p4-ui-polish-r1', status='proposal', base='exp/fable-3d/ui-art/v18/', basedOn='ui-art/v17（変更していない）', textBakedIn=False, species='全員マーモット', assets=A,
           totals=dict(shipBytes=sum(a['bytes'] for a in A if a['kind'] in ('mode-illustration', 'symbol', 'state-decoration', 'ui-sound')), allBytes=sum(a['bytes'] for a in A)),
           rebuild=['node tools/render_cutouts.mjs', 'python3 tools/build_ui_art_v18.py', 'node tools/render_outputs.mjs', 'python3 tools/make_ui_sounds.py', 'python3 tools/finalize.py', 'node tools/render_preview.mjs'])
json.dump(man, open(os.path.join(OUT, 'manifest.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1); print(len(A), 'assets', man['totals'])
