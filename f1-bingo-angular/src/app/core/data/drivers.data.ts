import { F1Driver } from '../models/f1.model';

const BASE = 'https://media.formula1.com/image/upload/f_auto,c_limit,q_75,w_1320/content/dam/fom-website/drivers';

export const F1_DRIVERS: F1Driver[] = [
  { num: '3',  code: 'VER', first: 'Max',       last: 'Verstappen', team: 'RBR', color: '#3671C6', img: `${BASE}/M/MAXVER01_Max_Verstappen/maxver01.png` },
  { num: '20', code: 'HAD', first: 'Isack',     last: 'Hadjar',     team: 'RBR', color: '#3671C6', img: `${BASE}/I/ISAHAD01_Isack_Hadjar/isahad01.png` },
  { num: '16', code: 'LEC', first: 'Charles',   last: 'Leclerc',    team: 'FER', color: '#E8002D', img: `${BASE}/C/CHALEC01_Charles_Leclerc/chalec01.png` },
  { num: '44', code: 'HAM', first: 'Lewis',     last: 'Hamilton',   team: 'FER', color: '#E8002D', img: `${BASE}/L/LEWHAM01_Lewis_Hamilton/lewham01.png` },
  { num: '1',  code: 'NOR', first: 'Lando',     last: 'Norris',     team: 'MCL', color: '#FF8000', img: `${BASE}/L/LANNOR01_Lando_Norris/lannor01.png` },
  { num: '81', code: 'PIA', first: 'Oscar',     last: 'Piastri',    team: 'MCL', color: '#FF8000', img: `${BASE}/O/OSCPIA01_Oscar_Piastri/oscpia01.png` },
  { num: '63', code: 'RUS', first: 'George',    last: 'Russell',    team: 'MER', color: '#27F4D2', img: `${BASE}/G/GEORUS01_George_Russell/georus01.png` },
  { num: '12', code: 'ANT', first: 'Kimi',      last: 'Antonelli',  team: 'MER', color: '#27F4D2', img: `${BASE}/K/KIMANT01_Kimi_Antonelli/kimant01.png` },
  { num: '14', code: 'ALO', first: 'Fernando',  last: 'Alonso',     team: 'AST', color: '#229971', img: `${BASE}/F/FERALO01_Fernando_Alonso/feralo01.png` },
  { num: '18', code: 'STR', first: 'Lance',     last: 'Stroll',     team: 'AST', color: '#229971', img: `${BASE}/L/LANSTR01_Lance_Stroll/lanstr01.png` },
  { num: '10', code: 'GAS', first: 'Pierre',    last: 'Gasly',      team: 'ALP', color: '#FF87BC', img: `${BASE}/P/PIEGAS01_Pierre_Gasly/piegas01.png` },
  { num: '43', code: 'COL', first: 'Franco',    last: 'Colapinto',  team: 'ALP', color: '#FF87BC', img: `${BASE}/F/FRACOL01_Franco_Colapinto/fracol01.png` },
  { num: '23', code: 'ALB', first: 'Alexander', last: 'Albon',      team: 'WIL', color: '#64C4FF', img: `${BASE}/A/ALEALB01_Alexander_Albon/alealb01.png` },
  { num: '55', code: 'SAI', first: 'Carlos',    last: 'Sainz',      team: 'WIL', color: '#64C4FF', img: `${BASE}/C/CARSAI01_Carlos_Sainz/carsai01.png` },
  { num: '30', code: 'LAW', first: 'Liam',      last: 'Lawson',     team: 'RB',  color: '#6692FF', img: `${BASE}/L/LIALAW01_Liam_Lawson/lialaw01.png` },
  { num: '40', code: 'LIN', first: 'Arvid',     last: 'Lindblad',   team: 'RB',  color: '#6692FF', img: `${BASE}/A/ARVLIN01_Arvid_Lindblad/arvlin01.png` },
  { num: '27', code: 'HUL', first: 'Nico',      last: 'Hulkenberg', team: 'AUD', color: '#FF0000', img: `${BASE}/N/NICHUL01_Nico_Hulkenberg/nichul01.png` },
  { num: '5',  code: 'BOR', first: 'Gabriel',   last: 'Bortoleto',  team: 'AUD', color: '#FF0000', img: `${BASE}/G/GABBOR01_Gabriel_Bortoleto/gabbor01.png` },
  { num: '31', code: 'OCO', first: 'Esteban',   last: 'Ocon',       team: 'HAA', color: '#B6BABD', img: `${BASE}/E/ESTOCO01_Esteban_Ocon/estoco01.png` },
  { num: '87', code: 'BEA', first: 'Oliver',    last: 'Bearman',    team: 'HAA', color: '#B6BABD', img: `${BASE}/O/OLIBEA01_Oliver_Bearman/olibea01.png` },
  { num: '11', code: 'PER', first: 'Sergio',    last: 'Perez',      team: 'CAD', color: '#CFB991', img: `${BASE}/S/SERPER01_Sergio_Perez/serper01.png` },
  { num: '77', code: 'BOT', first: 'Valtteri',  last: 'Bottas',     team: 'CAD', color: '#CFB991', img: `${BASE}/V/VALBOT01_Valtteri_Bottas/valbot01.png` },
];
