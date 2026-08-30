# Aurora — budgeting that forecasts your future

A budgeting web app built to look and feel like a real product, not a
spreadsheet: a marketing landing page plus a full in-browser app, with a set
of features most budgeting tools skip.

## Why it's different

- **Money Weather** — a daily forecast (sunny → stormy → rainbow) computed
  from your actual savings rate, runway, and streak, not a gimmick.
- **Financial Wellness Score** — a 300–850 composite score (savings rate,
  budget adherence, emergency-fund runway, debt load) styled like a credit
  score but built from budgeting fundamentals.
- **Future Self simulator** — three sliders (contribution, return, horizon)
  driving a live 40-year fan chart with net-worth milestones.
- **Subscription X-ray** — automatic recurring-charge detection (stable
  amount + ~monthly cadence) that excludes essential bills like rent/utilities
  and lets you "cancel" a leak and see the score respond.
- **Spending DNA** — a radar-chart fingerprint of your category mix plus a
  shareable code like `HO37-SH16-GR10-SA8`.
- **Streaks & badges** — tied to real on-budget behavior, not logins.

## Stack

React 19 + TypeScript + Vite, Tailwind CSS v4, Framer Motion, Recharts,
Zustand (persisted to `localStorage`), React Router. No backend — all data
is generated locally and stored in the browser.

## Getting started

```bash
npm install
npm run dev       # start the dev server
npm run build     # type-check + production build
npm run preview   # preview the production build
```

Visit `/` for the marketing site, `/app` for the live demo dashboard.

## Deploying

The build output in `dist/` is a static site and includes SPA-fallback
config for both Netlify (`public/_redirects`) and Vercel (`vercel.json`) so
client-side routing works on either host out of the box.

## Project structure

```
src/
  lib/            data model, seed data, calculations, zustand store
  components/
    landing/      marketing page sections
    layout/       app shell (sidebar, topbar)
    dashboard/    dashboard widgets (weather, gauge, charts, lists)
    budgets/      envelope budgeting UI
    transactions/ transaction table + add-transaction modal
    goals/        savings goal cards
    insights/     Future Self simulator, Subscription X-ray, Spending DNA
    ui/           small shared primitives (Button, Card, Pill, ProgressBar)
  pages/          route-level page components
```

All financial data is generated deterministically on first load and then
persisted to `localStorage` — nothing is sent to a server.
