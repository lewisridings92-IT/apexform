# ApexForm

A personal strength-training planner and workout log for iPhone. It builds a training plan around the lifts you know work for you, logs every set, and tracks your progress over time.

**Open the app:** https://lewisridings92-it.github.io/apexform/

- **Private:** there are no accounts. Everything you enter is stored on your phone and is never sent anywhere.
- **Works offline:** once installed, it works in the gym without signal.
- **Your responsibility:** because the data only lives on your phone, **back it up regularly** (see [Backing up your data](#backing-up-your-data)).

---

## Contents

1. [Installing on iPhone](#installing-on-iphone)
2. [First-time setup](#first-time-setup)
3. [Your plan](#your-plan)
4. [Logging a workout](#logging-a-workout)
5. [History and progress](#history-and-progress)
6. [Backing up your data](#backing-up-your-data)
7. [Restoring a backup](#restoring-a-backup)
8. [Settings](#settings)
9. [Updates](#updates)
10. [Troubleshooting](#troubleshooting)
11. [For developers](#for-developers)

---

## Installing on iPhone

1. Open **Safari** (it must be Safari, not Chrome) and go to `lewisridings92-it.github.io/apexform/`.
2. Tap **Share** (the square with an up arrow), then **Add to Home Screen**, then **Add**.
3. **Always open ApexForm from the home-screen icon.**

> **Why the icon matters:** Safari can clear data for websites you haven't added to your home screen. Opened from the icon, ApexForm runs as its own app and its data is protected. You can check this in **Settings → Device storage**: both rows should say **Yes**.

---

## First-time setup

### 1. Your profile (4 steps)

| Step | What you choose |
|---|---|
| Your schedule | Days per week (2–7) and session length (30–120 minutes) |
| Equipment | Everything you have access to: barbell, dumbbells, machines, cables, kettlebells, bodyweight, bands, EZ bar |
| Goals | Maximal strength, hypertrophy, power, body recomposition or general fitness. You can pick more than one; the first is your main goal |
| Experience | Intermediate (2–4 years), advanced (5+ years) or elite |

### 2. Anchor lifts

Anchor lifts are the exercises you know work for you. Your plan is built around them.

- Tap a muscle group to open it. Only exercises that match your equipment are shown.
- Tap exercises to choose them. You can pick several per muscle group.
- The **star** marks your main lift for that muscle. It opens that muscle's work every time it's trained. Tap another star to change it.
- Tap **Save** to build your plan, or **Skip for now** to get a plan built from the exercise library.

---

## Your plan

The **Plan** tab shows your current training block: one card per training day with its exercises, sets × reps, **RIR** (reps in reserve, meaning how many more reps you could have done) and rest time. Each day shows an estimated length.

### How the plan is built

- **Split:** 2–3 days full body, 4 days upper/lower, 5 days push/pull/legs + upper/lower, 6 days push/pull/legs, 7 days push/pull/legs + a weak-points day.
- **Weekly sets** are based on your experience and goal. Strength and power blocks use fewer, heavier sets than hypertrophy blocks.
- **Reps and rest:**
  - **Main lifts:** the first two compound lifts of each day are the heavy ones.
  - **Secondary compound lifts:** lighter work after the main lifts.
  - **Isolation lifts:** higher reps and shorter rests.
- **Session length:** if a day would run over your session length, the least important work is trimmed first: forearms, then calves and abs, then arms. Big compound lifts are kept until last.

### Regenerating

A new plan is built automatically when you save anchor lifts or edit your profile. You can also use **Settings → Regenerate plan from recent sessions**. It looks at your last 6 workouts:

- **Load suggestions:** if you hit the top of the rep range, the plan suggests more weight, e.g. "Try 105 kg".
- **Stalled lifts:** if a lift hasn't improved in 3 sessions, it's swapped for another exercise. If it's your starred anchor, it stays, with a note suggesting a lighter week.

---

## Logging a workout

1. On **Home**, tap **Start** on a training day. You can also open a day on the **Plan** tab and tap **Start this session**.
2. Each exercise shows its targets, plus a hint from last time, e.g. *"Last time: 100 kg × 8. Aim for more reps at the same weight."*
3. For each set:
   - **Weight** is filled in from your last session, plus any suggested increase. Tap to change it.
   - **Reps** shows last time's numbers in grey. Type your reps, or just **tap the tick on an empty row** to use the grey numbers.
   - Holds and carries, such as Plank, are logged in seconds.
4. Ticking a set starts the **rest timer** at the bottom. Use **+30s**, **−15s** or **Skip**. It keeps correct time even if your phone locks.
5. Use **Add set** or **Remove set** under an exercise if you do more or fewer sets than planned.
6. Tap **Finish** when you're done. You'll see your time, sets, volume and any **new personal bests**.

**Nothing is lost if you leave mid-workout.** Every tap is saved immediately. Reopen the app and tap **Resume** on Home. You can only have one unfinished session at a time. If you start a different day, you'll be asked whether to resume the old one or discard it.

To throw a session away, tap **Discard session** at the bottom of the workout and confirm.

---

## History and progress

### Sessions

The **History → Sessions** tab lists every finished workout. Tap one to see every set, any personal bests from that day, or to **delete** it.

### Progress

The **History → Progress** tab:

- **Exercise progress:** pick an exercise to see your current **estimated 1RM** (one-rep max, calculated from your best set) and how much it's changed since you started.
  - The chart shows estimated 1RM and top weight for each session. Tap a point for details, or **Show as table** to see the numbers.
  - A chart appears once an exercise has been logged in 2 or more sessions.
- **Weekly volume:** total weight × reps per week for the last 12 weeks.

**Volume** is weight × reps added up across completed sets. Home shows your total volume and your last 5 sessions.

---

## Backing up your data

> ⚠️ **Your workouts only exist on your phone.** If the phone is lost, replaced or reset, or Safari's data is cleared, they are gone unless you have a backup.

### How to back up (about 15 seconds)

1. Open **Settings**. **Backup** is the first card.
2. Tap **Export backup**. The iPhone share sheet opens.
3. Tap **Save to Files**, choose **iCloud Drive** (e.g. a folder called *ApexForm*), then tap **Save**.

The file is called `apexform-backup-YYYY-MM-DD.json`. It holds your profile, anchor lifts, plans and every workout.

### How often

- **Weekly** is a good habit.
- Home shows a **"Back up your data"** banner, and Settings shows a **Due** badge, if you've logged workouts and haven't backed up for **7 days**.
- **Always back up before** using Reset everything, restoring an older backup, or changing or resetting your phone.

### Good to know

- Save it to **iCloud Drive or another place off your phone**. A backup kept only in "On My iPhone" is lost with the phone.
- Keeping a few older backups is fine. Each one is a complete copy, so you only ever need the latest.
- If you cancel the share sheet, it doesn't count as a backup.

---

## Restoring a backup

Use this on a new phone, after resetting, or to undo a mistake.

1. Install the app (see [Installing on iPhone](#installing-on-iphone)) and open it from the home-screen icon.
2. If it's a fresh install, go through the quick setup. It gets replaced by the backup anyway.
3. Go to **Settings → Backup → Restore…** and pick your backup file from iCloud Drive.
4. Check the summary, e.g. *"Backup from 8 Oct: 40 sessions, 1 plan, 4 anchor lifts"*.
5. Tap **Replace and restore**.

> **Restoring replaces everything** currently on the phone with the backup. It does not merge them. If you've logged workouts since the backup was made, export a new backup first.

Damaged files, files from other apps, and backups from a newer version of the app are rejected with a message, and nothing is changed.

---

## Settings

| Card | What it does |
|---|---|
| **Backup** | Export a backup, restore from one, and see when you last backed up |
| **Device storage** | Shows whether the app was opened from the home screen and whether its data is protected from being cleared. Both should say **Yes** |
| **Training profile** | **Edit profile** (rebuilds your plan), **Edit anchor lifts**, **Regenerate plan from recent sessions** |
| **Danger zone** | **Reset everything** permanently deletes all your data and returns to setup. It shows how many sessions would be lost and asks you to confirm. **Back up first.** |

---

## Updates

When the app is improved, your installed app updates itself the next time you open it with an internet connection. If an update doesn't seem to appear, **close the app fully** (swipe it away) and open it again.

Updates never touch your data.

---

## Troubleshooting

| Problem | What to do |
|---|---|
| "Protected from clearing" says **No** | Make sure you opened the app from the **home-screen icon**, not a Safari tab. Close it fully and reopen from the icon |
| The app shows "Something went wrong" | Tap **Reload**. Your saved workouts are safe. If it keeps happening, tap **Go to Home** |
| A workout disappeared mid-session | Open **Home** and tap **Resume**. Every set is saved as you go |
| My data is gone (new phone, cleared Safari) | Restore your latest backup (see [Restoring a backup](#restoring-a-backup)) |
| Export does nothing | Make sure you're on the latest iOS and opening from the home-screen icon, then try again. The share sheet needs iOS 15 or later |
| The plan doesn't match my new equipment | Edit your profile in **Settings**. The plan is rebuilt automatically |

---

## For developers

This is a React + TypeScript web app with no backend. It's built with Vite, Tailwind and shadcn/ui, stores data in IndexedDB through Dexie, and is installable offline as a PWA. See [`CLAUDE.md`](CLAUDE.md) for the decisions and code layout, and [`PLAN.md`](PLAN.md) for the full design.

```bash
npm install
npm run dev      # local dev server at http://localhost:5173 (includes sample-data tools in Settings)
npm test         # unit tests
npm run lint
npm run build
```

Pushing to `main` lints, tests, builds and deploys to GitHub Pages through `.github/workflows/deploy.yml`.
