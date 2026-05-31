# CLAUDE.md

Guidance for Claude Code when working in this repository.

## Commands

```bash
npm run dev          # Start dev server (http://localhost:3000/nanny/)
npm run build        # TypeScript check + Vite production build
npm run deploy       # Build + push to GitHub Pages (gh-pages branch)
```

Live URL: **https://eyalsharon.github.io/nanny/**

## Feature Development Workflow

Every new feature is built in a separate git worktree so `main` stays deployable.

```bash
# Start a new feature
git worktree add ../nanny-<feature> -b feature/<feature>

# Work in the worktree (separate directory, same repo)
cd ../nanny-<feature>
npm install   # only needed if package.json changed
npm run dev

# When done, merge back to main
cd ../nanny
git merge feature/<feature>
git worktree remove ../nanny-<feature>
git branch -d feature/<feature>

# Deploy
npm run deploy
```

Active worktrees: none yet.

## Architecture

**React + Vite SPA** deployed as a **PWA** (installable on iOS/Android via Safari → Add to Home Screen).

All data lives in `localStorage` — no backend, no API. Data version is tracked in `storage.ts` (`VERSION` constant); bump it on any breaking model change to auto-wipe stale data.

### Auth

Username + PIN login. Role is inferred:
- Matches `parentAccounts[]` → Parent (full access)
- Matches `workers[].username` → Worker (own data only)

Default credentials: `eyal` / `1234` (parent), `lisa` / `0000` (nanny)

### Key Files

| File | Purpose |
|---|---|
| `src/types.ts` | All TypeScript types (`Worker`, `WorkEntry`, `Payment`, `ParentAccount`, `Session`) |
| `src/lib/storage.ts` | `loadData` / `saveData` + seed data + version migration |
| `src/lib/utils.ts` | `computeHours`, `computeGross`, `formatCurrency`, `exportToCSV` |
| `src/hooks/useAppData.ts` | All state, CRUD, `checkLogin`, `balanceForWorker` |
| `src/context/AppContext.tsx` | React context wrapping `useAppData` + session management |
| `src/components/Layout.tsx` | Sidebar (desktop) + bottom nav (mobile) + FAB for workers |
| `src/components/ui.tsx` | Shared UI primitives: `Card`, `Button`, `Input`, `Select`, `Badge`, etc. |
| `src/pages/CalendarPage.tsx` | **Home page** — monthly calendar, colored day chips, payment actions |
| `src/pages/DashboardPage.tsx` | Parent-only stats + Recharts bar charts |

### Data Model (brief)

```
ParentAccount  { id, name, username, pin }
Worker         { id, username, pin, name, doesCare, doesCleaning,
                 careRate, cleaningRate, nightRate, overtimeMultiplier, ... }
WorkEntry      { id, workerId, date, startTime, endTime,
                 workType ('baby_care'|'cleaning'), shiftType ('day'|'night'),
                 hoursWorked, grossAmount, createdBy }
Payment        { id, workerId, date, amount, method, periodStart, periodEnd,
                 notes?, imageDataUrl? }
```

### Pay Calculation

```
dayRate  = workType === 'cleaning' ? worker.cleaningRate : worker.careRate
rate     = shiftType === 'night'   ? worker.nightRate    : dayRate
gross    = min(hours, 8) × rate  +  max(hours − 8, 0) × rate × overtimeMultiplier
```

### Calendar Color Logic

A worked day chip is **green** if any payment for that worker has `periodStart ≤ date ≤ periodEnd`, otherwise **amber**.

### Routing

| Route | Access | Page |
|---|---|---|
| `/login` | Public | Login |
| `/` | Both | Calendar (home) |
| `/dashboard` | Parent | Dashboard + charts |
| `/hours` | Both | Work entry list |
| `/hours/new` | Both | Log / edit hours |
| `/workers` | Parent | Worker list |
| `/workers/:id` | Both | Worker detail + history |
| `/payments` | Parent | Payments (supports `?workerId&periodStart&periodEnd` prefill from calendar) |
| `/settings` | Parent | Parent accounts, CSV export |
