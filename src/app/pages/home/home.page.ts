import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';

import { EvaluationWithCourse } from '../../models/evaluation.model';
import { ScheduleEvent, WEEK_DAYS } from '../../models/event.model';
import { Profile } from '../../models/profile.model';
import { CourseService } from '../../services/course.service';
import { EvaluationService } from '../../services/evaluation.service';
import { GradeService } from '../../services/grade.service';
import { LanguageService } from '../../services/language.service';
import { ProfileService } from '../../services/profile.service';
import { ScheduleService } from '../../services/schedule.service';
import { SemesterService } from '../../services/semester.service';
import { SupabaseService } from '../../services/supabase.service';
import { ThemeService } from '../../services/theme.service';

export interface UpcomingTask {
  evaluation: EvaluationWithCourse;
  daysLeft: number;
}

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: false,
})
export class HomePage implements OnInit, OnDestroy {
  todayLabel = 'Today';
  todayEvents: ScheduleEvent[] = [];
  upcomingTasks: UpcomingTask[] = [];
  profile: Profile | null = null;
  private eventsSubscription?: Subscription;

  constructor(
    private readonly scheduleService: ScheduleService,
    private readonly supabase: SupabaseService,
    private readonly profileService: ProfileService,
    private readonly semesterService: SemesterService,
    private readonly courseService: CourseService,
    private readonly evalService: EvaluationService,
    private readonly gradeService: GradeService,
    readonly router: Router,
    private readonly translate: TranslateService,
    readonly themeService: ThemeService,
    readonly languageService: LanguageService,
  ) {}

  get universityTitle(): string {
    return this.profile?.university || this.translate.instant('home.university.title');
  }

  get initials(): string {
    const name = this.profile?.full_name;
    if (!name) return '?';
    return name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((p) => p[0])
      .join('')
      .toUpperCase();
  }

  goToProfile(): void {
    this.router.navigate(['/profile']);
  }

  async ngOnInit(): Promise<void> {
    this.todayLabel = this.resolveTodayLabel(new Date());
    this.eventsSubscription = this.scheduleService.getEvents().subscribe(() => {
      this.todayEvents = this.scheduleService.getTodayEvents();
    });
    await Promise.all([this.checkProfile(), this.loadUpcomingTasks()]);
  }

  ngOnDestroy(): void {
    this.eventsSubscription?.unsubscribe();
  }

  async logout(): Promise<void> {
    await this.supabase.signOut();
    this.router.navigateByUrl('/auth/login', { replaceUrl: true });
  }

  dueDateLabel(task: UpcomingTask): string {
    if (task.daysLeft === 0) return this.translate.instant('home.upcoming.dueToday');
    if (task.daysLeft === 1) return this.translate.instant('home.upcoming.dueTomorrow');
    return this.translate.instant('home.upcoming.dueInDays', { days: task.daysLeft });
  }

  dueDateClass(daysLeft: number): string {
    if (daysLeft === 0) return 'today';
    if (daysLeft === 1) return 'tomorrow';
    return 'normal';
  }

  private async loadUpcomingTasks(): Promise<void> {
    try {
      const activeSemester = await this.semesterService.getActive();
      if (!activeSemester) return;

      const courses = await this.courseService.getBySemester(activeSemester.id);
      const courseIds = new Set(courses.map((c) => c.id));

      const [evaluations, grades] = await Promise.all([
        this.evalService.getAllWithCourse(),
        this.gradeService.getAll(),
      ]);

      const gradedIds = new Set(grades.map((g) => g.evaluation_id));

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const weekEnd = new Date(today);
      weekEnd.setDate(today.getDate() + 7);
      const todayStr = today.toISOString().slice(0, 10);
      const weekEndStr = weekEnd.toISOString().slice(0, 10);

      this.upcomingTasks = evaluations
        .filter(
          (ev) =>
            courseIds.has(ev.course_id) &&
            !gradedIds.has(ev.id) &&
            ev.due_date !== null &&
            ev.due_date >= todayStr &&
            ev.due_date <= weekEndStr,
        )
        .map((ev) => {
          const d = new Date(ev.due_date! + 'T00:00:00');
          const daysLeft = Math.round((d.getTime() - today.getTime()) / 86400000);
          return { evaluation: ev, daysLeft };
        })
        .sort((a, b) => a.daysLeft - b.daysLeft);
    } catch {
      // non-critical — section just won't show
    }
  }

  private async checkProfile(): Promise<void> {
    try {
      this.profile = await this.profileService.get();
    } catch {
      // ignore — network error, don't block the user
    }
    if (!this.profile?.full_name) {
      this.router.navigateByUrl('/profile?setup=true');
    }
  }

  private resolveTodayLabel(date: Date): string {
    const nativeIndex = date.getDay();
    const weekIndex = nativeIndex === 0 ? 6 : nativeIndex - 1;
    return WEEK_DAYS[weekIndex]?.label ?? 'Today';
  }
}
