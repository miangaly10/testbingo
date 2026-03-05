import { Injectable, signal, computed } from '@angular/core';
import { Player } from '../models/player.model';

const FB = 'https://f1-bingo-2026-e8299-default-rtdb.europe-west1.firebasedatabase.app';
const SK = 'players';

@Injectable({ providedIn: 'root' })
export class DataService {
  private _players = signal<Record<string, Player>>({});

  readonly players = this._players.asReadonly();

  /** Load players from Firebase, fallback to localStorage */
  async load(): Promise<void> {
    try {
      const r = await fetch(`${FB}/f1bingo/${SK}.json`);
      const data: Record<string, Player> | null = await r.json();
      this._players.set(data ?? {});
    } catch {
      try {
        const raw = localStorage.getItem('f1_' + SK);
        this._players.set(raw ? JSON.parse(raw) : {});
      } catch {
        this._players.set({});
      }
    }
  }

  /** Save current players to Firebase + localStorage */
  async save(): Promise<void> {
    const data = this._players();
    try {
      await fetch(`${FB}/f1bingo/${SK}.json`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
    } catch {}
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
