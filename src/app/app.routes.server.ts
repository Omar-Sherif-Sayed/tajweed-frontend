import { RenderMode, ServerRoute } from '@angular/ssr';

/**
 * Every page is rendered on the server per request (SSR — the author, 2026-11-26): the page's language is in its URL,
 * and the first launch reads the visitor's cookie and language, so nothing is prerendered at build time.
 */
export const serverRoutes: ServerRoute[] = [{ path: '**', renderMode: RenderMode.Server }];
