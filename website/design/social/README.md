# Social adverts

Five 1080×1350 (4:5) PNG posts for Instagram and Reddit in the Circuit
style. `npm run social:build` renders them from `scripts/social/posts.jsx`
with the real components (emblems, level tiles, scenes, Pip, a live
explainer frame and the exam hall's question tags), so rebuild them rather
than editing the PNGs.

| File | Post | Surface |
| --- | --- | --- |
| `01-learn-it-play-with-it.png` | The idea: the hero island, the headline and the three courses | Night |
| `02-every-topic-is-a-level.png` | The course map: level tiles, stars, the Next tile and the four lesson stages | Paper |
| `03-explainers-that-ask-you.png` | The fractions explainer at its first checkpoint | Night |
| `04-misses-come-back.png` | The mistake notebook and the 1, 3, 7 and 21-day retries | Paper |
| `05-beta-testers-wanted.png` | The call for beta testers: "Mark my work. Be brutal." over a question paper whose questions are the first session and the feedback form | Night |

## Posting

- **Instagram:** post 01–04 as one carousel in this order (it alternates
  night and paper and follows a lesson), or post them one at a time. Each
  post carries the brand, the address and a call to action, so it works
  alone. 4:5 fills the feed. The profile grid shows a 3:4 crop, and nothing
  sits in the outer 40px.
- **Reddit:** share as an image or gallery post and put the link in the
  body. When asking for testers, lead with `05-beta-testers-wanted.png`;
  the others can follow it in the gallery. Check each subreddit's
  self-promotion rules first; many allow promotion only in set threads or
  with a flair. The r/GCSE title and body are in
  [`BETA_RECRUITMENT.md`](../../BETA_RECRUITMENT.md#messages-to-paste).
- **Tag each link by channel**, for example
  `https://gcse-dashboard-server.vercel.app/?src=instagram` and `?src=reddit`,
  so `npm run acquisition:report -- 90` can compare sign-ups by source.
  Use letters, numbers, `-` and `_` only, and never names or emails.
- **Alt text** for every image is in [`alt-text.md`](alt-text.md). Paste it
  into the platform's alt-text field.

### Suggested captions

Instagram:

> Revising for AQA GCSE Maths or English Language? GCSE Study Desk is a free
> beta revision desk: explainers that stop and ask you, a map where every
> topic is a level, and a notebook that brings your misses back until they
> stick. Maths Foundation, Maths Higher and English Language. Link in bio.
>
> Independent revision tool, not affiliated with AQA.
> #gcse #gcsemaths #gcseenglish #revision #aqa

Reddit title:

> Free beta: AQA GCSE Maths and English revision with explainers that stop
> and ask you, and a notebook that brings your misses back

## Rebuilding

```bash
npm run social:build                   # all five, plus alt-text.md
npm run social:build -- map            # one post: learn, map, explainers, notebook or testers
SOCIAL_SCALE=2 npm run social:build    # 2160×2700 files, same layout
SOCIAL_URL=example.org npm run social:build   # print another address
```

Set `CHROMIUM_PATH` if Playwright's own Chromium is not installed (in the
cloud sandbox: `CHROMIUM_PATH=/opt/pw-browsers/chromium`). The build:

1. Reads the counts from the question banks and the explainer library, and
   the address from the landing page's canonical link, so no number on a
   post is typed by hand.
2. Renders each post in Chromium with the Circuit CSS and the self-hosted
   fonts, with motion frozen at its resting frame.
3. Fails if a post throws or if any element or line of text enters the
   outer 40px. Art marked `data-bleed` may cross it.

## Copy rules

The posts follow `PRODUCT.md` and `GO_TO_MARKET.md`: AQA-style and
independent (every footer says so), free during the beta, and no grade
promises, testimonials or invented results. The map and notebook show a
demo learner built with the app's own rules (tile states, `starsFor`, the
suggested tile and the 1, 3, 7 and 21-day schedule). The Higher bank
includes the Foundation questions, so never add the two counts together.
The call for testers words the 10-question check as the app does
(`next-step.js`) and asks the feedback form's own questions. The check
doesn't add to the mistake notebook (lessons and papers do), so don't
promise retries from it.
