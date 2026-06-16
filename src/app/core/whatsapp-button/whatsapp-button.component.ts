import { Component } from '@angular/core';

@Component({
  selector: 'app-whatsapp-button',
  templateUrl: './whatsapp-button.component.html',
  styleUrl: './whatsapp-button.component.scss'
})
export class WhatsappButtonComponent {
  // Sustituir por el número real de WhatsApp
  phone = '34688731474';
  message = encodeURIComponent('Hola! Me interesa reservar una partida en SDJ Airsoft (Larrabetzu).');
  get url() {
    return `https://wa.me/${this.phone}?text=${this.message}`;
  }
}
