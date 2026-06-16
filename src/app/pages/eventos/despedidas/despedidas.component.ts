import { Component, inject } from '@angular/core';
import { Title, Meta } from '@angular/platform-browser';
import { EventoContactoComponent } from '../shared/evento-contacto.component';

@Component({
  selector: 'app-despedidas',
  imports: [EventoContactoComponent],
  templateUrl: './despedidas.component.html',
  styleUrl: './despedidas.component.scss'
})
export class DespedidasComponent {
  private title = inject(Title);
  private meta = inject(Meta);

  waUrl = 'https://wa.me/34688731474?text=' +
    encodeURIComponent('Hola! Quiero info para una despedida en SDJ Airsoft (Larrabetzu).');

  stats = [
    { num: '45.000 m²', lbl: 'Campo privado' },
    { num: 'Desde 8', lbl: 'Personas' },
    { num: '90 min', lbl: 'Partida privada' },
    { num: '39,90 €', lbl: 'Por persona' },
  ];

  // ─── NUEVO (texto cliente) ───────────────────────────────────────────────
  incluyeNuevo = [
    { t: 'Campo solo para vosotros', d: 'Partida privada de 90 minutos incluida desde 8 personas. Sin extraños, sin coincidir con otros grupos. Solo vosotros y los monitores.' },
    { t: 'No hace falta traer nada', d: 'El equipo completo está incluido: lo único que necesitáis es ropa que no os importe manchar y calzado de monte o deportivo. El resto lo ponemos nosotros.' },
    { t: 'Escenarios de verdad', d: 'Bases militares, castillos, vehículos, refinerías. 45.000 m² en un antiguo campo de golf en Larrabetzu, a 15 minutos de Bilbao.' },
    { t: 'Duchas y taquillas en el campo', d: 'Acabáis el juego, os ducháis y salís presentables. No como en otros sitios.' },
    { t: 'El Barracón justo ahí', d: 'Comida y bebida sin moverse de las instalaciones. Pizzas, hamburguesas, platos combinados. El festejo continúa sin tener que buscar dónde comer.' },
    { t: 'Seguro incluido', d: 'El seguro de accidentes está en el precio. Sin sorpresas.' },
  ];

  faqsNuevo = [
    { q: '¿Cuántos tenemos que ser?', a: 'La partida privada está incluida a partir de 8. Podéis venir hasta 30 sin problema.' },
    { q: '¿Abrís entre semana?', a: 'Sí. Para despedidas abrimos de lunes a viernes con reserva previa.' },
    { q: '¿Y si alguien del grupo no quiere jugar?', a: 'Que venga igual. Hay zona de cafetería y puede animar desde fuera.' },
    { q: '¿Cómo reservamos?', a: 'Por WhatsApp al +34 688 73 14 74. Decís cuántos sois y qué día, y en cinco minutos lo tenéis cerrado.' },
  ];

  // ─── ANTERIOR ────────────────────────────────────────────────────────────
  incluye = [
    'Equipo completo: réplica, máscara, protección y munición',
    'Campo privado para tu grupo (sin mezclar con desconocidos)',
    'Monitor dedicado durante toda la jornada',
    'Brazalete y modo "novix objetivo" para el homenajeado',
    'Vídeo y foto de grupo del día para las redes',
    'Cerveza de bienvenida y zona de cafetería',
  ];

  pasos = [
    { n: '01', t: 'Escríbenos', d: 'Cuéntanos fecha, número de personas y a quién toca sufrir. Te cerramos hueco.' },
    { n: '02', t: 'Lo montamos', d: 'Elegimos escenarios y misiones según vuestro nivel. Tú solo apareces.' },
    { n: '03', t: 'A jugar', d: 'Equipamos al grupo, briefing rápido y a darlo todo en el campo.' },
    { n: '04', t: 'After', d: 'Cerveza, foto de grupo y vídeo del día. La despedida que sí recordáis.' },
  ];

  faqs = [
    { q: '¿Hace falta experiencia previa?', a: 'Ninguna. La mayoría de despedidas son de gente que juega por primera vez. Te explicamos todo antes de empezar.' },
    { q: '¿Cuántas personas mínimo?', a: 'Montamos despedidas desde 8 personas. Para grupos más grandes (hasta 40) reservamos el campo en exclusiva.' },
    { q: '¿Podemos comer allí?', a: 'Sí. Tenemos cafetería propia y opción de catering bajo petición. Avísanos al reservar.' },
    { q: '¿Qué llevamos puesto?', a: 'Ropa cómoda que se pueda manchar y calzado deportivo o de monte. El resto del equipo lo ponemos nosotros.' },
  ];

  ngOnInit() {
    this.title.setTitle('Despedidas de soltero/a en Bilbao | Airsoft en SDJ Larrabetzu');
    this.meta.updateTag({
      name: 'description',
      content: 'La despedida que nadie olvida cerca de Bilbao: airsoft en campo privado de 45.000 m² en Larrabetzu. Equipo completo incluido, desde 8 personas. 39,90 €/persona.'
    });
  }
}
