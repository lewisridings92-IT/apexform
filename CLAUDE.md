# ApexForm

Personal strength-training planner and log, used by one person on an iPhone. Rebuild of a Base44 app. Read `PLAN.md` for the screens, data model, rules for the plan generator and the build phases.

## Decisions

- **Local-only.** No backend, no accounts, no API keys. All data is in IndexedDB on the phone (Dexie). Never add code that sends workout data off the device.
- **PWA** via `vite-plugin-pwa`, installed from Safari with "Add to Home Screen". It must work offline.
- **Hosting:** GitHub Pages at `/apexform/`. The build sets `base` from the `GITHUB_PAGES` env var (see `vite.config.ts`). Routing uses hash routes (`#/plan`) so refreshes never 404.
- **Plan generator:** rules only, deterministic, runs in the browser, with unit tests.
- **Data safety:** keep the Export/Import JSON backup working for every table. Schema changes need a new `db.version(n)` with an upgrade in `src/db/db.ts`; never edit an existing version.

## Stack

React 19, Vite, TypeScript, Tailwind v4, shadcn/ui (base-nova style, Base UI primitives, `cn` from the `cn` package), lucide icons, Dexie and `dexie-react-hooks`, React Router (hash router), Vitest with `fake-indexeddb`. Recharts will be added for charts.

## Layout

- `src/db/`: types, Dexie database, storage helpers (persistence, installed check)
- `src/lib/`: pure logic (calculations, later the plan generator) with `*.test.ts` alongside
- `src/pages/`: one file per screen; `src/components/`: shared pieces; `src/components/ui/`: generated shadcn components (add with `npx shadcn@latest add <name>`)

## Style

- Dark theme only (`class="dark"` on `<html>`). Mobile-first, max width `max-w-lg`; respect iPhone safe areas.
- Weights in kg.

## Commands

- `npm run dev`: local dev server
- `npm test`: unit tests
- `npm run lint`: oxlint
- `npm run build`: type-check and build; `GITHUB_PAGES=1 npm run build` for the Pages build
