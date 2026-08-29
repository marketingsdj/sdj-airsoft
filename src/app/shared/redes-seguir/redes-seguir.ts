import { Component, Input, inject } from '@angular/core';
import { AnalyticsService } from '../../core/services/analytics.service';

// Bloque discreto de "síguenos": se incrusta dentro de secciones ya existentes,
// sin ocupar una sección propia. El texto se pasa desde fuera para que encaje
// con el contenido de cada página.
@Component({
  selector: 'app-redes-seguir',
  templateUrl: './redes-seguir.html',
  styleUrl: './redes-seguir.scss'
})
export class RedesSeguirComponent {
  @Input() texto = 'Cada semana subimos fotos y vídeos de las partidas.';
  @Input() origen = '';
  // Oculta la línea separadora superior cuando el bloque ya va tras otro borde.
  @Input() sinLinea = false;
  // En móvil deja solo los iconos (la frase ocupa demasiado en pantalla estrecha).
  @Input() textoSoloEscritorio = false;

  private analytics = inject(AnalyticsService);

  clickRed(red: string) {
    this.analytics.trackEvent('click_red_social', { red, origen: this.origen });
  }
}
