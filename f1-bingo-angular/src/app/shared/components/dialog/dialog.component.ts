import { Component, inject, signal, computed, effect } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DialogService, DialogConfig } from '../../services/dialog.service';

@Component({
  selector: 'app-dialog',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './dialog.component.html',
})
export class DialogComponent {
  readonly dlg = inject(DialogService);

  inputValue = signal('');
  pinDigits  = signal<string[]>(['', '', '', '']);

  current = this.dlg.current;

  pinFull = computed(() => this.pinDigits().join('').length === 4);

  constructor() {
    effect(() => {
      const cfg = this.current();
      if (cfg) {
        this.inputValue.set(cfg.defaultValue ?? '');
        this.pinDigits.set(['', '', '', '']);
        // auto-focus first pin box after render
        if (cfg.type === 'pin') {
          setTimeout(() => (document.getElementById('dlg-pd1') as HTMLInputElement)?.focus(), 50);
        }
        if (cfg.type === 'prompt') {
          setTimeout(() => (document.querySelector('.dlg-input') as HTMLInputElement)?.focus(), 50);
        }
      }
    });
  }

  ok(): void {
    const c = this.current() as DialogConfig | null;
    if (!c) return;
    if (c.type === 'alert')   { this.dlg._resolve(undefined); }
    if (c.type === 'confirm') { this.dlg._resolve(true); }
    if (c.type === 'prompt')  { this.dlg._resolve(this.inputValue()); }
    if (c.type === 'pin')     { this.dlg._resolve(this.pinDigits().join('')); }
  }

  cancel(): void {
    const c = this.current() as DialogConfig | null;
    if (!c) return;
    if (c.type === 'confirm') this.dlg._resolve(false);
    else                      this.dlg._resolve(null);
  }

  onPinDigit(event: Event, idx: number): void {
    const el = event.target as HTMLInputElement;
    const digits = [...this.pinDigits()];
    digits[idx] = el.value.replace(/\D/, '').slice(-1);
    el.value = digits[idx];
    this.pinDigits.set(digits);
    if (digits[idx] && idx < 3) {
      (document.getElementById(`dlg-pd${idx + 2}`) as HTMLInputElement)?.focus();
    }
  }

  onPinKey(event: KeyboardEvent, idx: number): void {
    if (event.key === 'Backspace' && !this.pinDigits()[idx] && idx > 0) {
      (document.getElementById(`dlg-pd${idx}`) as HTMLInputElement)?.focus();
    }
    if (event.key === 'Enter' && this.pinFull()) this.ok();
  }

  onKeydown(e: KeyboardEvent): void {
    if (e.key === 'Enter')  { e.preventDefault(); this.ok(); }
    if (e.key === 'Escape') { e.preventDefault(); this.cancel(); }
  }
}
