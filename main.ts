// Vice Sunset Studio — the program that hands the app in (Node 22, stdlib only).
//
// The app itself is plain static files in app/ (index.html plus its modules, no
// build step, nothing fetched from the network), so this file only has to move
// those files and the screenshots into the output directory and write the
// dossier the judge reads, using the kit's vendored make.fun library.
//
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
//   node serve.ts   # then open http://localhost:8080 to try the app

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// Copy the app in whole, then the screenshots beside it.
mkdirSync(outputDir, { recursive: true });
cpSync(join(repoRoot, 'app'), join(outputDir, 'app'), { recursive: true });
mkdirSync(join(outputDir, 'screenshots'), { recursive: true });
const shots = join(repoRoot, 'screenshots');
if (existsSync(shots)) cpSync(shots, join(outputDir, 'screenshots'), { recursive: true });

// The scorer's own caps, mirrored here so a bad entry fails loudly at build
// time instead of at the gate: dossier text at most 160 KiB, at most 4
// screenshots of at most 256 KiB each, app/ at most 993 files and 48 MiB.
writeFileSync(
  join(outputDir, 'dossier.json'),
  buildDossier(outputDir, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 50331648,
    app_path_max_bytes: 1000,
  }),
);
