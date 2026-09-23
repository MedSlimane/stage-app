# Stage

Personal, mobile-first PFE internship workspace built with Next.js and Convex. Browse evidence-backed opportunities, filter by geography and timing, save roles, track applications, keep notes and read dated research PDFs. Install it from the browser menu or iPhone Share → Add to Home Screen.

## What's inside

- **Today**: a dashboard with a greeting, new-since-last-visit count, an agenda of follow-ups, next steps and upcoming deadlines, top unsaved picks, your funnel, a region breakdown and recent stage changes.
- **Discover and Saved**: fit scores, "New" badges, skill chips, deadline sorting, list or grid layout, and search across your notes.
- **Pipeline**: a drag-and-drop board. Every card shows priority, checklist progress, the next step and its follow-up date. Stage changes are logged on the server.
- **Role detail**: a stage stepper, 0–3 priority, an application checklist, a next step with a follow-up date, notes that save as you type, previous/next navigation and a copyable link (`/?role=PFE-…`).
- **Compare**: up to three roles side by side.
- **Command menu** (⌘K / Ctrl+K), keyboard shortcuts (`?` lists them), a light/dark/system theme, CSV export and a calendar export (`.ics`) of follow-ups and deadlines.

## Local demo mode

`STAGE_DEMO=true npm run dev` serves fictional opportunities from memory, so you can work on the UI without Convex credentials. Edits last until the server restarts. Demo mode is always off on Vercel.

## Data and daily updates

The source CSV is `/Users/slimane/Documents/Internship-Search/opportunities.csv`. Reports live under `reports/YYYY-MM-DD/internship-report.pdf` beside that CSV. The existing Codex automation **Daily PFE internship search** runs at 09:00 Africa/Tunis. Its final step runs `npm run sync` here, after saving research locally.

The importer validates stable PFE IDs, upserts opportunities and uploads PDFs to Convex storage. Application stages, bookmarks and notes live in a separate table and are preserved. Imports checkpoint progress, retry transient CLI failures and skip unchanged content. A successful run writes `internal/convex-sync-latest.json` in the research folder. Failed runs retain local reports and should trigger an automation notification. Research requires the Mac/Codex automation to run; the hosted app remains readable independently with the last uploaded data.

```sh
npm ci
npm run dev
npm run lint
npm run build
npm run sync
npm run sync -- --force
```

`--force` refreshes opportunity rows without resetting personal progress. Convex CLI authentication is required on the computer doing the upload. The configured cloud deployment is `wandering-spaniel-227` (EU), in the `stage-internships` project. It was created using the Convex CLI. Backend changes are deployed with `npx convex dev --once`. **The application tracker adds optional fields to `progress` (priority, tasks, nextStep, followUp, history). Deploy the Convex functions before deploying the web app.** Until you do, saving fails because the old mutation rejects the new arguments. Existing rows stay valid.

## Configuration and access

`.env.local` is private and excluded from Git and deployment uploads. It contains `CONVEX_DEPLOYMENT`, `NEXT_PUBLIC_CONVEX_URL`, `WORKSPACE_SECRET`, `STAGE_ACCESS_CODE` and `INTERNSHIP_DATA_DIR`. The workspace secret must also be configured in Convex. `STAGE_LOCAL_ONLY=true` permits access only for the default loopback development setup; it is ignored on Vercel. Hosted deployments require the access code, issue a secure HTTP-only session cookie and keep the Convex secret on the server. The hosted URL and personal access code are in local `ACCESS.md`.

The PWA caches previously viewed data on the device for offline reading. Editing requires a connection. PDFs are available offline after opening them online. Use Profile → Lock workspace to clear this device’s offline data. Installability requires HTTPS. Do not share the access code or use this single-person app as a multi-user service.

The importer and account state are intentionally separate. Do not use destructive table replacement for daily CSV imports. Keep `.sync/state.json` on the Mac; if a process is killed, confirm it has stopped before removing a stale `.sync/lock`.
