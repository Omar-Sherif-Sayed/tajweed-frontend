/** A fatwa a body's ruling is read from: its title and details as the publisher gives them, and its page. */
export interface ZakatFatwa {
  /** Its title or the book it is in, in Arabic as published. */
  readonly title: string;
  /** Its number, date and mufti, or the volume and page, in Arabic as published. */
  readonly detail: string;
  /** Its page on the publisher's own site. */
  readonly url: string;
}

/** A fatwa body whose Zakat ruling the calculator follows (F42 — the author, 2026-11-27: both, each under its name). */
export interface ZakatBody {
  /** Its id. */
  readonly id: 'egypt' | 'saudi';
  /** The text key of its name. */
  readonly nameKey: string;
  /** The text key of its nisab rule. */
  readonly ruleKey: string;
  /** The fatwas, linked — never copied (their sites reserve their rights). */
  readonly fatwas: readonly ZakatFatwa[];
}

/**
 * The two bodies, read on their own pages on 2026-11-27 (tajweed-docs `docs/data-sources/candidates-2026-11-27.md`).
 * Only the nisab's measure and the rate are used by the calculator; the conditions and details stay in the fatwas.
 */
export const ZAKAT_BODIES: readonly ZakatBody[] = [
  {
    id: 'egypt',
    nameKey: 'zakat.egypt',
    ruleKey: 'zakat.egyptRule',
    fatwas: [
      {
        title: 'نصاب زكاة المال بالعملة المصرية',
        detail: 'دار الإفتاء المصرية · الفتوى رقم 6203 · 4 ديسمبر 1991 · فضيلة الدكتور محمد سيد طنطاوي',
        url: 'https://www.dar-alifta.org/ar/fatwa/details/16827',
      },
      {
        title: 'السبب في تقدير النصاب في زكاة المال على اعتبار عيار 21 وليس 18 أو 24',
        detail: 'دار الإفتاء المصرية · الفتوى رقم 8426 · 11 أغسطس 2024 · الأستاذ الدكتور شوقي إبراهيم علام',
        url: 'https://www.dar-alifta.org/ar/fatwa/details/21692',
      },
    ],
  },
  {
    id: 'saudi',
    nameKey: 'zakat.saudi',
    ruleKey: 'zakat.saudiRule',
    fatwas: [
      {
        title: 'زكاة الأوراق النقدية',
        detail: 'فتاوى اللجنة الدائمة، المجموعة الأولى (13/444)، وقرار هيئة كبار العلماء — كما في الموسوعة الفقهية، الدرر السنية',
        url: 'https://dorar.net/feqhia/2162',
      },
      {
        title: 'نصاب الذهب والفضة بالجرامات (بالمقاييس الحديثة)',
        detail: 'الموسوعة الفقهية، الدرر السنية — تقدير ابن عثيمين وندوات قضايا الزكاة المعاصرة',
        url: 'https://dorar.net/feqhia/2153',
      },
      {
        title: 'نصاب الذهب والفضة',
        detail: 'فتاوى الشيخ عبد العزيز بن باز — الموقع الرسمي',
        url: 'https://binbaz.org.sa/fatwas/18047/%D9%86%D8%B5%D8%A7%D8%A8-%D8%A7%D9%84%D8%B0%D9%87%D8%A8-%D9%88%D8%A7%D9%84%D9%81%D8%B6%D8%A9',
      },
    ],
  },
];
