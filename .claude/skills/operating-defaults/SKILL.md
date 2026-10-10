---
name: "operating-defaults"
description: "Use at the start of any app/feature build, deployment, or design task, and when planning how to execute work. Encodes the user's standing preferences: run lean and reuse what already exists (skills, code, prior work) instead of rebuilding; hold a high creative design bar; and always provide a previewable URL for web apps (and an equivalent install/preview path for iOS/Android mobile) in sandbox and staging."
---

# Operating Defaults

Standing preferences for how to execute work for this user. Apply these before and during any build, deploy, or design task.

## 1. Run lean — reuse before building

Do not rebuild what already exists. Before writing new code, creating a new skill, or standing up new infrastructure:

- **Check installed skills first** and use them instead of hand-rolling. Known coverage:
  - Lean, role-based, cost-minimized builds → `agent-dev-team`
  - Web deploy (staging, custom domain, DB, CI/CD, debugging) → `app-launch-pipeline`
  - Migrating a vibe-coded app onto owned infra → `deployasst`
  - Mobile release (iOS/Android, signing, test tracks) → `ship-mobile-app`
  - Design/theming → `theme-factory`, `ui-ux-pro-max`, `apple-design`, `emil-design-eng`, `canvas-design`
  - Post-launch prioritization → `post-launch-roadmap`
  - Memory upkeep → `consolidate-memory`
- **Check for existing code, artifacts, repos, and prior deliverables** and extend them rather than starting from scratch.
- Prefer the smallest change that meets the goal. Avoid scaffolding, dependencies, and services that aren't needed yet.
- When tempted to create a new skill, confirm no installed skill already covers it.

## 2. Continuity — don't start from scratch each session

- At the start of a session, review saved skills (they persist across sessions) and any project notes/state files in the working folder to recover context.
- Persist durable decisions, preferences, and project state so future sessions can pick up: record them in a project notes file (e.g. `PROJECT.md` / `DECISIONS.md`) inside the connected working folder, or fold lasting preferences into a saved skill.
- Note: this environment does not always have an auto-memory store wired up; saved skills and files in the connected folder are the reliable persistence mechanisms. Prefer those.

## 3. Hold a high creative design bar

- Default to polished, intentional visual design rather than generic output. Pull from `ui-ux-pro-max` (styles, palettes, font pairings), `theme-factory` (cohesive themes), and `apple-design` / `emil-design-eng` (motion, interaction polish).
- Choose a deliberate style/theme per project and apply it consistently across screens and artifacts.

## 4. Always provide a preview

Every buildable deliverable should be viewable without extra effort from the user.

- **Web apps:** provide a previewable URL at every stage — a running dev/sandbox URL during development and a staging URL before production. Use the deploy skills (`app-launch-pipeline`, `deployasst`); platforms like DigitalOcean App Platform, Netlify, Vercel, and Railway issue per-deploy preview/staging URLs. If serving from the sandbox, run the dev server and surface the accessible URL.
- **Mobile (iOS/Android):** provide the equivalent — an install/preview path rather than a web URL. Use `ship-mobile-app`: Expo Go / EAS Update preview links (and QR) for dev, and internal test tracks (TestFlight for iOS, Google Play internal testing for Android) for staging.
- State the preview URL/link explicitly in the response whenever one is produced.

