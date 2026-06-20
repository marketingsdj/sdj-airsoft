import { Component, inject } from '@angular/core';
import { AnalyticsService } from '../../core/services/analytics.service';

@Component({
  selector: 'app-promos',
  imports: [],
  templateUrl: './promos.component.html',
  styleUrl: './promos.component.scss'
})
export class PromosComponent {
  private analytics = inject(AnalyticsService);

  irA(id: string, e: Event) {
    e.preventDefault();
    const el = document.getElementById(id);
    if (!el) return;
    const offset = el.getBoundingClientRect().top + window.scrollY - 120;
    window.scrollTo(0, offset);
    this.analytics.trackEvent('promo_seccion_vista', { seccion: id });
  }

  servicios = [
    {
      icono: '☕',
      eyebrow: 'CAFETERÍA',
      titulo: 'Comer y reponer.',
      desc: 'Abierta durante toda la jornada de juego. Catering disponible para eventos privados.',
      detalle: ['Bocadillos y pinchos', 'Raciones calientes', 'Bebidas frías y calientes', 'Catering para eventos bajo petición']
    },
    {
      icono: '🅿',
      eyebrow: 'PARKING',
      titulo: 'Aparca y olvídate.',
      desc: 'Parking gratuito con capacidad amplia directamente en el campo. Sin preocuparte de dónde dejar el coche.',
      detalle: ['Gratuito siempre', 'Capacidad para 80+ vehículos', 'Acceso directo al campo', 'Zona especial para autobuses y furgonetas']
    },
    {
      icono: '🚿',
      eyebrow: 'VESTUARIOS',
      titulo: 'Llegas con traje,<br>sales con barro.',
      desc: 'Instalaciones completas para prepararte antes y recuperarte después de la partida.',
      detalle: ['Vestuarios separados (H/M)', 'Taquillas con llave', 'Duchas calientes', 'Baños accesibles']
    },
  ];
}
