import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found',
  imports: [RouterLink],
  templateUrl: './not-found.component.html',
  styleUrl: './not-found.component.scss'
})
// El título "Página no encontrada", el noindex y la ausencia de canonical los
// fija SeoService para cualquier ruta que no esté en su mapa.
export class NotFoundComponent {}
