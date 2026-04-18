import { Component } from '@angular/core';
import { LanguageService } from './services/language.service';
import { ThemeService } from './services/theme.service';
import { NotificationService } from './services/notification.service';
import { EvaluationService } from './services/evaluation.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: false,
})
export class AppComponent {
  constructor(
    private readonly _theme: ThemeService,
    private readonly _language: LanguageService,
    private readonly _notif: NotificationService,
    private readonly _evalService: EvaluationService,
  ) {
    this.initNotifications();
  }

  private async initNotifications(): Promise<void> {
    await this._notif.init();
    try {
      const evaluations = await this._evalService.getAllWithCourse();
      await this._notif.rescheduleAll(evaluations);
    } catch { /* non-critical */ }
  }
}
