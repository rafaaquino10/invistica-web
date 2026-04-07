import { Injectable, signal, computed } from '@angular/core';
import { createClient, SupabaseClient, User, Session, AuthChangeEvent } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';

export interface UserProfile {
  name: string;
  email: string;
  avatarUrl: string | null;
}

@Injectable({ providedIn: 'root' })
export class SupabaseService {
  private supabase: SupabaseClient | null = null;
  private readonly configured: boolean;

  readonly currentUser = signal<User | null>(null);
  readonly session = signal<Session | null>(null);
  readonly isLoading = signal(true);

  readonly accessToken = computed(() => this.session()?.access_token ?? null);
  readonly isAuthenticated = computed(() => !!this.currentUser());
  readonly userProfile = computed<UserProfile>(() => {
    const user = this.currentUser();
    return {
      name: user?.user_metadata?.['full_name'] || user?.user_metadata?.['name'] || '',
      email: user?.email || '',
      avatarUrl: user?.user_metadata?.['avatar_url'] || user?.user_metadata?.['picture'] || null,
    };
  });

  constructor() {
    // Check if Supabase credentials are configured (not placeholders)
    const url = environment.supabaseUrl;
    const key = environment.supabaseAnonKey;
    this.configured = !!(url && key && !url.includes('PLACEHOLDER') && !key.includes('PLACEHOLDER'));

    if (this.configured) {
      try {
        this.supabase = createClient(url, key);
        this.supabase.auth.onAuthStateChange((event: AuthChangeEvent, session: Session | null) => {
          this.session.set(session);
          this.currentUser.set(session?.user ?? null);
          this.isLoading.set(false);
        });
      } catch {
        this.configured = false as any;
        this.isLoading.set(false);
      }
    } else {
      // No Supabase configured — run as anonymous visitor
      this.isLoading.set(false);
    }
  }

  async initialize(): Promise<void> {
    if (!this.supabase) {
      this.isLoading.set(false);
      return;
    }

    try {
      const { data } = await this.supabase.auth.getSession();
      this.session.set(data.session);
      this.currentUser.set(data.session?.user ?? null);
    } catch {
      // Supabase unreachable — continue as anonymous
    } finally {
      this.isLoading.set(false);
    }
  }

  async signInWithGoogle(): Promise<{ error: any }> {
    if (!this.supabase) return { error: { message: 'Auth not configured' } };
    const { error } = await this.supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin + '/auth/callback' },
    });
    return { error };
  }

  async signInWithEmail(email: string, password: string): Promise<{ error: any }> {
    if (!this.supabase) return { error: { message: 'Auth not configured' } };
    const { error } = await this.supabase.auth.signInWithPassword({ email, password });
    return { error };
  }

  async signUp(email: string, password: string, fullName: string): Promise<{ error: any; data: any }> {
    if (!this.supabase) return { error: { message: 'Auth not configured' }, data: null };
    const { data, error } = await this.supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: window.location.origin + '/auth/callback',
      },
    });
    return { error, data };
  }

  async signOut(): Promise<void> {
    if (!this.supabase) return;
    await this.supabase.auth.signOut();
    this.session.set(null);
    this.currentUser.set(null);
  }

  async resetPassword(email: string): Promise<{ error: any }> {
    if (!this.supabase) return { error: { message: 'Auth not configured' } };
    const { error } = await this.supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + '/auth/reset',
    });
    return { error };
  }

  async updatePassword(newPassword: string): Promise<{ error: any }> {
    if (!this.supabase) return { error: { message: 'Auth not configured' } };
    const { error } = await this.supabase.auth.updateUser({ password: newPassword });
    return { error };
  }

  async updateProfile(data: Record<string, any>): Promise<{ error: any }> {
    if (!this.supabase) return { error: { message: 'Auth not configured' } };
    const { error } = await this.supabase.auth.updateUser({ data });
    return { error };
  }

  getSession() {
    if (!this.supabase) return Promise.resolve({ data: { session: null }, error: null });
    return this.supabase.auth.getSession();
  }
}
