import { Injectable, computed, signal } from '@angular/core';
import { collection, doc, onSnapshot, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../firebase';
import {
  PARTIDAS_EXTRAORDINARIAS, fechaLocalISO,
  ExtraDia, ExtraTarifaTipo, EXTRA_DEFECTO, EXTRA_PRECIOS, extraDiaPorDefecto,
} from '../data/partidas-extraordinarias';

/**
 * Partidas extraordinarias (socios gratis, tarifa y horario configurables).
 *
 * Se guardan en Firestore para poder abrirlas de un día para otro desde el
 * panel, sin tocar el código. A las de la base se suman las que haya escritas
 * en `partidas-extraordinarias.ts`, para no perder las de siempre; esas usan
 * siempre los valores por defecto (tarde y tarifa reducida).
 */
@Injectable({ providedIn: 'root' })
export class ExtraordinariasService {
  /** Configuración de cada fecha abierta, indexada por 'AAAA-MM-DD'. */
  readonly dias = signal<Record<string, ExtraDia>>(
    Object.fromEntries(PARTIDAS_EXTRAORDINARIAS.map(f => [f, extraDiaPorDefecto(f)])),
  );

  /** Fechas 'AAAA-MM-DD' activas ahora mismo. */
  readonly fechas = computed(() => Object.keys(this.dias()).sort());

  constructor() {
    if (isFirebaseConfigured && db) {
      // El id del documento es la fecha; el resto de campos son la tarifa y el
      // horario, que pueden faltar en las abiertas antes de poder elegirlos.
      onSnapshot(collection(db, 'extraordinarias'), snap => {
        const mapa: Record<string, ExtraDia> = Object.fromEntries(
          PARTIDAS_EXTRAORDINARIAS.map(f => [f, extraDiaPorDefecto(f)]),
        );
        snap.docs.forEach(d => {
          const x = d.data() as Partial<ExtraDia>;
          mapa[d.id] = {
            fecha: d.id,
            tarifa: x.tarifa === 'normal' ? 'normal' : EXTRA_DEFECTO.tarifa,
            horaInicio: x.horaInicio || EXTRA_DEFECTO.horaInicio,
            horaFin: x.horaFin || EXTRA_DEFECTO.horaFin,
          };
        });
        this.dias.set(mapa);
      });
    }
  }

  esExtraordinaria(fecha: Date | string): boolean {
    const iso = typeof fecha === 'string' ? fecha : fechaLocalISO(fecha);
    return !!this.dias()[iso];
  }

  /** Tarifa y horario de esa fecha (valores por defecto si no está abierta). */
  dia(fecha: Date | string): ExtraDia {
    const iso = typeof fecha === 'string' ? fecha : fechaLocalISO(fecha);
    return this.dias()[iso] ?? extraDiaPorDefecto(iso);
  }

  /** Precios por persona que aplican en esa fecha, según su tarifa. */
  precios(fecha: Date | string) {
    return EXTRA_PRECIOS[this.dia(fecha).tarifa];
  }

  /** Abre (o reconfigura) una partida extraordinaria en esa fecha. */
  async abrir(fecha: string, opciones: Partial<Omit<ExtraDia, 'fecha'>> = {}, nota = ''): Promise<void> {
    if (!db || !fecha) return;
    await setDoc(doc(db, 'extraordinarias', fecha), {
      fecha, nota,
      tarifa: opciones.tarifa ?? EXTRA_DEFECTO.tarifa,
      horaInicio: opciones.horaInicio || EXTRA_DEFECTO.horaInicio,
      horaFin: opciones.horaFin || EXTRA_DEFECTO.horaFin,
      creado: serverTimestamp(),
    });
  }

  /** Cambia la tarifa o el horario de una fecha ya abierta. */
  async guardar(fecha: string, cambios: Partial<Omit<ExtraDia, 'fecha'>>): Promise<void> {
    const actual = this.dia(fecha);
    await this.abrir(fecha, { ...actual, ...cambios });
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

export type { ExtraTarifaTipo };
