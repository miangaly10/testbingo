export type ProbLevel = 'ph' | 'pm' | 'pl' | '';

export interface Cell {
  id: number;
  col: number;
  text: string;
  tag: string;
  emoji: string;
  tc: string | null;   // team color hex
  prob: ProbLevel;
  pct: string;
  photo: string | null; // '[D]CODE##' | '[T]CODE' | null
}
