import { Component, signal } from '@angular/core';

@Component({
  selector: 'app-txiki-carrusel',
  imports: [],
  templateUrl: './txiki-carrusel.html',
  styleUrl: './txiki-carrusel.scss',
})
export class TxikiCarrusel {
  readonly imagenes = [1,2,3,4,5,6,7,8,9,10,11,12,13];
  activa = signal(0);

  anterior() {
    this.activa.update(i => (i - 1 + this.imagenes.length) % this.imagenes.length);
  }

  siguiente() {
    this.activa.update(i => (i + 1) % this.imagenes.length);
  }
}
