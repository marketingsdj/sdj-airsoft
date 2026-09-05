import { Injectable, signal } from '@angular/core';
import { collection, doc, onSnapshot, setDoc, deleteDoc } from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../firebase';
import { PLANTILLAS, ASUNTO_AVISO } from '../data/plantillas-aviso';

/**
 * Textos de los avisos al cliente, editables desde el panel.
 *
 * Los de fábrica están en `plantillas-aviso.ts`. Aquí solo se guardan los que
 * el equipo ha reescrito (colección `plantillas_aviso`, id = motivo); borrar
 * el documento equivale a volver al texto original.
 */
@Injectable({ providedIn: 'root' })
export class PlantillasService {
  /** Solo las reescritas desde el panel. */
  private readonly propias = signal<Record<string, string>>({});

  constructor() {
    if (isFirebaseConfigured && db) {
      onSnapshot(collection(db, 'plantillas_aviso'), snap => {
        const mapa: Record<string, string> = {};
        snap.docs.forEach(d => {
          const texto = (d.data() as { texto?: string }).texto;
          if (typeof texto === 'string') mapa[d.id] = texto;
        });
        this.propias.set(mapa);
      });
    }
  }

  /** Texto en uso para ese motivo: el reescrito, o el de fábrica. */
  texto(motivo: string): string {
    return this.propias()[motivo] ?? this.original(motivo);
  }

  /** Texto de fábrica, para poder compararlo o restaurarlo. */
  original(motivo: string): string {
    if (motivo === 'asunto') return ASUNTO_AVISO;
    return PLANTILLAS[motivo] ?? PLANTILLAS['confirmada'];
  }

  /** ¿Está reescrito (distinto del de fábrica)? */
  esPropio(motivo: string): boolean {
    return this.propias()[motivo] !== undefined;
  }

  async guardar(motivo: string, texto: string): Promise<void> {
    if (!db) return;
    await setDoc(doc(db, 'plantillas_aviso', motivo), { texto });
  }

  /** Vuelve al texto de fábrica. */
  async restaurar(motivo: string): Promise<void> {
    if (!db) return;
    await deleteDoc(doc(db, 'plantillas_aviso', motivo));
  }
}
