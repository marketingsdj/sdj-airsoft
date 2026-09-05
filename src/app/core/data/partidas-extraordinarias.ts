// ─────────────────────────────────────────────────────────────────────────────
//  PARTIDAS EXTRAORDINARIAS
// ─────────────────────────────────────────────────────────────────────────────
//  Partidas especiales (normalmente LUNES) de 16:00 a 20:00.
//  · Socios: GRATIS
//  · No socios: entrada reducida 14,90 €
//
//  👉 CÓMO AÑADIR UNA PARTIDA EXTRAORDINARIA:
//     Escribe la fecha en la lista de abajo con el formato 'AAAA-MM-DD'
//     (año-mes-día, con dos dígitos en mes y día). Guarda y sube a GitHub.
//     Ejemplo: el lunes 13 de julio de 2026 sería  '2026-07-13'
//
//     Puedes poner varias, una por línea. Las que ya hayan pasado se ignoran
//     solas. Las tres vistas (inicio, partidas y calendario de reserva) se
//     actualizan automáticamente.
// ─────────────────────────────────────────────────────────────────────────────

export const PARTIDAS_EXTRAORDINARIAS: string[] = [
  '2026-07-06',   // ← PRUEBA (partida extraordinaria de ejemplo)
  // '2026-07-13',   ← ejemplo (borra el // del principio para activarla)
];

// Configuración común a todas las partidas extraordinarias.
export const EXTRA_CONFIG = {
  horaInicio: '16:00',
  horaFin: '20:00',
  horaLabel: '16:00 – 20:00',
  precioSocio: 0,
  precioNoSocio: 14.90,     // con equipo propio (tarifa reducida)
  precioAlquiler: 29.90,    // alquiler estándar (tarifa reducida)
  precioPremium: 34.90,     // alquiler premium (tarifa reducida)
  modo: 'Partida extraordinaria',
  tipo: 'Extraordinaria',
  descripcion: 'Partida extraordinaria en horario de tarde (16:00–20:00).',
};

// Devuelve 'AAAA-MM-DD' en hora local (evita desfases de zona horaria).
export function fechaLocalISO(d: Date): string {
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
}

// ¿Esta fecha (Date o 'AAAA-MM-DD') es una partida extraordinaria?
export function esExtraordinaria(fecha: Date | string): boolean {
  const iso = typeof fecha === 'string' ? fecha : fechaLocalISO(fecha);
  return PARTIDAS_EXTRAORDINARIAS.includes(iso);
}

// ── Generador común de "próximas partidas" ──────────────────────────────────
// Recorre el calendario desde hoy e incluye, en orden cronológico, tanto las
// partidas abiertas de fin de semana como las extraordinarias que hayas puesto.
export interface PartidaItem {
  fecha: Date;
  hora: string;          // hora de inicio a mostrar
  horaLabel: string;     // etiqueta de horario (p. ej. '16:00 – 20:00')
  modo: string;
  tipo: string;          // 'Abierta' | 'Extraordinaria'
  plazas: number;
  total: number;
  precio: number;        // precio no socio / precio normal
  precioSocio: number | null;   // solo extraordinaria (gratis)
  esExtraordinaria: boolean;
}

const MODOS = ['Captura de bandera', 'Dominación', 'Eliminación', 'Milsim corto'];

// `extras`: fechas añadidas desde el panel (Firestore), además de las de arriba.
export function generarProximasPartidas(cantidad: number, extras: string[] = []): PartidaItem[] {
  const out: PartidaItem[] = [];
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const cursor = new Date(hoy);
  let modoIdx = 0;
  let guard = 0;

  while (out.length < cantidad && guard < 1500) {
    const iso = fechaLocalISO(cursor);
    const dow = cursor.getDay();

    if (esExtraordinaria(iso) || extras.includes(iso)) {
      out.push({
        fecha: new Date(cursor),
        hora: EXTRA_CONFIG.horaInicio,
        horaLabel: EXTRA_CONFIG.horaLabel,
        modo: EXTRA_CONFIG.modo,
        tipo: EXTRA_CONFIG.tipo,
        plazas: 30,
        total: 30,
        precio: EXTRA_CONFIG.precioNoSocio,
        precioSocio: EXTRA_CONFIG.precioSocio,
        esExtraordinaria: true,
      });
    } else if (dow === 6 || dow === 0) {
      out.push({
        fecha: new Date(cursor),
        hora: '09:00',
        horaLabel: '09:00',
        modo: MODOS[modoIdx % MODOS.length],
        tipo: 'Abierta',
        plazas: 30,
        total: 30,
        precio: 39.90,
        precioSocio: null,
        esExtraordinaria: false,
      });
      modoIdx++;
    }

    cursor.setDate(cursor.getDate() + 1);
    guard++;
  }

  return out;
}
