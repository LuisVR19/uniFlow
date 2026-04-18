export type WeekdayKey =
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday'
  | 'sunday';

export interface WeekdayOption {
  value: WeekdayKey;
  label: string;
  shortLabel: string;
}

export interface ScheduleEvent {
  id: string;
  title: string;
  day: WeekdayKey;
  startTime: string;
  endTime: string;
  description?: string;
  color: string;
  course_id?: string | null;
}

export interface EventDraft {
  title: string;
  day: WeekdayKey;
  startTime: string;
  endTime: string;
  description?: string;
  color: string;
  course_id?: string | null;
}

export interface TimeSlot {
  label: string;
  startMinutes: number;
}

export interface ConflictCheckResult {
  hasConflict: boolean;
  conflictingEvent?: ScheduleEvent;
}

export interface ScheduleMutationResult {
  success: boolean;
  conflictingEvent?: ScheduleEvent;
}

export const WEEK_DAYS: WeekdayOption[] = [
  { value: 'monday', label: 'Monday', shortLabel: 'Mon' },
  { value: 'tuesday', label: 'Tuesday', shortLabel: 'Tue' },
  { value: 'wednesday', label: 'Wednesday', shortLabel: 'Wed' },
  { value: 'thursday', label: 'Thursday', shortLabel: 'Thu' },
  { value: 'friday', label: 'Friday', shortLabel: 'Fri' },
  { value: 'saturday', label: 'Saturday', shortLabel: 'Sat' },
  { value: 'sunday', label: 'Sunday', shortLabel: 'Sun' },
];

export const DAY_VALUE_SET = new Set<WeekdayKey>(WEEK_DAYS.map((day) => day.value));

export const SCHEDULE_CONFIG = {
  startHour: 7,
  endHour: 23,
  slotMinutes: 30,
  defaultColor: '#5b8def',
};
