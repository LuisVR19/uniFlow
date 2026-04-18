import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AlertController, LoadingController, ToastController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';

import { Course } from '../../models/course.model';
import { CourseEvaluation, EvaluationDraft } from '../../models/evaluation.model';
import { Grade } from '../../models/grade.model';
import { CourseService } from '../../services/course.service';
import { EvaluationService } from '../../services/evaluation.service';
import { GradeService } from '../../services/grade.service';

const MIN_PASS = 70;

export interface EvaluationItem {
  evaluation: CourseEvaluation;
  grade: Grade | null;
  scoreInput: string;
  saving: boolean;
}

export interface GradeStats {
  currentGrade: number;
  maxAchievable: number;
  ungradedPct: number;
  totalPct: number;
  progressValue: number;
  progressColor: 'success' | 'warning' | 'danger';
  isPassing: boolean;
  canStillPass: boolean;
  requiredAvgPercent: number | null;
  hasEvaluations: boolean;
}

@Component({
  selector: 'app-course-detail',
  templateUrl: './course-detail.page.html',
  styleUrls: ['./course-detail.page.scss'],
  standalone: false,
})
export class CourseDetailPage implements OnInit {
  course: Course | null = null;
  items: EvaluationItem[] = [];
  loading = false;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly courseService: CourseService,
    private readonly evalService: EvaluationService,
    private readonly gradeService: GradeService,
    private readonly alertCtrl: AlertController,
    private readonly loadingCtrl: LoadingController,
    private readonly toastCtrl: ToastController,
    private readonly translate: TranslateService,
  ) {}

  async ngOnInit(): Promise<void> {
    const courseId = this.courseId;
    await Promise.all([this.loadCourse(courseId), this.loadItems(courseId)]);
  }

  get courseId(): string {
    return this.route.snapshot.paramMap.get('courseId')!;
  }

  get stats(): GradeStats {
    if (this.items.length === 0) {
      return {
        currentGrade: 0, maxAchievable: 0, ungradedPct: 0, totalPct: 0,
        progressValue: 0, progressColor: 'danger',
        isPassing: false, canStillPass: false, requiredAvgPercent: null,
        hasEvaluations: false,
      };
    }

    const currentGrade = this.items.reduce((sum, item) => {
      if (!item.grade || item.evaluation.max_score <= 0) return sum;
      return sum + (item.grade.score / item.evaluation.max_score) * item.evaluation.percentage;
    }, 0);

    const ungradedPct = this.items
      .filter((i) => !i.grade)
      .reduce((sum, i) => sum + i.evaluation.percentage, 0);

    const totalPct = this.items.reduce((sum, i) => sum + i.evaluation.percentage, 0);
    const maxAchievable = currentGrade + ungradedPct;
    const isPassing = currentGrade >= MIN_PASS;
    const canStillPass = maxAchievable >= MIN_PASS;

    let requiredAvgPercent: number | null = null;
    if (!isPassing && canStillPass && ungradedPct > 0) {
      requiredAvgPercent = ((MIN_PASS - currentGrade) / ungradedPct) * 100;
    }

    const progressColor: 'success' | 'warning' | 'danger' =
      currentGrade >= MIN_PASS ? 'success' : currentGrade >= 50 ? 'warning' : 'danger';

    return {
      currentGrade,
      maxAchievable,
      ungradedPct,
      totalPct,
      progressValue: Math.min(currentGrade / 100, 1),
      progressColor,
      isPassing,
      canStillPass,
      requiredAvgPercent,
      hasEvaluations: true,
    };
  }

  getContribution(item: EvaluationItem): number {
    if (!item.grade || item.evaluation.max_score <= 0) return 0;
    return (item.grade.score / item.evaluation.max_score) * item.evaluation.percentage;
  }

  getScorePercent(item: EvaluationItem): number {
    if (!item.grade || item.evaluation.max_score <= 0) return 0;
    return (item.grade.score / item.evaluation.max_score) * 100;
  }

  getMinRequired(item: EvaluationItem): number | null {
    if (item.grade) return null;
    const s = this.stats;
    if (!s.hasEvaluations || s.isPassing || !s.canStillPass || s.ungradedPct <= 0) return null;
    const needed = MIN_PASS - s.currentGrade;
    const raw = (needed / s.ungradedPct) * item.evaluation.max_score;
    return Math.min(Math.ceil(raw * 10) / 10, item.evaluation.max_score);
  }

  getMinRequiredColor(item: EvaluationItem): 'success' | 'warning' | 'danger' {
    const min = this.getMinRequired(item);
    if (min === null || item.evaluation.max_score <= 0) return 'success';
    const pct = min / item.evaluation.max_score;
    if (pct >= 0.9) return 'danger';
    if (pct >= 0.7) return 'warning';
    return 'success';
  }

  formatDate(dateStr: string | null | undefined): string {
    if (!dateStr) return '';
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const d = new Date(dateStr + 'T00:00:00');
    const diff = Math.round((d.getTime() - today.getTime()) / 86400000);
    if (diff === 0) return this.translate.instant('common.dates.today');
    if (diff === 1) return this.translate.instant('common.dates.tomorrow');
    if (diff === -1) return this.translate.instant('common.dates.yesterday');
    const showYear = diff > 300 || diff < -300;
    const locale = this.translate.currentLang === 'es' ? 'es-CR' : 'en-US';
    return d.toLocaleDateString(locale, { month: 'short', day: 'numeric', ...(showYear ? { year: 'numeric' } : {}) });
  }

  async saveGrade(item: EvaluationItem): Promise<void> {
    const scoreNum = parseFloat(item.scoreInput);
    if (isNaN(scoreNum) || scoreNum < 0 || scoreNum > item.evaluation.max_score) {
      await this.showToast(
        this.translate.instant('courseDetail.toast.scoreRange', { max: item.evaluation.max_score }),
        'warning',
      );
      return;
    }
    item.saving = true;
    try {
      item.grade = await this.gradeService.upsert({ evaluation_id: item.evaluation.id, score: scoreNum });
      await this.showToast(this.translate.instant('courseDetail.toast.gradeSaved'), 'success');
    } catch {
      await this.showToast(this.translate.instant('courseDetail.toast.gradeSaveError'), 'danger');
    } finally {
      item.saving = false;
    }
  }

  async clearGrade(item: EvaluationItem, event: Event): Promise<void> {
    event.stopPropagation();
    if (!item.grade) return;
    const loading = await this.loadingCtrl.create({ message: this.translate.instant('common.loading.clearing') });
    await loading.present();
    try {
      await this.gradeService.delete(item.grade.id);
      item.grade = null;
      item.scoreInput = '';
    } catch {
      await this.showToast(this.translate.instant('courseDetail.toast.gradeClearError'), 'danger');
    } finally {
      await loading.dismiss();
    }
  }

  async openCreateEvalDialog(): Promise<void> {
    const alert = await this.alertCtrl.create({
      header: this.translate.instant('courseDetail.dialog.createHeader'),
      inputs: [
        { name: 'name', type: 'text', placeholder: this.translate.instant('courseDetail.dialog.namePlaceholder') },
        { name: 'percentage', type: 'number', placeholder: this.translate.instant('courseDetail.dialog.weightPlaceholder') },
        { name: 'due_date', type: 'date', placeholder: this.translate.instant('courseDetail.dialog.datePlaceholder') },
      ],
      buttons: [
        { text: this.translate.instant('common.cancel'), role: 'cancel' },
        {
          text: this.translate.instant('common.create'),
          handler: async (data) => {
            if (!data.name?.trim() || !data.percentage) return false;
            await this.createEval(data);
            return true;
          },
        },
      ],
    });
    await alert.present();
  }

  async openEditEvalDialog(item: EvaluationItem, event: Event): Promise<void> {
    event.stopPropagation();
    const ev = item.evaluation;
    const alert = await this.alertCtrl.create({
      header: this.translate.instant('courseDetail.dialog.editHeader'),
      inputs: [
        { name: 'name', type: 'text', placeholder: this.translate.instant('courseDetail.dialog.namePlaceholder'), value: ev.name },
        { name: 'percentage', type: 'number', placeholder: this.translate.instant('courseDetail.dialog.weightPlaceholder'), value: ev.percentage },
        { name: 'due_date', type: 'date', value: ev.due_date ?? '' },
      ],
      buttons: [
        { text: this.translate.instant('common.cancel'), role: 'cancel' },
        {
          text: this.translate.instant('common.save'),
          handler: async (data) => {
            if (!data.name?.trim() || !data.percentage) return false;
            await this.updateEval(ev.id, data);
            return true;
          },
        },
      ],
    });
    await alert.present();
  }

  async confirmDeleteEval(item: EvaluationItem, event: Event): Promise<void> {
    event.stopPropagation();
    const alert = await this.alertCtrl.create({
      header: this.translate.instant('courseDetail.dialog.deleteHeader'),
      message: this.translate.instant('courseDetail.dialog.deleteMessage', { name: item.evaluation.name }),
      buttons: [
        { text: this.translate.instant('common.cancel'), role: 'cancel' },
        { text: this.translate.instant('common.delete'), role: 'destructive', handler: () => this.deleteEval(item.evaluation.id) },
      ],
    });
    await alert.present();
  }

  private async loadCourse(id: string): Promise<void> {
    try {
      this.course = await this.courseService.getById(id);
    } catch {
      // non-critical
    }
  }

  private async loadItems(courseId: string): Promise<void> {
    this.loading = true;
    try {
      const evaluations = await this.evalService.getByCourse(courseId);
      const grades = await this.gradeService.getByEvaluations(evaluations.map((e) => e.id));
      const gradeMap = new Map(grades.map((g) => [g.evaluation_id, g]));
      this.items = evaluations.map((evaluation) => {
        const grade = gradeMap.get(evaluation.id) ?? null;
        return { evaluation, grade, scoreInput: grade ? String(grade.score) : '', saving: false };
      });
    } catch {
      await this.showToast(this.translate.instant('courseDetail.toast.loadError'), 'danger');
    } finally {
      this.loading = false;
    }
  }

  private async createEval(data: { name: string; percentage: string; due_date?: string }): Promise<void> {
    const loading = await this.loadingCtrl.create({ message: this.translate.instant('common.loading.creating') });
    await loading.present();
    try {
      const draft: EvaluationDraft = {
        course_id: this.courseId,
        name: data.name.trim(),
        percentage: Number(data.percentage),
        max_score: 100,
        due_date: data.due_date || null,
      };
      const ev = await this.evalService.create(draft);
      this.items.push({ evaluation: ev, grade: null, scoreInput: '', saving: false });
    } catch {
      await this.showToast(this.translate.instant('courseDetail.toast.createError'), 'danger');
    } finally {
      await loading.dismiss();
    }
  }

  private async updateEval(id: string, data: { name: string; percentage: string; due_date?: string }): Promise<void> {
    const loading = await this.loadingCtrl.create({ message: this.translate.instant('common.loading.saving') });
    await loading.present();
    try {
      const updated = await this.evalService.update(id, {
        name: data.name.trim(),
        percentage: Number(data.percentage),
        max_score: 100,
        due_date: data.due_date || null,
      });
      const idx = this.items.findIndex((i) => i.evaluation.id === id);
      if (idx !== -1) this.items[idx].evaluation = updated;
    } catch {
      await this.showToast(this.translate.instant('courseDetail.toast.updateError'), 'danger');
    } finally {
      await loading.dismiss();
    }
  }

  private async deleteEval(id: string): Promise<void> {
    const loading = await this.loadingCtrl.create({ message: this.translate.instant('common.loading.deleting') });
    await loading.present();
    try {
      await this.evalService.delete(id);
      this.items = this.items.filter((i) => i.evaluation.id !== id);
    } catch {
      await this.showToast(this.translate.instant('courseDetail.toast.deleteError'), 'danger');
    } finally {
      await loading.dismiss();
    }
  }

  private async showToast(message: string, color: string): Promise<void> {
    const toast = await this.toastCtrl.create({ message, duration: 2500, color, position: 'bottom' });
    await toast.present();
  }
}
