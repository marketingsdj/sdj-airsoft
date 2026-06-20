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
  anoNacimiento: number | null;
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
      anoNacimiento: null,
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
    // Limpia en el mismo objeto para no romper las referencias del componente/template
    Object.assign(this.form, this.initialForm());
  }
}
