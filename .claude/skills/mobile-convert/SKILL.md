---
name: mobile-convert
description: "Use when converting a web app into iOS + Android apps, or keeping a web app and its mobile app in step. Bretton's chosen structure (Option B): one shared core used by both, the existing web front end kept as is, an Expo (React Native) app beside it, platform-specific files, mobile-only features behind flags, both builds tested on every change, and a parity manifest so web changes reach mobile."
---

# Make it a mobile app (Option B: shared core + two front ends)

Goal: real native iOS and Android apps built from the same logic as the web app, so a change made once reaches both, and mobile-only features can never break the web app.

## Official Expo skills
Mobile runs also get Expo's own skills (`expo-*`, `eas-*`). Use them for the details: `expo-web-to-native` (porting web screens), `expo-project-structure`, `expo-router`, `expo-native-ui`, `expo-data-fetching`, `eas-update`, `eas-workflows`, `eas-app-stores`. This skill decides the structure; theirs decide the Expo specifics. Where they disagree on structure, this one wins.

## The structure (follow it exactly)
```
packages/core/          shared by web + mobile: API client, types, validation, business rules,
                        state/stores, copy (strings), design tokens. NO DOM, NO React Native imports.
apps/web/  (or the existing web folder; do not move it unless the task says so)
apps/mobile/            Expo app (Expo Router, TypeScript), imports @app/core
.hub/parity.json        feature map web <-> mobile (see below)
```
- Use the repo's package manager workspaces (npm/yarn/pnpm) so both apps import `@app/core` (pick a scoped name from the repo, e.g. `@mdj/core`).
- Move logic into `packages/core` by **extracting**, not rewriting: lift API calls, types, validation and rules out of the web app, then point the web app at core. The web app must behave exactly as before; prove it with its existing tests/build plus a quick browser check (Playwright).
- Never import `react-native`, `expo-*` or browser-only APIs (`window`, `document`, `localStorage`) inside `packages/core`. Put platform access behind small adapters (`storage`, `notifications`, `haptics`) that each app provides.

## Platform-specific code
- Same component, different behavior → `Name.web.tsx` + `Name.native.tsx` (or `Name.tsx` + `Name.native.tsx`). Each bundler only loads its own.
- Mobile-only features (push, camera, haptics, offline queue, biometrics, widgets) live only in `apps/mobile` and are switched by `packages/core/flags.ts` capabilities: `{ push: Platform.OS !== "web", ... }`. The web build never imports them.
- Web-only features (SEO pages, admin tables, marketing) stay in the web app. Mark them `web-only` in the parity manifest so mobile doesn't try to copy them.

## Parity manifest `.hub/parity.json`
```json
{ "version": 1,
  "features": [
    { "id": "date-ideas", "web": "app/ideas", "mobile": "apps/mobile/app/(tabs)/ideas.tsx", "status": "both" },
    { "id": "admin-reports", "web": "app/admin", "status": "web-only" },
    { "id": "push-reminders", "mobile": "apps/mobile/src/push.ts", "status": "mobile-only" },
    { "id": "jar-sharing", "web": "app/share", "status": "web-done-mobile-todo" } ] }
```
Update it in every run that adds, changes or removes a feature. The hub reads it to start "Bring to mobile" runs.

## Mobile app defaults
- Expo SDK current stable, Expo Router, TypeScript, `eas.json` with `development`, `preview` (internal distribution, channel `preview`) and `production` profiles, `expo-updates` configured so the hub can publish preview updates per PR.
- App identity from the project: iOS `bundleIdentifier` and Android `package` like `com.<company>.<app>`; ask (list under "## Needs approval") only if the brand isn't obvious.
- Native touches stores expect: icon + splash, safe areas, dark mode, deep links (same paths as the web routes), offline-friendly loading and error states, push notifications if the product benefits.
- Accessibility: labels on every touchable, 44pt touch targets, dynamic type.

## When the repo already has a separate mobile app (e.g. My Date Jar)
Don't delete it. Assess it, list what's worth keeping (screens, native modules, store identifiers, signing setup), bring those into `apps/mobile`, and note the old repo's status in HANDOFF. Keeping the existing bundle ID/package keeps the store listing and its reviews.

## Every run, before you finish
1. Web: install, build, run its tests. It must behave exactly as before.
2. Mobile: `npx expo-doctor`, `npx tsc --noEmit`, and `npx expo export --platform android` (catches bundling errors without a device).
3. Update `.hub/parity.json` and HANDOFF (which features exist where, what's left).
4. Never submit to a store or change signing credentials; list those under "## Needs approval".

## Bringing a web change to mobile (parity runs)
Read the web PR's diff and summary, then:
- If the change lives in `packages/core` → mobile already has it; verify the screens that use it.
- If it's a web screen change → make the equivalent mobile change using native patterns, not a copy of the web layout.
- If it's web-only by nature → mark it `web-only` in parity.json, change nothing else, and say why.
