import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Location } from '@angular/common';

@Component({
  selector: 'app-cookies',
  imports: [RouterLink],
  templateUrl: './cookies.component.html',
  styleUrl: './cookies.component.scss'
})
export class CookiesComponent {
  private location = inject(Location);

  cerrar() {
    // Vuelve a la página anterior; si no hay historial, va a la home.
    if (history.length > 1) this.location.back();
    else this.location.go('/');
  }
}
