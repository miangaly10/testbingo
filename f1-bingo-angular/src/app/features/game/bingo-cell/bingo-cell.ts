import {
  Component, input, output, signal, computed
} from '@angular/core';
import { Cell } from '../../../core/models/cell.model';
import { CellPhotoInfoPipe } from '../../../shared/pipes/cell-photo-info.pipe';

@Component({
  selector: 'app-bingo-cell',
  standalone: true,
  imports: [CellPhotoInfoPipe],
  templateUrl: './bingo-cell.html',
})
export class BingoCellComponent {
  cell      = input.required<Cell>();
  isChecked = input(false);
  isBline   = input(false);
  editMode  = input(false);

  cellClick  = output<void>();
  dragStarted = output<number>();  // emits cell index
  droppedOn   = output<number>();  // emits cell index

  isDragging  = signal(false);
  isDragOver  = signal(false);

  hostClass = computed(() => {
    const c = this.cell();
    const classes: string[] = [`cell col-${c.col}`];
    if (this.isChecked()) classes.push('checked');
    if (this.isBline())   classes.push('bline');
    if (this.editMode())  classes.push('drag-mode');
    if (this.isDragging()) classes.push('dragging');
    if (this.isDragOver()) classes.push('drag-over');
    return classes.join(' ');
  });

  onClick(): void {
    this.cellClick.emit();
  }

  onDragStart(e: DragEvent): void {
    if (!this.editMode()) return;
    this.isDragging.set(true);
    e.dataTransfer!.effectAllowed = 'move';
    this.dragStarted.emit(this.cell().id);
  }

  onDragEnd(): void {
    this.isDragging.set(false);
    this.isDragOver.set(false);
  }

  onDragOver(e: DragEvent): void {
    if (!this.editMode()) return;
    e.preventDefault();
    e.dataTransfer!.dropEffect = 'move';
    this.isDragOver.set(true);
  }

  onDragLeave(): void {
    this.isDragOver.set(false);
  }

  onDrop(e: DragEvent): void {
    e.preventDefault();
    this.isDragOver.set(false);
    this.droppedOn.emit(this.cell().id);
  }

  logoStyle(): string {
    const c = this.cell();
    return c.tc
      ? `background:${c.tc}22;border:1px solid ${c.tc}`
      : 'background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.08)';
  }

  textLines(): string {
    return this.cell().text.replace(/\n/g, '<br>');
  }
}
