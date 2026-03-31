import { Injectable, signal, computed } from '@angular/core';
import { createClient, SupabaseClient, User, Session } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly supabase: SupabaseClient;

  private readonly _currentUser = signal<User | null>(null);
  private readonly _isLoading = signal(true);

  readonly currentUser = this._currentUser.asReadonly();
  readonly isAuthenticated = computed(() => !!this._currentUser());
  readonly isLoading = this._isLoading.asReadonly();

  constructor() {
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseAnonKey);

    this.supabase.auth.onAuthStateChange((_event, session) => {
      this._currentUser.set(session?.user ?? null);
      this._isLoading.set(false);
    });

    this.loadSession();
  }

  private async loadSession(): Promise<void> {
    const { data } = await this.supabase.auth.getSession();
    this._currentUser.set(data.session?.user ?? null);
    this._isLoading.set(false);
  }

  async signInWithEmail(email: string, password: string) {
    this._isLoading.set(true);
    const result = await this.supabase.auth.signInWithPassword({ email, password });
    this._isLoading.set(false);
    return result;
  }

  async signInWithGoogle() {
    return this.supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/dashboard` },
    });
  }

  async signUp(email: string, password: string) {
    this._isLoading.set(true);
    const result = await this.supabase.auth.signUp({ email, password });
    this._isLoading.set(false);
    return result;
  }

  async signOut() {
    await this.supabase.auth.signOut();
    this._currentUser.set(null);
  }

  async getSession(): Promise<Session | null> {
    const { data } = await this.supabase.auth.getSession();
    return data.session;
  }

  async getAccessToken(): Promise<string | null> {
    const session = await this.getSession();
    return session?.access_token ?? null;
  }
}
