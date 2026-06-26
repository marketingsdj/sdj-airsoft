import { Component, signal, computed, inject } from '@angular/core';
import { AnalyticsService } from '../../core/services/analytics.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

interface Faq { q: string; a: string; open: boolean; }
interface Categoria { key: string; titulo: string; count: number; faqs: Faq[]; }

// Mapa de sinónimos / palabras clave
const SINONIMOS: Record<string, string[]> = {
  precio: ['cuánto', 'cuesta', 'coste', 'tarifa', 'dinero', 'euros', 'pagar', '€'],
  edad: ['años', 'menor', 'niño', 'niña', 'mínima', 'menores', 'tutor'],
  equipo: ['réplica', 'arma', 'material', 'gafas', 'chaleco', 'alquiler', 'traer'],
  duele: ['dolor', 'pica', 'bola', 'impacto', 'daño'],
  reserva: ['reservar', 'cita', 'apuntar', 'plaza', 'booking'],
  cancelar: ['cancelación', 'anular', 'devolución', 'reembolso'],
  parking: ['aparcar', 'coche', 'aparcamiento', 'donde dejo'],
  lluvia: ['llueve', 'tiempo', 'clima', 'mal tiempo', 'cancel'],
  grupo: ['amigos', 'cuadrilla', 'privada', 'empresa', 'cumple', 'despedida'],
  experiencia: ['primera vez', 'nunca', 'principiante', 'novato'],
  seguridad: ['peligroso', 'seguro', 'accidente', 'gafas', 'normas'],
};

@Component({
  selector: 'app-faq',
  imports: [FormsModule, CommonModule],
  templateUrl: './faq.component.html',
  styleUrl: './faq.component.scss'
})
export class FaqComponent {
  busqueda = '';
  busquedaActiva = false;
  categoriaActiva = signal('curiosos');
  sugerenciaSeleccionada = signal(-1);

  categorias: Categoria[] = [
    {
      key: 'curiosos', titulo: 'Para curiosos', count: 6,
      faqs: [
        { q: '¿Qué es exactamente el airsoft?', a: 'Un deporte de simulación con réplicas que disparan bolas biodegradables de 6mm. Se juega en equipos con objetivos reales. No es paintball: las bolas no manchan y el juego se basa en el honor (quien recibe un impacto lo reconoce y sale).', open: true },
        { q: '¿Duele cuando te dan?', a: 'Pica, sí. Como una goma elástica fuerte. El 90% no se siente. Con el equipo de protección adecuado (que está incluido en el alquiler) es perfectamente tolerable.', open: false },
        { q: '¿Necesito experiencia para venir?', a: 'Cero. La mayoría de la gente que viene es primera vez. Los monitores explican las reglas, el equipo y la dinámica antes de empezar. En 10 minutos estás listo.', open: false },
        { q: '¿Es legal?', a: 'Sí, totalmente regulado. Las réplicas de airsoft están clasificadas como juguetes / deporte. Necesitan seguir la normativa de FPS y edad mínima, que nosotros cumplimos estrictamente.', open: false },
        { q: '¿Qué edad mínima hay?', a: 'Para el campo de airsoft se requiere autorización de tutor para menores. Para Txikipaintball (la alternativa familiar) la edad mínima es inferior. Consulta directamente para tu caso concreto.', open: false },
        { q: '¿Es peligroso?', a: 'Es de los deportes más seguros: gafas homologadas obligatorias, FPS controlados, monitores siempre presentes. En 16 años de campo no hemos tenido ningún incidente grave.', open: false },
      ]
    },
    {
      key: 'antes', titulo: 'Antes de venir', count: 5,
      faqs: [
        { q: '¿Qué tengo que llevar?', a: 'Solo ropa de cambio y calzado deportivo cerrado para la partida. El equipo completo (réplica, gafas, chaleco, munición y uniforme) está disponible en alquiler por 20€ extra.', open: false },
        { q: '¿Hay que reservar con antelación?', a: 'Para partidas abiertas puedes venir sin reservar, aunque es recomendable para asegurar plaza. Para partidas privadas y eventos, sí es necesario contactar antes.', open: false },
        { q: '¿Puedo llevar mi propia réplica?', a: 'Sí, si ya tienes equipo propio. La réplica debe cumplir el límite de FPS del campo. La revisamos a la entrada.', open: false },
        { q: '¿Hay parking?', a: 'Sí, parking gratuito con capacidad para 80+ vehículos directamente en el campo. Hay zona especial para autobuses y furgonetas.', open: false },
        { q: '¿Y si llueve?', a: 'Jugamos con lluvia. El barro y el agua forman parte de la experiencia. Solo cancelamos en situaciones de riesgo real (tormenta eléctrica, alerta meteorológica).', open: false },
      ]
    },
    {
      key: 'campo', titulo: 'El campo y partidas', count: 5,
      faqs: [
        { q: '¿Cuánto dura una partida?', a: 'Una jornada completa dura entre 3 y 4 horas, con varias partidas cortas de 20-30 minutos. Las partidas privadas tienen duración personalizable.', open: false },
        { q: '¿Puedo ir a ver una partida sin jugar?', a: 'Sí. Hay zonas habilitadas para observadores. Contacta antes para coordinar la visita.', open: false },
        { q: '¿Cuántas zonas tiene el campo?', a: 'El campo tiene 45.000 m² con varias zonas diferenciadas: urbana, bosque, colina, bunkers y zona abierta. No todas se usan en cada partida.', open: false },
        { q: '¿Hay vestuarios con duchas?', a: 'Sí. Vestuarios separados (hombre/mujer) con taquillas con llave y duchas calientes. Baños accesibles disponibles.', open: false },
        { q: '¿Llevo gafas graduadas o soy daltónico?', a: 'Sin problema. Disponemos de protección compatible con gafas graduadas. El daltonismo no afecta al juego: los equipos se distinguen por brazaletes y posición, no por color.', open: false },
      ]
    },
    {
      key: 'grupos', titulo: 'Grupos y familias', count: 4,
      faqs: [
        { q: '¿A partir de cuántas personas tenemos campo exclusivo?', a: 'A partir de 8 personas tenéis el campo para vosotros solos, con monitor incluido y sin coste extra por la partida privada (solo pagáis las tarifas individuales de cada jugador).', open: false },
        { q: '¿Hacéis despedidas de soltero/a?', a: 'Sí, y son de las más épicas. Tenemos un modo especial "novix objetivo". Consulta el pack de despedidas en la página de Eventos.', open: false },
        { q: '¿Hacéis team building para empresas?', a: 'Sí. Actividad de cohesión sin powerpoints. Podemos adaptar los objetivos y modos de juego a lo que busca el equipo. Pide más info en Eventos.', open: false },
        { q: '¿Y para colectivos?', a: 'Sí, con supervisión y seguridad reforzada. El airsoft es una actividad deportiva reconocida. Contacta para los requisitos concretos según la edad del grupo.', open: false },
      ]
    },
    {
      key: 'pago', titulo: 'Pago y cancelación', count: 4,
      faqs: [
        { q: '¿Cómo se paga?', a: 'En el campo el día de la partida (efectivo o tarjeta). Para eventos privados puede requerirse una señal previa para confirmar la reserva.', open: false },
        { q: '¿Puedo cancelar?', a: 'Cancelación gratuita hasta 48h antes. Pasado ese plazo, si ya hay señal pagada, puede retenerse una parte según el caso.', open: false },
        { q: '¿Qué pasa si no aparezco sin avisar?', a: 'La plaza se libera para otros jugadores. Si ya habías pagado señal, no se devuelve.', open: false },
        { q: '¿Qué pasa si llueve y se cancela?', a: 'Solo cancelamos en situaciones de riesgo real. Si la cancelación es por nuestra parte, se reembolsa íntegramente o se reagenda sin coste.', open: false },
      ]
    },
  ];

  categoriaData = computed(() =>
    this.categorias.find(c => c.key === this.categoriaActiva()) ?? this.categorias[0]
  );

  private get todasFaqs() {
    return this.categorias.flatMap(c => c.faqs.map(f => ({ ...f, cat: c.titulo })));
  }

  private normalizar(txt: string): string {
    return txt.toLowerCase()
      .normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/[¿?¡!]/g, '');
  }

  private levenshtein(a: string, b: string): number {
    const m = a.length, n = b.length;
    const dp = Array.from({ length: m + 1 }, (_, i) =>
      Array.from({ length: n + 1 }, (_, j) => i === 0 ? j : j === 0 ? i : 0)
    );
    for (let i = 1; i <= m; i++)
      for (let j = 1; j <= n; j++)
        dp[i][j] = a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    return dp[m][n];
  }

  private tolerancia(len: number): number {
    if (len <= 3) return 0;
    if (len <= 6) return 1;
    return 2;
  }

  // Compara un término contra una palabra candidata (admite erratas)
  private coincidePalabra(termino: string, candidato: string): boolean {
    if (candidato.includes(termino)) return true;
    if (termino.length <= 2) return false;
    return this.levenshtein(termino, candidato) <= this.tolerancia(termino.length);
  }

  // Compara un término contra un texto completo (palabra a palabra)
  private coincideFuzzy(termino: string, texto: string): boolean {
    if (texto.includes(termino)) return true;
    if (termino.length <= 2) return false;
    return texto.split(/\s+/).some(p => this.coincidePalabra(termino, p));
  }

  private expandirTerminos(query: string): string[] {
    const norm = this.normalizar(query);
    const base = norm.split(/\s+/).filter(t => t.length > 1);
    const extra: string[] = [];
    for (const [key, syns] of Object.entries(SINONIMOS)) {
      const keyNorm = this.normalizar(key);
      const synsNorm = syns.map(s => this.normalizar(s));
      const coincide = base.some(t =>
        this.coincidePalabra(t, keyNorm) ||
        synsNorm.some(s => s.split(/\s+/).some(sw => this.coincidePalabra(t, sw)))
      );
      if (coincide) {
        extra.push(keyNorm, ...synsNorm);
      }
    }
    return [...new Set([...base, ...extra])];
  }

  get resultados() {
    const q = this.busqueda.trim();
    if (q.length < 2) return [];
    const terminos = this.expandirTerminos(q);
    return this.todasFaqs.filter(f => {
      const haystack = this.normalizar(f.q + ' ' + f.a);
      return terminos.some(t => this.coincideFuzzy(t, haystack));
    });
  }

  get sugerencias() {
    const q = this.busqueda.trim();
    if (q.length < 2) return [];
    const norm = this.normalizar(q);
    const terminos = norm.split(/\s+/).filter(t => t.length > 1);
    return this.todasFaqs
      .filter(f => terminos.some(t => this.coincideFuzzy(t, this.normalizar(f.q))))
      .map(f => f.q)
      .slice(0, 4);
  }

  private searchTimer: any;

  onBusqueda() {
    clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => {
      const q = this.busqueda.trim();
      if (q.length >= 3) {
        this.analytics.trackEvent('faq_busqueda', { termino: q });
      }
    }, 1000);
  }

  aplicarSugerencia(s: string) {
    this.busqueda = s;
    this.busquedaActiva = false;
    this.analytics.trackEvent('faq_busqueda', { termino: s });
  }

  limpiarBusqueda() {
    this.busqueda = '';
    this.busquedaActiva = false;
  }

  setCategoria(key: string) {
    this.categoriaActiva.set(key);
  }

  // Acordeón de categorías en móvil: a diferencia del sidebar de escritorio,
  // aquí sí se puede cerrar la categoría activa pulsándola otra vez.
  toggleCategoriaMobile(key: string) {
    this.categoriaActiva.set(this.categoriaActiva() === key ? '' : key);
  }

  private analytics = inject(AnalyticsService);

  toggle(faq: Faq) {
    faq.open = !faq.open;
    if (faq.open) {
      this.analytics.trackEvent('faq_pregunta_abierta', { pregunta: faq.q.slice(0, 60) });
    }
  }
}
