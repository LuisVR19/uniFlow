import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';

import { EvaluationWithCourse } from '../../models/evaluation.model';
import { Grade } from '../../models/grade.model';
import { EvaluationService } from '../../services/evaluation.service';
import { GradeService } from '../../services/grade.service';

export interface TaskItem {
  evaluation: EvaluationWithCourse;
  grade: Grade | null;
}

export interface TaskGroup {
  key: string;
  labelKey: string;
  accent: string;
  items: TaskItem[];
}

@Component({
  selector: 'app-tasks',
  templateUrl: './tasks.page.html',
  styleUrls: ['./tasks.page.scss'],
  standalone: false,
})
export class TasksPage implements OnInit {
  items: TaskItem[] = [];
  loading = false;

  constructor(
    private readonly evalService: EvaluationService,
    private readonly gradeService: GradeService,
    private readonly router: Router,
    private readonly translate: TranslateService,
  ) {}

  async ngOnInit(): Promise<void> {
    await this.load();
  }

  get groups(): TaskGroup[] {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = this.toIso(today);
    const weekEnd = new Date(today);
    weekEnd.setDate(today.getDate() + 7);
    const weekEndStr = this.toIso(weekEnd);

    const buckets: Record<string, TaskItem[]> = {
      overdue: [], today: [], this_week: [], upcoming: [], no_date: [], completed: [],
    };

    for (const item of this.items) {
      if (item.grade) { buckets['completed'].push(item); continue; }
      const d = item.evaluation.due_date;
      if (!d) { buckets['no_date'].push(item); continue; }
      if (d < todayStr) { buckets['overdue'].push(item); continue; }
      if (d === todayStr) { buckets['today'].push(item); continue; }
      if (d <= weekEndStr) { buckets['this_week'].push(item); continue; }
      buckets['upcoming'].push(item);
    }

    return [
      { key: 'overdue',   labelKey: 'tasks.groups.overdue',   accent: 'danger',  items: buckets['overdue'] },
      { key: 'today',     labelKey: 'tasks.groups.today',     accent: 'warning', items: buckets['today'] },
      { key: 'this_week', labelKey: 'tasks.groups.thisWeek',  accent: 'primary', items: buckets['this_week'] },
      { key: 'upcoming',  labelKey: 'tasks.groups.upcoming',  accent: 'medium',  items: buckets['upcoming'] },
      { key: 'no_date',   labelKey: 'tasks.groups.noDate',    accent: 'medium',  items: buckets['no_date'] },
      { key: 'completed', labelKey: 'tasks.groups.completed', accent: 'success', items: buckets['completed'] },
    ].filter((g) => g.items.length > 0);
  }

  get pendingCount(): number {
    return this.items.filter((i) => !i.grade).length;
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
    return d.toLocaleDateString(locale, {
      month: 'short',
      day: 'numeric',
      ...(showYear ? { year: 'numeric' } : {}),
    });
  }

  dateClass(groupKey: string): string {
    const map: Record<string, string> = {
      overdue: 'overdue',
      today: 'today',
      this_week: 'soon',
      upcoming: 'normal',
      no_date: 'none',
      completed: 'normal',
    };
    return map[groupKey] ?? 'normal';
  }

  goToCourse(courseId: string): void {
    this.router.navigate(['/course-detail', courseId]);
  }

  async refresh(event: CustomEvent): Promise<void> {
    await this.load();
    (event.target as HTMLIonRefresherElement).complete();
  }

  private async load(): Promise<void> {
    this.loading = true;
    try {
      const [evaluations, grades] = await Promise.all([
        this.evalService.getAllWithCourse(),
        this.gradeService.getAll(),
      ]);
      const gradeMap = new Map(grades.map((g) => [g.evaluation_id, g]));
      this.items = evaluations.map((ev) => ({
        evaluation: ev,
        grade: gradeMap.get(ev.id) ?? null,
      }));
    } finally {
      this.loading = false;
    }
  }

  private toIso(d: Date): string {
    return d.toISOString().slice(0, 10);
  }
}
