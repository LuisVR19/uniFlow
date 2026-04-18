import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AlertController, LoadingController, ToastController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';

import { Course } from '../../models/course.model';
import { Semester } from '../../models/semester.model';
import { CourseService } from '../../services/course.service';
import { SemesterService } from '../../services/semester.service';

const PRESET_COLORS = [
  '#6366f1', '#f43f5e', '#10b981', '#f59e0b',
  '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6',
  '#f97316', '#06b6d4',
];

@Component({
  selector: 'app-courses',
  templateUrl: './courses.page.html',
  styleUrls: ['./courses.page.scss'],
  standalone: false,
})
export class CoursesPage implements OnInit {
  semester: Semester | null = null;
  courses: Course[] = [];
  loading = false;
  colorPickerOpenId: string | null = null;
  readonly presetColors = PRESET_COLORS;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly courseService: CourseService,
    private readonly semesterService: SemesterService,
    private readonly alertCtrl: AlertController,
    private readonly loadingCtrl: LoadingController,
    private readonly toastCtrl: ToastController,
    private readonly translate: TranslateService,
  ) {}

  async ngOnInit(): Promise<void> {
    const semesterId = this.route.snapshot.paramMap.get('semesterId')!;
    await Promise.all([this.loadSemester(semesterId), this.loadCourses(semesterId)]);
  }

  get semesterId(): string {
    return this.route.snapshot.paramMap.get('semesterId')!;
  }

  navigateToDetail(course: Course): void {
    this.router.navigate(['/course-detail', course.id]);
  }

  toggleColorPicker(courseId: string, event: Event): void {
    event.stopPropagation();
    this.colorPickerOpenId = this.colorPickerOpenId === courseId ? null : courseId;
  }

  async pickColor(course: Course, color: string): Promise<void> {
    this.colorPickerOpenId = null;
    try {
      const updated = await this.courseService.update(course.id, { color });
      this.replaceCourse(updated);
    } catch {
      await this.showToast(this.translate.instant('courses.toast.colorError'), 'danger');
    }
  }

  async openCreateDialog(): Promise<void> {
    const alert = await this.alertCtrl.create({
      header: this.translate.instant('courses.dialog.createHeader'),
      inputs: [
        { name: 'name', type: 'text', placeholder: this.translate.instant('courses.dialog.namePlaceholder') },
        { name: 'code', type: 'text', placeholder: this.translate.instant('courses.dialog.codePlaceholder') },
        { name: 'credits', type: 'number', placeholder: this.translate.instant('courses.dialog.creditsPlaceholder') },
      ],
      buttons: [
        { text: this.translate.instant('common.cancel'), role: 'cancel' },
        {
          text: this.translate.instant('common.create'),
          handler: async (data) => {
            if (!data.name?.trim()) return false;
            await this.createCourse(data);
            return true;
          },
        },
      ],
    });
    await alert.present();
  }

  async openEditDialog(course: Course, event: Event): Promise<void> {
    event.stopPropagation();
    this.colorPickerOpenId = null;
    const alert = await this.alertCtrl.create({
      header: this.translate.instant('courses.dialog.editHeader'),
      inputs: [
        { name: 'name', type: 'text', placeholder: this.translate.instant('courses.dialog.namePlaceholder'), value: course.name },
        { name: 'code', type: 'text', placeholder: this.translate.instant('courses.dialog.codePlaceholder'), value: course.code ?? '' },
        { name: 'credits', type: 'number', placeholder: this.translate.instant('courses.dialog.creditsPlaceholder'), value: course.credits ?? undefined },
      ],
      buttons: [
        { text: this.translate.instant('common.cancel'), role: 'cancel' },
        {
          text: this.translate.instant('common.save'),
          handler: async (data) => {
            if (!data.name?.trim()) return false;
            await this.updateCourse(course.id, data);
            return true;
          },
        },
      ],
    });
    await alert.present();
  }

  async confirmDelete(course: Course, event: Event): Promise<void> {
    event.stopPropagation();
    this.colorPickerOpenId = null;
    const alert = await this.alertCtrl.create({
      header: this.translate.instant('courses.dialog.deleteHeader'),
      message: this.translate.instant('courses.dialog.deleteMessage', { name: course.name }),
      buttons: [
        { text: this.translate.instant('common.cancel'), role: 'cancel' },
        { text: this.translate.instant('common.delete'), role: 'destructive', handler: () => this.deleteCourse(course.id) },
      ],
    });
    await alert.present();
  }

  async loadCourses(semesterId: string): Promise<void> {
    this.loading = true;
    try {
      this.courses = await this.courseService.getBySemester(semesterId);
    } catch {
      await this.showToast(this.translate.instant('courses.toast.loadError'), 'danger');
    } finally {
      this.loading = false;
    }
  }

  private async loadSemester(id: string): Promise<void> {
    try {
      this.semester = await this.semesterService.getById(id);
    } catch {
      // non-critical — header will just show default title
    }
  }

  private async createCourse(data: { name: string; code?: string; credits?: string }): Promise<void> {
    const loading = await this.loadingCtrl.create({ message: this.translate.instant('common.loading.creating') });
    await loading.present();
    try {
      const randomColor = PRESET_COLORS[Math.floor(Math.random() * PRESET_COLORS.length)];
      const course = await this.courseService.create({
        semester_id: this.semesterId,
        name: data.name.trim(),
        code: data.code?.trim() || undefined,
        credits: data.credits ? Number(data.credits) : undefined,
        color: randomColor,
      });
      this.courses.push(course);
      this.courses.sort((a, b) => a.name.localeCompare(b.name));
      await this.showToast(this.translate.instant('courses.toast.created'), 'success');
    } catch {
      await this.showToast(this.translate.instant('courses.toast.createError'), 'danger');
    } finally {
      await loading.dismiss();
    }
  }

  private async updateCourse(
    id: string,
    data: { name: string; code?: string; credits?: string },
  ): Promise<void> {
    const loading = await this.loadingCtrl.create({ message: this.translate.instant('common.loading.saving') });
    await loading.present();
    try {
      const updated = await this.courseService.update(id, {
        name: data.name.trim(),
        code: data.code?.trim() || undefined,
        credits: data.credits ? Number(data.credits) : undefined,
      });
      this.replaceCourse(updated);
      await this.showToast(this.translate.instant('courses.toast.updated'), 'success');
    } catch {
      await this.showToast(this.translate.instant('courses.toast.updateError'), 'danger');
    } finally {
      await loading.dismiss();
    }
  }

  private async deleteCourse(id: string): Promise<void> {
    const loading = await this.loadingCtrl.create({ message: this.translate.instant('common.loading.deleting') });
    await loading.present();
    try {
      await this.courseService.delete(id);
      this.courses = this.courses.filter((c) => c.id !== id);
      await this.showToast(this.translate.instant('courses.toast.deleted'), 'success');
    } catch {
      await this.showToast(this.translate.instant('courses.toast.deleteError'), 'danger');
    } finally {
      await loading.dismiss();
    }
  }

  private replaceCourse(updated: Course): void {
    const idx = this.courses.findIndex((c) => c.id === updated.id);
    if (idx !== -1) this.courses[idx] = updated;
  }

  private async showToast(message: string, color: string): Promise<void> {
    const toast = await this.toastCtrl.create({ message, duration: 2000, color, position: 'bottom' });
    await toast.present();
  }
}
