import { DtoCredit } from './credit';
import { DtoRiwayah } from './reciter';

/** A stream of a station (`DtoRadioStream`). */
export interface DtoRadioStream {
  /** The order to try it in. */
  readonly priority: number;
  /** Its address — played directly, never relayed through our server (AGENTS.md §8.4). */
  readonly url: string;
  /** `FAILING` = three failed daily checks: tried last, never dropped. */
  readonly status: 'OK' | 'FAILING' | null;
}

/** A Quran radio station (`DtoRadioStation`). */
export interface DtoRadioStation {
  /** Its id. */
  readonly id: number;
  /** One reciter, several, or a national station. */
  readonly kind: 'RECITER' | 'RECITERS' | 'NATIONAL';
  /** Its Arabic name. */
  readonly nameAr: string;
  /** Its English name. */
  readonly nameEn: string;
  /** Its reciter in `/v1/reciters`, when he is there. */
  readonly reciterId: number | null;
  /** Its riwayah, only when the channel names it — never guessed. */
  readonly riwayah: DtoRiwayah | null;
  /** Its country, for a national station. */
  readonly countryCode: string | null;
  /** The broadcaster's site, for a national station. */
  readonly broadcasterUrl: string | null;
  /** Its streams, in order. */
  readonly streams: readonly DtoRadioStream[];
}

/** The stations (`GET /v1/radios` — `DtoRadios`). */
export interface DtoRadios {
  /** The stations, in order. */
  readonly stations: readonly DtoRadioStation[];
  /** The credits (mp3quran). */
  readonly credits: readonly DtoCredit[];
}
