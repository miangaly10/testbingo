import { Injectable, signal, computed } from '@angular/core';
import { Cell } from '../models/cell.model';
import { BingoLine } from '../models/f1.model';
import { DEFAULT_CELLS, BINGO_LINES, SCORE_MAP } from '../data/cells.data';
import { F1_CALENDAR_2026 } from '../../features/game/game';
import { DataService } from './data.service';
import { AuthService } from './auth.service';

// La grille se verrouille au début du GP d'Australie
const SEASON_LOCK_DATE = new Date('2026-03-08T04:00:00Z');

/** Retourne l'index du GP en cours (dernier GP dont la date est passée), ou -1 avant la saison. */
function getCurrentGpIndex(): number {
  const now = Date.now();
  let last = -1;
  for (let i = 0; i < F1_CALENDAR_2026.length; i++) {
    if (F1_CALENDAR_2026[i].date.getTime() <= now) last = i;
    else break;
  }
  return last;
}

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
  private _firstFinder = signal<{ tag: string; emoji: string } | null>(null);

  readonly cells        = this._cells.asReadonly();
  readonly editMode     = this._editMode.asReadonly();
  readonly showWin      = this._showWin.asReadonly();
  readonly winMessage   = this._winMessage.asReadonly();
  readonly streak       = this._streak.asReadonly();
  readonly firstFinder  = this._firstFinder.asReadonly();

  readonly seasonLocked  = computed(() => Date.now() >= SEASON_LOCK_DATE.getTime());

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

    // Recharger les données fraîches de Firebase avant de calculer les bonus
    await this._data.load();

    const p = this._data.getPlayer(id);
    if (!p) return false;

    const ch = new Set(p.checked);
    let score = p.score ?? 0;
    const prob = this._cells()[idx]?.prob || 'pm';
    const pts = SCORE_MAP[prob] ?? 0;
    const cell = this._cells()[idx];
    const currentGpIdx = getCurrentGpIndex();
    const checkedGp = { ...(p.checkedGp ?? {}) };

    // Tous les joueurs (sauf moi) — données fraîches post-load
    const allPlayers = Object.values(this._data.players());
    const otherPlayers = allPlayers.filter(other => other.id !== id);

    // Aucun joueur (moi inclus) n'a encore coché quoi que ce soit → premier move du jeu
    const isVeryFirstMove = !p.gotFirstMoveBonus &&
      (p.checked?.length ?? 0) === 0 &&
      otherPlayers.every(o => (o.checked?.length ?? 0) === 0);

    // Autres joueurs ayant coché cette cellule spécifique (données fraîches)
    const otherCheckers = otherPlayers
      .filter(other => other.checkedGp?.[idx] !== undefined);

    if (ch.has(idx)) {
      // Reprendre le bonus first-move si c'est ce joueur qui l'avait eu et c'est la seule case
      const wasFirstMove = p.gotFirstMoveBonus && (p.checked?.length ?? 0) === 1 &&
        otherPlayers.every(o => (o.checked?.length ?? 0) === 0);
      // Reprendre +1 thème : si personne d'autre OU si mon GP était le GP de découverte
      const myGp = p.checkedGp?.[idx] as number | undefined;
      let cellBonus = 0;
      if (otherCheckers.length === 0) {
        cellBonus = 1; // j'étais le seul à avoir coché cette case
      } else {
        const minOtherGp = Math.min(...otherCheckers.map(o => o.checkedGp![idx] as number));
        if (myGp !== undefined && myGp <= minOtherGp) cellBonus = 1; // j'étais dans la fenêtre du premier GP
      }
      ch.delete(idx);
      score = Math.max(0, score - pts - cellBonus - (wasFirstMove ? 10 : 0));
      delete checkedGp[idx];
      const gotFirstMoveBonus = wasFirstMove ? false : (p.gotFirstMoveBonus ?? false);
      await this._data.updatePlayer({ ...p, checked: [...ch], checkedGp, score, gotFirstMoveBonus });
      // reset streak on uncheck
      this._streak.set(0);
      if (this._streakTimer) { clearTimeout(this._streakTimer); this._streakTimer = null; }
      return await this._applyLines(true);
    } else {
      // +1 thème : premier à trouver cette case (ou même GP que le premier)
      let cellBonus = 0;
      if (otherCheckers.length === 0) {
        cellBonus = 1; // premier à cocher cette case → bonus thème
      } else {
        const minOtherGp = Math.min(...otherCheckers.map(o => o.checkedGp![idx] as number));
        if (minOtherGp === currentGpIdx) cellBonus = 1; // même GP que le premier → bonus aussi
      }
      // +10 pour le tout premier cochage de toute la partie
      if (isVeryFirstMove) {
        cellBonus += 10;
        this._firstFinder.set({ tag: cell?.tag ?? '', emoji: cell?.emoji ?? '🥇' });
      }
      ch.add(idx);
      score += pts + cellBonus;
      checkedGp[idx] = currentGpIdx;
      // increment streak, auto-reset after 7 s of inactivity
      this._streak.update(s => s + 1);
      if (this._streakTimer) clearTimeout(this._streakTimer);
      this._streakTimer = setTimeout(() => this._streak.set(0), 7000);
    }

    await this._data.updatePlayer({ ...p, checked: [...ch], checkedGp, score, gotFirstMoveBonus: p.gotFirstMoveBonus || isVeryFirstMove });
    return await this._applyLines(true);
  }

  /** Swap two cells and persist */
  async swapCells(a: number, b: number): Promise<void> {
    if (this.seasonLocked()) return;
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
    if (this.seasonLocked()) return;
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
    let lineBonus = 0;
    let firstLineName = '';
    const bonusedLines = new Set<string>(p.bonusLines ?? []);

    for (const line of BINGO_LINES) {
      const done = line.els.every(i => ch.has(i));
      if (done && !prevDone.has(line.id)) {
        prevDone.add(line.id);
        newLine = true;
        // Bonus : premier joueur à compléter cette ligne (horizontale, verticale ou diagonale)
        const otherHasLine = Object.values(this._data.players())
          .some(other => other.id !== id && other.doneLines?.includes(line.id));
        if (!otherHasLine) {
          lineBonus += 10;
          bonusedLines.add(line.id);
          if (!firstLineName) {
            const type = line.id.startsWith('r') ? '➡️ horizontale' :
                         line.id.startsWith('c') ? '⬇️ verticale' : '↗️ diagonale';
            firstLineName = type;
          }
        }
      } else if (!done && prevDone.has(line.id)) {
        prevDone.delete(line.id);
        // Retrait du bonus de ligne si le joueur l'avait obtenu
        if (bonusedLines.has(line.id)) {
          lineBonus -= 10;
          bonusedLines.delete(line.id);
        }
      }
    }

    const updatedScore = Math.max(0, (p.score ?? 0) + lineBonus);
    this._doneLines.set(prevDone);
    await this._data.updatePlayer({ ...p, score: updatedScore, lines: prevDone.size, doneLines: [...prevDone], bonusLines: [...bonusedLines] });

    // Full House: all 25 checked
    const fullHouse = ch.size === 25 && !prevDone.has('full');
    if (fullHouse) {
      prevDone.add('full');
      this._doneLines.set(prevDone);
      const bingoLineCount = [...prevDone].filter(lineId => lineId !== 'full').length;
      await this._data.updatePlayer({ ...p, score: updatedScore, lines: bingoLineCount, doneLines: [...prevDone], bonusLines: [...bonusedLines] });
      this._winMessage.set(`🏆 FULL HOUSE ! ${p.name} a coché toutes les 25 cases ! 🏆`);
      this._showWin.set(true);
      return true;
    }
    // Remove 'full' if unchecked
    if (ch.size < 25) prevDone.delete('full');
    this._doneLines.set(prevDone);

    if (animate && newLine) {
      const bonusMsg = lineBonus > 0 ? ` (+${lineBonus} pts bonus ligne ${firstLineName} !)` : '';
      this._winMessage.set(`🏁 ${p.name} a une ligne !${bonusMsg} 🏁`);
      this._showWin.set(true);
    }
    return newLine;
  }

  toggleEditMode(): void {
    if (this.seasonLocked()) return;
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
