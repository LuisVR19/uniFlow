import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

const STORAGE_KEY = 'uniflow.theme';
const DARK_CLASS = 'ion-palette-dark';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly _isDark$ = new BehaviorSubject<boolean>(false);

  readonly isDark$: Observable<boolean> = this._isDark$.asObservable();

  constructor() {
    const saved = localStorage.getItem(STORAGE_KEY);
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const dark = saved !== null ? saved === 'dark' : prefersDark;
    this.apply(dark);
  }

  get isDark(): boolean {
    return this._isDark$.getValue();
  }

  toggle(): void {
    const next = !this.isDark;
    this.apply(next);
    localStorage.setItem(STORAGE_KEY, next ? 'dark' : 'light');
  }

  private apply(dark: boolean): void {
    document.documentElement.classList.toggle(DARK_CLASS, dark);
    this._isDark$.next(dark);
  }
}
