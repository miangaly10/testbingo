import {
  Component, OnInit, signal, computed, inject
} from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DataService } from '../../core/services/data.service';
import { AuthService } from '../../core/services/auth.service';
import { AvatarComponent } from '../../shared/components/avatar/avatar.component';
import { EMOJI_CATS, EMOJIS } from '../../core/data/emojis.data';
import { F1_TEAMS } from '../../core/data/teams.data';
import { F1_DRIVERS } from '../../core/data/drivers.data';
import { DEFAULT_CELLS } from '../../core/data/cells.data';
import { Player } from '../../core/models/player.model';

type IconTab = 'emoji' | 'teams' | 'drivers';
type PinStep = 'idle' | 'entering';

@Component({
  selector: 'app-player-screen',
  standalone: true,
  imports: [FormsModule, AvatarComponent],
  templateUrl: './player-screen.html',
})
export class PlayerScreenComponent implements OnInit {
  private _data = inject(DataService);
  private _auth = inject(AuthService);
  private _router = inject(Router);

  readonly players = computed(() => this._data.getPlayersSorted());

  // ── Add player form ──
  newName = '';
  newPin = '';
  iconTab = signal<IconTab>('emoji');
  selEmoji = signal<string>(EMOJIS[0]);

  // ── Emoji picker ──
  readonly emojiCats = EMOJI_CATS;
  readonly teams = F1_TEAMS;
  readonly drivers = F1_DRIVERS;
  emojiDropOpen = signal(false);

  // ── PIN modal ──
  pinStep = signal<PinStep>('idle');
  pinDigits = signal<string[]>(['', '', '', '']);
  pinError = signal('');
  pendingPlayer = computed(() => {
    const id = this._auth.pendingId();
    return id ? this._data.getPlayer(id) : undefined;
  });

  async ngOnInit(): Promise<void> {
    await this._data.load();
  }

  // ── Icon tab ──
  setIconTab(tab: IconTab): void {
    this.iconTab.set(tab);
    this.emojiDropOpen.set(false);
  }

  selectEmoji(em: string): void {
    this.selEmoji.set(em);
    this.emojiDropOpen.set(false);
  }

  selectTeam(code: string): void { this.selEmoji.set(`[T]${code}`); }
  selectDriver(code: string, num: string): void { this.selEmoji.set(`[D]${code}${num}`); }

  toggleEmojiDrop(): void { this.emojiDropOpen.update(v => !v); }

  currentPureEmoji(): string {
    const e = this.selEmoji();
    return (e && !e.startsWith('[')) ? e : EMOJIS[0];
  }

  // ── Add player ──
  async addPlayer(): Promise<void> {
    if (!this.newName.trim()) { alert('Entrez un prénom'); return; }
    if (!/^\d{4}$/.test(this.newPin)) { alert('Le PIN doit être exactement 4 chiffres'); return; }

    const id = 'p' + Date.now();
    const player: Player = {
      id,
      name: this.newName.trim().slice(0, 20),
      emoji: this.selEmoji(),
      pin: this._auth.hashPin(this.newPin),
      checked: [],
      score: 0,
      lines: 0,
      doneLines: [],
      grid: JSON.parse(JSON.stringify(DEFAULT_CELLS)),
    };
    await this._data.updatePlayer(player);
    this.newName = '';
    this.newPin = '';
  }

  // ── PIN modal ──
  openPin(playerId: string): void {
    this._auth.setPending(playerId);
    this.pinDigits.set(['', '', '', '']);
    this.pinError.set('');
    this.pinStep.set('entering');
  }

  closePinModal(): void {
    this.pinStep.set('idle');
    this._auth.logout();
  }

  onPinDigit(event: Event, idx: number): void {
    const el = event.target as HTMLInputElement;
    const digits = [...this.pinDigits()];
    digits[idx] = el.value.slice(-1);
    this.pinDigits.set(digits);
    // auto-advance
    if (el.value && idx < 3) {
      const next = document.getElementById(`pd${idx + 2}`);
      next?.focus();
    }
  }

  onPinBackspace(event: KeyboardEvent, idx: number): void {
    if (event.key === 'Backspace' && !this.pinDigits()[idx] && idx > 0) {
      document.getElementById(`pd${idx}`)?.focus();
    }
    if (event.key === 'Enter') this.submitPin();
  }

  submitPin(): void {
    const pin = this.pinDigits().join('');
    if (pin.length !== 4) { this.pinError.set('Entrez 4 chiffres'); return; }
    const p = this.pendingPlayer();
    if (!p) return;
    if (this._auth.loginWithPin(pin, p)) {
      this.pinStep.set('idle');
      this._router.navigate(['/game', p.id]);
    } else {
      this.pinError.set('❌ PIN incorrect');
      this.pinDigits.set(['', '', '', '']);
      setTimeout(() => document.getElementById('pd1')?.focus(), 50);
    }
  }

  viewOnly(): void {
    const p = this.pendingPlayer();
    if (!p) return;
    this._auth.loginViewOnly(p.id);
    this.pinStep.set('idle');
    this._router.navigate(['/game', p.id]);
  }

  // ── Delete ──
  async deletePlayer(event: Event, id: string): Promise<void> {
    event.stopPropagation();
    const p = this._data.getPlayer(id);
    if (!p || !confirm(`Supprimer « ${p.name} » ?`)) return;
    await this._data.deletePlayer(id);
  }

  isSelectedTeam(code: string): boolean { return this.selEmoji() === `[T]${code}`; }
  isSelectedDriver(code: string, num: string): boolean { return this.selEmoji() === `[D]${code}${num}`; }
}
