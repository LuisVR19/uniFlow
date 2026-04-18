import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { BehaviorSubject, Observable } from 'rxjs';

const STORAGE_KEY = 'uniflow.language';
const SUPPORTED = ['en', 'es'] as const;
type Lang = (typeof SUPPORTED)[number];

@Injectable({ providedIn: 'root' })
export class LanguageService {
  private readonly _lang$ = new BehaviorSubject<Lang>('en');
  readonly lang$: Observable<Lang> = this._lang$.asObservable();

  constructor(private readonly translate: TranslateService) {
    translate.addLangs([...SUPPORTED]);
    translate.setDefaultLang('en');

    const saved = localStorage.getItem(STORAGE_KEY) as Lang | null;
    const browser = translate.getBrowserLang() as Lang | undefined;
    const initial: Lang =
      saved && SUPPORTED.includes(saved)
        ? saved
        : browser && SUPPORTED.includes(browser)
          ? browser
          : 'en';

    this.apply(initial);
  }

  get currentLang(): Lang {
    return this._lang$.getValue();
  }

  toggle(): void {
    const next: Lang = this.currentLang === 'en' ? 'es' : 'en';
    this.apply(next);
    localStorage.setItem(STORAGE_KEY, next);
  }

  private apply(lang: Lang): void {
    this.translate.use(lang);
    this._lang$.next(lang);
  }
}
