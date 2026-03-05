import {
  Component, input, output, signal, computed, effect
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Cell, ProbLevel } from '../../../core/models/cell.model';
import { EMOJI_CATS } from '../../../core/data/emojis.data';
import { F1_TEAMS } from '../../../core/data/teams.data';
import { F1_DRIVERS } from '../../../core/data/drivers.data';

type PhotoTab = 'drivers' | 'teams' | 'none';

@Component({
  selector: 'app-edit-cell-modal',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './edit-cell-modal.html',
})
export class EditCellModalComponent {
  cell    = input<Cell | null>(null);
  visible = input(false);

  saved    = output<Partial<Cell>>();
  cancelled = output<void>();

  // form fields
  text  = signal('');
  emoji = signal('😎');
  tag   = signal('');
  tc    = signal('');
  pct   = signal('');
  photo = signal('');
  prob  = signal<ProbLevel>('ph');

  emojiDropOpen = signal(false);
  photoTab      = signal<PhotoTab>('drivers');

  readonly emojiCats = EMOJI_CATS;
  readonly teams     = F1_TEAMS;
  readonly drivers   = F1_DRIVERS;

  previewText = computed(() => this.text().replace(/\n/g, '<br>'));

  constructor() {
    // Whenever the cell input changes, sync form fields
    effect(() => {
      const c = this.cell();
      if (!c) return;
      this.text.set(c.text);
      this.emoji.set(c.emoji);
      this.tag.set(c.tag);
      this.tc.set(c.tc ?? '');
      this.pct.set(c.pct);
      this.photo.set(c.photo ?? '');
      this.prob.set(c.prob || 'ph');
      this.emojiDropOpen.set(false);
      // Set initial photo tab from current photo
      if (c.photo?.startsWith('[T]')) this.photoTab.set('teams');
      else if (!c.photo) this.photoTab.set('none');
      else this.photoTab.set('drivers');
    });
  }

  pickProb(p: ProbLevel): void { this.prob.set(p); }
  setPhotoTab(t: PhotoTab): void { this.photoTab.set(t); if (t === 'none') this.photo.set(''); }
  selectPhoto(val: string): void { this.photo.set(val); }
  selectTeamPhoto(code: string, color: string): void {
    this.photo.set(`[T]${code}`);
    this.tc.set(color);
  }
  selectEmoji(em: string): void { this.emoji.set(em); this.emojiDropOpen.set(false); }
  toggleEmojiDrop(): void { this.emojiDropOpen.update(v => !v); }

  onColorPickerChange(e: Event): void {
    this.tc.set((e.target as HTMLInputElement).value);
  }
  onColorTextChange(v: string): void {
    this.tc.set(v);
  }
  clearColor(): void { this.tc.set(''); }

  isSelectedPhoto(val: string): boolean { return this.photo() === val; }

  onDriverImgError(e: Event, code: string, color: string): void {
    const img = e.target as HTMLElement;
    img.style.display = 'none';
    const fb = document.createElement('div');
    fb.style.cssText = `width:100%;height:100%;border-radius:6px;background:${color};display:flex;align-items:center;justify-content:center;font-family:'Barlow Condensed',sans-serif;font-size:8px;font-weight:900;color:#fff;letter-spacing:.5px`;
    fb.textContent = code;
    img.parentElement?.appendChild(fb);
  }

  save(): void {
    this.saved.emit({
      text:  this.text(),
      emoji: this.emoji(),
      tag:   this.tag().toUpperCase(),
      tc:    this.tc() || null,
      pct:   this.pct(),
      prob:  this.prob(),
      photo: this.photo() || null,
    });
  }

  cancel(): void {
    this.cancelled.emit();
  }
}
