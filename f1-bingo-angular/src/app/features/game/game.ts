import {
  Component, OnInit, computed, inject, signal, effect
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DataService } from '../../core/services/data.service';
import { AuthService } from '../../core/services/auth.service';
import { GameService } from '../../core/services/game.service';
import { Cell } from '../../core/models/cell.model';
import { BingoGridComponent } from './bingo-grid/bingo-grid';
import { PlayerBarComponent } from './player-bar/player-bar';
import { EditCellModalComponent } from './edit-cell-modal/edit-cell-modal';
import { ScoreboardComponent } from './scoreboard/scoreboard';
import { WinBannerComponent } from './win-banner/win-banner';

@Component({
  selector: 'app-game',
  standalone: true,
  imports: [
    BingoGridComponent,
    PlayerBarComponent,
    EditCellModalComponent,
    ScoreboardComponent,
    WinBannerComponent,
  ],
  templateUrl: './game.html',
})
export class GameComponent implements OnInit {
  private _route  = inject(ActivatedRoute);
  private _router = inject(Router);
  private _data   = inject(DataService);
  private _auth   = inject(AuthService);
  readonly game   = inject(GameService);

  showScoreboard = signal(false);
  editCellIdx    = signal<number | null>(null);

  currentPlayer = computed(() => {
    const id = this._auth.currentPlayerId();
    return id ? this._data.getPlayer(id) : undefined;
  });

  editingCell = computed(() => {
    const idx = this.editCellIdx();
    return idx !== null ? this.game.cells()[idx] : null;
  });

  isOwner    = this._auth.isOwner;
  cells      = this.game.cells;
  editMode   = this.game.editMode;
  checkedSet = this.game.checkedSet;
  isBlines   = this.game.isBlineCell;
  lineStats  = this.game.lineStatuses;
  showWin    = this.game.showWin;
  winMessage = this.game.winMessage;

  constructor() {
    // Trigger confetti when a bingo line is completed
    effect(() => {
      if (this.showWin()) {
        this.triggerConfetti();
      }
    });
  }

  async ngOnInit(): Promise<void> {
    const playerId = this._route.snapshot.paramMap.get('playerId');
    if (!playerId) { this._router.navigate(['/login']); return; }

    // If auth is lost (page refresh), reload data and redirect
    if (!this._auth.currentPlayerId()) {
      await this._data.load();
      const p = this._data.getPlayer(playerId);
      if (!p) { this._router.navigate(['/login']); return; }
      // Restore view-only session
      this._auth.loginViewOnly(playerId);
    }
    this.game.loadPlayerGrid();
  }

  // ── Interactions ──
  async onCellClick(idx: number): Promise<void> {
    if (this.game.editMode()) {
      this.editCellIdx.set(idx);
    } else {
      await this.game.toggle(idx);
    }
  }

  async onCellsSwapped(event: { a: number; b: number }): Promise<void> {
    await this.game.swapCells(event.a, event.b);
  }

  async onEditSave(patch: Partial<Cell>): Promise<void> {
    const idx = this.editCellIdx();
    if (idx === null) return;
    await this.game.updateCell(idx, patch);
    this.editCellIdx.set(null);
  }

  onEditCancel(): void { this.editCellIdx.set(null); }

  toggleEditMode(): void { this.game.toggleEditMode(); }

  async resetGrid(): Promise<void> {
    if (!confirm('Réinitialiser votre grille ?')) return;
    await this.game.reset();
  }

  async editPlayerName(): Promise<void> {
    const p = this.currentPlayer();
    if (!p) return;
    const newName = prompt('Nouveau nom :', p.name);
    if (!newName?.trim() || newName.trim() === p.name) return;
    await this._data.updatePlayer({ ...p, name: newName.trim().slice(0, 20) });
  }

  async deleteCurrentPlayer(): Promise<void> {
    const p = this.currentPlayer();
    if (!p || !confirm(`Supprimer « ${p.name} » et toutes ses données ?`)) return;
    await this._data.deletePlayer(p.id);
    this.switchPlayer();
  }

  switchPlayer(): void {
    this._auth.logout();
    this._router.navigate(['/login']);
  }

  closeWin(): void { this.game.closeWin(); }

  // ── Confetti ──
  triggerConfetti(): void {
    const cv = document.getElementById('cfv') as HTMLCanvasElement | null;
    if (!cv) return;
    cv.width = innerWidth;
    cv.height = innerHeight;
    const ctx = cv.getContext('2d')!;
    const cols = ['#FFD700','#E8002D','#00D2BE','#FF8000','#fff','#FF69B4'];
    const ps = Array.from({ length: 140 }, () => ({
      x: Math.random() * cv.width, y: Math.random() * cv.height - cv.height,
      w: Math.random() * 10 + 5, h: Math.random() * 5 + 3,
      c: cols[Math.floor(Math.random() * 6)],
      vx: (Math.random() - .5) * 4, vy: Math.random() * 4 + 2,
      a: Math.random() * 360, va: (Math.random() - .5) * 8,
    }));
    let f = 0;
    const draw = () => {
      ctx.clearRect(0, 0, cv.width, cv.height);
      ps.forEach(p => {
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.a * Math.PI / 180);
        ctx.fillStyle = p.c; ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
        p.x += p.vx; p.y += p.vy; p.a += p.va; p.vy += .06;
      });
      f++;
      if (f < 200) requestAnimationFrame(draw);
      else ctx.clearRect(0, 0, cv.width, cv.height);
    };
    draw();
  }
}
