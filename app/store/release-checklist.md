# Marketplace release checklist

## Code and configuration

- [ ] Set production `EXPO_PUBLIC_API_URL`, `EXPO_PUBLIC_WEBSITE_URL`, `EXPO_PUBLIC_SUPABASE_URL` and publishable key in the EAS `production` environment. Never put a service-role key in an `EXPO_PUBLIC_*` variable.
- [ ] Deploy HTTPS website/API origins and test sign-up, confirmation, sign-in, reset/recovery and sign-out on physical iOS and Android devices.
- [ ] Implement/deploy and integration-test authenticated `DELETE /api/auth/account`; verify auth user, progress, responses, tutor history and active sessions are deleted.
- [ ] Publish `/privacy.html`, `/support.html` and `/delete-account.html`; replace support/owner placeholders.
- [ ] Confirm production CORS, redirects, Supabase redirect allow-list and password-recovery deep link.
- [ ] Run `npm run lint`, `npm run typecheck`, `npm test`, `npm run doctor`, then create production EAS builds.
- [ ] Inspect generated iOS privacy report and Android merged manifest; compare them with `privacy-data-safety.md`.
- [ ] Test accessibility, Dynamic Type/text scaling, dark mode, poor/no network, expired sessions and destructive actions.

## External prerequisites: release owner

- [ ] Active Apple Developer Program and Google Play Console accounts with agreements, tax/banking and organisation identity completed.
- [ ] Signing credentials, App Store Connect app record, Play app record and Play App Signing configured.
- [ ] EAS project created and linked. Add real `owner` and `extra.eas.projectId` only through `eas init`/documented values; do not ship fake IDs.
- [ ] Monitored support email, privacy contact route, legal owner/copyright and production URLs available.
- [ ] UK privacy, children's-data, safeguarding, processor/transfer, terms and AI-disclosure review completed by qualified reviewers.
- [ ] Supabase, hosting/database and AI-provider agreements, regions, subprocessors, retention and deletion behaviour verified.
- [ ] Final icon, feature graphic, screenshots and optional previews produced from the release binary without real learner data.
- [ ] Store privacy, Data safety, age rating, target audience, content rating, app access and encryption/export forms completed in each console.
- [ ] Private demo account created with representative non-personal test data and credentials entered only in private review fields.
- [ ] Physical-device QA completed across supported OS/device sizes; TestFlight and Play closed testing feedback resolved.

## Submission and operations

- [ ] Confirm version/build numbers, target SDK, release notes, territories, pricing and phased/staged release choices.
- [ ] Submit builds and answer reviewer questions; do not describe AI feedback as an official mark.
- [ ] Verify production support and deletion routes after release.
- [ ] Monitor authentication/API reliability and support requests; define incident, backup expiry and account-deletion response procedures.
- [ ] Revisit policies and store questionnaires whenever data, SDKs, processors or features change.
