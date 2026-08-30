import { Injectable } from '@angular/core';
import { doc, getDoc, setDoc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../firebase';

/** Datos públicos (sin datos personales) que permiten cancelar una reserva. */
export interface DatosCancelacion {
  codigo: string;
  reservaId: string;
  slotId: string;      // '' si la reserva no ocupa franja (partida abierta)
  fecha: string;
  hora?: string;
  pista?: string;
  tipo?: string;
  personas?: number;
  numeroReserva?: string;
  cancelada: boolean;
  cambio?: SolicitudCambio | null;
}

/** Cambio pedido por el cliente, pendiente de que lo aprueben en /admin. */
export interface SolicitudCambio {
  fecha?: string;
  hora?: string;
  pista?: string;
  personas?: number;
  nombre?: string;
  telefono?: string;
  email?: string;
  comentario?: string;
  estado: 'pendiente' | 'aceptado' | 'rechazado';
}

/** Horas de antelación mínimas para poder cancelar por la web. */
export const HORAS_MINIMAS_CANCELACION = 48;

/**
 * Cancelación por parte del cliente (/cancelar), sin cuenta ni login: basta
 * con el código secreto que se le da al reservar. El código es el id del
 * documento en la colección `cancelaciones`, que solo puede leerse conociéndolo.
 */
@Injectable({ providedIn: 'root' })
export class CancelacionService {
  readonly disponible = isFirebaseConfigured && !!db;

  /** Genera un código legible (sin caracteres ambiguos), tipo A7K2-9QX4. */
  generarCodigo(): string {
    const abc = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const bloque = () => Array.from({ length: 4 }, () =>
      abc[Math.floor(Math.random() * abc.length)]).join('');
    return `${bloque()}-${bloque()}`;
  }

  async buscar(codigo: string): Promise<DatosCancelacion | null> {
    if (!db) return null;
    const limpio = codigo.trim().toUpperCase();
    if (!limpio) return null;
    const snap = await getDoc(doc(db, 'cancelaciones', limpio));
    if (!snap.exists()) return null;
    const x = snap.data() as Record<string, unknown>;
    return {
      codigo: limpio,
      reservaId: (x['reservaId'] as string) || '',
      slotId:    (x['slotId'] as string) || '',
      fecha:     (x['fecha'] as string) || '',
      hora:      x['hora'] as string | undefined,
      pista:     x['pista'] as string | undefined,
      tipo:      x['tipo'] as string | undefined,
      personas:  x['personas'] as number | undefined,
      numeroReserva: x['numeroReserva'] as string | undefined,
      cancelada: !!x['cancelada'],
      cambio: (x['cambio'] as SolicitudCambio) || null,
    };
  }

  /** Horas que faltan para la partida (negativo si ya ha pasado). */
  horasHasta(fecha: string, hora?: string): number {
    if (!fecha) return 0;
    const [a, m, d] = fecha.split('-').map(Number);
    const [h, min] = (hora || '09:00').split(':').map(Number);
    return (new Date(a, m - 1, d, h, min).getTime() - Date.now()) / 3_600_000;
  }

  /** ¿Se puede cancelar por la web? (fuera del plazo se pide contactar). */
  aTiempo(datos: DatosCancelacion): boolean {
    return this.horasHasta(datos.fecha, datos.hora) >= HORAS_MINIMAS_CANCELACION;
  }

  /**
   * Pide un cambio en la reserva. No modifica nada todavía: queda registrado
   * como pendiente para que el equipo lo revise y lo acepte desde /admin.
   */
  async solicitarCambio(codigo: string, cambio: Omit<SolicitudCambio, 'estado'>): Promise<void> {
    if (!db) throw new Error('Firebase no está configurado.');
    await updateDoc(doc(db, 'cancelaciones', codigo), {
      cambio: { ...cambio, estado: 'pendiente' },
      cambioPedidoEl: serverTimestamp(),
    });
  }

  /**
   * Cancela: marca el código como usado, pasa la reserva a `cancelada` y
   * libera el hueco del calendario para que otra persona pueda cogerlo.
   */
  async cancelar(datos: DatosCancelacion): Promise<void> {
    if (!db) throw new Error('Firebase no está configurado.');

    await updateDoc(doc(db, 'cancelaciones', datos.codigo), {
      cancelada: true,
      canceladaEl: serverTimestamp(),
    });

    if (datos.reservaId) {
      await updateDoc(doc(db, 'reservas', datos.reservaId), {
        estado: 'cancelada',
        canceladaPor: 'cliente',
        codigoUsado: datos.codigo,
      });
    }

    // El hueco se libera en dos pasos porque las reglas de seguridad no pueden
    // comprobar el código en un borrado: primero se deja constancia de que esa
    // franja está autorizada a liberarse, y después se borra.
    if (datos.slotId) {
      await setDoc(doc(db, 'liberaciones', datos.slotId), {
        codigo: datos.codigo,
        creado: serverTimestamp(),
      });
      await deleteDoc(doc(db, 'slots', datos.slotId));
    }
  }
}
