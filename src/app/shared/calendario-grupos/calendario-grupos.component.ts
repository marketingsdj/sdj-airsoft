import { Component, signal, computed, OnInit, Input, Output, EventEmitter, inject, HostListener, ElementRef } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { SlotsService } from '../../core/services/slots.service';

interface Slot {
  hora: string;
  horaFin: string;
  pista: string;
  reservada: boolean;
}

interface Dia {
  fecha: Date;
  esFinDeSemana: boolean;
  esFestivo: boolean;
  esDisponible: boolean;   // finde o festivo: abre para partidas abiertas
  esLaborable: boolean;    // entre semana no festivo: consulta para grupos +10
  esPasado: boolean;
  slots: Slot[];
}

@Component({
  selector: 'app-calendario-grupos',
  imports: [CommonModule],
  templateUrl: './calendario-grupos.component.html',
  styleUrl: './calendario-grupos.component.scss'
})
export class CalendarioGruposComponent implements OnInit {
  private slotsService = inject(SlotsService);

  @Input() modo: 'navegacion' | 'seleccion' = 'navegacion';
  @Input() mostrarSlots = true;
  // Doble partida: al elegir una franja se reserva también la siguiente
  // consecutiva en la misma pista (4 h de juego seguidas).
  @Input() doble = false;
  // Grupos de 10 o más: habilita los días laborables (entre semana) como reserva
  // "bajo consulta" — el cliente elige día y hora aproximada de llegada.
  @Input() permitirLaborables = false;
  // Texto opcional que explica la condición de los días "a consultar"
  // (p. ej. el mínimo de personas), mostrado junto a la leyenda del calendario.
  @Input() avisoLaborable = '';
  // Txikipaintball: abre también los viernes y usa horarios propios
  // (Viernes 16–20, Sábado/Domingo/festivo 9–18) en franjas de 2 h.
  @Input() txiki = false;
  @Output() slotSeleccionado = new EventEmitter<{ fecha: string; hora: string; horaFin: string; pista: string }>();
  @Output() fechaSeleccionada = new EventEmitter<string>();
  @Output() laborableSeleccionado = new EventEmitter<{ fecha: string; horaAprox: string }>();

  @Input() set preselect(v: { fecha: string; hora: string; pista?: string } | null) {
    if (v?.fecha) {
      this.mesActual.set(new Date(v.fecha + 'T00:00:00'));
      this.fechaSel.set(v.fecha);
      this.slotActivoKey.set(v.hora && v.pista ? `${v.fecha}_${v.hora}_${v.pista}` : null);
    }
  }

  // Festivos en los que el campo abre como un fin de semana (partidas abiertas).
  // Larrabetzu (Bizkaia). Lista mantenida hacia delante; los de finde ya están
  // disponibles, pero se listan todos para documentar el calendario completo.
  // 2027: nacionales fijos + Semana Santa + País Vasco/Bizkaia. Las sustituciones
  // autonómicas de 2027 son provisionales hasta el calendario vasco oficial.
  private readonly FESTIVOS = new Set<string>([
    // ── 2026 (oficial Bizkaia) ──
    '2026-07-25', // Santiago Apóstol
    '2026-07-31', // San Ignacio de Loyola (Bizkaia)
    '2026-08-15', // Asunción
    '2026-10-12', // Fiesta Nacional
    '2026-12-08', // Inmaculada
    '2026-12-25', // Navidad
    // ── 2027 (provisional) ──
    '2027-01-01', // Año Nuevo
    '2027-01-06', // Reyes
    '2027-03-25', // Jueves Santo (País Vasco)
    '2027-03-26', // Viernes Santo
    '2027-03-29', // Lunes de Pascua (País Vasco)
    '2027-05-01', // Día del Trabajo
    '2027-07-25', // Santiago Apóstol
    '2027-07-31', // San Ignacio de Loyola (Bizkaia)
    '2027-08-15', // Asunción
    '2027-10-12', // Fiesta Nacional
    '2027-11-01', // Todos los Santos
    '2027-12-06', // Constitución
    '2027-12-08', // Inmaculada
    '2027-12-25', // Navidad
  ]);

  // Franjas de 2 h desde la apertura (09:00) hasta el cierre (19:00). La doble
  // partida (4 h) junta dos consecutivas; la última doble válida es 15:00–19:00.
  private readonly SLOTS_BASE = [
    { hora: '09:00', horaFin: '11:00', pista: 'A' },
    { hora: '09:00', horaFin: '11:00', pista: 'B' },
    { hora: '11:00', horaFin: '13:00', pista: 'A' },
    { hora: '11:00', horaFin: '13:00', pista: 'B' },
    { hora: '13:00', horaFin: '15:00', pista: 'A' },
    { hora: '13:00', horaFin: '15:00', pista: 'B' },
    { hora: '15:00', horaFin: '17:00', pista: 'A' },
    { hora: '15:00', horaFin: '17:00', pista: 'B' },
    { hora: '17:00', horaFin: '19:00', pista: 'A' },
    { hora: '17:00', horaFin: '19:00', pista: 'B' },
  ];

  // Txikipaintball — Sábado, Domingo y festivos (09:00–18:00) en franjas de 2 h.
  private readonly SLOTS_TXIKI_FINDE = [
    { hora: '09:00', horaFin: '11:00', pista: 'A' },
    { hora: '09:00', horaFin: '11:00', pista: 'B' },
    { hora: '11:00', horaFin: '13:00', pista: 'A' },
    { hora: '11:00', horaFin: '13:00', pista: 'B' },
    { hora: '13:00', horaFin: '15:00', pista: 'A' },
    { hora: '13:00', horaFin: '15:00', pista: 'B' },
    { hora: '15:00', horaFin: '17:00', pista: 'A' },
    { hora: '15:00', horaFin: '17:00', pista: 'B' },
  ];

  // Txikipaintball — Viernes (16:00–20:00) en franjas de 2 h.
  private readonly SLOTS_TXIKI_VIERNES = [
    { hora: '16:00', horaFin: '18:00', pista: 'A' },
    { hora: '16:00', horaFin: '18:00', pista: 'B' },
    { hora: '18:00', horaFin: '20:00', pista: 'A' },
    { hora: '18:00', horaFin: '20:00', pista: 'B' },
  ];

  // Horas aproximadas de llegada para grupos +10 entre semana, cada media hora.
  // La sesión dura ~3 h (30' cambio+explicación + 2 h juego + 30' ducha) y se
  // cierra a las 19:00, así que la última llegada posible es a las 16:00.
  readonly HORAS_LLEGADA = [
    '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00',
    '13:30', '14:00', '14:30', '15:00', '15:30', '16:00',
  ];

  mesActual      = signal(new Date());
  fechaSel       = signal<string | null>(null);   // fecha del día elegido (YYYY-MM-DD)
  slotActivoKey  = signal<string | null>(null);
  horaAproxLaborable = signal<string>('');
  dropdownAbierto    = signal(false);

  private el = inject(ElementRef);

  semanas  = computed(() => this.generarMes(this.mesActual()));

  // El día seleccionado se DERIVA del mes en vivo (no se guarda una copia),
  // para que sus franjas reflejen siempre el estado de reservas más reciente
  // y nunca se pueda reservar sobre una franja ya ocupada.
  diaSeleccionado = computed<Dia | null>(() => {
    const f = this.fechaSel();
    if (!f) return null;
    for (const semana of this.semanas()) {
      const dia = semana.find(d => this.localFecha(d.fecha) === f);
      if (dia) return dia;
    }
    return null;
  });

  nombreMes = computed(() =>
    this.mesActual().toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })
  );

  constructor(private router: Router) {}

  ngOnInit() {
    // No pisar una fecha que ya viniera elegida (p. ej. al volver al paso 2).
    if (!this.fechaSel()) this.seleccionarProximoDisponible();
  }

  // Devuelve YYYY-MM-DD en hora local (evita el desfase UTC en zonas +N)
  private localFecha(d: Date): string {
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${d.getFullYear()}-${mm}-${dd}`;
  }

  // Preselecciona de verdad el primer día disponible (mismo camino que un
  // clic), para que lo que se ve en naranja sea una selección real y no solo
  // un resaltado visual sin avisar al formulario padre.
  private seleccionarProximoDisponible() {
    for (let offset = 0; offset <= 2; offset++) {
      const ref = new Date(this.mesActual());
      ref.setMonth(ref.getMonth() + offset);
      const semanas = this.generarMes(ref);
      for (const semana of semanas) {
        for (const dia of semana) {
          const seleccionable = dia.esDisponible && !dia.esPasado && dia.fecha.getMonth() === ref.getMonth()
            && (!this.mostrarSlots || this.slotDisponibles(dia) > 0);
          if (seleccionable) {
            if (offset > 0) this.mesActual.set(ref);
            this.seleccionarDia(dia);
            return;
          }
        }
      }
    }
  }

  mesAnterior() {
    const d = new Date(this.mesActual());
    d.setMonth(d.getMonth() - 1);
    this.mesActual.set(d);
    this.fechaSel.set(null);
  }

  mesSiguiente() {
    const d = new Date(this.mesActual());
    d.setMonth(d.getMonth() + 1);
    this.mesActual.set(d);
    this.fechaSel.set(null);
  }

  // ¿Se puede clicar este día? Finde/festivo (con franjas libres si aplica) o,
  // para grupos +10, también los laborables (bajo consulta).
  diaSeleccionable(dia: Dia): boolean {
    if (dia.esPasado || dia.fecha.getMonth() !== this.mesActual().getMonth()) return false;
    if (dia.esDisponible) return !this.mostrarSlots || this.slotDisponibles(dia) > 0;
    if (this.permitirLaborables && dia.esLaborable) return true;
    return false;
  }

  seleccionarDia(dia: Dia) {
    if (!this.diaSeleccionable(dia)) return;
    this.fechaSel.set(this.localFecha(dia.fecha));

    // Laborable (grupos +10, bajo consulta): no hay franjas, se pide hora aproximada.
    if (dia.esLaborable) {
      this.slotActivoKey.set(null);
      this.horaAproxLaborable.set('');
      this.dropdownAbierto.set(false);
      if (this.modo === 'seleccion') {
        this.laborableSeleccionado.emit({ fecha: this.localFecha(dia.fecha), horaAprox: '' });
      }
      return;
    }

    // Finde/festivo: avisamos al formulario en cuanto se elige el día (para
    // que salga del estado "laborable" aunque aún falte elegir una franja).
    if (this.modo === 'seleccion') {
      const fecha = this.localFecha(dia.fecha);
      this.slotActivoKey.set(this.mostrarSlots ? null : fecha);
      this.fechaSeleccionada.emit(fecha);
    }
  }

  // El cliente elige/cambia la hora aproximada de llegada (laborable consulta).
  onHoraAproxChange(hora: string) {
    this.horaAproxLaborable.set(hora);
    const dia = this.diaSeleccionado();
    if (dia) this.laborableSeleccionado.emit({ fecha: this.localFecha(dia.fecha), horaAprox: hora });
  }

  // Desplegable custom de hora aproximada (en vez del <select> nativo).
  toggleDropdown() {
    this.dropdownAbierto.update(v => !v);
  }

  seleccionarHora(hora: string) {
    this.onHoraAproxChange(hora);
    this.dropdownAbierto.set(false);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(ev: MouseEvent) {
    if (this.dropdownAbierto() && !this.el.nativeElement.contains(ev.target)) {
      this.dropdownAbierto.set(false);
    }
  }

  // La franja consecutiva en la misma pista (su hora de inicio = horaFin de esta).
  private franjaSiguiente(dia: Dia, slot: Slot): Slot | null {
    return dia.slots.find(s => s.pista === slot.pista && s.hora === slot.horaFin) ?? null;
  }

  // ¿Se puede EMPEZAR una selección en esta franja? En doble necesita una
  // consecutiva libre en la misma pista (la última del día no puede iniciar,
  // pero sí puede ser la segunda mitad de una doble que empieza antes).
  puedeIniciar(dia: Dia, slot: Slot): boolean {
    if (slot.reservada) return false;
    if (this.doble) {
      const siguiente = this.franjaSiguiente(dia, slot);
      return !!siguiente && !siguiente.reservada;
    }
    return true;
  }

  reservarSlot(dia: Dia, slot: Slot) {
    if (!this.puedeIniciar(dia, slot)) return;
    const fecha = this.localFecha(dia.fecha);
    const siguiente = this.doble ? this.franjaSiguiente(dia, slot) : null;
    const horaFin = siguiente ? siguiente.horaFin : slot.horaFin;
    if (this.modo === 'seleccion') {
      this.slotActivoKey.set(`${fecha}_${slot.hora}_${slot.pista}`);
      this.slotSeleccionado.emit({ fecha, hora: slot.hora, horaFin, pista: slot.pista });
    } else {
      this.router.navigate(['/reserva'], {
        queryParams: { tipo: 'privada', fecha, hora: slot.hora, pista: slot.pista, ...(this.doble ? { doble: 'true' } : {}) }
      });
    }
  }

  // La franja de inicio actualmente seleccionada dentro de este día (o null).
  private franjaInicioActiva(dia: Dia): Slot | null {
    const key = this.slotActivoKey();
    if (!key) return null;
    const [fecha, hora, pista] = key.split('_');
    if (fecha !== this.localFecha(dia.fecha)) return null;
    return dia.slots.find(s => s.hora === hora && s.pista === pista) ?? null;
  }

  slotEsActivo(dia: Dia, slot: Slot): boolean {
    const key = `${this.localFecha(dia.fecha)}_${slot.hora}_${slot.pista}`;
    if (this.slotActivoKey() === key) return true;
    // En doble, la franja consecutiva a la de inicio también se marca como activa.
    if (this.doble) {
      const inicio = this.franjaInicioActiva(dia);
      if (inicio && slot.pista === inicio.pista && slot.hora === inicio.horaFin) return true;
    }
    return false;
  }

  // Hora de fin a MOSTRAR. En doble, la 2ª franja del par (la consecutiva a la
  // de inicio) solo usa 1 h de sus 2 (la última es margen), así que se enseña
  // una hora menos: el total visible es 3 h, no 4.
  slotHoraFinMostrada(dia: Dia, slot: Slot): string {
    if (this.doble) {
      const inicio = this.franjaInicioActiva(dia);
      if (inicio && slot.pista === inicio.pista && slot.hora === inicio.horaFin) {
        const [h, m] = slot.horaFin.split(':').map(Number);
        return `${String(h - 1).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
      }
    }
    return slot.horaFin;
  }

  slotEstadoTexto(dia: Dia, slot: Slot): string {
    if (slot.reservada) return 'Reservado';
    if (this.modo === 'seleccion' && this.slotEsActivo(dia, slot)) return 'Seleccionado';
    if (this.doble && !this.puedeIniciar(dia, slot)) return 'No disponible';
    return this.modo === 'seleccion' ? 'Seleccionar' : 'Reservar →';
  }

  slotDisponibles(dia: Dia): number {
    if (this.doble) return dia.slots.filter(s => this.puedeIniciar(dia, s)).length;
    return dia.slots.filter(s => !s.reservada).length;
  }

  private generarMes(ref: Date): Dia[][] {
    const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
    const primerDia = new Date(ref.getFullYear(), ref.getMonth(), 1);
    const ultimoDia = new Date(ref.getFullYear(), ref.getMonth() + 1, 0);

    const inicio = new Date(primerDia);
    const diaSemana = (primerDia.getDay() + 6) % 7;
    inicio.setDate(inicio.getDate() - diaSemana);

    const dias: Dia[] = [];
    const cursor = new Date(inicio);

    while (cursor <= ultimoDia || dias.length % 7 !== 0) {
      const fecha = new Date(cursor);
      const dow = fecha.getDay();
      const esFinDeSemana = dow === 0 || dow === 6;
      const esViernes = dow === 5;
      const esFestivo = this.FESTIVOS.has(this.localFecha(fecha));
      // Txiki abre también los viernes; el resto solo finde/festivo.
      const esDisponible = this.txiki
        ? (esViernes || esFinDeSemana || esFestivo)
        : (esFinDeSemana || esFestivo);
      const esLaborable = !esDisponible;   // entre semana no festivo (consulta grupos +10 / txiki)
      const esPasado = fecha < hoy;
      const esEsteMes = fecha.getMonth() === ref.getMonth();

      const slotsBase = this.txiki
        ? (esViernes ? this.SLOTS_TXIKI_VIERNES : this.SLOTS_TXIKI_FINDE)
        : this.SLOTS_BASE;

      const slots: Slot[] = esDisponible && !esPasado && esEsteMes
        ? slotsBase.map(s => ({
            ...s,
            reservada: this.slotsService.bloqueados().includes(
              `${this.localFecha(fecha)}_${s.hora}_${s.pista}`
            )
          }))
        : [];

      dias.push({ fecha, esFinDeSemana, esFestivo, esDisponible, esLaborable, esPasado, slots });
      cursor.setDate(cursor.getDate() + 1);
    }

    const semanas: Dia[][] = [];
    for (let i = 0; i < dias.length; i += 7) semanas.push(dias.slice(i, i + 7));
    return semanas;
  }

  esMismaFecha(a: Date, b: Date) {
    return a.toDateString() === b.toDateString();
  }
}
