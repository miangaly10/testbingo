import { Component, input, output, computed } from '@angular/core';
import { Player } from '../../../core/models/player.model';
import { LineStatus } from '../../../core/services/game.service';
import { AvatarComponent } from '../../../shared/components/avatar/avatar.component';

const LINE_LABELS: Record<string, string> = {
  r0:'🔴 L1', r1:'🟠 L2', r2:'🟡 L3', r3:'🟢 L4', r4:'🔵 L5',
  c0:'B', c1:'I', c2:'N', c3:'G', c4:'O', d0:'↘', d1:'↙',
};

@Component({
  selector: 'app-player-bar',
  standalone: true,
  imports: [AvatarComponent],
  templateUrl: './player-bar.html',
})
export class PlayerBarComponent {
  player     = input.required<Player>();
  isOwner    = input(false);
  lineStatuses = input<LineStatus[]>([]);

  switchPlayer = output<void>();
  deletePlayer = output<void>();
  editName     = output<void>();

  checkedCount = computed(() => this.player().checked?.length ?? 0);

  lineLabel(id: string): string { return LINE_LABELS[id] ?? id; }
}
