import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  // El panel se renderiza solo en el navegador: depende de la sesión del usuario.
  {
    path: 'admin',
    renderMode: RenderMode.Client
  },
  // La cancelación depende del código de la URL, así que también va en cliente.
  {
    path: 'cancelar',
    renderMode: RenderMode.Client
  },
  {
    path: '**',
    renderMode: RenderMode.Prerender
  }
];
