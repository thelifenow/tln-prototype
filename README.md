# The Life NOW: Blank Slate prototype

A clickable, mobile-first prototype of **The Life NOW (TLN)**. You write everything on one **Blank Slate**, and the app maps it into the right places behind the scenes: journal, Dos, waymarks, initiatives, and the Seed Vault.

There is **no backend and no AI**. The mapping is simulated with six scripted scenarios and a simple keyword-rule fallback. Everything is stored in this browser's `localStorage`, and the app still works when storage is blocked.

## Run it

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # static files in dist/
npm run preview    # serve dist/ locally to test the build and offline mode
```

Node 18+ is required.

## Deploy to a static host

`npm run build` writes plain static files to `dist/`. The build uses relative paths (`base: './'`), so it works at a domain root or in a subfolder.

- **Netlify / Cloudflare Pages / Vercel:** build command `npm run build`, output directory `dist`.
- **GitHub Pages (set up in this repo):** `.github/workflows/deploy.yml` builds on every push to `main` (and the prototype branch) and publishes `dist/` to the `gh-pages` branch. One-time setting: *Settings → Pages → Build and deployment → Source: Deploy from a branch → `gh-pages` / root*. The site is then at `https://thelifenow.github.io/tln-prototype/`.
- **Anywhere else:** copy `dist/` to any web server. HTTPS is needed for the service worker, the microphone and "Add to Home Screen" (except on `localhost`).

It is an installable **PWA**: open it once on a phone, choose *Add to Home Screen*, and it opens offline after that first load.

## What's where

| Area | How to reach it |
| --- | --- |
| **Slate · Today · Season · Journal** | Bottom tab bar |
| **Under the floor** | Layers icon, top right. Shows the machinery on every screen (developer styling). |
| **Feedback mode** | Speech-bubble icon, top right. Tap anything to pin a numbered comment. The banner has **+ Feature** and **Panel**. |
| **Blueprint** | Menu, then *Blueprint*. The interactive whiteboard with roll-up views. |
| **Export · Import · Clear** | Menu, then *Export · Import · Clear* (also in the Blueprint toolbar) |
| **Reset demo** | Menu. Resets only the sample journal and planning; Blueprint and Feedback are kept. |

## Test the scenarios

On the Slate, tap a **sample entry** chip, then **Save**. Turn on **Under the floor** to watch the mapping: the draft is previewed live before you save, then shown in full after saving and on each Journal entry.

| # | Chip | What to look for |
| --- | --- | --- |
| 1 | **Lost** | Starting point = *Seeking Direction*. It proposes *Set Your House in Order* and one small Do ("Clear one surface: the kitchen table", code D). It must **not** ask for a vision (the flag under the floor says so). |
| 2 | **Clear vision** | *Make It Plain* drafted: vision, you are here, finished when, finished by March 1, parent I2. "I'll start on" stays a low-confidence draft. *Dump. Sort.* has 7 items, with the audiobook marked **V**. It asks to start initiative **I4 "Finish the book"**. Say Yes and I4 appears on Season with its Roadmap (W2–W4 as dashed draft stones). |
| 3 | **Progress** | Do **2.2** "Finish the cover page…" is marked done automatically (a stated fact). It proposes a *Partly* check-in on "Planner ready to print". The missed prayer becomes tomorrow's right action, said gently. Under the floor: *Check the map* with Core kept = No. |
| 4 | **Journal only** | Journal form only: praise, testify, vent, what I sense He's saying, and a question. **Nothing** goes to planning. A warm one-line reply. |
| 5 | **Handwriting photo** | A drawn photo of a Monday to-do list is "read" (scripted). It proposes five Dos coded **D, 1.2, 2.2, 3.2, D**, and saving "TLN podcast" to the **Seed Vault**. |
| 6 | **Voice note** | A spoken idea for a "TLN circle". *Count the Cost* shows time short by ~4 h/week, so it's **not now**. It's saved to the Seed Vault with a one-sentence reason. |

**Free typing:** anything that isn't a sample goes through the **rule-based fallback**, labelled *SIMULATED* under the floor. Try:

- "I need to clear the garage desk tomorrow." proposes a Do coded 1.2 for tomorrow.
- "Finished sorting two garage shelves." proposes marking Do 1.2 done.
- "What if we did a podcast someday?" proposes a Seed Vault save.
- "Skipped prayer again." sets a gentle Core right action.
- "I feel hopeless." turns on **care mode**: planning is set aside and a care response is shown (including 988 for the US).

**Voice:** the mic records with MediaRecorder and shows a playable clip. If the browser has the Web Speech API, the transcript is your own words (and goes through the rules). Otherwise the scripted voice-note transcript is inserted.
**Photo:** the camera button accepts any image (with `capture`). The transcript is always the scripted handwriting page.

**Today:** the one right action at the top; Dos with D / I.W codes; the Core as guarded toggles. Use **Preview the Sabbath view** to see "No Do! today" (the real Sabbath runs Friday 18:00 to Saturday 18:00, local time).
**Season:** tap any waymark stone to see its stake, Dos and check-in. The Seed Vault is at the bottom.
**Journal:** tap a chip ("→ Do 2.2 done") to highlight the source words in the raw entry.

## Blueprint and Feedback

- **Board:** five sections (Blank Slate mapping, Planning hierarchy, Build tracks, Forms, Screens). Drag to pan, pinch or wheel to zoom, or use the zoom buttons. **List view** shows the same nodes as an accordion.
- **Node drawer:** What it is (editable), Current behavior with **Show me**, Linked items (tap to hop, × to remove an arrow), Requirements & features (add, edit, delete; type, priority, release, status, dates), and Notes. **Add node**, **Rename**, and **Draw arrow** (tap the source node, then the target). Orange badges count open items (not Built or Dropped).
- **Roll-ups:** All items (filter by type, priority, release, status; grouped by node), MVP list, Open questions.
- **Feedback mode:** tap any element to pin a comment (Comment · Bug · Feature request · Question). Tap a marker to edit, resolve or reopen it, reply, or delete it. **+ Feature** saves a feature request as an item on the chosen Blueprint node, so there is one list. The **Panel** filters by screen, type and status, and **Jump to it** takes you back to the pinned element.
- **Export:** JSON (everything) and a **Markdown requirements document** grouped by section and node, with comments listed under their screens. **Import** merges by id and keeps the newer edit. Use it to move work between devices or to share with a reviewer.
- **Clear Blueprint** and **Clear Feedback** each ask for confirmation. Reset demo never touches them.

## Code map

```
src/types.ts              every data shape: planning, the 9 workbook forms, Mapping, Node, Edge, Item, Comment, FeatureRequest
src/data/seed.ts          the author's season (I1 Mess, I2 Prepare, I3 Observe)
src/data/scenarios.ts     six scripted entries and their full mappings
src/engine/fallback.ts    keyword rules for free-typed entries (+ care mode)
src/engine/apply.ts       pipeline: map an entry, apply confirmed actions
src/state/*               demo (journal + planning), workspace (Blueprint + Feedback), ui
src/screens/*             Slate, After-saving card, Today, Season, Journal
src/underfloor/*          the developer machinery panels
src/blueprint/*           board (SVG), drawer, items, roll-ups
src/feedback/*            pinned comments, panel, feature form
src/lib/exporters.ts      JSON / Markdown export and import parsing
```

Storage keys: `tln.demo.v1` (journal and planning), `tln.workspace.v1` (Blueprint and Feedback), `tln.ui.v1`. To swap in a backend later, replace the two state providers; the screens only use their APIs and the types in `types.ts`.

**Known limits:** voice clips live in memory only and are gone after a reload (the transcript is kept). Import merges but does not carry deletions, so an item deleted on one device comes back if you import an older export that still has it.
