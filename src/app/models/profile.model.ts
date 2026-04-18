export interface Profile {
  id: string;
  full_name: string | null;
  university: string | null;
  career: string | null;
  created_at: string;
}

export interface ProfileDraft {
  full_name?: string;
  university?: string;
  career?: string;
}
