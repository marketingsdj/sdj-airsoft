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
      this.reservas.set(await this.admin.cargarReservas());
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
        const campos = [r.nombre, r.email, r.telefono, r.numeroReserva, r.notas]
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

  toggleDetalle(id: string) {
    this.detalle.set(this.detalle() === id ? null : id);
  }

  /** Descarga lo que se está viendo en formato CSV (Excel). */
  exportarCsv() {
    const cab = ['Nº reserva', 'Estado', 'Fecha', 'Hora', 'Pista', 'Tipo', 'Personas', 'Nombre', 'Email', 'Teléfono', 'Notas'];
    const filas = this.filtradas().map(r => [
      r.numeroReserva || '', r.estado, r.fecha || '', r.hora || '', r.pista || '',
      this.tipoLabel(r.tipo), String(r.personas ?? ''), r.nombre || '', r.email || '', r.telefono || '', r.notas || '',
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
