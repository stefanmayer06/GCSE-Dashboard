# Volta brand proposal

Volta is the proposed name and identity for the product now called GCSE
Study Desk. It is a proposal only: the product, store listings and legal pages
still use the current name until the trade-mark search below is done and the
owner approves the rename.

`brand-kit.html` shows the full kit with the market research behind it. The
SVGs in this folder are the source files. `src/brand.py` regenerates all of
them (see [Regenerating](#regenerating)).

## The name

**Volta** (say it VOL-tuh). Four meanings that the app already contains:

| Meaning | Where it lives in the product |
| --- | --- |
| Volt | Volt lime is the one reward colour: the go button, stars, mastered tiles |
| The voltaic pile | Volta's 1800 battery was a stack of discs; emblems stack layers from marked answers |
| The volta | The turn in a sonnet, a GCSE English term; a fixed mistake is a turning point |
| *Una volta* | Italian for "one more time"; mistakes return after 1, 3, 7 and 21 days |

Naming in use:

- Master brand: **Volta**. App stores: **Volta: GCSE Revision** (plain "Volta"
  is taken on the App Store).
- Subjects: **Volta Maths** (Foundation and Higher are tiers, not brands) and
  **Volta English**. These replace MathsMate and EnglishMate.
- Mascot: **Pip, your Volta guide**. Pip is unchanged.
- Lines: "Fix what you missed." (primary), "One more go.", "Close the loop."

The copy rules in `PRODUCT.md` still apply: describe content as AQA-style,
never imply AQA endorsement, and never promise grades.

## The mark: the Volta disc

Four circle quarters in the Shapez order used by every topic emblem
(`clients/shared/circuit/Emblem.jsx`):

| Quarter | Colour | Meaning |
| --- | --- | --- |
| Top right | Blue `#3D6BFF` | Maths Foundation |
| Bottom right | Tangerine `#FF7A2E` | English Language |
| Bottom left | Purple `#9B4DFF` | Maths Higher |
| Top left | Volt `#C3F53C`, drawn at 0.62 R | Mastery, still being built |

Geometry: quarter radius R = 38 in a 100-unit box, night outline
`#191B30` at 3.2 units with round joins (the emblem "sticker" edge). The gap
next to the volt quarter is the mistake not yet fixed.

States:

- **Building** (`volta-mark.svg`): the resting logo. Use it by default.
- **Closed** (`volta-mark-closed.svg`): the full disc with the dashed volt
  ring of a mastered emblem. Use it only for a real, server-marked success.
- **Blueprint** (`volta-mark-blueprint.svg`): dashed outlines for empty and
  loading states, matching a new topic's emblem.
- **Mono** (`volta-mark-mono.svg`): one colour, with the quarters separated by
  gaps instead of an outline.

Rules:

- Clear space equals the volt quarter's radius on every side.
- Minimum size is 16px for the mark and 72px wide for the lockup.
- Never rotate the disc: volt always sits top left.
- Never recolour a quarter, stretch the disc or add a lightning bolt. Save My
  Exams uses a bolt as its logo and Seneca uses one in its hero.

## Wordmark and lockups

The wordmark is "volta" in lower case, set in Unbounded ExtraBold (800), the
Circuit display face, with the font's kerning plus -4 units of tracking, then
converted to outlines. Unbounded is licensed under the SIL Open Font License,
which allows its use in a logo.

| File | Use |
| --- | --- |
| `volta-lockup.svg` / `-light.svg` | Primary: disc plus wordmark, for paper / night grounds |
| `volta-lockup-stacked.svg` / `-light.svg` | Square spaces, splash screens |
| `volta-wordmark.svg` / `-light.svg` | Where the disc already appears nearby |
| `volta-maths-lockup*.svg`, `volta-english-lockup*.svg` | Subject lockups; the subject word is Unbounded 400 in the subject hue |

The disc spans from the top of the "l" to the baseline overshoot, and the gap
before the "v" is 30% of the disc height.

## Icons

| File | Use |
| --- | --- |
| `volta-app-icon.svg` (+ `png/volta-app-icon-1024.png`) | iOS and store listings: disc on night |
| `volta-app-icon-paper.svg` | Light contexts |
| `volta-app-icon-mono.svg` | Themed-icon preview |
| `volta-android-foreground.svg`, `volta-android-monochrome.svg` | Android adaptive icon layers (background is night `#191B30`) |
| `volta-favicon.svg` | Web favicon, 32px grid |

Icons shift the disc up and left by 0.05 R to centre it optically, because the
smaller volt quarter moves the visual weight down and right.

## Colour and type

Nothing new: the brand uses the Circuit tokens in
`clients/shared/circuit/tokens.css` and the type stack in `DESIGN.md`
(Unbounded, Atkinson Hyperlegible Next and Mono). Volt still means "go" or
"reward" only.

## Before adopting the name

Checked on 29 September 2026:

- No RDAP registration found for volta.study, voltarevision.co.uk,
  voltarevision.com, govolta.app, voltarevise.com or voltaapp.co.uk.
- Registered already: volta.app, getvolta.app, volta.academy, volta.co.uk.
- "Volta" exists on the App Store (indeHealth, college wellbeing) and Google
  Play (a tutoring-class management app). Volta Tech Ltd and Volta
  Technologies Ltd exist at Companies House, with no education activity found.

Still to do, as `GO_TO_MARKET.md` requires:

1. Search the [UK trade marks register](https://www.gov.uk/search-for-trademark)
   for VOLTA in classes 9 (apps), 41 (education) and 42 (software as a
   service). If it is live for education, use the runner-up **Quado** (four
   quarters); the mark and system work unchanged.
2. Register the chosen domain and social handles.
3. Rename in code: "GCSE Study Desk", "MathsMate" and "EnglishMate" appear in
   about 57 files, including `app/app.json`, `app/store/`, the selector pages,
   SEO metadata and legal pages.
4. Replace `selector/favicon.svg`, `app/assets/icon-source.svg` and the Android
   icon sources with the Volta files, then re-export the PNGs.

## Regenerating

From `website/`:

```bash
pip install fonttools brotli uharfbuzz
python3 design/brand/src/brand.py
```

`src/brand.py` holds the geometry (quarter radius, volt ratio, outline weight,
tracking) as constants at the top. `src/brand-template.html` is the brand-kit
page; the script fills in its artwork placeholders.
