import { Injectable, signal } from '@angular/core';
import { collection, doc, onSnapshot, setDoc, serverTimestamp } from 'firebase/firestore';
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
}
