[![GTA 6 trophy guide](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01)
[![Rank](https://make.fun/badge/gta6-trophy-guide-01/mietrea519-cyber/leonida-ledger/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01)
[![Reward](https://make.fun/badge/gta6-trophy-guide-01/mietrea519-cyber/leonida-ledger/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01)

# Leonida Ledger — GTA 6 Trophy Guide & Tracker

An offline guide and tracker for all **55 PlayStation 5 trophies** of Grand Theft Auto VI: 1 platinum, 2 gold, 6 silver and 46 bronze, 28 of them hidden on PlayStation until earned.

- **Checklist** — every trophy with its official name, description and grade, a hidden flag, and the progress count PlayStation tracks (for example 42 Shooting Range challenges, 18 meditation spots, 52 areas of Leonida).
- **A guide to each trophy, in our own words** — what to do, where and how as far as the official description supports, when it can be missed, and a Sources line beside every guide. Trophy names, descriptions and grades are PlayStation's own words, as listed by PSNProfiles and Exophase; where a detail is inferred rather than stated, the guide says so.
- **Roadmap to the platinum** — seven stages built from the official descriptions: story first, then side characters, activities, collectibles, crime, odd moments, and finally money and 100% completion.
- **Missables flagged** — the one trophy reported as possibly missable (Positive Mental Attitude), plus a watch list of three moments whose timing is inferred from their descriptions.
- **Tracker** — check trophies off, saved in the browser (localStorage), with overall progress, per-grade counts, progress boxes for counted trophies, and export/import of progress as JSON.
- **Filters** — by kind (story, missable, collectibles, activities, online), by grade, and by search. There are no online trophies: the whole list is single-player, and the online filter says so.
- **Spoiler-free mode** — hides the names and descriptions of story trophies until they are earned.
- **Offline by design** — static files under `app/`, no build step, no network at runtime, no Rockstar artwork or logos. The look is our own: dusk navy and coral, system fonts.

## Data & sources

`app/data/trophies.json` holds all 55 trophies with the official name, description and grade exactly as PlayStation publishes them (checked against the kit's starter list: no name, description or grade differs), the hidden flag (28 hidden, as published), and the progress target PlayStation tracks where it has one (20 counted trophies, targets as published by PSNProfiles). Each trophy also carries its own guide text, its kind, its roadmap stage, and a Sources line naming where its facts come from. Where a guide goes beyond the official description — for example the timing notes on three one-off moments — it says the detail is an inference, not a confirmed fact.

## Try it

```sh
node serve.ts
# then open http://localhost:8080
```

Fixed screenshot scenes are wired into the app with `?shot=`: `?shot=cover` (checklist with a guide open), `?shot=roadmap` (roadmap view), `?shot=tracker` (filters and spoiler mode on), `?shot=guide` (a single trophy guide with its sources). See `shots.json`.

## Hand it in

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

`main.ts` copies `app/` and `screenshots/` to the output directory and writes `dossier.json` with the vendored make.fun library. An entry for the [gta6-trophy-guide-01 bounty](https://make.fun/bounty/gta6-trophy-guide-01) on make.fun.

## License

MIT — see [LICENSE](LICENSE).

---

Built for the make.fun bounty [gta6-trophy-guide-01](https://make.fun/bounty/gta6-trophy-guide-01). Enter your own at https://make.fun/?ref=1e3qpbvy
