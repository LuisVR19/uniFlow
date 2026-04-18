import { Injectable } from '@angular/core';

import { ScheduleEvent } from '../models/event.model';

@Injectable({
  providedIn: 'root',
})
export class StorageService {
  private readonly storageKey = 'uniflow.events';

  saveEvents(events: ScheduleEvent[]): void {
    localStorage.setItem(this.storageKey, JSON.stringify(events));
  }

  loadEvents(): ScheduleEvent[] {
    const rawValue = localStorage.getItem(this.storageKey);

    if (!rawValue) {
      return [];
    }

    try {
      const parsed = JSON.parse(rawValue) as unknown;
      return Array.isArray(parsed) ? (parsed as ScheduleEvent[]) : [];
    } catch {
      return [];
    }
  }

  clearEvents(): void {
    localStorage.removeItem(this.storageKey);
  }
}
