# Marketplace review notes and demo-account template

Paste only completed, current information into private review fields. Never commit a password here.

## Review notes draft

GCSE Study Desk is an independent GCSE revision app for Maths Foundation, Maths Higher and English Language. It is not endorsed by AQA.

An account is required because progress, active study sessions and marking are user-scoped. Email/password is the only shipping sign-in method; Sign in with Apple is not offered or enabled.

After sign-in:

1. The Today tab summarises progress and suggested work.
2. Learn lists course topics and lessons.
3. Practice starts topic, paper-style or mixed sessions. Starting and submitting need a network connection; draft answers remain on the device while unfinished.
4. Tutor sends learner-entered text to the configured backend and AI provider. It can be cleared and is optional.
5. Settings changes course/appearance and signs out.

AI tutor and English marking output is revision guidance, may be inaccurate, and is not an official grade. If AI processing is unavailable, describe the expected reviewer experience here: `[RELEASE_OWNER_TO_CONFIRM]`.

Account deletion is available outside the app at `[PRODUCTION_WEBSITE_URL]/delete-account.html`. The page reauthenticates by email/password, holds the bearer token only in memory and calls the authenticated deletion endpoint. **Do not submit until that endpoint passes production testing.**

## Private demo account template

- Email: `[DEMO_EMAIL_ENTER_IN_CONSOLE_ONLY]`
- Password: `[DEMO_PASSWORD_ENTER_IN_CONSOLE_ONLY]`
- Username: `[DEMO_USERNAME]`
- Account confirmed: `[YES/NO]`
- Seeded state: `[DESCRIBE REPRESENTATIVE PROGRESS]`
- Special instructions: `[ANY OUTAGE OR FEATURE NOTES]`
- Reviewer contact: `[MONITORED_NAME / PHONE / EMAIL]`

Reset the demo account after review and ensure it contains no personal learner data.
