import { Component, input, output, signal, computed } from '@angular/core';
import { AvatarComponent } from '../../../shared/components/avatar/avatar.component';
import { EMOJI_CATS, EMOJIS } from '../../../core/data/emojis.data';
import { F1_TEAMS } from '../../../core/data/teams.data';
import { F1_DRIVERS } from '../../../core/data/drivers.data';

type Tab = 'emoji' | 'teams' | 'drivers';

@Component({
  selector: 'app-avatar-picker-modal',
  standalone: true,
  imports: [AvatarComponent],
  templateUrl: './avatar-picker-modal.html',
})
export class AvatarPickerModalComponent {
  visible = input(false);
  picked  = output<string>();
  cancel  = output<void>();

  tab          = signal<Tab>('emoji');
  selEmoji     = signal<string>(EMOJIS[0]);
  dropOpen     = signal(false);

  readonly emojiCats = EMOJI_CATS;
  readonly teams     = F1_TEAMS;
  readonly drivers   = F1_DRIVERS;

  pureEmoji = computed(() => {
    const e = this.selEmoji();
    return (e && !e.startsWith('[')) ? e : EMOJIS[0];
  });

  setTab(t: Tab): void { this.tab.set(t); this.dropOpen.set(false); }
  selectEmoji(em: string): void   { this.selEmoji.set(em); this.dropOpen.set(false); }
  selectTeam(code: string): void  { this.selEmoji.set(`[T]${code}`); }
  selectDriver(code: string, num: string): void { this.selEmoji.set(`[D]${code}${num}`); }
  toggleDrop(): void { this.dropOpen.update(v => !v); }

  isSelectedTeam(code: string): boolean { return this.selEmoji() === `[T]${code}`; }
  isSelectedDriver(code: string, num: string): boolean { return this.selEmoji() === `[D]${code}${num}`; }

  confirm(): void { this.picked.emit(this.selEmoji()); }
}
