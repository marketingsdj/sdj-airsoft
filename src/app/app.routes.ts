import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', loadComponent: () => import('./pages/home/home.component').then(m => m.HomeComponent) },
  { path: 'campo', loadComponent: () => import('./pages/campo/campo.component').then(m => m.CampoComponent) },
  { path: 'partidas', loadComponent: () => import('./pages/partidas/partidas.component').then(m => m.PartidasComponent) },
  { path: 'tarifas', loadComponent: () => import('./pages/tarifas/tarifas.component').then(m => m.TarifasComponent) },
  { path: 'eventos', loadComponent: () => import('./pages/eventos/eventos.component').then(m => m.EventosComponent) },
  { path: 'eventos/despedidas', loadComponent: () => import('./pages/eventos/despedidas/despedidas.component').then(m => m.DespedidasComponent) },
  { path: 'eventos/cumpleanos', loadComponent: () => import('./pages/eventos/cumpleanos/cumpleanos.component').then(m => m.CumpleanosComponent) },
  { path: 'eventos/empresas', loadComponent: () => import('./pages/eventos/empresas/empresas.component').then(m => m.EmpresasComponent) },
  { path: 'eventos/colectivos', loadComponent: () => import('./pages/eventos/colectivos/colectivos.component').then(m => m.ColectivosComponent) },
  { path: 'promos', loadComponent: () => import('./pages/promos/promos.component').then(m => m.PromosComponent) },
  { path: 'reserva', loadComponent: () => import('./pages/reserva/reserva.component').then(m => m.ReservaComponent) },
  { path: 'txikipaintball', loadComponent: () => import('./pages/txikipaintball/txikipaintball.component').then(m => m.TxikipaintballComponent) },
  { path: 'faq', loadComponent: () => import('./pages/faq/faq.component').then(m => m.FaqComponent) },
  { path: 'condiciones', loadComponent: () => import('./pages/condiciones/condiciones.component').then(m => m.CondicionesComponent) },
  { path: 'cookies', loadComponent: () => import('./pages/cookies/cookies.component').then(m => m.CookiesComponent) },
  { path: 'aviso-legal', loadComponent: () => import('./pages/aviso-legal/aviso-legal.component').then(m => m.AvisoLegalComponent) },
  { path: 'privacidad', loadComponent: () => import('./pages/privacidad/privacidad.component').then(m => m.PrivacidadComponent) },
  { path: '**', redirectTo: '' }
];
