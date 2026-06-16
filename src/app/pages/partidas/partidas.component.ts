import { Component, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DecimalPipe } from '@angular/common';

@Component({
  selector: 'app-partidas',
  imports: [RouterLink, DecimalPipe],
  templateUrl: './partidas.component.html',
  styleUrl: './partidas.component.scss'
})
export class PartidasComponent {
  formas = [
    {
      tipo: 'ABIERTA',
      icono: '◎',
      titulo: 'Partida abierta',
      desc: 'Te apuntas tú solo. Compras tu plaza, te asignamos equipo si lo necesitas y juegas con más gente del campo.'
    },
    {
      tipo: 'PRIVADA',
      icono: '◈',
      titulo: 'Partida privada',
      desc: 'Reservas el campo entero. A partir de 8 personas, decidís horario y modo. Monitor incluido gratis.'
    },
    {
      tipo: 'EVENTO',
      icono: '◆',
      titulo: 'Evento especial',
      desc: 'Días grandes: operativos largos, milsim, tematizadas. Consulta el calendario de eventos especiales.'
    },
  ];

  readonly PAGE_SIZE = 4;
  readonly Math = Math;
  pagina = signal(0);

  private modos = ['Captura de bandera', 'Dominación', 'Eliminación', 'Milsim corto'];

  // Genera automáticamente los próximos fines de semana desde hoy
  todasLasPartidas = this.generarPartidas(24);

  partidasPagina = computed(() => {
    const start = this.pagina() * this.PAGE_SIZE;
    return this.todasLasPartidas.slice(start, start + this.PAGE_SIZE);
  });

  hayAnterior = computed(() => this.pagina() > 0);
  haySiguiente = computed(() => (this.pagina() + 1) * this.PAGE_SIZE < this.todasLasPartidas.length);

  siguiente() { if (this.haySiguiente()) this.pagina.update(p => p + 1); }
  anterior()  { if (this.hayAnterior())  this.pagina.update(p => p - 1); }

  private generarPartidas(cantidad: number) {
    const partidas = [];
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const cursor = new Date(hoy);
    let modoIdx = 0;

    while (partidas.length < cantidad) {
      const dia = cursor.getDay();
      if (dia === 6 || dia === 0) {
        partidas.push({
          fecha: cursor.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' }),
          hora: '09:00',
          modo: this.modos[modoIdx % this.modos.length],
          tipo: 'Abierta',
          plazas: 30,
          total: 30,
          precio: 39.90,
        });
        modoIdx++;
      }
      cursor.setDate(cursor.getDate() + 1);
    }
    return partidas;
  }

  diasGrandes = [
    {
      mes: 'Enero',
      icono: '🎆',
      titulo: 'Reyes / Inicio de año',
      tipo: 'especial',
      eventos: [
        { nombre: 'Especial Reyes', fecha: '6 de enero', desc: 'Jornada festiva con alta participación.' },
        { nombre: 'Inicio de temporada', desc: 'Ambiente "after fiestas". Partidas normales de fin de semana.' },
      ]
    },
    {
      mes: 'Febrero',
      icono: '💘',
      titulo: 'San Valentín',
      tipo: 'normal',
      eventos: [
        { nombre: 'OP temática', desc: 'Misiones rápidas en pareja o por equipos. Ambiente más divertido y ligero.' },
      ]
    },
    {
      mes: 'Marzo – Abril',
      icono: '🌸',
      titulo: 'Semana Santa',
      tipo: 'especial',
      eventos: [
        { nombre: 'Gran pico de juego', desc: 'Partidas abiertas todos los festivos.' },
        { nombre: 'OPs guionizadas', desc: 'Posibles operativos de varios días con narrativa.' },
      ]
    },
    {
      mes: 'Junio – Agosto',
      icono: '☀️',
      titulo: 'Verano',
      tipo: 'especial',
      eventos: [
        { nombre: 'Temporada fuerte', desc: 'Partidas abiertas casi todos los fines de semana.' },
        { nombre: 'OPs grandes de verano', desc: 'Juegos más largos, con más jugadores y ambientación especial.' },
        { nombre: 'Fiestas de Larrabetzu', fecha: 'Agosto', desc: 'Coincide con las fiestas locales. Alta actividad en la zona.' },
      ]
    },
    {
      mes: 'Septiembre',
      icono: '🎯',
      titulo: 'Inicio de curso',
      tipo: 'normal',
      eventos: [
        { nombre: 'Vuelta a la actividad', desc: 'Partidas abiertas regulares tras el verano.' },
        { nombre: 'OP de reactivación', desc: 'Operativo especial para arrancar la temporada de otoño.' },
      ]
    },
    {
      mes: 'Octubre',
      icono: '🎃',
      titulo: 'Halloween',
      tipo: 'estrella',
      eventos: [
        { nombre: 'Evento estrella del año', desc: 'Escenarios tematizados de terror: nocturnas o semi-nocturnas.' },
        { nombre: 'Misiones especiales', desc: 'Ambientación, maquillaje y narrativa de terror. El evento con más asistencia del año.' },
      ]
    },
    {
      mes: 'Diciembre',
      icono: '🎄',
      titulo: 'Navidad / Fin de año',
      tipo: 'especial',
      eventos: [
        { nombre: 'Partidas navideñas', desc: 'Juegos con temática festiva. Ambiente social, más relajado que competitivo.' },
        { nombre: 'Fin de temporada', desc: 'Partida especial de cierre de año con toda la comunidad SDJ.' },
      ]
    },
  ];

  // TODO: cliente — nombres reales y fotos de monitores
}
