import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { IqButtonComponent } from '../../shared/components/iq-button/iq-button.component';

@Component({
  selector: 'iq-register',
  standalone: true,
  imports: [FormsModule, RouterLink, IqButtonComponent],
  templateUrl: './register.component.html',
  styleUrl: './auth.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegisterComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly name = signal('');
  readonly email = signal('');
  readonly password = signal('');
  readonly confirmPassword = signal('');
  readonly loading = signal(false);
  readonly error = signal('');

  async register(): Promise<void> {
    if (this.password() !== this.confirmPassword()) {
      this.error.set('As senhas não coincidem.');
      return;
    }
    this.loading.set(true);
    this.error.set('');
    const { error } = await this.auth.signUp(this.email(), this.password());
    if (error) {
      this.error.set(error.message);
      this.loading.set(false);
    } else {
      this.router.navigate(['/dashboard']);
    }
  }

  async registerWithGoogle(): Promise<void> {
    await this.auth.signInWithGoogle();
  }
}
