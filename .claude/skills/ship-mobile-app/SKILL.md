---
name: "ship-mobile-app"
description: "Ship a mobile app to the Apple App Store and/or Google Play — signing, builds, store listings, testing tracks, and submission. Use when releasing or updating an iOS/Android app, especially from Windows via Expo EAS."
---

# Ship a Mobile App to the App Stores

Guides releasing an iOS and/or Android app to the **Apple App Store** and **Google Play**. Written for a solo developer who often works on **Windows**, so it favors cloud builds (Expo EAS) where a Mac would otherwise be required.

## First, establish the situation

Before doing anything, confirm:

1. **Framework** — Expo/React Native, Flutter, or native (Swift/Kotlin). This determines the build tooling.
2. **Which stores** — Apple, Google, or both.
3. **New app or update** — first-ever submission (needs listings, review) vs a version bump.
4. **Dev OS** — if Windows and iOS is a target, plan for a cloud macOS build (EAS, Codemagic, or GitHub Actions macOS runner); iOS cannot be built or submitted from Windows directly.
5. **Accounts** — Apple Developer Program membership ($99/yr) for iOS; Google Play Developer account ($25 one-time) for Android. These are the user's to create and pay for.

**Credential rule:** never enter the user's Apple/Google passwords, API keys, signing certificates, or payment details yourself. Generate the config and commands; the user supplies secrets in their own accounts.

## Recommended path for Expo / React Native (works from Windows)

Expo Application Services (EAS) builds and submits both platforms in the cloud.

1. **Install & login:** `npm i -g eas-cli`, then `eas login`.
2. **Configure:** `eas build:configure` — creates `eas.json` with build profiles (development, preview, production).
3. **Set app identifiers** in `app.json`/`app.config.js`: iOS `bundleIdentifier` (e.g. `com.ktsapps.myapp`) and Android `package`. Bump `version` and the native build numbers (`ios.buildNumber`, `android.versionCode`) on every submission.
4. **Build production binaries:**
   - iOS: `eas build --platform ios --profile production` (EAS handles signing certs & provisioning if you let it manage credentials).
   - Android: `eas build --platform android --profile production` (produces a signed `.aab`).
5. **Submit to the stores:**
   - iOS: `eas submit --platform ios` (uploads to App Store Connect; needs an App Store Connect API key the user generates).
   - Android: `eas submit --platform android` (needs a Google Play service-account JSON the user generates in the Play Console).

## Flutter / native path

- **Android:** build a signed App Bundle (`flutter build appbundle` or Gradle), using an upload keystore the user creates and keeps safe. Upload the `.aab` to the Play Console.
- **iOS:** requires macOS + Xcode. From Windows, use a cloud macOS runner (Codemagic, GitHub Actions `macos-latest`, or EAS for RN). Archive, sign with the distribution certificate + provisioning profile, and upload via Xcode Organizer, `xcrun altool`/`notarytool`, or Transporter.

## Apple App Store — first submission checklist

- App registered in **App Store Connect** with the matching bundle ID.
- **Signing:** distribution certificate + App Store provisioning profile (EAS can manage these).
- **Listing:** name, subtitle, description, keywords, support URL, privacy policy URL.
- **Screenshots** for required device sizes; app icon (1024×1024, no alpha).
- **App Privacy** questionnaire (data collection disclosure) completed.
- **TestFlight** for beta testing before public release (recommended).
- Submit for **App Review**; respond to any rejections (common causes: incomplete metadata, crashes, privacy issues, guideline 4.x design).

## Google Play — first submission checklist

- App created in the **Play Console** with the matching package name.
- **Signing:** enroll in Play App Signing; keep your upload key backed up.
- **Listing:** title, short & full description, feature graphic, screenshots, app icon (512×512).
- **Content rating** questionnaire, **Data safety** form, target audience, and privacy policy URL.
- Roll out via **Internal testing → Closed → Open → Production** tracks; start internal to catch issues.
- First production release for a new account may face extended review.

## Versioning discipline

Every store submission needs a higher build number than the last accepted one:
- iOS: increment `buildNumber` (and `version` for user-facing releases).
- Android: increment `versionCode` (and `versionName` for user-facing releases).

## Common failure modes

- Forgetting to bump the build number → store rejects the binary as a duplicate.
- iOS build attempted on Windows → must use a cloud macOS build.
- Missing privacy policy URL → both stores reject.
- Expired certificates/provisioning profiles → let EAS manage credentials, or renew in the Apple Developer portal.
- Debug/test keys used for a production Android build → use the real upload keystore / Play App Signing.

## Hand-off

After submission, report: which store(s), the version/build submitted, the testing track or review status, and exactly what the user still needs to do manually (accept an agreement, answer a review question, promote a track to production).

