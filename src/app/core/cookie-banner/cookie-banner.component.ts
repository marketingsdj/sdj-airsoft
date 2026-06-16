import { Component, signal, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AnalyticsService } from '../services/analytics.service';

@Component({
  selector: 'app-cookie-banner',
  imports: [RouterLink],
  templateUrl: './cookie-banner.component.html',
  styleUrl: './cookie-banner.component.scss'
})
export class CookieBannerComponent implements OnInit {
  visible = signal(false);
  detalle = signal(false);

  constructor(private analytics: AnalyticsService) {}

  ngOnInit() {
    if (!this.analytics.getConsent()) {
      setTimeout(() => this.visible.set(true), 800);
    }
  }

  aceptar() {
    this.analytics.setConsent('all');
    this.visible.set(false);
  }

  soloNecesarias() {
    this.analytics.setConsent('necessary');
    this.visible.set(false);
  }
}
