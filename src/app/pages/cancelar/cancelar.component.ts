import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import {
  CancelacionService, DatosCancelacion, HORAS_MINIMAS_CANCELACION,
} from '../../core/services/cancelacion.service';
import { AnalyticsService } from '../../core/services/analytics.service';

@Component({
  selector: 'app-cancelar',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './cancelar.component.html',
  styleUrl: './cancelar.component.scss',
})
export class CancelarComponent implements OnInit {
  private cancelacion = inject(CancelacionService);
  private analytics = inject(AnalyticsService);
  private route = inject(ActivatedRoute);

  readonly horasMinimas = HORAS_MINIMAS_CANCELACION;

  codigo = '';
  buscando = signal(false);
  cancelando = signal(false);
  error = signal('');
  reserva = signal<DatosCancelacion | null>(null);
  hecho = signal(false);

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

  async buscar() {
    this.error.set('');
    this.reserva.set(null);
    this.hecho.set(false);
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

  tipoLabel(tipo?: string): string {
    return ({
      individual: 'Partida abierta',
      privada: 'Partida privada',
      evento: 'Evento / Celebración',
      txiki: 'Txikipaintball',
    } as Record<string, string>)[tipo || ''] || 'Reserva';
  }
}
