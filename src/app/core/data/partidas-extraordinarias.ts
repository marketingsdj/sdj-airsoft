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

// Tarifa de una partida extraordinaria: la reducida de siempre o la normal.
export type ExtraTarifaTipo = 'reducida' | 'normal';

// Precios por persona segun la tarifa del dia. 'socio' es gratis en ambas.
export const EXTRA_PRECIOS: Record<ExtraTarifaTipo, {
  socio: number; propio: number; alquiler: number; premium: number;
}> = {
  reducida: { socio: 0, propio: 14.90, alquiler: 29.90, premium: 34.90 },
  normal:   { socio: 0, propio: 19.90, alquiler: 39.90, premium: 44.90 },
};

// Configuracion de un dia extraordinario concreto (tarifa y horario).
export interface ExtraDia {
  fecha: string;             // 'AAAA-MM-DD'
  tarifa: ExtraTarifaTipo;
  horaInicio: string;        // 'HH:MM'
  horaFin: string;           // 'HH:MM'
}

// Valores por defecto al abrir una partida extraordinaria desde el panel.
export const EXTRA_DEFECTO = {
  tarifa: 'reducida' as ExtraTarifaTipo,
  horaInicio: '16:00',
  horaFin: '20:00',
};

export function extraDiaPorDefecto(fecha: string): ExtraDia {
  return { fecha, ...EXTRA_DEFECTO };
}

// Etiqueta de horario a mostrar (p. ej. '16:00 – 20:00').
export function extraHoraLabel(dia: { horaInicio: string; horaFin: string }): string {
  return `${dia.horaInicio} – ${dia.horaFin}`;
}

// Configuración común a todas las partidas extraordinarias. Los precios de
// aqui son los de la tarifa reducida, que es la de siempre; un dia concreto
// puede llevar la normal (ver EXTRA_PRECIOS).
export const EXTRA_CONFIG = {
  horaInicio: EXTRA_DEFECTO.horaInicio,
  horaFin: EXTRA_DEFECTO.horaFin,
  horaLabel: `${EXTRA_DEFECTO.horaInicio} – ${EXTRA_DEFECTO.horaFin}`,
  precioSocio: EXTRA_PRECIOS.reducida.socio,
  precioNoSocio: EXTRA_PRECIOS.reducida.propio,
  precioAlquiler: EXTRA_PRECIOS.reducida.alquiler,
  precioPremium: EXTRA_PRECIOS.reducida.premium,
  modo: 'Partida extraordinaria',
  tipo: 'Extraordinaria',
  descripcion: 'Partida extraordinaria en horario de tarde.',
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
// `configs`: tarifa y horario de cada una de esas fechas (lo que no venga usa
// los valores por defecto).
export function generarProximasPartidas(
  cantidad: number,
  extras: string[] = [],
  configs: Record<string, ExtraDia> = {},
): PartidaItem[] {
  const out: PartidaItem[] = [];
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  // La agenda mira hacia delante: el día en curso ya no se ofrece (a media
  // jornada no tiene sentido anunciarlo), así entran las siguientes fechas.
  const cursor = new Date(hoy);
  cursor.setDate(cursor.getDate() + 1);
  let modoIdx = 0;
  let guard = 0;

  while (out.length < cantidad && guard < 1500) {
    const iso = fechaLocalISO(cursor);
    const dow = cursor.getDay();

    if (esExtraordinaria(iso) || extras.includes(iso)) {
      const cfg = configs[iso] ?? extraDiaPorDefecto(iso);
      const precios = EXTRA_PRECIOS[cfg.tarifa];
      out.push({
        fecha: new Date(cursor),
        hora: cfg.horaInicio,
        horaLabel: extraHoraLabel(cfg),
        modo: EXTRA_CONFIG.modo,
        tipo: EXTRA_CONFIG.tipo,
        plazas: 30,
        total: 30,
        precio: precios.propio,
        precioSocio: precios.socio,
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
