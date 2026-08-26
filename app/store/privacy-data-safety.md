# App privacy and Data safety draft

This maps the August 2026 codebase, not every answer available in the store consoles. The release owner must verify the production backend, Supabase project, AI provider settings, SDK binary and provider contracts before submission.

## Data map

| Data | Collected/shared | Purpose | Linked to user | Storage/notes |
| --- | --- | --- | --- | --- |
| Email, username, user ID | Collected | Account management, authentication | Yes | Supabase/configured backend |
| Password | Transmitted to Supabase/auth backend for authentication | Account security | Yes | App does not intentionally retain plaintext password |
| Access/refresh session | Collected | Authentication | Yes | Device SecureStore; authentication service |
| Answers, written responses, results | Collected | App functionality, marking, progress | Yes | Backend; active device drafts also use AsyncStorage |
| XP, streak, accuracy, completed lessons | Collected | App functionality, personalisation | Yes | Backend |
| Active study session data | Collected | App functionality, resume/marking | Yes | Backend and device draft |
| Tutor messages | Collected when used | App functionality | Yes | Backend/configured AI processor; local transcript |
| English marking text | Collected when submitted | App functionality | Yes | Backend/configured AI processor |
| Subject/theme/reading preferences | Not collected by current app | App functionality | Potentially user-scoped on device | AsyncStorage only |
| Operational diagnostics, IP/user agent | Service providers may collect | Security, reliability | Potentially | Hosting/auth/database logs; verify production retention |

`Shared` has a store-specific meaning. Data sent to a service provider acting on the developer's behalf may qualify for an exception, but the release owner must confirm contracts and current Apple/Google definitions. Do not mark AI-provider transfer as exempt without that review.

## Apple App Privacy draft

Likely disclosure categories:

- Contact Info: Email Address, for app functionality/account management, linked to identity.
- User Content: Other User Content for answers, tutor text and English responses, for app functionality, linked to identity.
- Identifiers: User ID, for app functionality, linked to identity.
- Usage Data: Product Interaction for learning activity/progress, for app functionality, linked to identity.
- Diagnostics: only if production providers retain crash/performance/other diagnostic data in a way Apple defines as collected.

Tracking: **No** based on current app code. Advertising: **No**. The app has no advertising or cross-app tracking SDK. Recheck the release binary and all provider SDKs.

## Google Play Data safety draft

- Data collection: **Yes**.
- Data sharing: determine after processor-contract review, especially configured AI processing.
- Data encrypted in transit: **Yes**, provided every production endpoint uses valid HTTPS; verify before answering.
- Users can request deletion: **Yes only after** the production `DELETE /api/auth/account` endpoint is deployed and tested through the public deletion page.
- Account creation: **Yes**; publish the deletion URL in Play Console.
- Optional data: tutor and English AI text are optional because users choose those features. Core account and learning data are required for the account-based service.
- Ephemeral processing: do not claim it for submitted learning or AI text unless production evidence proves the relevant data is only held in memory and not logged.
- Independent security review: **not established**.

## Device privacy/permissions

- Current Expo configuration requests no custom Android permissions; networking is a normal platform capability. Review the generated merged manifest because dependencies can contribute entries.
- iOS declares no non-exempt encryption: the app uses standard OS/network encryption and does not implement proprietary cryptography. Confirm this remains true for the binary.
- The iOS privacy manifest declares UserDefaults reason `CA92.1`, consistent with app preferences. Run Apple's privacy report and inspect dependency manifests before submission.
- No location, contacts, photos, camera, microphone, health, advertising ID or notification capability is selected in current app configuration.
