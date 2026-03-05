import { Component, input, output, computed, signal } from '@angular/core';
import { Cell } from '../../../core/models/cell.model';
import { BingoCellComponent } from '../bingo-cell/bingo-cell';

@Component({
  selector: 'app-bingo-grid',
  standalone: true,
  imports: [BingoCellComponent],
  templateUrl: './bingo-grid.html',
})
export class BingoGridComponent {
  cells     = input.required<Cell[]>();
  checked   = input<Set<number>>(new Set());
  blines    = input<boolean[]>([]);
  editMode  = input(false);

  cellClicked  = output<number>(); // cell index
  cellsSwapped = output<{ a: number; b: number }>();

  private _dragSrc = signal<number | null>(null);

  readonly columns = [0, 1, 2, 3, 4]; // BINGO header letters B I N G O

  onCellClick(idx: number): void {
    this.cellClicked.emit(idx);
  }

  onDragStart(idx: number): void {
    this._dragSrc.set(idx);
  }

  onDropOn(targetIdx: number): void {
    const src = this._dragSrc();
    if (src !== null && src !== targetIdx) {
      this.cellsSwapped.emit({ a: src, b: targetIdx });
    }
    this._dragSrc.set(null);
  }
}
