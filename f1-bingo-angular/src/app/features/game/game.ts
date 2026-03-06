import {
  Component, OnInit, OnDestroy, computed, inject, signal, effect
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { SlicePipe } from '@angular/common';
import { Subscription } from 'rxjs';
import { DataService } from '../../core/services/data.service';
import { AuthService } from '../../core/services/auth.service';
import { GameService } from '../../core/services/game.service';
import { DialogService } from '../../shared/services/dialog.service';
import { ToastService } from '../../shared/services/toast.service';
import { SoundService } from '../../shared/services/sound.service';
import { Cell } from '../../core/models/cell.model';
import { BINGO_LINES } from '../../core/data/cells.data';
import { F1_TEAMS } from '../../core/data/teams.data';
import { BingoGridComponent } from './bingo-grid/bingo-grid';
import { PlayerBarComponent } from './player-bar/player-bar';
import { EditCellModalComponent } from './edit-cell-modal/edit-cell-modal';
import { ScoreboardComponent } from './scoreboard/scoreboard';
import { WinBannerComponent } from './win-banner/win-banner';
import { AvatarPickerModalComponent } from './avatar-picker-modal/avatar-picker-modal';
import { AvatarComponent } from '../../shared/components/avatar/avatar.component';

// ── 2026 F1 Calendar ─────────────────────────────────────────────────────────
export interface GpEntry { name: string; flag: string; date: Date; sprint?: boolean; }

export const F1_CALENDAR_2026: GpEntry[] = [
  { name: 'Australie',        flag: '🇦🇺', date: new Date('2026-03-08T04:00:00Z') },
  { name: 'Chine',            flag: '🇨🇳', date: new Date('2026-03-15T08:00:00Z'), sprint: true },
  { name: 'Japon',            flag: '🇯🇵', date: new Date('2026-03-29T06:00:00Z') },
  { name: 'Bahreïn',          flag: '🇧🇭', date: new Date('2026-04-12T16:00:00Z') },
  { name: 'Arabie Saoudite',  flag: '🇸🇦', date: new Date('2026-04-19T18:00:00Z') },
  { name: 'Miami',            flag: '🇺🇸', date: new Date('2026-05-03T21:00:00Z'), sprint: true },
  { name: 'Canada',           flag: '🇨🇦', date: new Date('2026-05-24T21:00:00Z'), sprint: true },
  { name: 'Monaco',           flag: '🇲🇨', date: new Date('2026-06-07T14:00:00Z') },
  { name: 'Barcelone',        flag: '🇪🇸', date: new Date('2026-06-14T14:00:00Z') },
  { name: 'Autriche',         flag: '🇦🇹', date: new Date('2026-06-28T14:00:00Z') },
  { name: 'Grande-Bretagne',  flag: '🇬🇧', date: new Date('2026-07-05T15:00:00Z'), sprint: true },
  { name: 'Belgique',         flag: '🇧🇪', date: new Date('2026-07-19T14:00:00Z') },
  { name: 'Hongrie',          flag: '🇭🇺', date: new Date('2026-07-26T14:00:00Z') },
  { name: 'Pays-Bas',         flag: '🇳🇱', date: new Date('2026-08-23T14:00:00Z'), sprint: true },
  { name: 'Italie',           flag: '🇮🇹', date: new Date('2026-09-06T14:00:00Z') },
  { name: 'Espagne (Madrid)', flag: '🇪🇸', date: new Date('2026-09-13T14:00:00Z') },
  { name: 'Azerbaïdjan',      flag: '🇦🇿', date: new Date('2026-09-26T12:00:00Z') },
  { name: 'Singapour',        flag: '🇸🇬', date: new Date('2026-10-11T13:00:00Z'), sprint: true },
  { name: 'États-Unis',       flag: '🇺🇸', date: new Date('2026-10-25T21:00:00Z') },
  { name: 'Mexique',          flag: '🇲🇽', date: new Date('2026-11-01T20:00:00Z') },
  { name: 'Brésil',           flag: '🇧🇷', date: new Date('2026-11-08T17:00:00Z') },
  { name: 'Las Vegas',        flag: '🇺🇸', date: new Date('2026-11-22T04:00:00Z') },
  { name: 'Qatar',            flag: '🇶🇦', date: new Date('2026-11-29T16:00:00Z') },
  { name: 'Abu Dhabi',        flag: '🇦🇪', date: new Date('2026-12-06T13:00:00Z') },
];

export function getNextRace(): GpEntry {
  const now = Date.now();
  return F1_CALENDAR_2026.find(r => r.date.getTime() > now) ?? F1_CALENDAR_2026[F1_CALENDAR_2026.length - 1];
}

export function formatCountdown(target: Date): string {
  const diff = target.getTime() - Date.now();
  if (diff <= 0) return 'EN COURS 🏎️';
  const d = Math.floor(diff / 86_400_000);
  const h = Math.floor((diff % 86_400_000) / 3_600_000);
  const m = Math.floor((diff % 3_600_000) / 60_000);
  const s = Math.floor((diff % 60_000) / 1_000);
  return `${d}j ${h}h ${m}m ${s}s`;
}

@Component({
  selector: 'app-game',
  standalone: true,
  imports: [
    SlicePipe,
    BingoGridComponent,
    PlayerBarComponent,
    EditCellModalComponent,
    ScoreboardComponent,
    WinBannerComponent,
    AvatarPickerModalComponent,
    AvatarComponent,
  ],
  templateUrl: './game.html',
})
export class GameComponent implements OnInit, OnDestroy {
  private _route  = inject(ActivatedRoute);
  private _router = inject(Router);
  private _data   = inject(DataService);
  private _auth   = inject(AuthService);
  private _dlg    = inject(DialogService);
  private _toast  = inject(ToastService);
  private _sound  = inject(SoundService);
  readonly game   = inject(GameService);

  showScoreboard   = signal(false);
  showHistory      = signal(false);
  editCellIdx      = signal<number | null>(null);
  showAvatarPicker = signal(false);
  showPlayerBrowse = signal(false);
  soundEnabled     = signal(true);

  // ── Spectator mode ──
  spectatorId = signal<string | null>(null);

  spectatedPlayer = computed(() => {
    const sid = this.spectatorId();
    return sid ? this._data.getPlayer(sid) : null;
  });

  spectatedChecked = computed<Set<number>>(() => {
    const p = this.spectatedPlayer();
    return new Set(p?.checked ?? []);
  });

  spectatedCells = computed(() => this.spectatedPlayer()?.grid ?? []);

  spectatedBlines = computed<boolean[]>(() => {
    const ch = this.spectatedChecked();
    return Array.from({ length: 25 }, (_, i) =>
      BINGO_LINES.some(l => l.els.includes(i) && l.els.every(x => ch.has(x)))
    );
  });

  isSpectating = computed(() => this.spectatorId() !== null);

  otherPlayers = computed(() => {
    const myId = this._auth.currentPlayerId();
    return this._data.getPlayersSorted().filter(p => p.id !== myId);
  });

  // ── Display (own or spectated) ──
  displayCells   = computed(() => this.isSpectating() ? this.spectatedCells()   : this.game.cells());
  displayChecked = computed(() => this.isSpectating() ? this.spectatedChecked() : this.game.checkedSet());
  displayBlines  = computed(() => this.isSpectating() ? this.spectatedBlines()  : this.game.isBlineCell());

  // ── Team accent color ──
  accentColor = computed(() => {
    const emoji = this.currentPlayer()?.emoji ?? '';
    if (emoji.startsWith('[T]')) {
      const code = emoji.slice(3);
      const team = F1_TEAMS.find(t => t.code === code);
      if (team) return team.color;
    }
    return '#E8002D';
  });

  // ── GP Countdown ──
  nextGpName      = signal(getNextRace().name);
  nextGpFlag      = signal(getNextRace().flag);
  countdown       = signal(formatCountdown(getNextRace().date));

  // ── Intervals / Subscriptions ──
  private _pollId:       ReturnType<typeof setInterval> | null = null;
  private _countdownId:  ReturnType<typeof setInterval> | null = null;
  private _reactionSub?: Subscription;

  currentPlayer = computed(() => {
    const id = this._auth.currentPlayerId();
    return id ? this._data.getPlayer(id) : undefined;
  });

  editingCell = computed(() => {
    const idx = this.editCellIdx();
    return idx !== null ? this.game.cells()[idx] : null;
  });

  isOwner    = this._auth.isOwner;
  editMode   = this.game.editMode;
  seasonLocked = this.game.seasonLocked;
  lineStats  = this.game.lineStatuses;
  showWin    = this.game.showWin;
  winMessage = this.game.winMessage;

  constructor() {
    // Confetti + bingo sound on win
    effect(() => {
      if (this.showWin()) {
        this.triggerConfetti();
        this._sound.playBingo();
      }
    });

    // Streak toast
    effect(() => {
      const s = this.game.streak();
      if (s >= 3) {
        this._toast.show(`🔥 ${s} en série !`, 'info', 2200);
        if (s % 3 === 0) this._sound.playStreak();
      }
    });

    // First-finder bonus toast
    effect(() => {
      const ff = this.game.firstFinder();
      if (ff) {
        this._toast.show(`🥇 Premier sur ${ff.emoji} ${ff.tag} ! +1 pt`, 'success', 2500);
      }
    });

    // Countdown tick — auto-advances to next race
    this._countdownId = setInterval(() => {
      const next = getNextRace();
      this.nextGpName.set(next.name);
      this.nextGpFlag.set(next.flag);
      this.countdown.set(formatCountdown(next.date));
    }, 1000);

    // Poll data every 20 s to keep spectator view fresh + reactions
    this._pollId = setInterval(() => this._data.load(), 20_000);
  }

  ngOnDestroy(): void {
    if (this._pollId)      clearInterval(this._pollId);
    if (this._countdownId) clearInterval(this._countdownId);
    this._reactionSub?.unsubscribe();
  }

  async ngOnInit(): Promise<void> {
    const playerId = this._route.snapshot.paramMap.get('playerId');
    if (!playerId) { this._router.navigate(['/login']); return; }

    if (!this._auth.currentPlayerId()) {
      await this._data.load();
      const p = this._data.getPlayer(playerId);
      if (!p) { this._router.navigate(['/login']); return; }
      this._auth.loginViewOnly(playerId);
    }
    this.game.loadPlayerGrid();

    // Subscribe to real-time reactions (other players checking cells)
    this._reactionSub = this._data.cellChecked$.subscribe(evt => {
      const myId = this._auth.currentPlayerId();
      const myself = myId ? this._data.getPlayer(myId) : undefined;
      // Don't show toast for own actions
      if (evt.playerName === myself?.name) return;
      this._toast.show(
        `${evt.playerEmoji.startsWith('[') ? '🏎️' : evt.playerEmoji} ${evt.playerName} a coché ${evt.cellEmoji} ${evt.cellText}`,
        'info',
        3000,
      );
    });
  }

  // ── Cell interactions ──
  async onCellClick(idx: number): Promise<void> {
    if (this.isSpectating()) return;
    if (this.game.editMode()) {
      this.editCellIdx.set(idx);
    } else {
      const wasChecked = this.game.checkedSet().has(idx);
      await this.game.toggle(idx);
      if (wasChecked) this._sound.playUncheck();
      else            this._sound.playCheck();
    }
  }

  async onCellsSwapped(event: { a: number; b: number }): Promise<void> {
    if (this.isSpectating()) return;
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
    const ok = await this._dlg.confirm('Réinitialiser votre grille ? Toutes les cases seront décochées.', 'Réinitialiser');
    if (!ok) return;
    await this.game.reset();
  }

  // ── Match history — finish race ──
  async finishRace(): Promise<void> {
    const p = this.currentPlayer();
    if (!p) return;
    const gp = await this._dlg.prompt('Nom du Grand Prix :', getNextRace().name, 'Terminer la course');
    if (!gp?.trim()) return;
    const result = { gp: gp.trim(), score: p.score ?? 0, lines: p.lines ?? 0, date: new Date().toISOString() };
    const history = [...(p.history ?? []), result];
    await this._data.updatePlayer({ ...p, history });
    this._toast.show(`🏁 Course "${gp.trim()}" enregistrée ! ${p.score ?? 0} pts`, 'success', 3000);
  }

  // ── Player account ──
  async editPlayerName(): Promise<void> {
    const p = this.currentPlayer();
    if (!p) return;
    const newName = await this._dlg.prompt('Nouveau nom :', p.name, 'Modifier le nom');
    if (!newName?.trim() || newName.trim() === p.name) return;
    await this._data.updatePlayer({ ...p, name: newName.trim().slice(0, 20) });
  }

  async changePin(): Promise<void> {
    const p = this.currentPlayer();
    if (!p) return;

    const current = await this._dlg.pin('Entrez votre PIN actuel', 'Vérification');
    if (current === null) return;
    if (this._auth.hashPin(current) !== p.pin) {
      await this._dlg.alert('PIN actuel incorrect.', 'Erreur');
      return;
    }

    const newPin = await this._dlg.pin('Entrez votre nouveau PIN (4 chiffres)', 'Nouveau PIN');
    if (newPin === null || newPin.length !== 4) return;

    const confirmPin = await this._dlg.pin('Confirmez le nouveau PIN', 'Confirmation');
    if (confirmPin !== newPin) {
      await this._dlg.alert('Les deux PINs ne correspondent pas.', 'Erreur');
      return;
    }

    await this._data.updatePlayer({ ...p, pin: this._auth.hashPin(newPin) });
  }

  async editAvatar(emoji: string): Promise<void> {
    const p = this.currentPlayer();
    if (!p) return;
    await this._data.updatePlayer({ ...p, emoji });
    this.showAvatarPicker.set(false);
  }

  async deleteCurrentPlayer(): Promise<void> {
    const p = this.currentPlayer();
    if (!p) return;

    const pin = await this._dlg.pin(`Confirmez votre PIN pour supprimer « ${p.name} »`, 'Confirmation PIN');
    if (pin === null) return;

    if (this._auth.hashPin(pin) !== p.pin) {
      await this._dlg.alert('PIN incorrect. Suppression annulée.', 'Erreur');
      return;
    }

    const ok = await this._dlg.confirm(`Supprimer définitivement « ${p.name} » et toutes ses données ?`, 'Supprimer le joueur');
    if (!ok) return;
    await this._data.deletePlayer(p.id);
    this.switchPlayer();
  }

  switchPlayer(): void {
    this._auth.logout();
    this._router.navigate(['/login']);
  }

  toggleSound(): void {
    this._sound.toggle();
    this.soundEnabled.set(this._sound.enabled);
  }

  // ── Spectator ──
  spectate(id: string): void {
    this.spectatorId.set(id);
    this.showPlayerBrowse.set(false);
  }

  exitSpectate(): void {
    this.spectatorId.set(null);
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
