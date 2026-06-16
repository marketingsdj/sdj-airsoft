import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Title, Meta } from '@angular/platform-browser';
import { EventoContactoComponent } from '../shared/evento-contacto.component';

@Component({
  selector: 'app-colectivos',
  imports: [RouterLink, EventoContactoComponent],
  templateUrl: './colectivos.component.html',
  styleUrl: './colectivos.component.scss'
})
export class ColectivosComponent {
  private title = inject(Title);
  private meta = inject(Meta);

  waUrl = 'https://wa.me/34688731474?text=' +
    encodeURIComponent('Hola! Quiero info para una salida de grupo/colectivo en SDJ Airsoft (Larrabetzu).');

  stats = [
    { num: '45.000 m²', lbl: 'Campo privado' },
    { num: '15–120', lbl: 'Participantes' },
    { num: '14+', lbl: 'Edad mínima' },
    { num: 'L–V', lbl: 'Con reserva previa' },
  ];

  // ─── NUEVO (texto cliente) ───────────────────────────────────────────────
  incluyeNuevo = [
    { t: 'El campo entero para vuestro grupo', d: 'Partida privada: sin mezclarse con otros. Solo vosotros y los monitores durante toda la actividad.' },
    { t: 'Equipo completo para todos', d: 'Material incluido para cada participante. Solo hay que venir con ropa cómoda que no importe manchar y calzado de deporte o monte.' },
    { t: 'Monitores durante toda la actividad', d: 'Están en campo todo el rato, adaptan el juego al grupo y se encargan de que todo vaya bien.' },
    { t: 'Briefing inicial incluido', d: 'Explicación de normas, seguridad y modos de juego antes de empezar. Adaptado a la edad y al nivel del grupo.' },
    { t: 'Duchas y vestuarios', d: 'Con taquillas y duchas separadas por sexo para que todo el mundo pueda arreglarse al acabar.' },
    { t: 'Comida en el recinto', d: 'El Barracón está en las propias instalaciones. Podéis incluir comida en el pack o que cada uno gestione lo suyo en la cafetería.' },
    { t: 'Seguro de accidentes incluido', d: 'Para todos los participantes.' },
  ];

  faqsNuevo = [
    { q: '¿Qué edad mínima?', a: 'Airsoft adultos desde 14 años. Para menores de 18 gestionamos la autorización de los padres de forma online al hacer la reserva, sin papeleos.' },
    { q: '¿Abrís entre semana para excursiones?', a: 'Sí. Para grupos escolares y colectivos abrimos de lunes a viernes con reserva previa.' },
    { q: '¿Cuánto dura la actividad?', a: 'Lo que necesitéis. Media jornada con tiempo de comida o jornada completa. Lo organizamos según vuestros horarios.' },
    { q: '¿Hace falta experiencia previa?', a: 'No. Los monitores hacen el briefing inicial adaptado al grupo y acompañan a los que no han jugado nunca.' },
    { q: '¿Hay parking para autobuses?', a: 'Sí, parking propio y gratuito con espacio suficiente para autobuses escolares.' },
    { q: '¿Y si el grupo es muy grande?', a: 'Trabajamos con grupos de hasta 120 personas. Los monitores dividen en equipos y gestionan el juego para que funcione.' },
  ];

  // ─── ANTERIOR ────────────────────────────────────────────────────────────
  incluye = [
    'Equipo completo y protección para todo el grupo',
    'Monitores supervisando la actividad en todo momento',
    'Actividad deportiva con trabajo en equipo real',
    'Misiones adaptadas a la edad y al número de participantes',
    'Campo en exclusiva para el colectivo',
    'Seguridad y normas claras explicadas antes de empezar',
  ];

  pasos = [
    { n: '01', t: 'Contacta', d: 'Cuéntanos qué colectivo sois, edades y número aproximado de participantes.' },
    { n: '02', t: 'Planificamos', d: 'Adaptamos la jornada y la seguridad al grupo: gazteleku, colegio, cuadrilla...' },
    { n: '03', t: 'Actividad', d: 'Briefing, equipamiento y partidas supervisadas por monitores.' },
    { n: '04', t: 'Cierre', d: 'Foto de grupo y zona de descanso. Actividad que repiten cada año.' },
  ];

  paraQuien = [
    { t: 'Gaztelekus y ludotecas', d: 'Salida activa y diferente que engancha a los jóvenes y trabaja el grupo.' },
    { t: 'Colegios e institutos', d: 'Excursión deportiva con cooperación, normas y supervisión máxima.' },
    { t: 'Cuadrillas y asociaciones', d: 'Plan de grupo para pasar el día: campo en exclusiva y a darlo todo.' },
  ];

  faqs = [
    { q: '¿A partir de qué edad?', a: 'Recomendamos a partir de 8 años, con equipo y potencias adaptadas. Para grupos de peques tenemos Txiki Paintball.' },
    { q: '¿Cuánta supervisión hay?', a: 'Monitores supervisando toda la actividad, normas de seguridad explicadas al inicio y protección obligatoria.' },
    { q: '¿Cuántos participantes admitís?', a: 'Hasta 40 personas por grupo en exclusiva. Para colectivos más grandes lo organizamos por turnos.' },
    { q: '¿Necesitamos llevar algo?', a: 'Solo ropa cómoda que se pueda manchar y calzado deportivo. El equipo lo ponemos nosotros.' },
  ];

  ngOnInit() {
    this.title.setTitle('Excursiones y colectivos en Bilbao | Airsoft escolar en SDJ Larrabetzu');
    this.meta.updateTag({
      name: 'description',
      content: 'Excursiones que el grupo pide repetir cerca de Bilbao: airsoft para institutos, escuelas, scouts y colectivos en campo privado de 45.000 m² en Larrabetzu. Desde 14 años, hasta 120.'
    });
  }
}
