import { Injectable, inject } from '@angular/core';
import { Title, Meta } from '@angular/platform-browser';
import { DOCUMENT } from '@angular/common';

interface SeoData { title: string; description: string; }

/**
 * SEO on-page (estilo Yoast, hecho a mano para Angular): por cada ruta fija el
 * <title>, la meta description, Open Graph, Twitter Card y el <link canonical>.
 *
 * Es la única fuente de títulos y descripciones: los componentes no deben
 * llamar a Title/Meta por su cuenta (si no, <title> y og:title se desincronizan).
 *
 * URLs canónicas CON barra final: GitHub Pages sirve cada ruta prerenderizada
 * como carpeta (`/campo/index.html`) y redirige `/campo` → `/campo/` con 301,
 * así que el canonical tiene que ser la versión con barra para no apuntar a
 * una redirección. Los routerLink internos siguen sin barra (Angular la quita).
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
    '/tarifas':             { title: 'Tarifas y precios de airsoft en Bizkaia | SDJ', description: 'Precios de las partidas de airsoft: entrada, alquiler de equipo, tarifa reducida, bonos y membresía anual.' },
    '/eventos':             { title: 'Eventos y celebraciones de airsoft | SDJ', description: 'Despedidas, cumpleaños, team building y colectivos en nuestro campo de airsoft de Larrabetzu, Bizkaia.' },
    '/eventos/despedidas':  { title: 'Despedidas de soltero/a en Bilbao | Airsoft en SDJ Larrabetzu', description: 'Despedida de soltero/a cerca de Bilbao: airsoft en campo privado de 45.000 m² en Larrabetzu. Equipo completo incluido, desde 8 personas, 39,90 €/persona.' },
    '/eventos/cumpleanos':  { title: 'Cumpleaños diferente en Bilbao | Airsoft en SDJ Larrabetzu', description: 'Cumpleaños diferente cerca de Bilbao: airsoft en campo privado de 45.000 m² en Larrabetzu, con monitores y equipo incluido. Desde 8 personas, 39,90 €.' },
    '/eventos/empresas':    { title: 'Team building en Bilbao | Airsoft para empresas en SDJ Larrabetzu', description: 'Team building con airsoft para empresas en campo privado de 45.000 m² en Larrabetzu, cerca de Bilbao. De 8 a 120 personas, catering y parking.' },
    '/eventos/colectivos':  { title: 'Excursiones y colectivos en Bilbao | Airsoft en SDJ Larrabetzu', description: 'Excursiones de airsoft para institutos, escuelas, scouts y colectivos en campo privado de 45.000 m² en Larrabetzu, cerca de Bilbao. Desde 14 años.' },
    '/promos':              { title: 'Promociones y bonos de airsoft | SDJ', description: 'Bonos, vales y promociones para jugar al airsoft en SDJ. Aprovecha las ofertas.' },
    '/reserva':             { title: 'Reserva tu partida de airsoft online | SDJ', description: 'Reserva online tu partida de airsoft, evento privado o txikipaintball en Larrabetzu, Bizkaia.' },
    '/txikipaintball':      { title: 'Paintball para niños en Bizkaia (8-14 años) · Txikipaintball | SDJ', description: 'Paintball adaptado para niños de 8 a 14 años en Bizkaia. Monitores y equipo incluido.' },
    '/faq':                 { title: 'Preguntas frecuentes sobre airsoft | SDJ Airsoft', description: 'Resolvemos tus dudas sobre el airsoft: reservas, equipo, edad mínima y normas del campo.' },
    '/condiciones':         { title: 'Condiciones de reserva | SDJ Airsoft', description: 'Condiciones de reserva y participación en SDJ Airsoft.' },
    '/cookies':             { title: 'Política de cookies | SDJ Airsoft', description: 'Información sobre el uso de cookies en soldadosdejuguete.com.' },
    '/aviso-legal':         { title: 'Aviso legal | SDJ Airsoft', description: 'Aviso legal de Soldados de Juguete SL.' },
    '/privacidad':          { title: 'Política de privacidad | SDJ Airsoft', description: 'Cómo tratamos y protegemos tus datos personales en SDJ.' },
    '/cancelar':            { title: 'Cancelar reserva | SDJ Airsoft', description: 'Cancela tu reserva de airsoft con el código que recibiste al reservar.' },
    '/admin':               { title: 'Panel de gestión | SDJ', description: 'Panel interno de gestión de reservas.' },
  };

  private readonly NOT_FOUND: SeoData = {
    title: 'Página no encontrada | SDJ Airsoft',
    description: 'La página que buscas no existe o se ha movido. Vuelve al inicio del campo de airsoft SDJ.',
  };

  // Migas de pan de las subpáginas de eventos (BreadcrumbList).
  private readonly BREADCRUMB_EVENTOS: Record<string, string> = {
    '/eventos/despedidas': 'Despedidas',
    '/eventos/cumpleanos': 'Cumpleaños',
    '/eventos/empresas':   'Empresas',
    '/eventos/colectivos': 'Colectivos',
  };

  updateForUrl(url: string) {
    const path = (url.split('?')[0].split('#')[0]).replace(/\/+$/, '') || '/';
    const data = this.MAP[path];
    this.clearJsonLd(path);
    if (!data) {
      // Ruta desconocida (NotFoundComponent): título propio y sin canonical,
      // para no señalar la home como canónica de una página de error.
      this.apply(this.NOT_FOUND, null);
      return;
    }
    this.apply(data, this.absoluteUrl(path));
    if (this.BREADCRUMB_EVENTOS[path]) this.setBreadcrumb(path, this.BREADCRUMB_EVENTOS[path]);
  }

  /** URL canónica absoluta, con barra final. */
  absoluteUrl(path: string): string {
    return path === '/' ? `${this.BASE}/` : `${this.BASE}${path}/`;
  }

  /**
   * Inserta (o sustituye) un bloque JSON-LD propio de una página. `path` es la
   * ruta a la que pertenece: al navegar a otra ruta se elimina solo.
   */
  setJsonLd(key: string, data: object, path: string) {
    const id = `seo-jsonld-${key}`;
    let script = this.doc.getElementById(id) as HTMLScriptElement | null;
    if (!script) {
      script = this.doc.createElement('script');
      script.type = 'application/ld+json';
      script.id = id;
      this.doc.head.appendChild(script);
    }
    script.setAttribute('data-seo-path', path);
    script.textContent = JSON.stringify(data);
  }

  private clearJsonLd(currentPath: string) {
    this.doc.head.querySelectorAll('script[data-seo-path]').forEach(s => {
      if (s.getAttribute('data-seo-path') !== currentPath) s.remove();
    });
  }

  private setBreadcrumb(path: string, label: string) {
    this.setJsonLd('breadcrumb', {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Inicio',  item: this.absoluteUrl('/') },
        { '@type': 'ListItem', position: 2, name: 'Eventos', item: this.absoluteUrl('/eventos') },
        { '@type': 'ListItem', position: 3, name: label,     item: this.absoluteUrl(path) },
      ],
    }, path);
  }

  private apply(d: SeoData, url: string | null) {
    this.title.setTitle(d.title);
    this.meta.updateTag({ name: 'description', content: d.description });
    this.meta.updateTag({ property: 'og:title', content: d.title });
    this.meta.updateTag({ property: 'og:description', content: d.description });
    this.meta.updateTag({ property: 'og:type', content: 'website' });
    this.meta.updateTag({ property: 'og:site_name', content: this.SITE });
    this.meta.updateTag({ property: 'og:image', content: this.OG_IMG });
    this.meta.updateTag({ name: 'twitter:card', content: 'summary_large_image' });
    this.meta.updateTag({ name: 'twitter:title', content: d.title });
    this.meta.updateTag({ name: 'twitter:description', content: d.description });
    this.meta.updateTag({ name: 'twitter:image', content: this.OG_IMG });
    if (url) {
      this.meta.updateTag({ property: 'og:url', content: url });
      this.setCanonical(url);
      // Si se viene de una 404 en la misma sesión, el noindex no debe quedarse.
      this.meta.removeTag("name='robots'");
    } else {
      this.meta.removeTag("property='og:url'");
      this.doc.querySelector("link[rel='canonical']")?.remove();
      this.meta.updateTag({ name: 'robots', content: 'noindex' });
    }
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
