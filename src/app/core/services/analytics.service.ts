import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

// Google Analytics 4 (propiedad de soldadosdejuguete.com · cuenta 396913889).
const GA_ID = 'G-6JZJLXTTB6';

@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  private readonly KEY = 'sdj_cookies';
  private loaded = false;
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  getConsent(): 'all' | 'necessary' | null {
    if (!this.isBrowser) return null;
    return sessionStorage.getItem(this.KEY) as 'all' | 'necessary' | null;
  }

  setConsent(value: 'all' | 'necessary') {
    if (!this.isBrowser) return;
    sessionStorage.setItem(this.KEY, value);
    if (value === 'all') this.loadGA();
  }

  initIfConsented() {
    if (this.getConsent() === 'all') this.loadGA();
  }

  trackPage(url: string) {
    if (!this.loaded) return;
    (window as any).gtag?.('event', 'page_view', { page_path: url });
  }

  trackEvent(name: string, params: Record<string, string | number> = {}) {
    if (!this.loaded) return;
    (window as any).gtag?.('event', name, params);
  }

  private loadGA() {
    if (this.loaded || !this.isBrowser) return;
    this.loaded = true;

    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
    document.head.appendChild(script);

    (window as any).dataLayer = (window as any).dataLayer || [];
    (window as any).gtag = function() {
      (window as any).dataLayer.push(arguments);
    };
    (window as any).gtag('js', new Date());
    (window as any).gtag('config', GA_ID, { send_page_view: false });
  }
}
