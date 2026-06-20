import { Component, signal, OnInit, OnDestroy, AfterViewInit, ElementRef, ViewChild, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AnalyticsService } from '../../core/services/analytics.service';

@Component({
  selector: 'app-home',
  imports: [RouterLink],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('heroVideo') heroVideo!: ElementRef<HTMLVideoElement>;
  publicoActivo = signal('');
  kitActivo = signal(0);
  kitImagenes = [
    { src: 'Inicio/Kit%20inicio/Kit%20de%20inicio%202.svg', alt: 'Kit de inicio SDJ — equipamiento completo' },
    { src: 'Inicio/Kit%20inicio/Kit%20de%20Inicio.svg', alt: 'Kit de inicio SDJ' },
    { src: 'Inicio/Kit%20inicio/Kit-Basico-Gafas-Mascara.svg', alt: 'Kit básico — gafas y máscara SDJ' },
  ];

  private kitTimer: any;
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  ngAfterViewInit() {
    if (this.isBrowser) {
      this.heroVideo?.nativeElement.play().catch(() => { });
    }
  }

  ngOnInit() {
    if (!this.isBrowser) return;
    this.kitTimer = setInterval(() => {
      this.kitActivo.update(i => (i + 1) % this.kitImagenes.length);
    }, 3000);
  }

  ngOnDestroy() {
    clearInterval(this.kitTimer);
  }

  private analytics = inject(AnalyticsService);

  seleccionarPublico(key: string) {
    this.publicoActivo.set(this.publicoActivo() === key ? '' : key);
    if (this.publicoActivo()) {
      this.analytics.trackEvent('publico_seleccionado', { publico: key });
    }
  }

  onHeroCtaClick() {
    this.analytics.trackEvent('cta_hero_click', { pagina: 'home' });
  }

  publicos = [
    { key: 'primera', icon: '◎', titulo: 'Es mi primera vez', desc: 'Alquilas el equipo y un monitor te acompaña.', link: '/reserva' },
    { key: 'grupo', icon: '◈', titulo: 'Vengo con grupo', desc: 'A partir de 8 personas tenéis el campo para vosotros, gratis con monitor.', link: '/partidas' },
    { key: 'peques', icon: '◉', titulo: 'Vengo con peques', desc: 'Para menores de edad tenemos Txikipaintball, la alternativa familiar.', link: '#', externo: true },
    { key: 'jugado', icon: '◆', titulo: 'Ya he jugado antes', desc: 'Juegas de vez en cuando o vienes de otro campo. Descubre lo que te estás perdiendo.', link: '/tarifas' },
  ];

  private generarPartidas() {
    const modos = ['Captura de bandera', 'Dominación', 'Eliminación', 'Milsim corto'];
    const partidas = [];
    const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
    const cursor = new Date(hoy);
    let idx = 0;
    while (partidas.length < 2) {
      const dow = cursor.getDay();
      if (dow === 6 || dow === 0) {
        partidas.push({
          fecha: cursor.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' }),
          hora: '09:00',
          tipo: 'Partida abierta',
          modo: modos[idx % modos.length],
          plazas: 30,
          total: 30,
        });
        idx++;
      }
      cursor.setDate(cursor.getDate() + 1);
    }
    return partidas;
  }

  partidas = this.generarPartidas();

  faqs = [
    { q: '¿Duele?', a: 'Pica, sí. Como una goma elástica fuerte. El 90% no se siente en calor de partida. Con el equipo de protección adecuado —que está incluido en el alquiler— es perfectamente tolerable.' },
    { q: '¿Necesito equipo?', a: 'No. Tenemos equipo completo en alquiler: réplica, gafas homologadas, chaleco táctico y munición ilimitada. Solo necesitas ropa cómoda y calzado deportivo.' },
    { q: '¿Hay edad mínima?', a: 'Para el campo de airsoft se necesita autorización del tutor si eres menor de edad. Para los más pequeños tenemos Txikipaintball, con una edad mínima inferior.' },
    { q: '¿Puedo venir solo?', a: 'Totalmente. En las partidas abiertas juegas junto a otros jugadores del campo. No necesitas venir con grupo. Muchos de nuestros jugadores habituales vinieron solos la primera vez.' },
  ];

  readonly TRUNCAR_LIMIT = 150;
  readonly MAPS_URL = 'https://maps.app.goo.gl/tsPKQynzoZegs8tt6';
  testimonioActivo = signal(0);

  testimonioAnterior() {
    this.testimonioActivo.update(i => i === 0 ? this.testimonios.length : i - 1);
  }
  testimonioSiguiente() {
    this.testimonioActivo.update(i => i === this.testimonios.length ? 0 : i + 1);
  }

  testimonios = [
    {
      texto: 'Un sitio ideal para practicar airsoft, tanto partidas públicas y privadas. Por 40€ te alquilan todo (con munición infinita) y pasas todo el día, 20€ si tienes el equipo. Atención inmejorable y ambiente muy sano.',
      autor: 'Carlos C.',
      url: 'https://maps.app.goo.gl/zbXxsExMHtmP5GJMA'
    },
    {
      texto: 'El campo está muy bien, el personal es agradable, dispone de duchas y vestuario, bar con variedad de pinchos y platos para comer. Recomendable 100%',
      autor: 'Dani Morales',
      url: 'https://maps.app.goo.gl/dcNZS6yFg4pZFc9A9'
    },
    {
      texto: 'Una experiencia muy interesante, todas las normas bien explicadas. No había jugado nunca pero me ha gustado, personal muy amable e instalaciones tanto interiores como exteriores muy bien preparadas. Juegos muy entretenidos y bien dirigidos.',
      autor: 'Asier Fernandez',
      url: 'https://maps.app.goo.gl/bsizFRetpr95awdXA'
    },
    {
      texto: 'La tienda es estupenda, el trato de los encargados con los clientes no puede ser mejor. Te explican todo al detalle, que comprar, el por qué, con una sinceridad que dan ganas de quedarte hablando con ellos todo el día solo para disfrutar y escuchar de todo lo que saben del mundo del Airsoft. ¡Os doy mi enhorabuena!',
      autor: 'Eduardo Zulaica',
      url: 'https://maps.app.goo.gl/Ty76d2Eg8d2P8HvQ6'
    },
    {
      texto: 'Campo completo para la práctica de airsoft, a destacar que tiene zona de ducha para después de las partidas con toallas incluidas y una zona de restauración muy completa y de buena calidad.',
      autor: 'Angel Pumuki',
      url: 'https://maps.app.goo.gl/vknvxdaKDvvKLdwb7'
    },
  ];

  textoVisible(texto: string): string {
    return texto.length > this.TRUNCAR_LIMIT
      ? texto.slice(0, this.TRUNCAR_LIMIT).trimEnd() + '…'
      : texto;
  }

  necesitaTruncar(texto: string): boolean {
    return texto.length > this.TRUNCAR_LIMIT;
  }

}
