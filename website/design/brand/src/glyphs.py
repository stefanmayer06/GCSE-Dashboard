"""Shape text with HarfBuzz (real kerning) and outline it from Unbounded."""
import io
import os
from functools import lru_cache

import uharfbuzz as hb
from fontTools.pens.boundsPen import BoundsPen
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont

SRC = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', '..', 'selector', 'fonts',
                   'unbounded-latin-wght-normal.woff2')


@lru_cache(maxsize=None)
def _instance(wght):
    font = instantiateVariableFont(TTFont(SRC), {'wght': wght})
    font.flavor = None
    buf = io.BytesIO()
    font.save(buf)
    data = buf.getvalue()
    return TTFont(io.BytesIO(data)), data


def shape(text, wght=800, track=0):
    """Return (path_d, width, bounds) for text on a y-down baseline at 0."""
    font, data = _instance(wght)
    face = hb.Face(data)
    hbfont = hb.Font(face)
    buf = hb.Buffer()
    buf.add_str(text)
    buf.guess_segment_properties()
    hb.shape(hbfont, buf, {'kern': True, 'liga': False})
    gs = font.getGlyphSet()
    order = font.getGlyphOrder()
    pen = SVGPathPen(gs)
    bpen = BoundsPen(gs)
    x = 0
    n = len(buf.glyph_infos)
    for i, (info, pos) in enumerate(zip(buf.glyph_infos, buf.glyph_positions)):
        name = order[info.codepoint]
        m = (1, 0, 0, -1, x + pos.x_offset, -pos.y_offset)
        gs[name].draw(TransformPen(pen, m))
        gs[name].draw(TransformPen(bpen, (1, 0, 0, 1, x + pos.x_offset, pos.y_offset)))
        x += pos.x_advance + (track if i < n - 1 else 0)
    xmin, ymin, xmax, ymax = bpen.bounds
    # bounds in y-down space
    return pen.getCommands(), x, (xmin, -ymax, xmax, -ymin)
