import { Component, ChangeDetectionStrategy, inject, signal, OnInit, DestroyRef, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, of } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { ThemeService } from '../../core/services/theme.service';
import { BillingService, BillingStatus } from '../../core/services/billing.service';
import { IqButtonComponent } from '../../shared/components/iq-button/iq-button.component';
import { IqToggleComponent } from '../../shared/components/iq-toggle/iq-toggle.component';
import { IqSkeletonComponent } from '../../shared/components/iq-skeleton/iq-skeleton.component';

@Component({
  selector: 'iq-settings',
  standalone: true,
  imports: [FormsModule, IqButtonComponent, IqToggleComponent, IqSkeletonComponent],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly themeService = inject(ThemeService);
  private readonly billingService = inject(BillingService);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  readonly loading = signal(true);
  readonly billing = signal<BillingStatus | null>(null);
  readonly upgrading = signal(false);
  readonly showUpgradeBanner = signal(false);

  readonly user = this.auth.currentUser;
  readonly isDark = computed(() => this.themeService.theme() === 'dark');

  readonly email = computed(() => this.user()?.email ?? '');
  readonly name = computed(() => this.user()?.user_metadata?.['full_name'] ?? '');

  toggleTheme(): void {
    this.themeService.toggle();
  }

  async logout(): Promise<void> {
    await this.auth.signOut();
    window.location.href = '/login';
  }

  upgrade(): void {
    this.upgrading.set(true);
    this.billingService.createCheckout()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: res => {
          window.location.href = res.checkout_url;
        },
        error: () => this.upgrading.set(false),
      });
  }

  ngOnInit(): void {
    setTimeout(() => { if (this.loading()) this.loading.set(false); }, 5000);
    this.route.queryParams.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(params => {
      if (params['upgrade'] === 'true') this.showUpgradeBanner.set(true);
    });

    this.billingService.getStatus()
      .pipe(catchError(() => of(null)), takeUntilDestroyed(this.destroyRef))
      .subscribe(s => {
        this.billing.set(s);
        this.loading.set(false);
      });
  }
}
