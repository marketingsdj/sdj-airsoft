import { Component, Input, signal, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AnalyticsService } from '../../../core/services/analytics.service';

@Component({
  selector: 'app-evento-contacto',
  imports: [FormsModule],
  templateUrl: './evento-contacto.component.html',
  styleUrl: './evento-contacto.component.scss'
})
export class EventoContactoComponent {
  /** Tipo de evento preseleccionado (despedida, cumpleaños, etc.). */
  @Input() tipoInicial = '';
  /** Etiqueta de origen para analítica (slug de la landing). */
  @Input() origen = 'eventos';
  /** Texto del eyebrow / título, personalizable por landing. */
  @Input() eyebrow = 'Contacto rápido';
  @Input() titulo = 'Te respondemos en menos de 24h';

  formEnviado = signal(false);
  formEnviando = signal(false);
  formError = signal(false);

  form = {
    tipo: '',
    fecha: '',
    personas: '',
    nombre: '',
    telefono: '',
    email: '',
    mensaje: '',
  };

  tiposEvento = ['Despedida', 'Cumpleaños', 'Team building / Empresa', 'Colectivos', 'Otro'];

  private analytics = inject(AnalyticsService);

  ngOnInit() {
    if (this.tipoInicial) this.form.tipo = this.tipoInicial;
  }

  // Solo se pueden escribir números, espacios y un "+" inicial (prefijo de país).
  onTelefonoBeforeInput(event: InputEvent) {
    if (event.data && /[^\d\s+]/.test(event.data)) event.preventDefault();
  }

  onTelefonoInput(event: Event) {
    const input = event.target as HTMLInputElement;
    const limpio = input.value.replace(/[^\d\s+]/g, '');
    if (limpio !== input.value) input.value = limpio;
    this.form.telefono = limpio;
  }

  get formularioValido(): boolean {
    return !!this.form.tipo &&
           !!this.form.nombre.trim() &&
           !!this.form.telefono.trim() &&
           !!this.form.email.trim();
  }

  async enviar() {
    this.formEnviando.set(true);
    this.formError.set(false);
    await new Promise(r => setTimeout(r, 1000));
    // TODO: conectar con n8n webhook (en el catch: this.formError.set(true))
    this.formEnviando.set(false);
    this.formEnviado.set(true);
    this.analytics.trackEvent('eventos_form_enviado', {
      tipo: this.form.tipo,
      personas: this.form.personas,
      origen: this.origen,
    });
  }
}
