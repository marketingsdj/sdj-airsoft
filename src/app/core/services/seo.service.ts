import { Injectable, inject } from '@angular/core';
import { Title, Meta } from '@angular/platform-browser';
import { DOCUMENT } from '@angular/common';

interface SeoData { title: string; description: string; }

/**
 * SEO on-page (estilo Yoast, hecho a mano para Angular): por cada ruta fija el
 * <title>, la meta description, Open Graph, Twitter Card y el <link canonical>.
 */
@Injectable({ providedIn: 'root' })
export class SeoService {
  private title = inject(Title);
  private meta  = inject(Meta);
  private doc   = inject(DOCUMENT);

  private readonly SITE   = 'SDJ Airsoft';
  private readonly BASE   = 'https://www.soldadosdejuguete.com';
  private readonly OG_IMG = `${this.BASE}/og-image.jpg`;

  private readonly MAP: Record<string, SeoData> = {
    '/':                    { title: 'Campo de airsoft y paintball en Bizkaia | SDJ Soldados de Juguete', description: 'El campo de airsoft más grande del norte, en Larrabetzu (Bizkaia). Partidas abiertas, privadas, eventos y txikipaintball. Reserva tu partida online.' },
    '/campo':               { title: 'El campo de airsoft | SDJ Larrabetzu, Bizkaia', description: 'Descubre nuestro campo de airsoft en Larrabetzu (Bizkaia): zonas de juego, mapa e instalaciones para vivir la partida.' },
    '/partidas':            { title: 'Partidas de airsoft: abiertas y privadas | SDJ', description: 'Partidas abiertas y privadas de airsoft en Bizkaia. Dinámicas cada hora, horarios y cómo se juega. Reserva la tuya.' },
    '/tarifas':             { title: 'Tarifas y precios de airsoft | SDJ', description: 'Precios de las partidas de airsoft: entrada, alquiler de equipo, tarifa reducida, bonos y membresía anual.' },
    '/eventos':             { title: 'Eventos y celebraciones de airsoft | SDJ', description: 'Despedidas, cumpleaños, team building y colectivos en nuestro campo de airsoft de Larrabetzu, Bizkaia.' },
    '/eventos/despedidas':  { title: 'Despedidas de soltero/a con airsoft | SDJ', description: 'Organiza tu despedida jugando al airsoft en Larrabetzu (Bizkaia): campo exclusivo, grupos y menú.' },
    '/eventos/cumpleanos':  { title: 'Cumpleaños con airsoft | SDJ', description: 'Celebra tu cumpleaños jugando al airsoft en Bizkaia. Diversión para grupos y todas las edades.' },
    '/eventos/empresas':    { title: 'Team building de empresa con airsoft | SDJ', description: 'Actividades de team building con airsoft para empresas en Bizkaia. Refuerza tu equipo jugando.' },
    '/eventos/colectivos':  { title: 'Airsoft para colectivos y grupos | SDJ', description: 'Airsoft para colectivos, asociaciones y grupos grandes en Larrabetzu, Bizkaia.' },
    '/promos':              { title: 'Promociones y bonos de airsoft | SDJ', description: 'Bonos, vales y promociones para jugar al airsoft en SDJ. Aprovecha las ofertas.' },
    '/reserva':             { title: 'Reserva tu partida de airsoft online | SDJ', description: 'Reserva online tu partida de airsoft, evento privado o txikipaintball en Larrabetzu, Bizkaia.' },
    '/txikipaintball':      { title: 'Txikipaintball para peques (8-14) | SDJ', description: 'Paintball adaptado para niños de 8 a 14 años en Bizkaia. Monitores y equipo incluido.' },
    '/faq':                 { title: 'Preguntas frecuentes | SDJ Airsoft', description: 'Resolvemos tus dudas sobre el airsoft: reservas, equipo, edad mínima y normas del campo.' },
    '/condiciones':         { title: 'Condiciones de reserva | SDJ Airsoft', description: 'Condiciones de reserva y participación en SDJ Airsoft.' },
    '/cookies':             { title: 'Política de cookies | SDJ Airsoft', description: 'Información sobre el uso de cookies en soldadosdejuguete.com.' },
    '/aviso-legal':         { title: 'Aviso legal | SDJ Airsoft', description: 'Aviso legal de Soldados de Juguete SL.' },
    '/privacidad':          { title: 'Política de privacidad | SDJ Airsoft', description: 'Cómo tratamos y protegemos tus datos personales en SDJ.' },
  };

  updateForUrl(url: string) {
    const path = (url.split('?')[0].split('#')[0]) || '/';
    const data = this.MAP[path] ?? this.MAP['/'];
    this.apply(data, path === '/' ? '' : path);
  }

  private apply(d: SeoData, path: string) {
    const url = this.BASE + path;
    this.title.setTitle(d.title);
    this.meta.updateTag({ name: 'description', content: d.description });
    this.meta.updateTag({ property: 'og:title', content: d.title });
    this.meta.updateTag({ property: 'og:description', content: d.description });
    this.meta.updateTag({ property: 'og:url', content: url });
    this.meta.updateTag({ property: 'og:type', content: 'website' });
    this.meta.updateTag({ property: 'og:site_name', content: this.SITE });
    this.meta.updateTag({ property: 'og:image', content: this.OG_IMG });
    this.meta.updateTag({ name: 'twitter:card', content: 'summary_large_image' });
    this.meta.updateTag({ name: 'twitter:title', content: d.title });
    this.meta.updateTag({ name: 'twitter:description', content: d.description });
    this.meta.updateTag({ name: 'twitter:image', content: this.OG_IMG });
    this.setCanonical(url);
  }

  private setCanonical(url: string) {
    let link = this.doc.querySelector("link[rel='canonical']") as HTMLLinkElement | null;
    if (!link) {
      link = this.doc.createElement('link');
      link.setAttribute('rel', 'canonical');
      this.doc.head.appendChild(link);
    }
    link.setAttribute('href', url);
  }
}
