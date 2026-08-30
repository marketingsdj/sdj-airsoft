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
  codigoCancelacion?: string;
  /** "cliente" si la canceló la propia persona desde /cancelar. */
  canceladaPor?: string;
  /** Extras contratados (menú, merienda, doble partida…). */
  extras?: string[];
  /** Día entre semana: la hora es la de llegada aproximada, a cerrar con el cliente. */
  laborable?: boolean;
  /** true cuando ya has fijado tú la hora definitiva. */
  horaFijada?: boolean;
  /** Hora que pidió el cliente al reservar (se conserva aunque la cambies). */
  horaPedida?: string;
  /** Hay un cambio hecho que aún no le has comunicado al cliente. */
  avisoPendiente?: boolean;
  /** Extras que has anulado, para dejar constancia. */
  extrasAnulados?: string[];
  /** Cambio pedido por el cliente desde /cancelar, pendiente de revisar. */
  cambio?: Record<string, unknown> | null;
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
        codigoCancelacion: x['codigoCancelacion'] as string | undefined,
        canceladaPor: x['canceladaPor'] as string | undefined,
        extras: (x['extras'] as string[]) || [],
        laborable: !!x['laborable'],
        horaFijada: !!x['horaFijada'],
        horaPedida: x['horaPedida'] as string | undefined,
        avisoPendiente: !!x['avisoPendiente'],
        extrasAnulados: (x['extrasAnulados'] as string[]) || [],
        creado,
      };
    });
  }

  /** Cambia el estado de una reserva y deja constancia de cuándo. */
  async cambiarEstado(id: string, estado: EstadoReserva): Promise<void> {
    if (!db) return;
    await updateDoc(doc(db, 'reservas', id), { estado, estadoActualizado: serverTimestamp(), avisoPendiente: true });
  }

  /** Fija la hora definitiva de una reserva "a consultar". */
  async fijarHora(id: string, hora: string, horaPedida?: string): Promise<void> {
    if (!db) return;
    const datos: Record<string, unknown> = { hora, horaFijada: true, estadoActualizado: serverTimestamp(), avisoPendiente: true };
    // La primera vez se deja constancia de la hora que habia pedido el cliente.
    if (horaPedida) datos['horaPedida'] = horaPedida;
    await updateDoc(doc(db, 'reservas', id), datos);
  }

  /**
   * Anula un extra concreto manteniendo la reserva. Guarda además el histórico
   * de lo anulado y deja el aviso al cliente pendiente.
   */
  async anularExtra(r: ReservaAdmin, extra: string): Promise<void> {
    if (!db) return;
    await updateDoc(doc(db, 'reservas', r.id), {
      extras: (r.extras || []).filter(e => e !== extra),
      extrasAnulados: [...((r as { extrasAnulados?: string[] }).extrasAnulados || []), extra],
      avisoPendiente: true,
      estadoActualizado: serverTimestamp(),
    });
  }

  /** Deshace la anulación de un extra (por si fue un clic sin querer). */
  async restaurarExtra(r: ReservaAdmin, extra: string): Promise<void> {
    if (!db) return;
    await updateDoc(doc(db, 'reservas', r.id), {
      extras: [...(r.extras || []), extra],
      extrasAnulados: (r.extrasAnulados || []).filter(e => e !== extra),
      estadoActualizado: serverTimestamp(),
    });
  }

  /** Marca que queda (o ya no queda) un aviso por enviar al cliente. */
  async marcarAviso(id: string, pendiente: boolean): Promise<void> {
    if (!db) return;
    await updateDoc(doc(db, 'reservas', id), {
      avisoPendiente: pendiente,
      ...(pendiente ? {} : { avisadoEl: serverTimestamp() }),
    });
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

  /**
   * Peticiones de cambio pedidas por clientes (colección `cancelaciones`).
   * Devuelve un mapa por id de reserva para cruzarlo con el listado.
   */
  async cargarCambios(): Promise<Map<string, { codigo: string; cambio: Record<string, unknown> }>> {
    const mapa = new Map<string, { codigo: string; cambio: Record<string, unknown> }>();
    if (!db) return mapa;
    const snap = await getDocs(query(collection(db, 'cancelaciones'), limit(500)));
    snap.docs.forEach(d => {
      const x = d.data() as Record<string, unknown>;
      const cambio = x['cambio'] as Record<string, unknown> | undefined;
      if (cambio && cambio['estado'] === 'pendiente' && x['reservaId']) {
        mapa.set(x['reservaId'] as string, { codigo: d.id, cambio });
      }
    });
    return mapa;
  }

  /** Acepta el cambio: lo aplica a la reserva y mueve el hueco si cambia la franja. */
  async aceptarCambio(
    reserva: ReservaAdmin,
    codigo: string,
    cambio: Record<string, unknown>,
  ): Promise<void> {
    if (!db) return;
    const nueva: Record<string, unknown> = {};
    if (cambio['fecha'])    nueva['fecha']    = cambio['fecha'];
    if (cambio['hora'])     nueva['hora']     = cambio['hora'];
    if (cambio['pista'])    nueva['pista']    = cambio['pista'];
    if (cambio['personas']) nueva['personas'] = cambio['personas'];
    if (cambio['nombre'])   nueva['nombre']   = cambio['nombre'];
    if (cambio['telefono']) nueva['telefono'] = cambio['telefono'];
    if (cambio['email'])    nueva['email']    = cambio['email'];

    // Si cambia el día o la hora y la reserva tenía franja, se mueve el hueco.
    const fecha = (nueva['fecha'] as string) || reserva.fecha || '';
    const hora  = (nueva['hora']  as string) || reserva.hora  || '';
    const pista = (nueva['pista'] as string) || reserva.pista || '';
    if (nueva['fecha'] || nueva['hora'] || nueva['pista']) {
      // Se suelta la franja antigua y se coge la nueva.
      if (reserva.fecha && reserva.hora && reserva.pista) {
        await this.liberarHueco(reserva.fecha, reserva.hora, reserva.pista);
      }
      if (pista) await this.bloquearHueco(fecha, hora, pista);
    }

    await updateDoc(doc(db, 'reservas', reserva.id), { ...nueva, estadoActualizado: serverTimestamp(), avisoPendiente: true });
    await updateDoc(doc(db, 'cancelaciones', codigo), {
      'cambio.estado': 'aceptado',
      fecha, hora,
      slotId: pista ? `${fecha}_${hora}_${pista}` : '',
    });
  }

  /** Rechaza el cambio: la reserva se queda como estaba. */
  async rechazarCambio(codigo: string): Promise<void> {
    if (!db) return;
    await updateDoc(doc(db, 'cancelaciones', codigo), { 'cambio.estado': 'rechazado' });
  }

  /** Bloquea un hueco a mano (p. ej. una reserva recibida por teléfono). */
  async bloquearHueco(fecha: string, hora: string, pista: string): Promise<void> {
    if (!db || !fecha || !hora || !pista) return;
    await setDoc(doc(db, 'slots', `${fecha}_${hora}_${pista}`), {
      fecha, hora, pista, creado: serverTimestamp(), origen: 'admin',
    });
  }
}
