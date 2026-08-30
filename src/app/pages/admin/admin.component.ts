import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService, EstadoReserva, ReservaAdmin } from '../../core/services/admin.service';

type Orden = 'fecha' | 'creado' | 'nombre';

@Component({
  selector: 'app-admin',
  imports: [CommonModule, FormsModule],
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.scss',
})
export class AdminComponent implements OnInit {
  admin = inject(AdminService);

  // ── Sesión ──────────────────────────────────────────────────────────────────
  email = '';
  password = '';
  errorLogin = signal('');
  entrando = signal(false);

  // ── Datos ───────────────────────────────────────────────────────────────────
  reservas = signal<ReservaAdmin[]>([]);
  cargando = signal(false);
  error = signal('');
  guardando = signal<string | null>(null);   // id de la reserva que se está actualizando
  detalle = signal<string | null>(null);     // id de la fila desplegada
  /** Códigos de las peticiones de cambio, por id de reserva. */
  private codigosCambio = new Map<string, { codigo: string; cambio: Record<string, unknown> }>();

  // ── Filtros ─────────────────────────────────────────────────────────────────
  busqueda = '';                       // nombre, email, teléfono o nº de reserva
  filtroEstado: '' | EstadoReserva = '';
  filtroTipo = '';
  desde = '';
  hasta = '';
  soloProximas = false;
  orden: Orden = 'fecha';

  readonly estados: EstadoReserva[] = ['pendiente', 'confirmada', 'denegada', 'cancelada'];
  readonly tipos = [
    { key: 'individual', label: 'Partida abierta' },
    { key: 'privada',    label: 'Partida privada' },
    { key: 'evento',     label: 'Evento' },
    { key: 'txiki',      label: 'Txikipaintball' },
  ];

  ngOnInit() {
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
      await this.admin.entrar(this.email, this.password);
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
      if (this.filtroEstadoSignal() === 'pendiente') {
        if (!this.requiereAccion(r)) return false;
      } else if (this.filtroEstadoSignal() && r.estado !== this.filtroEstadoSignal()) return false;
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
  private filtroEstadoSignal  = signal<'' | EstadoReserva>('');
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

  // Atajo: solo las que están pendientes de gestionar.
  verPendientes() {
    this.limpiarFiltros();
    this.filtroEstado = 'pendiente';
    this.onFiltroCambiado();
  }

  /**
   * ¿Necesita que hagas algo? Está pendiente de gestionar, el cliente ha
   * pedido un cambio, o es un día a consultar cuya hora aún no has fijado.
   */
  requiereAccion(r: ReservaAdmin): boolean {
    if (r.estado === 'denegada' || r.estado === 'cancelada') return false;
    return r.estado === 'pendiente' || !!r.cambio || (!!r.laborable && !r.horaFijada);
  }

  // ── Contadores del resumen ──────────────────────────────────────────────────
  totalPendientes = computed(() => this.reservas().filter(r => this.requiereAccion(r)).length);
  totalCambios = computed(() => this.reservas().filter(r => !!r.cambio).length);
  totalProximas = computed(() => {
    const hoy = new Date().toISOString().slice(0, 10);
    return this.reservas().filter(r => (r.fecha || '') >= hoy && r.estado !== 'denegada' && r.estado !== 'cancelada').length;
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
      if (estado === 'confirmada') this.prepararAviso(actualizada, 'confirmada');
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
      await this.admin.fijarHora(r.id, hora);
      this.reservas.update(list => list.map(x => (x.id === r.id ? { ...x, hora, horaFijada: true } : x)));
      this.prepararAviso({ ...r, hora, horaFijada: true }, 'hora');
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
  private readonly HORAS_TXIKI = [...this.HORAS_GRUPO, '16:30', '17:00'];

  horasDisponibles(r: ReservaAdmin): string[] {
    const horas = r.tipo === 'txiki' ? this.HORAS_TXIKI : this.HORAS_GRUPO;
    // Si la hora guardada no está en la lista (reservas antiguas), se añade.
    return r.hora && !horas.includes(r.hora) ? [r.hora, ...horas] : horas;
  }

  // ── Avisar al cliente ───────────────────────────────────────────────────────
  // No hay envío automático: se prepara el texto y se abre WhatsApp o el correo
  // para que lo mandes tú desde tus propias cuentas.
  readonly motivos = [
    { key: 'confirmada', label: 'Reserva confirmada' },
    { key: 'hora',       label: 'Hora fijada' },
    { key: 'cambio-ok',  label: 'Cambio aceptado' },
    { key: 'cambio-no',  label: 'Cambio no posible' },
    { key: 'extra',      label: 'Extra no disponible' },
    { key: 'anulada',    label: 'Reserva anulada' },
  ];

  motivoPorReserva: Record<string, string> = {};
  textoEditado: Record<string, string> = {};
  copiado = signal<string | null>(null);

  motivo(r: ReservaAdmin): string {
    return this.motivoPorReserva[r.id] || 'confirmada';
  }

  cambiarMotivo(r: ReservaAdmin, motivo: string) {
    this.motivoPorReserva[r.id] = motivo;
    delete this.textoEditado[r.id];   // el texto se vuelve a generar
  }

  /** Texto del aviso: el generado para ese motivo, o el que hayas retocado. */
  textoAviso(r: ReservaAdmin): string {
    if (this.textoEditado[r.id] !== undefined) return this.textoEditado[r.id];

    const nombre = (r.nombre || '').split(' ')[0] || 'hola';
    const dia = this.fechaLarga(r.fecha);
    const cuando = dia + (r.hora ? ' a las ' + r.hora : '');
    const ref = r.numeroReserva ? ' (reserva ' + r.numeroReserva + ')' : '';

    switch (this.motivo(r)) {
      case 'hora':
        return 'Hola ' + nombre + ', te escribimos de Soldados de Juguete. Hemos fijado la hora de vuestra reserva del '
          + dia + ': os esperamos a las ' + r.hora + ref
          + '. Si no os viene bien, decidnos y lo ajustamos. ¡Nos vemos en el campo!';
      case 'cambio-ok':
        return 'Hola ' + nombre + ', te escribimos de Soldados de Juguete. Hemos aplicado el cambio que pediste: tu reserva queda para el '
          + cuando + ref + '. ¡Nos vemos en el campo!';
      case 'cambio-no':
        return 'Hola ' + nombre + ', te escribimos de Soldados de Juguete. No podemos aplicar el cambio que pediste porque no tenemos disponibilidad. Tu reserva sigue en pie para el '
          + cuando + ref + '. Si necesitas otra fecha, dínoslo y buscamos alternativa.';
      case 'extra':
        return 'Hola ' + nombre + ', te escribimos de Soldados de Juguete por tu reserva del ' + cuando + ref
          + '. No vamos a poder ofrecerte uno de los extras que habías pedido, así que no se te cobrará. La reserva se mantiene igual. Cualquier duda, aquí estamos.';
      case 'anulada':
        return 'Hola ' + nombre + ', te escribimos de Soldados de Juguete. Lamentamos decirte que no podemos atender tu reserva del '
          + cuando + ref + '. Si quieres, buscamos otra fecha que os venga bien.';
      default:
        return 'Hola ' + nombre + ', te confirmamos tu reserva en Soldados de Juguete para el ' + cuando + ref
          + '. Te esperamos en Larrabetzu, Barrio Legina. ¡Nos vemos en el campo!';
    }
  }

  /** Enlace de WhatsApp con el mensaje ya escrito. */
  enlaceWhatsapp(r: ReservaAdmin): string {
    const tel = (r.telefono || '').replace(/\D/g, '');
    const num = tel.startsWith('34') ? tel : '34' + tel;
    return 'https://wa.me/' + num + '?text=' + encodeURIComponent(this.textoAviso(r));
  }

  /** Enlace de correo con asunto y cuerpo preparados. */
  enlaceEmail(r: ReservaAdmin): string {
    const asunto = 'Tu reserva en Soldados de Juguete' + (r.numeroReserva ? ' · ' + r.numeroReserva : '');
    return 'mailto:' + (r.email || '') + '?subject=' + encodeURIComponent(asunto)
      + '&body=' + encodeURIComponent(this.textoAviso(r));
  }

  async copiarAviso(r: ReservaAdmin) {
    try {
      await navigator.clipboard.writeText(this.textoAviso(r));
      this.copiado.set(r.id);
      setTimeout(() => this.copiado.set(null), 2000);
    } catch { /* si el navegador lo impide, el texto se puede seleccionar a mano */ }
  }

  toggleDetalle(id: string) {
    this.detalle.set(this.detalle() === id ? null : id);
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
