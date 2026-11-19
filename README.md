# Leonida Ledger

[![make.fun bounty](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/c/gta6-trophy-guide-01)
[![rank](https://make.fun/badge/gta6-trophy-guide-01/mietrea519-cyber/leonida-ledger/rank.svg)](https://make.fun/c/gta6-trophy-guide-01)
[![reward](https://make.fun/badge/gta6-trophy-guide-01/mietrea519-cyber/leonida-ledger/reward.svg)](https://make.fun/c/gta6-trophy-guide-01)

An offline guide and tracker for the 55 official PlayStation 5 trophies of Grand Theft Auto VI, built for the [make.fun](https://make.fun/c/gta6-trophy-guide-01) bounty **gta6-trophy-guide-01**.

## What it does

- **Checklist of all 55 official trophies** — official name, description and grade (1 platinum, 2 gold, 6 silver, 46 bronze), with the 28 trophies that are hidden on PSN badged as hidden, and PSN progress counters with steppers where PlayStation tracks a count (42 Shooting Range challenges, 18 meditation spots, 52 areas of Leonida, and more).
- **A guide to every trophy in our own words** — what to do, where and how as far as the official description supports, and when it can be missed — each with a Sources list rendered as links a reader can follow (the PSNProfiles and Exophase trophy lists).
- **Roadmap to the platinum in seven stages** — story first, then side content, activities and skills, explore and collect, crime and crew, odd moments and cleanup, and finally money, property and 100% completion — with per-stage progress.
- **Missables view** — Positive Mental Attitude is flagged as possibly missable (other guides report its first meditation spot is offered in Chapter 1 and becomes unavailable after it; we label that as an inference from those guides, not a confirmed fact), with a badge, a warning banner in its guide, and its own view.
- **Tracker** — check trophies off, adjust counters, and watch the overall percentage and per-grade counts update. Progress is saved in your browser's localStorage and can be exported to a JSON file, imported back, or reset.
- **Filters and search** — by kind (story, missable, collectibles, activities, online — the official list has no online trophies, and the app says so on the page), by grade, and by text search.
- **Spoiler-free mode** — hides the names and descriptions of story trophies until you earn them.

## Run it

The app is static files under `app/` with no build step and no network use at runtime. Serve it locally:

```sh
node serve.ts
```

then open http://localhost:8080. To produce the hand-in output (`app/`, `screenshots/` and `dossier.json`):

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

## Layout

- `app/index.html`, `app/style.css`, `app/app.js`, `app/store.js` — the guide itself; original dusk-navy and coral look, system fonts, no Rockstar artwork.
- `app/data/trophies.json` — the 55 trophies with their guides, kinds, roadmap stages, hidden flags and progress targets.
- `screenshots/` — four screenshots of the app, the first by name is the cover.
- `main.ts` — the hand-in program; `vendor/makefun-frontend.ts` is the kit's dossier library, unchanged.
- `shots.json` — which view each screenshot was taken of.

## Screenshot scenes

The four screenshots in `screenshots/` are renders of this app's own demo scenes, selected with a `?shot=` query so a screenshot always shows the same state. Demo scenes never read or write localStorage.

- `?shot=cover` — the checklist with demo progress (13 of 55 earned, 24% to the platinum) and The Shootist's guide open, with its Sources.
- `?shot=roadmap` — the Roadmap to Platinum view with per-stage progress.
- `?shot=tracker` — the Missable kind filter active and spoiler-free mode on, with Positive Mental Attitude shown as earned and its missable banner visible.
- `?shot=guide` — Positive Mental Attitude's full guide, with its banner, Sources and the Earned button.

## Data notes

- Trophy names, descriptions and grades in `app/data/trophies.json` are the official PlayStation list as published by PSNProfiles and Exophase, which agree on every entry; exactly 28 of the 55 are hidden on PSN.
- The `count` on a trophy is the progress target PlayStation tracks for it, as published by PSNProfiles; trophies without a tracked count have no counter in the app.
- Each trophy carries a `stage` from 1 to 7 that places it in the roadmap, a `kind` used by the filters, and a `sources` list that the guide pane renders as reader-followed links. The only absolute URLs in the app are those citation links and the source URLs inside the data file; nothing loadable points outside `app/`.

## License

MIT — see `LICENSE`.

---

Built for make.fun: https://make.fun/?ref=1e3qpbvy
