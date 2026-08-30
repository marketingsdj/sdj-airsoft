import { Injectable, signal } from '@angular/core';
import {
  collection, doc, getDocs, addDoc, updateDoc, deleteDoc, setDoc, query, orderBy, limit,
  serverTimestamp, Timestamp,
} from 'firebase/firestore';
import {
  signInWithEmailAndPassword, signOut, onAuthStateChanged, type User,
} from 'firebase/auth';
import { db, auth, isFirebaseConfigured } from '../firebase';

/** Estado de gestión de una reserva. */
// Flujo: pendiente (por gestionar) -> recordatorio (gestionada, falta avisar
// unos dias antes) -> confirmada (recordatorio enviado).
export type EstadoReserva = 'pendiente' | 'recordatorio' | 'confirmada' | 'denegada' | 'cancelada';

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
  /** Por qué quedó pendiente el aviso (para poder deshacerlo del todo). */
  avisoMotivo?: string;
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
        (x['gestion'] === 'pendiente' ? 'pendiente' : 'recordatorio');
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
        avisoMotivo: x['avisoMotivo'] as string | undefined,
        creado,
      };
    });
  }

  /**
   * Alta manual de una reserva (teléfono, presencial…). Deja el hueco
   * bloqueado y genera el código para que el cliente pueda gestionarla.
   */
  async crearReserva(datos: {
    tipo: string; fecha: string; hora?: string; pista?: string; personas?: number;
    nombre?: string; email?: string; telefono?: string; extras?: string[];
    laborable?: boolean; notas?: string;
  }): Promise<void> {
    if (!db) return;

    const abc = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const bloque = () => Array.from({ length: 4 }, () => abc[Math.floor(Math.random() * abc.length)]).join('');
    const codigo = bloque() + '-' + bloque();

    const hoy = new Date();
    const ds = hoy.getFullYear().toString()
      + String(hoy.getMonth() + 1).padStart(2, '0')
      + String(hoy.getDate()).padStart(2, '0');
    const numeroReserva = 'SDJ-' + ds + '-' + String(Math.floor(Math.random() * 9000) + 1000);

    const ref = await addDoc(collection(db, 'reservas'), {
      ...datos,
      email: (datos.email || '').trim().toLowerCase(),
      numeroReserva,
      codigoCancelacion: codigo,
      horaPedida: datos.hora || '',
      horaFijada: !!datos.hora,
      estado: 'recordatorio',
      gestion: 'CONFIRMADA',
      origen: 'admin',
      creado: serverTimestamp(),
    });

    const slotId = datos.pista ? datos.fecha + '_' + datos.hora + '_' + datos.pista : '';
    await setDoc(doc(db, 'cancelaciones', codigo), {
      reservaId: ref.id, slotId, fecha: datos.fecha, hora: datos.hora || '', pista: datos.pista || '',
      tipo: datos.tipo, personas: datos.personas || 0, numeroReserva,
      cancelada: false, creado: serverTimestamp(),
    });

    if (slotId) await this.bloquearHueco(datos.fecha, datos.hora || '', datos.pista || '');
  }

  /**
   * Edición completa de una reserva desde el panel. Si cambia la franja,
   * libera la antigua y bloquea la nueva.
   */
  async actualizarReserva(r: ReservaAdmin, datos: {
    tipo?: string; fecha?: string; hora?: string; pista?: string; personas?: number;
    nombre?: string; email?: string; telefono?: string; extras?: string[]; notas?: string;
  }): Promise<void> {
    if (!db) return;

    const fecha = datos.fecha ?? r.fecha ?? '';
    const hora  = datos.hora  ?? r.hora  ?? '';
    const pista = datos.pista ?? r.pista ?? '';
    const cambiaFranja = fecha !== r.fecha || hora !== r.hora || pista !== r.pista;

    if (cambiaFranja) {
      if (r.fecha && r.hora && r.pista) await this.liberarHueco(r.fecha, r.hora, r.pista);
      if (fecha && hora && pista) await this.bloquearHueco(fecha, hora, pista);
    }

    await updateDoc(doc(db, 'reservas', r.id), {
      ...datos,
      ...(datos.email !== undefined ? { email: datos.email.trim().toLowerCase() } : {}),
      estadoActualizado: serverTimestamp(),
      ...(cambiaFranja ? { avisoPendiente: true, avisoMotivo: 'cambio-ok' } : {}),
    });

    // El código de gestión del cliente apunta a la franja: hay que actualizarlo.
    if (cambiaFranja && r.codigoCancelacion) {
      await updateDoc(doc(db, 'cancelaciones', r.codigoCancelacion), {
        fecha, hora, pista,
        slotId: pista ? fecha + '_' + hora + '_' + pista : '',
      }).catch(() => { /* si no existe el código, no pasa nada */ });
    }
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
      extrasAnulados: [...(r.extrasAnulados || []), extra],
      avisoPendiente: true,
      avisoMotivo: 'extra',
      estadoActualizado: serverTimestamp(),
    });
  }

  /** Deshace la anulación de un extra (por si fue un clic sin querer). */
  async restaurarExtra(r: ReservaAdmin, extra: string): Promise<boolean> {
    if (!db) return false;
    const anulados = (r.extrasAnulados || []).filter(e => e !== extra);
    // Si el aviso pendiente lo había provocado este extra y ya no queda
    // ninguno anulado, se deshace también: es como no haber pulsado nada.
    const limpiarAviso = r.avisoMotivo === 'extra' && anulados.length === 0;
    await updateDoc(doc(db, 'reservas', r.id), {
      extras: [...(r.extras || []), extra],
      extrasAnulados: anulados,
      ...(limpiarAviso ? { avisoPendiente: false, avisoMotivo: '' } : {}),
      estadoActualizado: serverTimestamp(),
    });
    return limpiarAviso;
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
