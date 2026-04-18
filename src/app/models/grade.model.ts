export interface Grade {
  id: string;
  evaluation_id: string;
  score: number;
  created_at: string;
}

export interface GradeDraft {
  evaluation_id: string;
  score: number;
}
