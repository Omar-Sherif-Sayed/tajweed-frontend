# AGENTS.md — tajweed-frontend

> **State (2026-11-26): scaffolded (`P0-08`).** Angular 22.3 with server-side rendering, the 22 languages in the URL
> (`/ar/…`, `/en/…`), design 3's 28 colour directions day and night, the first launch as in design 3 (language,
> colours, an example of Al-Fatihah from the backend, «Start»), Home (a frame), About (reads `/v1/app-info` and
> `/v1/content-version`), 404. 14 unit tests, lint at 0 errors with TSDoc on everything, CI. Next: the reader and the
> rest of phase 1 (`P1-W1 …`).

## Read first

This repository is one of five. The product's scope, the binding rules (correct data only, no advertisements, no
login, 22 languages), the decisions and the task list live in the **parent `AGENTS.md`** of the documentation
repository:

- in the working folder: `../tajweed-docs/AGENTS.md` (the five repositories sit side by side in the working folder);
- on GitHub: <https://github.com/Omar-Sherif-Sayed/tajweed-docs/blob/main/AGENTS.md>.

Read its §0 (state and next task), §1 (working agreement), §6 (data integrity), §8.9 (languages) and §10 (web
conventions). The plan this scaffold follows, with the author's answers: `docs/plan/web-plan.md` there. The API it calls:
`tajweed-backend/docs/api/client-guide.md`.

## Rules that apply to every change here

1. **Plan, ask, then code** (parent §1).
2. **TSDoc on everything** (the author's «comments everywhere», parent §1): every class, method, function, interface,
   property and exported constant has a comment saying what it is for. **The lint enforces it** (`eslint-plugin-jsdoc`,
   `jsdoc/require-jsdoc`); lint stays at 0 errors.
3. **No user-facing text in code**: every text is a key in `src/i18n/<code>.json` for all 22 languages (the test
   `src/i18n/i18n.spec.ts` fails otherwise). Religious content is never translated by us (parent §6.10).
4. **No third-party request**: no Google Fonts, no CDN, no analytics, no ads. Fonts and icons are self-hosted.
5. **The Quran text is shown exactly as the backend sends it** — never trimmed, joined, re-encoded or changed (§6.1);
   ayah numbers and highlights are display elements beside it.
6. **Pages never import Angular Material directly**: only our wrappers in `shared/component/general/` do.
7. **Logical-direction utilities only** (`ms-*`, `pe-*`, `start-*`, `text-start` …), never `ml-*`, `mr-*`, `left-*`,
   `right-*`, `text-left`, `text-right` — the same page serves right-to-left and left-to-right languages.
8. **Commits** as Omar Sherif with his address, no AI co-author line; push at the end of a task.

## Versions (read on npm on 2026-11-26 — `P0-06`)

| Part | Version |
| --- | --- |
| Node | 22.23.5 (Angular 22.3 needs `^22.22.3 \|\| ^24.15.0 \|\| >=26`) |
| Angular (core, CLI, build, SSR, Material, CDK) | 22.3.0 |
| TypeScript | 6.0.3 (Angular 22.3's compiler accepts `>=6.0 <6.1`) |
| Tailwind CSS (`@tailwindcss/postcss`) | 4.3.x — added with `ng add tailwindcss` |
| TanStack Query (`@tanstack/angular-query-experimental`) | 5.107.2 |
| ngx-translate (`@ngx-translate/core`) | 18.1.0 |
| Vitest | 5.x (Angular's default runner) · jsdom |
| angular-eslint | 22.8.0 · eslint-plugin-jsdoc 65.5.5 |
| Express (the SSR server) | 5.x |
| Fonts (`@fontsource/*`, SIL OFL 1.1) | 5.3.x: IBM Plex Sans Arabic, Inter, Amiri, Amiri Quran, Noto Nastaliq Urdu, Noto Sans Devanagari / Bengali / KR / JP / SC, Vazirmatn, Noto Naskh Arabic |
| CI actions | checkout v7, setup-node v7 (7.1.0 read on its releases page 2026-11-26) |

## Structure

```
src/
  server.ts                    the Express server of SSR: static files, then `/` → `/<lang>/` for a returning visitor
                               (the cookie), then Angular renders the page
  index.html                   <html lang dir data-direction data-night>, filled per request
  tailwind.css                 Tailwind, its colours and fonts mapped onto design 3's tokens
  styles.scss                  Material's theme mapped onto the tokens; the Quran text and ayah number styles
  styles/_directions.scss      GENERATED: the 28 directions × day / night as CSS variables --t-<role>
  styles/fonts.css             the fonts of every page; styles/fonts/<code>.css: one script's fonts, loaded only with
                               its language (angular.json: bundleName font-<code>, inject false)
  i18n/<code>.json             GENERATED: the interface texts of the 22 languages
  environments/                apiUrl: production (set at release) and development (http://localhost:8080)
  app/
    app.config.ts              zoneless, router, hydration, HttpClient on fetch, TanStack Query, ngx-translate
    app.config.server.ts       + server rendering;  app.routes.server.ts: every route rendered per request
    app.routes.ts              `/` first launch · `/:lang` (one of 22) → layout → '' home, 'about' · 404
    component/<module>/        pages: onboarding/first-launch, home, about, not-found
    shared/
      component/general/       our wrappers: button (Material), icon and logo-mark (design 3's SVGs, GENERATED icons.ts,
                               logo.ts)
      component/business/      language-picker (the searchable list of 22)
      layout/main-layout       brand, navigation, language button
      routing/language.ts      languageMatch (the URL's language), the resolvers, hreflang
      service/                 settings.service (language, appearance, cookie), preferences (the cookie),
                               translate-loader (the JSON files, bundled per language), integration/<area>/ (the API)
      schema/response/         Dto* interfaces mirroring the backend
      constants/               languages (the 22, as data), directions (GENERATED)
tools/sync-design.mjs          copies the design from ../tajweed-docs: texts, tokens, icons, logo, landscapes
tools/extra-texts.json         the interface texts the design does not have, in the 22 languages
public/landscapes/             GENERATED copies of design 3's 56 landscapes (day and night)
```

## Conventions — with the real code as the example

- **Standalone components, `OnPush`, signals** (`input`, `output`, `signal`, `computed`, `viewChild`), built-in
  control flow, `inject()`; selector prefix `tj-`. Example: `shared/component/business/language-picker`.
- **The language is in the URL** (the author, 2026-11-26). `languageMatch` accepts only the 22 codes; `languageResolver`
  applies the language (translations, `lang`, `dir`, font, title, the script's font stylesheet) and the appearance
  before the page renders — on the server too — and writes the 22 `hreflang` links.
- **One functional cookie**, `tajweed_prefs` = `<lang>.<direction>.<0|1>` (`shared/service/preferences.ts`): written only
  in the browser, after the visitor chooses; read by the server to render in the visitor's language and colours.
  Nothing else is stored, nothing is sent anywhere but our own server; the privacy policy says so.
- **Server and browser**: anything that exists only in the browser (storage, audio, geolocation, the compass) is used
  only there (`isPlatformBrowser`); `REQUEST` gives the server the request's cookie and `Accept-Language`;
  `RESPONSE_INIT` sets a 404.
- **Data**: an `integration/<area>/<area>.service.ts` per backend area, through `ApiClient` (`Accept-Language`, the
  envelope's `data`); pages read it with `injectQuery` (TanStack Query). During SSR the answers travel to the browser
  with the page (Angular's HTTP transfer cache), so the browser does not ask again.
- **Design**: run `node tools/sync-design.mjs` after the design changes in `tajweed-docs`; commit what it writes. Colours
  come only from the tokens (`var(--t-…)`, or Tailwind's `bg-surface`, `text-muted`, `border-border` …).
- **Icons**: `<tj-icon name="globe" />` — design 3's SVGs, drawn in `currentColor`, decorative (`aria-hidden`).
- **Accessibility**: the templates pass angular-eslint's accessibility rules; dialogs have `role="dialog"`,
  `aria-modal`, a label and close on Escape; switches use `role="switch"` and `aria-checked`.

## Build, test, run

```bash
npm ci
npx ng lint                 # 0 errors, TSDoc everywhere
npx ng test --watch=false   # Vitest
npx ng build                # production build with SSR → dist/tajweed-frontend/{browser,server}
npm start                   # ng serve on http://localhost:4200, rendered on the server; the backend on :8080
node dist/tajweed-frontend/server/server.mjs   # the built server (PORT, default 4000)
```

The backend must allow the web's origin (`CORS_ORIGINS` there). The workspace's `.claude/launch.json` starts both for
the agent's previews (`backend`, `web`).

Size budget (`angular.json`): the first load is about 685 kB raw — 170 kB over the network — mostly Angular, Material,
TanStack Query and ngx-translate; the warning stands at 750 kB so a real increase is noticed. The fonts of
Chinese, Japanese and Korean (about 200 kB of CSS each) load only with their language.

## Verified on 2026-11-26

- `ng lint` 0 errors; `ng test` 14 tests (the 22 languages and their directions, `Accept-Language`, the cookie, the same
  keys in all 22 text files, the 28 directions named, the language search by own / Arabic / English name and code);
  `ng build` with SSR.
- In the browser with the local backend: `/` renders the first launch in the browser's language (English), the 28
  directions with their landscapes, Al-Fatihah from `/v1/surahs/1/ayahs` in Amiri Quran with its source; «Start» saves the
  cookie and opens `/en`; `/ar/about` right to left with the backend's app info and every content source; `/ur/`
  rendered on the server with `lang="ur" dir="rtl"`, Noto Nastaliq Urdu, its Urdu title, `font-ur.css` and the 22
  `hreflang` links; with the cookie `/` answers `302 → /en/`; `/xx/about` answers `404`.
