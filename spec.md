# Nanny Tracker — Full Product Spec

## Overview

A client-only **Progressive Web App (PWA)** for tracking worker hours, calculating pay based on per-worker rates, and recording payments. Installable on iOS and Android from the browser — no App Store needed.

Two roles: **Parent** (admin) and **Worker** (nanny or cleaner). Role is inferred automatically from the username at login — no role selector.

---

## Tech Stack

| Concern | Choice | Notes |
|---|---|---|
| Framework | React + Vite (SPA + PWA) | Static build, deployable to GitHub Pages |
| PWA | `vite-plugin-pwa` | Service worker + manifest → installable on iOS/Android |
| Routing | React Router v6 | Client-side routing |
| State / persistence | localStorage | No backend; all data lives on the device |
| Auth | Username + PIN | Each worker has credentials in their profile; parent has a separate account |
| Styling | Tailwind CSS | Minimal, white background, mobile-first |
| Charts | Recharts | Dashboard visualizations |
| Hosting | GitHub Pages | `npm run deploy` → `vite build && gh-pages -d dist` |
| Language | English |  |

### PWA / iOS
- Safari → Share → "Add to Home Screen" → runs full-screen like a native app
- Works offline (localStorage + service worker)
- No App Store submission required

---

## Worker Types

| Type | Work they do |
|---|---|
| **Nanny** | Baby care only |
| **Cleaner** | Cleaning only |

Workers do **one type only**. There is no "both" option. The work type of an entry is implicit from the worker's type.

---

## Roles & Permissions

| Feature | Parent | Worker (own data) |
|---|---|---|
| Dashboard | ✅ | — |
| Calendar | ✅ (any worker) | ✅ (own only) |
| View hours | ✅ (all workers) | ✅ (own only) |
| Log hours | ✅ (any worker, any date) | ✅ (today + past 7 days) |
| Edit/delete hours | ✅ | — |
| View balance & payments | ✅ | ✅ (own only) |
| Record payments | ✅ | — |
| Manage workers | ✅ | — |
| Settings | ✅ | — |

---

## Data Model

### Worker
```
id: string
username: string          // used for login
pin: string               // used for login
name: string
phone?: string
startDate: date
isActive: boolean
workerType: 'nanny' | 'cleaner'
dayRate: number           // ₪/h for day shifts
nightRate: number         // ₪/h for night shifts
overtimeMultiplier: number  // applied to hours > 8/day (default 1.25)
```

### WorkEntry
```
id: string
workerId: string
date: date
startTime: 'HH:mm'
endTime: 'HH:mm'
shiftType: 'day' | 'night'   // selected manually; determines which rate applies
hoursWorked: number           // computed: endTime − startTime
grossAmount: number           // computed: hours × rate (+ overtime)
notes?: string
createdBy: string             // username of who logged it
```

Pay calculation:
- `rate = shiftType === 'night' ? worker.nightRate : worker.dayRate`
- `gross = min(hours, 8) × rate + max(hours − 8, 0) × rate × overtimeMultiplier`

### Payment
```
id: string
workerId: string
date: date
amount: number
method: 'cash' | 'bank_transfer' | 'other'
periodStart: date
periodEnd: date
notes?: string
imageDataUrl?: string   // base64 receipt photo (stored in localStorage)
```

### AppData (localStorage)
```
workers: Worker[]
workEntries: WorkEntry[]
payments: Payment[]
parentAccount: { username: string; pin: string }
```

---

## Auth

- Login screen: username + PIN fields only (no role selector, no worker dropdown)
- System looks up the username:
  - Matches `parentAccount.username` → role = Parent
  - Matches a Worker's `username` → role = Worker (workerId inferred)
- Wrong credentials → inline error, no navigation
- Session stored in `sessionStorage` (clears on tab/app close)
- Logout always visible in nav

Default credentials (change in Settings / Worker profile):
- Parent: `parent` / `1234`
- Lisa (nanny): `lisa` / `0000`

---

## Pages / Routes

| Route | Role | Description |
|---|---|---|
| `/login` | Public | Username + PIN login |
| `/` (Dashboard) | Parent | Summary cards + charts |
| `/calendar` | Both | Monthly calendar view |
| `/hours` | Both | Work entry list (filtered by role) |
| `/hours/new` | Both | Log a new work entry |
| `/workers` | Parent | List of all workers |
| `/workers/:id` | Parent | Worker detail, rates, history, balance |
| `/payments` | Parent | Log and view payments |
| `/settings` | Parent | Change parent credentials, export data |

---

## User Stories

### AUTH

**US-01 — Username Login**
> As a user, I enter my username and PIN so that the app knows who I am and shows the right views and permissions.

Acceptance criteria:
- Single form: username + PIN
- No role selector — role inferred from credentials
- Invalid credentials show an inline error
- Session clears when the browser tab/app is closed

**US-02 — Logout**
> As a user, I can log out so that another person can log in on the same device.

---

### WORKER MANAGEMENT (Parent only)

**US-03 — Add Worker**
> As a parent, I can add a new worker with their name, username, PIN, start date, worker type, and rates so that they can log in and start tracking hours.

Acceptance criteria:
- Required: name, username, PIN, start date, worker type (Nanny / Cleaner), day rate, night rate
- Optional: phone
- Overtime multiplier defaults to 1.25
- New worker is active by default

**US-04 — Edit Worker**
> As a parent, I can edit any worker's details including rates so that their profile stays up to date.

Acceptance criteria:
- Editing rates does NOT retroactively change past `WorkEntry.grossAmount` — those are frozen at entry time

**US-05 — Deactivate Worker**
> As a parent, I can deactivate a worker (soft delete) so that history is preserved but they no longer appear in active selections or login.

---

### TIME TRACKING

**US-06 — Log Work Hours (Worker)**
> As a worker, I can log my hours for today or up to 7 days back, selecting start time, end time, and shift type (Day / Night), so my hours are recorded accurately.

Acceptance criteria:
- Date picker limited to today and past 7 days
- Shift type: Day or Night (determines rate applied)
- Work type is implicit — nanny entries are baby care, cleaner entries are cleaning
- Hours and gross amount computed automatically and shown before saving
- Worker cannot edit or delete entries after saving

**US-07 — Log Work Hours (Parent)**
> As a parent, I can log hours on behalf of any worker for any date so that I can correct or backfill records.

Acceptance criteria:
- No date restriction
- Worker selector (any active or inactive worker)
- Can add notes

**US-08 — Edit / Delete Work Entry (Parent)**
> As a parent, I can edit or delete any work entry so that errors can be corrected.

Acceptance criteria:
- Editing recalculates hours and gross amount from updated times and current worker rates
- Deletion is permanent with a confirmation dialog

**US-09 — View Work History (Worker)**
> As a worker, I can see my own work entries and monthly totals so that I can verify my hours.

Acceptance criteria:
- Sorted by date descending
- Shows date, shift type, hours, gross amount
- Footer shows total hours and total gross for the filtered view

**US-10 — View Work History (Parent)**
> As a parent, I can view all work entries filtered by worker and date range so that I can review hours before making payments.

---

### CALENDAR VIEW

**US-11 — Monthly Calendar**
> As a parent or worker, I can see a monthly calendar where each worked day is color-coded so that I can tell at a glance which days have been paid and which haven't.

Acceptance criteria:
- Month grid (Mon–Sun), navigate with prev/next arrows
- Day cell highlights:
  - **Green** — worked day covered by a payment (payment's periodStart ≤ day ≤ periodEnd)
  - **Amber** — worked day not covered by any payment
  - No highlight — no work that day
- Each highlighted cell shows the total hours for that day
- Tap/click a day → popover with list of entries for that day
- Parent view: worker selector dropdown to switch between workers
- Worker view: shows own days only

**US-12 — Calendar Payment Visibility (Worker)**
> As a worker, I can see which of my worked days are marked as paid so that I know what I've received and what's still owed.

---

### PAYMENTS (Parent only)

**US-13 — Record Payment**
> As a parent, I can record a payment to a worker including amount, date, method, period covered, and an optional receipt photo so that I have a full payment history.

Acceptance criteria:
- Required: worker, date, amount, period start, period end
- Payment method: Cash / Bank Transfer / Other
- Optional: notes, receipt photo (image upload → stored as base64)
- Receipt thumbnail shown on the payment card; tap to view full-screen

**US-14 — View Balance / Amount Due**
> As a parent or worker, I can see the current unpaid balance (total gross earned minus total paid) so that I know what is owed.

Acceptance criteria:
- Balance = Σ WorkEntry.grossAmount − Σ Payment.amount (all time)
- Shown on the worker detail page and the dashboard
- Workers can see their own balance

**US-15 — Payment History**
> As a parent or worker, I can view all payments in chronological order so that there is a clear audit trail.

---

### DASHBOARD (Parent only)

**US-16 — Summary Cards**
> As a parent, I see at-a-glance cards: total hours this month, total amount owed across all workers, total paid this month.

**US-17 — Hours Bar Chart**
> As a parent, I see a bar chart of hours worked per week for the current month, broken down by worker.

**US-18 — Earned vs. Paid Chart**
> As a parent, I see a chart comparing gross earned vs. amount paid per worker for the current month.

---

### SETTINGS (Parent only)

**US-19 — Change Parent Credentials**
> As a parent, I can change my username and PIN so that the parent account stays secure.

Acceptance criteria:
- Must enter current PIN to make changes
- Worker credentials are managed in the worker's own profile page

**US-20 — Export Data**
> As a parent, I can export work entries and payments to CSV so that I can use them in a spreadsheet.

---

## Hosting Plan

| Step | Detail |
|---|---|
| Build | `vite build` → outputs to `dist/` |
| Deploy | `gh-pages -d dist` → pushes to `gh-pages` branch |
| URL | `https://<username>.github.io/nanny` |

```
npm run deploy   # runs: vite build && gh-pages -d dist
```

---

## Out of Scope (v1)

- Push notifications / reminders
- Multi-device sync (data is device-local)
- PDF pay slips
- Multiple families
- Real backend / cloud auth
- "Both" work type (nannies do care only, cleaners do cleaning only)
