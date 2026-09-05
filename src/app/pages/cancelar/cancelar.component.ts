import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  CancelacionService, DatosCancelacion, HORAS_MINIMAS_CANCELACION,
} from '../../core/services/cancelacion.service';
import { AnalyticsService } from '../../core/services/analytics.service';
import { CalendarioGruposComponent } from '../../shared/calendario-grupos/calendario-grupos.component';

@Component({
  selector: 'app-cancelar',
  imports: [CommonModule, FormsModule, RouterLink, CalendarioGruposComponent],
  templateUrl: './cancelar.component.html',
  styleUrl: './cancelar.component.scss',
})
export class CancelarComponent implements OnInit {
  private cancelacion = inject(CancelacionService);
  private analytics = inject(AnalyticsService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  readonly horasMinimas = HORAS_MINIMAS_CANCELACION;

  codigo = '';
  buscando = signal(false);
  cancelando = signal(false);
  error = signal('');
  reserva = signal<DatosCancelacion | null>(null);
  hecho = signal(false);

  // ── Modificación ────────────────────────────────────────────────────────────
  modo = signal<'elegir' | 'cancelar' | 'modificar'>('elegir');
  enviandoCambio = signal(false);
  // El calendario ocupa mucho: solo se abre si el cliente quiere cambiar el dia.
  calendarioAbierto = signal(false);
  cambioEnviado = signal(false);
  cambio = { fecha: '', hora: '', pista: '', personas: null as number | null, nombre: '', telefono: '', email: '', comentario: '' };

  ngOnInit() {
    // El enlace del PDF y de la pantalla de confirmación trae el código puesto.
    this.route.queryParams.subscribe(p => {
      const c = (p['codigo'] || '').toString().trim().toUpperCase();
      if (c) {
        this.codigo = c;
        this.buscar();
      }
    });
  }

  /** Cierra la gestión y vuelve por donde se llegó (o al inicio). */
  salir() {
    if (typeof history !== 'undefined' && history.length > 1) history.back();
    else this.router.navigate(['/']);
  }

  async buscar() {
    this.error.set('');
    this.reserva.set(null);
    this.hecho.set(false);
    this.modo.set('elegir');
    this.calendarioAbierto.set(false);
    this.cambioEnviado.set(false);
    if (!this.codigo.trim()) return;

    this.buscando.set(true);
    try {
      const r = await this.cancelacion.buscar(this.codigo);
      if (!r) {
        this.error.set('No encontramos ninguna reserva con ese código. Revísalo en tu justificante.');
      } else {
        this.reserva.set(r);
      }
    } catch {
      this.error.set('No hemos podido comprobar el código. Inténtalo de nuevo en unos minutos.');
    } finally {
      this.buscando.set(false);
    }
  }

  /** Franja nueva elegida en el calendario de disponibilidad. */
  onNuevoSlot(ev: { fecha: string; hora: string; pista: string }) {
    this.cambio.fecha = ev.fecha;
    this.cambio.hora  = ev.hora;
    this.cambio.pista = ev.pista;
    // Ya está elegida la franja: se cierra el calendario.
    this.calendarioAbierto.set(false);
  }

  /**
   * Día pulsado en el calendario. Si esa reserva usa franjas, el calendario
   * sigue abierto para elegirla; si no, con el día basta.
   */
  onNuevaFecha(fecha: string, tieneFranjas: boolean) {
    this.cambio.fecha = fecha;
    this.cambio.hora = '';
    this.cambio.pista = '';
    if (!tieneFranjas) this.calendarioAbierto.set(false);
  }

  /** Día entre semana: no hay franjas, solo hora aproximada de llegada. */
  onNuevoLaborable(ev: { fecha: string; horaAprox: string }) {
    this.cambio.fecha = ev.fecha;
    this.cambio.hora  = ev.horaAprox;
    this.cambio.pista = '';
    this.calendarioAbierto.set(false);
  }

  quitarFechaNueva() {
    this.calendarioAbierto.set(false);
    this.cambio.fecha = '';
    this.cambio.hora = '';
    this.cambio.pista = '';
  }

  /** ¿Ha rellenado al menos un campo del cambio? */
  get hayCambio(): boolean {
    const c = this.cambio;
    return !!(c.fecha || c.hora || c.personas || c.nombre.trim() || c.telefono.trim() || c.email.trim() || c.comentario.trim());
  }

  async enviarCambio() {
    const r = this.reserva();
    if (!r || !this.hayCambio) return;
    this.enviandoCambio.set(true);
    this.error.set('');
    try {
      await this.cancelacion.solicitarCambio(r.codigo, {
        fecha: this.cambio.fecha || undefined,
        hora: this.cambio.hora || undefined,
        pista: this.cambio.pista || undefined,
        personas: this.cambio.personas ?? undefined,
        nombre: this.cambio.nombre.trim() || undefined,
        telefono: this.cambio.telefono.trim() || undefined,
        email: this.cambio.email.trim() || undefined,
        comentario: this.cambio.comentario.trim() || undefined,
      });
      this.cambioEnviado.set(true);
      this.analytics.trackEvent('reserva_cambio_solicitado', { tipo: r.tipo || '' });
    } catch {
      this.error.set('No hemos podido enviar la petición. Escríbenos por WhatsApp y lo vemos.');
    } finally {
      this.enviandoCambio.set(false);
    }
  }

  async confirmar() {
    const r = this.reserva();
    if (!r) return;
    this.cancelando.set(true);
    this.error.set('');
    try {
      await this.cancelacion.cancelar(r);
      this.hecho.set(true);
      this.analytics.trackEvent('reserva_cancelada_cliente', { tipo: r.tipo || '' });
    } catch {
      this.error.set('No hemos podido cancelar la reserva. Escríbenos por WhatsApp y lo hacemos nosotros.');
    } finally {
      this.cancelando.set(false);
    }
  }

  aTiempo(r: DatosCancelacion): boolean {
    return this.cancelacion.aTiempo(r);
  }

  fechaLarga(f: string): string {
    if (!f) return '';
    const [a, m, d] = f.split('-').map(Number);
    return new Date(a, m - 1, d).toLocaleDateString('es-ES', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    });
  }

  /** Como fechaLarga, pero solo con la primera letra en mayúscula. */
  fechaLargaCap(f: string): string {
    const txt = this.fechaLarga(f);
    return txt ? txt.charAt(0).toUpperCase() + txt.slice(1) : '';
  }

  tipoLabel(tipo?: string): string {
    return ({
      individual: 'Partida abierta',
      privada: 'Partida privada',
      evento: 'Evento / Celebración',
      txiki: 'Txikipaintball',
    } as Record<string, string>)[tipo || ''] || 'Reserva';
  }
}
