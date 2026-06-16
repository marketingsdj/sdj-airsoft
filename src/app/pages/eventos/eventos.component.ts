import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { EventoContactoComponent } from './shared/evento-contacto.component';

@Component({
  selector: 'app-eventos',
  imports: [RouterLink, EventoContactoComponent],
  templateUrl: './eventos.component.html',
  styleUrl: './eventos.component.scss'
})
export class EventosComponent {
  tipos = [
    { key: 'despedidas', ruta: '/eventos/despedidas', icono: '◉', titulo: 'Despedidas', tagline: 'Despedidas que no son la típica.', placeholder: 'FOTO DESPEDIDA' },
    { key: 'cumples', ruta: '/eventos/cumpleanos', icono: '◆', titulo: 'Cumpleaños', tagline: 'Que se cuentan solos.', placeholder: 'FOTO CUMPLEAÑOS' },
    { key: 'empresas', ruta: '/eventos/empresas', icono: '◈', titulo: 'Empresas', tagline: 'Team building con risa.', placeholder: 'FOTO EMPRESAS' },
    { key: 'colectivos', ruta: '/eventos/colectivos', icono: '◎', titulo: 'Colectivos', tagline: 'Excursiones que no aburren.', placeholder: 'FOTO COLECTIVOS' },
  ];

  diasGrandes = [
    {
      mes: 'Enero', titulo: 'Reyes / Inicio de año', tipo: 'especial',
      eventos: [
        { nombre: 'Especial Reyes', fecha: '6 de enero', desc: 'Jornada festiva con alta participación.' },
        { nombre: 'Inicio de temporada', desc: 'Ambiente "after fiestas". Partidas normales de fin de semana.' },
      ]
    },
    {
      mes: 'Febrero', titulo: 'San Valentín', tipo: 'normal',
      eventos: [
        { nombre: 'OP temática', desc: 'Misiones rápidas en pareja o por equipos. Ambiente divertido y ligero.' },
      ]
    },
    {
      mes: 'Marzo – Abril', titulo: 'Semana Santa', tipo: 'especial',
      eventos: [
        { nombre: 'Gran pico de juego', desc: 'Partidas abiertas todos los festivos.' },
        { nombre: 'OPs guionizadas', desc: 'Posibles operativos de varios días con narrativa.' },
      ]
    },
    {
      mes: 'Junio – Agosto', titulo: 'Verano', tipo: 'especial',
      eventos: [
        { nombre: 'Temporada fuerte', desc: 'Partidas abiertas casi todos los fines de semana.' },
        { nombre: 'OPs grandes de verano', desc: 'Juegos más largos, con más jugadores y ambientación especial.' },
        { nombre: 'Fiestas de Larrabetzu', fecha: 'Agosto', desc: 'Coincide con las fiestas locales. Alta actividad en la zona.' },
      ]
    },
    {
      mes: 'Septiembre', titulo: 'Inicio de curso', tipo: 'normal',
      eventos: [
        { nombre: 'Vuelta a la actividad', desc: 'Partidas abiertas regulares tras el verano.' },
        { nombre: 'OP de reactivación', desc: 'Operativo especial para arrancar la temporada de otoño.' },
      ]
    },
    {
      mes: 'Octubre', titulo: 'Halloween', tipo: 'estrella',
      eventos: [
        { nombre: 'Evento estrella del año', desc: 'Escenarios tematizados de terror: nocturnas o semi-nocturnas.' },
        { nombre: 'Misiones especiales', desc: 'Ambientación, maquillaje y narrativa de terror. El evento con más asistencia del año.' },
      ]
    },
    {
      mes: 'Diciembre', titulo: 'Navidad / Fin de año', tipo: 'especial',
      eventos: [
        { nombre: 'Partidas navideñas', desc: 'Juegos con temática festiva. Ambiente social, más relajado que competitivo.' },
        { nombre: 'Fin de temporada', desc: 'Partida especial de cierre de año con toda la comunidad SDJ.' },
      ]
    },
  ];
}
