/** A font or a software library the website ships, with its licence (F17 — the client's own part of the sources). */
export interface WebCredit {
  /** Its name. */
  readonly name: string;
  /** What it is used for. */
  readonly use: string;
  /** Its licence. */
  readonly licence: string;
  /** Its home. */
  readonly url: string;
}

/**
 * The fonts the website ships (self-hosted, no third-party request) — each SIL Open Font License 1.1, its `OFL.txt`
 * read (tajweed-docs `AGENTS.md` §7.1). The uses are written in English, as the names are.
 */
export const WEB_FONTS: readonly WebCredit[] = [
  {
    name: 'QCF V1 — King Fahd Complex, Madinah mushaf 1405H (page fonts, surah names)',
    use: 'the printed pages — Quran fonts provided by Quran Foundation',
    licence: 'Quran Foundation font terms',
    url: 'https://quran.foundation/',
  },
  { name: 'Amiri Quran', use: 'Quran text', licence: 'SIL OFL 1.1', url: 'https://github.com/aliftype/amiri' },
  { name: 'Amiri', use: 'headings', licence: 'SIL OFL 1.1', url: 'https://github.com/aliftype/amiri' },
  { name: 'IBM Plex Sans Arabic', use: 'Arabic interface', licence: 'SIL OFL 1.1', url: 'https://github.com/IBM/plex' },
  { name: 'Inter', use: 'Latin and Cyrillic interface', licence: 'SIL OFL 1.1', url: 'https://github.com/rsms/inter' },
  { name: 'Noto Naskh Arabic', use: 'Pashto interface', licence: 'SIL OFL 1.1', url: 'https://github.com/notofonts/arabic' },
  { name: 'Noto Nastaliq Urdu', use: 'Urdu interface', licence: 'SIL OFL 1.1', url: 'https://github.com/notofonts/nastaliq' },
  { name: 'Vazirmatn', use: 'Persian interface', licence: 'SIL OFL 1.1', url: 'https://github.com/rastikerdar/vazirmatn' },
  { name: 'Noto Sans Devanagari', use: 'Hindi interface', licence: 'SIL OFL 1.1', url: 'https://github.com/notofonts/devanagari' },
  { name: 'Noto Sans Bengali', use: 'Bengali interface', licence: 'SIL OFL 1.1', url: 'https://github.com/notofonts/bengali' },
  { name: 'Noto Sans KR · JP · SC', use: 'Korean, Japanese, Chinese interface', licence: 'SIL OFL 1.1', url: 'https://github.com/notofonts/noto-cjk' },
];

/** The software libraries the website ships, each under the MIT licence. */
export const WEB_LIBRARIES: readonly WebCredit[] = [
  { name: 'Angular', use: 'application framework', licence: 'MIT', url: 'https://angular.dev' },
  { name: 'Angular Material', use: 'interface components', licence: 'MIT', url: 'https://material.angular.dev' },
  { name: 'Tailwind CSS', use: 'styles', licence: 'MIT', url: 'https://tailwindcss.com' },
  { name: 'TanStack Query', use: 'loading data', licence: 'MIT', url: 'https://tanstack.com/query' },
  { name: 'ngx-translate', use: 'interface languages', licence: 'MIT', url: 'https://github.com/ngx-translate/core' },
  { name: 'Adhan (Batoul Apps)', use: 'prayer times, calculated on your device', licence: 'MIT', url: 'https://github.com/batoulapps/adhan-js' },
  { name: 'Express', use: 'the web server', licence: 'MIT', url: 'https://expressjs.com' },
];
