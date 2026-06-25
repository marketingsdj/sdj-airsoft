import { Component, signal, OnInit, OnDestroy, inject, HostListener, PLATFORM_ID } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { CalendarioGruposComponent } from '../../shared/calendario-grupos/calendario-grupos.component';
import { SlotsService } from '../../core/services/slots.service';
import { ReservaStateService, TipoReserva } from '../../core/services/reserva-state.service';
import { AnalyticsService } from '../../core/services/analytics.service';

@Component({
  selector: 'app-reserva',
  imports: [FormsModule, CommonModule, RouterLink, CalendarioGruposComponent],
  templateUrl: './reserva.component.html',
  styleUrl: './reserva.component.scss'
})
export class ReservaComponent implements OnInit, OnDestroy {
  private state        = inject(ReservaStateService);
  private slotsService = inject(SlotsService);
  analytics            = inject(AnalyticsService);
  private isBrowser    = isPlatformBrowser(inject(PLATFORM_ID));

  // Shared with the service — survives navigation
  form  = this.state.form;
  paso  = this.state.paso;
  enviado       = this.state.enviado;
  numeroReserva = this.state.numeroReserva;

  enviando     = signal(false);
  mostrarNormas      = signal(false);
  mostrarPrivacidad  = signal(false);
  mostrarReducida    = signal(false);   // disclosure "¿Conoces la tarifa reducida?"
  modalPremium       = signal(false);   // pop-up de upsell a Premium al pasar del paso 1
  private premiumOfrecido = false;      // para no repetir el pop-up en el mismo flujo

  premiumIncluye = [
    'Réplica de gama alta',
    'Máscara full-face premium',
    'Chaleco táctico profesional',
    'Munición ilimitada premium',
    'Seguro de actividad',
  ];

  constructor(private route: ActivatedRoute) {}

  private readonly paramToTipo: Record<string, TipoReserva> = {
    individual: 'individual',
    reducida:   'individual',
    socio:      'individual',
    grupo:      'privada',
    privada:    'privada',
    evento:     'evento',
    txiki:          'txiki',
    txikipaintball: 'txiki',
  };

  private readonly tipoNombres: Record<string, string> = {
    individual: 'Partida abierta',
    privada:    'Partida privada',
    evento:     'Evento / Celebración',
    txiki:      'Txikipaintball',
  };

  private readonly packLabels: Record<string, string> = {
    simple:              'Entrada simple',
    alquiler:            'Con alquiler de equipo',
    'reducida-simple':   'Reducida (tarde)',
    'reducida-alquiler': 'Reducida + alquiler',
    socio:               'Membresía anual',
    grupo:               'Grupo privado',
    despedidas:          'Despedida',
    cumples:             'Cumpleaños',
    empresas:            'Team building',
    colectivos:          'Colectivos',
  };

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      const tipoParam = params['tipo'];
      const pack      = params['pack'] || '';
      const premium   = params['premium'] === 'true';
      const fecha     = params['fecha'] || '';
      const hora      = params['hora']  || '';
      const pista     = params['pista'] || '';
      const doble     = params['doble'] === 'true';

      if (tipoParam && this.paramToTipo[tipoParam]) {
        const nuevoTipo = this.paramToTipo[tipoParam];
        // Si se llega con una categoría distinta a la que se estaba rellenando,
        // se limpia el formulario para empezar de cero en la nueva categoría.
        if (this.form.tipo && this.form.tipo !== nuevoTipo) {
          this.state.reset();
        }
        this.form.tipo      = nuevoTipo;
        this.form.modalidad = tipoParam === 'socio' ? 'socio' : pack;
        this.form.premium   = premium;
        this.form.doblePartida = doble && (this.form.tipo === 'privada' || this.form.tipo === 'evento');

        if (this.minPersonas > 1 && this.form.personas < this.minPersonas) this.form.personas = this.minPersonas;
        if (fecha) this.form.fecha = fecha;
        if (hora)  this.form.hora  = hora;
        if (pista) this.form.pista = pista;

        this.paso.set(fecha && hora && pista ? 3 : 2);
      } else {
        // Entrada genérica a /reserva (sin categoría): empezar en el paso 1
        // para elegir, en vez de quedarse a medias en una reserva anterior.
        this.paso.set(1);
      }
      if (this.isBrowser) history.replaceState({ paso: this.paso() }, '');
    });
  }

  @HostListener('window:popstate', ['$event'])
  onPopState(event: PopStateEvent) {
    const p = (event.state as { paso?: number })?.paso;
    if (typeof p === 'number' && p >= 1 && p <= 3) {
      this.paso.set(p);
    }
  }

  primeraVezOpciones    = ['Sí, es mi primera vez', 'Ya he venido antes', 'Soy socio/a'];
  comoConocidoOpciones  = ['Instagram', 'Google', 'Un amigo / familiar', 'Ya era cliente', 'Otro'];

  tipos = [
    { key: 'individual' as TipoReserva, label: 'Partida abierta',     desc: 'Acceso a las partidas con todos los jugadores, con diferentes dinámicas cada hora. Ven solo o acompañado.',  icono: '◎' },
    { key: 'privada'    as TipoReserva, label: 'Partida privada',      desc: 'Grupo propio, campo exclusivo. Mínimo 8 personas. Acceso a partida abierta incluido (fines de semana y festivos).',           icono: '◈' },
    { key: 'evento'     as TipoReserva, label: 'Evento / Celebración', desc: 'Despedida, cumpleaños, team building o colectivos.',          icono: '◆' },
  ];

  hoy = new Date().toISOString().split('T')[0];

  // Selector de equipo para partida abierta (upsell a Premium, +5 € sobre estándar).
  equipos = [
    { key: 'propio'   as const, modalidad: 'simple'   as const, premium: false, icono: '○', label: 'Equipo propio',     desc: 'Traes tu réplica y equipo.',          precio: '19,90 €', recomendado: false },
    { key: 'estandar' as const, modalidad: 'alquiler' as const, premium: false, icono: '◐', label: 'Alquiler estándar', desc: 'Réplica, máscara y protección.',       precio: '39,90 €', recomendado: false },
    { key: 'premium'  as const, modalidad: 'alquiler' as const, premium: true,  icono: '★', label: 'Alquiler Premium',  desc: 'Equipo de gama alta. Solo +5 €.',      precio: '44,90 €', recomendado: true  },
  ];

  // En el paso 1 solo se muestran 2 opciones (propio / alquiler estándar); el
  // Premium se ofrece después en un pop-up al pulsar "Siguiente".
  get equiposVisibles() {
    return this.equipos.filter(e => !e.premium);
  }

  // Resalta la opción base elegida (Premium también cuenta como "alquiler estándar").
  get equipoBaseSeleccionado(): string {
    if (this.form.modalidad === 'simple') return 'propio';
    if (this.form.modalidad === 'alquiler') return 'estandar';
    return '';
  }

  get equipoSeleccionado(): string {
    if (this.form.modalidad === 'simple') return 'propio';
    if (this.form.modalidad === 'alquiler') return this.form.premium ? 'premium' : 'estandar';
    return '';
  }

  seleccionarEquipo(modalidad: 'simple' | 'alquiler', premium: boolean) {
    this.form.modalidad = modalidad;
    this.form.premium = premium;
    // Si cambian de equipo, se vuelve a poder ofrecer el Premium al avanzar.
    this.premiumOfrecido = false;
    this.analytics.trackEvent('reserva_equipo_seleccionado', { modalidad, premium: premium ? 'sí' : 'no' });
  }

  get pasoValido(): boolean {
    if (this.paso() === 1) {
      if (!this.form.tipo) return false;
      if (this.form.tipo === 'individual') return !!this.form.modalidad;
      return true;
    }
    if (this.paso() === 2) return this.mostrarFranjas
      ? !!this.form.fecha && !!this.form.hora
      : !!this.form.fecha;
    if (this.paso() === 3) {
      if (!this.form.aceptaEdad) return false;
      if (!this.form.aceptaPrivacidad) return false;
      if (this.form.tipo === 'individual') {
        return !!this.form.acepta;
      }
      return !!this.form.nombre && !!this.form.email && !!this.form.telefono && this.form.acepta;
    }
    return false;
  }

  // Las reservas en grupo (privada, evento, txiki) eligen franja horaria.
  // Para individual solo se muestran franjas si el grupo crece a 8+.
  get mostrarFranjas(): boolean {
    return this.form.tipo === 'txiki' || this.form.personas >= 8;
  }

  // Mínimo de personas por tipo: 8 para grupos (privada, evento, txiki), 1 para individual.
  get minPersonas(): number {
    return this.form.tipo === 'privada' || this.form.tipo === 'evento' || this.form.tipo === 'txiki' ? 8 : 1;
  }

  // Grupos de 10 o más (privada/evento) pueden reservar también entre semana, bajo consulta.
  get permitirLaborables(): boolean {
    return (this.form.tipo === 'privada' || this.form.tipo === 'evento') && this.form.personas >= 10;
  }

  // La tarifa reducida (tarde) se ofrece en partida abierta y privada.
  get muestraTarifaReducida(): boolean {
    return this.form.tipo === 'individual' || this.form.tipo === 'privada';
  }

  // El menú del evento se ofrece a partir de 10 personas.
  get muestraMenu(): boolean {
    return this.form.tipo === 'evento' && this.form.personas >= 10;
  }

  // Precio de la tarifa reducida (tarde) por persona: 29,90 € con alquiler de
  // equipo, 14,90 € con equipo propio.
  get precioReducida(): number {
    return this.form.modalidad === 'alquiler' ? 29.90 : 14.90;
  }

  get precioReducidaFmt(): string {
    return this.precioReducida.toFixed(2).replace('.', ',');
  }

  // Etiqueta del equipo aplicable a la tarifa reducida (según lo ya elegido).
  get equipoReducidaLabel(): string {
    return this.form.modalidad === 'alquiler' ? 'con alquiler de equipo' : 'con equipo propio';
  }

  get tarifaReducidaTotal(): string {
    return (this.precioReducida * this.form.personas).toFixed(2).replace('.', ',');
  }

  get resumen() {
    const modalidad = this.packLabels[this.form.modalidad] || '';
    return {
      tipo: this.tipoNombres[this.form.tipo] || '',
      modalidad,
      premium:  this.form.premium,
      fecha:    this.form.fecha,
      hora:     this.form.hora,
      personas: this.form.personas,
      doblePartida: this.form.doblePartida,
      laborableConsulta: this.form.laborableConsulta,
      tarifaReducida: this.form.tarifaReducida,
    };
  }

  // Recargo de la doble partida privada: 15 € por persona.
  get doblePartidaTotal(): string {
    return (15 * this.form.personas).toFixed(2).replace('.', ',');
  }

  irAPaso(n: number) {
    if (n < this.paso()) this.paso.set(n);
  }

  seleccionarTipo(tipo: TipoReserva) {
    // Al cambiar de categoría, la fecha/franja elegida deja de ser válida
    // (cada categoría tiene horarios distintos), así que se limpia la selección.
    if (this.form.tipo !== tipo) {
      this.form.fecha = '';
      this.form.hora  = '';
      this.form.pista = '';
      this.form.laborableConsulta = false;
    }
    this.form.tipo = tipo;
    if (tipo === 'privada' || tipo === 'evento' || tipo === 'txiki') { if (this.form.personas < 8) this.form.personas = 8; }
    else if (tipo === 'individual') this.form.personas = 1;
    if (tipo !== 'privada' && tipo !== 'evento') this.form.doblePartida = false;
    if (tipo !== 'individual' && tipo !== 'privada') { this.form.tarifaReducida = false; this.mostrarReducida.set(false); }
    if (tipo !== 'evento') this.form.menu = false;
    this.analytics.trackEvent('reserva_tipo_seleccionado', { tipo });
  }

  toggleDoblePartida() {
    this.form.doblePartida = !this.form.doblePartida;
    // La franja elegida puede dejar de ser válida (p. ej. sin consecutiva libre),
    // así que limpiamos la selección para que vuelvan a elegir.
    this.form.hora  = '';
    this.form.pista = '';
    this.form.laborableConsulta = false;
    this.analytics.trackEvent('reserva_doble_partida', { activo: this.form.doblePartida ? 'sí' : 'no' });
  }

  onSlotSeleccionado(event: { fecha: string; hora: string; pista: string }) {
    this.form.fecha = event.fecha;
    this.form.hora  = event.hora;
    this.form.pista = event.pista;
    this.form.laborableConsulta = false;
  }

  onFechaSeleccionada(fecha: string) {
    this.form.fecha = fecha;
    this.form.hora  = '';
    this.form.pista = '';
    this.form.laborableConsulta = false;
    this.analytics.trackEvent('calendario_fecha_seleccionada', { fecha, tipo: this.form.tipo });
  }

  onLaborableSeleccionado(event: { fecha: string; horaAprox: string }) {
    this.form.fecha = event.fecha;
    this.form.hora  = event.horaAprox;   // hora aproximada de llegada (pendiente de confirmar)
    this.form.pista = '';
    this.form.doblePartida = false;
    this.form.laborableConsulta = true;
  }

  sumarPersona() {
    if (this.form.personas < 100) this.form.personas++;
  }

  restarPersona() {
    if (this.form.personas > this.minPersonas) {
      this.form.personas--;
      if (!this.mostrarFranjas) { this.form.hora = ''; this.form.pista = ''; }
      if (!this.muestraMenu) this.form.menu = false;
    }
  }

  // Edición manual del número de personas (input numérico junto a +/-).
  // Mientras se escribe no se fuerza el rango, para no interrumpir al usuario
  // a mitad de tecleo; el rango se aplica al salir del campo (onPersonasBlur).
  onPersonasInput(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    const n = parseInt(value, 10);
    if (!isNaN(n)) this.form.personas = n;
  }

  personasAviso = signal('');
  private personasAvisoTimeout?: ReturnType<typeof setTimeout>;

  onPersonasBlur() {
    const valorEscrito = this.form.personas;
    const clamped = Math.min(100, Math.max(this.minPersonas, valorEscrito || this.minPersonas));
    this.form.personas = clamped;

    if (clamped !== valorEscrito) {
      const unidad = this.form.tipo === 'txiki' ? 'niños/as' : 'personas';
      this.personasAviso.set(clamped === 100 ? `Máximo ${unidad}: 100` : `Mínimo ${unidad}: ${this.minPersonas}`);
      clearTimeout(this.personasAvisoTimeout);
      this.personasAvisoTimeout = setTimeout(() => this.personasAviso.set(''), 3000);
    }

    if (!this.mostrarFranjas) { this.form.hora = ''; this.form.pista = ''; }
    if (!this.muestraMenu) this.form.menu = false;
  }

  siguiente() {
    if (!this.pasoValido) return;
    // Al salir del paso 1 con alquiler estándar, ofrecer el Premium (+5 €) en un pop-up.
    if (this.paso() === 1 && this.form.tipo === 'individual'
        && this.form.modalidad === 'alquiler' && !this.form.premium && !this.premiumOfrecido) {
      this.premiumOfrecido = true;
      this.modalPremium.set(true);
      return;
    }
    this.avanzar();
  }

  private avanzar() {
    this.paso.update(p => Math.min(p + 1, 3));
    history.pushState({ paso: this.paso() }, '');
    window.scrollTo({ top: 0, behavior: 'instant' });
    this.analytics.trackEvent('reserva_paso_completado', { paso: this.paso(), tipo: this.form.tipo });
  }

  aceptarPremium() {
    this.form.modalidad = 'alquiler';
    this.form.premium = true;
    this.modalPremium.set(false);
    this.analytics.trackEvent('reserva_premium_aceptado', {});
    this.avanzar();
  }

  rechazarPremium() {
    this.modalPremium.set(false);
    this.avanzar();
  }

  anterior() {
    history.back();
  }


  async enviar() {
    if (!this.pasoValido) return;
    this.enviando.set(true);

    const endpoint = this.form.tipo === 'individual'
      ? 'https://formspree.io/f/xgoqdwyd'
      : 'https://formspree.io/f/xkoeywjd';

    const payload = this.form.tipo === 'individual'
      ? {
          tipo: 'individual',
          fecha: this.form.fecha,
          personas: this.form.personas,
          tarifa_reducida: this.form.tarifaReducida ? `Sí (${this.precioReducidaFmt} €/persona)` : 'No',
        }
      : {
          tipo:        this.form.tipo,
          modalidad:   this.form.modalidad,
          fecha:       this.form.fecha,
          hora:        this.form.hora,
          pista:       this.form.pista,
          personas:    this.form.personas,
          nombre:      this.form.nombre,
          email:       this.form.email,
          telefono:    this.form.telefono,
          como_conocido: this.form.comoConocido,
          primera_vez:   this.form.primeraVez,
          mensaje:     this.form.mensaje,
          ...(this.form.tipo === 'privada' || this.form.tipo === 'evento' ? {
            doble_partida: this.form.doblePartida ? `Sí (+15 €/persona · ${this.doblePartidaTotal} €)` : 'No',
          } : {}),
          ...(this.muestraTarifaReducida ? {
            tarifa_reducida: this.form.tarifaReducida ? `Sí (${this.precioReducidaFmt} €/persona)` : 'No',
          } : {}),
          ...(this.form.tipo === 'evento' ? {
            menu: this.form.menu ? 'Sí (precio por confirmar)' : 'No',
          } : {}),
          ...(this.form.tipo === 'txiki' ? {
            num_ninos:    this.form.personas,
            edades_ninos: this.form.edadesNinos,
            merienda:     this.form.merienda ? 'Sí' : 'No',
          } : {}),
        };

    await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(payload),
    });

    // Cualquier reserva de grupo con franja (privada, evento, txiki) bloquea el
    // hueco en la lista compartida. Individual no tiene pista, así que no entra.
    if (this.form.fecha && this.form.hora && this.form.pista) {
      this.slotsService.bloquear(this.form.fecha, this.form.hora, this.form.pista);
      // La doble partida ocupa también la franja consecutiva (misma pista, +2 h).
      if (this.form.doblePartida) {
        const [h, m] = this.form.hora.split(':').map(Number);
        const horaSiguiente = `${String(h + 2).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
        this.slotsService.bloquear(this.form.fecha, horaSiguiente, this.form.pista);
      }
    }
    const hoy = new Date();
    const ds = `${hoy.getFullYear()}${String(hoy.getMonth()+1).padStart(2,'0')}${String(hoy.getDate()).padStart(2,'0')}`;
    const rand = String(Math.floor(Math.random() * 9000) + 1000);
    this.numeroReserva.set(`SDJ-${ds}-${rand}`);

    this.enviando.set(false);
    this.enviado.set(true);
    this.analytics.trackEvent('reserva_enviada', { tipo: this.form.tipo, personas: this.form.personas });

    // Abre solo el diálogo de imprimir/guardar como PDF, para que el cliente
    // no tenga que acordarse de pulsar "Guardar copia de la reserva". El
    // pequeño retraso deja que la pantalla de confirmación termine de
    // renderizarse antes de abrir el diálogo del navegador.
    if (this.isBrowser) setTimeout(() => this.imprimirResumen(), 400);
  }

  // Permite empezar una reserva nueva sin esperar a una sesión distinta
  // (p. ej. un cliente que ya reservó y quiere reservar otro día para otro grupo).
  nuevaReserva() {
    this.state.reset();
    if (this.isBrowser) window.scrollTo({ top: 0, behavior: 'instant' });
  }

  ngOnDestroy() {
    clearTimeout(this.personasAvisoTimeout);
    if (!this.enviado() && this.paso() >= 2) {
      this.analytics.trackEvent('reserva_abandonada', { paso: this.paso(), tipo: this.form.tipo });
    }
  }

  imprimirResumen() {
    this.analytics.trackEvent('reserva_pdf_descargado', { tipo: this.form.tipo });
    const ocultar = ['app-header', 'app-footer', 'app-whatsapp-button', 'app-cookie-banner', '.reserva-exito']
      .map(s => document.querySelector(s) as HTMLElement | null)
      .filter((el): el is HTMLElement => !!el);

    ocultar.forEach(el => (el.style.display = 'none'));
    window.print();
    ocultar.forEach(el => (el.style.display = ''));
  }

  get horaFin(): string {
    if (!this.form.hora) return '—';
    const [h, m] = this.form.hora.split(':').map(Number);
    // Doble partida = 3 h de juego (la partida no dura las 2 h del hueco).
    const fin = new Date(); fin.setHours(h + (this.form.doblePartida ? 3 : 2), m);
    return `${String(fin.getHours()).padStart(2,'0')}:${String(fin.getMinutes()).padStart(2,'0')}`;
  }

  // Fechas de inicio/fin del evento de calendario (compartidas por Google
  // Calendar y el .ics): con franja horaria si la reserva la tiene, o evento
  // de día completo si no (p. ej. partida abierta individual sin franja).
  private eventoFechas(): { allDay: boolean; inicio: Date; fin: Date } {
    const [y, m, d] = this.form.fecha.split('-').map(Number);
    if (this.form.hora) {
      const [h, min]   = this.form.hora.split(':').map(Number);
      const [hf, minf] = this.horaFin.split(':').map(Number);
      return { allDay: false, inicio: new Date(y, m - 1, d, h, min), fin: new Date(y, m - 1, d, hf, minf) };
    }
    return { allDay: true, inicio: new Date(y, m - 1, d), fin: new Date(y, m - 1, d + 1) };
  }

  private eventoTitulo(): string {
    return `Reserva SDJ Airsoft · ${this.resumen.tipo}`;
  }

  private eventoUbicacion(): string {
    return 'Barrio Legina S/N, 48195 Larrabetzu, Bizkaia';
  }

  private eventoDetalles(): string {
    return [
      `Reserva nº ${this.numeroReserva()}`,
      `Personas: ${this.form.personas}`,
      this.resumen.modalidad ? `Modalidad: ${this.resumen.modalidad}` : '',
      'Dudas o cambios: 688 731 474',
    ].filter(Boolean).join('\n');
  }

  // Enlace para que el cliente añada la reserva a su propio Google Calendar
  // (sin backend: Google rellena el evento a partir de los parámetros de la URL).
  get googleCalendarUrl(): string {
    const { allDay, inicio, fin } = this.eventoFechas();
    const pad = (n: number) => String(n).padStart(2, '0');
    const fechaCompacta = (dt: Date) => `${dt.getFullYear()}${pad(dt.getMonth() + 1)}${pad(dt.getDate())}`;
    const fmtUtc = (dt: Date) => dt.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    const dates = allDay ? `${fechaCompacta(inicio)}/${fechaCompacta(fin)}` : `${fmtUtc(inicio)}/${fmtUtc(fin)}`;

    const params = new URLSearchParams({
      action: 'TEMPLATE',
      text: this.eventoTitulo(),
      dates,
      details: this.eventoDetalles(),
      location: this.eventoUbicacion(),
    });
    return `https://www.google.com/calendar/render?${params.toString()}`;
  }

  // Descarga un .ics (formato iCalendar) para Apple Calendar, Outlook y
  // cualquier otra app que no use el enlace directo de Google Calendar.
  descargarIcs() {
    const { allDay, inicio, fin } = this.eventoFechas();
    const pad = (n: number) => String(n).padStart(2, '0');
    const fechaCompacta = (dt: Date) => `${dt.getFullYear()}${pad(dt.getMonth() + 1)}${pad(dt.getDate())}`;
    const fmtUtc = (dt: Date) => dt.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    const escapar = (s: string) => s.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;');

    const dtstart = allDay ? `DTSTART;VALUE=DATE:${fechaCompacta(inicio)}` : `DTSTART:${fmtUtc(inicio)}`;
    const dtend   = allDay ? `DTEND;VALUE=DATE:${fechaCompacta(fin)}`     : `DTEND:${fmtUtc(fin)}`;

    const contenido = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//SDJ Airsoft//Reserva//ES',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      `UID:${this.numeroReserva()}@soldadosdejuguete.com`,
      `DTSTAMP:${fmtUtc(new Date())}`,
      dtstart,
      dtend,
      `SUMMARY:${escapar(this.eventoTitulo())}`,
      `DESCRIPTION:${escapar(this.eventoDetalles())}`,
      `LOCATION:${escapar(this.eventoUbicacion())}`,
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');

    const blob = new Blob([contenido], { type: 'text/calendar;charset=utf-8' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `reserva-sdj-${this.numeroReserva()}.ics`;
    a.click();
    URL.revokeObjectURL(url);
    this.analytics.trackEvent('reserva_ics_descargado');
  }

  get totalReserva(): string {
    if (this.form.tipo === 'txiki') {
      const total = (19 + (this.form.merienda ? 9.90 : 0)) * this.form.personas;
      return total.toFixed(2).replace('.', ',');
    }
    if (this.form.tarifaReducida) return this.tarifaReducidaTotal;
    const precios: Record<string, number> = {
      simple:              19.90,
      alquiler:            this.form.premium ? 44.90 : 39.90,
      'reducida-simple':   14.90,
      'reducida-alquiler': 29.90,
    };
    const base = precios[this.form.modalidad];
    if (!base) return 'A consultar';
    return (base * this.form.personas).toFixed(2).replace('.', ',');
  }

  // Total formateado (sin "€" si es a consultar).
  get totalReservaTxt(): string {
    const t = this.totalReserva;
    return t === 'A consultar' ? t : `${t} €`;
  }

  // Desglose del importe por líneas (concepto · importe) para el PDF.
  get desglose(): { concepto: string; importe: string }[] {
    const n = this.form.personas;
    const fmt = (v: number) => `${v.toFixed(2).replace('.', ',')} €`;
    const lineas: { concepto: string; importe: string }[] = [];

    if (this.form.tipo === 'txiki') {
      lineas.push({ concepto: `Txikipaintball · 19 € × ${n}`, importe: fmt(19 * n) });
      if (this.form.merienda) lineas.push({ concepto: `Merienda infantil · 9,90 € × ${n}`, importe: fmt(9.90 * n) });
      return lineas;
    }

    if (this.form.tipo === 'individual') {
      if (this.form.tarifaReducida) {
        lineas.push({ concepto: `Tarifa reducida ${this.equipoReducidaLabel} · ${this.precioReducidaFmt} € × ${n}`, importe: fmt(this.precioReducida * n) });
      } else {
        const precios: Record<string, number> = { simple: 19.90, alquiler: this.form.premium ? 44.90 : 39.90 };
        const base = precios[this.form.modalidad];
        const label = this.packLabels[this.form.modalidad] || 'Entrada';
        lineas.push(base ? { concepto: `${label} · ${fmt(base)} × ${n}`, importe: fmt(base * n) } : { concepto: 'Entrada', importe: 'A consultar' });
      }
      return lineas;
    }

    // Grupos (privada / evento): base a consultar + extras conocidos.
    lineas.push({ concepto: `${this.tipoNombres[this.form.tipo]} · ${n} personas`, importe: 'A consultar' });
    if (this.form.doblePartida) lineas.push({ concepto: `Doble partida · +15 € × ${n}`, importe: fmt(15 * n) });
    if (this.form.menu) lineas.push({ concepto: 'Menú', importe: 'Por confirmar' });
    return lineas;
  }

  get alquilerEquipo(): string {
    if (this.form.tipo === 'txiki') return 'Incluido';
    return this.form.modalidad?.includes('alquiler') || this.form.premium ? 'Sí' : 'No';
  }

  formatFecha(fecha: string): string {
    if (!fecha) return '';
    const [y, m, d] = fecha.split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
  }
}
