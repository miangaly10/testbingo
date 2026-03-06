import { Injectable, signal } from '@angular/core';

export interface Toast {
  id: number;
  msg: string;
  type: 'success' | 'error' | 'info';
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  readonly toasts = signal<Toast[]>([]);
  private _id = 0;

  show(msg: string, type: Toast['type'] = 'success', duration = 2500): void {
    const id = ++this._id;
    this.toasts.update(ts => [...ts, { id, msg, type }]);
    setTimeout(() => this.dismiss(id), duration);
  }

  dismiss(id: number): void {
    this.toasts.update(ts => ts.filter(t => t.id !== id));
  }
}
