import { Injectable, signal, effect } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  isDark = signal<boolean>(true);

  constructor() {
    const saved = localStorage.getItem('f1-theme');
    const dark = saved !== 'light';
    this.isDark.set(dark);

    // Apply immediately (synchronous) to avoid flash on page load
    document.documentElement.classList.toggle('light-theme', !dark);

    effect(() => {
      document.documentElement.classList.toggle('light-theme', !this.isDark());
      localStorage.setItem('f1-theme', this.isDark() ? 'dark' : 'light');
    });
  }

  toggle(): void {
    this.isDark.update(v => !v);
  }
}
