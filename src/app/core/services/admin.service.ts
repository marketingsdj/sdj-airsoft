import { Injectable, signal } from '@angular/core';
import {
  collection, doc, getDocs, updateDoc, deleteDoc, setDoc, query, orderBy, limit,
  serverTimestamp, Timestamp,
} from 'firebase/firestore';
import {
  signInWithEmailAndPassword, signOut, onAuthStateChanged, type User,
} from 'firebase/auth';
import { db, auth, isFirebaseConfigured } from '../firebase';

/** Estado de gestión de una reserva. */
export type EstadoReserva = 'pendiente' | 'confirmada' | 'denegada' | 'cancelada';

export interface ReservaAdmin {
  id: string;
  numeroReserva?: string;
  estado: EstadoReserva;
  nombre?: string;
  email?: string;
  telefono?: string;
  tipo?: string;
  fecha?: string;      // AAAA-MM-DD
  hora?: string;
  pista?: string;
  personas?: number;
  creado?: Date | null;
  notas?: string;
}

/**
 * Panel de gestión (/admin). Lee y actualiza la colección `reservas` de
 * Firestore. Requiere estar autenticado con Firebase Auth: las reglas de
 * seguridad solo permiten leer/editar a un usuario con sesión iniciada.
 */
@Injectable({ providedIn: 'root' })
export class AdminService {
  /** Usuario autenticado (null = sin sesión). */
  readonly usuario = signal<User | null>(null);
  /** Aún no sabemos si hay sesión guardada (evita parpadeo del login). */
  readonly cargandoSesion = signal(true);

  readonly disponible = isFirebaseConfigured && !!db && !!auth;

  constructor() {
    if (auth) {
      onAuthStateChanged(auth, u => {
        this.usuario.set(u);
        this.cargandoSesion.set(false);
      });
    } else {
      this.cargandoSesion.set(false);
    }
  }

  async entrar(email: string, password: string): Promise<void> {
    if (!auth) throw new Error('Firebase no está configurado.');
    await signInWithEmailAndPassword(auth, email.trim(), password);
  }

  async salir(): Promise<void> {
    if (auth) await signOut(auth);
  }

  /** Descarga las reservas más recientes (por defecto las últimas 500). */
  async cargarReservas(maximo = 500): Promise<ReservaAdmin[]> {
    if (!db) return [];
    const snap = await getDocs(query(collection(db, 'reservas'), orderBy('creado', 'desc'), limit(maximo)));
    return snap.docs.map(d => {
      const x = d.data() as Record<string, unknown>;
      const creado = x['creado'] instanceof Timestamp ? (x['creado'] as Timestamp).toDate() : null;
      // Las reservas antiguas no tienen estado: se deducen del campo `gestion`.
      const estado = (x['estado'] as EstadoReserva) ??
        (x['gestion'] === 'pendiente' ? 'pendiente' : 'confirmada');
      return {
        id: d.id,
        numeroReserva: x['numeroReserva'] as string | undefined,
        estado,
        nombre:   x['nombre']   as string | undefined,
        email:    x['email']    as string | undefined,
        telefono: x['telefono'] as string | undefined,
        tipo:     x['tipo']     as string | undefined,
        fecha:    x['fecha']    as string | undefined,
        hora:     x['hora']     as string | undefined,
        pista:    x['pista']    as string | undefined,
        personas: x['personas'] as number | undefined,
        notas:    x['notas']    as string | undefined,
        creado,
      };
    });
  }

  /** Cambia el estado de una reserva y deja constancia de cuándo. */
  async cambiarEstado(id: string, estado: EstadoReserva): Promise<void> {
    if (!db) return;
    await updateDoc(doc(db, 'reservas', id), { estado, estadoActualizado: serverTimestamp() });
  }

  /** Guarda una nota interna sobre la reserva. */
  async guardarNota(id: string, notas: string): Promise<void> {
    if (!db) return;
    await updateDoc(doc(db, 'reservas', id), { notas });
  }

  /** Libera el hueco del calendario (al denegar o cancelar una reserva). */
  async liberarHueco(fecha: string, hora: string, pista: string): Promise<void> {
    if (!db || !fecha || !hora || !pista) return;
    await deleteDoc(doc(db, 'slots', `${fecha}_${hora}_${pista}`));
  }

  /** Bloquea un hueco a mano (p. ej. una reserva recibida por teléfono). */
  async bloquearHueco(fecha: string, hora: string, pista: string): Promise<void> {
    if (!db || !fecha || !hora || !pista) return;
    await setDoc(doc(db, 'slots', `${fecha}_${hora}_${pista}`), {
      fecha, hora, pista, creado: serverTimestamp(), origen: 'admin',
    });
  }
}
