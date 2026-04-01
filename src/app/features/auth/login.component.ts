import { Component, ChangeDetectionStrategy, inject, signal, AfterViewInit, ElementRef, viewChild } from '@angular/core';
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
export class LoginComponent implements AfterViewInit {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly heroCanvas = viewChild<ElementRef<HTMLCanvasElement>>('heroCanvas');

  readonly email = signal('');
  readonly password = signal('');
  readonly loading = signal(false);
  readonly error = signal('');

  ngAfterViewInit(): void {
    this.drawChart();
  }

  private drawChart(): void {
    const canvas = this.heroCanvas()?.nativeElement;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvas.parentElement!.clientWidth;
    canvas.height = canvas.parentElement!.clientHeight;
    const w = canvas.width, h = canvas.height;

    const points: number[] = [];
    let y = h * 0.75;
    for (let i = 0; i < 100; i++) {
      y += -(h * 0.5) / 100 + (Math.random() - 0.5) * 8;
      y = Math.max(h * 0.12, Math.min(h * 0.88, y));
      points.push(y);
    }

    let revealed = 0;
    const step = w / (points.length - 1);
    const draw = () => {
      revealed = Math.min(revealed + 0.8, points.length);
      ctx.clearRect(0, 0, w, h);
      const pts = points.slice(0, revealed);
      if (pts.length < 2) { requestAnimationFrame(draw); return; }

      ctx.beginPath();
      ctx.moveTo(0, h);
      pts.forEach((py, i) => ctx.lineTo(i * step, py));
      ctx.lineTo((pts.length - 1) * step, h);
      ctx.closePath();
      ctx.fillStyle = 'rgba(61, 61, 58, 0.04)';
      ctx.fill();

      ctx.beginPath();
      pts.forEach((py, i) => { if (i === 0) ctx.moveTo(0, py); else ctx.lineTo(i * step, py); });
      ctx.strokeStyle = 'rgba(61, 61, 58, 0.12)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      if (revealed < points.length) requestAnimationFrame(draw);
    };
    requestAnimationFrame(draw);
  }

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
