// Downloads the Quran Foundation's QCF V1 fonts (the King Fahd 1405H page fonts), the surah-names font and
// UthmanicHafs (the ayah-end markers) into public/qf-fonts/, from the URLs of their font guide
// (api-docs.quran.foundation/docs/tutorials/fonts/font-rendering/, read 2026-11-27).
//
// Their terms (the author's choice, 2026-11-27; parent docs/plan/web-plan.md §7): the fonts may be bundled and served
// by our own site while our Quran Foundation account is active, credited «Quran fonts provided by Quran Foundation»,
// and never offered separately. So: the folder is in .gitignore — the fonts are never committed to any repository —
// and this script is run at deploy time and on a developer's machine.
//
// Usage: node tools/fetch-qf-fonts.mjs        (skips the files already present and valid)

import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

/** The folder the site serves the fonts from (`/qf-fonts/...`). */
const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'qf-fonts');
const BASE = 'https://verses.quran.foundation/fonts/quran';
/** Identifies us to their server, as polite clients do. */
const HEADERS = { 'User-Agent': 'Tajweed-web/0.1 (+https://github.com/Omar-Sherif-Sayed/tajweed-frontend)' };

/** Every file: where it comes from and where it goes. */
const files = [
  ...Array.from({ length: 604 }, (_, i) => ({ url: `${BASE}/hafs/v1/woff2/p${i + 1}.woff2`, to: `v1/p${i + 1}.woff2` })),
  { url: `${BASE}/surah-names/v1/sura_names.woff2`, to: 'sura_names.woff2' },
  { url: `${BASE}/hafs/uthmanic_hafs/UthmanicHafs1Ver18.woff2`, to: 'UthmanicHafs1Ver18.woff2' },
];

/** True when the bytes are a WOFF2 file (it begins with «wOF2»). */
function isWoff2(buf) {
  return buf.length > 4 && buf.subarray(0, 4).toString('latin1') === 'wOF2';
}

/** Downloads one file, retrying a few times with a growing pause. */
async function fetchOne(f) {
  const target = join(OUT, f.to);
  if (existsSync(target) && isWoff2(readFileSync(target))) return { ...f, skipped: true, buf: readFileSync(target) };
  for (let attempt = 1; ; attempt++) {
    try {
      const res = await fetch(f.url, { headers: HEADERS });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const buf = Buffer.from(await res.arrayBuffer());
      if (!isWoff2(buf)) throw new Error('not a WOFF2 file');
      mkdirSync(dirname(target), { recursive: true });
      writeFileSync(target, buf);
      return { ...f, buf };
    } catch (e) {
      if (attempt >= 4) throw new Error(`${f.url}: ${e.message}`);
      await new Promise((r) => setTimeout(r, 1500 * attempt));
    }
  }
}

const manifest = [];
let bytes = 0;
// Four at a time: quick enough, and gentle on their server.
for (let i = 0; i < files.length; i += 4) {
  const done = await Promise.all(files.slice(i, i + 4).map(fetchOne));
  for (const d of done) {
    bytes += d.buf.length;
    manifest.push({ file: d.to, bytes: d.buf.length, sha256: createHash('sha256').update(d.buf).digest('hex'), url: d.url });
  }
}
writeFileSync(
  join(OUT, 'manifest.json'),
  JSON.stringify({ obtained: new Date().toISOString().slice(0, 10), credit: 'Quran fonts provided by Quran Foundation', files: manifest }, null, 1),
);
console.log(`${manifest.length} files, ${(bytes / 1e6).toFixed(1)} MB in public/qf-fonts/`);
