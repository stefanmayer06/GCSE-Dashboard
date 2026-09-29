# Marketplace review notes and demo-account template

Paste only completed, current information into private review fields. Never commit a password here.

## Review notes draft

GCSE Study Desk is an independent GCSE revision app for Maths Foundation, Maths Higher and English Language. It is not endorsed by AQA.

The service is operated by Mayer Digital. Public support and privacy requests
use the support form at `[PRODUCTION_WEBSITE_URL]/support.html#contact`.

An account is required because progress, active study sessions and marking are user-scoped. Email/password is the only shipping sign-in method; Sign in with Apple is not offered or enabled.

After sign-in:

1. Home shows overall status across all three study areas plus a next step, then opens Foundation, Higher and English desks separately.
2. Today tab shows the selected subject's desk only: next move, four honest numbers, 7-day plan, mastery trail, timed papers and milestones. Selecting a subject on the Subjects tab switches the whole desk (Today, Learn, Practice, Tutor) to that subject; the tab bar stays the same.
3. Learn lists course topics and lessons for the active subject; English also shows the source library.
4. Practice starts topic, paper-style or mixed sessions. Starting and submitting need a network connection; draft answers remain on the device while unfinished.
5. Tutor sends learner-entered text to the configured backend and AI provider. It can be cleared and is optional.
6. Feedback (in-app, no sign-in required for the endpoint) sends role/subject/rating/message to the rate-limited public API.
7. Settings changes course/appearance/exam plan and signs out. Settings also deletes the account in-app.

AI tutor and English marking output is revision guidance, may be inaccurate, and is not an official grade. Without an AI key learners still receive rubrics and model answers for self-marking. If AI processing is unavailable, describe the expected reviewer experience here: `[RELEASE_OWNER_TO_CONFIRM]`.

Account deletion is available in-app at Settings → Delete account (type DELETE, calls authenticated `DELETE /api/auth/account`, clears disposable device data, signs out) and on the web at `[PRODUCTION_WEBSITE_URL]/delete-account.html`. The web page reauthenticates by email/password, holds the bearer token only in memory and calls the same endpoint. **Do not submit until that endpoint passes production testing.**

## Private demo account template

- Email: `[DEMO_EMAIL_ENTER_IN_CONSOLE_ONLY]`
- Password: `[DEMO_PASSWORD_ENTER_IN_CONSOLE_ONLY]`
- Username: `[DEMO_USERNAME]`
- Account confirmed: `[YES/NO]`
- Seeded state: `[DESCRIBE REPRESENTATIVE PROGRESS]`
- Special instructions: `[ANY OUTAGE OR FEATURE NOTES]`
- Reviewer contact: `[MONITORED_NAME / PHONE / EMAIL]`

Reset the demo account after review and ensure it contains no personal learner data.
