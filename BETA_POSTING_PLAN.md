# GCSE Study Desk: Free Beta Posting Plan

Aligned with [`MARKET_COMPARISON.md`](MARKET_COMPARISON.md). Covers the **website only** — the mobile app is not mentioned in any post, link or reply until it is released.

Goal: recruit the first free beta testers and learn from them. This is the "months 0–3" work from the market plan: **a small free beta, activation measurement and structured feedback — no payments, no paid ads.**

## 1. What we are recruiting for

| Target | Number | Definition | Source |
| --- | --- | --- | --- |
| Activated beta learners | 500 (rolling) | Signed up, completed a diagnostic **and** at least one marked session within 7 days | Market plan, months 0–3 |
| Learner interviews | 20 | Short call or async Q&A after ~2 weeks of use | Market plan, months 0–3 |
| Parent interviews | 15 | Same | Market plan, months 0–3 |
| Teacher interviews | 15 | Same; later design-partner candidates | Market plan, months 0–3 |
| Feedback form submissions | 50+ in first 6 weeks | Via the built-in form at `/feedback` | This plan |

An "activated learner" is worth far more than a signup. Never optimise a post for clicks; optimise it for someone completing the diagnostic + one marked session.

## 2. The pitch (use everywhere, change nothing important)

**Category:** personal GCSE revision desk / AQA revision coach — *never* "AI tutor" or "learning platform".

**One-line pitch:**

> Free AQA revision desk for GCSE Maths and English: it tells you what to revise today, marks your attempts, explains the mistake, and brings it back for a retry until you can do it.

**The four questions the product answers** (lead with these in longer posts):

1. What should I revise today?
2. Why is this the right task for me?
3. What exactly did I get wrong?
4. When will I prove I can now do it?

### Claims rules (hard constraints from the market plan)

- Do **not** imply AQA endorsement. Say "AQA-style" / "aligned to the AQA spec" / "independent, not affiliated with AQA".
- Do **not** claim complete specification coverage — it is documented as incomplete. Say "covers the core Foundation/Higher/English Language content, and we publish an audit".
- Do **not** present AI English feedback as a mark or predicted grade.
- Do **not** call the readiness indicator a predicted grade.
- Do **not** invent outcome claims ("boost your grade") — no evidence exists yet.
- Always disclose that you built it. Honesty is the differentiator against incumbent astroturfing and the only sustainable voice in student communities.

## 3. Links and tracking

Every public link carries a `src` tag so each channel's feedback can be traced. Today the feedback form records it; when product events for acquisition source ship (market plan Priority 0), the same tags carry over.

| Channel | Link to post |
| --- | --- |
| Reddit r/GCSE | `https://<site>/feedback?src=reddit-rgcse` (post) and `?src=reddit-rgcse-c1`, `-c2` per comment |
| The Student Room | `https://<site>/feedback?src=tsr-forum` |
| Study Discords | `https://<site>/feedback?src=discord-<server>` |
| Parent groups (Facebook/Mumsnet) | `https://<site>/feedback?src=parents-<group>` |
| TikTok/IG/YouTube Shorts bio | `https://<site>/feedback?src=social-bio` |
| Teacher communities | `https://<site>/feedback?src=teacher-<place>` |
| Direct DMs / friends & family | `https://<site>/feedback?src=direct` |

Two-step funnel for posts: the post links to the **subject page** (`/maths/`, `/maths-higher/` or `/english/`) for the product, and to the **feedback page** for the form. Ask people to use the feedback link even if they only looked at the site for two minutes — early "why I left" feedback is the most valuable.

## 4. The feedback form (already built at `/feedback`)

Five questions, under two minutes, stored server-side (`beta_feedback` table / local `feedback.json`), rate-limited, spam-protected:

1. **I am a…** student / parent / teacher / other
2. **Which subject did you look at?** Foundation, Higher, English, multiple
3. **How likely are you to keep using Study Desk for revision?** 1–5 (1 = would not return, 5 = would use weekly)
4. **What should we improve first?** free text — the key question
5. **How did you hear about us?** free text — acquisition-source capture

Optional reply email. The `?src=` URL parameter is recorded invisibly so form results can be joined back to the posting channel. A weekly ritual (Fridays): read every submission, tag each one `activation / marking / content / plan / tutor / trust / perf`, and pick the next week's fixes from the tags — this is exactly the "collect support reasons and first-session abandonment causes" loop from the market plan.

## 5. Channels and ready-to-post copy

Post in this order. Stop and fix the product if week-one feedback keeps flagging the same thing — the market plan's rule is organic, trust-led growth, not broadcast.

### Channel A — Reddit (start here, weeks 1–2)

Communities: r/GCSE (read the rules — self-promotion is restricted; engage primarily in comments and allow sticky/self-promo threads), r/GCSE's community resources threads, r/6thForm only where Year 11 resitters are on-topic, r/UKParents for the parent angle.

**Post 1 — "I built" diagnostic post (learner angle):**

> **I'm building a free AQA revision desk for GCSE Maths & English — what should it check first?**
>
> I've spent months building a website that does the boring-but-important part of revision: it plans your day from your exam date, gives you AQA-style timed practice, marks it, explains exactly what went wrong, and schedules a retry of that exact mistake after 1, 3, 7 and 21 days until you've got it.
>
> It's free while in beta. It covers AQA Maths Foundation, Maths Higher and English Language — it is independent and not affiliated with AQA, and I publish a coverage audit so you can see what's in and what's not.
>
> If you're revising (or parenting someone who is), I'd genuinely value two minutes of feedback: [feedback link]. Tell me what's missing or annoying — the meanest feedback is the most useful right now. If you try a paper, even better.

**Comment template (replying to "what do you use to revise?" threads):**

> Built something for exactly this — a free AQA desk that plans the day, marks AQA-style practice and loops your mistakes back as retries. Independent, not affiliated with AQA. If you try it, tell me what to fix: [feedback link]

**Rules of engagement:** answer every reply within a few hours; never DM-pitch; if a moderator removes a post, ask politely what's allowed and follow that; upvote and answer other students' maths/English questions with no link at all most days (the account earns trust, not the link).

### Channel B — The Student Room (weeks 1–2)

Forums: GCSE Mathematics, English study help, and the study/revision threads. Same copy as Post 1, trimmed:

> I've built a free AQA revision website (Maths F/H + English Language). It plans your revision from your exam date, marks AQA-style papers, explains mistakes and schedules retries of exactly what you got wrong. Independent — not affiliated with AQA. Feedback wanted, especially "what would make you stop using it": [feedback link]

### Channel C — Study Discords (weeks 1–3)

Join 5–10 GCSE study servers. Do not advertise on arrival: be useful in homework-help channels for ~2 weeks first. Then post once in a resources/self-promo channel (or ask a mod where):

> Free AQA study desk — plans your revision, marks practice papers, tracks your mistakes and brings each one back for a timed retry. Maths (F/H) and English Language. Built by one person, free in beta: [link]. Bug reports and harsh feedback welcome: [feedback link]

### Channel D — Parent communities (weeks 2–4, secondary push)

Facebook groups for GCSE parents, Mumsnet, local parent groups. Parents care about structure and visibility, so lead differently:

> **Free revision site for GCSE Maths & English (AQA) — looking for honest parent feedback**
>
> It gives your child a daily plan from their exam date, marks their practice in the real exam format, and keeps a "mistake notebook" that resurfaces each error until it's fixed. You can print a progress summary to talk about together.
>
> It's free in beta and independent (not affiliated with AQA). If you and your teen give it 20 minutes, I'd really value your feedback here: [feedback link]. Parents of Year 10s especially — is it clear enough to use without you?

### Channel E — Teacher & tutor communities (weeks 3–6, for interviews)

TES community, teacher Facebook groups, X/Twitter #TeamEnglish #MathsCPD. Teachers are the interview pool (15 needed) and future design partners:

> Independent AQA revision desk for Maths (F/H) and English Language, free in beta while I learn from teachers. Students get a daily plan, timed AQA-style practice, transparent marking and a mistake-retry notebook. I'm looking for 15 teachers to tell me what's useless in it. 15 minutes of your time: [feedback link]. Class use: students sign up individually, nothing to install.

### Channel F — Short-form content (weeks 2–8, repeatable)

Post 2–3 organic TikTok / Instagram Reels / YouTube Shorts per week. Formats that match the product's story (mistake → retry → mastery):

1. Screen-record: a timed question → the marking → the mistake explanation → the scheduled retry card. Caption: "This is what revision should look like: your mistake, scheduled back at you."
2. "AQA English Language Paper 1 Q5: the three things that lose marks" — teach genuinely, end with "my free desk drills exactly this".
3. "Your revision plan if your exam is in N weeks" — 20-second plan built on the site.
4. React to a marked answer: "This got 3/6. Here's the missing mark." (Never claim it's an official mark.)

Bio link: `[site]/feedback?src=social-bio`. Never claim grades or outcomes.

### Channel G — Friends, family and existing users (day 1)

The first 10 testers come from people who already know you. Send the feedback link with three specific asks:

1. Complete the diagnostic and one marked session today (that's "activation").
2. Submit the feedback form, rating honestly.
3. Forward it to one person with a Year 10/11 student.

## 6. Eight-week schedule (autumn window: Sep–Nov)

| Week | Actions | Output target |
| --- | --- | --- |
| 1 | Friends & family (Channel G). Reddit Post 1 + TSR. Answer every reply. | 20+ feedback submissions, first 10 testers |
| 2 | Reddit comments daily. First 2 shorts. Discord joins (no posting yet). Tag all feedback. | 40+ cumulative submissions |
| 3 | Parent groups (Channel D). First Discord posts. 2–3 shorts. | 25 activated learners |
| 4 | Teacher communities (Channel E). Interview invites go out. Fix top feedback tag from week 3. | 50 activated learners, 3 interviews |
| 5 | Repeat best-performing format only. Reddit Post 2 (show a fix you shipped from feedback — "you asked, it's fixed"). | 100 activated learners |
| 6 | Start a weekly "mistakes mastered" story series from anonymised product data (no individual data). Second parent push. | 150 activated learners, 10 interviews |
| 7 | Creator outreach begins (see below). Refresh week-1 posts where allowed. | 200 activated learners, 15 interviews |
| 8 | Review: which channel produced activated learners (not clicks)? Double that one, cut the worst. | 250 activated learners |

Then continue the loop into the Jan–May exam-season window with the channels that survived the week-8 review.

## 7. Student-creator outreach (small, after week 7)

Per the market plan: small GCSE creators, one subject + tier, fixed fee plus capped activated-user bonus, **never** commissions aimed at children, pay only after organic fit is proven.

**DM template:**

> Hi [name] — I built a free AQA revision desk (Maths F/H + English Language): daily plan, AQA-style marked practice, and each mistake scheduled back as a retry. I'm looking for one creator per subject to run a recurring "fix this mistake with me" series. Happy to send full access first, no strings: [link]. Would you be open to seeing it?

Give each creator their own `?src=creator-<name>` link and judge them on activated users (feedback form + later, product events), never views.

## 8. Measurement (weekly, 20 minutes every Friday)

| Metric | Where it comes from | Healthy signal after 8 weeks |
| --- | --- | --- |
| Feedback submissions by `src` | `/feedback` storage | ≥ 50 total; ≥ 5 from your best channel |
| Average rating 1–5 | form | trending up week over week |
| Top improvement tags | manual tag of question 4 | each week's fix ships from last week's top tag |
| Signups | Vercel Insights + Supabase | growing, not spiking-and-dying |
| Activated learners (diagnostic + marked session in 7 days) | product data (add events per market plan Priority 0) | the only number that decides channel spend of your time |
| Interviews done | calendar | 20 students / 15 parents / 15 teachers by ~week 10 |

If a channel brings signups but no activation, the problem is onboarding, not the channel — fix the product before posting more.

## 9. What not to do

- No paid ads (market plan: don't buy scale before activation and AI unit costs are known).
- No app mentions, no "coming to app stores" — website only.
- No fake accounts or undisclosed promotion; always "I built this".
- No AQA endorsement implications, no predicted-grade claims, no outcome claims.
- No spamming homework threads with links; help first, link occasionally.
- No collecting emails beyond the optional feedback field; no behavioural advertising — this product is for teenagers.
