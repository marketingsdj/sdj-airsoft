import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { EventoContactoComponent } from './shared/evento-contacto.component';

@Component({
  selector: 'app-eventos',
  imports: [RouterLink, EventoContactoComponent],
  templateUrl: './eventos.component.html',
  styleUrl: './eventos.component.scss'
})
export class EventosComponent {
  activeCesion = signal<number | null>(null);

  toggleCesion(i: number) {
    this.activeCesion.update(current => current === i ? null : i);
  }

  get activeCesionItem() {
    const i = this.activeCesion();
    return i !== null ? this.cesionesCampo[i] : null;
  }

  tipos = [
    { key: 'despedidas', ruta: '/eventos/despedidas', icono: '◉', titulo: 'Despedidas', tagline: 'Despedidas que no son la típica.', placeholder: 'FOTO DESPEDIDA' },
    { key: 'cumples', ruta: '/eventos/cumpleanos', icono: '◆', titulo: 'Cumpleaños', tagline: 'Que se cuentan solos.', placeholder: 'FOTO CUMPLEAÑOS' },
    { key: 'empresas', ruta: '/eventos/empresas', icono: '◈', titulo: 'Empresas', tagline: 'Team building con risa.', placeholder: 'FOTO EMPRESAS' },
    { key: 'colectivos', ruta: '/eventos/colectivos', icono: '◎', titulo: 'Colectivos', tagline: 'Excursiones que no aburren.', placeholder: 'FOTO COLECTIVOS' },
  ];

  readonly waUrl = 'https://wa.me/34688731474?text=Hola%2C%20me%20interesa%20conocer%20las%20opciones%20de%20cesi%C3%B3n%20de%20campo%20en%20SDJ';

  cesionesCampo = [
    {
      titulo: 'Pruebas y demostraciones de producto',
      desc: 'Un escenario real donde el producto habla por sí solo. 45.000 m² con edificaciones, bosque y terreno variado para cualquier tipo de presentación o prueba.',
      items: ['Presentaciones de equipamiento', 'Test de vehículos todoterreno', 'Grabación de reviews', 'Demostraciones técnicas', 'Lanzamientos de producto'],
    },
    {
      titulo: 'Partidas privadas y eventos organizados por terceros',
      desc: 'Tú pones las reglas, nosotros el campo. Alquila las instalaciones y gestiona tu propio evento con total libertad. Sin monitores impuestos, sin dinámicas prefijadas.',
      items: ['Partidas guionizadas', 'MilSim privadas', 'Eventos temáticos', 'Reuniones de clubes de airsoft', 'Pruebas de material y equipamiento'],
    },
    {
      titulo: 'Formación y entrenamiento profesional',
      desc: 'Infraestructura real para formaciones que necesitan un entorno auténtico. Espacios delimitados, cobertura natural y escenarios urbanos para simulacros y prácticas.',
      items: [] as string[],
    },
    {
      titulo: 'Eventos temáticos y experiencias inmersivas',
      desc: 'El entorno ya tiene la ambientación hecha. Solo falta tu idea. Edificaciones abandonadas, bosque denso y escenarios que no necesitan decorado adicional.',
      items: ['Escape games al aire libre', 'Survival zombie', 'Eventos de rol en vivo (LARP)', 'Gymkhanas temáticas', 'Juegos de estrategia', 'Experiencias de supervivencia'],
    },
  ];

  diasGrandes = [
    {
      mes: 'Enero',
      titulo: 'Reyes',
      tipo: 'normal',
      desc: 'Comenzamos el año con las primeras partidas tras las fiestas navideñas. Es el momento perfecto para volver al campo, estrenar equipamiento nuevo y reencontrarse con la comunidad.',
      items: [] as string[],
      nota: '',
    },
    {
      mes: 'Febrero',
      titulo: 'Especial San Valentín',
      tipo: 'normal',
      desc: 'Un evento diferente y desenfadado donde la cooperación y el trabajo en equipo cobran protagonismo. Misiones dinámicas y retos especiales para disfrutar de una jornada distinta.',
      items: [] as string[],
      nota: '',
    },
    {
      mes: 'Marzo – Abril',
      titulo: 'Semana Santa',
      tipo: 'especial',
      desc: 'Uno de los periodos con mayor actividad del año. Durante los festivos organizamos partidas abiertas y, dependiendo del calendario, operativos especiales con historias, objetivos y misiones que se desarrollan a lo largo de toda la jornada.',
      items: [] as string[],
      nota: '',
    },
    {
      mes: 'Junio – Agosto',
      titulo: 'Temporada de Verano',
      tipo: 'especial',
      desc: 'Los meses de verano concentran algunos de los eventos más importantes del calendario.',
      items: ['Partidas abiertas con gran afluencia de jugadores', 'Operativos especiales de gran formato', 'Misiones más extensas y complejas', 'Eventos temáticos exclusivos de verano'],
      nota: '',
    },
    {
      mes: 'Septiembre',
      titulo: 'Vuelta a la Acción',
      tipo: 'normal',
      desc: 'Tras el verano retomamos el ritmo habitual con partidas abiertas y un evento especial de reactivación para dar comienzo a la temporada de otoño.',
      items: [] as string[],
      nota: '',
    },
    {
      mes: 'Octubre',
      titulo: 'Halloween',
      tipo: 'estrella',
      desc: 'Nuestro evento más esperado del año. Escenarios tematizados, ambientación de terror, partidas nocturnas y misiones especiales convierten Halloween en una experiencia única que reúne a jugadores de toda la zona.',
      items: [] as string[],
      nota: 'Si solo puedes asistir a un gran evento al año, este es el que no te puedes perder.',
    },
    {
      mes: 'Diciembre',
      titulo: 'Navidad',
      tipo: 'normal',
      desc: 'Cerramos el año con partidas de ambiente más social y festivo, ideales para despedir la temporada junto a la comunidad de Soldados de Juguete. Como broche final celebramos una partida especial de cierre de año para prepararnos para los nuevos retos que traerá el siguiente calendario.',
      items: [] as string[],
      nota: '',
    },
  ];
}
