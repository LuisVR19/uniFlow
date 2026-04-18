import { Component, ElementRef, ViewChild } from '@angular/core';
import { ActionSheetController, AlertController, LoadingController, ToastController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';

import { ScheduleService } from '../../services/schedule.service';
import { ExportService } from '../../services/export.service';

@Component({
  selector: 'app-schedule',
  templateUrl: './schedule.page.html',
  styleUrls: ['./schedule.page.scss'],
  standalone: false,
})
export class SchedulePage {
  @ViewChild('gridShell', { static: false })
  private readonly gridShell!: ElementRef<HTMLElement>;

  constructor(
    private readonly actionSheetController: ActionSheetController,
    private readonly alertController: AlertController,
    private readonly loadingController: LoadingController,
    private readonly scheduleService: ScheduleService,
    private readonly toastController: ToastController,
    private readonly exportService: ExportService,
    private readonly translate: TranslateService,
  ) {}

  async openExportSheet(): Promise<void> {
    const t = (key: string) => this.translate.instant(key);

    const sheet = await this.actionSheetController.create({
      header: t('schedule.export.sheetTitle'),
      cssClass: 'export-action-sheet',
      buttons: [
        {
          text: t('schedule.export.png'),
          icon: 'image-outline',
          handler: () => { void this.export('png'); },
        },
        {
          text: t('schedule.export.pdf'),
          icon: 'document-text-outline',
          handler: () => { void this.export('pdf'); },
        },
        {
          text: t('schedule.export.cancel'),
          icon: 'close-outline',
          role: 'cancel',
        },
      ],
    });

    await sheet.present();
  }

  async confirmClearSchedule(): Promise<void> {
    const t = (key: string) => this.translate.instant(key);

    const alert = await this.alertController.create({
      header: t('schedule.clear.header'),
      message: t('schedule.clear.message'),
      buttons: [
        { text: t('schedule.clear.cancel'), role: 'cancel' },
        {
          text: t('schedule.clear.confirm'),
          role: 'destructive',
          handler: async () => {
            this.scheduleService.clearAllEvents();
            const toast = await this.toastController.create({
              message: t('schedule.clear.toast'),
              duration: 1500,
              position: 'bottom',
            });
            await toast.present();
          },
        },
      ],
    });

    await alert.present();
  }

  private async export(format: 'png' | 'pdf'): Promise<void> {
    const loading = await this.loadingController.create({
      message: this.translate.instant('schedule.export.loading'),
      cssClass: 'export-loading',
    });
    await loading.present();

    try {
      // Target the inner .schedule-grid element so we capture
      // the full grid width, not just the visible scroll area.
      const shell = this.gridShell.nativeElement;
      const grid = (shell.querySelector('.schedule-grid') as HTMLElement) ?? shell;

      if (format === 'png') {
        await this.exportService.exportAsPng(
          grid,
          this.translate.instant('schedule.export.filenamePng'),
        );
      } else {
        await this.exportService.exportAsPdf(
          grid,
          this.translate.instant('schedule.export.filenamePdf'),
        );
      }
    } catch (err) {
      console.error('Export failed:', err);
      const toast = await this.toastController.create({
        message: this.translate.instant('schedule.export.error'),
        duration: 3000,
        position: 'bottom',
        color: 'danger',
      });
      await toast.present();
    } finally {
      await loading.dismiss();
    }
  }
}
