import { Injectable } from '@angular/core';
import { Router, NavigationStart, NavigationEnd, Scroll } from '@angular/router';
import { ViewportScroller } from '@angular/common';
import { filter, pairwise } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class ScrollRestorationService {
  private positions = new Map<string, [number, number]>();

  constructor(private router: Router, private scroller: ViewportScroller) {}

  init() {
    // Guarda la posición actual antes de cada navegación
    this.router.events
      .pipe(filter(e => e instanceof NavigationStart))
      .subscribe(() => {
        const url = this.router.url;
        const pos = this.scroller.getScrollPosition();
        this.positions.set(url, pos);
      });

    // Restaura la posición cuando se vuelve atrás (popstate)
    this.router.events
      .pipe(filter(e => e instanceof Scroll))
      .subscribe((e: any) => {
        if (e.position) {
          // Navegación atrás/adelante: espera a que el componente renderice
          setTimeout(() => {
            this.scroller.scrollToPosition(e.position);
          }, 80);
        } else if (e.anchor) {
          this.scroller.scrollToAnchor(e.anchor);
        } else {
          // Navegación nueva: arriba del todo
          this.scroller.scrollToPosition([0, 0]);
        }
      });
  }
}
