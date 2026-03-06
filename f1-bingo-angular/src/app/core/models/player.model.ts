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
  score?: number;
  lines?: number;
  doneLines?: string[];
  grid: Cell[];
  history?: RaceResult[];
}
