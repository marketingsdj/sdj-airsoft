import { Injectable, signal } from '@angular/core';
import { collection, doc, onSnapshot, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../firebase';
import { PARTIDAS_EXTRAORDINARIAS, fechaLocalISO } from '../data/partidas-extraordinarias';

/**
 * Partidas extraordinarias (16:00–20:00, tarifa reducida y gratis para socios).
 *
 * Se guardan en Firestore para poder abrirlas de un día para otro desde el
 * panel, sin tocar el código. A las de la base se suman las que haya escritas
 * en `partidas-extraordinarias.ts`, para no perder las de siempre.
 */
@Injectable({ providedIn: 'root' })
export class ExtraordinariasService {
  /** Fechas 'AAAA-MM-DD' activas ahora mismo. */
  readonly fechas = signal<string[]>([...PARTIDAS_EXTRAORDINARIAS]);

  constructor() {
    if (isFirebaseConfigured && db) {
      // El id del documento es la fecha, así que basta con leer los ids.
      onSnapshot(collection(db, 'extraordinarias'), snap => {
        const deLaBase = snap.docs.map(d => d.id);
        this.fechas.set([...new Set([...PARTIDAS_EXTRAORDINARIAS, ...deLaBase])]);
      });
    }
  }

  esExtraordinaria(fecha: Date | string): boolean {
    const iso = typeof fecha === 'string' ? fecha : fechaLocalISO(fecha);
    return this.fechas().includes(iso);
  }

  /** Abre una partida extraordinaria en esa fecha (solo desde el panel). */
  async abrir(fecha: string, nota = ''): Promise<void> {
    if (!db || !fecha) return;
    await setDoc(doc(db, 'extraordinarias', fecha), {
      fecha, nota, creado: serverTimestamp(),
    });
  }

  /** Quita la partida extraordinaria de esa fecha. */
  async quitar(fecha: string): Promise<void> {
    if (!db || !fecha) return;
    await deleteDoc(doc(db, 'extraordinarias', fecha));
  }

  /** Las que aún no han pasado, ordenadas. */
  proximas(): string[] {
    const hoy = fechaLocalISO(new Date());
    return this.fechas().filter(f => f >= hoy).sort();
  }
}
