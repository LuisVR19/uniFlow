import { Injectable } from '@angular/core';

import { Semester, SemesterDraft } from '../models/semester.model';
import { SupabaseService } from './supabase.service';

@Injectable({ providedIn: 'root' })
export class SemesterService {
  constructor(private readonly supabase: SupabaseService) {}

  async getAll(): Promise<Semester[]> {
    const { data, error } = await this.supabase.db
      .from('semesters')
      .select('*')
      .order('year', { ascending: false })
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []) as Semester[];
  }

  async getActive(): Promise<Semester | null> {
    const { data, error } = await this.supabase.db
      .from('semesters')
      .select('*')
      .eq('is_active', true)
      .maybeSingle();
    if (error) throw error;
    return data as Semester | null;
  }

  async getById(id: string): Promise<Semester | null> {
    const { data, error } = await this.supabase.db.from('semesters').select('*').eq('id', id).single();
    if (error) throw error;
    return data as Semester;
  }

  async create(draft: SemesterDraft): Promise<Semester> {
    const { data: session } = await this.supabase.getSession();
    const userId = session.session?.user.id;
    if (!userId) throw new Error('Not authenticated');
    const { data, error } = await this.supabase.db
      .from('semesters')
      .insert({ ...draft, user_id: userId })
      .select()
      .single();
    if (error) throw error;
    return data as Semester;
  }

  async update(id: string, draft: Partial<SemesterDraft>): Promise<Semester> {
    const { data, error } = await this.supabase.db
      .from('semesters')
      .update(draft)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as Semester;
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.supabase.db.from('semesters').delete().eq('id', id);
    if (error) throw error;
  }
}
