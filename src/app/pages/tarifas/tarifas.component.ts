import { Component, signal, OnInit, inject } from '@angular/core';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';
import { AnalyticsService } from '../../core/services/analytics.service';
import { CommonModule, DecimalPipe } from '@angular/common';
import { CalendarioGruposComponent } from '../../shared/calendario-grupos/calendario-grupos.component';

type Tab = 'individual' | 'grupo' | 'socio' | 'extras';
const TABS_VALIDOS: Tab[] = ['individual', 'grupo', 'socio', 'extras'];

@Component({
  selector: 'app-tarifas',
  imports: [RouterLink, CommonModule, DecimalPipe, CalendarioGruposComponent],
  templateUrl: './tarifas.component.html',
  styleUrl: './tarifas.component.scss'
})
export class TarifasComponent implements OnInit {
  tab = signal<Tab>('individual');
  modalAlquiler = signal(false);
  mostrarBeneficios = signal(false);

  premiumIncluye = [
    'Réplica de gama alta',
    'Máscara full-face premium',
    'Chaleco táctico profesional',
    'Munición ilimitada premium',
    'Seguro de actividad',
  ];

  private analytics = inject(AnalyticsService);

  constructor(private location: Location, private route: ActivatedRoute) {}

  ngOnInit() {
    const tabParam = this.route.snapshot.queryParamMap.get('tab') as Tab;
    if (tabParam && TABS_VALIDOS.includes(tabParam)) {
      this.tab.set(tabParam);
    }
  }

  tabs: { key: Tab; label: string; icon: string; desc: string }[] = [
    { key: 'individual', label: 'Individual',       icon: '◎', desc: 'Entrada y alquiler de equipo' },
    { key: 'grupo',      label: 'Grupo',            icon: '◈', desc: 'A partir de 8 personas' },
    { key: 'socio',      label: 'Hazte socio',      icon: '★', desc: 'Descuentos y acceso exclusivo' },
    { key: 'extras',     label: 'Entrada reducida', icon: '◆', desc: 'Acceso desde las 13:00' },
  ];

  individual = [
    {
      key: 'simple',
      nombre: 'Entrada simple',
      incluye: ['Acceso al campo', 'Monitor incluido', 'Seguro de actividad'],
      precio: 19.90,
      premium: false
    },
    {
      key: 'alquiler',
      nombre: 'Entrada + alquiler equipo',
      incluye: ['Acceso al campo', 'Réplica de airsoft', 'Gafas homologadas', 'Chaleco táctico', 'Munición ilimitada', 'Seguro de actividad'],
      precio: 39.90,
      premium: false
    },
  ];

  grupo = [
    {
      key: 'grupo',
      nombre: 'Grupo 8+ personas',
      incluye: ['Partida privada GRATIS con monitor', 'Campo exclusivo para vuestro grupo', 'Modo de juego a elegir', 'Horario a medida'],
      precio: 0,
      label: 'Sin coste extra'
    },
    {
      key: 'eventos',
      nombre: 'Despedidas / Empresas',
      incluye: ['Pack a medida', 'Monitor dedicado', 'Catering opcional', 'Foto de grupo'],
      precio: -1,
      label: 'Consultar'
    },
  ];

  extras = [
    {
      key: 'reducida-simple',
      nombre: 'Entrada reducida (desde 13:00)',
      incluye: ['Acceso al campo media tarde', 'Monitor incluido', 'Seguro de actividad'],
      precio: 14.90
    },
    {
      key: 'reducida-alquiler',
      nombre: 'Reducida + alquiler equipo',
      incluye: ['Media tarde', 'Equipo completo', 'Munición ilimitada', 'Seguro de actividad'],
      precio: 29.90
    },
  ];

  // Datos para el comparador
  comparador = {
    suelto: { partidas: 12, costePartida: 39.90, total: 12 * 39.90 },
    socio: { cuota: 0, partidas: 12, descuento: 0.20 } // TODO: rellenar con datos reales del PDF
  };

  politica = [
    { titulo: 'Pago', desc: 'En el campo el día de la partida. Para eventos privados puede requerirse señal previa.' },
    { titulo: 'Cancelaciones', desc: 'Gratuita hasta 48h antes. Pasado ese tiempo, se retiene la señal si la hubiera.' },
    { titulo: 'No-shows', desc: 'Si no apareces sin avisar, la plaza se libera y no se devuelve el importe si ya pagaste.' },
    { titulo: 'Mal tiempo', desc: 'Jugamos con lluvia. Solo se cancela en caso de tormenta eléctrica o riesgo real.' },
  ];

  setTab(t: Tab) {
    this.tab.set(t);
    this.location.replaceState('/tarifas?tab=' + t);
    this.analytics.trackEvent('tarifas_tab_visto', { tab: t });
  }
}
