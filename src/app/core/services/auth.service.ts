import { Injectable, signal, computed } from '@angular/core';
import { createClient, SupabaseClient, User, Session } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';

const IS_CONFIGURED = !environment.supabaseUrl.includes('YOUR_PROJECT');

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly supabase: SupabaseClient | null = null;

  private readonly _currentUser = signal<User | null>(null);
  private readonly _isLoading = signal(!IS_CONFIGURED); // skip loading if not configured

  readonly currentUser = this._currentUser.asReadonly();
  readonly isAuthenticated = computed(() => IS_CONFIGURED ? !!this._currentUser() : true);
  readonly isLoading = this._isLoading.asReadonly();

  constructor() {
    if (!IS_CONFIGURED) {
      this._isLoading.set(false);
      return;
    }

    this.supabase = createClient(environment.supabaseUrl, environment.supabaseAnonKey);

    this.supabase.auth.onAuthStateChange((_event, session) => {
      this._currentUser.set(session?.user ?? null);
      this._isLoading.set(false);
    });

    this.loadSession();
  }

  private async loadSession(): Promise<void> {
    if (!this.supabase) return;
    const { data } = await this.supabase.auth.getSession();
    this._currentUser.set(data.session?.user ?? null);
    this._isLoading.set(false);
  }

  async signInWithEmail(email: string, password: string) {
    if (!this.supabase) return { error: { message: 'Supabase não configurado' } as any, data: null as any };
    this._isLoading.set(true);
    const result = await this.supabase.auth.signInWithPassword({ email, password });
    this._isLoading.set(false);
    return result;
  }

  async signInWithGoogle() {
    if (!this.supabase) return { error: { message: 'Supabase não configurado' } as any, data: null as any };
    return this.supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/dashboard` },
    });
  }

  async signUp(email: string, password: string) {
    if (!this.supabase) return { error: { message: 'Supabase não configurado' } as any, data: null as any };
    this._isLoading.set(true);
    const result = await this.supabase.auth.signUp({ email, password });
    this._isLoading.set(false);
    return result;
  }

  async signOut() {
    if (!this.supabase) return;
    await this.supabase.auth.signOut();
    this._currentUser.set(null);
  }

  async getSession(): Promise<Session | null> {
    if (!this.supabase) return null;
    const { data } = await this.supabase.auth.getSession();
    return data.session;
  }

  async getAccessToken(): Promise<string | null> {
    if (!this.supabase) return null;
    const session = await this.getSession();
    return session?.access_token ?? null;
  }
}
