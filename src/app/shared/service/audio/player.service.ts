import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { computed, inject, Injectable, PLATFORM_ID, signal } from '@angular/core';
import { DtoRadioStation, DtoRadioStream } from '@shared/schema/response/radio';
import { DtoAudioSource, DtoAyahTiming, DtoRecitation } from '@shared/schema/response/reciter';
import { DtoSurah } from '@shared/schema/response/quran';
import { QuranService } from '@shared/service/integration/quran/quran.service';
import { ReciterService } from '@shared/service/integration/reciter/reciter.service';
import { ayahAt, fillTemplate, nextSurah, orderSources, retryStep } from './playback-plan';

/** What the player is doing. */
export type PlayerStatus = 'idle' | 'loading' | 'playing' | 'paused' | 'reconnecting';

/** How a recitation is played (F3). */
export type RecitationMode = 'surah' | 'range' | 'endless';

/** A request to play a recitation. */
export interface RecitationRequest {
  /** The recitation, as `GET /v1/recitations/{id}` gives it. */
  readonly recitation: DtoRecitation;
  /** The surah to start with. */
  readonly surah: number;
  /** One surah, a range of ayahs, or to the end and again from Al-Fatihah. */
  readonly mode: RecitationMode;
  /** The first ayah (range and endless modes; default 1). */
  readonly from?: number;
  /** The last ayah (range mode; default the surah's last). */
  readonly to?: number;
  /** How many times the surah or the range is played (1 = once). */
  readonly repeat?: number;
}

/** What is playing. */
export type NowPlaying =
  | {
      /** A recitation. */
      readonly kind: 'recitation';
      /** The recitation. */
      readonly recitation: DtoRecitation;
      /** The mode. */
      readonly mode: RecitationMode;
      /** The surah being played. */
      readonly surah: number;
      /** The ayah being recited, when known (ayah files, or a surah file with timings). */
      readonly ayah: number | null;
    }
  | {
      /** A radio station. */
      readonly kind: 'radio';
      /** The station. */
      readonly station: DtoRadioStation;
    };

/** A change of the surah or the ayah being played. */
interface NowChange {
  /** The surah. */
  readonly surah?: number;
  /** The ayah, or `null` when it is not known. */
  readonly ayah?: number | null;
}

/** One playable address of the current item, with what is needed to resume on it. */
interface Source {
  /** `SURAH_FILE`, `AYAH_FILE`, or a radio `STREAM`. */
  readonly kind: 'SURAH_FILE' | 'AYAH_FILE' | 'STREAM';
  /** The address or its template. */
  readonly url: string;
}

/**
 * The one audio player of the application, implementing resilient playback (F11, AGENTS.md §8.3, client guide §5):
 * every recitation and station has its sources in order; on an error the same source is tried again with a growing
 * delay (capped at 30 s), then the next, round and round, **without limit**, until the visitor stops it; when the
 * network comes back it retries at once; a file resumes where it stopped, a radio at the live point; the screen shows
 * «جارٍ إعادة الاتصال…». Recitations play one surah, a range (with repeat), or to the end of the Quran and again from
 * Al-Fatihah, forever (F3). Audio streams straight from its source, never through our server. In the browser only.
 */
@Injectable({ providedIn: 'root' })
export class PlayerService {
  /** Whether this runs in the browser (no audio on the server). */
  private readonly browser = isPlatformBrowser(inject(PLATFORM_ID));

  /** The page. */
  private readonly document = inject(DOCUMENT);

  /** The recitations' timings. */
  private readonly reciters = inject(ReciterService);

  /** The surahs' ayah counts. */
  private readonly quran = inject(QuranService);

  /** What the player is doing. */
  readonly status = signal<PlayerStatus>('idle');

  /** What is playing, or `null`. */
  readonly now = signal<NowPlaying | null>(null);

  /** Whether something is loaded (playing, paused or reconnecting). */
  readonly active = computed(() => this.now() !== null);

  /** The audio element, made on first use. */
  private audio: HTMLAudioElement | null = null;

  /** The current item's sources, in the order to try. */
  private sources: Source[] = [];

  /** The source being tried, as an index of {@link sources}. */
  private sourceIndex = 0;

  /** The source the item started on — the rounds of retries start from it. */
  private firstIndex = 0;

  /** Failures in a row; 0 after a success. */
  private failures = 0;

  /** The pending retry. */
  private retryTimer: ReturnType<typeof setTimeout> | null = null;

  /** Where to resume a surah file after a failure, in milliseconds. */
  private resumeMs: number | null = null;

  /** The last position reached in the surah file playing, in milliseconds — where a failure resumes. */
  private lastMs = 0;

  /** The recitation request being played. */
  private request: Required<RecitationRequest> | null = null;

  /** How many more times the surah or range is played after this one. */
  private repeatsLeft = 0;

  /** The timings of the surah being played (surah files), when the recitation has them. */
  private timings: readonly DtoAyahTiming[] = [];

  /** The surahs, for their ayah counts. */
  private surahList: Promise<DtoSurah[]> | null = null;

  /** Increased on every new item, so the answers of an older one are ignored. */
  private generation = 0;

  /** Set while the end of a surah or range is handled, so `timeupdate` does not handle it twice. */
  private ending = false;

  /**
   * Plays a recitation.
   *
   * @param req what to play
   */
  async playRecitation(req: RecitationRequest): Promise<void> {
    if (!this.browser) {
      return;
    }
    const surahs = await this.surahs();
    const count = surahs.find((s) => s.number === req.surah)?.ayahCount ?? 1;
    this.request = {
      ...req,
      from: req.mode === 'surah' ? 1 : Math.max(1, req.from ?? 1),
      to: req.mode === 'range' ? Math.min(count, req.to ?? count) : count,
      repeat: Math.max(1, req.repeat ?? 1),
    };
    this.repeatsLeft = this.request.repeat - 1;
    this.sources = orderSources(req.recitation.sources).map((s: DtoAudioSource) => ({ kind: s.kind, url: s.urlTemplate }));
    this.startItem();
    this.now.set({ kind: 'recitation', recitation: req.recitation, mode: req.mode, surah: req.surah, ayah: this.request.from });
    await this.loadSurah(req.surah, this.request.from);
  }

  /**
   * Plays a radio station, at the live point.
   *
   * @param station the station
   */
  playRadio(station: DtoRadioStation): void {
    if (!this.browser) {
      return;
    }
    this.request = null;
    this.timings = [];
    this.sources = orderSources(station.streams).map((s: DtoRadioStream) => ({ kind: 'STREAM' as const, url: s.url }));
    this.startItem();
    this.now.set({ kind: 'radio', station });
    this.load();
  }

  /** Pauses. */
  pause(): void {
    this.clearRetry();
    this.audio?.pause();
    if (this.now()) {
      this.status.set('paused');
    }
  }

  /** Resumes after a pause — a radio at the live point. */
  resume(): void {
    const now = this.now();
    if (!now) {
      return;
    }
    if (now.kind === 'radio') {
      this.load();
    } else if (this.ending && this.request) {
      // The surah or range had ended: play it again from its start.
      this.repeatsLeft = this.request.repeat - 1;
      void this.loadSurah(now.surah, this.request.from);
    } else {
      void this.audio?.play().catch(() => this.fail());
    }
  }

  /** Stops and forgets what was playing. */
  stop(): void {
    this.generation++;
    this.clearRetry();
    if (this.audio) {
      this.audio.pause();
      this.audio.removeAttribute('src');
      this.audio.load();
    }
    this.request = null;
    this.now.set(null);
    this.status.set('idle');
  }

  /** Goes to the next surah (endless and surah modes). */
  async nextTrack(): Promise<void> {
    const req = this.request;
    const now = this.now();
    if (!req || now?.kind !== 'recitation') {
      return;
    }
    const next = nextSurah(now.surah, req.recitation.surahs);
    if (next !== null) {
      await this.playRecitation({ ...req, surah: next, mode: req.mode === 'range' ? 'surah' : req.mode, from: 1 });
    }
  }

  // -------------------------------------------------------------------------------------------------------------
  // Loading and the events of the audio element
  // -------------------------------------------------------------------------------------------------------------

  /** Begins a new item: forgets the failures and the old item's answers. */
  private startItem(): void {
    this.generation++;
    this.clearRetry();
    this.failures = 0;
    this.sourceIndex = 0;
    this.firstIndex = 0;
    this.resumeMs = null;
    this.ensureAudio();
  }

  /**
   * Prepares a surah: its timings when a surah file will be played, then plays from an ayah.
   *
   * @param surah the surah
   * @param ayah the ayah to start at
   */
  private async loadSurah(surah: number, ayah: number): Promise<void> {
    const gen = this.generation;
    this.timings = [];
    const req = this.request!;
    if (req.recitation.recitation.hasTimings && this.sources.some((s) => s.kind === 'SURAH_FILE')) {
      try {
        const answer = await this.reciters.getTimings(req.recitation.recitation.id, surah);
        if (gen !== this.generation) {
          return;
        }
        this.timings = answer.timings;
      } catch {
        this.timings = [];
      }
    }
    this.setNow({ surah, ayah });
    this.resumeMs = this.startMsOf(ayah);
    this.lastMs = 0;
    this.load();
  }

  /** Plays the current item on the current source. */
  private load(): void {
    const audio = this.ensureAudio();
    const source = this.sources[this.sourceIndex];
    if (!audio || !source) {
      return;
    }
    const now = this.now();
    let url = source.url;
    if (now?.kind === 'recitation') {
      url = source.kind === 'AYAH_FILE' ? fillTemplate(source.url, now.surah, Math.max(1, now.ayah ?? 1)) : fillTemplate(source.url, now.surah);
    }
    this.status.set(this.failures > 0 ? 'reconnecting' : 'loading');
    this.ending = false;
    audio.src = url;
    audio.load();
    void audio.play().catch(() => {
      // An error event follows when the address fails; a refusal to autoplay leaves it paused.
      if (audio.error === null && this.status() === 'loading') {
        this.status.set('paused');
      }
    });
    this.updateMediaSession();
  }

  /** Makes the audio element and listens to it, once. */
  private ensureAudio(): HTMLAudioElement | null {
    if (!this.browser) {
      return null;
    }
    if (this.audio) {
      return this.audio;
    }
    const audio = this.document.createElement('audio');
    audio.preload = 'auto';
    audio.addEventListener('loadedmetadata', () => this.onMetadata());
    audio.addEventListener('playing', () => this.onPlaying());
    audio.addEventListener('timeupdate', () => this.onTime());
    audio.addEventListener('ended', () => void this.onEnded());
    audio.addEventListener('error', () => this.fail());
    this.document.defaultView?.addEventListener('online', () => this.onOnline());
    this.audio = audio;
    this.setupMediaSession();
    return audio;
  }

  /** Seeks a surah file to where it should start or resume. */
  private onMetadata(): void {
    const source = this.sources[this.sourceIndex];
    if (this.audio && source?.kind === 'SURAH_FILE' && this.resumeMs) {
      this.audio.currentTime = this.resumeMs / 1000;
    }
    this.resumeMs = null;
  }

  /** Playing: the failures are over. */
  private onPlaying(): void {
    this.failures = 0;
    this.firstIndex = this.sourceIndex;
    this.status.set('playing');
  }

  /** Follows the ayah in a surah file, and ends a range at its last ayah. */
  private onTime(): void {
    const now = this.now();
    const source = this.sources[this.sourceIndex];
    // A failing address resets the element to 0 before its error: that 0 is not a position reached.
    if (this.audio && source?.kind === 'SURAH_FILE' && this.status() === 'playing' && this.audio.currentTime > 0) {
      this.lastMs = this.audio.currentTime * 1000;
    }
    if (
      !this.audio ||
      this.ending ||
      this.status() === 'paused' ||
      now?.kind !== 'recitation' ||
      source?.kind !== 'SURAH_FILE' ||
      this.timings.length === 0
    ) {
      return;
    }
    const ms = this.audio.currentTime * 1000;
    const req = this.request;
    const last = this.timings.find((t) => t.ayah === req?.to);
    if (req && req.mode === 'range' && last && ms >= last.endMs) {
      void this.onEnded();
      return;
    }
    const ayah = ayahAt(this.timings, ms);
    if (ayah !== null && ayah !== now.ayah) {
      this.setNow({ ayah });
    }
  }

  /** An ayah file ended: the next ayah; a surah or a range ended: repeat, the next surah, or stop. */
  private async onEnded(): Promise<void> {
    const now = this.now();
    const req = this.request;
    if (now?.kind !== 'recitation' || !req || this.ending) {
      return;
    }
    this.ending = true;
    const source = this.sources[this.sourceIndex];
    const lastAyah = await this.lastAyah(now.surah);
    if (source?.kind === 'AYAH_FILE' && (now.ayah ?? 1) < lastAyah) {
      this.setNow({ ayah: (now.ayah ?? 1) + 1 });
      this.load();
      return;
    }
    if (this.repeatsLeft > 0) {
      this.repeatsLeft--;
      await this.loadSurah(now.surah, req.from);
      return;
    }
    if (req.mode === 'endless') {
      const next = nextSurah(now.surah, req.recitation.surahs);
      if (next !== null) {
        this.request = { ...req, from: 1, to: await this.lastAyah(next) };
        this.repeatsLeft = req.repeat - 1;
        await this.loadSurah(next, 1);
        return;
      }
    }
    this.audio?.pause();
    this.status.set('paused');
    this.setNow({ ayah: null });
  }

  /** A failure: remember where it stopped, then try again — the same source, then the next, without limit. */
  private fail(): void {
    if (!this.now() || this.status() === 'paused') {
      return;
    }
    const source = this.sources[this.sourceIndex];
    if (this.audio && source?.kind === 'SURAH_FILE') {
      const ms = Math.max(this.audio.currentTime * 1000, this.lastMs);
      if (ms > 0) {
        this.resumeMs = ms;
      }
    }
    this.failures++;
    this.clearRetry();
    const step = retryStep(this.failures, this.sources.length, this.firstIndex);
    this.status.set('reconnecting');
    const gen = this.generation;
    this.retryTimer = setTimeout(() => {
      if (gen === this.generation) {
        this.switchTo(step.sourceIndex);
      }
    }, step.delayMs);
  }

  /** The network is back: try at once (AGENTS.md §8.3). */
  private onOnline(): void {
    if (this.status() === 'reconnecting') {
      this.clearRetry();
      this.switchTo(this.sourceIndex);
    }
  }

  /**
   * Plays on another source; a surah file resumes at the position, an ayah file at the ayah (client guide §5 rule 5).
   *
   * @param index the source
   */
  private switchTo(index: number): void {
    const from = this.sources[this.sourceIndex];
    const to = this.sources[index];
    if (from?.kind === 'AYAH_FILE' && to?.kind === 'SURAH_FILE') {
      const now = this.now();
      this.resumeMs = now?.kind === 'recitation' ? this.startMsOf(now.ayah ?? 1) : null;
    }
    this.sourceIndex = index;
    this.load();
  }

  /** Cancels the pending retry. */
  private clearRetry(): void {
    if (this.retryTimer !== null) {
      clearTimeout(this.retryTimer);
      this.retryTimer = null;
    }
  }

  // -------------------------------------------------------------------------------------------------------------
  // Helpers
  // -------------------------------------------------------------------------------------------------------------

  /**
   * Updates the surah or ayah of the recitation playing.
   *
   * @param change the new surah and / or ayah
   */
  private setNow(change: NowChange): void {
    const now = this.now();
    if (now?.kind === 'recitation') {
      this.now.set({ ...now, ...change });
    }
  }

  /**
   * Where an ayah starts in the surah file, from the timings.
   *
   * @param ayah the ayah
   * @returns milliseconds, or `null` without timings (the file starts at its beginning)
   */
  private startMsOf(ayah: number): number | null {
    if (ayah <= 1) {
      return null;
    }
    return this.timings.find((t) => t.ayah === ayah)?.startMs ?? null;
  }

  /**
   * The last ayah to play in a surah: the range's end, or the surah's last.
   *
   * @param surah the surah
   * @returns the ayah
   */
  private async lastAyah(surah: number): Promise<number> {
    const req = this.request;
    if (req?.mode === 'range') {
      return req.to;
    }
    return (await this.surahs()).find((s) => s.number === surah)?.ayahCount ?? 1;
  }

  /**
   * The surahs, fetched once.
   *
   * @returns the surahs
   */
  private surahs(): Promise<DtoSurah[]> {
    this.surahList ??= this.quran.getSurahs().catch((e: unknown) => {
      this.surahList = null;
      throw e;
    });
    return this.surahList;
  }

  /** The lock-screen and media-key controls (Media Session). */
  private setupMediaSession(): void {
    const session = this.document.defaultView?.navigator.mediaSession;
    if (!session) {
      return;
    }
    session.setActionHandler('play', () => this.resume());
    session.setActionHandler('pause', () => this.pause());
    session.setActionHandler('stop', () => this.stop());
    session.setActionHandler('nexttrack', () => void this.nextTrack());
  }

  /** Names what is playing on the lock screen. */
  private updateMediaSession(): void {
    const view = this.document.defaultView;
    const now = this.now();
    if (!view?.navigator.mediaSession || !now || typeof MediaMetadata === 'undefined') {
      return;
    }
    view.navigator.mediaSession.metadata =
      now.kind === 'radio'
        ? new MediaMetadata({ title: now.station.nameAr, artist: now.station.nameEn })
        : new MediaMetadata({ title: `${now.surah}`, artist: now.recitation.reciterNameAr, album: now.recitation.recitation.nameAr });
  }
}
