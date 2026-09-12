# Verification — 12 September 2026

Live app: https://stage-internships.vercel.app

- Next.js production build, TypeScript and ESLint pass locally; Vercel production build succeeds.
- Hosted workspace returns 401 without a session. Access-code login succeeds and sets a Secure, HttpOnly cookie. Cross-origin mutation attempts return 403.
- Cloud snapshot contains 58 opportunities and six PDF reports. The latest PDF downloads with a valid PDF signature.
- Real browser checks cover login, search geography, report navigation, saved roles, notes, application stages and locking. Tunisia currently filters to seven non-closed records. No browser page errors were observed.
- Mobile views checked at 320 and 390 pixels, with no horizontal document overflow. Desktop, detail, reports and pipeline screenshots are retained locally under output/playwright.
- Forced CSV import preserves the entire progress table unchanged. Repeating the importer does not duplicate report uploads. Temporary test notes and bookmarks were cleared.
- A clean browser first visit caches 13 shell assets. With uncached network requests confirmed blocked, reload still displays opportunities; the workspace response carries X-Stage-Offline: 1, the UI shows Offline snapshot and save controls are disabled.
- Locking clears local workspace data and the workspace response cache, and protected requests again return 401.
- The existing daily Codex heartbeat now runs npm run sync after completing the CSV and dated PDF. The latest successful sync log is in /Users/slimane/Documents/Internship-Search/internal/convex-sync-latest.json.

Limitations: browser tests used Chromium with mobile viewport sizes, not a physical iPhone. Daily research depends on the Mac/Codex automation being able to run; hosted reading remains available using the last uploaded data. Convex currently uses the persistent EU dev/main deployment created through the CLI.
