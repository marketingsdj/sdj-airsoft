import { Injectable, signal } from '@angular/core';

export type TipoReserva = 'individual' | 'privada' | 'evento' | 'txiki' | '';

export interface FormData {
  tipo: TipoReserva;
  modalidad: string;
  premium: boolean;
  fecha: string;
  hora: string;
  pista: string;
  personas: number;
  nombre: string;
  email: string;
  telefono: string;
  comoConocido: string;
  primeraVez: string;
  acepta: boolean;
  aceptaPrivacidad: boolean;
  aceptaEdad: boolean;
  aceptaComunicaciones: boolean;
  mensaje: string;
  edadesNinos: string;
  merienda: boolean;
  doblePartida: boolean;
  laborableConsulta: boolean;   // grupo +10 entre semana, hora aproximada pendiente de confirmar
  tarifaReducida: boolean;      // tarifa reducida (tarde)
  menu: boolean;                // menú del evento (precio pendiente de confirmar)
}

@Injectable({ providedIn: 'root' })
export class ReservaStateService {
  paso = signal(1);

  // Sobreviven a la navegación dentro de la misma sesión (pestaña), para que
  // si el usuario va a otra página y vuelve a /reserva siga viendo la
  // confirmación con el PDF/calendario descargable, en vez de un formulario
  // vacío. Solo se limpian al empezar una sesión nueva (recarga completa) o
  // al cambiar de categoría de reserva.
  enviado = signal(false);
  numeroReserva = signal('');

  form: FormData = this.initialForm();

  private initialForm(): FormData {
    return {
      tipo: '',
      modalidad: '',
      premium: false,
      fecha: '',
      hora: '',
      pista: '',
      personas: 1,
      nombre: '',
      email: '',
      telefono: '',
      comoConocido: '',
      primeraVez: '',
      acepta: false,
      aceptaPrivacidad: false,
      aceptaEdad: false,
      aceptaComunicaciones: false,
      mensaje: '',
      edadesNinos: '',
      merienda: false,
      doblePartida: false,
      laborableConsulta: false,
      tarifaReducida: false,
      menu: false,
    };
  }

  reset() {
    this.paso.set(1);
    this.enviado.set(false);
    this.numeroReserva.set('');
    // Limpia en el mismo objeto para no romper las referencias del componente/template
    Object.assign(this.form, this.initialForm());
  }
}
