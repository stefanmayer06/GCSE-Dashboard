# Revisaurus brand proposal

Revisaurus is the proposed name and identity for the product now called GCSE
Study Desk. It is a proposal only: the product, store listings and legal pages
keep the current name until the trade-mark search below is done and the owner
approves the rename. It replaces two earlier proposals: Volta (too widely used
to own) and Clevolta (unused, but it didn't land).

`brand-kit.html` shows the full kit and the research behind it. The SVGs in
this folder are the source files. `src/brand.py` regenerates all of them (see
[Regenerating](#regenerating)).

## The name

**Revisaurus** (say it rev-ih-SAW-rus) is revise plus thesaurus, with a
dinosaur's roar. It follows the pattern of Duolingo (duo + lingo) and Emofest
(emo + fest): a plain meaning with a playful twist.

| Part | What it does |
| --- | --- |
| Revise | Says what the app is for in the first two syllables |
| Thesaurus | Borrows the rhythm of a word every student can say and spell; also a book of words, a nod to English |
| -saurus | Big, loud and friendly; joins the study creatures (Rexam the T. rex, Memmoth the mammoth, Redo the phoenix chick) |
| "Make mistakes extinct" | The brand line: every miss comes back after 1, 3, 7 and 21 days until it is gone for good |

Naming in use:

- Master brand: **Revisaurus**. App stores: **Revisaurus: GCSE Maths &
  English**. It shortens naturally to "Revi".
- Subjects: **Revisaurus Maths** (Foundation and Higher are tiers, not brands)
  and **Revisaurus English**. These replace MathsMate and EnglishMate.
- Mascot: **Pip, your Revisaurus guide**. Pip is unchanged.
- Lines: "Make mistakes extinct." (brand), "Fix what you missed." (product
  promise), "One more go.", "Close the loop."

The copy rules in `PRODUCT.md` still apply: describe content as AQA-style,
never imply AQA endorsement, and never promise grades.

## How the name was chosen

Round three started from research on memorable brand names:

- Two or three syllables and a strong stress are easiest to remember.
  Revisaurus has four, like Duolingo, and borrows its rhythm from thesaurus.
- Repeated sounds make names more noticeable, memorable and liked.
- A twist on a known word is learnt in one hearing (Kahoot from "cahoots").
- The strongest names in this market hint at the job (Save My Exams, Quizlet).

116 names were screened against the .com, .co.uk and .app registries, and 28
had no registration on all three. Short made-up names (Fixfox, Unoops,
Tickety, Examigo, Redoku, Gradiator) were all taken. Finalists:

| Name | Verdict | Why |
| --- | --- | --- |
| Revisaurus | Recommended | Says revision straight away, has a character, fits the creatures |
| Fixcalibur | Alternative | Fix + Excalibur; matches the Legend rank, but doesn't say revision |
| Missterpiece | Alternative | Miss + masterpiece; tells the loop, but sounds like "misterpiece" and "Miss" reads as a title |

Both alternatives passed the same domain, app-store and Companies House checks.

## Name checks

Revisaurus, checked on 29 September 2026:

- **Domains:** no RDAP registration for revisaurus.com, .co.uk, .uk, .app,
  .net, .org, .io, .co, .study, .school, .academy, .education, .de, .eu or .ai.
- **App Store** (GB and US, via the iTunes Search API): no app with the name;
  the nearest results are reptile apps.
- **Google Play:** no app with the name; the results are unrelated dinosaur
  games.
- **Companies House:** "No results found".
- **Web search:** no business, product or revision resource with the name,
  including on Tes. The only mention is a character form on a fan wiki.
- **Watch:** the "Rev-" start is shared with Revvo, Revu and Reviso, which are
  different words. List them in the trade-mark search.

A search can show that nothing was found, not that nothing exists, so:

1. Register revisaurus.com, revisaurus.co.uk and revisaurus.app now.
2. Search the [UK trade marks register](https://www.gov.uk/search-for-trademark)
   for REVISAURUS in classes 9 (apps), 41 (education) and 42 (software as a
   service), then file. If it is blocked, use Fixcalibur or Missterpiece; the
   mark and system work unchanged.
3. Claim @revisaurus on TikTok, Instagram, YouTube and X (not checked from here).
4. Search the EU and US registers before an international release.

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

- **Building** (`revisaurus-mark.svg`): the resting logo. Use it by default.
- **Closed** (`revisaurus-mark-closed.svg`): the full disc with the dashed volt
  ring of a mastered emblem. Use it only for a real, server-marked success.
- **Blueprint** (`revisaurus-mark-blueprint.svg`): dashed outlines for empty and
  loading states, matching a new topic's emblem.
- **Mono** (`revisaurus-mark-mono.svg`): one colour, with the quarters
  separated by gaps instead of an outline.

Rules:

- Clear space equals the volt quarter's radius on every side.
- Minimum size is 16px for the mark and 96px wide for the lockup.
- Never rotate the disc: volt always sits top left.
- Never recolour a quarter, stretch the disc or add a lightning bolt. Save My
  Exams uses a bolt as its logo and Seneca uses one in its hero.

## Wordmark and lockups

The wordmark is "revisaurus" in lower case, set in Unbounded ExtraBold (800),
the Circuit display face, with the font's kerning plus -4 units of tracking,
then converted to outlines. Unbounded is licensed under the SIL Open Font
License, which allows its use in a logo.

| File | Use |
| --- | --- |
| `revisaurus-lockup.svg` / `-light.svg` | Primary: disc plus wordmark, for paper / night grounds |
| `revisaurus-lockup-stacked.svg` / `-light.svg` | Square spaces, splash screens |
| `revisaurus-wordmark.svg` / `-light.svg` | Where the disc already appears nearby |
| `revisaurus-maths-lockup*.svg`, `revisaurus-english-lockup*.svg` | Subject lockups; the subject word is Unbounded 400 in the subject hue |

The disc spans from the top of the tallest letter to the baseline overshoot,
and the gap before the wordmark is 30% of the disc height. In the stacked
lockup the disc is 30% of the word's width.

## Icons

| File | Use |
| --- | --- |
| `revisaurus-app-icon.svg` (+ `png/revisaurus-app-icon-1024.png`) | iOS and store listings: disc on night |
| `revisaurus-app-icon-paper.svg` | Light contexts |
| `revisaurus-app-icon-mono.svg` | Themed-icon preview |
| `revisaurus-android-foreground.svg`, `revisaurus-android-monochrome.svg` | Android adaptive icon layers (background is night `#191B30`) |
| `revisaurus-favicon.svg` | Web favicon, 32px grid |

Icons shift the disc up and left by 0.05 R to centre it optically, because the
smaller volt quarter moves the visual weight down and right.

## Colour and type

Nothing new: the brand uses the Circuit tokens in
`clients/shared/circuit/tokens.css` and the type stack in `DESIGN.md`
(Unbounded, Atkinson Hyperlegible Next and Mono). Volt still means "go" or
"reward" only.

## Adopting the name

After the checks above: "GCSE Study Desk", "MathsMate" and "EnglishMate" appear
on 162 lines in 65 files, including `app/app.json`, `app/store/`, the selector
pages, SEO metadata, legal pages and the pitch deck. Replace
`selector/favicon.svg`, `app/assets/icon-source.svg` and the Android icon
sources with the Revisaurus files, then re-export the PNGs.

## Regenerating

From `website/`:

```bash
pip install fonttools brotli uharfbuzz
python3 design/brand/src/brand.py
```

`src/brand.py` holds the name, the alternates and the geometry (quarter radius,
volt ratio, outline weight, tracking) as constants at the top.
`src/brand-template.html` is the brand-kit page; the script fills in its artwork
placeholders. The PNGs in `png/` are exported from the SVGs with a headless
browser.
