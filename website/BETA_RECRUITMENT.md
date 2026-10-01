# Beta recruitment: 50 testers for under $5

This is the working plan for recruiting 50 beta testers and collecting feedback
on design and pricing. It follows the free beta test in `GO_TO_MARKET.md`: invite
people through channels that allow it, label each channel with `?src=`, and
improve the first session before sending more traffic.

**Budget:** £0 is required. Every channel below is free. The optional spend is
about £2 of library printing for QR flyers (step 8). Paid ads are skipped on
purpose: $5 buys only a handful of clicks and teaches nothing a free post
doesn't.

## What counts as a beta tester

A beta tester **signed up through a tagged link and completed the diagnostic**.
Signups who never start are not counted. The target over three weeks is:

| Measure | Target | Where to read it |
| --- | --- | --- |
| Tagged signups | ~120 | `npm run acquisition:report -- 30` → `signups` |
| Beta testers (diagnostic done) | **50** | `acquisition:report` → `diagnostics` |
| Feedback forms | 25+ | `npm run feedback:report -- 30` → `responses` |
| Complete pricing answers from parents | 10+ | `feedback:report` → `monthlyPrice.parent.responses` |
| Recorded usability sessions | 5 | Your notes |

The ~120 signups figure assumes that about 40% of signups finish the
diagnostic. Replace that guess with the real ratio after week 1.

## Before inviting anyone

1. **Apply the migration before deploying.** Run
   `npm run db:migrations:push`, which adds
   `20260929010000_beta_feedback_design_pricing.sql`, then deploy. If the new
   form goes live before the migration, feedback inserts fail on the unknown
   columns.
2. Open `/feedback.html?src=test` in production, submit one answer, and check that
   `npm run feedback:report -- 1` counts it. Then delete that row in Supabase.
3. Walk through the whole path yourself on a phone: choose a tier, take the
   diagnostic, get marked, save a mistake. Fix anything that blocks it. Each
   tester only gets one first session.

## Tracking links

Every link carries a short, lowercase source label, never a name or email.
The homepage carries the label through to signup, and the feedback form stores
it alongside the answers.

```
https://gcse-dashboard-server.vercel.app/?src=<label>
https://gcse-dashboard-server.vercel.app/feedback.html?src=<label>
```

| Label | Channel |
| --- | --- |
| `friends` | Your own friends and classmates |
| `family` | Family, cousins, family friends |
| `tutor` | Independent tutors |
| `teacher` | Teachers you know personally |
| `reddit-gcse` | r/GCSE |
| `tsr` | The Student Room |
| `discord` | Study Discord servers |
| `tiktok`, `youtube`, `instagram` | Your own short videos and posts |
| `parent-group` | Local parent groups (with admin permission) |
| `flyer` | Library or community noticeboard QR code |
| `design-crit` | Maker and design communities (design feedback only) |

## Channels, in order

Start with the channels where you're trusted. Warm contacts finish the
diagnostic far more often than strangers, and their feedback is candid enough
to fix the first session before public posts.

### 1. Your own network: `friends`, `family` (aim: 15 testers)

Message 25–30 people you know who are in Year 10 or 11 or resitting, or who
have a child who is. Ask each to forward it to one friend. This will likely be
the single largest source.

### 2. Tutors: `tutor` (aim: 10 testers, plus pricing insight)

Independent GCSE Maths and English tutors are adults, often want free homework
tools, and each can pass the link to several students. They also know what
families already pay for revision help, which makes them strong pricing
interviewees. Find 20–30 on free tutor directories, local listings and
LinkedIn. Send a short personal email; don't mass-mail.

### 3. Teachers you know: `teacher`

A former teacher might share the link with a class or revision club. Ask them.
Don't post in school channels yourself. The product has no teacher or class
features, so describe it as a tool learners use on their own.

### 4. r/GCSE: `reddit-gcse` (aim: 10 testers)

Read the rules first, then message the moderators to ask whether an
"I built this" post is welcome (there's a modmail under
[Messages to paste](#messages-to-paste)). A post asking for criticism does
better than an announcement. Make it an image post led by
`design/social/05-beta-testers-wanted.png`; the other four images can follow
it as a gallery. Paste alt text from `design/social/alt-text.md`. Use the
subreddit-specific label `reddit-gcse` rather than the generic `reddit` in
that README, so each subreddit can be compared. Post once, answer every comment the same day, and don't
repost. Mock season (November) is a natural moment for a follow-up if the mods
agree.

### 5. The Student Room and Discord: `tsr`, `discord`

Same rule: check the self-promotion policy or ask a moderator, and use the
designated resources thread or channel if there is one.

### 6. Your own accounts: `tiktok`, `youtube`, `instagram`

Record a 20–30 second screen capture of the loop: wrong answer → why it went
wrong → retry scheduled for three days later. Post it from your own account and
put the tagged link in your profile. On Instagram, post the `design/social/`
images as one carousel with the caption in `design/social/README.md`. These
are organic posts, not ads, so they cost nothing, and they're the only channel
that keeps working after you stop.

### 7. Parent groups: `parent-group` (the key pricing source)

Parents are the likely buyers, so their pricing answers matter most. Ask the
admin of a local parents' group before posting, then use the parent message
below.

### 8. Noticeboards: `flyer` (optional, about £2)

Print 10–20 black-and-white A5 flyers with a QR code for `?src=flyer` at a
library, and ask before pinning them on library or community noticeboards.
`GO_TO_MARKET.md` asks for a UK trade marks register search before
printing the name, so do that first; otherwise skip this step.

### 9. Design critique: `design-crit`

For design feedback only, post screenshots to maker or design-feedback
communities. Their answers are useful for layout and clarity but don't
represent learners or parents, so count them apart from the 50.

## Getting the design and pricing feedback

**Form.** Send every tester `/feedback.html?src=<label>` after their first
session, ideally the next day. It now asks, all optionally:

- how clear the design felt (1–5) and which screen looked off
- who would pay (me, parent, school, nobody)
- monthly subscription vs one payment until the exams vs free only
- four Van Westendorp price questions in £ per month: too cheap to trust, a
  bargain, getting expensive, too expensive

The form never shows a price, because no price has been decided.
`npm run feedback:report -- 30` returns counts, average ratings, and price
medians and curve crossings, split by role. It never returns messages, notes
or emails. With fewer than about 30 complete answers, treat the price
points as a rough direction, not a result.

**Usability calls (5 people).** Five testers on a video call, sharing
their screen, with no help from you: "Pick your subject and find out what to
revise first." Note where they hesitate. For anyone under 18, ask a parent to
arrange the call and be present.

**Pricing interviews (5 parents, 15 minutes each).** Ask parents and learners
separately (see `GO_TO_MARKET.md`):

1. What do you spend now on revision help, if anything? What made it worth it?
2. Did the weekly review and scheduled retries solve something you've struggled
   with before?
3. What would you need to see before paying?
4. A monthly subscription or one payment that lasts until the exams: which,
   and why?
5. Then ask the four price questions from the form out loud.

Don't quote a price or promise future free access in interviews.

## Three-week schedule

| Week | Dates | Do |
| --- | --- | --- |
| 1 | 29 Sep – 5 Oct | Migrate and deploy; walk the path yourself; message network and tutors; ask moderators and admins |
| 2 | 6 – 12 Oct | Fix what week-1 testers hit; Reddit, TSR and Discord posts; first video; usability calls |
| 3 | 13 – 19 Oct | Follow up with non-finishers once; parent interviews; second video; run both reports and decide what to change |

Run `npm run acquisition:report -- 30` twice a week. Put more effort into
sources whose testers finish the diagnostic, not just the ones with the most
signups.

## Rules for every message

- Never DM under-18s you don't know. Reach young people through their own
  choice (a public post, a video), their parents, their tutors or their teachers.
- Don't promise grade improvements, full specification coverage or AQA
  endorsement. Say "AQA-style" and "independent". Don't invent testimonials.
- Describe the beta as free. Don't announce a price, a paid plan or a launch
  date.
- The service is for learners aged 13 and over.
- Don't put names, emails or schools in `?src=` labels.

## Messages to paste

Replace `<label>` with the channel's label.

**Friends and family (WhatsApp or text)**

> Hey! I've built a free revision site for AQA GCSE Maths and English, called
> GCSE Study Desk. It gives you a quick 10-question check, marks it, and then
> brings back the questions you got wrong a few days later so they stick. I'm
> looking for 50 people to try it and tell me honestly what's confusing.
> Takes about 15 minutes:
> https://gcse-dashboard-server.vercel.app/?src=<label>
> If you know anyone else in Year 10/11 who'd try it, please forward this 🙏

**Tutors (email)**

> Subject: Free AQA GCSE revision tool, looking for tutor feedback
>
> Hi <name>,
>
> I'm the independent developer of GCSE Study Desk, a free beta revision tool
> for AQA GCSE Maths (Foundation and Higher) and English Language. Learners
> take a short diagnostic, get marked (worked methods for Maths, written
> feedback for English), record why each mistake happened, and get the same kind of question back on a schedule
> (1, 3, 7 and 21 days).
>
> I'd value ten minutes of a tutor's honest opinion: whether it would be useful
> between your sessions, what's missing, and whether families would pay for
> something like it. If it's useful, you're welcome to share it with students.
>
> Try it: https://gcse-dashboard-server.vercel.app/?src=tutor
> Feedback form: https://gcse-dashboard-server.vercel.app/feedback.html?src=tutor
>
> It's independent and not endorsed by AQA. Thanks for reading.
>
> <your name>, GCSE Study Desk

**r/GCSE modmail (before posting)**

> Subject: OK to post a free revision site I built, asking for beta testers?
>
> Hi mods. I've built a free revision site for AQA GCSE Maths and English
> Language (GCSE Study Desk) and I'd like to post once asking for beta testers
> and honest feedback. It's free, there's nothing to buy, and it's not
> affiliated with AQA. Is that OK, and is there a flair or thread you'd like me
> to use? Happy to send the draft first. Thanks!

**r/GCSE (after moderator approval)**

An image post with `design/social/05-beta-testers-wanted.png` first. The
body is Reddit markdown, so paste it in the Markdown editor.

> Title: I built a free revision site for AQA Maths and English Language.
> Looking for beta testers to mark my work (please be brutal)

```markdown
For once, I'm the one asking you to mark my work.

I've been building **GCSE Study Desk**, a free revision site for **AQA GCSE Maths (Foundation and Higher) and English Language**. It's in beta, and I'm looking for 50 people who are actually sitting GCSEs to try it and tell me what's confusing, broken or pointless.

**What it does**

* **10-question check:** pick your course, answer 10 questions (about 10 minutes), and it uses your answers to plan your first week.
* **Marking you can see:** Maths is marked against exact answers (no AI) and shows the full worked method. In English, short questions are marked automatically and long answers get AI feedback against AQA-style mark schemes, with a model answer. It's guidance, not an official grade.
* **Mistake notebook:** get something wrong in a lesson or practice paper and it goes in your notebook. You pick why you missed it (didn't know it, wrong method, misread the question, arithmetic slip...) and it comes back 1, 3, 7 and 21 days later until you've actually got it.
* Also: explainers that stop and ask you questions, timed AQA-style papers, and a map where every topic is a level you can replay.

**What I'm asking (about 15 minutes)**

1. Sign up and do the 10-question check for your course.
2. Fill in the feedback form. The design questions help me most.
3. Or just comment. "I didn't get what X was for" is genuinely useful.

**Try it:** https://gcse-dashboard-server.vercel.app/?src=reddit-gcse

**Feedback form:** https://gcse-dashboard-server.vercel.app/feedback.html?src=reddit-gcse

**Before you click**

* AQA only for now, so not Edexcel or OCR, sorry.
* You'll need an account (email and password) so it can save your progress and bring mistakes back. If you just want a look first, the homepage has a one-question example that doesn't need an account.
* It's free and there's nothing to pay. The form has a few optional questions about whether something like this should ever cost money; skip them if you like.
* It's independent and not affiliated with AQA, and it won't magically raise your grade. The aim is to take the guesswork out of what to revise next.

I'll be in the comments. Don't hold back.
```

**Parent group (after admin approval)**

> Hi all, the admin kindly said I could post this. I've built a free revision
> tool for AQA GCSE Maths and English Language (GCSE Study Desk). It's in beta,
> and I'm looking for a few families with a Year 10 or 11 learner to try it and
> tell me what works. I'd especially like to hear from parents about whether a
> tool like this is worth paying for, and how. There's a short, optional form
> for that. Nothing costs money now.
> https://gcse-dashboard-server.vercel.app/?src=parent-group
> Feedback: https://gcse-dashboard-server.vercel.app/feedback.html?src=parent-group

**Follow-up the day after someone signs up**

> Thanks for trying Study Desk! Could you spend two minutes on this? The design
> question and the "which screen looked off" box help most:
> https://gcse-dashboard-server.vercel.app/feedback.html?src=<label>
