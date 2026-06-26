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
  // Independiente de las 4 pestañas: no es una más, así que no debe vaciar
  // el contenido de la pestaña activa al abrirse.
  txikiAbierto = signal(false);

  premiumIncluye = [
    'Réplica de gama alta',
    'Máscara full-face premium',
    'Chaleco táctico profesional',
    'Munición ilimitada premium',
    'Seguro de actividad',
  ];

  // Bonos habituales (resumen + pop-up en móvil, como en promos)
  bonosHabitual = [
    {
      tag: 'Bono habitual',
      titulo: 'Vale 10 SDJ',
      precio: '179',
      desc: '10 visitas de mañana con equipo propio.',
      lista: [
        'Válido 12 meses',
        'Nominal e intransferible',
        'Al comprar: <strong>parche SDJ oficial</strong>',
        '<strong>Alta gratuita para convertirte en socio</strong>',
      ],
      aviso: '',
      wa: 'https://wa.me/34688731474?text=Quiero%20comprar%20el%20Vale%2010%20SDJ',
      cta: 'Comprar el Vale 10 →',
    },
    {
      tag: 'Bono 3 visitas',
      titulo: 'Bono 3 Visitas Premium',
      precio: '99',
      desc: '3 alquileres en modalidad premium — por separado serían <s>134,70 €</s>. Ahorras 35,70 €.',
      lista: [
        'Válido 6 meses · Nominal e intransferible',
        'Si hoy jugaste en estándar → solo necesitas <strong>59,10 €</strong> más',
        'Si jugaste en premium → solo <strong>54,10 €</strong> más',
      ],
      aviso: 'Disponible en mostrador al salir o por WhatsApp en los 7 días siguientes a tu visita.',
      wa: 'https://wa.me/34688731474',
      cta: 'Comprar el Bono 3 →',
    },
  ];
  bonoHabitualAbierto = signal<number | null>(null);
  abrirBonoHabitual(i: number) { this.bonoHabitualAbierto.set(i); }
  cerrarBonoHabitual() { this.bonoHabitualAbierto.set(null); }

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

  // Tarifa de Txikipaintball, mostrada con el mismo estilo que "Individual"
  // al pulsar el aviso "¿Quieres venir con un peque de 8 a 14 años?".
  txikiTarifa = {
    nombre: 'Txikipaintball',
    incluye: ['Munición ilimitada', 'Equipamiento completo adaptado', 'Monitor durante toda la actividad', 'Acceso a las zonas de juego', 'Seguro de actividad'],
    precio: 19,
  };

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
    this.txikiAbierto.set(false);
    this.location.replaceState('/tarifas?tab=' + t);
    this.analytics.trackEvent('tarifas_tab_visto', { tab: t });
  }

  toggleTxiki() {
    this.txikiAbierto.update(v => !v);
    this.analytics.trackEvent('tarifas_txiki_visto', { abierto: this.txikiAbierto() ? 'sí' : 'no' });
  }
}
