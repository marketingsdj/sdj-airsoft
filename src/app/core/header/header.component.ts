import { Component, HostListener, OnInit, OnDestroy, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, Router, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Subscription, filter } from 'rxjs';

@Component({
  selector: 'app-header',
  imports: [RouterLink, RouterLinkActive, CommonModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent implements OnInit, OnDestroy {
  scrolled = signal(false);
  menuOpen = signal(false);

  private routerSub!: Subscription;

  constructor(private router: Router) {}

  ngOnInit() {
    this.routerSub = this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe(() => this.menuOpen.set(false));
  }

  ngOnDestroy() {
    this.routerSub?.unsubscribe();
  }

  nav = [
    { label: 'Campo', path: '/campo' },
    { label: 'Partidas', path: '/partidas' },
    { label: 'Tarifas', path: '/tarifas' },
    { label: 'Eventos', path: '/eventos' },
    { label: 'Promos', path: '/promos' },
    { label: 'FAQ', path: '/faq' },
  ];

  brands: { label: string; active?: boolean; disabled?: boolean; url?: string }[] = [
    { label: 'Airsoft', active: true },
    { label: 'Txikipaintball', url: '/txikipaintball' },
    { label: 'Restaurante', url: 'https://elbarraconrestaurante.com/' },
  ];

  @HostListener('window:scroll')
  onScroll() {
    this.scrolled.set(window.scrollY > 20);
  }

  toggleMenu() {
    this.menuOpen.update(v => !v);
  }

  closeMenu() {
    this.menuOpen.set(false);
  }
}
