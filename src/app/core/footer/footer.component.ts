import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AnalyticsService } from '../services/analytics.service';

@Component({
  selector: 'app-footer',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.scss'
})
export class FooterComponent {
  private analytics = inject(AnalyticsService);
  year = new Date().getFullYear();

  // Registra en GA4 el clic en cada red social (usa la cookie analítica ya existente)
  clickRed(red: string) {
    this.analytics.trackEvent('click_red_social', { red });
  }

  nav = [
    { label: 'SDJ', path: '/' },
    { label: 'Campo', path: '/campo' },
    { label: 'Partidas', path: '/partidas' },
    { label: 'Tarifas', path: '/tarifas' },
    { label: 'Eventos', path: '/eventos' },
    { label: 'Promos', path: '/promos' },
    { label: 'FAQ', path: '/faq' },
    { label: 'Reserva', path: '/reserva' },
  ];

  marcas = [
    { label: 'SDJ Airsoft', url: null, internal: false },
    { label: 'Txikipaintball', url: '/txikipaintball', internal: true },
    { label: 'Restaurante', url: 'https://elbarraconrestaurante.com/', internal: false },
  ];

  rrss = [
    { label: 'Instagram', url: 'https://www.instagram.com/sdj_airsoft/', icon: 'IG' },
    { label: 'TikTok', url: 'https://www.tiktok.com/@sdj_airsoft', icon: 'TK' },
    { label: 'YouTube', url: 'https://www.youtube.com/@sdjairsoft', icon: 'YT' },
  ];
}
