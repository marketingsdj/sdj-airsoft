import { Injectable, signal } from '@angular/core';
import { collection, doc, onSnapshot, setDoc, addDoc, getDoc, increment, serverTimestamp } from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../firebase';

/**
 * Gestiona los huecos (franjas) ya ocupados, compartidos por TODOS los tipos de
 * reserva de grupo (privada, evento, txikipaintball).
 *
 * Clave de cada hueco: `fecha_hora_pista`  (ej: 2026-05-30_09:00_A)
 *
 * - Con Firebase configurado: lee la colección `slots` en tiempo real y escribe
 *   un documento por cada hueco reservado. Así el bloqueo es real y compartido
 *   entre todos los usuarios y dispositivos.
 * - Sin configurar: funciona en memoria (datos de ejemplo, se reinician al
 *   recargar). Permite seguir desarrollando sin backend.
 */
@Injectable({ providedIn: 'root' })
export class SlotsService {
  private _bloqueados = signal<string[]>([]);
  readonly bloqueados = this._bloqueados.asReadonly();

  constructor() {
    if (isFirebaseConfigured && db) {
      // Lectura en tiempo real: el id de cada documento es la clave del hueco.
      onSnapshot(collection(db, 'slots'), snap => {
        this._bloqueados.set(snap.docs.map(d => d.id));
      });
    } else {
      // Modo demo (sin backend): datos de ejemplo en memoria.
      this._bloqueados.set([
        '2026-05-30_09:00_A', '2026-05-30_09:00_B', '2026-05-30_11:00_A',
      ]);
    }
  }

  async bloquear(fecha: string, hora: string, pista: string): Promise<void> {
    const key = `${fecha}_${hora}_${pista}`;

    if (isFirebaseConfigured && db) {
      // Crea/sobrescribe el documento del hueco; el onSnapshot actualiza la señal.
      await setDoc(doc(db, 'slots', key), {
        fecha,
        hora,
        pista,
        creado: serverTimestamp(),
      });
    } else {
      this._bloqueados.update(b => (b.includes(key) ? b : [...b, key]));
    }
  }

  // Normaliza el email para usarlo como parte de un id (sin caracteres raros).
  private normEmail(email: string): string {
    return (email || '').trim().toLowerCase();
  }

  // Id del contador diario por persona (email + fecha), seguro para Firestore.
  private contadorId(email: string, fecha: string): string {
    return `${this.normEmail(email).replace(/[^a-z0-9._@-]/g, '_')}__${fecha}`;
  }

  // Id del contador mensual por persona (email + mes 'AAAA-MM').
  private contadorMesId(email: string, fecha: string): string {
    const mes = (fecha || '').slice(0, 7);
    return `${this.normEmail(email).replace(/[^a-z0-9._@-]/g, '_')}__${mes}`;
  }

  // Límite diario: nº de reservas de ese email para una fecha concreta.
  async contarReservasDia(email: string, fecha: string): Promise<number> {
    if (!isFirebaseConfigured || !db) return 0; // sin backend no se aplica el límite
    if (!this.normEmail(email)) return 0;
    const ref = await getDoc(doc(db, 'reservas_contador', this.contadorId(email, fecha)));
    return ref.exists() ? (ref.data()['count'] as number) || 0 : 0;
  }

  // Límite mensual: nº de reservas de ese email en el mes de esa fecha.
  async contarReservasMes(email: string, fecha: string): Promise<number> {
    if (!isFirebaseConfigured || !db) return 0;
    if (!this.normEmail(email)) return 0;
    const ref = await getDoc(doc(db, 'reservas_contador_mes', this.contadorMesId(email, fecha)));
    return ref.exists() ? (ref.data()['count'] as number) || 0 : 0;
  }

  // ¿Este email está bloqueado? Se bloquea añadiendo un documento con
  // id = email (en minúsculas) en la colección `usuarios_bloqueados`
  // desde la consola de Firebase.
  async estaBloqueado(email: string): Promise<boolean> {
    if (!isFirebaseConfigured || !db) return false;
    const e = this.normEmail(email);
    if (!e) return false;
    const ref = await getDoc(doc(db, 'usuarios_bloqueados', e));
    return ref.exists();
  }

  // Guarda el registro completo de la reserva (colección privada `reservas`,
  // solo escritura) e incrementa el contador diario de esa persona.
  async registrarReserva(datos: {
    email: string; nombre?: string; telefono?: string; tipo: string;
    fecha: string; hora?: string; pista?: string; personas?: number; numeroReserva?: string;
    gestion?: string;
    codigoCancelacion?: string;
    extras?: string[];
    laborable?: boolean;   // dia entre semana: la hora es aproximada
    mensaje?: string;      // lo que escribe el cliente al reservar
    horaPedida?: string;   // la que eligio el cliente, aunque luego se cambie
  }): Promise<string | null> {
    if (!isFirebaseConfigured || !db) return null;
    const email = this.normEmail(datos.email);
    // Toda reserva entra como pendiente: la confirma el equipo desde /admin.
    const ref = await addDoc(collection(db, 'reservas'), { ...datos, email, estado: 'pendiente', creado: serverTimestamp() });
    // Los limites por persona van por email: sin email no hay a quien contarle
    // la reserva, pero la reserva si queda guardada.
    if (!email) return ref.id;
    // Contador diario (límite 2/día).
    await setDoc(
      doc(db, 'reservas_contador', this.contadorId(email, datos.fecha)),
      { email, fecha: datos.fecha, count: increment(1) },
      { merge: true },
    );
    // Contador mensual (límite 4/mes).
    await setDoc(
      doc(db, 'reservas_contador_mes', this.contadorMesId(email, datos.fecha)),
      { email, mes: (datos.fecha || '').slice(0, 7), count: increment(1) },
      { merge: true },
    );
    return ref.id;
  }

  /**
   * Crea el documento que permite al cliente cancelar su reserva sin cuenta:
   * el id es su código secreto (el que aparece en pantalla y en el PDF).
   * No guarda datos personales: solo lo necesario para liberar el hueco.
   */
  async crearCodigoCancelacion(codigo: string, datos: {
    reservaId: string; slotId: string; fecha: string; hora?: string;
    pista?: string; tipo: string; personas?: number; numeroReserva?: string;
  }): Promise<void> {
    if (!isFirebaseConfigured || !db) return;
    await setDoc(doc(db, 'cancelaciones', codigo), {
      ...datos, cancelada: false, creado: serverTimestamp(),
    });
  }
}
