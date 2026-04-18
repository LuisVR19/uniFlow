export interface Semester {
  id: string;
  user_id: string;
  name: string;
  year: number;
  is_active: boolean;
  created_at: string;
}

export interface SemesterDraft {
  name: string;
  year: number;
  is_active?: boolean;
}
