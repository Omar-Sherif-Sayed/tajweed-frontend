// Copies what the web needs from the design of the documentation repository (design 3 — `tajweed-docs`), so that the
// design stays the one source (AGENTS.md §13 of tajweed-docs). Run it after the design changes:
//
//   node tools/sync-design.mjs
//
// It writes (and the outputs are committed):
//   src/i18n/<code>.json                      the interface texts of the 22 languages: the design's own texts, plus
//                                              tools/extra-texts.json for the texts the design does not have
//   src/app/shared/constants/directions.ts    the 28 colour directions: id, names, the swatches of the picker
//   src/styles/_directions.scss               every direction's colours, day and night, as CSS variables
//   src/app/shared/component/general/icon/icons.ts   the design's icons, drawn with `currentColor`
//   public/landscapes/*.svg, public/logo.svg  the landscapes and the logo
//
// Nothing religious is generated here: the texts are interface texts; ayahs always come from the backend's API.

import { readFileSync, writeFileSync, mkdirSync, readdirSync, copyFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const docs = join(root, '..', 'tajweed-docs', 'docs', 'design');
const read = (p) => JSON.parse(readFileSync(p, 'utf8'));

// ---------------------------------------------------------------------------------------------------------------
// 1. The languages and their texts
// ---------------------------------------------------------------------------------------------------------------
const CODES = ['ar', 'en', 'ru', 'es', 'de', 'it', 'fr', 'ur', 'hi', 'ko', 'id',
  'ja', 'zh', 'tr', 'bn', 'fa', 'ms', 'sw', 'ha', 'pt', 'ps', 'uz'];

/** our key → [design folder, design id] */
const FROM_DESIGN = {
  'app.name': ['round2', 'm36'],
  'app.tagline': ['round2', 'm24'],
  'firstLaunch.language': ['round2', 'm25'],
  'firstLaunch.chooseLanguage': ['round2', 'm35'],
  'firstLaunch.nLanguages': ['round2', 'n_languages'],
  'firstLaunch.deviceLanguage': ['round2', 'device_language'],
  'firstLaunch.allLanguages': ['round2', 'all_languages'],
  'firstLaunch.searchLanguages': ['round2', 'search_languages'],
  'firstLaunch.rightToLeft': ['round2', 'right_to_left'],
  'firstLaunch.noLanguage': ['round2', 'no_language'],
  'firstLaunch.colours': ['round2', 'm26'],
  'firstLaunch.day': ['round2', 'm28'],
  'firstLaunch.night': ['round2', 'm29'],
  'firstLaunch.example': ['round2', 'm30'],
  'firstLaunch.start': ['round2', 'm33'],
  'firstLaunch.later': ['round2', 'm34'],
  'firstLaunch.draft': ['round2', 'draft'],
  'home.quran': ['round2', 'm44'],
  'home.recitation': ['round2', 'm45'],
  'home.prayerTimes': ['round2', 'm46'],
};

const tokens = read(join(docs, 'tokens-design-3.json'));
const directionIds = Object.keys(tokens.directions);
for (const id of directionIds) {
  FROM_DESIGN[`directions.${id}`] = id === 'mountains' ? ['round2', 'dir_mountains'] : ['round3', `dir_${id}`];
}

const designKeys = {};
const designTexts = {};
for (const folder of new Set(Object.values(FROM_DESIGN).map(([f]) => f))) {
  designKeys[folder] = Object.fromEntries(read(join(docs, 'prototypes', 'i18n', folder, 'keys.json')).map((k) => [k.id, k]));
  designTexts[folder] = {};
  for (const code of CODES.filter((c) => c !== 'ar' && c !== 'en')) {
    designTexts[folder][code] = read(join(docs, 'prototypes', 'i18n', folder, `${code}.json`));
  }
}
const extra = read(join(here, 'extra-texts.json'));

/** ngx-translate writes a parameter as {{n}}; the design writes {n}. */
const params = (s) => s.replace(/\{(\w+)\}/g, '{{$1}}');

function textOf(code, key) {
  if (extra[key]) {
    const t = extra[key][code];
    if (!t) throw new Error(`extra text ${key} has no ${code}`);
    return t;
  }
  const [folder, id] = FROM_DESIGN[key];
  const k = designKeys[folder][id];
  if (!k) throw new Error(`design key ${folder}/${id} not found`);
  if (code === 'ar' || code === 'en') {
    const t = k[code] || (code === 'ar' ? undefined : undefined);
    if (!t) throw new Error(`design key ${folder}/${id} has no ${code}`);
    return t;
  }
  const t = designTexts[folder][code][id];
  if (!t) throw new Error(`design key ${folder}/${id} has no ${code} translation`);
  return t;
}

// The draft note is not shown in Arabic (the interface's own language): the design leaves it empty there.
const allKeys = [...Object.keys(FROM_DESIGN), ...Object.keys(extra)];
mkdirSync(join(root, 'src', 'i18n'), { recursive: true });
for (const code of CODES) {
  const out = {};
  for (const key of allKeys) {
    let t;
    if (key === 'firstLaunch.draft' && code === 'ar') {
      t = '';
    } else {
      t = params(textOf(code, key));
    }
    const parts = key.split('.');
    let node = out;
    for (const p of parts.slice(0, -1)) node = node[p] ??= {};
    node[parts.at(-1)] = t;
  }
  writeFileSync(join(root, 'src', 'i18n', `${code}.json`), JSON.stringify(out, null, 2) + '\n', 'utf8');
}

// ---------------------------------------------------------------------------------------------------------------
// 2. The colour directions
// ---------------------------------------------------------------------------------------------------------------
const roles = Object.keys(tokens.directions[directionIds[0]].light);
let scss = '// Generated by tools/sync-design.mjs from tajweed-docs/docs/design/tokens-design-3.json — do not edit.\n'
  + '// Every direction of design 3, day and night, as CSS variables --t-<role>; styles.scss maps them onto Angular\n'
  + '// Material\'s system variables and tailwind.css onto Tailwind\'s colours.\n\n';
for (const id of directionIds) {
  for (const mode of ['light', 'dark']) {
    const sel = mode === 'light' ? `[data-direction='${id}']` : `[data-direction='${id}'][data-night='true']`;
    scss += `${sel} {\n` + roles.map((r) => `  --t-${r}: ${tokens.directions[id][mode][r]};`).join('\n') + '\n}\n';
  }
}
mkdirSync(join(root, 'src', 'styles'), { recursive: true });
writeFileSync(join(root, 'src', 'styles', '_directions.scss'), scss, 'utf8');

const ts = `// Generated by tools/sync-design.mjs from tajweed-docs/docs/design/tokens-design-3.json — do not edit.

/** A colour direction of design 3: its id, names and the colours shown on its card in the picker. */
export interface Direction {
  /** The id, as the design names it — also the CSS selector \`[data-direction='<id>']\`. */
  readonly id: string;
  /** The day theme's background, primary and dot colours, for the picker's swatches. */
  readonly swatches: readonly string[];
  /** Whether it is the direction made for low vision and colour blindness (only Mountains — AGENTS.md §8.10). */
  readonly highContrast: boolean;
}

/** The 28 directions of design 3, in the design's order. */
export const DIRECTIONS: readonly Direction[] = [
${directionIds.map((id) => {
  const l = tokens.directions[id].light;
  return `  { id: '${id}', swatches: ['${l.bg}', '${l.primary}', '${l.dot}'], highContrast: ${id === 'mountains'} },`;
}).join('\n')}
];

/** The direction used before the user chooses one: the first of the design. */
export const DEFAULT_DIRECTION = '${directionIds[0]}';
`;
writeFileSync(join(root, 'src', 'app', 'shared', 'constants', 'directions.ts'), ts, 'utf8');

// ---------------------------------------------------------------------------------------------------------------
// 3. Icons, logo, landscapes
// ---------------------------------------------------------------------------------------------------------------
const ICONS = ['globe', 'down', 'search', 'sun', 'moon', 'home', 'book', 'ear', 'shadow', 'more'];
const icons = {};
for (const name of ICONS) {
  let svg = readFileSync(join(docs, 'elements', 'design-3', 'icons', `${name}.svg`), 'utf8').trim();
  svg = svg.replace(/stroke='#[0-9A-Fa-f]{6}'/g, "stroke='currentColor'").replace(/ width='24' height='24'/, '');
  icons[name] = svg;
}
writeFileSync(join(root, 'src', 'app', 'shared', 'component', 'general', 'icon', 'icons.ts'),
  '// Generated by tools/sync-design.mjs from tajweed-docs/docs/design/elements/design-3/icons — do not edit.\n\n'
  + '/** The design\'s icons as SVG text, drawn with `currentColor` so they follow the theme. */\n'
  + `export const ICONS: Readonly<Record<string, string>> = ${JSON.stringify(icons, null, 2)};\n`, 'utf8');

let logo = readFileSync(join(docs, 'elements', 'design-3', 'logo.svg'), 'utf8');
logo = logo.replace(/ width='200' height='200'/, '')
  .replace(/stroke='#26211A'/g, "stroke='currentColor'")
  .replace(/fill='#8C5A2B'/g, "style='fill:var(--t-dot)'")
  .replace(/stroke='#8C5A2B'/g, "style='stroke:var(--t-dot)'");
writeFileSync(join(root, 'src', 'app', 'shared', 'component', 'general', 'icon', 'logo.ts'),
  '// Generated by tools/sync-design.mjs from tajweed-docs/docs/design/elements/design-3/logo.svg — do not edit.\n\n'
  + '/** The logo (an arc of light over the horizon), drawn with the theme\'s ink and dot colours. */\n'
  + `export const LOGO = ${JSON.stringify(logo.trim())};\n`, 'utf8');

mkdirSync(join(root, 'public', 'landscapes'), { recursive: true });
for (const f of readdirSync(join(docs, 'elements', 'design-3', 'landscapes'))) {
  if (f.endsWith('.svg')) copyFileSync(join(docs, 'elements', 'design-3', 'landscapes', f), join(root, 'public', 'landscapes', f));
}
console.log(`design synced: ${CODES.length} languages, ${directionIds.length} directions, ${ICONS.length} icons`);
