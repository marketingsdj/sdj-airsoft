import { Component, HostListener, OnInit, OnDestroy, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, Router, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Subscription, filter } from 'rxjs';

export interface Brand {
  label: string;
  active?: boolean;
  disabled?: boolean;
  url?: string;
}

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

  enTxiki = signal(false);

  ngOnInit() {
    this.actualizarMarca(this.router.url);
    this.routerSub = this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe(e => {
        this.menuOpen.set(false);
        this.actualizarMarca((e as NavigationEnd).urlAfterRedirects);
      });
  }

  private actualizarMarca(url: string) {
    this.enTxiki.set(url.startsWith('/txikipaintball'));
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

  // La marca activa depende de la página: en txikipaintball se activa esa y
  // "Airsoft" pasa a ser un enlace a la home de SDJ (y viceversa).
  get brands(): Brand[] {
    const txiki = this.enTxiki();
    return [
      { label: 'Airsoft',        active: !txiki, url: txiki ? '/' : undefined },
      { label: 'Txikipaintball', active: txiki,  url: txiki ? undefined : '/txikipaintball' },
      { label: 'Restaurante',    url: 'https://elbarraconrestaurante.com/' },
    ];
  }


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
