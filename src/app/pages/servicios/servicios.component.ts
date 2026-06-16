import { Component } from '@angular/core';
import { UpperCasePipe } from '@angular/common';

@Component({
  selector: 'app-servicios',
  imports: [UpperCasePipe],
  templateUrl: './servicios.component.html',
  styleUrl: './servicios.component.scss'
})
export class ServiciosComponent {
  servicios = [
    {
      icono: '☕',
      eyebrow: 'CAFETERÍA',
      titulo: 'Comer y reponer.',
      desc: 'Abierta durante toda la jornada de juego. Bocadillos, raciones, bebidas frías y calientes. Catering disponible para eventos privados.',
      detalle: ['Bocadillos y pinchos', 'Raciones calientes', 'Bebidas frías y calientes', 'Catering para eventos bajo petición']
    },
    {
      icono: '🅿',
      eyebrow: 'PARKING',
      titulo: 'Aparca y olvídate.',
      desc: 'Parking gratuito con capacidad amplia directamente en el campo. Sin preocuparte de dónde dejar el coche.',
      detalle: ['Gratuito siempre', 'Capacidad para 80+ vehículos', 'Acceso directo al campo', 'Zona especial para autobuses y furgonetas']
    },
    {
      icono: '🚿',
      eyebrow: 'VESTUARIOS',
      titulo: 'Llegas con traje,<br>sales con barro.',
      desc: 'Instalaciones completas para prepararte antes y recuperarte después de la partida.',
      detalle: ['Vestuarios separados (H/M)', 'Taquillas con llave', 'Duchas calientes', 'Baños accesibles']
    },
  ];
}
