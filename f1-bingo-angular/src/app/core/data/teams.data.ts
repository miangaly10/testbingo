import { F1Team } from '../models/f1.model';

const F1_LOGO = 'https://media.formula1.com/image/upload/c_fit,h_64/q_auto/v1740000000/common/f1';

export const F1_TEAMS: F1Team[] = [
  { code: 'RBR', name: 'Red Bull Racing', color: '#3671C6', logo: `${F1_LOGO}/2025/redbullracing/2025redbullracinglogowhite.webp` },
  { code: 'FER', name: 'Ferrari',          color: '#E8002D', logo: `${F1_LOGO}/2025/ferrari/2025ferrarilogolight.webp` },
  { code: 'MCL', name: 'McLaren',          color: '#FF8000', logo: `${F1_LOGO}/2025/mclaren/2025mclarenlogowhite.webp` },
  { code: 'MER', name: 'Mercedes',         color: '#27F4D2', logo: `${F1_LOGO}/2025/mercedes/2025mercedeslogowhite.webp` },
  { code: 'AST', name: 'Aston Martin',     color: '#229971', logo: `${F1_LOGO}/2025/astonmartin/2025astonmartinlogowhite.webp` },
  { code: 'ALP', name: 'Alpine',           color: '#FF87BC', logo: `${F1_LOGO}/2025/alpine/2025alpinelogowhite.webp` },
  { code: 'WIL', name: 'Williams',         color: '#64C4FF', logo: `${F1_LOGO}/2025/williams/2025williamslogowhite.webp` },
  { code: 'RB',  name: 'Racing Bulls',     color: '#6692FF', logo: `${F1_LOGO}/2025/racingbulls/2025racingbullslogowhite.webp` },
  { code: 'AUD', name: 'Audi',             color: '#FF0000', logo: `${F1_LOGO}/2026/audi/2026audilogowhite.webp` },
  { code: 'HAA', name: 'Haas',             color: '#B6BABD', logo: `${F1_LOGO}/2025/haas/2025haaslogowhite.webp` },
  { code: 'CAD', name: 'Cadillac',         color: '#CFB991', logo: `${F1_LOGO}/2026/cadillac/2026cadillaclogowhite.webp` },
];
