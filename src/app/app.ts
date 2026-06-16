import { Component, OnInit, HostListener } from '@angular/core';
import { Router, NavigationEnd, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs/operators';
import { HeaderComponent } from './core/header/header.component';
import { FooterComponent } from './core/footer/footer.component';
import { WhatsappButtonComponent } from './core/whatsapp-button/whatsapp-button.component';
import { CookieBannerComponent } from './core/cookie-banner/cookie-banner.component';
import { AnalyticsService } from './core/services/analytics.service';
import { ScrollRestorationService } from './core/services/scroll-restoration.service';
import { SeoService } from './core/services/seo.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, HeaderComponent, FooterComponent, WhatsappButtonComponent, CookieBannerComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnInit {
  constructor(
    private router: Router,
    private analytics: AnalyticsService,
    private scrollRestoration: ScrollRestorationService,
    private seo: SeoService
  ) {}

  ngOnInit() {
    this.analytics.initIfConsented();
    this.scrollRestoration.init();

    this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe(e => {
        const url = (e as NavigationEnd).urlAfterRedirects;
        this.analytics.trackPage(url);
        this.seo.updateForUrl(url);
      });
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(e: MouseEvent) {
    const a = (e.target as HTMLElement).closest('a');
    if (!a) return;
    const href = a.href || '';

    if (href.includes('wa.me')) {
      const page = this.router.url.split('?')[0];
      if (href.includes('Vale%2010') || href.includes('Vale+10')) {
        this.analytics.trackEvent('bono_click', { bono: 'vale_10' });
      } else if (href.includes('Bono%203') || href.includes('Bono+3')) {
        this.analytics.trackEvent('bono_click', { bono: 'bono_3' });
      } else if (href.includes('socio')) {
        this.analytics.trackEvent('socio_interes', { origen: page });
      }
      this.analytics.trackEvent('whatsapp_click', { page });
    } else if (href.includes('maps.google.com') || href.includes('maps.app.goo')) {
      this.analytics.trackEvent('maps_click', { page: this.router.url });
    } else if (href.includes('instagram.com')) {
      this.analytics.trackEvent('rrss_click', { red: 'instagram' });
    } else if (href.includes('tiktok.com')) {
      this.analytics.trackEvent('rrss_click', { red: 'tiktok' });
    } else if (href.includes('youtube.com')) {
      this.analytics.trackEvent('rrss_click', { red: 'youtube' });
    } else if (href.includes('facebook.com')) {
      this.analytics.trackEvent('rrss_click', { red: 'facebook' });
    } else if (href.includes('t.me')) {
      this.analytics.trackEvent('rrss_click', { red: 'telegram' });
    }
  }
}
