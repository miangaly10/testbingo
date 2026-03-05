import { Injectable, signal } from '@angular/core';
import { Player } from '../models/player.model';

/** Simple PIN auth: hash PIN + store current session */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private _currentPlayerId = signal<string | null>(null);
  private _isOwner = signal(false);
  private _pendingId = signal<string | null>(null);

  readonly currentPlayerId = this._currentPlayerId.asReadonly();
  readonly isOwner = this._isOwner.asReadonly();
  readonly pendingId = this._pendingId.asReadonly();

  hashPin(pin: string): string {
    let h = 0;
    for (let i = 0; i < pin.length; i++) {
      h = (h << 5) - h + pin.charCodeAt(i);
      h |= 0;
    }
    return 'h' + Math.abs(h).toString(36);
  }

  setPending(id: string): void {
    this._pendingId.set(id);
  }

  loginWithPin(pin: string, player: Player): boolean {
    if (this.hashPin(pin) === player.pin) {
      this._currentPlayerId.set(player.id);
      this._isOwner.set(true);
      this._pendingId.set(null);
      return true;
    }
    return false;
  }

  loginViewOnly(id: string): void {
    this._currentPlayerId.set(id);
    this._isOwner.set(false);
    this._pendingId.set(null);
  }

  logout(): void {
    this._currentPlayerId.set(null);
    this._isOwner.set(false);
    this._pendingId.set(null);
  }
}
