import { Cell } from './cell.model';

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
}
