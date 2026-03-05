import { Pipe, PipeTransform } from '@angular/core';
import { F1_DRIVERS } from '../../core/data/drivers.data';
import { F1_TEAMS } from '../../core/data/teams.data';

/** Transforms a photo token ('[D]CODENUM' or '[T]CODE') into the display info */
export type PhotoInfo =
  | { type: 'driver'; img: string; code: string }
  | { type: 'team'; logo: string; color: string; code: string }
  | null;

@Pipe({ name: 'cellPhotoInfo', standalone: true })
export class CellPhotoInfoPipe implements PipeTransform {
  transform(photo: string | null): PhotoInfo {
    if (!photo) return null;
    if (photo.startsWith('[D]')) {
      const rest = photo.slice(3);
      const code = rest.slice(0, 3);
      const num = rest.slice(3);
      const d = F1_DRIVERS.find(x => x.code === code && x.num === num);
      if (d) return { type: 'driver', img: d.img, code: d.code };
    }
    if (photo.startsWith('[T]')) {
      const code = photo.slice(3);
      const t = F1_TEAMS.find(x => x.code === code);
      if (t) return { type: 'team', logo: t.logo, color: t.color, code: t.code };
    }
    return null;
  }
}
