import { Injectable, signal, computed } from '@angular/core';
import { createClient, SupabaseClient, User, Session } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';

const IS_CONFIGURED = !environment.supabaseUrl.includes('YOUR_PROJECT');

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly supabase: SupabaseClient | null = null;

  private readonly _currentUser = signal<User | null>(null);
  private readonly _isLoading = signal(IS_CONFIGURED);

  readonly currentUser = this._currentUser.asReadonly();
  readonly isAuthenticated = computed(() => IS_CONFIGURED ? !!this._currentUser() : true);
  readonly isLoading = this._isLoading.asReadonly();

  constructor() {
    if (!IS_CONFIGURED) {
      this._isLoading.set(false);
      return;
    }

    this.supabase = createClient(environment.supabaseUrl, environment.supabaseAnonKey, {
      auth: {
        storageKey: 'iq-auth',
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        flowType: 'implicit',
      },
    });

    // Listen for all auth state changes (login, logout, token refresh, OAuth callback)
    this.supabase.auth.onAuthStateChange((event, session) => {
      this._currentUser.set(session?.user ?? null);
      this._isLoading.set(false);
    });

    this.loadSession();
  }

  private async loadSession(): Promise<void> {
    if (!this.supabase) return;
    try {
      const { data, error } = await this.supabase.auth.getSession();
      if (error) {
        // Session expired or invalid — clear state
        this._currentUser.set(null);
        this._isLoading.set(false);
        return;
      }

      if (data.session?.user) {
        this._currentUser.set(data.session.user);
      } else {
        this._currentUser.set(null);
      }
    } catch {
      this._currentUser.set(null);
    }
    this._isLoading.set(false);
  }

  async signInWithEmail(email: string, password: string) {
    if (!this.supabase) return { error: { message: 'Supabase nao configurado' } as any, data: null as any };
    this._isLoading.set(true);
    const result = await this.supabase.auth.signInWithPassword({ email, password });
    if (!result.error && result.data?.user) {
      this._currentUser.set(result.data.user);
    }
    this._isLoading.set(false);
    return result;
  }

  async signInWithGoogle() {
    if (!this.supabase) return { error: { message: 'Supabase nao configurado' } as any, data: null as any };
    return this.supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
        queryParams: {
          prompt: 'select_account',
        },
      },
    });
  }

  async signUp(email: string, password: string) {
    if (!this.supabase) return { error: { message: 'Supabase nao configurado' } as any, data: null as any };
    this._isLoading.set(true);
    const result = await this.supabase.auth.signUp({ email, password });
    if (!result.error && result.data?.user) {
      this._currentUser.set(result.data.user);
    }
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
