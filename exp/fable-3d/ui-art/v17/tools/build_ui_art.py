#!/usr/bin/env python3
"""マモ拳 v17 P4（Issue #213）UI アートの生成元。山稜・拳の印章・木札／紙／布・5 モード記号・9 キャラ識別紋・HUD 枠を
編集可能な SVG として書き出す（外部画像・フォント・他作品の素材は使わない。文字は焼き込まない）。
  python3 exp/fable-3d/ui-art/v17/tools/build_ui_art.py      → ../svg/*.svg, ../tokens.json, ../manifest.json
色は CSS 変数（--mk-*）で差し替えられる。変数が無い環境では tokens.json の初期値で描かれる。"""
import os, json, math, random
HERE = os.path.dirname(os.path.abspath(__file__)); OUT = os.path.normpath(os.path.join(HERE, '..')); SVG = os.path.join(OUT, 'svg'); os.makedirs(SVG, exist_ok=True)
# ---- トークン（P4_VISUAL_DIRECTION.md 2-1 の初期値 ＋ 素材用に足した提案色。採否は未確定） ----
T = dict(bg='#101F1B', panel='#1C332C', text='#F5EFDB', sub='#BED1C7', action='#F1C66C', good='#6FD0A0', drive='#58C7D2', danger='#FA8976', line='#69877C',
         paper='#EFE6CC', paperShade='#D9CDA9', wood='#8A6A45', woodDark='#5C4630', woodLight='#A98759', ink='#1B1A17', seal='#B5402E', sealDark='#7F2A1E', cloth='#2F5247', clothLight='#3F6B5C')
PROPOSED = ['paper', 'paperShade', 'wood', 'woodDark', 'woodLight', 'ink', 'seal', 'sealDark', 'cloth', 'clothLight']
CHAR = dict(moguzo=('モグゾー', '#D9A45B'), pisuke=('ピスケ', '#7FD3F0'), godan=('ゴダン', '#C8763F'), hakuma=('ハクマ', '#CFE9F2'), chirka=('チルカ', '#B98BE8'),
            takimaru=('タキマル', '#E0B25A'), yomikage=('ヨミカゲ', '#7FC6E8'), bullet=('バレット', '#F0963C'), dark_moguzo=('ダークモグゾー', '#9B6BE0'))
def V(k): return 'var(--mk-%s,%s)' % (k, T[k])
def kebab(k): return ''.join('-' + c.lower() if c.isupper() else c for c in k)
def Vk(k): return 'var(--mk-%s,%s)' % (kebab(k), T[k])
V = Vk
MAN = []
def save(name, w, h, body, use, **extra):
    s = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 %d %d" width="%d" height="%d" role="img" aria-label="%s">\n%s\n</svg>\n' % (w, h, w, h, use, body.strip('\n'))
    open(os.path.join(SVG, name + '.svg'), 'w', encoding='utf-8').write(s); MAN.append(dict(id=name, file='svg/%s.svg' % name, viewBox=[0, 0, w, h], use=use, **extra))
f = lambda x: ('%.1f' % x).rstrip('0').rstrip('.')
def pts(P): return ' '.join('%s,%s' % (f(x), f(y)) for x, y in P)

# ---------------------------------------------------------------- 山稜（切り紙の稜線。左右をつなげて並べられる）
def ridge(seed, w, base, amp, n, sharp=0.5):
    r = random.Random(seed); xs = [w * i / n for i in range(n + 1)]; ys = []
    for i in range(n + 1):
        t = i / n; y = base - amp * (0.55 * math.sin(t * math.pi * 2 * 1.5 + seed) ** 2 + 0.45 * r.random())
        ys.append(y)
    ys[-1] = ys[0]; P = []
    for i in range(n):
        P.append((xs[i], ys[i])); mx = xs[i] + (xs[i + 1] - xs[i]) * (0.35 + 0.3 * r.random()); my = min(ys[i], ys[i + 1]) - amp * sharp * r.random() * 0.5
        P.append((mx, my))
    P.append((xs[-1], ys[-1])); return P
def ridge_band(name, seed, color, shade, use, w=1200, h=240, base=150, amp=110, n=9):
    P = ridge(seed, w, base, amp, n); poly = pts(P + [(w, h), (0, h)])
    # 稜線の影: 頂点から右下へ落ちる斜めの面（切り紙の重なり）
    faces = ''
    for i in range(1, len(P) - 1, 2):
        x, y = P[i]; nx, ny = P[i + 1]
        faces += '<polygon points="%s" fill="%s" opacity=".55"/>' % (pts([(x, y), (nx, ny), (x + (nx - x) * .35, h), (x - 6, h)]), shade)
    save(name, w, h, '<polygon points="%s" fill="%s"/>\n%s\n<polyline points="%s" fill="none" stroke="%s" stroke-width="3" stroke-linejoin="miter" opacity=".9"/>' % (poly, color, faces, pts(P), V('line')), use, tile='x', group='ridge')
ridge_band('ridge-far', 3, V('panel'), V('bg'), '遠景の山稜（メニュー背景の上段）', amp=90, base=140, n=11)
ridge_band('ridge-near', 8, V('cloth'), V('bg'), '近景の山稜（メニュー背景の下段・パネルの縁）', amp=120, base=170, n=7)
P = ridge(5, 1200, 40, 30, 14, .8)
save('ridge-line', 1200, 56, '<polyline points="%s" fill="none" stroke="%s" stroke-width="4" stroke-linejoin="miter" stroke-linecap="square"/>\n<polyline points="%s" fill="none" stroke="%s" stroke-width="1.5" opacity=".5" transform="translate(0,9)"/>' % (pts(P), V('action'), pts(P), V('line')),
     '稜線の区切り線（見出しの下・HUD の縁）', tile='x', group='ridge')

# ---------------------------------------------------------------- 拳の印章（マーモットの握り拳。文字なし）
def fist(cx, cy, s, fill, cut):
    """握った前足を正面から: 4 つの指の節、親指、肉球の甲。cut は節の間の切れ込み色"""
    g = '<g transform="translate(%s,%s) scale(%s)">' % (f(cx), f(cy), f(s))
    g += '<path d="M-62,-6 C-66,-44 -40,-70 0,-70 C40,-70 66,-44 62,-6 L58,44 C54,70 30,84 0,84 C-30,84 -54,70 -58,44 Z" fill="%s"/>' % fill          # 拳の塊
    for i, x in enumerate((-42, -14, 14, 42)):                                                                                                       # 指の節（上の丸み）
        g += '<ellipse cx="%d" cy="%d" rx="15.5" ry="19" fill="%s"/>' % (x, -58 + abs(i - 1.5) * 5, fill)
    for x in (-28, 0, 28): g += '<path d="M%d,-66 L%d,-18" stroke="%s" stroke-width="5" stroke-linecap="round"/>' % (x, x, cut)                      # 節の間
    g += '<path d="M-60,2 C-30,-8 30,-8 60,2" fill="none" stroke="%s" stroke-width="5" stroke-linecap="round"/>' % cut                                 # 握りの線
    g += '<path d="M-64,10 C-84,16 -86,44 -66,54 C-52,60 -40,50 -40,36 C-40,22 -50,12 -64,10 Z" fill="%s" stroke="%s" stroke-width="4"/>' % (fill, cut)  # 親指
    for x, y, r in ((-18, 44, 9), (4, 50, 10), (26, 44, 9)): g += '<circle cx="%d" cy="%d" r="%d" fill="%s" opacity=".9"/>' % (x, y, r, cut)            # 肉球
    return g + '</g>'
def rough_rect(seed, x, y, w, h, r, j=3.2):
    rr = random.Random(seed); P = []; n = 14
    for i in range(n): P.append((x + r + (w - 2 * r) * i / (n - 1) + rr.uniform(-j, j) * .3, y + rr.uniform(-j, j)))
    for i in range(n): P.append((x + w + rr.uniform(-j, j), y + r + (h - 2 * r) * i / (n - 1)))
    for i in range(n): P.append((x + w - r - (w - 2 * r) * i / (n - 1), y + h + rr.uniform(-j, j)))
    for i in range(n): P.append((x + rr.uniform(-j, j), y + h - r - (h - 2 * r) * i / (n - 1)))
    return pts(P)
seal = '<polygon points="%s" fill="%s"/>\n<polygon points="%s" fill="none" stroke="%s" stroke-width="5" opacity=".9"/>\n' % (rough_rect(2, 14, 14, 212, 212, 30), V('seal'), rough_rect(4, 30, 30, 180, 180, 22, 2), V('paper'))
seal += '<polygon points="40,196 86,150 108,170 138,132 200,196" fill="%s" opacity=".55"/>\n' % V('sealDark') + fist(120, 112, 1.02, V('paper'), V('seal'))
random.seed(7); seal += ''.join('<circle cx="%s" cy="%s" r="%s" fill="%s" opacity=".5"/>' % (f(random.uniform(24, 216)), f(random.uniform(24, 216)), f(random.uniform(1, 3.2)), V('seal') if random.random() < .5 else V('paper')) for _ in range(46))
save('fist-seal', 240, 240, seal, '拳の印章（タイトル・決定・勝利の押印。朱の角印に握り拳と山）', group='emblem')
save('fist-mark', 200, 200, fist(100, 96, 1.0, 'currentColor', V('bg')), '拳の紋（単色。currentColor で着色。小さなアイコン・箇条の印）', group='emblem', monochrome=True)

# ---------------------------------------------------------------- 木札・紙・布（軽い質感。9 スライスで伸ばせる）
def grain(seed, w, h, n, color, x0=0, y0=0):
    rr = random.Random(seed); s = ''
    for i in range(n):
        y = y0 + h * (i + .5) / n + rr.uniform(-3, 3); a = rr.uniform(2, 7); ph = rr.uniform(0, 6)
        d = 'M%s,%s ' % (f(x0), f(y)) + ' '.join('L%s,%s' % (f(x0 + w * k / 12), f(y + a * math.sin(ph + k * .9))) for k in range(1, 13))
        s += '<path d="%s" fill="none" stroke="%s" stroke-width="%s" opacity="%s"/>' % (d, color, f(rr.uniform(1, 2.4)), f(rr.uniform(.18, .42)))
    return s
tag = '<path d="M18,6 H462 L474,18 V142 L462,154 H18 L6,142 V18 Z" fill="%s"/>\n<path d="M18,6 H462 L474,18 V40 H6 V18 Z" fill="%s" opacity=".35"/>\n' % (V('wood'), V('woodLight'))
tag += '<g clip-path="url(#c)">%s<ellipse cx="350" cy="96" rx="20" ry="9" fill="none" stroke="%s" stroke-width="2.5" opacity=".45"/><ellipse cx="350" cy="96" rx="9" ry="3.5" fill="%s" opacity=".45"/></g>\n' % (grain(11, 468, 148, 9, V('woodDark'), 6, 6), V('woodDark'), V('woodDark'))
tag += '<defs><clipPath id="c"><path d="M18,6 H462 L474,18 V142 L462,154 H18 L6,142 V18 Z"/></clipPath></defs>\n<path d="M18,6 H462 L474,18 V142 L462,154 H18 L6,142 V18 Z" fill="none" stroke="%s" stroke-width="4"/>\n' % V('woodDark')
tag += '<circle cx="34" cy="80" r="9" fill="%s"/><circle cx="34" cy="80" r="9" fill="none" stroke="%s" stroke-width="3"/>\n<path d="M34,80 C10,70 -6,40 -2,8" fill="none" stroke="%s" stroke-width="4" stroke-linecap="round"/>' % (V('bg'), V('woodDark'), V('seal'))
save('wood-tag', 480, 160, tag, '木札（モード名・キャラ名・タイマーの台。左の穴に紐）', group='surface', slice=dict(left=60, right=28, top=28, bottom=28))
paper = '<path d="M8,10 L430,6 L474,60 L452,112 L10,114 Z" fill="%s"/>\n<path d="M430,6 L474,60 L452,112 L436,60 Z" fill="%s"/>\n' % (V('paper'), V('paperShade'))
rr = random.Random(21); paper += ''.join('<path d="M%s,%s l%s,%s" stroke="%s" stroke-width="1" opacity=".35"/>' % (f(rr.uniform(16, 420)), f(rr.uniform(16, 106)), f(rr.uniform(-9, 9)), f(rr.uniform(-3, 3)), V('woodDark')) for _ in range(60))
paper += '\n<path d="M8,10 L430,6 L474,60 L452,112 L10,114 Z" fill="none" stroke="%s" stroke-width="2" opacity=".5"/>\n<path d="M22,96 H412" stroke="%s" stroke-width="2" stroke-dasharray="2 7" opacity=".5"/>' % (V('woodDark'), V('seal'))
save('paper-strip', 480, 120, paper, '紙の札（説明・技名・稽古帖の行。右端を斜めに切る）', group='surface', slice=dict(left=24, right=70, top=20, bottom=20))
cloth = '<path d="M14,22 H146 V430 L80,470 L14,430 Z" fill="%s"/>\n<defs><pattern id="w" width="8" height="8" patternUnits="userSpaceOnUse"><path d="M0,4 H8 M4,0 V8" stroke="%s" stroke-width="1" opacity=".28"/></pattern><clipPath id="k"><path d="M14,22 H146 V430 L80,470 L14,430 Z"/></clipPath></defs>\n' % (V('cloth'), V('clothLight'))
cloth += '<rect x="14" y="22" width="132" height="450" fill="url(#w)" clip-path="url(#k)"/>\n<path d="M14,22 H146 V58 H14 Z" fill="%s" opacity=".6"/>\n' % V('clothLight')
cloth += ''.join('<rect x="%d" y="4" width="16" height="26" rx="3" fill="%s"/>' % (x, V('clothLight')) for x in (26, 72, 118)) + '\n<path d="M6,10 H154" stroke="%s" stroke-width="7" stroke-linecap="round"/>\n' % V('woodDark')
cloth += '<path d="M14,22 H146 V430 L80,470 L14,430 Z" fill="none" stroke="%s" stroke-width="3"/>\n<path d="M26,400 L80,434 L134,400" fill="none" stroke="%s" stroke-width="3"/>' % (V('bg'), V('action'))
save('cloth-banner', 160, 480, cloth, '布ののぼり（キャラ選択の縦帯・大会の旗。下端は剣先）', group='surface', slice=dict(left=20, right=20, top=64, bottom=60))
save('cut-panel', 480, 200, '<path d="M0,0 H410 L480,200 H0 Z" fill="%s"/>\n<path d="M410,0 L480,200" stroke="%s" stroke-width="5"/>\n<path d="M392,0 L462,200" stroke="%s" stroke-width="2" opacity=".6"/>' % (V('panel'), V('action'), V('line')),
     '斜めに切ったパネル（左右の対比・モード選択の主カード。切り紙の斜め余白）', group='surface', slice=dict(left=10, right=80, top=10, bottom=10))

# ---------------------------------------------------------------- 5 モードの記号（96px。形だけで区別できる。2 色）
def icon(name, body, use, label):
    save('mode-' + name, 96, 96, '<g fill="none" stroke="%s" stroke-width="5" stroke-linecap="round" stroke-linejoin="round">\n%s\n</g>' % (V('text'), body), use, group='mode', mode=name, label=label)
A = V('action')
icon('versus', '<path d="M6,36 H30 C40,36 44,42 44,50 V58 C44,66 40,72 30,72 H6 Z" fill="%s"/><path d="M30,40 V68 M20,36 V46 M12,36 V46" stroke="%s"/><path d="M90,36 H66 C56,36 52,42 52,50 V58 C52,66 56,72 66,72 H90 Z" fill="%s"/><path d="M66,40 V68 M76,36 V46 M84,36 V46"/><path d="M48,12 V26 M38,16 L43,27 M58,16 L53,27 M48,82 V90" stroke="%s"/>' % (A, V('bg'), V('panel'), A),
     '戦う（通常対戦）: 正面からぶつかる 2 つの拳と火花', '戦う')
icon('practice', '<path d="M48,16 V84"/><rect x="34" y="22" width="28" height="34" rx="6" fill="%s"/><path d="M34,32 H62 M34,44 H62" stroke="%s"/><path d="M28,84 H68"/><path d="M74,30 L86,24 M76,42 H90 M74,54 L86,60" stroke="%s"/>' % (V('panel'), V('line'), A),
     '練習（Practice）: 巻き藁の稽古柱と打撃の線', '練習')
icon('arcade', '<path d="M8,84 L26,52 L36,66 L52,30 L64,50 L74,36 L90,84 Z" fill="%s"/><path d="M52,30 V12 M52,12 L68,18 L52,24" stroke="%s" fill="%s"/><path d="M20,84 L30,70 M40,84 L48,70 M60,84 L66,72" stroke="%s"/>' % (V('panel'), A, A, V('line')),
     '勝ち進む（ARCADE 8 戦）: 山頂の旗へ登る稜線', '勝ち進む')
icon('survival', '<path d="M48,10 C60,26 72,34 70,54 C69,72 58,84 48,84 C38,84 27,72 26,54 C25,42 32,36 36,28 C40,36 44,38 44,30 C44,22 46,16 48,10 Z" fill="%s"/><path d="M48,48 C54,56 58,60 57,68 C56,76 52,80 48,80 C44,80 40,76 39,68 C38,60 44,56 48,48 Z" fill="%s" stroke="none"/><path d="M12,88 H84" stroke="%s"/>' % (V('panel'), A, V('line')),
     '生き残る（SURVIVAL）: 消えない焚き火', '生き残る')
icon('journey', '<path d="M12,80 C28,62 20,48 40,42 C60,36 54,22 76,16" stroke-dasharray="1 11" stroke="%s"/><circle cx="76" cy="16" r="6" fill="%s" stroke="none"/><ellipse cx="22" cy="72" rx="7" ry="9" fill="%s"/><ellipse cx="42" cy="54" rx="6" ry="8" fill="%s"/><path d="M62,84 V58 M62,58 C70,54 76,62 84,58 V72 C76,76 70,68 62,72" fill="%s"/>' % (A, A, V('panel'), V('panel'), V('panel')),
     '自分を作って旅する（キャラクリ＋探索）: 足あとの道と旗', '旅する')

# ---------------------------------------------------------------- 9 キャラの識別紋（枠の形と中の図が全員違う。色はアクセントで、色だけに頼らない）
def crest(cid, frame, motif, note):
    name, col = CHAR[cid]; c = 'var(--mk-char,%s)' % col
    body = '<g>%s</g>\n<g fill="none" stroke="%s" stroke-width="6" stroke-linecap="round" stroke-linejoin="round">%s</g>' % (frame.replace('{c}', c).replace('{p}', V('panel')).replace('{b}', V('bg')), V('text'), motif.replace('{c}', c).replace('{t}', V('text')).replace('{p}', V('panel')))
    save('crest-' + cid, 160, 160, body, '%s の識別紋: %s' % (name, note), group='crest', character=cid, accent=col, displayName=name)
crest('moguzo', '<circle cx="80" cy="80" r="70" fill="{p}" stroke="{c}" stroke-width="8"/>', '<path d="M34,112 C52,92 108,92 126,112" stroke="{c}"/><path d="M58,96 V62 C58,50 70,44 80,44 C90,44 102,50 102,62 V96" fill="{c}" stroke="{t}"/><path d="M66,50 V72 M80,46 V72 M94,50 V72"/>', '丸枠・大地から突き上げる拳（万能・根性）')
crest('pisuke', '<polygon points="80,8 152,80 80,152 8,80" fill="{p}" stroke="{c}" stroke-width="8"/>', '<path d="M36,96 C60,92 86,80 112,50" stroke="{c}"/><path d="M48,112 C70,108 96,96 122,66"/><path d="M104,44 L124,40 L120,60" fill="{c}"/><path d="M30,78 H52 M26,62 H44" stroke="{c}"/>', 'ひし形枠・風を切る蹴り足の軌跡（高速）')
crest('godan', '<polygon points="44,10 116,10 152,50 152,110 116,150 44,150 8,110 8,50" fill="{p}" stroke="{c}" stroke-width="8"/>', '<path d="M40,112 L52,58 L92,46 L122,70 L116,112 Z" fill="{c}" stroke="{t}"/><path d="M52,58 L78,78 L92,46 M78,78 L116,112 M78,78 L40,112"/>', '八角の岩枠・割れ目の入った岩塊（重量・装甲）')
crest('hakuma', '<path d="M80,8 L98,40 L134,26 L120,62 L152,80 L120,98 L134,134 L98,120 L80,152 L62,120 L26,134 L40,98 L8,80 L40,62 L26,26 L62,40 Z" fill="{p}" stroke="{c}" stroke-width="7"/>', '<path d="M58,104 V70 C58,62 68,62 68,70 V58 C68,50 78,50 78,58 V54 C78,46 88,46 88,54 V60 C88,52 98,52 98,60 V96 C98,112 88,120 78,120 C68,120 58,114 58,104 Z" fill="{c}" stroke="{t}"/>', '雪の結晶枠・開いた掌（守勢・押し返し）')
crest('chirka', '<path d="M8,80 C40,24 120,24 152,80 C120,136 40,136 8,80 Z" fill="{p}" stroke="{c}" stroke-width="8"/>', '<path d="M52,54 C60,74 60,90 50,108" stroke="{c}"/><path d="M76,48 C84,72 84,92 74,114" stroke="{c}"/><path d="M100,54 C108,74 108,90 98,108" stroke="{c}"/><path d="M110,60 L128,52 M112,80 H132"/>', '瞳の形の枠・3 本の爪あと（幻惑・フェイント）')
crest('takimaru', '<circle cx="80" cy="80" r="70" fill="{p}" stroke="{c}" stroke-width="8"/><circle cx="80" cy="80" r="46" fill="{b}" stroke="{c}" stroke-width="5"/>', '<path d="M36,60 C40,104 68,122 80,122 C92,122 120,104 124,60" stroke="{c}" stroke-width="10"/><path d="M36,60 L28,46 M124,60 L132,46" stroke="{t}"/><circle cx="80" cy="76" r="10" fill="{c}" stroke="{t}"/>', '二重の輪枠・抱え込む両腕（掴み・圧）')
crest('yomikage', '<path d="M92,8 A72,72 0 1 0 92,152 A56,56 0 1 1 92,8 Z" fill="{p}" stroke="{c}" stroke-width="8" transform="translate(-4,0)"/>', '<path d="M52,120 L116,40" stroke="{c}" stroke-width="8"/><path d="M110,34 L124,30 L120,46" fill="{c}"/><path d="M44,108 L60,124"/>', '三日月枠・一筋の手刀（見切り・反撃）')
crest('bullet', '<rect x="8" y="34" width="144" height="92" rx="46" fill="{p}" stroke="{c}" stroke-width="8"/>', '<path d="M28,96 C50,100 76,96 96,84 C112,74 122,66 134,62" stroke="{c}" stroke-width="12"/><path d="M28,96 C50,100 76,96 96,84" stroke="{t}" stroke-width="3" stroke-dasharray="2 9"/><circle cx="54" cy="62" r="11" fill="{c}" stroke="{t}"/><path d="M54,51 V44"/>', '長円枠・長い尾と木の実（長尾・射程）')
crest('dark_moguzo', '<polygon points="80,152 8,26 152,26" fill="{p}" stroke="{c}" stroke-width="8"/>', '<path d="M58,48 V82 C58,94 70,100 80,100 C90,100 102,94 102,82 V48" fill="{c}" stroke="{t}"/><path d="M66,94 V72 M80,98 V72 M94,94 V72"/><path d="M44,118 L60,108 M116,118 L100,108 M80,132 V116" stroke="{c}"/>', '逆三角枠・下へ突く拳と破片（高速連係・モグゾーとは逆向き）')

# ---------------------------------------------------------------- HUD の枠（体力・ドライブ・奥義・タイマー）
save('hud-hp-frame', 480, 56, '<path d="M4,6 H446 L476,50 H34 Z" fill="%s"/>\n<path d="M4,6 H446 L476,50 H34 Z" fill="none" stroke="%s" stroke-width="4"/>\n<path d="M12,12 H438 L458,44 H40 Z" fill="%s" opacity=".9"/>\n<path d="M4,6 L34,50" stroke="%s" stroke-width="4"/>' % (V('bg'), V('text'), V('panel'), V('action')),
     '体力ゲージの枠（1P 用。2P は左右反転。内側 12,12〜458,44 に中身を描く）', group='hud', inner=[40, 12, 438, 44], mirror='scaleX(-1) で 2P')
save('hud-sub-frame', 360, 28, '<path d="M4,4 H334 L356,24 H24 Z" fill="%s"/>\n<path d="M4,4 H334 L356,24 H24 Z" fill="none" stroke="%s" stroke-width="3"/>' % (V('bg'), V('line')), 'ドライブ／奥義ゲージの枠（体力の下。細い平行四辺形）', group='hud', inner=[26, 7, 332, 21])
save('hud-timer', 120, 96, '<path d="M14,6 H106 L116,22 V66 L60,92 L4,66 V22 Z" fill="%s"/>\n<g clip-path="url(#t)">%s</g><defs><clipPath id="t"><path d="M14,6 H106 L116,22 V66 L60,92 L4,66 V22 Z"/></clipPath></defs>\n<path d="M14,6 H106 L116,22 V66 L60,92 L4,66 V22 Z" fill="none" stroke="%s" stroke-width="4"/>\n<path d="M22,72 L60,88 L98,72" fill="none" stroke="%s" stroke-width="3"/>' % (V('wood'), grain(31, 112, 86, 6, V('woodDark'), 4, 6), V('woodDark'), V('action')),
     'タイマーの木札（中央上。数字は DOM で重ねる）', group='hud', inner=[18, 14, 102, 62])
save('button-plate', 120, 120, '<circle cx="60" cy="60" r="54" fill="%s"/>\n<circle cx="60" cy="60" r="54" fill="none" stroke="%s" stroke-width="5"/>\n<path d="M22,44 A42,42 0 0 1 98,44" fill="none" stroke="%s" stroke-width="4" opacity=".7"/>\n<path d="M30,84 L48,70 L60,80 L74,64 L92,84" fill="none" stroke="%s" stroke-width="3" opacity=".6"/>' % (V('panel'), 'var(--mk-button,%s)' % T['action'], V('text'), V('line')),
     '攻撃ボタンの台（丸。--mk-button で縁の色。文字は DOM。下に小さな稜線）', group='control', minTap='44pt 以上で使う')

json.dump(dict(version='v17-p4-ui-art-1', status='proposal', note='P4_VISUAL_DIRECTION.md 2-1 の初期値。proposed は素材用に足した提案色で、採否は未確定', css_prefix='--mk-', colors=T, proposed=PROPOSED,
               characters={k: dict(name=v[0], accent=v[1]) for k, v in CHAR.items()}, spacing=[4, 8, 12, 16, 24], min_tap_pt=44), open(os.path.join(OUT, 'tokens.json'), 'w', encoding='utf-8'), indent=1, ensure_ascii=False)
json.dump(dict(version='v17-p4-ui-art-1', generator='tools/build_ui_art.py', license='original work for マモ拳; no third-party art, fonts or text baked in', assets=MAN), open(os.path.join(OUT, 'manifest.json'), 'w', encoding='utf-8'), indent=1, ensure_ascii=False)
print('svg', len(MAN))
