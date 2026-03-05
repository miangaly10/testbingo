import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  {
    path: 'login',
    loadComponent: () =>
      import('./features/player-screen/player-screen').then(m => m.PlayerScreenComponent),
  },
  {
    path: 'game/:playerId',
    loadComponent: () =>
      import('./features/game/game').then(m => m.GameComponent),
  },
  { path: '**', redirectTo: 'login' },
];
