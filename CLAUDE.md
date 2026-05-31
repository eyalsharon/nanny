# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start development server (http://localhost:3000)
npm run build        # Production build
npm run lint         # ESLint
npm run type-check   # TypeScript check without emitting
```

> Note: `next.config.ts` is not supported by Next.js 14 — use `next.config.mjs`.

## Architecture

**Next.js 14 App Router** with two pages: `/` (Dashboard) and `/expenses` (Expense Manager).

All data is stored in `localStorage` via `lib/storage.ts`. There is no backend or API layer.

### State Management

A single custom hook `hooks/useExpenses.ts` owns all expense state. It loads from localStorage on mount, persists on every change, and exposes CRUD operations plus filtered/computed results. Both pages consume this hook directly — there is no global context or state library.

### Data Flow

```
localStorage → useExpenses hook → page component → child components
                    ↑
            addExpense / updateExpense / deleteExpense
```

### Key Files

| File | Purpose |
|---|---|
| `hooks/useExpenses.ts` | All state, CRUD, filtering, memoized stats |
| `lib/types.ts` | `Expense`, `ExpenseFilters`, `SummaryStats` types |
| `lib/utils.ts` | `filterExpenses`, `computeStats`, `getSpendingByDay`, `exportToCSV`, `formatCurrency` |
| `lib/categories.ts` | Category list + color/icon maps |
| `components/expenses/ExpenseList.tsx` | Full expenses page (filters, list, modals) |
| `components/dashboard/SpendingChart.tsx` | Recharts AreaChart — must be `dynamic` (no SSR) |
| `components/dashboard/CategoryBreakdown.tsx` | Recharts PieChart — must be `dynamic` (no SSR) |

### Recharts / SSR

Chart components use Recharts which requires browser APIs. They are imported with `next/dynamic` and `{ ssr: false }` in `app/page.tsx`. Never import them directly in server components.

### Form Validation

`ExpenseForm.tsx` uses `react-hook-form` + `zod`. The schema is defined inline in the component file.

### Routing / Layout

`app/layout.tsx` renders `<Sidebar>` (fixed, `w-60` on desktop, bottom nav on mobile) and `<Header>`. Main content has `md:ml-60` to account for the sidebar. Mobile adds `pb-24` to avoid the bottom nav overlap.
