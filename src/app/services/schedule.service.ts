import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

import {
  ConflictCheckResult,
  DAY_VALUE_SET,
  EventDraft,
  SCHEDULE_CONFIG,
  ScheduleEvent,
  ScheduleMutationResult,
  WEEK_DAYS,
  WeekdayKey,
} from '../models/event.model';
import { StorageService } from './storage.service';

@Injectable({
  providedIn: 'root',
})
export class ScheduleService {
  private readonly eventsSubject = new BehaviorSubject<ScheduleEvent[]>([]);

  readonly events$: Observable<ScheduleEvent[]> = this.eventsSubject.asObservable();

  constructor(private readonly storageService: StorageService) {
    this.initialize();
  }

  getEvents(): Observable<ScheduleEvent[]> {
    return this.events$;
  }

  getEventsSnapshot(): ScheduleEvent[] {
    return this.eventsSubject.value;
  }

  getEventsForDay(day: WeekdayKey): ScheduleEvent[] {
    return this.sortEvents(this.eventsSubject.value.filter((event) => event.day === day));
  }

  getTodayEvents(date: Date = new Date()): ScheduleEvent[] {
    const today = WEEK_DAYS[this.getDayIndex(date)]?.value ?? 'monday';
    return this.getEventsForDay(today);
  }

  addEvent(draft: EventDraft): ScheduleMutationResult {
    const candidate: ScheduleEvent = {
      ...draft,
      id: this.createEventId(),
      description: draft.description?.trim() ?? '',
      title: draft.title.trim(),
    };

    const conflict = this.checkConflict(candidate);
    if (conflict.hasConflict) {
      return { success: false, conflictingEvent: conflict.conflictingEvent };
    }

    const nextEvents = this.sortEvents([...this.eventsSubject.value, candidate]);
    this.persist(nextEvents);
    return { success: true };
  }

  updateEvent(updatedEvent: ScheduleEvent): ScheduleMutationResult {
    const candidate: ScheduleEvent = {
      ...updatedEvent,
      title: updatedEvent.title.trim(),
      description: updatedEvent.description?.trim() ?? '',
    };

    const conflict = this.checkConflict(candidate, candidate.id);
    if (conflict.hasConflict) {
      return { success: false, conflictingEvent: conflict.conflictingEvent };
    }

    const nextEvents = this.sortEvents(
      this.eventsSubject.value.map((event) => (event.id === candidate.id ? candidate : event)),
    );
    this.persist(nextEvents);
    return { success: true };
  }

  deleteEvent(eventId: string): void {
    const nextEvents = this.eventsSubject.value.filter((event) => event.id !== eventId);
    this.persist(nextEvents);
  }

  clearAllEvents(): void {
    this.persist([]);
  }

  moveEvent(eventId: string, targetDay: WeekdayKey, targetStartMinutes: number): ScheduleMutationResult {
    const currentEvent = this.eventsSubject.value.find((event) => event.id === eventId);
    if (!currentEvent) {
      return { success: false };
    }

    const durationMinutes = this.timeToMinutes(currentEvent.endTime) - this.timeToMinutes(currentEvent.startTime);
    const candidate: ScheduleEvent = {
      ...currentEvent,
      day: targetDay,
      startTime: this.minutesToTime(targetStartMinutes),
      endTime: this.minutesToTime(targetStartMinutes + durationMinutes),
    };

    if (this.isOutsideSchedule(candidate.startTime, candidate.endTime)) {
      return { success: false };
    }

    return this.updateEvent(candidate);
  }

  checkConflict(candidate: ScheduleEvent | EventDraft, excludeId?: string): ConflictCheckResult {
    const candidateStart = this.timeToMinutes(candidate.startTime);
    const candidateEnd = this.timeToMinutes(candidate.endTime);

    const conflictingEvent = this.eventsSubject.value.find((event) => {
      if (event.id === excludeId) {
        return false;
      }

      if (event.day !== candidate.day) {
        return false;
      }

      const eventStart = this.timeToMinutes(event.startTime);
      const eventEnd = this.timeToMinutes(event.endTime);
      return candidateStart < eventEnd && candidateEnd > eventStart;
    });

    return {
      hasConflict: Boolean(conflictingEvent),
      conflictingEvent,
    };
  }

  isOutsideSchedule(startTime: string, endTime: string): boolean {
    const startMinutes = this.timeToMinutes(startTime);
    const endMinutes = this.timeToMinutes(endTime);
    const minMinutes = SCHEDULE_CONFIG.startHour * 60;
    const maxMinutes = SCHEDULE_CONFIG.endHour * 60;

    return startMinutes < minMinutes || endMinutes > maxMinutes || endMinutes <= startMinutes;
  }

  timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map((value) => Number(value));
    return hours * 60 + minutes;
  }

  minutesToTime(minutes: number): string {
    const normalizedHours = Math.floor(minutes / 60)
      .toString()
      .padStart(2, '0');
    const normalizedMinutes = (minutes % 60).toString().padStart(2, '0');
    return `${normalizedHours}:${normalizedMinutes}`;
  }

  private initialize(): void {
    const storedEvents = this.storageService.loadEvents();
    const sanitizedEvents = storedEvents.filter((event) => this.isValidEvent(event));

    if (sanitizedEvents.length > 0) {
      this.eventsSubject.next(this.sortEvents(sanitizedEvents));
      return;
    }

    const sampleEvents: ScheduleEvent[] = [
      {
        id: this.createEventId(),
        title: 'Math Class',
        day: 'monday',
        startTime: '08:00',
        endTime: '10:00',
        description: 'Room 201',
        color: '#4f7cff',
      },
      {
        id: this.createEventId(),
        title: 'Programming',
        day: 'wednesday',
        startTime: '13:00',
        endTime: '15:00',
        description: 'Lab B',
        color: '#2db9a3',
      },
      {
        id: this.createEventId(),
        title: 'Gym',
        day: 'friday',
        startTime: '18:00',
        endTime: '19:00',
        description: 'Sports Center',
        color: '#ff8c5a',
      },
    ];

    this.persist(sampleEvents);
  }

  private persist(events: ScheduleEvent[]): void {
    this.eventsSubject.next(events);
    this.storageService.saveEvents(events);
  }

  private sortEvents(events: ScheduleEvent[]): ScheduleEvent[] {
    return [...events].sort((left, right) => {
      const dayDifference = WEEK_DAYS.findIndex((day) => day.value === left.day)
        - WEEK_DAYS.findIndex((day) => day.value === right.day);

      if (dayDifference !== 0) {
        return dayDifference;
      }

      return this.timeToMinutes(left.startTime) - this.timeToMinutes(right.startTime);
    });
  }

  private createEventId(): string {
    return `event-${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;
  }

  private getDayIndex(date: Date): number {
    const nativeIndex = date.getDay();
    return nativeIndex === 0 ? 6 : nativeIndex - 1;
  }

  private isValidEvent(event: ScheduleEvent): boolean {
    return Boolean(
      event.id
      && event.title
      && DAY_VALUE_SET.has(event.day)
      && typeof event.startTime === 'string'
      && typeof event.endTime === 'string'
      && !this.isOutsideSchedule(event.startTime, event.endTime),
    );
  }
}
