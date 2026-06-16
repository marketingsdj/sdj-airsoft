import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getFirestore, type Firestore } from 'firebase/firestore';

/**
 * ──────────────────────────────────────────────────────────────────────────
 *  CONFIGURACIÓN DE FIREBASE
 * ──────────────────────────────────────────────────────────────────────────
 *  Pega aquí el objeto que te da la consola de Firebase:
 *  Consola → ⚙ Configuración del proyecto → "Tus apps" → app web → SDK config.
 *
 *  Estas claves son PÚBLICAS por diseño (van en el navegador). La seguridad
 *  real se controla con las "Reglas de Firestore" (ver firestore.rules).
 * ──────────────────────────────────────────────────────────────────────────
 */
export const firebaseConfig = {
  apiKey: '',
  authDomain: '',
  projectId: '',
  storageBucket: '',
  messagingSenderId: '',
  appId: '',
};

/** Hay configuración válida solo si has rellenado al menos apiKey y projectId. */
export const isFirebaseConfigured = !!firebaseConfig.apiKey && !!firebaseConfig.projectId;

let app: FirebaseApp | null = null;
let db: Firestore | null = null;

if (isFirebaseConfigured) {
  app = initializeApp(firebaseConfig);
  db = getFirestore(app);
}

export { db };
