import { DtoContentSource } from './appinfo';
import { DtoCredit } from './credit';

/** A riwayah (`DtoRiwayah`). */
export interface DtoRiwayah {
  /** Its id. */
  readonly id: number;
  /** Its Arabic name, e.g. «حفص عن عاصم». */
  readonly nameAr: string;
  /** Its English name. */
  readonly nameEn: string;
  /** The rawi, in Arabic. */
  readonly rawiAr: string;
  /** The qari, in Arabic. */
  readonly qariAr: string;
  /** Whether it is the riwayah of the displayed text (Hafs from Asim). */
  readonly matchesDisplayedText: boolean;
}

/** The style of a recitation. */
export type RecitationStyle = 'MURATTAL' | 'MUJAWWAD' | 'MUALLIM';

/** A recitation in the reciter picker (`DtoRecitationSummary`). */
export interface DtoRecitationSummary {
  /** Its id. */
  readonly id: number;
  /** Its reciter. */
  readonly reciterId: number;
  /** Its own label, in Arabic. */
  readonly nameAr: string;
  /** Its own label, in English. */
  readonly nameEn: string;
  /** Its style, when known — absent otherwise (then its own label is shown). */
  readonly style: RecitationStyle | null;
  /** Its riwayah — always shown (the author, 2026-11-22). */
  readonly riwayah: DtoRiwayah;
  /** Where its catalogue comes from. */
  readonly provider: 'MP3QURAN' | 'EVERYAYAH';
  /** Not Hafs: listening only, the Hafs text is never followed or highlighted (AGENTS.md §6.7). */
  readonly listeningOnly: boolean;
  /** How many surahs it has. */
  readonly surahCount: number;
  /** Whether it has all 114. */
  readonly complete: boolean;
  /** Whether ayah timings exist for its surah files. */
  readonly hasTimings: boolean;
}

/** A reciter with his recitations (`DtoReciter`). */
export interface DtoReciter {
  /** His id. */
  readonly id: number;
  /** His Arabic name. */
  readonly nameAr: string;
  /** His English name. */
  readonly nameEn: string;
  /** His recitations, Hafs first. */
  readonly recitations: readonly DtoRecitationSummary[];
}

/** An audio source of a recitation (`DtoAudioSource`). */
export interface DtoAudioSource {
  /** The order to try it in. */
  readonly priority: number;
  /** One file per surah, or one per ayah. */
  readonly kind: 'SURAH_FILE' | 'AYAH_FILE';
  /** Its provider. */
  readonly provider: 'MP3QURAN' | 'EVERYAYAH';
  /** The address, with `{surah}` (and `{ayah}`) written as three digits. */
  readonly urlTemplate: string;
  /** Its bitrate, when known. */
  readonly bitrateKbps: number | null;
  /** Whether its owner allows downloading (F28) — no source today. */
  readonly downloadAllowed: boolean;
  /** `FAILING` = three failed daily checks: tried last, never dropped. */
  readonly status: 'OK' | 'FAILING' | null;
}

/** What a player needs (`GET /v1/recitations/{id}` — `DtoRecitation`). */
export interface DtoRecitation {
  /** The recitation. */
  readonly recitation: DtoRecitationSummary;
  /** The reciter's Arabic name. */
  readonly reciterNameAr: string;
  /** The reciter's English name. */
  readonly reciterNameEn: string;
  /** The surahs it has. */
  readonly surahs: readonly number[];
  /** Its sources, in order. */
  readonly sources: readonly DtoAudioSource[];
  /** The credits to show on the player. */
  readonly credits: readonly DtoCredit[];
}

/** One ayah's place in a surah file (`DtoAyahTiming`), in milliseconds; ayah 0 is what comes before ayah 1. */
export interface DtoAyahTiming {
  /** The ayah. */
  readonly ayah: number;
  /** Where it starts. */
  readonly startMs: number;
  /** Where it ends. */
  readonly endMs: number;
}

/** The ayah timings of a surah file (`DtoSurahTimings`). */
export interface DtoSurahTimings {
  /** The recitation. */
  readonly recitationId: number;
  /** The surah. */
  readonly surahNumber: number;
  /** The timings, in order. */
  readonly timings: readonly DtoAyahTiming[];
  /** Their source. */
  readonly source: DtoContentSource;
}
