# Leonida Ledger

[![make.fun bounty](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01)
[![make.fun rank](https://make.fun/badge/gta6-trophy-guide-01/mietrea519-cyber/leonida-ledger/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01)
[![make.fun reward](https://make.fun/badge/gta6-trophy-guide-01/mietrea519-cyber/leonida-ledger/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01)

An offline guide and tracker for all 55 PlayStation 5 trophies of Grand Theft Auto VI.
Every trophy with its official name, description and grade, an original guide with cited
sources for each one, a seven-stage roadmap to the platinum, the one possibly missable
trophy flagged, and a checklist whose progress is saved in your browser — no account,
no network, no build step.

## Run it

```sh
node serve.ts          # serves app/ at http://localhost:8080
```

Or serve the `app/` folder with any static file server and open `index.html`.
Hand the entry in with:

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

## Screenshot scenes

The four screenshots in `screenshots/` are renders of the app's demo mode. Demo mode is
switched on with a `?shot=` query string; it renders a fixed progress state (13 of 55
earned: 2 silver, 11 bronze, every counter at zero) and never reads or writes
localStorage, so a screenshot can be retaken at any time without disturbing a real
playthrough saved in the same browser.

| File | Scene | URL |
| --- | --- | --- |
| `1-cover.jpg` | Checklist, all 55 cards, The Shootist guide open | `/?shot=cover` |
| `2-roadmap.jpg` | Roadmap to Platinum, all 7 stages with per-stage progress | `/?shot=roadmap` |
| `3-tracker.jpg` | Missable filter on, spoiler-free mode on, 1 of 55 shown | `/?shot=tracker` |
| `4-guide.jpg` | Positive Mental Attitude: full guide, banner, Sources, Earned | `/?shot=guide` |

## Data notes

- Names, descriptions and grades in `app/data/trophies.json` are the official
  PlayStation 5 list exactly as published (55 trophies: 1 platinum, 2 gold, 6 silver,
  46 bronze; 28 hidden). Hidden flags and progress targets follow the public
  PSNProfiles and Exophase listings of the same list, which are also the sources each
  guide cites.
- The guides are original text written for this app. Where a guide goes beyond the
  official description it says so. One example: Positive Mental Attitude is flagged
  *possibly* missable because other guides report its first meditation spot, offered
  in Chapter 1, may become unavailable afterwards — that is an inference, labelled as
  such in the app, not a confirmed fact. It is the only missable flag in the guide.
- The Online kind filter is intentionally empty: the official list is entirely
  single-player, and the app explains that on the page rather than hiding the filter.
- The app fetches exactly one file at runtime, its own `./data/trophies.json`.
  Citation links live in the page footer and in the data file, and open only when a
  reader follows them.

## What is inside

- `app/` — the guide itself: `index.html`, `style.css`, `app.js`, `store.js` and
  `data/trophies.json` (the official list plus the guides).
- `screenshots/` — four renders of the app, listed with their scenes in `shots.json`.
- `main.ts` — the hand-in program; `vendor/makefun-frontend.ts` is the competition
  kit's library, byte-identical to the kit copy.
- `LICENSE` — MIT.

---

Built for the [make.fun](https://make.fun/bounty/gta6-trophy-guide-01) bounty
**gta6-trophy-guide-01**. Try make.fun: https://make.fun/?ref=1e3qpbvy
