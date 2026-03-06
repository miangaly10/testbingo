import { Cell } from './cell.model';

export interface RaceResult {
  gp: string;
  score: number;
  lines: number;
  date: string;
}

export interface Player {
  id: string;
  name: string;
  emoji: string;
  pin: string;
  checked?: number[];
  checkedGp?: Record<number, number>; // cellIdx → index GP (0-23) au moment du coche
  score?: number;
  lines?: number;
  doneLines?: string[];
  grid: Cell[];
  history?: RaceResult[];
}
