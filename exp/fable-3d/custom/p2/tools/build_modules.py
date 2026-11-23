#!/usr/bin/env python3
"""マモ拳 P2 交換モジュールを作る。出力: ../assets/modules/<host>/<slot>_<donor>.glb と ../assets/manifest.json、../assets/build_report.json
  python3 exp/fable-3d/custom/p2/tools/build_modules.py            # MODULES に載っているもの全部
入力は custom/v16/assets/<id>_parts.glb（読むだけ）。依存は numpy と scipy。作り方の中身は p2lib.py。
MODULES に載せるのは、inspect_modules.py と WebGL の継ぎ目実測を通し、絵でも確認したものだけ。"""
import json, os, sys
HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, HERE)
import p2lib as L
ASSETS = os.path.join(L.P2, 'assets')
# (host, slot, donor)。自分自身が donor の組は作らない（base を使う）。
HOSTS = ('moguzo', 'godan', 'bullet')
MODULES = [(h, s, d) for h in HOSTS for s in ('head', 'ears', 'hands', 'feet') for d in HOSTS if d != h]
MODULES += [('moguzo', 'tail', 'godan'), ('godan', 'tail', 'moguzo')]          # 短い尾（3 骨）どうしだけ。bullet の 6 骨の尾との交換は未対応

def main():
    chars = {}; get = lambda c: chars.setdefault(c, L.Char(c)); entries = []; reports = []
    src = dict(path='../tools/p2lib.py', sha256=L.sha(open(os.path.join(HERE, 'p2lib.py'), 'rb').read()))
    for host, slot, donor in MODULES:
        H, D = get(host), get(donor); built = L.build_module(H, D, slot); rel = 'modules/%s/%s_%s.glb' % (host, slot, donor); raw, names = L.write_module(H, D, slot, built, os.path.join(ASSETS, rel))
        entries.append(dict(id='%s-%s-%s' % (host, slot, donor), targetBaseId=host, donorId=donor, slot=slot, file=rel, meshNames=names, bytes=len(raw), sha256=L.sha(raw), lod=0, morphTargets=list(L.MORPHS), jointNames=list(H.joints),
                            palette=D.palette(), seams=dict(kind='matched-host-boundary', tolerance=L.TOL), socket=dict(bone=L.SOCKET[slot], position=[0, 0, 0], space='host-bind-local'), source=src))
        reports.append(dict(id=entries[-1]['id'], file=rel, **built['report'])); print(entries[-1]['id'], len(raw), names)
    json.dump(dict(schemaVersion=1, version='p2-exchange-1', coordinateSystem='gltf-y-up-metres-host-bind-local', modules=entries), open(os.path.join(ASSETS, 'manifest.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1); open(os.path.join(ASSETS, 'manifest.json'), 'a').write('\n')
    tools = {f: L.sha(open(os.path.join(HERE, f), 'rb').read()) for f in ('p2lib.py', 'glbio.py', 'build_modules.py')}
    inputs = {c: dict(file='../../v16/assets/%s_parts.glb' % c, sha256=chars[c].raw_sha) for c in sorted(chars)}
    json.dump(dict(version='p2-exchange-1', tools=tools, inputs=inputs, modules=reports), open(os.path.join(ASSETS, 'build_report.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
if __name__ == '__main__': main()
