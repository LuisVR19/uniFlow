export interface Course {
  id: string;
  semester_id: string;
  name: string;
  code: string | null;
  credits: number | null;
  color: string;
  created_at: string;
}

export interface CourseDraft {
  semester_id: string;
  name: string;
  code?: string;
  credits?: number;
  color?: string;
}
