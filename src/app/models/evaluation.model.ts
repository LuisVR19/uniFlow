export interface CourseEvaluation {
  id: string;
  course_id: string;
  name: string;
  percentage: number;
  max_score: number;
  due_date: string | null;
  created_at: string;
}

export interface EvaluationWithCourse extends CourseEvaluation {
  course: {
    id: string;
    name: string;
    color: string;
  };
}

export interface EvaluationDraft {
  course_id: string;
  name: string;
  percentage: number;
  max_score?: number;
  due_date?: string | null;
}
