import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { inject, Injectable, PLATFORM_ID, signal } from '@angular/core';

/**
 * Loads the King Fahd Complex's QCF V1 fonts from our own site (`/qf-fonts/`, fetched at deploy by
 * `tools/fetch-qf-fonts.mjs`; never in the repository): one font per printed page (`qcf-p{page}`) and the surah-names
 * font (`qcf-names`). The Quran Foundation's terms (the author, 2026-11-27): bundled with our site while our account is
 * active, credited «Quran fonts provided by Quran Foundation», never offered on their own. A page is drawn in its font
 * only once the font has loaded; until then — or when a font is missing — the page stays in Amiri Quran, so a glyph is
 * never shown in a font that does not have it.
 */
@Injectable({ providedIn: 'root' })
export class QcfFontsService {
  /** Whether this runs in the browser. */
  private readonly browser = isPlatformBrowser(inject(PLATFORM_ID));

  /** The document, for its font set. */
  private readonly document = inject(DOCUMENT);

  /** The page fonts that have loaded. */
  private readonly loadedPages = signal<ReadonlySet<number>>(new Set());

  /** Whether the surah-names font has loaded. */
  readonly names = signal(false);

  /** The loads already started, so each font is fetched once. */
  private readonly started = new Set<string>();

  /**
   * Whether a page's font is ready.
   *
   * @param page 1 – 604
   * @returns `true` once it has loaded
   */
  ready(page: number): boolean {
    return this.loadedPages().has(page);
  }

  /**
   * Starts loading a page's font, and once the surah-names font and the page-1 font (it draws every basmala).
   *
   * @param page 1 – 604
   */
  load(page: number): void {
    if (page !== 1) {
      this.load(1);
    }
    void this.add(`qcf-p${page}`, `/qf-fonts/v1/p${page}.woff2`).then((ok) => {
      if (ok) {
        this.loadedPages.update((s) => new Set(s).add(page));
      }
    });
    void this.add('qcf-names', '/qf-fonts/sura_names.woff2').then((ok) => {
      if (ok) {
        this.names.set(true);
      }
    });
  }

  /**
   * Loads one font into the document.
   *
   * @param family its family name
   * @param url    where it is served
   * @returns whether it loaded (`false` on the server, or when it is missing)
   */
  private async add(family: string, url: string): Promise<boolean> {
    const fonts = this.document.fonts;
    if (!this.browser || !fonts || typeof FontFace === 'undefined' || this.started.has(family)) {
      return this.started.has(family) && fonts?.check(`12px "${family}"`) === true;
    }
    this.started.add(family);
    try {
      const face = new FontFace(family, `url(${url}) format('woff2')`, { display: 'block' });
      fonts.add(await face.load());
      return true;
    } catch {
      return false;
    }
  }
}
