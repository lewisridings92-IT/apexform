# Fitness App: Rebuild Plan

*Discussion saved 2026-09-29. **Changed to a personal, local-only iPhone app on 2026-10-08** (see "Decision" below). Source app: https://apex-cunning-form-fit.base44.app/ (Base44 app id `6ab916ff92fcca7b08eed01d`)*

## How this plan was produced

- The goal was to review the Base44 app with the Claude in Chrome extension and write a plan to rebuild it with Claude Code.
- Chrome loaded the app, but every screenshot and page read timed out (the page never reported as idle). This happened in two tabs, including with the tab in front.
- Workaround: the app's public JavaScript bundle (`/assets/index-0pC2s0t8.js`) was downloaded and analysed. Everything below comes from the real code.
- **Not visible:** the backend function `generateWorkoutPlan`, which runs on Base44's servers. Its code **can't be exported** (confirmed 2026-09-30), so it will be rebuilt as a rules engine (see "Plan generator" below).

## What the Base44 app is

Named **IronArchitect** in the code (saved to phones as "ApexForm"). A strength-training planner built around "anchor lifts": the exercises the user knows work for them.

### Screens / routes

| Route | Screen | What it does |
|---|---|---|
| `/onboarding` | Onboarding (4 steps) | Days per week (2–7), session length (30–120 min, step 5), equipment, goals, experience level. Saves the profile with `onboarding_complete: true`, then goes to `/anchors` |
| `/anchors` | Anchor lifts | Pick exercises for each of 11 muscle groups from a built-in library, filtered by equipment. Replaces the saved anchors, then calls `generateWorkoutPlan` (regenerate: false) and goes to `/plan`. Has a "Skip for now" button |
| `/` | Dashboard | "<Goal> Block" title, stats (sessions, total volume in k kg, plan days), plan summary, one card per training day with "Start Session", last 5 sessions |
| `/plan` | Plan | Block type, name and summary. Days expand to show exercises: sets, reps, RIR, rest, notes. Regenerate button. "Start this session" |
| `/workout/:dayIndex` | Workout logger | Live timer, weight and reps inputs for each set, tick sets complete, add/remove sets, progress bar, save, "Session Complete" summary |
| `/history` | History | Sessions list, and a Progress tab charting top weight and estimated 1RM per exercise (needs 2 or more sessions) |
| `/settings` | Settings | Edit profile, Regenerate Plan (uses the last 6 logs), Edit Anchor Lifts, Danger Zone: Reset Everything |

### Option lists

- **Equipment:** Barbell, Dumbbell, Machine, Cable, Kettlebell, Bodyweight, Bands, EZ Bar
- **Muscle groups:** Chest, Back, Shoulders, Quads, Hamstrings, Glutes, Calves, Biceps, Triceps, Abs, Forearms
- **Goals:** maximal_strength, hypertrophy, power, body_recomp, general_fitness
- **Experience:** intermediate (2–4 yrs), advanced (5+ yrs), elite
- **Onboarding defaults:** 4 days/week, Barbell/Dumbbell/Cable/Machine, hypertrophy, advanced, 75 min
- **Exercise library:** about 100 exercises, each with a name and equipment, grouped by muscle (e.g. Chest: Barbell Bench Press, Incline DB Press, Weighted Dips, Cable Crossover, Pec Deck…)

### Data model (Base44 entities)

- **UserProfile**: frequency, session_length, equipment[], goals[], experience_level, onboarding_complete
- **AnchorExercise**: muscle_group, exercise_name, equipment, is_primary
- **WorkoutPlan**: name, block_type, summary, status (`active`), days[] → { day_name, focus, exercises[] → { name, muscle_group, sets, reps, rir, rest, notes } }
- **WorkoutLog**: date, day_name, duration_min, exercises[] → { name, muscle_group, target_sets/reps/rir, sets[] → { weight, reps, rir, completed } }

### Calculations

- Volume = sum of weight × reps over completed sets
- Estimated 1RM (Epley formula) = weight × (1 + reps / 30); the top set is chosen by e1RM

## Decision (2026-10-08): personal app that stores data on the phone

The app is only for the user, on their **iPhone**. There are no accounts and no backend. The plan generator uses **rules only** (no Claude API). This replaces the earlier Supabase, Claude API and Vercel plan.

## Stack

- **Frontend:** React, Vite, TypeScript, Tailwind, shadcn/ui. Recharts for charts.
- **Storage:** IndexedDB on the phone through **Dexie**. The four Base44 entities become four local tables.
- **Offline, installable web app (PWA)** with `vite-plugin-pwa`. It is installed once from Safari with "Add to Home Screen" and then works offline in the gym.
- **Hosting:** GitHub Pages (free, but the repo has to be public). It only serves the app's code. Workout data never leaves the phone.
- **Node.js** is needed **on the PC only**, to build the app. The phone doesn't need it.

## Protecting the data (iPhone)

- Always open the app from the home-screen icon. Safari can clear storage for websites that haven't been added to the home screen.
- Call `navigator.storage.persist()` when the app starts.
- **Export/Import backup** in Settings: one JSON file, saved through the iOS share sheet (for example to iCloud Drive). Show a reminder after 7 days without a backup.
- The workout logger saves after every set, so a session survives a reload or crash.

## Plan generator (rules only, runs on the phone)

- **Inputs:** profile (days per week, session length, equipment, goals, experience), anchor lifts, and when regenerating, the last 6 workout logs.
- **Split:** full body for 2–3 days, upper/lower for 4, push/pull/legs or a hybrid for 5–6, push/pull/legs plus weak points for 7.
- **Weekly sets per muscle** by experience level, spread across the days that train that muscle.
- **Reps, RIR and rest by goal** (e.g. strength 3–5 reps, RIR 1–2, rest 3–4 min; hypertrophy 6–12 reps, RIR 1–3, rest 2 min).
- **Exercises:** anchor lifts first, then the library filtered by equipment, with compound lifts placed first in each day.
- **Session fit:** estimate the time per set plus rest, then trim accessories until the day fits the session length.
- **Regenerate:** if reps beat the target, add load (suggested increase), and swap out exercises that have stalled.
- Same inputs always give the same plan. Unit tests use sample profiles (2 days/30 min, 6 days/120 min, bodyweight only, and so on).

## Build phases

1. **Setup:** Vite project, git, Tailwind/shadcn, dark theme, Dexie database, PWA setup.
2. **Onboarding:** the 4-step wizard, saved locally.
3. **Exercise library and anchors:** exercise data file, anchor picker with the equipment filter.
4. **Plan generator:** rules engine and tests, Plan page, Regenerate.
5. **Workout logger:** timer, set entry, rest timer, suggested weights from the last session, saving after every set.
6. **Dashboard and history:** stats, recent sessions, progress charts (top weight, e1RM, volume).
7. **Settings:** profile editing, Export/Import backup, backup reminder, Reset Everything.
8. **Deploy to the iPhone:** GitHub Pages, install from Safari, check offline use and persistent storage.

## Working method with Claude

- One phase per session: Claude builds it, runs it locally, and the user tries it before moving on.
- A `CLAUDE.md` in the project records decisions (stack, schema, style).

## Access & setup needed

- **Node.js LTS** on the PC: v24.20.0 (npm 11.19.0), installed with winget on 2026-10-08.
- Git and the GitHub CLI are already installed and logged in (`lewisridings92-IT`).
- Nothing else: no Supabase, Anthropic, Vercel or Resend accounts.

## Possible later additions

- An optional Claude-assisted plan generator (the user pastes their own API key, stored only on the phone).
- Backup sync to a cloud file.

## Open questions

None at the moment.
