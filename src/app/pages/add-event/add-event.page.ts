import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AlertController, ToastController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';

import { Course } from '../../models/course.model';
import { SCHEDULE_CONFIG, WEEK_DAYS, WeekdayKey, WeekdayOption } from '../../models/event.model';
import { CourseService } from '../../services/course.service';
import { ScheduleService } from '../../services/schedule.service';
import { SemesterService } from '../../services/semester.service';

@Component({
  selector: 'app-add-event',
  templateUrl: './add-event.page.html',
  styleUrls: ['./add-event.page.scss'],
  standalone: false,
})
export class AddEventPage implements OnInit {
  readonly weekDays: WeekdayOption[] = WEEK_DAYS;
  readonly colorOptions = ['#5b8def', '#2db9a3', '#ff8c5a', '#aa7bff', '#f45b83'];

  startTimeModalOpen = false;
  endTimeModalOpen = false;
  pendingStartIso = '2026-01-01T08:00:00';
  pendingEndIso = '2026-01-01T09:00:00';

  selectedDays: WeekdayKey[] = ['monday'];
  courses: Course[] = [];
  selectedCourseId: string | null = null;

  readonly form = this.formBuilder.nonNullable.group({
    title: ['', [Validators.required, Validators.maxLength(60)]],
    startTime: ['08:00', Validators.required],
    endTime: ['09:00', Validators.required],
    description: [''],
    color: [SCHEDULE_CONFIG.defaultColor, Validators.required],
  });

  constructor(
    private readonly alertController: AlertController,
    private readonly formBuilder: FormBuilder,
    private readonly router: Router,
    private readonly scheduleService: ScheduleService,
    private readonly toastController: ToastController,
    private readonly translate: TranslateService,
    private readonly courseService: CourseService,
    private readonly semesterService: SemesterService,
  ) {}

  async ngOnInit(): Promise<void> {
    try {
      const activeSemester = await this.semesterService.getActive();
      if (activeSemester) {
        this.courses = await this.courseService.getBySemester(activeSemester.id);
      }
    } catch {
      // non-critical — course picker simply won't appear
    }
  }

  get selectedCourseColor(): string | null {
    if (!this.selectedCourseId) return null;
    return this.courses.find((c) => c.id === this.selectedCourseId)?.color ?? null;
  }

  selectCourse(course: Course | null): void {
    this.selectedCourseId = course?.id ?? null;
    if (course) {
      this.form.controls.color.setValue(course.color ?? SCHEDULE_CONFIG.defaultColor);
      if (!this.form.controls.title.value) {
        this.form.controls.title.setValue(course.name);
      }
    }
  }

  isDaySelected(day: WeekdayKey): boolean {
    return this.selectedDays.includes(day);
  }

  toggleDay(day: WeekdayKey): void {
    if (this.isDaySelected(day)) {
      if (this.selectedDays.length > 1) {
        this.selectedDays = this.selectedDays.filter((d) => d !== day);
      }
    } else {
      this.selectedDays = [...this.selectedDays, day];
    }
  }

  openTimeModal(controlName: 'startTime' | 'endTime'): void {
    const currentValue = this.form.controls[controlName].value;
    const isoValue = `2026-01-01T${currentValue}:00`;

    if (controlName === 'startTime') {
      this.pendingStartIso = isoValue;
      this.startTimeModalOpen = true;
      return;
    }

    this.pendingEndIso = isoValue;
    this.endTimeModalOpen = true;
  }

  closeTimeModal(controlName: 'startTime' | 'endTime'): void {
    if (controlName === 'startTime') {
      this.startTimeModalOpen = false;
      return;
    }

    this.endTimeModalOpen = false;
  }

  onStartTimeSelection(value: string | null): void {
    if (value) {
      this.pendingStartIso = value;
    }
  }

  onEndTimeSelection(value: string | null): void {
    if (value) {
      this.pendingEndIso = value;
    }
  }

  confirmTimeSelection(controlName: 'startTime' | 'endTime'): void {
    const selectedValue = controlName === 'startTime' ? this.pendingStartIso : this.pendingEndIso;
    this.form.controls[controlName].setValue(this.extractTime(selectedValue));
    this.closeTimeModal(controlName);
  }

  async saveEvent(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const draft = this.form.getRawValue();
    const startMinutes = this.scheduleService.timeToMinutes(draft.startTime);
    const endMinutes = this.scheduleService.timeToMinutes(draft.endTime);

    if (endMinutes <= startMinutes) {
      await this.presentAlert('addEvent.alerts.invalidTimeHeader', 'addEvent.alerts.invalidTimeMessage');
      return;
    }

    if (this.scheduleService.isOutsideSchedule(draft.startTime, draft.endTime)) {
      await this.presentAlert('addEvent.alerts.outsideHoursHeader', 'addEvent.alerts.outsideHoursMessage', {
        start: SCHEDULE_CONFIG.startHour,
        end: SCHEDULE_CONFIG.endHour,
      });
      return;
    }

    let addedCount = 0;
    let firstConflictTitle: string | undefined;

    for (const day of this.selectedDays) {
      const result = this.scheduleService.addEvent({
        ...draft,
        day,
        course_id: this.selectedCourseId,
      });
      if (result.success) {
        addedCount++;
      } else if (firstConflictTitle === undefined) {
        firstConflictTitle = result.conflictingEvent?.title ?? '';
      }
    }

    if (addedCount === 0) {
      await this.presentAlert('addEvent.alerts.conflictHeader', 'addEvent.alerts.conflictMessage', {
        title: firstConflictTitle ?? '',
      });
      return;
    }

    const skipped = this.selectedDays.length - addedCount;
    const toastKey = skipped > 0
      ? 'addEvent.savedToastPartial'
      : addedCount > 1
        ? 'addEvent.savedToastMultiple'
        : 'addEvent.savedToast';

    const toast = await this.toastController.create({
      message: this.translate.instant(toastKey, { count: addedCount, skipped }),
      duration: 1800,
      position: 'bottom',
    });

    await toast.present();
    await this.router.navigateByUrl('/schedule');
  }

  private async presentAlert(
    headerKey: string,
    messageKey: string,
    params?: Record<string, unknown>,
  ): Promise<void> {
    const alert = await this.alertController.create({
      header: this.translate.instant(headerKey),
      message: this.translate.instant(messageKey, params),
      buttons: [this.translate.instant('addEvent.alerts.ok')],
    });

    await alert.present();
  }

  private extractTime(value: string): string {
    const timeFragment = value.includes('T') ? value.split('T')[1] ?? value : value;
    return timeFragment.slice(0, 5);
  }
}
