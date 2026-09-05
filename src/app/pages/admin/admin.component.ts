import { Component, ElementRef, HostListener, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService, EstadoReserva, ReservaAdmin } from '../../core/services/admin.service';
import { CalendarioGruposComponent } from '../../shared/calendario-grupos/calendario-grupos.component';
import { ExtraordinariasService } from '../../core/services/extraordinarias.service';
import { EXTRA_CONFIG, EXTRA_DEFECTO, EXTRA_PRECIOS, ExtraTarifaTipo } from '../../core/data/partidas-extraordinarias';
import { PlantillasService } from '../../core/services/plantillas.service';
import { MARCADORES } from '../../core/data/plantillas-aviso';

type Orden = 'fecha' | 'creado' | 'nombre';

@Component({
  selector: 'app-admin',
  imports: [CommonModule, FormsModule, CalendarioGruposComponent],
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.scss',
})
export class AdminComponent implements OnInit {
  admin = inject(AdminService);

  // ── Sesión ──────────────────────────────────────────────────────────────────
  email = '';
  password = '';
  errorLogin = signal('');
  // Mostrar u ocultar la contraseña al escribirla.
  verPassword = signal(false);
  /** Recordar el email y mantener la sesión abierta en este equipo. */
  recordarme = true;
  entrando = signal(false);

  // ── Datos ───────────────────────────────────────────────────────────────────
  reservas = signal<ReservaAdmin[]>([]);
  cargando = signal(false);
  error = signal('');
  guardando = signal<string | null>(null);   // id de la reserva que se está actualizando
  detalle = signal<string | null>(null);     // id de la fila desplegada
  /** Códigos de las peticiones de cambio, por id de reserva. */
  private codigosCambio = new Map<string, { codigo: string; cambio: Record<string, unknown> }>();

  /**
   * Diferencias entre la reserva original del cliente y como está ahora,
   * para no perder de vista lo que pidió él.
   */
  cambiosSobreOriginal(r: ReservaAdmin): { campo: string; antes: string; ahora: string }[] {
    const o = r.original;
    if (!o) return [];
    const txt = (v: unknown) => Array.isArray(v) ? v.join(', ') : (v === null || v === undefined || v === '' ? '—' : String(v));
    const filas: { campo: string; antes: unknown; ahora: unknown }[] = [
      { campo: 'Tipo',     antes: o['tipo'],     ahora: r.tipo },
      { campo: 'Fecha',    antes: o['fecha'],    ahora: r.fecha },
      { campo: 'Hora',     antes: o['hora'],     ahora: r.hora },
      { campo: 'Pista',    antes: o['pista'],    ahora: r.pista },
      { campo: 'Personas', antes: o['personas'], ahora: r.personas },
      { campo: 'Nombre',   antes: o['nombre'],   ahora: r.nombre },
      { campo: 'Teléfono', antes: o['telefono'], ahora: r.telefono },
      { campo: 'Email',    antes: o['email'],    ahora: r.email },
      { campo: 'Extras',   antes: o['extras'],   ahora: r.extras },
    ];
    return filas
      .map(f => ({ campo: f.campo, antes: txt(f.antes), ahora: txt(f.ahora) }))
      .filter(f => f.antes !== f.ahora);
  }

  // ── Extras ──────────────────────────────────────────────────────────────────
  // Los mismos que puede contratar el cliente en la web, más un campo libre
  // para lo que no esté en la lista todavía.
  readonly extrasDisponibles = [
    'Hora extra de partida privada',
    'Tarifa reducida',
    'Menú (precio por confirmar)',
    'Merienda infantil (+9,90 €/niño)',
    'Pack Premium (+5 €)',
    'Mono rosa para el/la protagonista',
    'Camisetas por equipo',
    'Autorización en lote',
    'Certificado de la actividad',
  ];

  // Desplegables de extras (alta y edición), cerrados por defecto.
  extrasAbierto = signal(false);
  extrasAbiertoEdicion = signal(false);

  /** Resumen para el botón del desplegable. */
  resumenExtras(lista: string): string {
    const n = lista.split(',').map(e => e.trim()).filter(Boolean).length;
    if (!n) return 'Sin extras';
    return n === 1 ? '1 extra' : n + ' extras';
  }

  /** Marca o desmarca un extra en la lista separada por comas. */
  toggleExtra(lista: string, extra: string): string {
    const actuales = lista.split(',').map(e => e.trim()).filter(Boolean);
    const i = actuales.indexOf(extra);
    if (i >= 0) actuales.splice(i, 1);
    else actuales.push(extra);
    return actuales.join(', ');
  }

  tieneExtra(lista: string, extra: string): boolean {
    return lista.split(',').map(e => e.trim()).includes(extra);
  }

  // ── Edición de una reserva ──────────────────────────────────────────────────
  editando = signal<string | null>(null);
  edicion = {
    tipo: '', fecha: '', hora: '', pista: '', personas: 0,
    nombre: '', email: '', telefono: '', extras: '', notas: '',
  };
  calendarioEdicion = signal(false);

  editar(r: ReservaAdmin) {
    this.editando.set(r.id);
    this.calendarioEdicion.set(false);
    this.edicion = {
      tipo: r.tipo || 'privada',
      fecha: r.fecha || '',
      hora: r.hora || '',
      pista: r.pista || '',
      personas: r.personas || 1,
      nombre: r.nombre || '',
      email: r.email || '',
      telefono: r.telefono || '',
      extras: (r.extras || []).join(', '),
      notas: r.notas || '',
    };
  }

  cancelarEdicion() {
    this.editando.set(null);
    this.calendarioEdicion.set(false);
  }

  edicionSlot(ev: { fecha: string; hora: string; pista: string }) {
    this.edicion.fecha = ev.fecha;
    this.edicion.hora = ev.hora;
    this.edicion.pista = ev.pista;
    this.calendarioEdicion.set(false);
  }

  edicionLaborable(ev: { fecha: string; horaAprox: string }) {
    this.edicion.fecha = ev.fecha;
    this.edicion.hora = ev.horaAprox;
    this.edicion.pista = '';
    this.calendarioEdicion.set(false);
  }

  async guardarEdicion(r: ReservaAdmin) {
    this.guardando.set(r.id);
    this.error.set('');
    try {
      const datos = {
        tipo: this.edicion.tipo,
        fecha: this.edicion.fecha,
        hora: this.edicion.hora,
        pista: this.edicion.pista,
        personas: Number(this.edicion.personas) || 0,
        nombre: this.edicion.nombre.trim(),
        email: this.edicion.email.trim(),
        telefono: this.edicion.telefono.trim(),
        extras: this.edicion.extras.split(',').map(e => e.trim()).filter(Boolean),
        notas: this.edicion.notas.trim(),
      };
      await this.admin.actualizarReserva(r, datos);
      this.editando.set(null);
      await this.cargar();
    } catch {
      this.error.set('No se han podido guardar los cambios.');
    } finally {
      this.guardando.set(null);
    }
  }

  // ── Menu de ajustes ─────────────────────────────────────────────────────────
  // Agrupa lo que no se usa a diario: textos de los avisos, exportar y salir.
  ajustesAbierto = signal(false);
  private hostEl = inject(ElementRef);

  toggleAjustes() {
    this.ajustesAbierto.update(v => !v);
  }

  /** Cerrar el menu al clicar fuera. */
  @HostListener('document:click', ['$event'])
  onClickFuera(ev: MouseEvent) {
    if (!this.ajustesAbierto()) return;
    const menu = (this.hostEl.nativeElement as HTMLElement).querySelector('.admin-ajustes');
    if (menu && !menu.contains(ev.target as Node)) this.ajustesAbierto.set(false);
  }

  // ── Vista de calendario ─────────────────────────────────────────────────────
  // Todas las reservas repartidas por mes, dia y hora, para ver de un vistazo
  // como queda la agenda. No usa los filtros del listado: se ve todo (salvo lo
  // que este en la papelera).
  calendarioAbierto = signal(false);
  mesCalendario = signal(new Date());
  diaCalendario = signal<string | null>(null);

  /** Vista activa, como en Google Calendar: mes, semana o dia. */
  vistaCalendario = signal<'mes' | 'semana' | 'dia'>('mes');
  readonly VISTAS_CAL = [
    { key: 'mes' as const,    label: 'Mes' },
    { key: 'semana' as const, label: 'Semana' },
    { key: 'dia' as const,    label: 'Día' },
  ];

  /** Franjas horarias de la rejilla de semana y dia. */
  readonly HORAS_CAL = [
    '09:00', '10:00', '11:00', '12:00', '13:00', '14:00',
    '15:00', '16:00', '17:00', '18:00', '19:00', '20:00',
  ];

  cambiarVista(v: 'mes' | 'semana' | 'dia') {
    this.vistaCalendario.set(v);
  }

  /** Los 7 dias (lunes a domingo) de la semana del dia elegido. */
  semanaActual = computed(() => {
    const iso = this.diaCalendario() ?? this.isoLocal(new Date());
    const [a, m, d] = iso.split('-').map(Number);
    const ref = new Date(a, m - 1, d);
    const lunes = new Date(ref);
    lunes.setDate(lunes.getDate() - ((ref.getDay() + 6) % 7));
    const hoy = this.isoLocal(new Date());
    return Array.from({ length: 7 }, (_, i) => {
      const f = new Date(lunes);
      f.setDate(f.getDate() + i);
      const isoDia = this.isoLocal(f);
      return {
        iso: isoDia,
        hoy: isoDia === hoy,
        label: f.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric' }),
      };
    });
  });

  /** Reservas que empiezan en esa hora de ese dia. */
  reservasEn(iso: string, hora: string): ReservaAdmin[] {
    return this.reservasDelDia(iso).filter(r => (r.hora || '').slice(0, 2) === hora.slice(0, 2));
  }

  /** Las que no tienen hora fija (dias a consultar), para la fila de arriba. */
  reservasSinHora(iso: string): ReservaAdmin[] {
    return this.reservasDelDia(iso).filter(r => !r.hora);
  }

  /** Titulo del periodo que se esta viendo, segun la vista. */
  get periodoCalendarioLabel(): string {
    if (this.vistaCalendario() === 'mes') return this.mesCalendarioLabel;
    if (this.vistaCalendario() === 'dia') return this.fechaLarga(this.diaCalendario() ?? undefined);
    const sem = this.semanaActual();
    return `${sem[0].label} – ${sem[6].label}`;
  }

  /** ← y → mueven mes, semana o dia segun la vista activa. */
  moverCalendario(delta: number) {
    if (this.vistaCalendario() === 'mes') { this.cambiarMesCalendario(delta); return; }
    const paso = this.vistaCalendario() === 'semana' ? 7 : 1;
    const iso = this.diaCalendario() ?? this.isoLocal(new Date());
    const [a, m, d] = iso.split('-').map(Number);
    const f = new Date(a, m - 1, d);
    f.setDate(f.getDate() + delta * paso);
    this.diaCalendario.set(this.isoLocal(f));
    this.mesCalendario.set(new Date(f.getFullYear(), f.getMonth(), 1));
  }

  /** Pulsar un dia en la vista de mes lo abre en la vista de dia. */
  abrirDia(iso: string) {
    this.diaCalendario.set(iso);
    this.vistaCalendario.set('dia');
  }

  toggleCalendario() {
    const abrir = !this.calendarioAbierto();
    this.cerrarPaneles('calendario');
    this.calendarioAbierto.set(abrir);
    if (abrir) {
      this.mesCalendario.set(new Date());
      this.diaCalendario.set(this.isoLocal(new Date()));
      this.vistaCalendario.set('mes');
    }
    this.ajustesAbierto.set(false);
  }

  /** AAAA-MM-DD en hora local (evita el desfase de toISOString). */
  private isoLocal(d: Date): string {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  /** Reservas activas agrupadas por fecha, ordenadas por hora dentro del dia. */
  private porFecha = computed(() => {
    const mapa = new Map<string, ReservaAdmin[]>();
    for (const r of this.reservas()) {
      if (r.borrada || !r.fecha) continue;
      // Anuladas y canceladas no ocupan: no ensucian la agenda.
      if (r.estado === 'denegada' || r.estado === 'cancelada') continue;
      const lista = mapa.get(r.fecha) ?? [];
      lista.push(r);
      mapa.set(r.fecha, lista);
    }
    for (const lista of mapa.values()) {
      lista.sort((a, b) => (a.hora || '').localeCompare(b.hora || ''));
    }
    return mapa;
  });

  reservasDelDia(iso: string): ReservaAdmin[] {
    return this.porFecha().get(iso) ?? [];
  }

  personasDelDia(iso: string): number {
    return this.reservasDelDia(iso).reduce((n, r) => n + (r.personas || 0), 0);
  }

  /** Semanas del mes que se esta viendo, de lunes a domingo. */
  semanasCalendario = computed(() => {
    const ref = this.mesCalendario();
    const primero = new Date(ref.getFullYear(), ref.getMonth(), 1);
    // getDay(): 0 es domingo; la rejilla empieza en lunes.
    const desplaz = (primero.getDay() + 6) % 7;
    const inicio = new Date(primero);
    inicio.setDate(inicio.getDate() - desplaz);

    const semanas: { iso: string; dia: number; otroMes: boolean; hoy: boolean }[][] = [];
    const hoy = this.isoLocal(new Date());
    const cursor = new Date(inicio);
    for (let sem = 0; sem < 6; sem++) {
      const fila = [];
      for (let d = 0; d < 7; d++) {
        const iso = this.isoLocal(cursor);
        fila.push({
          iso,
          dia: cursor.getDate(),
          otroMes: cursor.getMonth() !== ref.getMonth(),
          hoy: iso === hoy,
        });
        cursor.setDate(cursor.getDate() + 1);
      }
      semanas.push(fila);
    }
    return semanas;
  });

  get mesCalendarioLabel(): string {
    const txt = this.mesCalendario().toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
    return txt.charAt(0).toUpperCase() + txt.slice(1);
  }

  cambiarMesCalendario(delta: number) {
    const d = new Date(this.mesCalendario());
    d.setMonth(d.getMonth() + delta);
    this.mesCalendario.set(d);
  }

  mesCalendarioHoy() {
    this.mesCalendario.set(new Date());
    this.diaCalendario.set(this.isoLocal(new Date()));
  }

  /** Reservas del dia elegido agrupadas por hora. Sin hora van en 'A consultar'. */
  horasDelDia = computed(() => {
    const iso = this.diaCalendario();
    if (!iso) return [];
    const grupos = new Map<string, ReservaAdmin[]>();
    for (const r of this.reservasDelDia(iso)) {
      const clave = r.hora || '';
      grupos.set(clave, [...(grupos.get(clave) ?? []), r]);
    }
    return [...grupos.entries()]
      .sort((a, b) => (a[0] || 'zz').localeCompare(b[0] || 'zz'))
      .map(([hora, reservas]) => ({
        hora: hora || 'Hora a consultar',
        reservas,
        personas: reservas.reduce((n, r) => n + (r.personas || 0), 0),
      }));
  });

  /** Salta a otro dia desde el selector de fecha del parte. */
  irADia(iso: string) {
    if (!iso) return;
    this.diaCalendario.set(iso);
    const [a, m] = iso.split('-').map(Number);
    this.mesCalendario.set(new Date(a, m - 1, 1));
  }

  /** Imprime el parte del dia (solo esa parte, no todo el panel). */
  imprimirDia() {
    document.body.classList.add('imprimiendo-dia');
    window.print();
    document.body.classList.remove('imprimiendo-dia');
  }

  /** Desde el calendario se salta a la ficha de esa reserva en el listado. */
  abrirDesdeCalendario(r: ReservaAdmin) {
    this.cerrarPaneles('detalle');
    this.detalle.set(r.id);
    setTimeout(() => document.getElementById('fila-' + r.id)?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 0);
  }

  // ── Borrar reservas y papelera ──────────────────────────────────────────────
  // Las anuladas o canceladas se pueden mandar a la papelera (siguen guardadas)
  // y desde ahi restaurarlas o borrarlas del todo.
  modoBorrado = signal(false);
  papeleraAbierta = signal(false);
  borrandoId = signal<string | null>(null);

  toggleModoBorrado() {
    this.modoBorrado.update(v => !v);
    this.ajustesAbierto.set(false);
  }

  togglePapelera() {
    const abrir = !this.papeleraAbierta();
    this.cerrarPaneles('papelera');
    this.papeleraAbierta.set(abrir);
    this.ajustesAbierto.set(false);
  }

  /** Solo se pueden borrar las que ya no estan en juego. */
  sePuedeBorrar(r: ReservaAdmin): boolean {
    return r.estado === 'denegada' || r.estado === 'cancelada';
  }

  papelera = computed(() => this.reservas().filter(r => r.borrada));

  async aPapelera(r: ReservaAdmin) {
    if (!this.sePuedeBorrar(r)) return;
    this.borrandoId.set(r.id);
    try {
      await this.admin.marcarBorrada(r.id, true);
      this.reservas.update(list => list.map(x => (x.id === r.id ? { ...x, borrada: true } : x)));
      if (this.detalle() === r.id) this.detalle.set(null);
    } catch {
      this.error.set('No se ha podido mover a la papelera.');
    } finally {
      this.borrandoId.set(null);
    }
  }

  async restaurarDePapelera(r: ReservaAdmin) {
    this.borrandoId.set(r.id);
    try {
      await this.admin.marcarBorrada(r.id, false);
      this.reservas.update(list => list.map(x => (x.id === r.id ? { ...x, borrada: false } : x)));
    } catch {
      this.error.set('No se ha podido restaurar.');
    } finally {
      this.borrandoId.set(null);
    }
  }

  /** Borrado definitivo: pide confirmacion porque no tiene vuelta atras. */
  async borrarDefinitivo(r: ReservaAdmin) {
    const quien = r.nombre || r.numeroReserva || 'esta reserva';
    if (!confirm(`Vas a borrar ${quien} para siempre. Esta accion no se puede deshacer. ¿Seguimos?`)) return;
    this.borrandoId.set(r.id);
    try {
      await this.admin.eliminarReserva(r.id);
      this.reservas.update(list => list.filter(x => x.id !== r.id));
    } catch {
      this.error.set('No se ha podido borrar la reserva.');
    } finally {
      this.borrandoId.set(null);
    }
  }

  // ── Textos de los avisos ────────────────────────────────────────────────────
  // Las plantillas de los mensajes al cliente se editan desde aquí, sin tocar
  // el código. Lo guardado manda sobre el texto de fábrica.
  plantillas = inject(PlantillasService);
  readonly MARCADORES = MARCADORES;
  textosAbierto = signal(false);
  guardandoTexto = signal<string | null>(null);
  /** Motivo cuya plantilla estás editando (o null). */
  textoEditandoMotivo = signal<string | null>(null);
  borradorTexto = '';

  /** Todos los textos editables: los motivos del aviso más el asunto del correo. */
  get textosEditables(): { key: string; label: string }[] {
    return [...this.motivos.map(m => ({ key: m.key, label: m.label })),
      { key: 'asunto', label: 'Asunto del correo' }];
  }

  toggleTextos() {
    const abrir = !this.textosAbierto();
    this.cerrarPaneles('textos');
    this.textosAbierto.set(abrir);
    this.ajustesAbierto.set(false);
  }

  editarTexto(motivo: string) {
    if (this.textoEditandoMotivo() === motivo) { this.textoEditandoMotivo.set(null); return; }
    this.borradorTexto = this.plantillas.texto(motivo);
    this.textoEditandoMotivo.set(motivo);
  }

  async guardarTexto(motivo: string) {
    this.guardandoTexto.set(motivo);
    this.error.set('');
    try {
      await this.plantillas.guardar(motivo, this.borradorTexto);
      this.textoEditandoMotivo.set(null);
    } catch {
      this.error.set('No se ha podido guardar el texto.');
    } finally {
      this.guardandoTexto.set(null);
    }
  }

  async restaurarTexto(motivo: string) {
    this.guardandoTexto.set(motivo);
    this.error.set('');
    try {
      await this.plantillas.restaurar(motivo);
      if (this.textoEditandoMotivo() === motivo) this.borradorTexto = this.plantillas.original(motivo);
    } catch {
      this.error.set('No se ha podido restaurar el texto.');
    } finally {
      this.guardandoTexto.set(null);
    }
  }

  // ── Partidas extraordinarias ────────────────────────────────────────────────
  // Socios gratis. El horario por defecto es la tarde (16:00–20:00) con tarifa
  // reducida, pero cada fecha puede llevar el suyo y la tarifa normal.
  extras = inject(ExtraordinariasService);
  readonly EXTRA_HORARIO = EXTRA_CONFIG.horaLabel;
  readonly EXTRA_PRECIO = EXTRA_CONFIG.precioNoSocio.toFixed(2).replace('.', ',');
  readonly EXTRA_TARIFAS = [
    { key: 'reducida' as ExtraTarifaTipo, label: 'Reducida' },
    { key: 'normal'   as ExtraTarifaTipo, label: 'Normal' },
  ];

  extraFecha = '';
  extraTarifa: ExtraTarifaTipo = EXTRA_DEFECTO.tarifa;
  extraHoraInicio = EXTRA_DEFECTO.horaInicio;
  extraHoraFin = EXTRA_DEFECTO.horaFin;
  extraAbierto = signal(false);
  guardandoExtra = signal(false);

  // Fecha que se está editando en la lista (o null si no hay ninguna).
  extraEditando = signal<string | null>(null);
  edicionExtra = { tarifa: EXTRA_DEFECTO.tarifa as ExtraTarifaTipo, horaInicio: '', horaFin: '' };

  /** Precios por persona de una tarifa, para enseñarlos en el panel. */
  extraPreciosLabel(tarifa: ExtraTarifaTipo): string {
    const p = EXTRA_PRECIOS[tarifa];
    const f = (n: number) => n.toFixed(2).replace('.', ',');
    return `socios gratis · propio ${f(p.propio)} € · alquiler ${f(p.alquiler)} € · premium ${f(p.premium)} €`;
  }

  extraTarifaLabel(tarifa: ExtraTarifaTipo): string {
    return this.EXTRA_TARIFAS.find(t => t.key === tarifa)?.label ?? tarifa;
  }

  async abrirExtraordinaria() {
    if (!this.extraFecha) return;
    if (this.extraHoraFin <= this.extraHoraInicio) {
      this.error.set('La hora de fin tiene que ser posterior a la de inicio.');
      return;
    }
    this.guardandoExtra.set(true);
    this.error.set('');
    try {
      await this.extras.abrir(this.extraFecha, {
        tarifa: this.extraTarifa,
        horaInicio: this.extraHoraInicio,
        horaFin: this.extraHoraFin,
      });
      this.extraFecha = '';
      this.extraTarifa = EXTRA_DEFECTO.tarifa;
      this.extraHoraInicio = EXTRA_DEFECTO.horaInicio;
      this.extraHoraFin = EXTRA_DEFECTO.horaFin;
    } catch {
      this.error.set('No se ha podido abrir la partida extraordinaria.');
    } finally {
      this.guardandoExtra.set(false);
    }
  }

  /** Abre el editor de una fecha ya publicada, con sus valores actuales. */
  editarExtraordinaria(fecha: string) {
    if (this.extraEditando() === fecha) { this.extraEditando.set(null); return; }
    const d = this.extras.dia(fecha);
    this.edicionExtra = { tarifa: d.tarifa, horaInicio: d.horaInicio, horaFin: d.horaFin };
    this.extraEditando.set(fecha);
  }

  async guardarExtraordinaria(fecha: string) {
    if (this.edicionExtra.horaFin <= this.edicionExtra.horaInicio) {
      this.error.set('La hora de fin tiene que ser posterior a la de inicio.');
      return;
    }
    this.guardandoExtra.set(true);
    this.error.set('');
    try {
      await this.extras.guardar(fecha, { ...this.edicionExtra });
      this.extraEditando.set(null);
    } catch {
      this.error.set('No se han podido guardar los cambios de la partida extraordinaria.');
    } finally {
      this.guardandoExtra.set(false);
    }
  }

  async quitarExtraordinaria(fecha: string) {
    this.guardandoExtra.set(true);
    try {
      await this.extras.quitar(fecha);
    } catch {
      this.error.set('No se ha podido quitar. Si la escribiste en el código, hay que borrarla ahí.');
    } finally {
      this.guardandoExtra.set(false);
    }
  }

  // ── Alta manual ─────────────────────────────────────────────────────────────
  nuevaAbierta = signal(false);
  creando = signal(false);
  nueva = {
    tipo: 'privada', fecha: '', hora: '', pista: '', personas: 8,
    nombre: '', email: '', telefono: '', extras: '', notas: '', laborable: false,
  };

  /**
   * Solo un apartado abierto a la vez: al abrir uno se cierran los demas
   * (alta manual, partidas extraordinarias y la reserva desplegada), para no
   * dejar paneles a medias por el camino.
   */
  private cerrarPaneles(salvo: 'nueva' | 'extra' | 'detalle' | 'textos' | 'papelera' | 'calendario') {
    if (salvo !== 'nueva') this.nuevaAbierta.set(false);
    if (salvo !== 'extra') { this.extraAbierto.set(false); this.extraEditando.set(null); }
    if (salvo !== 'textos') { this.textosAbierto.set(false); this.textoEditandoMotivo.set(null); }
    if (salvo !== 'papelera') this.papeleraAbierta.set(false);
    if (salvo !== 'calendario' && salvo !== 'detalle') this.calendarioAbierto.set(false);
    if (salvo !== 'detalle') { this.detalle.set(null); this.editando.set(null); }
  }

  /** Abre o cierra el apartado de partidas extraordinarias. */
  toggleExtraordinarias() {
    const abrir = !this.extraAbierto();
    this.cerrarPaneles('extra');
    this.extraAbierto.set(abrir);
    if (!abrir) this.extraEditando.set(null);
  }

  abrirNueva() {
    this.cerrarPaneles('nueva');
    this.nuevaAbierta.set(true);
    this.nueva = {
      tipo: 'privada', fecha: '', hora: '', pista: '', personas: 8,
      nombre: '', email: '', telefono: '', extras: '', notas: '', laborable: false,
    };
  }

  nuevoSlot(ev: { fecha: string; hora: string; pista: string }) {
    this.nueva.fecha = ev.fecha;
    this.nueva.hora = ev.hora;
    this.nueva.pista = ev.pista;
    this.nueva.laborable = false;
  }

  nuevoLaborable(ev: { fecha: string; horaAprox: string }) {
    this.nueva.fecha = ev.fecha;
    this.nueva.hora = ev.horaAprox;
    this.nueva.pista = '';
    this.nueva.laborable = true;
  }

  get nuevaValida(): boolean {
    return !!this.nueva.fecha && !!this.nueva.nombre.trim();
  }

  async guardarNueva() {
    if (!this.nuevaValida) return;
    this.creando.set(true);
    this.error.set('');
    try {
      await this.admin.crearReserva({
        tipo: this.nueva.tipo,
        fecha: this.nueva.fecha,
        hora: this.nueva.hora,
        pista: this.nueva.pista,
        personas: this.nueva.personas,
        nombre: this.nueva.nombre.trim(),
        email: this.nueva.email.trim(),
        telefono: this.nueva.telefono.trim(),
        extras: this.nueva.extras.split(',').map(e => e.trim()).filter(Boolean),
        laborable: this.nueva.laborable,
        notas: this.nueva.notas.trim(),
      });
      this.nuevaAbierta.set(false);
      await this.cargar();
    } catch {
      this.error.set('No se ha podido crear la reserva.');
    } finally {
      this.creando.set(false);
    }
  }

  // ── Filtros ─────────────────────────────────────────────────────────────────
  busqueda = '';                       // nombre, email, teléfono o nº de reserva
  filtroEstado = '';
  filtroTipo = '';
  desde = '';
  hasta = '';
  soloProximas = false;
  orden: Orden = 'fecha';

  // Además de los estados guardados, dos filtros calculados: las que toca
  // recordar esta semana y las que ya se han jugado.
  readonly estados = [
    { key: 'pendiente',    label: 'Pendiente' },
    { key: 'aceptada',     label: 'Aceptada' },
    { key: 'recordatorio', label: 'Recordatorio (esta semana)' },
    { key: 'confirmada',   label: 'Confirmada' },
    { key: 'denegada',     label: 'Anulada' },
    { key: 'cancelada',    label: 'Cancelada' },
    { key: 'cambios',      label: 'Cambios pedidos' },
    { key: 'proximas',     label: 'Próximas (hoy en adelante)' },
    { key: 'expirada',     label: 'Fecha expirada' },
  ];
  readonly tipos = [
    { key: 'individual', label: 'Partida abierta' },
    { key: 'privada',    label: 'Partida privada' },
    { key: 'evento',     label: 'Evento' },
    { key: 'txiki',      label: 'Txikipaintball' },
  ];

  /** Guarda (o borra) el email para la próxima vez, según la casilla. */
  private guardarEmailRecordado() {
    try {
      if (this.recordarme) localStorage.setItem('sdj_admin_email', this.email.trim());
      else localStorage.removeItem('sdj_admin_email');
    } catch { /* si el navegador bloquea el almacenamiento, no pasa nada */ }
  }

  ngOnInit() {
    // Email recordado de la última vez (la contraseña nunca se guarda).
    try {
      const guardado = localStorage.getItem('sdj_admin_email');
      if (guardado) this.email = guardado;
      else this.recordarme = false;
    } catch { /* almacenamiento no disponible */ }

    // Si ya hay sesión guardada, se cargan los datos en cuanto se confirme.
    const revisar = setInterval(() => {
      if (!this.admin.cargandoSesion()) {
        clearInterval(revisar);
        if (this.admin.usuario()) this.cargar();
      }
    }, 100);
  }

  async entrar() {
    this.errorLogin.set('');
    this.entrando.set(true);
    try {
      await this.admin.entrar(this.email, this.password, this.recordarme);
      this.guardarEmailRecordado();
      this.password = '';
      await this.cargar();
    } catch {
      this.errorLogin.set('Email o contraseña incorrectos.');
    } finally {
      this.entrando.set(false);
    }
  }

  async salir() {
    await this.admin.salir();
    this.reservas.set([]);
  }

  async cargar() {
    this.cargando.set(true);
    this.error.set('');
    try {
      const [lista, cambios] = await Promise.all([this.admin.cargarReservas(), this.admin.cargarCambios()]);
      // Se cruza cada reserva con su petición de cambio pendiente, si la tiene.
      this.reservas.set(lista.map(r => ({ ...r, cambio: cambios.get(r.id)?.cambio ?? null })));
      this.codigosCambio = cambios;
    } catch {
      this.error.set('No se han podido cargar las reservas. Revisa las reglas de Firestore.');
    } finally {
      this.cargando.set(false);
    }
  }

  // ── Listado filtrado ────────────────────────────────────────────────────────
  filtradas = computed(() => {
    const texto = this.busquedaSignal().trim().toLowerCase();
    const hoy = new Date().toISOString().slice(0, 10);

    const lista = this.reservas().filter(r => {
      // Lo que esta en la papelera no se lista con el resto.
      if (r.borrada) return false;
      const fe = this.filtroEstadoSignal();
      if (fe === 'pendiente') {
        if (!this.requiereAccion(r)) return false;
      } else if (fe === 'recordatorio') {
        if (!this.soloRecordatorio(r)) return false;
      } else if (fe === 'cambios') {
        if (!r.cambio) return false;
      } else if (fe === 'proximas') {
        if ((r.fecha || '') < hoy) return false;
        if (r.estado === 'denegada' || r.estado === 'cancelada') return false;
      } else if (fe === 'expirada') {
        if (!this.esPasada(r)) return false;
      } else if (fe && r.estado !== fe) return false;
      if (this.filtroTipoSignal() && r.tipo !== this.filtroTipoSignal()) return false;
      if (this.desdeSignal() && (r.fecha || '') < this.desdeSignal()) return false;
      if (this.hastaSignal() && (r.fecha || '') > this.hastaSignal()) return false;
      if (this.soloProximasSignal() && (r.fecha || '') < hoy) return false;
      if (texto) {
        const campos = [r.nombre, r.email, r.telefono, r.numeroReserva, r.codigoCancelacion, r.notas]
          .filter(Boolean).join(' ').toLowerCase();
        if (!campos.includes(texto)) return false;
      }
      return true;
    });

    const o = this.ordenSignal();
    return [...lista].sort((a, b) => {
      if (o === 'nombre') return (a.nombre || '').localeCompare(b.nombre || '');
      if (o === 'creado') return (b.creado?.getTime() || 0) - (a.creado?.getTime() || 0);
      return (a.fecha || '').localeCompare(b.fecha || '') || (a.hora || '').localeCompare(b.hora || '');
    });
  });

  // Los filtros son campos con ngModel; estas señales los hacen reactivos para
  // el computed de arriba (se actualizan desde onFiltroCambiado()).
  private busquedaSignal      = signal('');
  private filtroEstadoSignal  = signal('');
  private filtroTipoSignal    = signal('');
  private desdeSignal         = signal('');
  private hastaSignal         = signal('');
  private soloProximasSignal  = signal(false);
  private ordenSignal         = signal<Orden>('fecha');

  onFiltroCambiado() {
    this.busquedaSignal.set(this.busqueda);
    this.filtroEstadoSignal.set(this.filtroEstado);
    this.filtroTipoSignal.set(this.filtroTipo);
    this.desdeSignal.set(this.desde);
    this.hastaSignal.set(this.hasta);
    this.soloProximasSignal.set(this.soloProximas);
    this.ordenSignal.set(this.orden);
  }

  limpiarFiltros() {
    this.busqueda = '';
    this.filtroEstado = '';
    this.filtroTipo = '';
    this.desde = '';
    this.hasta = '';
    this.soloProximas = false;
    this.orden = 'fecha';
    this.onFiltroCambiado();
  }

  // Atajo desde los recuadros del resumen: deja solo el grupo que has clicado.
  // Volver a clicarlo quita el filtro, para poder ver de nuevo el listado entero.
  verFiltro(key: string) {
    const yaActivo = this.filtroEstado === key;
    this.limpiarFiltros();
    if (!yaActivo) {
      this.filtroEstado = key;
      this.onFiltroCambiado();
    }
  }

  filtroActivo(key: string): boolean {
    return this.filtroEstado === key;
  }

  /**
   * ¿Necesita que hagas algo? Está pendiente de gestionar, el cliente ha
   * pedido un cambio, o es un día a consultar cuya hora aún no has fijado.
   */
  requiereAccion(r: ReservaAdmin): boolean {
    // Una anulada sigue pendiente si aún no le has avisado.
    if ((r.estado === 'denegada' || r.estado === 'cancelada') && !r.avisoPendiente) return false;
    return r.estado === 'pendiente' || !!r.cambio || !!r.avisoPendiente || (!!r.laborable && !r.horaFijada);
  }

  /** Días que faltan para la partida (negativo si ya pasó). */
  diasPara(r: ReservaAdmin): number {
    if (!r.fecha) return 999;
    const [a, m, d] = r.fecha.split('-').map(Number);
    const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
    return Math.round((new Date(a, m - 1, d).getTime() - hoy.getTime()) / 86400000);
  }

  /** Gestionada pero con el recordatorio sin enviar, y la fecha ya cerca. */
  recordatorioCercano(r: ReservaAdmin): boolean {
    return r.estado === 'aceptada' && !this.esPasada(r) && this.diasPara(r) <= 7;
  }

  /**
   * Solo recordatorio: toca avisar de que se acerca la partida y no hay nada
   * mas que gestionar. Son las filas amarillas; las que ademas requieren
   * accion salen en naranja y cuentan en 'Pendientes de gestionar'.
   */
  soloRecordatorio(r: ReservaAdmin): boolean {
    return this.recordatorioCercano(r) && !this.requiereAccion(r);
  }

  // ── Contadores del resumen ──────────────────────────────────────────────────
  // Lo que esta en la papelera no cuenta en ningun recuadro.
  private activas = computed(() => this.reservas().filter(r => !r.borrada));
  totalPendientes = computed(() => this.activas().filter(r => this.requiereAccion(r)).length);
  totalRecordatorios = computed(() => this.activas().filter(r => this.soloRecordatorio(r)).length);
  totalCambios = computed(() => this.activas().filter(r => !!r.cambio).length);
  totalProximas = computed(() => {
    const hoy = new Date().toISOString().slice(0, 10);
    return this.activas().filter(r => (r.fecha || '') >= hoy && r.estado !== 'denegada' && r.estado !== 'cancelada').length;
  });
  totalPersonas = computed(() => this.filtradas().reduce((s, r) => s + (r.personas || 0), 0));

  // ── Acciones ────────────────────────────────────────────────────────────────
  async marcar(r: ReservaAdmin, estado: EstadoReserva) {
    this.guardando.set(r.id);
    try {
      await this.admin.cambiarEstado(r.id, estado);
      // Denegar o cancelar libera el hueco para que otros puedan cogerlo.
      if ((estado === 'denegada' || estado === 'cancelada') && r.fecha && r.hora && r.pista) {
        await this.admin.liberarHueco(r.fecha, r.hora, r.pista);
      }
      this.reservas.update(list => list.map(x => (x.id === r.id ? { ...x, estado } : x)));
      const actualizada = { ...r, estado };
      if (estado === 'denegada') this.prepararAviso(actualizada, 'anulada');
      // Aceptar: se le confirma la reserva. Confirmar: ya se le ha recordado.
      if (estado === 'aceptada') this.prepararAviso(actualizada, 'confirmada');
    } catch {
      this.error.set('No se ha podido guardar el cambio.');
    } finally {
      this.guardando.set(null);
    }
  }

  /**
   * Tras una acción se deja listo el aviso correspondiente y se abre la fila,
   * para que solo tengas que pulsar WhatsApp o Email.
   */
  private prepararAviso(r: ReservaAdmin, motivo: string) {
    this.motivoPorReserva[r.id] = motivo;
    delete this.textoEditado[r.id];
    this.cerrarPaneles('detalle');
    this.detalle.set(r.id);
    this.reservas.update(list => list.map(x => (x.id === r.id ? { ...x, avisoPendiente: true } : x)));
  }

  /** Vuelve una reserva confirmada al estado anterior. */
  async reabrir(r: ReservaAdmin) {
    this.guardando.set(r.id);
    try {
      await this.admin.reabrir(r.id);
      this.reservas.update(list => list.map(x => (x.id === r.id
        ? { ...x, estado: 'aceptada' as EstadoReserva, avisoPendiente: false }
        : x)));
    } catch {
      this.error.set('No se ha podido deshacer.');
    } finally {
      this.guardando.set(null);
    }
  }

  /**
   * Deja listo el mensaje de 'reserva anulada' y abre la ficha. Es lo que
   * queda por hacer en una anulada: decirselo al cliente.
   */
  avisarAnulacion(r: ReservaAdmin) {
    if (this.detalle() === r.id) { this.detalle.set(null); return; }
    this.motivoPorReserva[r.id] = 'anulada';
    delete this.textoEditado[r.id];
    this.cerrarPaneles('detalle');
    this.detalle.set(r.id);
  }

  /** Deja listo el mensaje de recordatorio, sin tocar el estado. */
  prepararRecordatorio(r: ReservaAdmin) {
    this.motivoPorReserva[r.id] = 'recordatorio';
    delete this.textoEditado[r.id];
    this.cerrarPaneles('detalle');
    this.detalle.set(r.id);
  }

  /** ¿Es una reserva de día "a consultar" (hora aproximada, sin franja fija)? */
  horaAproximada(r: ReservaAdmin): boolean {
    // Sigue siendo editable aunque ya la hayas fijado: puedes rectificar.
    return r.laborable || (!r.pista && r.tipo !== 'individual' && !!r.hora);
  }

  /** Fija tú la hora definitiva de una reserva a consultar. */
  async fijarHora(r: ReservaAdmin, hora: string) {
    if (!hora) return;
    this.guardando.set(r.id);
    try {
      const pedida = r.horaPedida || r.hora || '';
      await this.admin.fijarHora(r.id, hora, r.horaPedida ? undefined : pedida);
      this.reservas.update(list => list.map(x => (x.id === r.id ? { ...x, hora, horaFijada: true, horaPedida: pedida } : x)));
      this.prepararAviso({ ...r, hora, horaFijada: true, horaPedida: pedida }, 'hora');
    } catch {
      this.error.set('No se ha podido guardar la hora.');
    } finally {
      this.guardando.set(null);
    }
  }

  async guardarNota(r: ReservaAdmin, texto: string) {
    this.guardando.set(r.id);
    try {
      await this.admin.guardarNota(r.id, texto);
      this.reservas.update(list => list.map(x => (x.id === r.id ? { ...x, notas: texto } : x)));
    } catch {
      this.error.set('No se ha podido guardar la nota.');
    } finally {
      this.guardando.set(null);
    }
  }

  async aceptarCambio(r: ReservaAdmin) {
    const info = this.codigosCambio.get(r.id);
    if (!info) return;
    this.guardando.set(r.id);
    try {
      await this.admin.aceptarCambio(r, info.codigo, info.cambio);
      await this.cargar();
    } catch {
      this.error.set('No se ha podido aplicar el cambio.');
    } finally {
      this.guardando.set(null);
    }
  }

  async rechazarCambio(r: ReservaAdmin) {
    const info = this.codigosCambio.get(r.id);
    if (!info) return;
    this.guardando.set(r.id);
    try {
      await this.admin.rechazarCambio(info.codigo);
      this.reservas.update(list => list.map(x => (x.id === r.id ? { ...x, cambio: null } : x)));
      this.prepararAviso(r, 'cambio-no');
    } catch {
      this.error.set('No se ha podido rechazar el cambio.');
    } finally {
      this.guardando.set(null);
    }
  }

  /** Resumen legible de lo que pide cambiar el cliente. */
  resumenCambio(cambio: Record<string, unknown>): string {
    const partes: string[] = [];
    if (cambio['fecha'])      partes.push(`fecha → ${cambio['fecha']}`);
    if (cambio['hora'])       partes.push(`hora → ${cambio['hora']}`);
    if (cambio['pista'])      partes.push(`pista → ${cambio['pista']}`);
    if (cambio['personas'])   partes.push(`personas → ${cambio['personas']}`);
    if (cambio['nombre'])     partes.push(`nombre → ${cambio['nombre']}`);
    if (cambio['telefono'])   partes.push(`teléfono → ${cambio['telefono']}`);
    if (cambio['email'])      partes.push(`email → ${cambio['email']}`);
    if (cambio['comentario']) partes.push(`"${cambio['comentario']}"`);
    return partes.join(' · ');
  }

  // Mismas horas de llegada que ofrece el calendario al cliente, para no
  // inventar minutos que luego no encajan con las sesiones.
  private readonly HORAS_GRUPO = [
    '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00',
    '13:30', '14:00', '14:30', '15:00', '15:30', '16:00',
  ];
  private readonly HORAS_TXIKI = [...this.HORAS_GRUPO, '16:30'];

  horasDisponibles(r: ReservaAdmin): string[] {
    const horas = r.tipo === 'txiki' ? this.HORAS_TXIKI : this.HORAS_GRUPO;
    // Si la hora guardada no está en la lista (reservas antiguas), se añade.
    return r.hora && !horas.includes(r.hora) ? [r.hora, ...horas] : horas;
  }

  // ── Avisar al cliente ───────────────────────────────────────────────────────
  // No hay envío automático: se prepara el texto y se abre WhatsApp o el correo
  // para que lo mandes tú desde tus propias cuentas.
  readonly motivos: { key: string; label: string; soloTxiki?: boolean }[] = [
    { key: 'confirmada',   label: 'Reserva confirmada' },
    { key: 'recordatorio', label: 'Recordatorio' },
    { key: 'hora',       label: 'Hora fijada' },
    { key: 'cambio-ok',  label: 'Cambio aceptado' },
    { key: 'cambio-no',  label: 'Cambio no posible' },
    { key: 'extra',      label: 'Extra no disponible' },
    { key: 'anulada',    label: 'Reserva anulada' },
    { key: 'autorizacion', label: 'Autorización de menores', soloTxiki: true },
  ];

  /** Enlace público al PDF de autorización (según el dominio donde estés). */
  get urlAutorizacion(): string {
    const base = typeof location !== 'undefined' ? location.origin : 'https://www.soldadosdejuguete.com';
    return base + '/documentos/autorizacion-menores.pdf';
  }

  /** Motivos aplicables a esa reserva (la autorización solo en Txikipaintball). */
  motivosDe(r: ReservaAdmin): { key: string; label: string }[] {
    return this.motivos.filter(m => !m.soloTxiki || r.tipo === 'txiki');
  }

  motivoPorReserva: Record<string, string> = {};
  /** Extra que acabas de anular, para nombrarlo en el mensaje. */
  extraAnulado: Record<string, string> = {};
  textoEditado: Record<string, string> = {};
  copiado = signal<string | null>(null);

  motivo(r: ReservaAdmin): string {
    return this.motivoPorReserva[r.id] || 'confirmada';
  }

  cambiarMotivo(r: ReservaAdmin, motivo: string) {
    this.motivoPorReserva[r.id] = motivo;
    delete this.textoEditado[r.id];   // el texto se vuelve a generar
  }

  /**
   * Texto del aviso: el que hayas retocado a mano en esta ficha, o la plantilla
   * de ese motivo (la reescrita desde «Textos de los avisos», o la de fábrica)
   * con los datos de la reserva ya puestos.
   */
  textoAviso(r: ReservaAdmin): string {
    if (this.textoEditado[r.id] !== undefined) return this.textoEditado[r.id];
    return this.rellenar(this.plantillas.texto(this.motivo(r)), r);
  }

  /** Sustituye los marcadores {nombre}, {cuando}… por los datos de la reserva. */
  rellenar(plantilla: string, r: ReservaAdmin): string {
    const faltan = this.diasPara(r);
    const dia = this.fechaLarga(r.fecha);
    const valores: Record<string, string> = {
      nombre:   (r.nombre || '').split(' ')[0] || 'hola',
      fecha:    dia,
      hora:     r.hora || '',
      cuando:   dia + (r.hora ? ' a las ' + r.hora : ''),
      // Referencia que usa el cliente para gestionar su reserva en /cancelar.
      ref:      r.codigoCancelacion ? ' (código ' + r.codigoCancelacion + ')'
                : r.numeroReserva ? ' (reserva ' + r.numeroReserva + ')' : '',
      personas: String(r.personas || ''),
      cuenta:   faltan <= 0 ? '¡es hoy!' : faltan === 1 ? '¡es mañana!'
                : 'ya queda nada: faltan ' + faltan + ' días.',
      autorizacion: this.urlAutorizacion,
    };
    return plantilla.replace(/{(w+)}/g, (todo, clave) => valores[clave] ?? todo);
  }

  /** Enlace de WhatsApp con el mensaje ya escrito. */
  enlaceWhatsapp(r: ReservaAdmin): string {
    const tel = (r.telefono || '').replace(/\D/g, '');
    const num = tel.startsWith('34') ? tel : '34' + tel;
    return 'https://wa.me/' + num + '?text=' + encodeURIComponent(this.textoAviso(r));
  }

  /** Asunto común de los avisos. */
  private asuntoAviso(r: ReservaAdmin): string {
    const ref = r.codigoCancelacion || r.numeroReserva;
    return this.plantillas.texto('asunto').replace('{ref}', ref || '').replace(/ · $/, '').trim();
  }

  /**
   * Redacción en Gmail, que funciona siempre desde el navegador (mailto:
   * depende de que el equipo tenga un programa de correo configurado).
   */
  enlaceGmail(r: ReservaAdmin): string {
    return 'https://mail.google.com/mail/?view=cm&fs=1'
      + '&to=' + encodeURIComponent(r.email || '')
      + '&su=' + encodeURIComponent(this.asuntoAviso(r))
      + '&body=' + encodeURIComponent(this.textoAviso(r));
  }

  /** Enlace de correo con asunto y cuerpo preparados. */
  enlaceEmail(r: ReservaAdmin): string {
    const asunto = this.asuntoAviso(r);
    return 'mailto:' + (r.email || '') + '?subject=' + encodeURIComponent(asunto)
      + '&body=' + encodeURIComponent(this.textoAviso(r));
  }

  /** Al abrir WhatsApp/email o copiar el texto, se da por comunicado. */
  async marcarAvisado(r: ReservaAdmin) {
    this.reservas.update(list => list.map(x => (x.id === r.id ? { ...x, avisoPendiente: false } : x)));
    try {
      await this.admin.marcarAviso(r.id, false);
    } catch {
      this.error.set('No se ha podido guardar que ya has avisado.');
    }
  }

  /** Anula un extra concreto sin tocar el resto de la reserva. */
  async anularExtra(r: ReservaAdmin, extra: string) {
    this.guardando.set(r.id);
    try {
      await this.admin.anularExtra(r, extra);
      this.reservas.update(list => list.map(x => (x.id === r.id
        ? { ...x, extras: (x.extras || []).filter(e => e !== extra), extrasAnulados: [...(x.extrasAnulados || []), extra] }
        : x)));
      this.extraAnulado[r.id] = extra;
      this.prepararAviso({ ...r, avisoMotivo: 'extra' }, 'extra');
    } catch {
      this.error.set('No se ha podido anular el extra.');
    } finally {
      this.guardando.set(null);
    }
  }

  /** Devuelve un extra anulado por error. */
  async restaurarExtra(r: ReservaAdmin, extra: string) {
    this.guardando.set(r.id);
    try {
      const avisoLimpio = await this.admin.restaurarExtra(r, extra);
      this.reservas.update(list => list.map(x => (x.id === r.id
        ? {
            ...x,
            extras: [...(x.extras || []), extra],
            extrasAnulados: (x.extrasAnulados || []).filter(e => e !== extra),
            ...(avisoLimpio ? { avisoPendiente: false } : {}),
          }
        : x)));
      // Deshacer no requiere avisar a nadie: se cierra el detalle sin más.
      if (this.detalle() === r.id) this.detalle.set(null);
      if (this.extraAnulado[r.id] === extra) delete this.extraAnulado[r.id];
    } catch {
      this.error.set('No se ha podido restaurar el extra.');
    } finally {
      this.guardando.set(null);
    }
  }

  /**
   * "Ya lo he mandado": deja de estar pendiente y avanza de fase. Si el aviso
   * era el recordatorio, la reserva queda confirmada (verde); si estaba por
   * gestionar, pasa a aceptada (gris hasta la semana previa).
   */
  async marcarAvisadoYAvanzar(r: ReservaAdmin) {
    this.guardando.set(r.id);
    try {
      const motivo = this.motivo(r);
      const nuevo: EstadoReserva | null =
        motivo === 'recordatorio' ? 'confirmada'
        : r.estado === 'pendiente' ? 'aceptada'
        : null;

      if (nuevo) await this.admin.cambiarEstado(r.id, nuevo);
      await this.admin.marcarAviso(r.id, false);

      this.reservas.update(list => list.map(x => (x.id === r.id
        ? { ...x, avisoPendiente: false, ...(nuevo ? { estado: nuevo } : {}) }
        : x)));
      this.detalle.set(null);
    } catch {
      this.error.set('No se ha podido guardar.');
    } finally {
      this.guardando.set(null);
    }
  }

  async copiarAviso(r: ReservaAdmin) {
    try {
      await navigator.clipboard.writeText(this.textoAviso(r));
      this.copiado.set(r.id);
      setTimeout(() => this.copiado.set(null), 2000);
    } catch { /* si el navegador lo impide, el texto se puede seleccionar a mano */ }
  }

  /** Abre el detalle para avisar: nunca con el formulario de edición abierto. */
  avisar(r: ReservaAdmin) {
    this.editando.set(null);
    this.toggleDetalle(r.id);
  }

  /** Abre el detalle directamente en modo edición. */
  modificar(r: ReservaAdmin) {
    this.cerrarPaneles('detalle');
    this.detalle.set(r.id);
    this.editar(r);
  }

  toggleDetalle(id: string) {
    const abrir = this.detalle() !== id;
    this.cerrarPaneles('detalle');
    this.detalle.set(abrir ? id : null);
  }

  /** Descarga lo que se está viendo en formato CSV (Excel). */
  exportarCsv() {
    const cab = ['Nº reserva', 'Código', 'Estado', 'Fecha', 'Hora', 'Pista', 'Tipo', 'Personas', 'Extras', 'Nombre', 'Email', 'Teléfono', 'Notas'];
    const filas = this.filtradas().map(r => [
      r.numeroReserva || '', r.codigoCancelacion || '', r.estado, r.fecha || '', r.hora || '', r.pista || '',
      this.tipoLabel(r.tipo), String(r.personas ?? ''), (r.extras || []).join(' | '), r.nombre || '', r.email || '', r.telefono || '', r.notas || '',
    ]);
    const csv = [cab, ...filas]
      .map(f => f.map(c => `"${String(c).replace(/"/g, '""')}"`).join(';'))
      .join('\n');
    const url = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `reservas-sdj-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  tipoLabel(tipo?: string): string {
    return this.tipos.find(t => t.key === tipo)?.label || tipo || '—';
  }

  fechaLarga(f?: string): string {
    if (!f) return '—';
    const [a, m, d] = f.split('-').map(Number);
    return new Date(a, m - 1, d).toLocaleDateString('es-ES', {
      weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
    });
  }

  /**
   * ¿Ya se ha jugado? Cuenta la hora exacta: si la reserva tiene franja se usa
   * su fin (2 h después); si no tiene hora, al acabar el día de juego (18:00).
   */
  esPasada(r: ReservaAdmin): boolean {
    if (!r.fecha) return false;
    const [a, m, d] = r.fecha.split('-').map(Number);
    const [h, min] = (r.hora || '18:00').split(':').map(Number);
    const fin = new Date(a, m - 1, d, h, min);
    if (r.hora) fin.setHours(fin.getHours() + 2);
    return fin.getTime() < Date.now();
  }
}
