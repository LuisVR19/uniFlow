import { Injectable } from '@angular/core';

import { Profile, ProfileDraft } from '../models/profile.model';
import { SupabaseService } from './supabase.service';

@Injectable({ providedIn: 'root' })
export class ProfileService {
  constructor(private readonly supabase: SupabaseService) {}

  async get(): Promise<Profile | null> {
    const { data, error } = await this.supabase.db.from('profiles').select('*').maybeSingle();
    if (error) throw error;
    return data as Profile | null;
  }

  async create(draft: ProfileDraft & { id: string }): Promise<Profile> {
    const { data, error } = await this.supabase.db.from('profiles').insert(draft).select().single();
    if (error) throw error;
    return data as Profile;
  }

  async update(draft: ProfileDraft): Promise<Profile> {
    const { data: sessionData } = await this.supabase.getSession();
    const userId = sessionData.session?.user.id;
    if (!userId) throw new Error('Not authenticated');
    const { data, error } = await this.supabase.db
      .from('profiles')
      .upsert({ id: userId, ...draft }, { onConflict: 'id' })
      .select()
      .single();
    if (error) throw error;
    return data as Profile;
  }
}
