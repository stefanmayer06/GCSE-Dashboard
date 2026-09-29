"""Build the Clevolta brand assets and the brand-kit page.

Run from website/: python3 design/brand/src/brand.py
Needs: pip install fonttools brotli uharfbuzz
Writes the SVGs to design/brand/ and the page to design/brand/brand-kit.html.
The wordmark is Unbounded ExtraBold (OFL) from selector/fonts, shaped with
HarfBuzz so the font's own kerning applies, then converted to outlines.
"""
import html
import math
import os
import sys

from glyphs import shape

SRC_DIR = os.path.dirname(os.path.abspath(__file__))
OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.dirname(SRC_DIR)
os.makedirs(OUT, exist_ok=True)

NAME = 'Clevolta'   # clever + Volta
WORD = NAME.lower()

NIGHT = '#191b30'
NIGHT_INK = '#f2f3ff'
PAPER = '#f2f3fa'
VOLT = '#c3f53c'
BLUE = '#3d6bff'
TANG = '#ff7a2e'
PURP = '#9b4dff'
CORAL = '#ff5566'
# Brighter dark-theme hues for sub-brand words set on night.
BLUE_ON_NIGHT = '#6f93ff'
TANG_ON_NIGHT = '#ff9d61'

R = 38.0          # quarter radius in mark units (viewBox -50..50)
VR = R * 0.62     # the volt quarter while it is still being built
SW = 3.2          # night outline, same weight as topic emblems
QUARTERS = [(0, BLUE), (1, TANG), (2, PURP)]   # Shapez order: TR, BR, BL (TL is volt)
DIAG = {0: (1, -1), 1: (1, 1), 2: (-1, 1), 3: (-1, -1)}


def f(n):
    s = f'{n:.2f}'.rstrip('0').rstrip('.')
    return '0' if s == '-0' else s


def qd(r):
    """Circle quarter in the top-right position."""
    return f'M0 0V{f(-r)}A{f(r)} {f(r)} 0 0 1 {f(r)} 0Z'


def quarter(idx, fill, r=R, line=NIGHT, sw=SW, cls=None, dash=None, stroke=None):
    attrs = [f'd="{qd(r)}"', f'transform="rotate({idx * 90})"', f'fill="{fill}"']
    attrs.append(f'stroke="{stroke or line}" stroke-width="{f(sw)}" stroke-linejoin="round"')
    if dash:
        attrs.append(f'stroke-dasharray="{dash}"')
    path = f'<path {" ".join(attrs)}/>'
    return f'<g class="{cls}">{path}</g>' if cls else path


def disc(state='building', line=NIGHT, vq_class=None, volt=VOLT, hues=None, ghost='rgba(25,27,48,0.07)'):
    """The Clevolta disc in mark units, centred on 0,0."""
    hues = hues or QUARTERS
    if state == 'blueprint':
        body = f'<circle r="{f(R + 6)}" fill="{ghost}"/>'
        body += ''.join(quarter(i, 'none', stroke=c, sw=2.6, dash='5 4') for i, c in hues)
        body += quarter(3, 'none', stroke=volt if volt != VOLT else '#8fb31f', sw=2.6, dash='5 4')
        return body
    body = ''.join(quarter(i, c, line=line) for i, c in hues)
    vr = R if state == 'closed' else VR
    body += quarter(3, volt, r=vr, line=line, cls=vq_class)
    if state == 'closed':
        body = (f'<circle r="{f(R + 8)}" fill="none" stroke="{VOLT}" stroke-width="3" '
                f'stroke-dasharray="6 5" stroke-linecap="round"/>') + body
    return body


def mono_disc(color, state='building'):
    """Single-colour disc: quarters separated by gaps instead of an outline."""
    g = 2.2
    parts = []
    for i in range(4):
        r = VR if (i == 3 and state == 'building') else R
        dx, dy = DIAG[i]
        parts.append(f'<path d="{qd(r)}" transform="translate({f(dx * g)} {f(dy * g)}) rotate({i * 90})" fill="{color}"/>')
    return ''.join(parts)


def svg(view, body, width=None, height=None, title=None, cls=None, extra=''):
    size = ''
    if width:
        size += f' width="{f(width)}"'
    if height:
        size += f' height="{f(height)}"'
    t = f'<title>{html.escape(title)}</title>' if title else ''
    role = ' role="img"' if title else ' aria-hidden="true"'
    c = f' class="{cls}"' if cls else ''
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{view}"{size}{role}{c}{extra}>{t}{body}</svg>'


def mark_svg(state='building', size=None, title=NAME, line=NIGHT, vq_class=None, pad=10, cls=None):
    ext = R + (8 + 2 if state == 'closed' else 6 if state == 'blueprint' else SW / 2) + pad
    return svg(f'{f(-ext)} {f(-ext)} {f(ext * 2)} {f(ext * 2)}', disc(state, line, vq_class), size, size, title, cls)


# ---------------------------------------------------------------- wordmark
WM_WGHT = 800
WM_TRACK = -4
WM_D, WM_W, WM_B = shape(WORD, WM_WGHT, WM_TRACK)
ASC = -WM_B[1]            # top of the l (770)


def wordmark_group(ink, x=0, y=0, k=1.0):
    return f'<path d="{WM_D}" fill="{ink}" transform="translate({f(x)} {f(y)}) scale({f(k)})"/>'


def wordmark_svg(ink, height=None, title=NAME):
    x0, y0, x1, y1 = WM_B
    pad = 40
    vb = f'{f(x0 - pad)} {f(y0 - pad)} {f(x1 - x0 + pad * 2)} {f(y1 - y0 + pad * 2)}'
    return svg(vb, wordmark_group(ink), height=height, title=title)


def lockup(ink, sub=None, sub_ink=None, height=None, title=NAME):
    """Disc + wordmark on one line. Font units, baseline at y=0."""
    top, bottom = -ASC - 6, 17          # disc spans cap top to overshoot
    d = bottom - top
    k = d / (2 * (R + SW / 2))
    cx, cy = d / 2, (top + bottom) / 2
    gap = d * 0.30
    x = d + gap - WM_B[0]
    body = f'<g transform="translate({f(cx)} {f(cy)}) scale({f(k)})">{disc("building")}</g>'
    body += wordmark_group(ink, x)
    right = x + WM_B[2]
    if sub:
        sd, sw, sb = shape(sub, 400, 0)
        sx = right + 290 - sb[0]
        body += f'<path d="{sd}" fill="{sub_ink}" transform="translate({f(sx)} 0)"/>'
        right = sx + sb[2]
    pad = 60
    vb = f'{f(-pad)} {f(top - pad)} {f(right + pad * 2)} {f(d + pad * 2)}'
    return svg(vb, body, height=height, title=title + (f' {sub}' if sub else ''))


def stacked(ink, height=None):
    d = max(1000, 0.3 * (WM_B[2] - WM_B[0]))   # disc keeps pace with the word
    k = d / (2 * (R + SW / 2))
    gap = 230
    ww = WM_B[2] - WM_B[0]
    wx = -ww / 2 - WM_B[0]
    wy = d / 2 + gap + ASC
    body = f'<g transform="scale({f(k)})">{disc("building")}</g>' + wordmark_group(ink, wx, wy)
    pad = 60
    w = max(d, ww) + pad * 2
    top = -d / 2 - pad
    h = d + gap + ASC + 17 + pad * 2
    return svg(f'{f(-w / 2)} {f(top)} {f(w)} {f(h)}', body, height=height, title=NAME)


# ---------------------------------------------------------------- app icons
OPT = -0.05 * R   # optical centring: the small volt quarter shifts the visual mass


def icon(kind='night', size=None, title=f'{NAME} app icon'):
    k = 600 / (2 * (R + SW / 2))
    if kind == 'night':
        bg = f'<rect width="1024" height="1024" rx="230" fill="{NIGHT}"/>'
        art = disc('building')
    elif kind == 'paper':
        bg = f'<rect width="1024" height="1024" rx="230" fill="{PAPER}"/>'
        art = disc('building')
    elif kind == 'adaptive':
        bg = f'<circle cx="512" cy="512" r="512" fill="{NIGHT}"/>'
        k = 500 / (2 * (R + SW / 2))
        art = disc('building')
    else:  # monochrome / themed
        bg = f'<rect width="1024" height="1024" rx="230" fill="#e1e4f5"/>'
        art = mono_disc(NIGHT)
    body = bg + f'<g transform="translate({f(512 + OPT * k)} {f(512 + OPT * k)}) scale({f(k)})">{art}</g>'
    return svg('0 0 1024 1024', body, size, size, title)


def favicon():
    k = 25 / (2 * (R + SW / 2))
    body = (f'<rect width="32" height="32" rx="8" fill="{NIGHT}"/>'
            f'<g transform="translate({f(16 + OPT * k)} {f(16 + OPT * k)}) scale({f(k)})">{disc("building")}</g>')
    return svg('0 0 32 32', body, title=NAME)


def android_foreground():
    # 108dp canvas, 66dp safe zone: art stays inside the inner 72%.
    k = 560 / (2 * (R + SW / 2))
    body = f'<g transform="translate({f(512 + OPT * k)} {f(512 + OPT * k)}) scale({f(k)})">{disc("building")}</g>'
    return svg('0 0 1024 1024', body, 1024, 1024, NAME)


def android_monochrome():
    k = 560 / (2 * (R + SW / 2))
    body = f'<g transform="translate({f(512 + OPT * k)} {f(512 + OPT * k)}) scale({f(k)})">{mono_disc("#000000")}</g>'
    return svg('0 0 1024 1024', body, 1024, 1024, NAME)


# ---------------------------------------------------------------- page-only art
def construct():
    guides = (
        f'<circle r="{f(R)}" fill="none" stroke="var(--line-strong)" stroke-width="0.8" stroke-dasharray="3 3"/>'
        f'<circle r="{f(VR)}" fill="none" stroke="var(--line-strong)" stroke-width="0.6" stroke-dasharray="2 3"/>'
        f'<path d="M-52 0H52M0 -52V52" stroke="var(--line-strong)" stroke-width="0.6"/>'
    )
    labels = (
        f'<g font-family="Atkinson Hyperlegible Mono, ui-monospace, monospace" font-size="4.2" fill="var(--muted)">'
        f'<text x="{f(R * 0.72)}" y="{f(-R * 0.72 - 3)}">R</text>'
        f'<text x="-50" y="-44">0.62 R</text>'
        f'<path d="M-40 -42.5L{f(-VR * 0.62)} {f(-VR * 0.72)}" stroke="var(--muted)" stroke-width="0.5"/>'
        f'</g>'
    )
    return svg('-56 -56 112 112', guides + disc('building', vq_class='vq') + labels,
               title=f'Construction of the {NAME} disc')


def meaning_icons():
    L = f'stroke="{NIGHT}" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"'
    pts = []
    for i in range(10):
        r = 18 if i % 2 == 0 else 7.6
        t = math.radians(-90 + i * 36)
        pts.append(f'{f(r * math.cos(t))} {f(r * math.sin(t) + 1.5)}')
    clever = svg('-24 -24 48 48', f'<path d="M{"L".join(pts)}Z" fill="#f5a300" {L}/>')
    pile = ''
    for i, c in enumerate([PURP, TANG, VOLT]):
        y = 11 - i * 9
        pile += (f'<path d="M-17 {f(y)}v4a17 7 0 0 0 34 0v-4" fill="{c}" {L}/>'
                 f'<ellipse cx="0" cy="{f(y)}" rx="17" ry="7" fill="{c}" {L}/>')
    pile = svg('-24 -24 48 48', pile)
    turn = svg('-24 -24 48 48',
               f'<path d="{qd(15)}" transform="translate(-4 4)" fill="{BLUE}" {L}/>'
               f'<path d="M-17 4A17 17 0 0 1 4 -16" fill="none" {L}/>'
               f'<path d="M-1 -20l6 4-5 5" fill="none" {L}/>')
    again = svg('-24 -24 48 48',
                f'<path d="M15 -9A17 17 0 1 0 17 4" fill="none" {L}/>'
                f'<path d="M9 -12l7 3 1-8" fill="none" {L}/>'
                f'<path d="{qd(10)}" transform="translate(-5 5)" fill="{VOLT}" {L}/>')
    return clever, pile, turn, again


def sizes(line_bg):
    out = []
    for s in (16, 24, 32, 48, 64, 96):
        out.append(f'<figure>{mark_svg(size=s, title=None, pad=2)}<figcaption>{s}px</figcaption></figure>')
    return ''.join(out)


def icons_block():
    rows = [('night', 'iOS', 'Night, the default'), ('adaptive', 'Android adaptive', 'Circle mask, safe zone'),
            ('paper', 'Paper', 'Light contexts'), ('mono', 'Themed', 'Monochrome, Android 13+')]
    return ''.join(f'<figure>{icon(k, title=f"{a} icon")}<figcaption><b>{a}</b>{b}</figcaption></figure>'
                   for k, a, b in rows)


def donts():
    items = []
    rot = f'<g transform="rotate(90)">{disc()}</g>'
    items.append((rot, 'Rotate it: volt sits top left'))
    items.append((disc(volt=CORAL), 'Recolour a quarter'))
    bolt = disc() + (f'<path d="M4 -30L-10 4h10l-6 26 18-36H6l8-24z" fill="{VOLT}" stroke="{NIGHT}" '
                     f'stroke-width="2.4" stroke-linejoin="round"/>')
    items.append((bolt, 'Add a lightning bolt'))
    items.append((f'<g transform="scale(1.3 0.78)">{disc()}</g>', 'Stretch or squash'))
    return ''.join(f'<figure>{svg("-52 -52 104 104", b, title=None)}<figcaption>{html.escape(c)}</figcaption></figure>'
                   for b, c in items)


def swatches():
    rows = [(NIGHT, 'Night', 'Stage, outline, ink', '#191B30'), (VOLT, 'Volt', 'Go and reward only', '#C3F53C'),
            (BLUE, 'Foundation blue', 'Maths Foundation', '#3D6BFF'), (PURP, 'Higher purple', 'Maths Higher', '#9B4DFF'),
            (TANG, 'English tangerine', 'English Language', '#FF7A2E'), (PAPER, 'Paper', 'Light ground', '#F2F3FA')]
    return ''.join(f'<div class="swatch"><div class="chipc" style="background:{c}"></div><div class="meta">'
                   f'<b>{n}</b><span>{h} · {r}</span></div></div>' for c, n, r, h in rows)


SOURCES = [
    ('Medly: Best GCSE revision apps 2026', 'https://www.medlyai.com/uk/blog/best_gcse_revision_apps_2026'),
    ('Lightbulb Learning: Best GCSE revision apps and websites', 'https://lightbulblearning.co/guides/best-gcse-revision-apps-and-websites'),
    ('UpGrades: Best GCSE revision apps for 2026', 'https://www.upgrades.app/blog/best-gcse-revision-apps/'),
    ('The Access Group: GCSEPod versus other revision resources', 'https://www.theaccessgroup.com/en-gb/education/software/education-resources/gcse/gcsepod-versus-gcse-revision-resources/'),
    ('Sparx Maths', 'https://sparxmaths.com/'),
    ('Seneca homepage (visual review)', 'https://senecalearning.com/en-GB/'),
    ('Save My Exams homepage (visual review)', 'https://www.savemyexams.com/'),
    ('Creative Bloq: Duolingo Feather Bold', 'https://www.creativebloq.com/news/feather-bold'),
    ('Kahoot! brand guidelines', 'https://kahoot.com/library/kahoot-logo/'),
    ('Making Mimo: Breathing life into Mimo’s designs', 'https://medium.com/getmimo/breathing-life-into-mimos-designs-fb1a162e22a0'),
    ('Emofest UK', 'https://www.emofest.co.uk/'),
    ('Wikipedia: Voltaic pile', 'https://en.wikipedia.org/wiki/Voltaic_pile'),
    ('Poetry Foundation: Volta', 'https://www.poetryfoundation.org/education/glossary/volta'),
    ('App Store: Volta (indeHealth)', 'https://apps.apple.com/us/app/volta/id6547832204'),
    ('Google Play: Volta (tutoring management)', 'https://play.google.com/store/apps/details?id=co.penny.pujwh'),
    ('App Store: Volta AI', 'https://apps.apple.com/us/app/volta-ai/id1628105999'),
    ('App Store: Volta Live', 'https://apps.apple.com/us/app/volta-live/id6769760087'),
    ('App Store: Volta EV', 'https://apps.apple.com/us/app/volta-ev/id6754547857'),
    ('Google Play: Volta Driver', 'https://play.google.com/store/apps/details?id=com.yourvolta.driver&hl=en_US'),
    ('Wikipedia: Clever (company), owned by Kahoot', 'https://en.wikipedia.org/wiki/Clever_(company)'),
    ('Y Combinator: Cleva', 'https://www.ycombinator.com/companies/cleva'),
    ('Les Clés de Volta', 'https://www.lesclesdevolta.fr/'),
    ('Hager: Volta replacement key', 'https://hager.com/intl-fr/produits/informations/vz304n-cle-de-rechange-volta-fermet-vz302n'),
    ('Apple iTunes Search API (App Store lookups, GB and US)', 'https://itunes.apple.com/search?term=clevolta&entity=software&country=gb'),
    ('Google Play search: clevolta', 'https://play.google.com/store/search?q=clevolta&c=apps'),
    ('Companies House search: clevolta', 'https://find-and-update.company-information.service.gov.uk/search/companies?q=clevolta'),
    ('App Store: Revvo', 'https://apps.apple.com/us/app/revvo/id6775417070'),
    ('App Store: Piply AI', 'https://apps.apple.com/us/app/piply-ai-study-exam-prep/id6759463981'),
    ('Pippit education tools', 'https://www.pippit.ai/tools/education'),
    ('OECD PILA', 'https://pilaproject.org/'),
    ('App Store: Quadoo', 'https://apps.apple.com/us/app/quadoo/id6756758644'),
    ('Companies House: Volta Tech Ltd', 'https://find-and-update.company-information.service.gov.uk/company/12531643'),
    ('GOV.UK: Search for a trade mark', 'https://www.gov.uk/search-for-trademark'),
    ('RDAP domain lookups via rdap.org', 'https://rdap.org/'),
]


def page():
    tpl = open(os.path.join(SRC_DIR, 'brand-template.html')).read()
    c, p, t, a = meaning_icons()
    rail = mark_svg(size=36, title=None, pad=1)
    fills = {
        'LOCKUP_NIGHT': lockup(NIGHT_INK),
        'LOCKUP_NIGHT_M': lockup(NIGHT_INK),
        'LOCKUP_PAPER_M': lockup(NIGHT),
        'STACKED_NIGHT': stacked(NIGHT_INK, height=200),
        'WORDMARK_VOLT': wordmark_svg(NIGHT, height=90),
        'SUB_MATHS': lockup(NIGHT_INK, 'maths', BLUE_ON_NIGHT),
        'SUB_ENGLISH': lockup(NIGHT_INK, 'english', TANG_ON_NIGHT),
        'ICON_CLEVER': c, 'ICON_PILE': p, 'ICON_TURN': t, 'ICON_AGAIN': a,
        'MARK_CONSTRUCT': construct(),
        'STATE_BLUEPRINT': mark_svg('blueprint', title='Blueprint state'),
        'STATE_BUILDING': mark_svg('building', title='Building state'),
        'STATE_CLOSED': mark_svg('closed', title='Closed state'),
        'SIZES_PAPER': sizes(PAPER),
        'SIZES_NIGHT': sizes(NIGHT),
        'ICONS': icons_block(),
        'RAIL_MARK': rail,
        'ICON_SMALL': icon('night', title=NAME),
        'AVATAR': svg('0 0 100 100', f'<circle cx="50" cy="50" r="50" fill="{NIGHT}"/>'
                      f'<g transform="translate({f(50 + OPT * 0.72)} {f(50 + OPT * 0.72)}) scale(0.72)">{disc()}</g>'),
        'DONTS': donts(),
        'SWATCHES': swatches(),
        'SOURCES': ''.join(f'<li><a href="{u}">{html.escape(n)}</a></li>' for n, u in SOURCES),
    }
    for k, val in fills.items():
        tpl = tpl.replace('{{' + k + '}}', val)
    assert '{{' not in tpl, [l for l in tpl.splitlines() if '{{' in l][:3]
    return tpl


def write(name, content):
    with open(os.path.join(OUT, name), 'w') as fh:
        fh.write(content + '\n')


if __name__ == '__main__':
    write(f'{WORD}-mark.svg', mark_svg('building', pad=2))
    write(f'{WORD}-mark-closed.svg', mark_svg('closed', pad=2))
    write(f'{WORD}-mark-blueprint.svg', mark_svg('blueprint', pad=2))
    write(f'{WORD}-mark-mono.svg', svg('-42 -42 84 84', mono_disc('#191b30'), title=NAME))
    write(f'{WORD}-wordmark.svg', wordmark_svg(NIGHT))
    write(f'{WORD}-wordmark-light.svg', wordmark_svg(NIGHT_INK))
    write(f'{WORD}-lockup.svg', lockup(NIGHT))
    write(f'{WORD}-lockup-light.svg', lockup(NIGHT_INK))
    write(f'{WORD}-lockup-stacked.svg', stacked(NIGHT))
    write(f'{WORD}-lockup-stacked-light.svg', stacked(NIGHT_INK))
    write(f'{WORD}-maths-lockup-light.svg', lockup(NIGHT_INK, 'maths', BLUE_ON_NIGHT))
    write(f'{WORD}-english-lockup-light.svg', lockup(NIGHT_INK, 'english', TANG_ON_NIGHT))
    write(f'{WORD}-maths-lockup.svg', lockup(NIGHT, 'maths', BLUE))
    write(f'{WORD}-english-lockup.svg', lockup(NIGHT, 'english', '#e0600f'))
    write(f'{WORD}-app-icon.svg', icon('night', 1024))
    write(f'{WORD}-app-icon-paper.svg', icon('paper', 1024))
    write(f'{WORD}-app-icon-mono.svg', icon('mono', 1024))
    write(f'{WORD}-android-foreground.svg', android_foreground())
    write(f'{WORD}-android-monochrome.svg', android_monochrome())
    write(f'{WORD}-favicon.svg', favicon())
    with open(os.path.join(OUT, 'brand-kit.html'), 'w') as fh:
        fh.write(page())
    print('wrote', len([n for n in os.listdir(OUT) if n.endswith('.svg')]), 'SVGs and brand-kit.html to', OUT)
