import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AnalyticsService } from '../../core/services/analytics.service';

@Component({
  selector: 'app-promos',
  imports: [CommonModule],
  templateUrl: './promos.component.html',
  styleUrl: './promos.component.scss'
})
export class PromosComponent implements OnInit, OnDestroy {
  private analytics = inject(AnalyticsService);
  private tiendaInterval: ReturnType<typeof setInterval> | null = null;

  irA(id: string, e: Event) {
    e.preventDefault();
    const el = document.getElementById(id);
    if (!el) return;
    const offset = el.getBoundingClientRect().top + window.scrollY - 120;
    window.scrollTo(0, offset);
    this.analytics.trackEvent('promo_seccion_vista', { seccion: id });
  }

  // ── Carrusel tienda física (mismo que en campo) ──────────────────────────────
  tiendaActivo = 0;
  tiendaImagenes = [
    { src: 'Campo/Galeria sdj tienda/Tienda 1.svg', alt: 'Tienda SDJ' },
    { src: 'Campo/Galeria sdj tienda/Tienda  2.svg', alt: 'Tienda SDJ' },
    { src: 'Campo/Galeria sdj tienda/Tienda  3.svg', alt: 'Tienda SDJ' },
    { src: 'Campo/Galeria sdj tienda/Tienda  4.svg', alt: 'Tienda SDJ' },
    { src: 'Campo/Galeria sdj tienda/Tienda  5.svg', alt: 'Tienda SDJ' },
    { src: 'Campo/Galeria sdj tienda/Tienda  6.svg', alt: 'Tienda SDJ' },
    { src: 'Campo/Galeria sdj tienda/Tienda  7.svg', alt: 'Tienda SDJ' },
  ];

  tiendaSiguiente() { this.tiendaActivo = (this.tiendaActivo + 1) % this.tiendaImagenes.length; }
  tiendaAnterior() { this.tiendaActivo = (this.tiendaActivo - 1 + this.tiendaImagenes.length) % this.tiendaImagenes.length; }

  ngOnInit() {
    this.tiendaInterval = setInterval(() => this.tiendaSiguiente(), 5000);
  }

  ngOnDestroy() {
    if (this.tiendaInterval) clearInterval(this.tiendaInterval);
  }

  // ── Bonos (resumen + pop-up en móvil) ───────────────────────────────────────
  bonoAbierto = signal<number | null>(null);

  bonos = [
    {
      tag: 'Para el jugador con equipo alquilado',
      titulo: '3 Entradas Premium',
      precio: '99',
      ahorro: 'Ahorras un 30%',
      desc: 'Alquila equipamiento y juega tres veces. Bono nominativo, a tu nombre.',
      lista: ['Equipo premium incluido', 'Nominal e intransferible · Válido 12 meses'],
      notaHtml: 'Si ya has jugado —aunque tu primera visita no fuera en premium— solo <strong class="bono-card__nota-precio">54 €</strong> para completarlo.',
      aviso: 'Disponible en la tienda SDJ: pídelo al salir de tu partida o cualquier día que abramos.',
      condiciones: ['Consulta condiciones en mostrador'],
    },
    {
      tag: 'Para el jugador con equipo propio',
      titulo: 'Vale 10 SDJ',
      precio: '179',
      ahorro: 'Ahorras 20 € + parche SDJ',
      desc: 'Juega diez mañanas con tu propio equipo. Bono nominativo, a tu nombre.',
      lista: ['10 visitas de mañana con equipo propio — sueltas serían <s>199 €</s>', 'Nominal e intransferible · Válido 12 meses'],
      notaHtml: 'Al comprar el Vale 10: <strong>parche SDJ oficial</strong> para llevar en chaleco o uniforme.',
      aviso: 'Disponible en la tienda SDJ: pídelo al salir de tu partida o cualquier día que abramos.',
      condiciones: ['Pendiente de completar'],
    },
  ];

  abrirBono(i: number) {
    this.bonoAbierto.set(i);
    this.analytics.trackEvent('promo_bono_abierto', { bono: this.bonos[i].titulo });
  }
  cerrarBono() {
    this.bonoAbierto.set(null);
  }

  // ── Trae amigos (resumen + pop-up en móvil) ─────────────────────────────────
  amigoAbierto = signal<number | null>(null);

  traeAmigos = [
    {
      tag: 'Jugador con equipo + 1 amigo nuevo',
      titulo: 'Tu entrada baja a la mitad',
      tituloHtml: 'Tu entrada baja a la mitad',
      condiciones: ['Pendiente de completar'],
      lista: [
        '1 amigo que <strong>nunca haya jugado en SDJ</strong>',
        'Tu entrada es <strong class="promo-precio">reducida</strong>',
        'El amigo nuevo paga tarifa de alquiler estándar (39,90 €)',
      ],
      aviso: 'Díselo al llegar al mostrador. Sin trámites previos.',
    },
    {
      tag: 'Jugador que alquila + 3 amigos',
      titulo: 'Organiza la visita. Tú entras gratis.',
      tituloHtml: 'Organiza la visita.<br>Tú entras gratis.',
      condiciones: ['Pendiente de completar'],
      lista: [
        '3 amigos que pagan la entrada <strong>(39,90 € cada uno)</strong>',
        'Los 4 jugáis con <strong>equipo premium</strong> incluido',
        'Tu entrada es <strong class="promo-precio">gratuita</strong>',
      ],
      aviso: 'Díselo al llegar al mostrador. Sin trámites previos.',
    },
  ];

  abrirAmigo(i: number) {
    this.amigoAbierto.set(i);
    this.analytics.trackEvent('promo_amigo_abierto', { promo: this.traeAmigos[i].titulo });
  }
  cerrarAmigo() {
    this.amigoAbierto.set(null);
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
