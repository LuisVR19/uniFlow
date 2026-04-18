import { Injectable } from '@angular/core';

import { Course, CourseDraft } from '../models/course.model';
import { SupabaseService } from './supabase.service';

@Injectable({ providedIn: 'root' })
export class CourseService {
  constructor(private readonly supabase: SupabaseService) {}

  async getBySemester(semesterId: string): Promise<Course[]> {
    const { data, error } = await this.supabase.db
      .from('courses')
      .select('*')
      .eq('semester_id', semesterId)
      .order('name');
    if (error) throw error;
    return (data ?? []) as Course[];
  }

  async getById(id: string): Promise<Course | null> {
    const { data, error } = await this.supabase.db.from('courses').select('*').eq('id', id).single();
    if (error) throw error;
    return data as Course;
  }

  async create(draft: CourseDraft): Promise<Course> {
    const { data, error } = await this.supabase.db.from('courses').insert(draft).select().single();
    if (error) throw error;
    return data as Course;
  }

  async update(id: string, draft: Partial<CourseDraft>): Promise<Course> {
    const { data, error } = await this.supabase.db
      .from('courses')
      .update(draft)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as Course;
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.supabase.db.from('courses').delete().eq('id', id);
    if (error) throw error;
  }
}
