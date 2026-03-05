import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-win-banner',
  standalone: true,
  template: `
    @if (visible()) {
      <div class="win-banner show">
        <div class="win-c">
          <div class="win-t">BINGO!</div>
          <div class="win-s">{{ message() }}</div>
        </div>
        <button class="btn win-btn" (click)="closed.emit()">Continuer →</button>
      </div>
    }
  `
})
export class WinBannerComponent {
  visible = input(false);
  message = input('🏁 Ligne complétée ! 🏁');
  closed  = output<void>();
}
