import { Injectable, signal, inject } from '@angular/core';
import { Subject } from 'rxjs';
import { Player } from '../models/player.model';
import { ToastService } from '../../shared/services/toast.service';

const FB = 'https://f1-bingo-2026-e8299-default-rtdb.europe-west1.firebasedatabase.app';
const SK = 'players';

export interface CellCheckEvent {
  playerName: string;
  playerEmoji: string;
  cellText: string;
  cellEmoji: string;
}

@Injectable({ providedIn: 'root' })
export class DataService {
  private _players = signal<Record<string, Player>>({});
  private _toast   = inject(ToastService);
  private _saving  = false;

  /** Emits whenever another player checks a new cell (detected on poll) */
  readonly cellChecked$ = new Subject<CellCheckEvent>();

  readonly players = this._players.asReadonly();

  /** Load players from Firebase, fallback to localStorage */
  async load(): Promise<void> {
    const prev = this._players();
    try {
      const r = await fetch(`${FB}/f1bingo/${SK}.json`);
      const data: Record<string, Player> | null = await r.json();
      const newData = data ?? {};
      this._emitReactions(prev, newData);
      this._players.set(newData);
    } catch {
      try {
        const raw = localStorage.getItem('f1_' + SK);
        this._players.set(raw ? JSON.parse(raw) : {});
      } catch {
        this._players.set({});
      }
    }
  }

  /** Detect newly checked cells by comparing old vs new player state */
  private _emitReactions(prev: Record<string, Player>, next: Record<string, Player>): void {
    for (const [id, newP] of Object.entries(next)) {
      const prevP = prev[id];
      if (!prevP) continue; // new player joining, ignore
      const prevSet = new Set(prevP.checked ?? []);
      const newSet  = new Set(newP.checked  ?? []);
      for (const idx of newSet) {
        if (!prevSet.has(idx)) {
          const cell = newP.grid?.[idx];
          this.cellChecked$.next({
            playerName:  newP.name,
            playerEmoji: newP.emoji,
            cellText:    cell?.text ?? '?',
            cellEmoji:   cell?.emoji ?? '',
          });
        }
      }
    }
  }

  /** Save current players to Firebase + localStorage */
  async save(): Promise<void> {
    if (this._saving) return;
    this._saving = true;
    const data = this._players();
    try {
      await fetch(`${FB}/f1bingo/${SK}.json`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      this._toast.show('✅ Sauvegardé', 'success', 1800);
    } catch {
      this._toast.show('⚠️ Sauvegarde locale uniquement', 'info', 2500);
    } finally {
      this._saving = false;
    }
    try {
      localStorage.setItem('f1_' + SK, JSON.stringify(data));
    } catch {}
  }

  /** Update a single player and persist */
  async updatePlayer(player: Player): Promise<void> {
    this._players.update(ps => ({ ...ps, [player.id]: player }));
    await this.save();
  }

  /** Delete a player and persist */
  async deletePlayer(id: string): Promise<void> {
    this._players.update(ps => {
      const copy = { ...ps };
      delete copy[id];
      return copy;
    });
    await this.save();
  }

  getPlayer(id: string): Player | undefined {
    return this._players()[id];
  }

  getPlayersSorted(): Player[] {
    return Object.values(this._players()).sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
  }
}
