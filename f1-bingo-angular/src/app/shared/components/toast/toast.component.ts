import { Component, inject } from '@angular/core';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  template: `
    <div class="toast-stack">
      @for (t of svc.toasts(); track t.id) {
        <div class="toast" [class]="'toast-' + t.type" (click)="svc.dismiss(t.id)">
          {{ t.msg }}
        </div>
      }
    </div>
  `,
})
export class ToastComponent {
  svc = inject(ToastService);
}
