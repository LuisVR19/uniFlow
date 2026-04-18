import { Injectable } from '@angular/core';

import { CourseEvaluation, EvaluationDraft, EvaluationWithCourse } from '../models/evaluation.model';
import { SupabaseService } from './supabase.service';

@Injectable({ providedIn: 'root' })
export class EvaluationService {
  constructor(private readonly supabase: SupabaseService) {}

  async getByCourse(courseId: string): Promise<CourseEvaluation[]> {
    const { data, error } = await this.supabase.db
      .from('course_evaluations')
      .select('*')
      .eq('course_id', courseId)
      .order('created_at');
    if (error) throw error;
    return (data ?? []) as CourseEvaluation[];
  }

  async getAllWithCourse(): Promise<EvaluationWithCourse[]> {
    const { data, error } = await this.supabase.db
      .from('course_evaluations')
      .select('*, course:courses(id, name, color)')
      .order('due_date', { ascending: true, nullsFirst: false })
      .order('name', { ascending: true });
    if (error) throw error;
    return (data ?? []) as EvaluationWithCourse[];
  }

  async create(draft: EvaluationDraft): Promise<CourseEvaluation> {
    const { data, error } = await this.supabase.db
      .from('course_evaluations')
      .insert(draft)
      .select()
      .single();
    if (error) throw error;
    return data as CourseEvaluation;
  }

  async update(id: string, draft: Partial<EvaluationDraft>): Promise<CourseEvaluation> {
    const { data, error } = await this.supabase.db
      .from('course_evaluations')
      .update(draft)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as CourseEvaluation;
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.supabase.db.from('course_evaluations').delete().eq('id', id);
    if (error) throw error;
  }
}
