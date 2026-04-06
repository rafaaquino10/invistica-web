import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class SidebarService {
  private readonly STORAGE_KEY = 'iq-sidebar-collapsed';

  readonly collapsed = signal<boolean>(this.loadState());

  toggle(): void {
    this.collapsed.update(v => {
      const next = !v;
      localStorage.setItem(this.STORAGE_KEY, String(next));
      return next;
    });
  }

  private loadState(): boolean {
    return localStorage.getItem(this.STORAGE_KEY) === 'true';
  }
}
