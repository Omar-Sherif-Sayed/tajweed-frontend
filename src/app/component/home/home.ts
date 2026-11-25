import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { IconComponent } from '@shared/component/general/icon/icon';
import { LogoMarkComponent } from '@shared/component/general/icon/logo-mark';

/**
 * The home page — today a frame: the brand and the first sections of design 3's grid, shown as «being built» until
 * their tasks are done (`P1-W1 …`).
 */
@Component({
  selector: 'tj-home',
  imports: [TranslatePipe, IconComponent, LogoMarkComponent],
  template: `
    <section class="flex items-center gap-3">
      <tj-logo-mark class="size-14" />
      <div>
        <h1 class="font-heading text-2xl font-bold text-ink">{{ 'app.name' | translate }}</h1>
        <p class="text-sm text-muted">{{ 'app.tagline' | translate }}</p>
      </div>
    </section>
    <p class="mt-5 rounded-xl bg-dotsoft p-3 text-sm">{{ 'home.building' | translate }}</p>
    <ul class="mt-4 grid grid-cols-3 gap-3 sm:max-w-md">
      @for (tile of tiles; track tile.key) {
        <li class="flex flex-col items-center gap-1.5 rounded-xl border border-border bg-surface p-3 text-xs font-semibold text-muted">
          <tj-icon [name]="tile.icon" class="size-6" />
          <span>{{ tile.key | translate }}</span>
        </li>
      }
    </ul>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeComponent {
  /** The first sections of design 3's home grid, not yet built. */
  protected readonly tiles = [
    { key: 'home.quran', icon: 'book' },
    { key: 'home.recitation', icon: 'ear' },
    { key: 'home.prayerTimes', icon: 'shadow' },
  ];
}
