export interface F1Team {
  code: string;
  name: string;
  color: string;
  logo: string;
}

export interface F1Driver {
  num: string;
  code: string;
  first: string;
  last: string;
  team: string;
  color: string;
  img: string;
}

export interface EmojiCategory {
  cat: string;
  items: string[];
}

export interface BingoLine {
  id: string;
  els: number[];
}
