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
      if (this.filtroEstadoSignal() && r.estado !== this.filtroEstadoSignal()) return false;
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

  // ── Contadores del resumen ──────────────────────────────────────────────────
  totalPendientes = computed(() => this.reservas().filter(r => r.estado === 'pendiente').length);
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
    } catch {
      this.error.set('No se ha podido guardar el cambio.');
    } finally {
      this.guardando.set(null);
    }
  }

  /** ¿Es una reserva de día "a consultar" (hora aproximada, sin franja fija)? */
  horaAproximada(r: ReservaAdmin): boolean {
    return (r.laborable || (!r.pista && r.tipo !== 'individual' && !!r.hora)) && !r.horaFijada;
  }

  /** Fija tú la hora definitiva de una reserva a consultar. */
  async fijarHora(r: ReservaAdmin, hora: string) {
    if (!hora) return;
    this.guardando.set(r.id);
    try {
      await this.admin.fijarHora(r.id, hora);
      this.reservas.update(list => list.map(x => (x.id === r.id ? { ...x, hora, horaFijada: true } : x)));
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

  esPasada(f?: string): boolean {
    return !!f && f < new Date().toISOString().slice(0, 10);
  }
}
