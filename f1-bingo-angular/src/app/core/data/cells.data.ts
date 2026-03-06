import { Cell } from '../models/cell.model';
import { BingoLine } from '../models/f1.model';

export const DEFAULT_CELLS: Cell[] = [
  { id:  0, col: 0, text: '', tag: 'TEAM ORDERS',       emoji: '📣', tc: null, prob: 'ph', pct: '85%', photo: null },
  { id:  1, col: 1, text: '', tag: 'SURPRISE POLE',     emoji: '😱', tc: null, prob: 'pl', pct: '15%', photo: null },
  { id:  2, col: 2, text: '', tag: 'MIDFIELD SURPRISE', emoji: '🎰', tc: null, prob: 'pm', pct: '50%', photo: null },
  { id:  3, col: 3, text: '', tag: 'MELBOURNE DRAMA',   emoji: '💥', tc: null, prob: 'pm', pct: '60%', photo: null },
  { id:  4, col: 4, text: '', tag: 'EPIC COMEBACK',     emoji: '🚀', tc: null, prob: 'pm', pct: '45%', photo: null },
  { id:  5, col: 0, text: '', tag: 'WEATHER CHAOS',     emoji: '🌧️', tc: null, prob: 'pm', pct: '40%', photo: null },
  { id:  6, col: 1, text: '', tag: 'FIRST PODIUM',      emoji: '🥉', tc: null, prob: 'pl', pct: '20%', photo: null },
  { id:  7, col: 2, text: '', tag: 'ROOKIE MOMENT',     emoji: '🌀', tc: null, prob: 'ph', pct: '90%', photo: null },
  { id:  8, col: 3, text: '', tag: 'LAST LAP DRAMA',    emoji: '🔥', tc: null, prob: 'pm', pct: '55%', photo: null },
  { id:  9, col: 4, text: '', tag: 'MEME RADIO',        emoji: '📻', tc: null, prob: 'ph', pct: '95%', photo: null },
  { id: 10, col: 0, text: '', tag: 'TRACK LIMITS',      emoji: '⚠️', tc: null, prob: 'ph', pct: '95%', photo: null },
  { id: 11, col: 1, text: '', tag: 'LAP 1 CHAOS',       emoji: '🚩', tc: null, prob: 'ph', pct: '80%', photo: null },
  { id: 12, col: 2, text: '', tag: 'BAD RESTART',       emoji: '📉', tc: null, prob: 'pm', pct: '50%', photo: null },
  { id: 13, col: 3, text: '', tag: 'PIT STOP FAIL',     emoji: '🔧', tc: null, prob: 'ph', pct: '75%', photo: null },
  { id: 14, col: 4, text: '', tag: 'DOUBLE DNF',        emoji: '💀', tc: null, prob: 'pl', pct: '20%', photo: null },
  { id: 15, col: 0, text: '', tag: 'SPIN',              emoji: '🌀', tc: null, prob: 'ph', pct: '90%', photo: null },
  { id: 16, col: 1, text: '', tag: 'STRATEGY BLUNDER',  emoji: '📊', tc: null, prob: 'ph', pct: '85%', photo: null },
  { id: 17, col: 2, text: '', tag: '5s/10s PENALTY',    emoji: '⏱️', tc: null, prob: 'ph', pct: '90%', photo: null },
  { id: 18, col: 3, text: '', tag: 'DOUBLE PODIUM',     emoji: '🏆', tc: null, prob: 'ph', pct: '70%', photo: null },
  { id: 19, col: 4, text: '', tag: 'GRAND CHELEM',      emoji: '👑', tc: null, prob: 'pl', pct: '10%', photo: null },
  { id: 20, col: 0, text: '', tag: 'TEAMMATES COLLIDE', emoji: '💢', tc: null, prob: 'pl', pct: '15%', photo: null },
  { id: 21, col: 1, text: '', tag: 'OUTSIDER WIN',      emoji: '🎉', tc: null, prob: 'pl', pct: '10%', photo: null },
  { id: 22, col: 2, text: '', tag: 'SHOCK Q1 EXIT',     emoji: '💔', tc: null, prob: 'pm', pct: '45%', photo: null },
  { id: 23, col: 3, text: '', tag: 'RESERVE CALLED UP', emoji: '🔄', tc: null, prob: 'pl', pct: '10%', photo: null },
  { id: 24, col: 4, text: '', tag: 'WILD CARD',         emoji: '🃏', tc: null, prob: 'pm', pct: '40%', photo: null },
];

export const BINGO_LINES: BingoLine[] = [
  { id: 'r0', els: [0,1,2,3,4] },
  { id: 'r1', els: [5,6,7,8,9] },
  { id: 'r2', els: [10,11,12,13,14] },
  { id: 'r3', els: [15,16,17,18,19] },
  { id: 'r4', els: [20,21,22,23,24] },
  { id: 'c0', els: [0,5,10,15,20] },
  { id: 'c1', els: [1,6,11,16,21] },
  { id: 'c2', els: [2,7,12,17,22] },
  { id: 'c3', els: [3,8,13,18,23] },
  { id: 'c4', els: [4,9,14,19,24] },
  { id: 'd0', els: [0,6,12,18,24] },
  { id: 'd1', els: [4,8,12,16,20] },
];

export const SCORE_MAP: Record<string, number> = { ph: 10, pm: 10, pl: 10 };
