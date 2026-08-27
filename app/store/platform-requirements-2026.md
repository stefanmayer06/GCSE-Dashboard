# Platform requirements snapshot: 26 August 2026

Requirements change. The release owner must recheck the linked official pages and both consoles on submission day.

## Apple

- Apple publishes current upload SDK minimums under **Upcoming Requirements**. Confirm the production EAS image/Xcode version satisfies the requirement active on submission day: <https://developer.apple.com/news/upcoming-requirements/>
- App privacy details are required in App Store Connect and must cover the developer and third-party partners: <https://developer.apple.com/app-store/app-privacy-details/>
- Required-reason API declarations and privacy manifests apply to listed APIs and covered third-party SDKs: <https://developer.apple.com/documentation/bundleresources/privacy_manifest_files>
- Apps that support account creation must let users initiate account deletion. This project supplies a web deletion route, but reviewer acceptance and production endpoint behaviour must be verified: <https://developer.apple.com/support/offering-account-deletion-in-your-app/>
- App Review Guidelines, including children, privacy, sign-in and accurate metadata: <https://developer.apple.com/app-store/review/guidelines/>
- Screenshot specifications: <https://developer.apple.com/help/app-store-connect/reference/screenshot-specifications>

## Google Play

- By 31 August 2026, Google Play's target API policy requires new apps and updates to target Android 16 / API level 36, subject to Google's published exceptions and any later policy update. This Expo config targets/compiles API 36: <https://support.google.com/googleplay/android-developer/answer/11926878>
- User Data policy, including prominent disclosure and account-deletion expectations: <https://support.google.com/googleplay/android-developer/answer/10144311>
- Data safety form guidance: <https://support.google.com/googleplay/android-developer/answer/10787469>
- Apps with accounts must provide an in-app path and a web resource for account/data deletion. Verify the current form and deletion URL requirements: <https://support.google.com/googleplay/android-developer/answer/13327111>
- Target audience and Families guidance: <https://support.google.com/googleplay/android-developer/answer/9285070>
- Store listing graphic requirements: <https://support.google.com/googleplay/android-developer/answer/9866151>
- App testing requirements for certain personal developer accounts must be checked against account status: <https://support.google.com/googleplay/android-developer/answer/14151465>

## Project interpretation

- Expo SDK 57 / React Native 0.86 is configured with Android compile/target SDK 36 and minimum SDK 24. Run `npx expo-doctor@latest`, inspect EAS image output, and confirm store acceptance rather than relying only on static config.
- iOS uses standard HTTPS/Supabase cryptography and declares `usesNonExemptEncryption: false`; re-answer export compliance if cryptographic behaviour changes.
- Sign in with Apple is deliberately not enabled because the shipping app offers first-party email/password only, not a third-party/social login.
- `owner` and `extra.eas.projectId` are absent intentionally. Add only real values created for the release owner's Expo account/project.
