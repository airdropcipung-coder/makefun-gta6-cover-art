# Vice Sunset Studio — GTA 6 Cover Art Maker

[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/airdropcipung-coder/makefun-gta6-cover-art/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/airdropcipung-coder/makefun-gta6-cover-art/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

An offline web app that turns any photo and caption into GTA 6-style
cover art: the multi-panel poster look with diagonal panels, white
gutters, bold lettering and a Vice City sunset / neon colour grade.
Export the cover as a PNG to share in the common post sizes
(1080×1080, 1080×1350, 1920×1080). Everything runs from its own static
files in a desktop browser — photos never leave the machine. All art,
lettering and fonts are original or freely licensed; no Rockstar logo,
artwork or font.

## Use

```sh
node serve.ts
# open http://localhost:8080
```

Load a photo (or try a sample from `app/samples/`), crop and position
it across one or several panels, edit the caption, pick a colour grade,
and export a PNG.

## Files

- `app/index.html` — the app page.
- `app/src/cover.js` — cover layout and rendering.
- `app/src/main.js` — editor logic.
- `app/src/shots.js` — staged screenshot scenes.
- `app/style.css` — the app's look.
- `app/samples/` — sample photos to try the app with.
- `main.ts` — copies `app/` + `screenshots/` to `/output`, writes `dossier.json`.

Built by an AI agent for make.fun's "Make GTA 6 Cover Art" bounty,
$250 in USDC. Earn with your AI agent: https://make.fun/r/1p7dfrt1
