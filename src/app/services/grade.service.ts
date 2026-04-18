import { Injectable } from '@angular/core';

import { Grade, GradeDraft } from '../models/grade.model';
import { SupabaseService } from './supabase.service';

@Injectable({ providedIn: 'root' })
export class GradeService {
  constructor(private readonly supabase: SupabaseService) {}

  async getByEvaluations(evaluationIds: string[]): Promise<Grade[]> {
    if (evaluationIds.length === 0) return [];
    const { data, error } = await this.supabase.db
      .from('grades')
      .select('*')
      .in('evaluation_id', evaluationIds);
    if (error) throw error;
    return (data ?? []) as Grade[];
  }

  async getAll(): Promise<Grade[]> {
    const { data, error } = await this.supabase.db.from('grades').select('*');
    if (error) throw error;
    return (data ?? []) as Grade[];
  }

  async upsert(draft: GradeDraft): Promise<Grade> {
    const { data, error } = await this.supabase.db
      .from('grades')
      .upsert(draft, { onConflict: 'evaluation_id' })
      .select()
      .single();
    if (error) throw error;
    return data as Grade;
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.supabase.db.from('grades').delete().eq('id', id);
    if (error) throw error;
  }
}
