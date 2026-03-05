import { Component, input, computed } from '@angular/core';
import { F1_TEAMS } from '../../../core/data/teams.data';
import { F1_DRIVERS } from '../../../core/data/drivers.data';
import { F1Team, F1Driver } from '../../../core/models/f1.model';

@Component({
  selector: 'app-avatar',
  template: `
    @if (isTeam()) {
      <div class="av-wrap" [style.width.px]="size()" [style.height.px]="size()"
           [style.background]="teamColor()" [style.borderRadius.px]="size() * 0.22">
        <img [src]="teamLogo()" [style.width.%]="90" [style.height.%]="90"
             style="object-fit:contain"
             [title]="teamName()"
             (error)="$any($event.target).style.display='none'" />
      </div>
    } @else if (isDriver()) {
      <div class="av-wrap av-driver" [style.width.px]="size()" [style.height.px]="size()"
           [style.borderRadius.px]="size() * 0.22">
        <img [src]="driverImg()" style="width:100%;height:100%;object-fit:cover"
             [title]="driverName()"
             (error)="$any($event.target).style.display='none'" />
      </div>
    } @else {
      <span [style.fontSize.px]="size() * 0.6">{{ emoji() }}</span>
    }
  `,
  styles: [`
    :host { display: inline-flex; align-items: center; justify-content: center; }
    .av-wrap { overflow: hidden; display: flex; align-items: center; justify-content: center; border: 1px solid rgba(255,255,255,.15); }
    .av-driver { position: relative; }
  `]
})
export class AvatarComponent {
  emoji = input<string>('🏎️');
  size = input<number>(36);

  isTeam  = computed(() => this.emoji().startsWith('[T]'));
  isDriver = computed(() => this.emoji().startsWith('[D]'));

  private _teamCode  = computed(() => this.emoji().slice(3));
  private _team      = computed(() => F1_TEAMS.find((t: F1Team) => t.code === this._teamCode()));
  teamColor = computed(() => this._team()?.color ?? '#333');
  teamLogo  = computed(() => this._team()?.logo ?? '');
  teamName  = computed(() => this._team()?.name ?? '');

  private _driverRest = computed(() => this.emoji().slice(3));
  private _driverCode = computed(() => this._driverRest().slice(0, 3));
  private _driverNum  = computed(() => this._driverRest().slice(3));
  private _driver     = computed(() => F1_DRIVERS.find((d: F1Driver) => d.code === this._driverCode() && d.num === this._driverNum()));
  driverImg  = computed(() => this._driver()?.img ?? '');
  driverName = computed(() => this._driver() ? `${this._driver()!.first} ${this._driver()!.last}` : '');
}
