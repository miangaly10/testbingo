import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class SoundService {
  private _ctx?: AudioContext;
  private _enabled = true;

  toggle(): void { this._enabled = !this._enabled; }
  get enabled(): boolean { return this._enabled; }

  private _ctx_(): AudioContext {
    if (!this._ctx) this._ctx = new AudioContext();
    return this._ctx;
  }

  private _tone(freq: number, startT: number, dur: number, vol = 0.18): void {
    const ctx  = this._ctx_();
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.setValueAtTime(freq, startT);
    gain.gain.setValueAtTime(vol, startT);
    gain.gain.exponentialRampToValueAtTime(0.001, startT + dur);
    osc.start(startT);
    osc.stop(startT + dur + 0.01);
  }

  /** Short pop when checking a cell */
  playCheck(): void {
    if (!this._enabled) return;
    try {
      this._tone(880, this._ctx_().currentTime, 0.1, 0.15);
    } catch {}
  }

  /** Lower tone when unchecking */
  playUncheck(): void {
    if (!this._enabled) return;
    try {
      this._tone(440, this._ctx_().currentTime, 0.09, 0.08);
    } catch {}
  }

  /** Ascending fanfare on BINGO */
  playBingo(): void {
    if (!this._enabled) return;
    try {
      const ctx = this._ctx_();
      const t   = ctx.currentTime;
      const notes = [523, 659, 784, 1047]; // C5 E5 G5 C6
      notes.forEach((f, i) => this._tone(f, t + i * 0.13, 0.28, 0.22));
    } catch {}
  }

  /** Short upward blip for streak milestone */
  playStreak(): void {
    if (!this._enabled) return;
    try {
      const ctx = this._ctx_();
      const t   = ctx.currentTime;
      this._tone(660, t, 0.08, 0.12);
      this._tone(880, t + 0.09, 0.1, 0.15);
    } catch {}
  }
}
