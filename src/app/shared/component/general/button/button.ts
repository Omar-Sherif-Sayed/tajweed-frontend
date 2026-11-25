import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';

/**
 * The application's button — the one wrapper around Angular Material's button (the author's rule: pages never import
 * the UI library directly, so it can be replaced without touching them). One `<button>` with one content slot: the
 * look is bound, never chosen by two templates (only one of them would receive the projected content).
 */
@Component({
  selector: 'tj-button',
  imports: [MatButtonModule],
  template: `
    <button
      [matButton]="variant()"
      [type]="type()"
      [disabled]="disabled()"
      [class.w-full]="variant() === 'filled'"
      (click)="pressed.emit()"
    >
      <ng-content />
    </button>
  `,
  host: { class: 'block' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ButtonComponent {
  /** `filled` for the main action of a screen, `outlined` for the others. */
  readonly variant = input<'filled' | 'outlined'>('outlined');

  /** The HTML button type. */
  readonly type = input<'button' | 'submit'>('button');

  /** Whether it can be pressed. */
  readonly disabled = input(false);

  /** Emitted when it is pressed. */
  readonly pressed = output<void>();
}
