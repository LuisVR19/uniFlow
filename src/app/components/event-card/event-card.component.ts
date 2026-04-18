import { Component, EventEmitter, Input, Output } from '@angular/core';
import { AlertController, ToastController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';

import { ScheduleEvent } from '../../models/event.model';
import { ScheduleService } from '../../services/schedule.service';

@Component({
  selector: 'app-event-card',
  templateUrl: './event-card.component.html',
  styleUrls: ['./event-card.component.scss'],
  standalone: false,
})
export class EventCardComponent {
  @Input({ required: true }) event!: ScheduleEvent;
  @Input() draggable = false;
  @Input() compact = false;
  @Input() height = 72;

  @Output() readonly dragStarted = new EventEmitter<void>();
  @Output() readonly dragEnded = new EventEmitter<void>();

  private suppressTap = false;

  constructor(
    private readonly alertController: AlertController,
    private readonly toastController: ToastController,
    private readonly scheduleService: ScheduleService,
    private readonly translate: TranslateService,
  ) {}

  async confirmDelete(): Promise<void> {
    if (this.suppressTap) {
      return;
    }

    const alert = await this.alertController.create({
      header: this.translate.instant('eventCard.alert.header'),
      message: this.translate.instant('eventCard.alert.message', { title: this.event.title }),
      buttons: [
        {
          role: 'cancel',
          text: this.translate.instant('eventCard.alert.keep'),
        },
        {
          role: 'destructive',
          text: this.translate.instant('eventCard.alert.delete'),
          handler: async () => {
            this.scheduleService.deleteEvent(this.event.id);

            const toast = await this.toastController.create({
              message: this.translate.instant('eventCard.deletedToast'),
              duration: 1400,
              position: 'bottom',
            });

            await toast.present();
          },
        },
      ],
    });

    await alert.present();
  }

  onDragStarted(): void {
    this.suppressTap = true;
    this.dragStarted.emit();
  }

  onDragEnded(): void {
    this.dragEnded.emit();
    window.setTimeout(() => {
      this.suppressTap = false;
    }, 180);
  }
}
