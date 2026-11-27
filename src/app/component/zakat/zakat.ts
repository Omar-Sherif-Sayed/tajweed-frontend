import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { ZAKAT_BODIES, ZakatBody } from '@shared/constants/zakat-bodies';
import { SettingsService } from '@shared/service/settings.service';
import { egyptNisab, saudiNisab, zakatOn, ZakatOutcome } from '@shared/utils/zakat';

/** A body with its outcome for the amounts typed. */
interface BodyOutcome {
  /** The body. */
  readonly body: ZakatBody;
  /** Its nisab and the zakat due. */
  readonly outcome: ZakatOutcome;
}

/**
 * The Zakat calculator (F42, design 3) — money and savings only. The author's decision (2026-11-27): both rulings, each
 * under its body's name — Egypt's Dar al-Ifta and the Saudi Permanent Committee and Council of Senior Scholars — side by
 * side; the app does not choose between them. The visitor types today's prices; nothing is fetched and nothing leaves
 * the device. No inheritance calculator (AGENTS.md F42).
 */
@Component({
  selector: 'tj-zakat',
  imports: [TranslatePipe],
  templateUrl: './zakat.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ZakatComponent {
  /** The interface language. */
  private readonly settings = inject(SettingsService);

  /** The money and savings. */
  protected readonly amount = signal<number | null>(null);

  /** The price of one gram of 21-carat gold. */
  protected readonly gold21 = signal<number | null>(null);

  /** The price of one gram of pure gold. */
  protected readonly gold24 = signal<number | null>(null);

  /** The price of one gram of pure silver. */
  protected readonly silver = signal<number | null>(null);

  /** Each body with its outcome. */
  protected readonly outcomes = computed<BodyOutcome[]>(() =>
    ZAKAT_BODIES.map((body) => ({
      body,
      outcome: zakatOn(
        this.amount(),
        body.id === 'egypt' ? egyptNisab(this.gold21()) : saudiNisab(this.gold24(), this.silver()),
      ),
    })),
  );

  /** The numbers' format in the interface language. */
  private readonly format = computed(() => new Intl.NumberFormat(this.settings.preferences().lang, { maximumFractionDigits: 2 }));

  /**
   * Reads a typed number.
   *
   * @param target the field's signal
   * @param value the field's text
   */
  protected set(target: 'amount' | 'gold21' | 'gold24' | 'silver', value: string): void {
    const n = value.trim() === '' ? null : Number(value);
    this[target].set(n !== null && Number.isFinite(n) ? n : null);
  }

  /**
   * A number in the interface language.
   *
   * @param n the number
   * @returns the number, formatted
   */
  protected num(n: number): string {
    return this.format().format(n);
  }
}
