#!/usr/bin/env python3
"""マモ拳 P4 UI アート v18（磨き r1）の生成元。v17（ui-art/v17）は読むだけで変更しない。
  python3 exp/fable-3d/ui-art/v18/tools/build_ui_art_v18.py     → ../source/mode-*.svg（編集元。切り抜き PNG を相対参照）、../svg/*.svg（記号・状態装飾）、../tokens.json
そのあと render_outputs.mjs が source/mode-*.svg を透過 PNG にし、manifest.json を書く。
モードの絵: 基準 640x240。文字は焼き込まない。左側（x < 300）は文字を置く場所なので低密度、主役は右側。キャラは全員マーモットで、元の 9 体の GLB から描いた切り抜き（source/cutouts）。"""
import os, json, math, random
from PIL import Image
HERE = os.path.dirname(os.path.abspath(__file__)); OUT = os.path.normpath(os.path.join(HERE, '..')); SRC = os.path.join(OUT, 'source'); SVG = os.path.join(OUT, 'svg'); CUT = os.path.join(SRC, 'cutouts')
os.makedirs(SRC, exist_ok=True); os.makedirs(SVG, exist_ok=True)
V17 = json.load(open(os.path.join(OUT, '..', 'v17', 'tokens.json'), encoding='utf-8'))['colors']      # 色の土台は v17 のまま
T = dict(V17); W, H = 640, 240; f = lambda x: ('%.1f' % x).rstrip('0').rstrip('.')
pts = lambda P: ' '.join('%s,%s' % (f(x), f(y)) for x, y in P)
def ridge(seed, base, amp, n, x0=0, x1=W, sharp=0.6):
    r = random.Random(seed); P = []
    for i in range(n + 1):
        t = i / n; x = x0 + (x1 - x0) * t; y = base - amp * (0.5 * math.sin(t * math.pi * 2.3 + seed) ** 2 + 0.5 * r.random()); P.append((x, y))
        if i < n: P.append((x + (x1 - x0) / n * (0.35 + 0.3 * r.random()), y - amp * sharp * r.random() * 0.5))
    return P
def band(seed, base, amp, n, color, opacity=1, x0=0, x1=W): return '<polygon points="%s" fill="%s" opacity="%s"/>' % (pts(ridge(seed, base, amp, n, x0, x1) + [(x1, H), (x0, H)]), color, opacity)
def paw(cx, cy, s, color, opacity=1, rot=0):
    """マーモットの前足の跡: 掌球 1 つと指球 4 つ、先に短い爪"""
    o = '<g transform="translate(%s %s) rotate(%s) scale(%s)" fill="%s" opacity="%s"><path d="M0 4 C-7 4 -9 11 -5 15 C-2 18 2 18 5 15 C9 11 7 4 0 4Z"/>' % (f(cx), f(cy), rot, s, color, opacity)
    for dx, dy, a in ((-9, 0, -28), (-3.4, -5, -9), (3.4, -5, 9), (9, 0, 28)):
        o += '<g transform="translate(%s %s) rotate(%s)"><ellipse rx="2.6" ry="3.6"/><path d="M-1 -4.4 L0 -8.6 L1 -4.4Z"/></g>' % (dx, dy, a)
    return o + '</g>'
def burst(cx, cy, r1, r2, n, color, rot=0):
    P = [(cx + (r1 if i % 2 == 0 else r2) * math.cos(math.radians(rot + i * 180 / n)), cy + (r1 if i % 2 == 0 else r2) * math.sin(math.radians(rot + i * 180 / n))) for i in range(2 * n)]
    return '<polygon points="%s" fill="%s"/>' % (pts(P), color)
def img(name, x, bottom, h, flip=False, opacity=1, extra=''):
    """切り抜きを、足元の y（bottom）と高さ h で置く。x は中心"""
    w0, h0 = Image.open(os.path.join(CUT, name + '.png')).size; w = h * w0 / h0; t = 'translate(%s %s)' % (f(x - w / 2), f(bottom - h)) if not flip else 'translate(%s %s) scale(-1 1)' % (f(x + w / 2), f(bottom - h))
    return '<image href="cutouts/%s.png" width="%s" height="%s" transform="%s" opacity="%s" %s/>' % (name, f(w), f(h), t, opacity, extra)
def shadow(x, y, rx, ry=5, o=0.32): return '<ellipse cx="%s" cy="%s" rx="%s" ry="%s" fill="#000" opacity="%s"/>' % (f(x), f(y), f(rx), f(ry), o)
MODES = {}
def mode(mid, sky, body, scrim='#0B1512', use='', motif='', W=W, H=H, scrim_stops=((0, .78), (.42, .46), (.62, 0)), scrim_dir=(1, 0)):
    """共通の枠: 角丸の中に空のグラデーション → 中身 → 左側の文字用のうす暗がり（左ほど濃い）"""
    s = '''<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 %d %d" width="%d" height="%d" role="img" aria-label="%s">
<defs><clipPath id="c"><rect width="%d" height="%d" rx="16"/></clipPath>
<linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">%s</linearGradient>
<linearGradient id="scrim" x1="0" y1="0" x2="%s" y2="%s">%s</linearGradient></defs>
<g clip-path="url(#c)"><rect width="%d" height="%d" fill="url(#sky)"/>
%s
<rect width="%d" height="%d" fill="url(#scrim)"/></g>
</svg>
''' % (W, H, W, H, use, W, H, ''.join('<stop offset="%s" stop-color="%s"/>' % (o, c) for o, c in sky), scrim_dir[0], scrim_dir[1], ''.join('<stop offset="%s" stop-color="%s" stop-opacity="%s"/>' % (o, scrim, a) for o, a in scrim_stops), W, H, body.strip('\n'), W, H)
    open(os.path.join(SRC, 'mode-%s.svg' % mid), 'w', encoding='utf-8').write(s); MODES[mid] = dict(use=use, motif=motif, size=[W, H])

# ---------------------------------------------------------------- 対戦: 道場の土俵で 2 体が向き合い、あいだで拳がぶつかる
b = band(3, 150, 60, 7, '#3D5A52', .9) + band(8, 176, 44, 9, '#27413A')
b += '<ellipse cx="478" cy="214" rx="210" ry="30" fill="#B58A56"/><ellipse cx="478" cy="214" rx="210" ry="30" fill="none" stroke="#F0E2BC" stroke-width="5" stroke-dasharray="14 7"/><ellipse cx="478" cy="216" rx="176" ry="22" fill="#C79C66"/>'
for x, c in ((352, T['seal']), (604, '#2F6FA8')):                    # 両陣の小旗（赤と青。形も三角と四角で分ける）
    b += '<rect x="%d" y="52" width="3" height="126" fill="#5C4630"/>' % x + ('<polygon points="%d,54 %d,66 %d,78" fill="%s"/>' % (x + 3, x + 33, x + 3, c) if x < 400 else '<rect x="%d" y="54" width="28" height="22" fill="%s"/>' % (x - 28, c))
b += burst(472, 104, 42, 15, 9, '#FFF3C4', 8) + burst(472, 104, 26, 10, 9, T['action'], 28) + paw(472, 100, 1.05, '#7F2A1E', 1, 0)
b += shadow(412, 214, 62) + shadow(552, 214, 60) + img('vs_moguzo', 404, 218, 132) + img('vs_godan', 556, 219, 150)
mode('vs', ((0, '#F3C36B'), (.55, '#E08E55'), (1, '#6E4A3A')), b, '#1A120C', 'mode illustration: versus', '土俵・両陣の旗・ぶつかる前足の火花')

# 対戦・大きいカード用（480x360、4:3）。文字は左上、ボタンは左下に置く想定で、主役は右下へ大きく
def band2(seed, base, amp, n, color, opacity, x1): return '<polygon points="%s" fill="%s" opacity="%s"/>' % (pts(ridge(seed, base, amp, n, 0, x1) + [(x1, 360), (0, 360)]), color, opacity)
b = band2(3, 214, 70, 6, '#3D5A52', .9, 480) + band2(8, 246, 50, 8, '#27413A', 1, 480)
b += '<ellipse cx="318" cy="326" rx="230" ry="36" fill="#B58A56"/><ellipse cx="318" cy="326" rx="230" ry="36" fill="none" stroke="#F0E2BC" stroke-width="6" stroke-dasharray="16 8"/><ellipse cx="318" cy="329" rx="192" ry="26" fill="#C79C66"/>'
b += '<rect x="196" y="120" width="4" height="170" fill="#5C4630"/><polygon points="200,122 236,136 200,150" fill="%s"/>' % T['seal'] + '<rect x="452" y="96" width="4" height="190" fill="#5C4630"/><rect x="420" y="98" width="32" height="26" fill="#2F6FA8"/>'
b += burst(318, 186, 54, 19, 9, '#FFF3C4', 8) + burst(318, 186, 33, 13, 9, T['action'], 28) + paw(318, 181, 1.35, '#7F2A1E')
b += shadow(238, 326, 76, 7) + shadow(408, 326, 74, 7) + img('vs_moguzo', 228, 332, 168) + img('vs_godan', 412, 334, 192)
mode('vs-large', ((0, '#F3C36B'), (.55, '#E08E55'), (1, '#6E4A3A')), b, '#1A120C', 'mode illustration: versus (large card 4:3)', '土俵・両陣の旗・ぶつかる前足の火花（大きいカード用）', W=480, H=360, scrim_stops=((0, .8), (.38, .5), (.62, 0)), scrim_dir=(.9, .75))

# ---------------------------------------------------------------- 稽古: 朝の道場の庭。巻き藁（稽古柱）へ打ち込む。数え札と竹垣
b = band(5, 140, 54, 7, '#5E8F7C', .8) + band(11, 170, 36, 9, '#3F6B5C')
b += '<rect x="0" y="196" width="640" height="44" fill="#8FA86D"/><rect x="0" y="196" width="640" height="5" fill="#A9C182"/>'
for i in range(15):                                                  # 竹垣
    x = 300 + i * 24; b += '<rect x="%d" y="%d" width="7" height="%d" rx="3" fill="#B9A25E"/><rect x="%d" y="%d" width="7" height="3" fill="#8C7A44"/>' % (x, 150 + (i % 2) * 4, 50 - (i % 2) * 4, x, 172)
b += '<rect x="296" y="160" width="344" height="5" fill="#8C7A44"/><rect x="296" y="184" width="344" height="5" fill="#8C7A44"/>'
# 巻き藁（柱に縄を巻いた打ち込み台）と的
b += '<rect x="548" y="70" width="26" height="150" rx="5" fill="#8A6A45"/><rect x="548" y="70" width="8" height="150" fill="#A98759"/>'
for y in range(92, 150, 9): b += '<rect x="544" y="%d" width="34" height="6" rx="3" fill="#E7D7A4"/><rect x="544" y="%d" width="34" height="2" fill="#B9A570"/>' % (y, y + 4)
b += '<circle cx="561" cy="118" r="21" fill="#F5EFDB" stroke="#B5402E" stroke-width="5"/><circle cx="561" cy="118" r="9" fill="#B5402E"/>'
b += '<path d="M458 96 Q500 70 536 104" fill="none" stroke="#F5EFDB" stroke-width="4" stroke-dasharray="3 9" stroke-linecap="round"/>' + burst(540, 112, 17, 7, 7, '#FFF3C4', 10)
# 数え札（打ち込みの回数を刻む板。文字ではなく刻み）
b += '<g transform="translate(596 58) rotate(6)"><rect width="34" height="50" rx="4" fill="#A98759"/><rect width="34" height="50" rx="4" fill="none" stroke="#5C4630" stroke-width="2"/><circle cx="17" cy="7" r="2.5" fill="#5C4630"/>' + ''.join('<rect x="%d" y="16" width="3" height="24" fill="#3A2A1B"/>' % (6 + i * 5) for i in range(4)) + '<rect x="3" y="26" width="28" height="3" fill="#3A2A1B" transform="rotate(-24 17 28)"/></g>'
b += shadow(452, 218, 50) + img('practice_pisuke', 446, 221, 148)
mode('practice', ((0, '#CDE8D0'), (.6, '#9CCBB0'), (1, '#6FA58D')), b, '#0E1F1A', 'mode illustration: practice', '巻き藁（稽古柱）と的・数え札・竹垣')

# ---------------------------------------------------------------- 連戦（アーケード）: 山道の石段を上へ。段ごとに次の相手、いちばん上に山頂の旗
b = band(2, 130, 80, 6, '#4A4E86', .9)
b += '<polygon points="250,240 640,240 640,40 596,52 548,98 500,98 500,132 440,132 440,170 370,170 370,206 300,206" fill="#2E2F57"/>'      # 石段の山
for x0, y0, x1 in ((300, 206, 370), (370, 170, 440), (440, 132, 500), (500, 98, 548)): b += '<rect x="%d" y="%d" width="%d" height="5" fill="#8E8FC4"/>' % (x0, y0, x1 - x0)
b += '<rect x="604" y="6" width="3" height="48" fill="#E7D7A4"/><polygon points="607,8 636,17 607,27" fill="%s"/>' % T['action']          # 山頂の旗
for k, (x, y) in enumerate(((398, 160), (466, 122), (522, 88))):     # 段の灯ろう。点の数が 1・2・3（何人目か。色ではなく数で分かる）
    b += '<rect x="%d" y="%d" width="12" height="10" rx="2" fill="#FFE9A8"/><rect x="%d" y="%d" width="16" height="3" fill="#3A2A1B"/>' % (x - 6, y - 2, x - 8, y - 5)
    b += ''.join('<circle cx="%s" cy="%d" r="2.2" fill="#FFE9A8"/>' % (f(x - (k) * 3.5 + i * 7), y - 12) for i in range(k + 1))
b += img('arcade_bullet', 418, 172, 62, opacity=1) + img('arcade_yomikage', 480, 134, 70) + img('arcade_takimaru', 566, 100, 84)
b += '<polygon points="250,240 640,240 640,40 596,52 548,98 500,98 500,132 440,132 440,170 370,170 370,206 300,206" fill="#1B1B3A" opacity=".0"/>'
b += shadow(348, 224, 46, 5, .4) + img('arcade_chirka', 346, 228, 118)
b += '<path d="M352 100 L352 78 M343 88 L352 78 L361 88" fill="none" stroke="#FFE9A8" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>'       # 上へ進む矢じるし
mode('arcade', ((0, '#8F7FD6'), (.6, '#5D5AA8'), (1, '#33336A')), b, '#12122A', 'mode illustration: arcade', '山道の石段・段ごとの相手と灯ろう（点の数）・山頂の旗')

# ---------------------------------------------------------------- サバイバル: 夕日の中、ひとりを黒い影が囲む。足もとに倒した数の刻み
b = '<circle cx="486" cy="112" r="92" fill="#FFD27A"/><circle cx="486" cy="112" r="92" fill="none" stroke="#FFE9B0" stroke-width="3" opacity=".7"/>'
b += band(6, 168, 40, 8, '#6B1F1E', .95) + '<rect x="0" y="200" width="640" height="40" fill="#3A1414"/><rect x="0" y="200" width="640" height="4" fill="#8A2E26"/>'
b += img('survival_sil_c', 330, 214, 96, opacity=.92) + img('survival_sil_b', 392, 208, 118) + img('survival_sil_a', 596, 212, 112) + img('survival_sil_d', 610, 232, 74, flip=False, opacity=.96)
for x, y in ((372, 150), (398, 146), (588, 148), (614, 152), (322, 162), (334, 160)): b += '<ellipse cx="%d" cy="%d" rx="3.2" ry="2.2" fill="#FF6B4A"/>' % (x, y)      # 影の目
b += shadow(494, 218, 58, 6, .45) + img('survival_hakuma', 494, 222, 138)
b += '<g fill="#FFD27A">' + ''.join('<rect x="%d" y="226" width="3" height="10" rx="1"/>' % (444 + i * 7) for i in range(4)) + '<rect x="441" y="230" width="30" height="3" rx="1" transform="rotate(-18 456 231)"/>' + ''.join('<rect x="%d" y="226" width="3" height="10" rx="1"/>' % (484 + i * 7) for i in range(3)) + '</g>'
mode('survival', ((0, '#F08A4B'), (.5, '#C4452F'), (1, '#6B1F1E')), b, '#1E0B0A', 'mode illustration: survival', '夕日・囲む影と光る目・倒した数の刻み')

# ---------------------------------------------------------------- 旅（ストーリー）: 朝日へ続く山道を歩く後ろ姿。道しるべと旅札
b = '<circle cx="452" cy="118" r="46" fill="#FFF1B8"/>' + ''.join('<rect x="450" y="40" width="4" height="18" rx="2" fill="#FFF1B8" opacity=".8" transform="rotate(%d 452 118)"/>' % a for a in range(-75, 76, 25))
b += band(4, 150, 70, 6, '#4F8E8C', .9) + band(9, 178, 40, 8, '#2F6A62')
b += '<rect x="0" y="190" width="640" height="50" fill="#5E9B6A"/>'
b += '<path d="M640 240 L430 240 C520 226 560 214 520 200 C486 188 440 186 452 176 C460 170 474 168 470 164 L462 164 C462 168 440 170 432 176 C414 188 470 192 492 202 C520 214 470 226 360 240Z" fill="#E9D9A6"/>'       # 手前から朝日へうねる道
for x, y, r in ((560, 232, 5), (520, 222, 4), (506, 208, 3), (470, 196, 2.5), (446, 184, 2)): b += '<ellipse cx="%d" cy="%d" rx="%s" ry="%s" fill="#C9B77E"/>' % (x, y, f(r * 1.6), f(r * .7))
# 道しるべ（矢印の板 2 枚。文字なし）
b += '<rect x="596" y="118" width="7" height="104" rx="2" fill="#5C4630"/><polygon points="570,128 622,128 634,138 622,148 570,148" fill="#A98759" stroke="#5C4630" stroke-width="2"/><polygon points="630,156 578,156 566,166 578,176 630,176" fill="#8A6A45" stroke="#5C4630" stroke-width="2"/>'
# 旅札（ひも付きの札。拳の印）
b += '<g transform="translate(352 44) rotate(-8)"><path d="M17 -14 Q22 -30 40 -34" fill="none" stroke="#B5402E" stroke-width="3" stroke-linecap="round"/><path d="M0 8 L8 0 L26 0 L34 8 L34 50 L0 50Z" fill="#EFE6CC" stroke="#5C4630" stroke-width="2"/><circle cx="17" cy="9" r="3.4" fill="#5C4630"/>' + paw(17, 28, .78, '#B5402E') + '</g>'
b += shadow(520, 226, 40, 5, .3) + img('story_moguzo', 520, 230, 120)
b += paw(410, 228, .5, '#C9B77E', .9, -20) + paw(388, 236, .5, '#C9B77E', .9, 10)
mode('story', ((0, '#F7C98B'), (.55, '#F2A76B'), (1, '#8FC0A8')), b, '#10201D', 'mode illustration: story (journey)', '朝日へ続く道・道しるべ・旅札・足あと')

# ================================================================ 小さな記号（24x24、線は currentColor。色ではなく形で意味が分かる）
ICONS = {}
def icon(name, body, use, meaning):
    s = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" role="img" aria-label="%s" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">\n%s\n</svg>\n' % (use, body)
    open(os.path.join(SVG, name + '.svg'), 'w', encoding='utf-8').write(s); ICONS[name] = dict(use=use, meaning=meaning)
PAW24 = '<path d="M12 12.5c-3.6 0-4.8 3.6-2.7 5.7 1.5 1.5 3.9 1.5 5.4 0 2.1-2.1.9-5.7-2.7-5.7z" fill="currentColor" stroke="none"/><ellipse cx="6.3" cy="10.6" rx="1.5" ry="2.1" transform="rotate(-28 6.3 10.6)" fill="currentColor" stroke="none"/><ellipse cx="9.8" cy="7.6" rx="1.5" ry="2.1" transform="rotate(-9 9.8 7.6)" fill="currentColor" stroke="none"/><ellipse cx="14.2" cy="7.6" rx="1.5" ry="2.1" transform="rotate(9 14.2 7.6)" fill="currentColor" stroke="none"/><ellipse cx="17.7" cy="10.6" rx="1.5" ry="2.1" transform="rotate(28 17.7 10.6)" fill="currentColor" stroke="none"/>'
icon('sym-select', '<path d="M3 12h8M8 8.5l3.5 3.5L8 15.5"/><g transform="translate(9.5 3.4) scale(.62)">%s</g>' % PAW24, 'symbol: select / move focus', '選択（前足が指し示す）')
icon('sym-confirm', '<circle cx="12" cy="12" r="9.2"/><g transform="translate(2.6 1.6) scale(.78)">%s</g>' % PAW24, 'symbol: confirm', '決定（前足の判を押す＝丸い印）')
icon('sym-back', '<path d="M9 6.5L4 11l5 4.5"/><path d="M4 11h9.5a5.5 5.5 0 0 1 0 11H9"/>', 'symbol: back', '戻る（引き返す道。尾のように巻いた矢印）')
icon('sym-disabled', '<rect x="4" y="5" width="16" height="14" rx="2.5"/><path d="M4.8 18.2L19.2 5.8"/><path d="M9 3.5v3M15 3.5v3" stroke-width="1.6"/>', 'symbol: unavailable', '使用不可（縄で封じた札。斜めの線）')
icon('sym-save', '<path d="M6.5 8.2L10 4.6h4l3.5 3.6V20h-11z"/><circle cx="12" cy="8.3" r="1.2" fill="currentColor" stroke="none"/><path d="M9.2 14.2l2 2 3.6-4"/><path d="M12 4.6V2.2" stroke-width="1.6"/>', 'symbol: saved', '保存（旅札に刻みが入った印）')
icon('sym-paw', PAW24, 'symbol: marmot forepaw', '前足（飾り・カーソル用）')

# ================================================================ 状態の装飾（9 スライスで伸ばせる枠。色＋形の両方で区別する）
STATES = {}
def state(name, w, h, body, use, how, slice_):
    s = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 %d %d" width="%d" height="%d" role="img" aria-label="%s" fill="none">\n%s\n</svg>\n' % (w, h, w, h, use, body)
    open(os.path.join(SVG, name + '.svg'), 'w', encoding='utf-8').write(s); STATES[name] = dict(use=use, distinguishBy=how, viewBox=[0, 0, w, h], slice=slice_)
A, S_ = 'var(--mk-action,%s)' % T['action'], 'var(--mk-seal,%s)' % T['seal']
def corner(x, y, sx, sy): return '<path d="M%d %d V%d Q%d %d %d %d H%d" stroke="%s" stroke-width="4.5" stroke-linecap="round" fill="none"/>' % (x, y + sy * 20, y + sy * 9, x, y, x + sx * 9, y, x + sx * 20, A)
# focus: 四隅の太い角金具（枠線は引かない。いま指している場所）。前足カーソル sym-paw を UI 側で左外に添える
state('state-focus', 96, 64, corner(4, 4, 1, 1) + corner(92, 4, -1, 1) + corner(4, 60, 1, -1) + corner(92, 60, -1, -1),
      'state decoration: focus', '四隅の角金具（辺の中央は空く）＋左に前足カーソル sym-paw', dict(top=26, right=26, bottom=26, left=26))
# selected: 全周の二重線 + 右上の丸い判（決定済み）
state('state-selected', 96, 64, '<rect x="3" y="3" width="90" height="58" rx="10" stroke="%s" stroke-width="3"/><rect x="8" y="8" width="80" height="48" rx="6" stroke="%s" stroke-width="1.5"/><circle cx="80" cy="16" r="11" fill="%s"/><path d="M74.5 16.2l3.6 3.6 7-7.6" stroke="#FFF6DC" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>' % (A, A, S_),
      'state decoration: selected', '全周の二重線と右上の丸い判（チェック入り）', dict(top=28, right=30, bottom=14, left=14))
# pressed: 内側に沈む影（下と右の内側が明るく、上と左が暗い）
state('state-pressed', 96, 64, '<rect x="3" y="3" width="90" height="58" rx="10" stroke="#000" stroke-opacity=".45" stroke-width="3"/><path d="M12 6h72M6 12v40" stroke="#000" stroke-opacity=".5" stroke-width="5" stroke-linecap="round"/><path d="M12 59h72M91 12v40" stroke="#FFF6DC" stroke-opacity=".35" stroke-width="2" stroke-linecap="round"/>',
      'state decoration: pressed', '上と左に濃い内影（へこんで見える）', dict(top=14, right=14, bottom=14, left=14))
# disabled: 破線の枠（辺は border-image-repeat: round でくり返す）と、右上の「横棒の丸」。selected の判（チェック）と形が違う
L_ = 'var(--mk-line,%s)' % T['line']
state('state-disabled', 96, 64, '<rect x="3" y="3" width="90" height="58" rx="10" stroke="%s" stroke-width="2.5" stroke-dasharray="6 6"/><circle cx="80" cy="16" r="11" fill="var(--mk-panel,%s)" stroke="%s" stroke-width="2.5"/><path d="M74.5 16h11" stroke="%s" stroke-width="3" stroke-linecap="round"/>' % (L_, T['panel'], L_, L_),
      'state decoration: disabled', '破線の枠と右上の横棒の丸（線が点線・印が「−」）。絵は不透明度と彩度を落とす', dict(top=28, right=30, bottom=14, left=14))
# saved: 下辺に札のひもと小さな判（保存済みの印。selected と違い下に付く）
state('state-saved', 96, 64, '<path d="M10 60h76" stroke="%s" stroke-width="3" stroke-linecap="round"/><path d="M70 60v-10l5-5h8l5 5v10" fill="var(--mk-paper,%s)" stroke="%s" stroke-width="2" stroke-linejoin="round"/><circle cx="79" cy="49" r="1.5" fill="%s"/><path d="M75.5 55l2.4 2.2 4.4-4.6" stroke="%s" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>' % (A, T['paper'], T['woodDark'], T['woodDark'], S_),
      'state decoration: saved', '下辺の線と右下の小さな旅札（刻み入り）', dict(top=10, right=30, bottom=22, left=12))

# ================================================================ トークン（v17 を引き継ぎ、v18 で足す分）
tokens = dict(version='v18-p4-ui-polish-r1', status='proposal', basedOn='ui-art/v17/tokens.json', css_prefix='--mk-', colors=T,
    modes=dict(vs=dict(accent='#F1C66C', sky='#E08E55', label='対戦'), practice=dict(accent='#6FD0A0', sky='#9CCBB0', label='稽古'), arcade=dict(accent='#A79BEA', sky='#5D5AA8', label='連戦'), survival=dict(accent='#FA8976', sky='#C4452F', label='サバイバル'), story=dict(accent='#F2A76B', sky='#8FC0A8', label='旅')),
    modeArt=dict(base=[640, 240], large=dict(mode='vs', base=[480, 360], textSafe=dict(x=18, y=16, width=210, height=120), buttonSafe=dict(x=14, y=292, width=160, height=54), note='大きい対戦カード用（4:3）。文字は左上、ボタンは左下'), narrowCards='幅が狭いカード（9:5 前後）では右寄せで切り、文字は下辺に置いて下から上への暗いグラデーションを重ねる（顔は上 6 割にある）', minLegible=[180, 80], cornerRadius=16, textSafe=dict(x=20, y=18, width=280, height=204, note='この範囲（左側）は文字を置く場所。絵は低密度で、うす暗がりを重ねてある。文字色は colors.text を想定'), hero=dict(x=310, width=330, note='主役はこの範囲（右側）'), crop='縦横比を変えるときは右寄せで切る（object-position: right center）。左が先に切れても意味が残る'),
    type=dict(note='文字は素材に焼き込んでいない。目安の大きさ（720x320 の画面で）', cardTitlePx=22, cardSubPx=13, minBodyPx=12, hudSubMinPx=11),
    spacing=dict(cardPadding=14, cardGap=10, touchMin=44, focusOutset=4),
    states=dict(focus='state-focus.svg を枠の外側 4px に重ねる + 1.03 倍 + 左外に sym-paw', selected='state-selected.svg を重ねる（判が右上）', pressed='state-pressed.svg + 0.97 倍', disabled='絵の彩度と明るさを落とし state-disabled.svg を重ねる（辺は border-image-repeat: round）', saved='state-saved.svg を下辺に重ねる'))
json.dump(tokens, open(os.path.join(OUT, 'tokens.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
json.dump(dict(modes=MODES, icons=ICONS, states=STATES), open(os.path.join(SRC, 'build_index.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print('modes', len(MODES), 'icons', len(ICONS), 'states', len(STATES))
