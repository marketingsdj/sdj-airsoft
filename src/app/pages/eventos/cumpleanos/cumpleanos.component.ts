import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Title, Meta } from '@angular/platform-browser';
import { EventoContactoComponent } from '../shared/evento-contacto.component';

@Component({
  selector: 'app-cumpleanos',
  imports: [RouterLink, EventoContactoComponent],
  templateUrl: './cumpleanos.component.html',
  styleUrl: './cumpleanos.component.scss'
})
export class CumpleanosComponent {
  private title = inject(Title);
  private meta = inject(Meta);

  waUrl = 'https://wa.me/34688731474?text=' +
    encodeURIComponent('Hola! Quiero organizar un cumpleaños en SDJ Airsoft (Larrabetzu).');

  stats = [
    { num: '45.000 m²', lbl: 'Campo privado' },
    { num: 'Desde 8', lbl: 'Personas' },
    { num: '90 min', lbl: 'Partida privada' },
    { num: '39,90 €', lbl: 'Por persona' },
  ];

  // ─── NUEVO (texto cliente) ───────────────────────────────────────────────
  incluyeNuevo = [
    { t: 'Partida privada de 90 minutos', d: 'Solo vuestro grupo. Sin mezclarse con nadie más. Incluida desde 8 personas.' },
    { t: 'Equipo completo para todos', d: 'Réplica, máscara, chaleco y bolas. Solo hay que llevar ropa de monte y calzado cómodo.' },
    { t: 'Monitores en campo todo el rato', d: 'No os dejamos solos. Los monitores organizan, arbitran y hacen que el juego fluya.' },
    { t: 'Duchas y taquillas', d: 'Separadas por hombres y mujeres. Acabáis el juego como personas.' },
    { t: 'Seguro de accidentes incluido', d: 'En el precio. Sin letra pequeña.' },
  ];

  faqsNuevo = [
    { q: '¿Cuántos tenemos que ser?', a: 'La partida privada está incluida desde 8. Podéis ser hasta 30.' },
    { q: '¿Hay que reservar con mucha antelación?', a: 'Cuanto antes mejor para asegurar el día, pero no hace falta señal. Confirmáis por WhatsApp y listo.' },
    { q: '¿Puedo combinar el cumpleaños con las partidas abiertas del día?', a: 'Sí. Después de vuestra partida privada podéis quedaros jugando con el resto de la gente del campo si queréis más.' },
    { q: '¿Qué edad mínima?', a: '14 años para airsoft adultos. Los menores de 18 necesitan autorización de los padres, que se gestiona online al hacer la reserva. Sin papeleos raros.' },
  ];

  // ─── ANTERIOR ────────────────────────────────────────────────────────────
  incluye = [
    'Equipo completo adaptado a la edad del grupo',
    'Monitor dedicado durante toda la partida',
    'Misiones y juegos pensados para que ganen todos',
    'Campo privado para el grupo del cumple',
    'Foto de grupo final de recuerdo',
    'Zona de cafetería para la merienda / tarta',
  ];

  pasos = [
    { n: '01', t: 'Reserva', d: 'Elige día y dinos cuántos venís y qué edad tienen. Te confirmamos hueco.' },
    { n: '02', t: 'Preparamos', d: 'Adaptamos las misiones a la edad para que sea divertido y seguro.' },
    { n: '03', t: 'A jugar', d: 'Equipamos al grupo, briefing y partida supervisada por monitor.' },
    { n: '04', t: 'Merienda', d: 'Cerramos con foto de grupo y zona para tarta y merienda.' },
  ];

  faqs = [
    { q: '¿A partir de qué edad pueden jugar?', a: 'Recomendamos a partir de 8 años con equipo y potencias adaptadas. Para los más peques tenemos también la opción de Txiki Paintball.' },
    { q: '¿Es seguro para niños?', a: 'Totalmente. Máscara y protección obligatorias, monitor supervisando en todo momento y réplicas con potencia limitada para su edad.' },
    { q: '¿Pueden jugar también los adultos?', a: 'Claro. Funciona genial como cumple de adultos o mixto: padres y niños en el mismo equipo.' },
    { q: '¿Podemos traer tarta?', a: 'Sí. Tenéis zona de cafetería para la merienda y la tarta al terminar la partida.' },
  ];

  ngOnInit() {
    this.title.setTitle('Cumpleaños diferente en Bilbao | Airsoft en SDJ Larrabetzu');
    this.meta.updateTag({
      name: 'description',
      content: 'Celebra el cumpleaños diferente cerca de Bilbao: airsoft en campo privado de 45.000 m² en Larrabetzu, con monitores y equipo completo incluido. Desde 8 personas, 39,90 €.'
    });
  }
}
