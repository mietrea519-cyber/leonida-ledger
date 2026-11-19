// Leonida Ledger — hand-in program for the gta6-trophy-guide-01 bounty (Node 22, standard library only).
//
// The guide itself is the static site in app/: index.html, its stylesheet and modules, and
// app/data/trophies.json with all 55 official trophies and their guides. It builds nothing and
// loads nothing from the network. This program's one job is the hand-in: copy app/ and
// screenshots/ into the output directory and write dossier.json there with buildDossier from
// vendor/makefun-frontend.ts, the kit's library, left byte for byte unchanged so the dossier
// this program writes is the dossier the scorer rebuilds.
//
// Run it locally the same way the grader does, with MAKEFUN_OUTPUT_DIR standing in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
// Serve the guide locally with: node serve.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// Copy the guide exactly as it stands in the repository: no transforms, no build step.
mkdirSync(outputDir, { recursive: true });
cpSync(join(repoRoot, 'app'), join(outputDir, 'app'), { recursive: true });

// Screenshots ride along beside the app; the first by name is the cover the judge sees.
mkdirSync(join(outputDir, 'screenshots'), { recursive: true });
if (existsSync(join(repoRoot, 'screenshots'))) {
  cpSync(join(repoRoot, 'screenshots'), join(outputDir, 'screenshots'), { recursive: true });
}

// The dossier limits mirror the scorer's caps for this bounty: at most 4 screenshots of
// 256 KiB each, at most 993 files and directories and 48 MiB inside app/, and a text view
// of the source capped at 163,840 bytes.
const dossier = buildDossier(outputDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
});
writeFileSync(join(outputDir, 'dossier.json'), dossier);

console.log(`Leonida Ledger handed in to ${outputDir}: app/, screenshots/ and dossier.json written.`);
