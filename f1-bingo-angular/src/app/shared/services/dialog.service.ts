import { Injectable, signal } from '@angular/core';

export type DialogType = 'alert' | 'confirm' | 'prompt' | 'pin';

export interface DialogConfig {
  type: DialogType;
  title?: string;
  message: string;
  defaultValue?: string;
  resolve: (value: any) => void;
}

@Injectable({ providedIn: 'root' })
export class DialogService {
  readonly current = signal<DialogConfig | null>(null);

  private open(cfg: Omit<DialogConfig, 'resolve'>): Promise<any> {
    return new Promise(resolve => {
      this.current.set({ ...cfg, resolve });
    });
  }

  /** Simple info / error message */
  alert(message: string, title = 'Information'): Promise<void> {
    return this.open({ type: 'alert', title, message });
  }

  /** Yes / Cancel confirmation */
  confirm(message: string, title = 'Confirmation'): Promise<boolean> {
    return this.open({ type: 'confirm', title, message });
  }

  /** Free-text input */
  prompt(message: string, defaultValue = '', title = 'Saisie'): Promise<string | null> {
    return this.open({ type: 'prompt', title, message, defaultValue });
  }

  /** PIN input (password-type, 4 digits) */
  pin(message: string, title = 'PIN'): Promise<string | null> {
    return this.open({ type: 'pin', title, message });
  }

  /** Called by DialogComponent when user responds */
  _resolve(value: any): void {
    this.current()?.resolve(value);
    this.current.set(null);
  }
}
