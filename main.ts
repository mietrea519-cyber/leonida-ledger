// Leonida Ledger hand-in program (Node 22, standard library only).
// The guide itself is this repository's app/ folder: plain static files that open at
// app/index.html and work fully offline. This program copies app/ and screenshots/ into
// the output directory and writes dossier.json there with buildDossier from the vendored
// make.fun library, exactly as the competition kit requires. The vendor library must stay
// byte-identical to the kit copy: the scorer rebuilds the dossier with its own copy and
// compares the two byte for byte.
//
// Run it locally with:  mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(out, { recursive: true });
cpSync(join(here, 'app'), join(out, 'app'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) {
  cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });
}

// The caps below mirror the gate's own limits, so a hand-in this program produces is one
// the scorer accepts: dossier text capped at 160 KiB, at most 4 screenshots of 256 KiB
// each, and app/ within its file-count and byte budgets.
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 50331648,
  }),
);
