import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { IqButtonComponent } from '../../shared/components/iq-button/iq-button.component';

@Component({
  selector: 'iq-login',
  standalone: true,
  imports: [FormsModule, RouterLink, IqButtonComponent],
  templateUrl: './login.component.html',
  styleUrl: './auth.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly email = signal('');
  readonly password = signal('');
  readonly loading = signal(false);
  readonly error = signal('');

  async login(): Promise<void> {
    this.loading.set(true);
    this.error.set('');
    const { error } = await this.auth.signInWithEmail(this.email(), this.password());
    if (error) {
      this.error.set(error.message);
      this.loading.set(false);
    } else {
      this.router.navigate(['/dashboard']);
    }
  }

  async loginWithGoogle(): Promise<void> {
    await this.auth.signInWithGoogle();
  }
}
