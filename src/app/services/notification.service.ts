import { Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { TranslateService } from '@ngx-translate/core';

import { EvaluationWithCourse } from '../models/evaluation.model';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  constructor(private readonly translate: TranslateService) {}

  async init(): Promise<void> {
    if (!Capacitor.isNativePlatform()) return;
    await LocalNotifications.requestPermissions();
  }

  async scheduleForEvaluation(evaluation: EvaluationWithCourse): Promise<void> {
    if (!Capacitor.isNativePlatform()) return;
    if (!evaluation.due_date || evaluation.notify_days_before == null) return;

    const notifId = this.toNumericId(evaluation.id);

    try {
      await LocalNotifications.cancel({ notifications: [{ id: notifId }] });
    } catch { /* ignore if none pending */ }

    const dueDate = new Date(evaluation.due_date + 'T00:00:00');
    const notifDate = new Date(dueDate);
    notifDate.setDate(notifDate.getDate() - evaluation.notify_days_before);

    notifDate.setHours(8, 0, 0, 0);

    if (notifDate <= new Date()) return;

    const days = evaluation.notify_days_before;
    let bodyKey: string;
    if (days === 0) bodyKey = 'notifications.bodyToday';
    else if (days === 1) bodyKey = 'notifications.bodyTomorrow';
    else bodyKey = 'notifications.bodyDays';

    const body = this.translate.instant(bodyKey, {
      name: evaluation.name,
      course: evaluation.course.name,
      days,
    });

    await LocalNotifications.schedule({
      notifications: [{
        id: notifId,
        title: this.translate.instant('notifications.title'),
        body,
        schedule: { at: notifDate },
        iconColor: '#4F46E5',
      }],
    });
  }

  async cancelForEvaluation(evaluationId: string): Promise<void> {
    if (!Capacitor.isNativePlatform()) return;
    try {
      await LocalNotifications.cancel({ notifications: [{ id: this.toNumericId(evaluationId) }] });
    } catch { /* ignore */ }
  }

  async rescheduleAll(evaluations: EvaluationWithCourse[]): Promise<void> {
    if (!Capacitor.isNativePlatform()) return;
    for (const ev of evaluations) {
      await this.scheduleForEvaluation(ev);
    }
  }

  private toNumericId(uuid: string): number {
    let hash = 0;
    for (let i = 0; i < uuid.length; i++) {
      hash = ((hash << 5) - hash) + uuid.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash) || 1;
  }
}
