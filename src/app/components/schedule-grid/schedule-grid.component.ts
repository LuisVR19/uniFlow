import { CdkDragDrop } from '@angular/cdk/drag-drop';
import { Component, NgZone, OnDestroy, OnInit } from '@angular/core';
import { AlertController, ToastController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';

import { SCHEDULE_CONFIG, ScheduleEvent, TimeSlot, WEEK_DAYS, WeekdayKey } from '../../models/event.model';
import { ScheduleService } from '../../services/schedule.service';

interface GridSlot extends TimeSlot {
  id: string;
  day: WeekdayKey;
}

interface DayColumn {
  value: WeekdayKey;
  label: string;
  shortLabel: string;
  slots: GridSlot[];
}

@Component({
  selector: 'app-schedule-grid',
  templateUrl: './schedule-grid.component.html',
  styleUrls: ['./schedule-grid.component.scss'],
  standalone: false,
})
export class ScheduleGridComponent implements OnInit, OnDestroy {
  readonly weekDays = WEEK_DAYS;
  readonly timeSlots: TimeSlot[];
  readonly dayColumns: DayColumn[];
  readonly slotHeight = 44;

  events: ScheduleEvent[] = [];
  activeDayIndex = 0;

  private readonly eventLookup = new Map<string, ScheduleEvent>();
  private readonly slotLookup = new Map<string, GridSlot>();
  private eventsSubscription?: Subscription;
  private rafId: number | null = null;
  private lastHighlightedSlot: Element | null = null;
  private boundPointerMove: ((e: PointerEvent) => void) | null = null;

  constructor(
    private readonly alertController: AlertController,
    private readonly ngZone: NgZone,
    private readonly scheduleService: ScheduleService,
    private readonly toastController: ToastController,
    private readonly translate: TranslateService,
  ) {
    this.timeSlots = this.buildTimeSlots();
    this.dayColumns = this.weekDays.map((day) => ({
      ...day,
      slots: this.timeSlots.map((slot) => ({
        ...slot,
        id: this.getSlotId(day.value, slot.startMinutes),
        day: day.value,
      })),
    }));
    this.dayColumns.forEach((day) =>
      day.slots.forEach((slot) => this.slotLookup.set(slot.id, slot)),
    );
  }

  ngOnInit(): void {
    this.eventsSubscription = this.scheduleService.getEvents().subscribe((events) => {
      this.events = events;
      this.eventLookup.clear();

      events.forEach((event) => {
        this.eventLookup.set(this.getEventKey(event.day, event.startTime), event);
      });
    });
  }

  ngOnDestroy(): void {
    this.eventsSubscription?.unsubscribe();
    this.cleanupDragListeners();
  }

  getDisplayLabel(index: number): string {
    return index % 2 === 0 ? this.timeSlots[index]?.label ?? '' : '';
  }

  getEvent(slot: GridSlot): ScheduleEvent | undefined {
    return this.eventLookup.get(this.getEventKey(slot.day, slot.label));
  }

  getEventHeight(event: ScheduleEvent): number {
    const durationMinutes =
      this.scheduleService.timeToMinutes(event.endTime) -
      this.scheduleService.timeToMinutes(event.startTime);

    return (durationMinutes / SCHEDULE_CONFIG.slotMinutes) * this.slotHeight - 8;
  }

  selectDay(index: number): void {
    this.activeDayIndex = index;
  }

  trackBySlot(_index: number, slot: GridSlot): string {
    return slot.id;
  }

  onDragStarted(): void {
    this.ngZone.runOutsideAngular(() => {
      this.boundPointerMove = (e: PointerEvent) => {
        if (this.rafId !== null) return;
        this.rafId = requestAnimationFrame(() => {
          this.rafId = null;
          const slotEl =
            document
              .elementsFromPoint(e.clientX, e.clientY)
              .find((el) => el.classList.contains('schedule-grid__slot')) ?? null;
          if (slotEl !== this.lastHighlightedSlot) {
            this.lastHighlightedSlot?.classList.remove('is-drag-target');
            slotEl?.classList.add('is-drag-target');
            this.lastHighlightedSlot = slotEl;
          }
        });
      };
      document.addEventListener('pointermove', this.boundPointerMove, { passive: true });
    });
  }

  onDragEnded(): void {
    this.cleanupDragListeners();
  }

  async onDrop(event: CdkDragDrop<WeekdayKey, WeekdayKey, ScheduleEvent>): Promise<void> {
    this.cleanupDragListeners();

    const draggedEvent = event.item.data;
    if (!draggedEvent) return;

    const { x, y } = event.dropPoint;
    const targetSlot = this.getSlotAtPoint(x, y);

    if (!targetSlot) return;

    if (draggedEvent.day === targetSlot.day && draggedEvent.startTime === targetSlot.label) {
      return;
    }

    const moveResult = this.scheduleService.moveEvent(
      draggedEvent.id,
      targetSlot.day,
      targetSlot.startMinutes,
    );

    if (!moveResult.success) {
      const conflictTitle = moveResult.conflictingEvent?.title;
      const message = conflictTitle
        ? this.translate.instant('grid.alert.conflictMessage', { title: conflictTitle })
        : this.translate.instant('grid.alert.outOfRangeMessage');

      const alert = await this.alertController.create({
        header: this.translate.instant('grid.alert.header'),
        message,
        buttons: [this.translate.instant('grid.alert.ok')],
      });

      await alert.present();
      return;
    }

    const dayLabel = this.translate.instant('days.' + targetSlot.day);
    const toast = await this.toastController.create({
      message: this.translate.instant('grid.movedToast', { day: dayLabel, time: targetSlot.label }),
      duration: 1200,
      position: 'bottom',
    });

    await toast.present();
  }

  private cleanupDragListeners(): void {
    if (this.boundPointerMove) {
      document.removeEventListener('pointermove', this.boundPointerMove);
      this.boundPointerMove = null;
    }
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    this.lastHighlightedSlot?.classList.remove('is-drag-target');
    this.lastHighlightedSlot = null;
  }

  private getSlotAtPoint(x: number, y: number): GridSlot | undefined {
    const slotEl = document
      .elementsFromPoint(x, y)
      .find((el) => el.classList.contains('schedule-grid__slot'));
    return slotEl?.id ? this.slotLookup.get(slotEl.id) : undefined;
  }

  private buildTimeSlots(): TimeSlot[] {
    const slots: TimeSlot[] = [];
    const startMinutes = SCHEDULE_CONFIG.startHour * 60;
    const endMinutes = SCHEDULE_CONFIG.endHour * 60;

    for (let minutes = startMinutes; minutes < endMinutes; minutes += SCHEDULE_CONFIG.slotMinutes) {
      slots.push({
        label: this.scheduleService.minutesToTime(minutes),
        startMinutes: minutes,
      });
    }

    return slots;
  }

  private getSlotId(day: WeekdayKey, startMinutes: number): string {
    return `${day}-${startMinutes}`;
  }

  private getEventKey(day: WeekdayKey, startTime: string): string {
    return `${day}-${startTime}`;
  }
}
