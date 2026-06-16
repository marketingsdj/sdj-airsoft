import { Component, inject } from '@angular/core';
import { Title, Meta } from '@angular/platform-browser';
import { EventoContactoComponent } from '../shared/evento-contacto.component';

@Component({
  selector: 'app-empresas',
  imports: [EventoContactoComponent],
  templateUrl: './empresas.component.html',
  styleUrl: './empresas.component.scss'
})
export class EmpresasComponent {
  private title = inject(Title);
  private meta = inject(Meta);

  waUrl = 'https://wa.me/34688731474?text=' +
    encodeURIComponent('Hola! Quiero info para un team building de empresa en SDJ Airsoft (Larrabetzu).');

  stats = [
    { num: '45.000 m²', lbl: 'Campo exclusivo' },
    { num: '8–120', lbl: 'Personas' },
    { num: 'L–V', lbl: 'Con reserva previa' },
    { num: 'Desde 2008', lbl: 'Organizando eventos' },
  ];

  // ─── NUEVO (texto cliente) ───────────────────────────────────────────────
  incluyeNuevo = [
    { t: 'Campo exclusivo para vuestra empresa', d: 'Partida privada sin coincidir con otros grupos. Solo vuestro equipo y los monitores.' },
    { t: 'Equipo completo para todos', d: 'Material incluido para cada participante. No hace falta traer nada especial.' },
    { t: 'Monitores en campo todo el rato', d: 'Organizan, arbitran y se aseguran de que el juego fluya bien sin importar el tamaño del grupo.' },
    { t: 'Catering con El Barracón', d: 'Menú de parrillada y comedor para hasta 37 personas en el propio recinto. Sin salir a buscar restaurante.' },
    { t: 'Duchas y vestuarios con taquillas', d: 'Para que nadie vuelva a la oficina como si hubiera venido de la guerra.' },
    { t: 'Seguro de accidentes incluido', d: 'Para todos los participantes. Sin costes ocultos.' },
  ];

  faqsNuevo = [
    { q: '¿Para cuántas personas?', a: 'De 8 a 120 personas. Nos adaptamos al tamaño del equipo.' },
    { q: '¿Abrís entre semana?', a: 'Sí. Para empresas abrimos de lunes a viernes con reserva previa.' },
    { q: '¿Cuánto dura la actividad?', a: 'Media jornada o jornada completa. Lo organizamos según vuestros tiempos y necesidades.' },
    { q: '¿Necesita experiencia previa el equipo?', a: 'Ninguna. El briefing inicial está adaptado para que todo el mundo entienda y disfrute desde el minuto uno.' },
    { q: '¿Hay parking?', a: 'Sí, aparcamiento propio y gratuito en las instalaciones.' },
  ];

  // ─── ANTERIOR ────────────────────────────────────────────────────────────
  incluye = [
    'Campo en exclusiva para tu empresa',
    'Dinámicas por equipos: comunicación y decisión bajo presión',
    'Equipo completo y monitor coordinando la jornada',
    'Briefing inicial y misiones por objetivos',
    'Factura con IVA para la empresa',
    'Catering y sala para comida o reunión bajo petición',
  ];

  pasos = [
    { n: '01', t: 'Nos cuentas', d: 'Número de personas, fecha y objetivo: cohesión, integración de nuevos, incentivo...' },
    { n: '02', t: 'Diseñamos', d: 'Montamos la jornada con dinámicas por equipos a la medida del grupo.' },
    { n: '03', t: 'Jugamos', d: 'Misiones por objetivos donde toca comunicarse, repartirse roles y decidir.' },
    { n: '04', t: 'Cierre', d: 'Comida o picoteo opcional y factura. Equipo más unido, sin powerpoints.' },
  ];

  beneficios = [
    { t: 'Comunicación real', d: 'Bajo presión, sin jerga corporativa. Quien no se coordina, pierde la posición.' },
    { t: 'Roles y liderazgo', d: 'Cada misión reparte tareas. Surgen líderes y se ve quién tira del equipo.' },
    { t: 'Sin powerpoints', d: 'Cero dinámicas aburridas de sala. Se aprende jugando y se recuerda.' },
  ];

  faqs = [
    { q: '¿Para cuántas personas?', a: 'Desde grupos de 8 hasta 40 personas en exclusiva. Para plantillas más grandes lo organizamos por turnos.' },
    { q: '¿Hacéis factura?', a: 'Sí, emitimos factura con IVA a nombre de la empresa sin problema.' },
    { q: '¿Hay opción de comida?', a: 'Sí. Tenemos cafetería propia y catering bajo petición, además de espacio para una comida o reunión posterior.' },
    { q: '¿Hace falta estar en forma?', a: 'No. La actividad se adapta al grupo. Es intensa pero accesible para todos los niveles.' },
  ];

  ngOnInit() {
    this.title.setTitle('Team building en Bilbao | Airsoft para empresas en SDJ Larrabetzu');
    this.meta.updateTag({
      name: 'description',
      content: 'La actividad de empresa que el equipo recuerda: airsoft para empresas en campo privado de 45.000 m² en Larrabetzu, cerca de Bilbao. De 8 a 120 personas, catering y parking.'
    });
  }
}
