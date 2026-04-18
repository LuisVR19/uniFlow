import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController, LoadingController, ToastController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';

import { Semester } from '../../models/semester.model';
import { SemesterService } from '../../services/semester.service';

@Component({
  selector: 'app-semesters',
  templateUrl: './semesters.page.html',
  styleUrls: ['./semesters.page.scss'],
  standalone: false,
})
export class SemestersPage implements OnInit {
  semesters: Semester[] = [];
  loading = false;

  constructor(
    private readonly semesterService: SemesterService,
    private readonly alertCtrl: AlertController,
    private readonly loadingCtrl: LoadingController,
    private readonly toastCtrl: ToastController,
    private readonly router: Router,
    private readonly translate: TranslateService,
  ) {}

  async ngOnInit(): Promise<void> {
    await this.loadSemesters();
  }

  async loadSemesters(): Promise<void> {
    this.loading = true;
    try {
      this.semesters = await this.semesterService.getAll();
    } catch {
      await this.showToast(this.translate.instant('semesters.toast.loadError'), 'danger');
    } finally {
      this.loading = false;
    }
  }

  navigateToCourses(semester: Semester): void {
    this.router.navigate(['/courses', semester.id]);
  }

  async openCreateDialog(): Promise<void> {
    const alert = await this.alertCtrl.create({
      header: this.translate.instant('semesters.dialog.createHeader'),
      inputs: [
        { name: 'name', type: 'text', placeholder: this.translate.instant('semesters.dialog.namePlaceholder') },
        { name: 'year', type: 'number', placeholder: this.translate.instant('semesters.dialog.yearPlaceholder'), value: new Date().getFullYear() },
      ],
      buttons: [
        { text: this.translate.instant('common.cancel'), role: 'cancel' },
        {
          text: this.translate.instant('common.create'),
          handler: async (data) => {
            if (!data.name?.trim() || !data.year) return false;
            await this.createSemester(data.name.trim(), Number(data.year));
            return true;
          },
        },
      ],
    });
    await alert.present();
  }

  async openEditDialog(semester: Semester, event: Event): Promise<void> {
    event.stopPropagation();
    const alert = await this.alertCtrl.create({
      header: this.translate.instant('semesters.dialog.editHeader'),
      inputs: [
        { name: 'name', type: 'text', placeholder: this.translate.instant('semesters.dialog.namePlaceholder'), value: semester.name },
        { name: 'year', type: 'number', placeholder: this.translate.instant('semesters.dialog.yearPlaceholder'), value: semester.year },
      ],
      buttons: [
        { text: this.translate.instant('common.cancel'), role: 'cancel' },
        {
          text: this.translate.instant('common.save'),
          handler: async (data) => {
            if (!data.name?.trim() || !data.year) return false;
            await this.updateSemester(semester.id, data.name.trim(), Number(data.year));
            return true;
          },
        },
      ],
    });
    await alert.present();
  }

  async confirmDelete(semester: Semester, event: Event): Promise<void> {
    event.stopPropagation();
    const alert = await this.alertCtrl.create({
      header: this.translate.instant('semesters.dialog.deleteHeader'),
      message: this.translate.instant('semesters.dialog.deleteMessage', { name: semester.name }),
      buttons: [
        { text: this.translate.instant('common.cancel'), role: 'cancel' },
        { text: this.translate.instant('common.delete'), role: 'destructive', handler: () => this.deleteSemester(semester.id) },
      ],
    });
    await alert.present();
  }

  async toggleActive(semester: Semester, event: Event): Promise<void> {
    event.stopPropagation();
    try {
      const updated = await this.semesterService.update(semester.id, { is_active: !semester.is_active });
      const idx = this.semesters.findIndex((s) => s.id === semester.id);
      if (idx !== -1) this.semesters[idx] = updated;
    } catch {
      await this.showToast(this.translate.instant('semesters.toast.updateError'), 'danger');
    }
  }

  private async createSemester(name: string, year: number): Promise<void> {
    const loading = await this.loadingCtrl.create({ message: this.translate.instant('common.loading.creating') });
    await loading.present();
    try {
      const semester = await this.semesterService.create({ name, year });
      this.semesters.unshift(semester);
      await this.showToast(this.translate.instant('semesters.toast.created'), 'success');
    } catch {
      await this.showToast(this.translate.instant('semesters.toast.createError'), 'danger');
    } finally {
      await loading.dismiss();
    }
  }

  private async updateSemester(id: string, name: string, year: number): Promise<void> {
    const loading = await this.loadingCtrl.create({ message: this.translate.instant('common.loading.saving') });
    await loading.present();
    try {
      const updated = await this.semesterService.update(id, { name, year });
      const idx = this.semesters.findIndex((s) => s.id === id);
      if (idx !== -1) this.semesters[idx] = updated;
      await this.showToast(this.translate.instant('semesters.toast.updated'), 'success');
    } catch {
      await this.showToast(this.translate.instant('semesters.toast.updateError'), 'danger');
    } finally {
      await loading.dismiss();
    }
  }

  private async deleteSemester(id: string): Promise<void> {
    const loading = await this.loadingCtrl.create({ message: this.translate.instant('common.loading.deleting') });
    await loading.present();
    try {
      await this.semesterService.delete(id);
      this.semesters = this.semesters.filter((s) => s.id !== id);
      await this.showToast(this.translate.instant('semesters.toast.deleted'), 'success');
    } catch {
      await this.showToast(this.translate.instant('semesters.toast.deleteError'), 'danger');
    } finally {
      await loading.dismiss();
    }
  }

  private async showToast(message: string, color: string): Promise<void> {
    const toast = await this.toastCtrl.create({ message, duration: 2000, color, position: 'bottom' });
    await toast.present();
  }
}
