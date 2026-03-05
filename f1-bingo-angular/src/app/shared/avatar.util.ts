import { F1_TEAMS } from '../core/data/teams.data';
import { F1_DRIVERS } from '../core/data/drivers.data';

/** Returns an HTML string for the player avatar (emoji, team badge, or driver) */
export function renderAvatar(emoji: string, size = 36): string {
  if (emoji?.startsWith('[T]')) {
    const code = emoji.slice(3);
    const t = F1_TEAMS.find(x => x.code === code);
    if (t) {
      return `<div style="width:${size}px;height:${size}px;border-radius:8px;overflow:hidden;background:${t.color};display:flex;align-items:center;justify-content:center">
        <img src="${t.logo}" style="width:90%;height:90%;object-fit:contain"
          onerror="this.outerHTML='<span style=color:#fff;font-family:Russo One,sans-serif;font-size:${Math.max(8, size / 4)}px;font-weight:900;letter-spacing:1px>${t.code}</span>'" />
      </div>`;
    }
  }
  if (emoji?.startsWith('[D]')) {
    const rest = emoji.slice(3);
    const code = rest.slice(0, 3);
    const num = rest.slice(3);
    const d = F1_DRIVERS.find(x => x.code === code && x.num === num);
    if (d) {
      return `<div style="width:${size}px;height:${size}px;border-radius:8px;overflow:hidden;position:relative">
        <img src="${d.img}" style="width:100%;height:100%;object-fit:cover"
          onerror="this.parentElement.innerHTML='<div class=driver-badge style=background:${d.color};width:${size}px;height:${size}px;border-radius:8px><span class=d-num>${d.num}</span><span class=d-code>${d.code}</span></div>'" />
      </div>`;
    }
  }
  return emoji || '🏎️';
}

/** Returns the HTML for a cell's photo section */
export function renderCellPhoto(photo: string | null): string {
  if (!photo) return '';
  if (photo.startsWith('[D]')) {
    const rest = photo.slice(3);
    const code = rest.slice(0, 3);
    const num = rest.slice(3);
    const d = F1_DRIVERS.find(x => x.code === code && x.num === num);
    if (d) return `<img class="cell-photo" src="${d.img}" onerror="this.outerHTML='<span style=font-size:10px>${d.code}</span>'" />`;
  }
  if (photo.startsWith('[T]')) {
    const code = photo.slice(3);
    const t = F1_TEAMS.find(x => x.code === code);
    if (t) return `<div class="cell-team-logo" style="background:${t.color}">
      <img src="${t.logo}" style="width:90%;height:90%;object-fit:contain"
        onerror="this.outerHTML='<span style=color:#fff;font-family:Russo One,sans-serif;font-size:8px;font-weight:900>${t.code}</span>'" />
    </div>`;
  }
  return '';
}
