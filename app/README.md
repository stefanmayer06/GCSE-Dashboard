# GCSE Study Desk mobile

Expo + React Native app for the independent GCSE Study Desk product on iOS and Android. It includes Supabase email/password accounts, Maths Foundation, Maths Higher and English learning, practice and paper sessions, local draft recovery, progress, results, and optional tutor/English AI feedback. Course material is aligned to AQA structures; this product is not endorsed by AQA.

## Setup

1. Install dependencies with `npm install`.
2. Copy the names from `.env.example` into a local `.env` and provide the public API origin, website origin, Supabase URL, and Supabase publishable key. Never use a service-role key in the app.
3. Run `npm start`, `npm run ios`, or `npm run android`.

`EXPO_PUBLIC_API_URL` is an origin such as `https://study.example.com`, without `/api`. `EXPO_PUBLIC_WEBSITE_URL` is the public origin hosting privacy, support and deletion pages. Sessions use SecureStore and are split into chunks before storage. Preferences, tutor notebooks, practice drafts and recent result views use AsyncStorage; they are device-local. TanStack Query's learning-content cache is in memory only.

The app and API must use the same Supabase project: `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` must correspond to the API's `SUPABASE_URL` and public key. Account creation returns an immediately usable session when **Confirm email** is disabled in Supabase Auth. When confirmation is enabled, the app sends the learner to the confirmation screen and the account becomes usable after email confirmation.

## Links and releases

The custom scheme is `gcsestudydesk://`; password recovery resolves to `gcsestudydesk://auth/recover`. Add production `ios.associatedDomains` and Android `intentFilters` only after a verified HTTPS domain and hosted association files exist. The placeholders are documented rather than shipping unverifiable universal links.

Identifiers are `com.gcsestudydesk.app`. EAS development, preview and production profiles reference corresponding EAS environments; production auto-increments store versions remotely. Configure real EAS environment values before building. Marketplace drafts and the external-prerequisite checklist are in [`store/`](store/); they do not replace store-console, device-QA or legal work.

## Quality

Run `npm run lint`, `npm run typecheck`, `npm test`, and `npm run doctor`.

For a production build, run `eas build --platform ios --profile production` and `eas build --platform android --profile production` after `eas init`, signing setup, and production environment configuration. Do not add placeholder Expo owner/project IDs to `app.json`.
