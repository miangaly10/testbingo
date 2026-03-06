import { Component, input, output, computed, inject, effect, OnDestroy } from '@angular/core';
import { DataService } from '../../../core/services/data.service';
import { AvatarComponent } from '../../../shared/components/avatar/avatar.component';

@Component({
  selector: 'app-scoreboard',
  standalone: true,
  imports: [AvatarComponent],
  template: `
    @if (visible()) {
      <div id="sbModal" class="show">
        <div class="sb-card">
          <div class="sb-title">🏆 Classement</div>
          <div id="sbList">
            @if (players().length === 0) {
              <div style="text-align:center;color:var(--muted);font-family:'Barlow Condensed',sans-serif;padding:20px">Aucun joueur</div>
            }
            @for (p of players(); track p.id; let i = $index) {
              <div class="sb-row">
                <div class="sb-rank" [class]="rankClass(i)">{{ rankEmoji(i) }}</div>
                <div style="font-size:20px;width:28px;display:flex;align-items:center;justify-content:center">
                  <app-avatar [emoji]="p.emoji" [size]="28" />
                </div>
                <div class="sb-name">{{ p.name }}<br>
                  <span class="sb-sub">{{ p.checked?.length ?? 0 }}/25 cochés · {{ p.lines ?? 0 }} lignes</span>
                </div>
                <div class="sb-pts">{{ p.score ?? 0 }}<span style="font-size:11px;color:var(--muted);font-family:'Barlow Condensed',sans-serif"> pts</span></div>
              </div>
            }
          </div>
          <div style="margin-top:20px;text-align:center">
            <button class="btn bs" (click)="close.emit()">Fermer</button>
          </div>
        </div>
      </div>
    }
  `
})
export class ScoreboardComponent implements OnDestroy {
  private _data   = inject(DataService);
  private _pollId: ReturnType<typeof setInterval> | null = null;

  visible = input(false);
  close   = output<void>();

  players = computed(() => this._data.getPlayersSorted());

  constructor() {
    effect(() => {
      if (this.visible()) {
        // Rafraîchir toutes les 15 s quand le classement est ouvert
        this._pollId = setInterval(() => this._data.load(), 15_000);
      } else {
        if (this._pollId) { clearInterval(this._pollId); this._pollId = null; }
      }
    });
  }

  ngOnDestroy(): void {
    if (this._pollId) clearInterval(this._pollId);
  }

  rankClass(i: number): string {
    return i === 0 ? 'sb-rank gold' : i === 1 ? 'sb-rank silver' : i === 2 ? 'sb-rank bronze' : 'sb-rank';
  }
  rankEmoji(i: number): string {
    return i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : String(i + 1);
  }
}
