import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { languageOf } from '@shared/constants/languages';
import { LanguagePickerComponent } from './language-picker';

describe('LanguagePickerComponent', () => {
  let fixture: ComponentFixture<LanguagePickerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LanguagePickerComponent],
      providers: [provideTranslateService({ fallbackLang: 'en' })],
    }).compileComponents();
    fixture = TestBed.createComponent(LanguagePickerComponent);
    fixture.componentRef.setInput('current', 'ar');
    fixture.componentRef.setInput('suggested', languageOf('de')!);
    await fixture.whenStable();
  });

  /** The languages shown in the list, by their own names. */
  function shown(): string[] {
    return [...fixture.nativeElement.querySelectorAll('button[aria-pressed] span[lang]')].map(
      (e: HTMLElement) => e.textContent!.trim(),
    );
  }

  /** Types into the search box. */
  async function search(text: string): Promise<void> {
    const input: HTMLInputElement = fixture.nativeElement.querySelector('input[type=search]');
    input.value = text;
    input.dispatchEvent(new Event('input'));
    await fixture.whenStable();
  }

  it('shows the visitor\'s own language first, then all 22', () => {
    expect(shown()[0]).toBe('Deutsch');
    expect(shown()).toHaveLength(23);
  });

  it('finds a language by its own name, its Arabic name, its English name or its code', async () => {
    await search('اردو');
    expect(shown()).toEqual(['اردو']);
    await search('الألمانية');
    expect(shown()).toEqual(['Deutsch']);
    await search('japanese');
    expect(shown()).toEqual(['日本語']);
    await search('ps');
    expect(shown()).toEqual(['پښتو']);
  });

  it('emits the chosen language', async () => {
    let chosen = '';
    fixture.componentInstance.chosen.subscribe((c) => (chosen = c));
    await search('Français');
    (fixture.nativeElement.querySelector('button[aria-pressed]') as HTMLButtonElement).click();
    expect(chosen).toBe('fr');
  });
});
