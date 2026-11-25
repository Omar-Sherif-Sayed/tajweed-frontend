# Tajweed — web application · تجويد — تطبيق الويب

Part of **Tajweed - The Noble Quran and Its Sciences** (تجويد - القرآن الكريم وعلومه): a free Islamic application for the
Quran, its recitation and its sciences — web, Android and iPhone, in 22 languages. No advertisements, no registration,
no login, no tracking.

> **State (2026-11-26): scaffolded.** The first launch (language, colours, an example of Al-Fatihah), the frame of
> the home page, About, in the 22 languages. The reader and the other features come next.

## What it is built with

Angular 22 with server-side rendering · Angular Material · Tailwind CSS · TanStack Query · ngx-translate ·
self-hosted fonts (SIL Open Font Licence). Every page lives under its language: `/ar/…`, `/en/…`, `/ur/…` and the
others; Arabic, Urdu, Persian and Pashto are shown right to left.

## Run it on your computer

1. Install Node 22 (22.22.3 or later).
2. Start the backend (`tajweed-backend`, `./gradlew bootRun` — it listens on port 8080).
3. In this folder:

   ```bash
   npm ci
   npm start
   ```

4. Open <http://localhost:4200>.

| Command | What it does |
| --- | --- |
| `npx ng lint` | checks the code (0 errors; a comment on everything) |
| `npx ng test --watch=false` | runs the unit tests |
| `npx ng build` | builds the production version with its server (`dist/`) |
| `node tools/sync-design.mjs` | copies the design's texts, colours, icons and landscapes from `../tajweed-docs` |

## The plan and the rules

The whole product — scope, rules, decisions, content sources, and the task list with its status — is documented in
the documentation repository: <https://github.com/Omar-Sherif-Sayed/tajweed-docs>. Start with its `AGENTS.md`. For
this codebase: [`AGENTS.md`](AGENTS.md).

| Repository | Content |
| --- | --- |
| [`tajweed-docs`](https://github.com/Omar-Sherif-Sayed/tajweed-docs) | Plan, rules, sources, designs, records |
| [`tajweed-backend`](https://github.com/Omar-Sherif-Sayed/tajweed-backend) | REST API |
| [`tajweed-frontend`](https://github.com/Omar-Sherif-Sayed/tajweed-frontend) | Web application |
| [`tajweed-android`](https://github.com/Omar-Sherif-Sayed/tajweed-android) | Android application |
| [`tajweed-ios`](https://github.com/Omar-Sherif-Sayed/tajweed-ios) | iPhone application |

## Licence

The code is under the MIT licence ([`LICENSE`](LICENSE)). **The content the application shows** — the Quran text,
audio recordings, tafsir, hadith, books — **is not covered by it**: it belongs to its sources and keeps their
licences, which are listed in the documentation repository. The fonts keep their SIL Open Font Licence; the design's
landscapes and icons come from the documentation repository (CC BY 4.0).

Author: **Omar Sherif — عمر شريف** · <https://www.linkedin.com/in/omarsherif21/>
