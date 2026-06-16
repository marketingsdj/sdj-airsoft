import { Component, OnInit, OnDestroy, signal, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TxikiCarrusel } from '../../shared/txiki-carrusel/txiki-carrusel';
import { AnalyticsService } from '../../core/services/analytics.service';

@Component({
  selector: 'app-txikipaintball',
  imports: [RouterLink, TxikiCarrusel],
  templateUrl: './txikipaintball.component.html',
  styleUrl: './txikipaintball.component.scss'
})
export class TxikipaintballComponent implements OnInit, OnDestroy {
  private intervalo: ReturnType<typeof setInterval> | null = null;
  private analytics = inject(AnalyticsService);

  ngOnInit() {
    this.intervalo = setInterval(() => this.carruselSiguiente(), 5000);
    this.analytics.trackEvent('txikipaintball_visita');
  }

  ngOnDestroy() {
    if (this.intervalo) clearInterval(this.intervalo);
  }

  galeriaImagenes = [1,2,3,4,5,6,7,8,9,10,11,12,13];
  carruselActual = 0;
  fotoActiva = signal(0);
  testimonioActivo = signal(0);

  carruselSiguiente() {
    this.carruselActual = (this.carruselActual + 1) % this.galeriaImagenes.length;
  }
  carruselAnterior() {
    this.carruselActual = (this.carruselActual - 1 + this.galeriaImagenes.length) % this.galeriaImagenes.length;
  }
  fotoSiguiente() {
    this.fotoActiva.update(i => (i + 1) % this.galeriaImagenes.length);
  }
  fotoAnterior() {
    this.fotoActiva.update(i => (i - 1 + this.galeriaImagenes.length) % this.galeriaImagenes.length);
  }
  testimonioAnterior() {
    this.testimonioActivo.update(i => i === 0 ? this.testimonios.length - 1 : i - 1);
  }
  testimonioSiguiente() {
    this.testimonioActivo.update(i => (i + 1) % this.testimonios.length);
  }

  waUrl = `https://wa.me/34688731474?text=${encodeURIComponent('Hola! Me interesa reservar una actividad de Txikipaintball para niños.')}`;

  planes = [
    'Cumpleaños infantiles',
    'Celebraciones especiales',
    'Cuadrillas y amigos',
    'Equipos deportivos',
    'Actividades en grupo',
    'Fines de semana diferentes',
  ];

  beneficios = [
    'Equipamiento adaptado para menores',
    'Monitores durante toda la actividad',
    'Juegos organizados y supervisados',
    'Entorno familiar y seguro',
    'Experiencia pensada para iniciarse en el paintball infantil',
  ];

  cumpleaBeneficios = [
    'Actividad organizada',
    'Experiencia exclusiva para grupos',
    'Monitores pendientes de todo',
    'Opción de merienda',
    'Espacio amplio y seguro',
    'Recuerdos inolvidables',
  ];

  horarios = [
    { dia: 'Viernes',   horas: '16:00 — 20:00' },
    { dia: 'Sábados',   horas: '09:00 — 18:00' },
    { dia: 'Domingos',  horas: '09:00 — 18:00' },
  ];

  testimonios = [
    { texto: 'Los niños salieron encantados y no dejaron de hablar del cumpleaños en toda la semana.', autor: 'Familia García' },
    { texto: 'Muy bien organizado y los monitores súper atentos con los peques.', autor: 'Amaia L.' },
    { texto: 'Una experiencia diferente y muy segura. Repetiremos seguro.', autor: 'Jon M.' },
  ];

  meriendaIncluye = [
    'Pizza',
    'Nuggets con patatas fritas',
    'Refresco',
  ];

  tarifaIncluye = [
    'Munición ilimitada',
    'Equipamiento adaptado para menores',
    'Equipamiento completo',
    'Monitor durante toda la actividad',
    'Acceso a las zonas de juego',
    'Juegos organizados y supervisados',
    'Entorno familiar y seguro',
    'Experiencia pensada para iniciarse en el paintball infantil',
  ];
}
