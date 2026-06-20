import { Component, OnInit, OnDestroy, HostListener, signal, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { AnalyticsService } from '../../core/services/analytics.service';

@Component({
  selector: 'app-campo',
  imports: [RouterLink],
  templateUrl: './campo.component.html',
  styleUrl: './campo.component.scss'
})
export class CampoComponent implements OnInit, OnDestroy {
  private tiendaInterval: ReturnType<typeof setInterval> | null = null;
  mapaUrl: SafeResourceUrl;
  zonaActiva: number | null = null;
  zonaSeleccionada: any = null;
  puntoActivo: string | null = null;
  imagenActual = 0;
  constructor(sanitizer: DomSanitizer) {
    this.mapaUrl = sanitizer.bypassSecurityTrustResourceUrl(
      'https://maps.google.com/maps?q=Soldados+de+Juguete+Larrabetzu+Bizkaia&output=embed&hl=es&z=15&t=k'
    );
  }

  private analytics = inject(AnalyticsService);

  seleccionarZona(event: Event, zona: any) {
    event.stopPropagation();
    this.zonaSeleccionada = zona;
    this.zonaActiva = null;
    this.puntoActivo = null;
    this.imagenActual = 0;
    this.analytics.trackEvent('zona_mapa_click', { zona: zona.titulo });
  }

  cerrarZona(event: Event) {
    event.stopPropagation();
    this.zonaSeleccionada = null;
    this.puntoActivo = null;
    this.imagenActual = 0;
  }

  siguiente(event: Event) {
    event.stopPropagation();
    const total = this.zonaSeleccionada?.imagenes?.length ?? 1;
    this.imagenActual = (this.imagenActual + 1) % total;
    this.analytics.trackEvent('galeria_zona_imagen', { zona: this.zonaSeleccionada?.titulo, imagen: this.imagenActual + 1 });
  }

  anterior(event: Event) {
    event.stopPropagation();
    const total = this.zonaSeleccionada?.imagenes?.length ?? 1;
    this.imagenActual = (this.imagenActual - 1 + total) % total;
    this.analytics.trackEvent('galeria_zona_imagen', { zona: this.zonaSeleccionada?.titulo, imagen: this.imagenActual + 1 });
  }

  irA(event: Event, i: number) {
    event.stopPropagation();
    this.imagenActual = i;
  }

  get zonaHovered() {
    return this.zonas.find(z => z.id === this.zonaActiva) ?? null;
  }

  togglePunto(event: Event, id: string) {
    event.stopPropagation();
    this.puntoActivo = this.puntoActivo === id ? null : id;
  }

  zonas = [
    {
      id: 1, titulo: 'Aeropuerto', desc: 'Por definir.',
      rx: 15, ry: 21, rw: 26, rh: 26, side: 'right',
      imagenes: [
        'Campo/Mapa/Aeropuerto.svg',
        'Campo/Mapa/Aeropuerto_1.svg',
        'Campo/Mapa/Aeropuerto_2.svg',
        'Campo/Mapa/Aeropuerto_3.svg',
        'Campo/Mapa/Aeropuerto_4.svg',
        'Campo/Mapa/Aeropuerto_arsenal.svg',
        'Campo/Mapa/Aeropuerto_base_otam.svg',
      ],
    },
    {
      id: 2, titulo: 'Zona urbana', desc: 'Callejones y edificios. CQB, combate cercano. Emboscadas.',
      rx: 15, ry: 50, rw: 26, rh: 44, side: 'center',
      imagenes: [
        'Campo/Mapa/Zona_urbana.svg',
        'Campo/Mapa/Zona_urbana_1.svg',
        'Campo/Mapa/Zona_urbana_2.svg',
        'Campo/Mapa/Zona_urbana_banco.svg',
        'Campo/Mapa/Zona_urbana_farmacia.svg',
        'Campo/Mapa/Zona_urbana_hospital.svg',
        'Campo/Mapa/Zona_urbana_prisión.svg',
        'Campo/Mapa/Zona_urbana_comisaría.svg',
      ],
    },
    {
      id: 3, titulo: 'Castillo', desc: 'Estructuras de hormigón. Defensa y asalto.',
      rx: 49, ry: 6, rw: 26, rh: 31, side: 'right',
      imagenes: [
        'Campo/Mapa/Castillo.svg',
        'Campo/Mapa/Castillo_1.svg',
        'Campo/Mapa/Castillo_2.svg',
        'Campo/Mapa/Castillo_3.svg',
      ],
    },
    {
      id: 4, titulo: 'Base militar', desc: 'Por definir.',
      rx: 42, ry: 40, rw: 9, rh: 54, side: 'left',
      imagenes: [
        'Campo/Mapa/Base_militar.svg',
        'Campo/Mapa/Base_militar_1.svg',
        'Campo/Mapa/Base_militar_2.svg',
      ],
    },
    {
      id: 5, titulo: 'Zona cabrera', desc: 'Por definir.',
      rx: 52, ry: 40, rw: 23, rh: 54, side: 'left',
      imagenes: [
        'Campo/Mapa/Zona_cabrera.svg',
        'Campo/Mapa/Zona_cabrera_1.svg',
        'Campo/Mapa/Zona_cabrera_2.svg',
        'Campo/Mapa/Zona_cabrera_3.svg',
      ],
    },
    {
      id: 6, titulo: 'Refinería', desc: 'Por definir.',
      rx: 76, ry: 21, rw: 15, rh: 73, side: 'left',
      imagenes: [
        'Campo/Mapa/Refinería.svg',
        'Campo/Mapa/Refinería_1.svg',
        'Campo/Mapa/Refinería_2.svg',
      ],
    },
    {
      id: 7, titulo: 'Bosque Norte', desc: 'Terreno natural con cobertura densa. Posiciones elevadas. Francotiradores y defensas.',
      rx: 15, ry: 6, rw: 33, rh: 12, side: 'right',
      imagenes: [],
    },
  ];
  datosVisita = [
    { label: 'Dónde', valor: 'Larrabetzu, Barrio Legina (Bizkaia)' },
    { label: 'Horarios', valor: '9:00–18:00\nFines de semana y festivos' },
    { label: 'Duración', valor: 'Jornada completa' },
    { label: 'Qué traer', valor: 'Calzado deportivo y ropa de cambio' },
  ];

  modoActivo: string | null = null;
  toggleModo(nombre: string) {
    this.modoActivo = this.modoActivo === nombre ? null : nombre;
    if (this.modoActivo) this.analytics.trackEvent('modo_juego_click', { modo: nombre });
  }

  modos = [
    {
      nombre: 'Lanzamiento de Cohetes',
      desc: 'Encuentra los códigos, arma el lanzacohetes y defiende al artillero hasta el final.',
      img: 'Campo/Modos de juego/3.svg',
      objetivo: 'Acumular cohetes en los lanzacohetes',
      pasos: [
        'Busca los códigos en la Zona Urbana',
        'Introduce el código en el Arsenal de Refinería',
        'Traslada los cohetes a tu lanzacohetes',
        'Coge al Artillero y defiéndelo',
      ],
      victoria: 'Defiende a los artilleros y acumula más cohetes que el rival cuando acabe el tiempo.',
    },
    {
      nombre: 'Fuego de Artillería',
      desc: 'Asegura los proyectiles y lleva más munición a tu posición de artillería que el enemigo.',
      img: 'Campo/Modos de juego/5.svg',
      objetivo: 'Acumular proyectiles de artillería',
      pasos: [
        'Busca los códigos en Mezquita y alrededores',
        'Introduce el código en la Comisaría',
        'Recoge los proyectiles',
        'Trasládalos a tu posición de artillería',
      ],
      victoria: 'Acumula más proyectiles de artillería que el enemigo.',
    },
    {
      nombre: 'Sanitarios',
      desc: 'Recoge al herido, trátalo en el hospital y extráelo en helicóptero antes que el rival.',
      img: 'Campo/Modos de juego/7.svg',
      objetivo: 'Rescatar y extraer a un accidentado',
      pasos: [
        'Recoge al herido',
        'Trasládalo al hospital',
        'Cúralo con un botiquín (10 min de defensa)',
        'Lleva al herido estable hasta la camilla de extracción',
        'Defiende la extracción 10 minutos',
      ],
      victoria: 'Extrae al herido en el helicóptero.',
    },
    {
      nombre: 'Operación Extracción',
      desc: 'Tus espías están heridos tras las líneas enemigas. Rescátalos y sácalos en el convoy.',
      img: 'Campo/Modos de juego/9.svg',
      objetivo: 'Rescatar a los espías y extraerlos',
      pasos: [
        'Localiza y rescata a los espías',
        'Cúralos con botiquines',
        'Mételos en el blindado',
        'Lleva el convoy hasta el punto de extracción',
      ],
      victoria: 'Lleva el convoy completo hasta la extracción.',
    },
    {
      nombre: 'Detonación Doble',
      desc: 'Dos bombas, dos equipos. El primero en detonar las posiciones enemigas gana.',
      img: 'Campo/Modos de juego/11.svg',
      objetivo: 'Detonar las posiciones enemigas',
      pasos: [
        'Cada equipo tiene su bomba',
        'Avanza hasta las posiciones enemigas',
        'Detona antes que el rival',
      ],
      victoria: 'El equipo que detone las posiciones enemigas primero gana.',
    },
  ];

  normas = [
    { num: '01', norma: 'Es obligatorio llevar las gafas de protección puestas en todo momento dentro del campo.' },
    { num: '02', norma: 'El uso de máscara facial es obligatorio. En caso de no utilizarla, será siempre bajo la responsabilidad del jugador.' },
    { num: '03', norma: 'Los límites del campo están marcados mediante postes. Está prohibido traspasar las zonas delimitadas.' },
    { num: '04', norma: 'Queda prohibido saltar por ventanas o subirse a paredes, bidones, estructuras o elementos de atrezzo.' },
    { num: '05', norma: 'Las granadas deberán lanzarse siempre por debajo del hombro.', detalle: ['En interiores: eliminan a todos los jugadores de la habitación.', 'En exteriores: radio de eliminación de 3 metros.'] },
    { num: '06', norma: 'Potencias máximas permitidas:', detalle: ['Réplicas de asalto, subfusiles y secundarias: máximo 1,14 J (350 FPS con BB de 0,20 g).', 'Réplicas de francotirador: máximo 2,81 J (550 FPS con BB de 0,20 g).'] },
  ];

  normasJuego = [
    { num: '01', norma: 'Queda terminantemente prohibido faltar al respeto, increpar o generar conflictos con otros jugadores. Cualquier comunicación deberá hacerse siempre con educación y respeto.' },
    { num: '02', norma: 'Los jugadores eliminados no podrán transmitir información útil a sus compañeros ni interferir intencionadamente en la partida.' },
    { num: '03', norma: 'Está prohibido el uso de disparo automático o ráfaga en todas las réplicas, excepto en secundarias eléctricas autorizadas.' },
    { num: '04', norma: 'Al disparar desde cobertura, es obligatorio mostrar al menos un tercio del cuerpo. En las ventanas con cortina instalada, esta deberá apartarse para poder disparar.' },
  ];

  clasesArma = [
    {
      titulo: 'Réplicas de Asalto / Subfusiles / Secundarias',
      stats: [
        { label: 'Distancia mínima', valor: '0 m' },
        { label: 'Modo de disparo', valor: 'Semi únicamente' },
        { label: 'BB máximo', valor: '0,46 g' },
        { label: 'Energía máx.', valor: '1,14 J' },
      ]
    },
    {
      titulo: 'Francotirador / Sniper',
      stats: [
        { label: 'Distancia mínima', valor: '25 m' },
        { label: 'Modo de disparo', valor: 'Semi únicamente' },
        { label: 'BB máximo', valor: '0,48 g' },
        { label: 'Energía máx.', valor: '2,81 J' },
      ]
    },
  ];

  materialProhibido = ['DMR', 'Granadas metálicas y/o de fogueo', 'Apoyos'];
  materialPermitido = ['Granadas sónicas', 'Granadas de bolas (excepto modelos de detonación)'];

  faqsCampo = [
    { q: '¿Puedo ir a ver una partida sin jugar?', a: 'Sí, puedes venir como espectador. Hay zonas habilitadas para observar. Contacta antes para coordinar.' },
    { q: '¿Hay vestuarios y baños?', a: 'Sí. Vestuarios separados con taquillas y duchas calientes. Baños accesibles disponibles todo el día.' },
    { q: '¿Y si llevo gafas graduadas o soy daltónico?', a: 'Sin problema. Disponemos de protección compatible con gafas graduadas. El daltonismo no afecta al juego.' },
  ];

  normaAbierta = signal<string | null>(null);
  categoriaAbierta = signal<string | null>(null);

  toggleNorma(id: string) {
    this.normaAbierta.update(v => v === id ? null : id);
  }

  toggleCategoria(id: string) {
    this.categoriaAbierta.update(v => v === id ? null : id);
  }

  nosotrosAbierto = signal(false);

  hitos = [
    { year: '2008', titulo: 'Tienda Santutxu', desc: 'Todo empezó aquí. Un espacio creado por y para amantes del airsoft.' },
    { year: '2010', titulo: 'Campo Loiu', desc: 'Primer campo. Aprendimos que esto va de comunidad.' },
    { year: '2017', titulo: 'Tienda Zurbaranbarri', desc: 'La tienda crece y se traslada. La comunidad sigue creciendo.' },
    { year: '2021', titulo: 'Campo Larrabetzu', desc: '45.000 m². El campo que ves hoy. La familia SDJ.' },
  ];

  readonly Math = Math;
  modosPorPagina = this.calcModosPorPagina();
  modosPagina = 0;

  private calcModosPorPagina(): number {
    if (typeof window === 'undefined') return 4;
    if (window.innerWidth <= 600) return 1;
    if (window.innerWidth <= 880) return 2;
    return 4;
  }

  @HostListener('window:resize')
  onResize() {
    const nuevo = this.calcModosPorPagina();
    if (nuevo !== this.modosPorPagina) {
      this.modosPorPagina = nuevo;
      this.modosPagina = 0;
    }
  }

  get modosPaginados() {
    const start = this.modosPagina * this.modosPorPagina;
    return this.modos.slice(start, start + this.modosPorPagina);
  }
  get hayModosSiguientes() { return (this.modosPagina + 1) * this.modosPorPagina < this.modos.length; }
  get hayModosAnteriores() { return this.modosPagina > 0; }
  modosSiguiente() { if (this.hayModosSiguientes) this.modosPagina++; }
  modosAnterior() { if (this.hayModosAnteriores) this.modosPagina--; }

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

  servicios = [
    {
      eyebrow: 'APARCA Y OLVÍDATE.',
      titulo: 'Parking',
      img: 'Campo/Campo Instalaciones/Parking.svg',
      desc: 'Parking gratuito con capacidad amplia. Sin preocuparte de dónde dejar el coche.',
      detalle: ['Gratuito siempre', 'Capacidad para 80+ vehículos', 'Acceso directo al campo', 'Zona especial para discapacitados']
    },
    {
      eyebrow: 'COMER Y REPONER.',
      titulo: 'Cafetería',
      img: 'Campo/Campo Instalaciones/Cafeteria.svg',
      desc: 'Abierta durante toda la jornada de juego. Catering disponible para eventos privados.',
      detalle: ['Pintxos caseros', 'Carta El Barracón', 'Bebidas frías y calientes', 'Catering para eventos bajo petición']
    },
    {
      eyebrow: 'TE CAMBIAS Y LISTO.',
      titulo: 'Vestuarios',
      img: 'Campo/Campo Instalaciones/Vestuarios.svg',
      desc: 'Instalaciones completas para prepararte antes y después de la partida.',
      detalle: ['Vestuarios separados (H/M)', 'Taquillas con llave', 'Duchas individuales', 'Gel, toallas y secadores']
    },
  ];
}
