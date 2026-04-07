import { Injectable, inject, computed } from '@angular/core';
import { Router } from '@angular/router';
import { SupabaseService } from './supabase.service';

const ERROR_MAP: Record<string, string> = {
  'Invalid login credentials': 'Email ou senha incorretos',
  'User already registered': 'Este email já está cadastrado',
  'Email not confirmed': 'Verifique seu email antes de entrar',
  'Signup requires a valid password': 'Senha inválida',
  'Password should be at least 6 characters': 'A senha deve ter pelo menos 6 caracteres',
};

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly supabase = inject(SupabaseService);
  private readonly router = inject(Router);

  readonly currentUser = this.supabase.currentUser;
  readonly session = this.supabase.session;
  readonly isAuthenticated = this.supabase.isAuthenticated;
  readonly isLoading = this.supabase.isLoading;
  readonly userProfile = this.supabase.userProfile;
  readonly accessToken = this.supabase.accessToken;

  async login(email: string, password: string): Promise<string | null> {
    const { error } = await this.supabase.signInWithEmail(email, password);
    if (error) return this.translateError(error.message);
    return null;
  }

  async loginWithGoogle(): Promise<string | null> {
    const { error } = await this.supabase.signInWithGoogle();
    if (error) return this.translateError(error.message);
    return null;
  }

  async register(email: string, password: string, name: string): Promise<{ error: string | null; needsVerification: boolean }> {
    const { error, data } = await this.supabase.signUp(email, password, name);
    if (error) return { error: this.translateError(error.message), needsVerification: false };
    const needsVerification = !data?.session;
    return { error: null, needsVerification };
  }

  async logout(): Promise<void> {
    await this.supabase.signOut();
    this.router.navigate(['/']);
  }

  async resetPassword(email: string): Promise<string | null> {
    const { error } = await this.supabase.resetPassword(email);
    if (error) return this.translateError(error.message);
    return null;
  }

  async updatePassword(newPassword: string): Promise<string | null> {
    const { error } = await this.supabase.updatePassword(newPassword);
    if (error) return this.translateError(error.message);
    return null;
  }

  async updateProfile(data: Record<string, any>): Promise<string | null> {
    const { error } = await this.supabase.updateProfile(data);
    if (error) return this.translateError(error.message);
    return null;
  }

  navigateAfterLogin(returnUrl?: string): void {
    this.router.navigateByUrl(returnUrl || '/dashboard');
  }

  private translateError(msg: string): string {
    return ERROR_MAP[msg] || 'Erro ao processar. Tente novamente.';
  }
}
