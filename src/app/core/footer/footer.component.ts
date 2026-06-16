import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-footer',
  imports: [RouterLink],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.scss'
})
export class FooterComponent {
  year = new Date().getFullYear();

  nav = [
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
