import { Injectable, signal, computed } from '@angular/core';
import { Cell } from '../models/cell.model';
import { BingoLine } from '../models/f1.model';
import { DEFAULT_CELLS, BINGO_LINES, SCORE_MAP } from '../data/cells.data';
import { DataService } from './data.service';
import { AuthService } from './auth.service';

export interface LineStatus {
  id: string;
  done: boolean;
}

@Injectable({ providedIn: 'root' })
export class GameService {
  private _cells = signal<Cell[]>([]);
  private _doneLines = signal<Set<string>>(new Set());
  private _editMode = signal(false);
  private _showWin = signal(false);
  private _winMessage = signal('');
  private _streak = signal(0);
  private _streakTimer: ReturnType<typeof setTimeout> | null = null;

  readonly cells       = this._cells.asReadonly();
  readonly editMode    = this._editMode.asReadonly();
  readonly showWin     = this._showWin.asReadonly();
  readonly winMessage  = this._winMessage.asReadonly();
  readonly streak      = this._streak.asReadonly();

  readonly lineStatuses = computed<LineStatus[]>(() => {
    const playerId = this._auth.currentPlayerId();
    if (!playerId) return BINGO_LINES.map(l => ({ id: l.id, done: false }));
    const player = this._data.getPlayer(playerId);
    const checked = new Set<number>(player?.checked ?? []);
    return BINGO_LINES.map(l => ({
      id: l.id,
      done: l.els.every(i => checked.has(i)),
    }));
  });

  readonly checkedSet = computed<Set<number>>(() => {
    const id = this._auth.currentPlayerId();
    if (!id) return new Set();
    return new Set(this._data.getPlayer(id)?.checked ?? []);
  });

  readonly isBlineCell = computed<boolean[]>(() => {
    const ch = this.checkedSet();
    return Array.from({ length: 25 }, (_, i) =>
      BINGO_LINES.some(l => l.els.includes(i) && l.els.every(x => ch.has(x)))
    );
  });

  constructor(private _data: DataService, private _auth: AuthService) {}

  /** Load the grid for the current player */
  loadPlayerGrid(): void {
    const id = this._auth.currentPlayerId();
    if (!id) return;
    const p = this._data.getPlayer(id);
    if (p?.grid?.length === 25) {
      this._cells.set(JSON.parse(JSON.stringify(p.grid)));
    } else {
      this._cells.set(JSON.parse(JSON.stringify(DEFAULT_CELLS)));
    }
    this._doneLines.set(new Set(p?.doneLines ?? []));
  }

  async saveGrid(): Promise<void> {
    const id = this._auth.currentPlayerId();
    if (!id) return;
    const p = this._data.getPlayer(id);
    if (!p) return;
    await this._data.updatePlayer({ ...p, grid: JSON.parse(JSON.stringify(this._cells())) });
  }

  /** Toggle a cell check state */
  async toggle(idx: number): Promise<boolean> {
    const id = this._auth.currentPlayerId();
    if (!id || !this._auth.isOwner()) return false;
    const p = this._data.getPlayer(id);
    if (!p) return false;

    const ch = new Set(p.checked);
    let score = p.score ?? 0;
    const prob = this._cells()[idx]?.prob || 'pm';
    const pts = SCORE_MAP[prob] ?? 0;

    if (ch.has(idx)) {
      ch.delete(idx);
      score = Math.max(0, score - pts);
      // reset streak on uncheck
      this._streak.set(0);
      if (this._streakTimer) { clearTimeout(this._streakTimer); this._streakTimer = null; }
    } else {
      ch.add(idx);
      score += pts;
      // increment streak, auto-reset after 7 s of inactivity
      this._streak.update(s => s + 1);
      if (this._streakTimer) clearTimeout(this._streakTimer);
      this._streakTimer = setTimeout(() => this._streak.set(0), 7000);
    }

    await this._data.updatePlayer({ ...p, checked: [...ch], score });
    return await this._applyLines(true);
  }

  /** Swap two cells and persist */
  async swapCells(a: number, b: number): Promise<void> {
    const cells = [...this._cells()];
    const tmpA = JSON.parse(JSON.stringify(cells[a]));
    const tmpB = JSON.parse(JSON.stringify(cells[b]));
    cells[a] = { ...tmpB, id: a, col: a % 5 };
    cells[b] = { ...tmpA, id: b, col: b % 5 };
    this._cells.set(cells);
    await this.saveGrid();
  }

  /** Update a single cell (from edit modal) */
  async updateCell(idx: number, patch: Partial<Cell>): Promise<void> {
    const cells = [...this._cells()];
    cells[idx] = { ...cells[idx], ...patch };
    this._cells.set(cells);
    await this.saveGrid();
  }

  private async _applyLines(animate: boolean): Promise<boolean> {
    const id = this._auth.currentPlayerId();
    if (!id) return false;
    const p = this._data.getPlayer(id);
    if (!p) return false;

    const ch = new Set<number>(p.checked);
    const prevDone = new Set(this._doneLines());
    let newLine = false;

    for (const line of BINGO_LINES) {
      const done = line.els.every(i => ch.has(i));
      if (done && !prevDone.has(line.id)) {
        prevDone.add(line.id);
        newLine = true;
      } else if (!done) {
        prevDone.delete(line.id);
      }
    }

    this._doneLines.set(prevDone);
    await this._data.updatePlayer({ ...p, lines: prevDone.size, doneLines: [...prevDone] });

    // Full House: all 25 checked
    const fullHouse = ch.size === 25 && !prevDone.has('full');
    if (fullHouse) {
      prevDone.add('full');
      this._doneLines.set(prevDone);
      const bingoLineCount = [...prevDone].filter(id => id !== 'full').length;
      await this._data.updatePlayer({ ...p, lines: bingoLineCount, doneLines: [...prevDone] });
      this._winMessage.set(`🏆 FULL HOUSE ! ${p.name} a coché toutes les 25 cases ! 🏆`);
      this._showWin.set(true);
      return true;
    }
    // Remove 'full' if unchecked
    if (ch.size < 25) prevDone.delete('full');
    this._doneLines.set(prevDone);

    if (animate && newLine) {
      this._winMessage.set(`🏁 ${p.name} a une ligne ! 🏁`);
      this._showWin.set(true);
    }
    return newLine;
  }

  toggleEditMode(): void {
    this._editMode.update(v => !v);
  }

  closeWin(): void {
    this._showWin.set(false);
  }

  async reset(): Promise<void> {
    const id = this._auth.currentPlayerId();
    if (!id) return;
    const p = this._data.getPlayer(id);
    if (!p) return;
    await this._data.updatePlayer({ ...p, checked: [], score: 0, lines: 0, doneLines: [] });
    this._doneLines.set(new Set());
  }

  getLines(): typeof BINGO_LINES {
    return BINGO_LINES;
  }
}
