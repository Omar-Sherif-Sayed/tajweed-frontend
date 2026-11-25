/** The application's author (`DtoAuthor`). */
export interface DtoAuthor {
  /** His name. */
  readonly name: string;
  /** His one link (LinkedIn — AGENTS.md §2). */
  readonly link: string;
}

/** Facts about the application (`GET /v1/app-info` — `DtoAppInfo`). */
export interface DtoAppInfo {
  /** The full name in the request's language (Arabic or English). */
  readonly name: string;
  /** The short name. */
  readonly shortName: string;
  /** The author. */
  readonly author: DtoAuthor;
  /** The API's version. */
  readonly apiVersion: string;
  /** The language of the answer. */
  readonly language: string;
  /** The 22 language codes. */
  readonly languages: readonly string[];
}

/** One content source (`DtoContentSource`). */
export interface DtoContentSource {
  /** A stable code, e.g. `TANZIL_UTHMANI`. */
  readonly code: string;
  /** The source's name and version. */
  readonly name: string;
  /** Its licence. */
  readonly licence: string;
  /** Where it was obtained. */
  readonly sourceUrl: string;
  /** The file's SHA-256. */
  readonly sha256: string;
  /** The day it was obtained (`YYYY-MM-DD`). */
  readonly obtainedOn: string;
}

/** The content's fingerprint and sources (`GET /v1/content-version` — `DtoContentVersion`). */
export interface DtoContentVersion {
  /** 16 hexadecimal digits; it changes when any source changes. */
  readonly version: string;
  /** Every source. */
  readonly sources: readonly DtoContentSource[];
}
