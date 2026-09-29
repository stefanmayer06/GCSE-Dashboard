# Clevolta brand proposal

Clevolta is the proposed name and identity for the product now called GCSE
Study Desk. It is a proposal only: the product, store listings and legal pages
keep the current name until the trade-mark search below is done and the owner
approves the rename. It replaces the earlier proposal, Volta, which is too
widely used to own.

`brand-kit.html` shows the full kit and the research behind it. The SVGs in
this folder are the source files. `src/brand.py` regenerates all of them (see
[Regenerating](#regenerating)).

## The name

**Clevolta** (say it kleh-VOL-tuh) is a new word: **clev**er and **volta**
joined at the shared "v". A student reads "clever" first, so the name leads
with learning, and all of Volta is still inside it:

| Part | Where it lives in the product |
| --- | --- |
| Clever | What revision is for: the learning half of the name |
| Volt and the voltaic pile | Volt lime is the one reward colour; Volta's 1800 battery was a stack of discs, as emblems stack layers from marked answers |
| The volta | The turn in a sonnet, a GCSE English term; a fixed mistake is a turning point |
| *Una volta* | Italian for "one more time"; mistakes return after 1, 3, 7 and 21 days |

Naming in use:

- Master brand: **Clevolta**. App stores: **Clevolta: GCSE Revision** (the plain
  name is free too, but the suffix helps search).
- Subjects: **Clevolta Maths** (Foundation and Higher are tiers, not brands) and
  **Clevolta English**. These replace MathsMate and EnglishMate.
- Mascot: **Pip, your Clevolta guide**. Pip is unchanged.
- Lines: "Fix what you missed." (primary), "One more go.", "Close the loop."

The copy rules in `PRODUCT.md` still apply: describe content as AQA-style,
never imply AQA endorsement, and never promise grades.

## Name checks

Round two screened 119 invented names against the .com, .co.uk and .app
registries. Only 26 had no registration on all three, and Clevolta was the
strongest of those. Checked on 29 September 2026:

- **Domains:** no RDAP registration for clevolta.com, .co.uk, .uk, .app, .net,
  .org, .io, .co, .study, .school, .academy, .education, .de or .eu.
- **App Store** (GB and US, via the iTunes Search API): no app with the name.
- **Google Play:** no results (a "duolingo" control search returns 41 apps).
- **Companies House:** "No results found".
- **Web search:** no business, product or app with the name. The nearest are
  Les Clés de Volta (a French electrician) and Hager's "clé Volta" cabinet key.
- **Watch:** "Clev-" starts like Clever, the US school sign-in platform owned by
  Kahoot, and Cleva, a neobank. The words differ, but raise both in the
  trade-mark search.

A search can show that nothing was found, not that nothing exists, so the
trade-mark search is still needed:

1. Register clevolta.com, clevolta.co.uk and clevolta.app now.
2. Search the [UK trade marks register](https://www.gov.uk/search-for-trademark)
   for CLEVOLTA in classes 9 (apps), 41 (education) and 42 (software as a
   service), then file. If it is blocked, use the backup **Learnvolta** (also
   unused everywhere checked); the mark and system work unchanged.
3. Claim @clevolta on TikTok, Instagram, YouTube and X (not checked from here).
4. Search the EU and US registers before an international release.

Rejected names: Volta (Volta AI, Volta Live, Volta EV, Volta Driver and others
already use it), Clevolt (klevolt.com is registered and sounds the same),
Quado (no learning in it), Pipit, Pila, Revvo and Sparko (taken, or too close
to Piply, Pippit, the OECD's PILA, the "Rev-" apps, Sparx and BBC Bitesize).

## The mark: the disc

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

- **Building** (`clevolta-mark.svg`): the resting logo. Use it by default.
- **Closed** (`clevolta-mark-closed.svg`): the full disc with the dashed volt
  ring of a mastered emblem. Use it only for a real, server-marked success.
- **Blueprint** (`clevolta-mark-blueprint.svg`): dashed outlines for empty and
  loading states, matching a new topic's emblem.
- **Mono** (`clevolta-mark-mono.svg`): one colour, with the quarters separated
  by gaps instead of an outline.

Rules:

- Clear space equals the volt quarter's radius on every side.
- Minimum size is 16px for the mark and 96px wide for the lockup.
- Never rotate the disc: volt always sits top left.
- Never recolour a quarter, stretch the disc or add a lightning bolt. Save My
  Exams uses a bolt as its logo and Seneca uses one in its hero.

## Wordmark and lockups

The wordmark is "clevolta" in lower case, set in Unbounded ExtraBold (800), the
Circuit display face, with the font's kerning plus -4 units of tracking, then
converted to outlines. Unbounded is licensed under the SIL Open Font License,
which allows its use in a logo.

| File | Use |
| --- | --- |
| `clevolta-lockup.svg` / `-light.svg` | Primary: disc plus wordmark, for paper / night grounds |
| `clevolta-lockup-stacked.svg` / `-light.svg` | Square spaces, splash screens |
| `clevolta-wordmark.svg` / `-light.svg` | Where the disc already appears nearby |
| `clevolta-maths-lockup*.svg`, `clevolta-english-lockup*.svg` | Subject lockups; the subject word is Unbounded 400 in the subject hue |

The disc spans from the top of the "l" to the baseline overshoot, and the gap
before the "c" is 30% of the disc height. In the stacked lockup the disc is
30% of the word's width.

## Icons

| File | Use |
| --- | --- |
| `clevolta-app-icon.svg` (+ `png/clevolta-app-icon-1024.png`) | iOS and store listings: disc on night |
| `clevolta-app-icon-paper.svg` | Light contexts |
| `clevolta-app-icon-mono.svg` | Themed-icon preview |
| `clevolta-android-foreground.svg`, `clevolta-android-monochrome.svg` | Android adaptive icon layers (background is night `#191B30`) |
| `clevolta-favicon.svg` | Web favicon, 32px grid |

Icons shift the disc up and left by 0.05 R to centre it optically, because the
smaller volt quarter moves the visual weight down and right.

## Colour and type

Nothing new: the brand uses the Circuit tokens in
`clients/shared/circuit/tokens.css` and the type stack in `DESIGN.md`
(Unbounded, Atkinson Hyperlegible Next and Mono). Volt still means "go" or
"reward" only.

## Adopting the name

After the checks above: "GCSE Study Desk", "MathsMate" and "EnglishMate" appear
on 163 lines in 64 files, including `app/app.json`, `app/store/`, the selector
pages, SEO metadata, legal pages and the pitch deck. Replace
`selector/favicon.svg`, `app/assets/icon-source.svg` and the Android icon
sources with the Clevolta files, then re-export the PNGs.

## Regenerating

From `website/`:

```bash
pip install fonttools brotli uharfbuzz
python3 design/brand/src/brand.py
```

`src/brand.py` holds the name and geometry (quarter radius, volt ratio, outline
weight, tracking) as constants at the top. `src/brand-template.html` is the
brand-kit page; the script fills in its artwork placeholders. The PNGs in
`png/` are exported from the SVGs with a headless browser.
