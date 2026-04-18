import { Component } from '@angular/core';
import { LanguageService } from './services/language.service';
import { ThemeService } from './services/theme.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: false,
})
export class AppComponent {
  // Both services are injected here so they initialise (restore saved
  // preferences) before any page component renders.
  constructor(
    private readonly _theme: ThemeService,
    private readonly _language: LanguageService,
  ) {}
}
