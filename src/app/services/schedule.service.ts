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
import { SupabaseService } from './supabase.service';

@Injectable({
  providedIn: 'root',
})
export class ScheduleService {
  private readonly eventsSubject = new BehaviorSubject<ScheduleEvent[]>([]);

  readonly events$: Observable<ScheduleEvent[]> = this.eventsSubject.asObservable();

  constructor(private readonly supabase: SupabaseService) {
    void this.load();
  }

  async load(): Promise<void> {
    const { data, error } = await this.supabase.db
      .from('schedule_events')
      .select('*');
    if (error) return;

    const events = (data ?? [])
      .map((row) => ({
        id: row['id'] as string,
        title: row['title'] as string,
        day: row['day'] as WeekdayKey,
        startTime: row['start_time'] as string,
        endTime: row['end_time'] as string,
        description: (row['description'] as string | null) ?? undefined,
        color: row['color'] as string,
        course_id: (row['course_id'] as string | null) ?? null,
      }))
      .filter((e) => this.isValidEvent(e));

    this.eventsSubject.next(this.sortEvents(events));
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
    this.eventsSubject.next(nextEvents);
    void this.dbInsert(candidate);
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
    this.eventsSubject.next(nextEvents);
    void this.dbUpdate(candidate);
    return { success: true };
  }

  deleteEvent(eventId: string): void {
    const nextEvents = this.eventsSubject.value.filter((event) => event.id !== eventId);
    this.eventsSubject.next(nextEvents);
    void this.supabase.db.from('schedule_events').delete().eq('id', eventId);
  }

  clearAllEvents(): void {
    this.eventsSubject.next([]);
    void this.dbClear();
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

  private async dbInsert(event: ScheduleEvent): Promise<void> {
    const { data: { user } } = await this.supabase.db.auth.getUser();
    if (!user) return;

    await this.supabase.db.from('schedule_events').insert({
      id: event.id,
      user_id: user.id,
      title: event.title,
      day: event.day,
      start_time: event.startTime,
      end_time: event.endTime,
      description: event.description ?? null,
      color: event.color,
      course_id: event.course_id ?? null,
    });
  }

  private async dbUpdate(event: ScheduleEvent): Promise<void> {
    await this.supabase.db.from('schedule_events').update({
      title: event.title,
      day: event.day,
      start_time: event.startTime,
      end_time: event.endTime,
      description: event.description ?? null,
      color: event.color,
      course_id: event.course_id ?? null,
    }).eq('id', event.id);
  }

  private async dbClear(): Promise<void> {
    const { data: { user } } = await this.supabase.db.auth.getUser();
    if (!user) return;
    await this.supabase.db.from('schedule_events').delete().eq('user_id', user.id);
  }

  private sortEvents(events: ScheduleEvent[]): ScheduleEvent[] {
    return [...events].sort((left, right) => {
      const dayDifference =
        WEEK_DAYS.findIndex((day) => day.value === left.day) -
        WEEK_DAYS.findIndex((day) => day.value === right.day);

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
      event.id &&
        event.title &&
        DAY_VALUE_SET.has(event.day) &&
        typeof event.startTime === 'string' &&
        typeof event.endTime === 'string' &&
        !this.isOutsideSchedule(event.startTime, event.endTime),
    );
  }
}
