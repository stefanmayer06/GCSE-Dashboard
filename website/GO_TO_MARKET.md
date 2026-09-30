# Brand and commercial pilot

## Position

**GCSE Study Desk** is the umbrella brand; Maths Foundation, Maths Higher and
English Language are the course choices. Lead with the learner outcome:
**Know what to revise. Fix what you missed.** The proof is the visible loop from
a quick check to a marked attempt, worked method and scheduled retry. Describe
practice as AQA-style and the product as independent. Do not promise grade gains,
complete specification coverage or official endorsement.

The service operator is Mayer Digital. Public support and privacy requests use
the support form.

The first narrow audience is an independent Year 11 learner taking AQA Maths
Foundation who is unsure what to revise next. Parents can help a learner find
the free beta, but the current product has no parent account or dashboard.
Higher Maths and English remain available without diluting the first campaign.

## Free beta acquisition test

The working plan, channel labels and paste-ready messages for the first 50
testers are in [`BETA_RECRUITMENT.md`](BETA_RECRUITMENT.md).

1. Invite a small, known group of learners and parents through channels where
   invitations are permitted. Give each channel a short `?src=` label (for
   example `?src=parent-group`). Do not attach names, emails or school data to
   the URL.
2. Send visitors to the homepage example or a relevant course guide. The
   example shows a worked method without an account; the real ten-question
   check and saved retries require sign-in.
3. Review aggregate source performance with
   `npm run acquisition:report -- 90`. Interview a few learners about where
   they hesitated and review support and beta feedback privately.
4. Improve the first session before increasing traffic: a visitor should be
   able to choose the right tier, finish a diagnostic, mark work and see a
   useful next step without help.

Before printing or paying to promote the name, [search the UK trade marks register](https://www.gov.uk/search-for-trademark)
for similar education services and check the intended domain and app-store names.

The practical measures are source-labelled signups, first-week diagnostic
completions, marked sessions, activation (both within seven days), and day-7
return among mature cohorts. A count of zero can reflect a tracking failure;
check instrumentation before treating it as learner behavior.

## Paid offer to validate, not publish yet

As of September 2026, free GCSE Maths papers and exam questions are available
from [Maths Genie](https://www.mathsgenie.co.uk/gcse/maths), while
[Seneca](https://help.senecalearning.com/en/articles/2483295-do-i-need-to-pay-how-does-seneca-make-money)
and [Save My Exams](https://www.savemyexams.com/learning-hub/support/why-pay-for-save-my-exams/)
offer free access with paid upgrades. This suggests that a generic question bank
alone is a weak paid pitch. The proposed distinction is the sequence that turns
a marked error into a clear next action and a later retry; buyer interviews
must test whether families value that sequence enough to pay.

Test the willingness to pay for **a calmer revision routine that turns mistakes
into the next week's plan**. Ask parents and learners separately what they
would pay for, what evidence they would need, and whether the current weekly
review and retries solve a repeated problem. Compare a simple monthly family
purchase with a fixed exam-season pass in interviews; do not quote an actual
price or create checkout until the offer, entitlements and refund terms are
defined.

The first paid candidate should deepen the demonstrated loop, for example
longer attempt history and guided weekly review. Keep a useful free path so a
learner can try the diagnostic, see marking and act on at least one mistake.
Do not sell access to an AI grade prediction or imply that paying improves exam
outcomes. A school licence is a later experiment because class management,
teacher controls and procurement support do not yet exist.

Before a paid or broad public launch, complete the Foundation and English
content audits. In particular, review the six new original contemporary Paper 1
sets and the Paper 2 non-fiction replacements, questions and model answers with
subject reviewers. Add rights-cleared published contemporary fiction if offering
validated mock simulation. Broaden Paper 2
practice with the modern text in Source A beyond its one current variation. Keep
English grade predictions off until assessment calibration supports them. Check
accessibility and safeguarding with real users, validate
support response operations, finalise the remaining privacy details, and
implement billing and entitlements with clear cancellation and refund behavior.
These are release requirements, not claims that the current beta already meets
them.
