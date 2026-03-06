import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { DialogComponent } from './shared/components/dialog/dialog.component';
import { ToastComponent } from './shared/components/toast/toast.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, DialogComponent, ToastComponent],
  template: `<canvas id="cfv"></canvas><router-outlet /><app-dialog /><app-toast />`
})
export class App {}
