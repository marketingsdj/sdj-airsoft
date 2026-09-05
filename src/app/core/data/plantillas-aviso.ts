// ─────────────────────────────────────────────────────────────────────────────
//  PLANTILLAS DE LOS AVISOS AL CLIENTE
// ─────────────────────────────────────────────────────────────────────────────
//  Textos que el panel prepara para WhatsApp y para el correo. Estos son los
//  de fábrica: desde /admin → «Textos de los avisos» se pueden reescribir sin
//  tocar el código, y siempre se puede volver a estos con «Restaurar».
//
//  Dentro del texto puedes usar marcadores entre llaves; al mandar el mensaje
//  se sustituyen por los datos de esa reserva (ver MARCADORES).
// ─────────────────────────────────────────────────────────────────────────────

export const MARCADORES: { clave: string; ayuda: string }[] = [
  { clave: '{nombre}',    ayuda: 'Nombre de pila del cliente' },
  { clave: '{fecha}',     ayuda: 'Día de la partida (23 de julio de 2026)' },
  { clave: '{cuando}',    ayuda: 'Día y hora (23 de julio de 2026 a las 10:00)' },
  { clave: '{hora}',      ayuda: 'Hora de la reserva' },
  { clave: '{ref}',       ayuda: 'Código del cliente, entre paréntesis' },
  { clave: '{personas}',  ayuda: 'Nº de personas' },
  { clave: '{cuenta}',    ayuda: 'Cuánto falta (¡es mañana!, faltan 5 días…)' },
  { clave: '{autorizacion}', ayuda: 'Enlace al PDF de autorización de menores' },
];

// Clave = motivo del aviso (la del desplegable de la ficha).
export const PLANTILLAS: Record<string, string> = {
  confirmada:
    'Hola {nombre}, te escribimos de Soldados de Juguete. Tu reserva queda confirmada para el '
    + '{cuando}{ref}, para {personas} personas. Estamos en Larrabetzu, Barrio Legina. '
    + 'Unos días antes te escribiremos para recordártelo. Si necesitas cambiar algo, avísanos y lo vemos. '
    + '¡Nos vemos en el campo!',

  recordatorio:
    '¡Hola {nombre}! Somos de Soldados de Juguete y {cuenta} Tenéis la partida el {cuando}{ref}.\n\n'
    + 'Un par de cosas para que salga redondo:\n'
    + '· Venid 30 minutos antes para equiparos con calma.\n'
    + '· Traed ropa de cambio y calzado deportivo cerrado; el buzo lo ponemos nosotros.\n'
    + '· Estamos en Larrabetzu, Barrio Legina, con parking gratuito en la puerta.\n\n'
    + 'Si os surge cualquier cosa, respondednos por aquí. ¡Con ganas de veros!',

  hora:
    'Hola {nombre}, te escribimos de Soldados de Juguete. Hemos fijado la hora de vuestra reserva del '
    + '{fecha}: os esperamos a las {hora}{ref}. Si no os viene bien, decidnos y lo ajustamos. '
    + '¡Nos vemos en el campo!',

  'cambio-ok':
    'Hola {nombre}, te escribimos de Soldados de Juguete. Hemos aplicado el cambio que pediste: '
    + 'tu reserva queda para el {cuando}{ref}. ¡Nos vemos en el campo!',

  'cambio-no':
    'Hola {nombre}, te escribimos de Soldados de Juguete. No podemos aplicar el cambio que pediste '
    + 'porque no tenemos disponibilidad. Tu reserva sigue en pie para el {cuando}{ref}. '
    + 'Si necesitas otra fecha, dínoslo y buscamos alternativa.',

  extra:
    'Hola {nombre}, te escribimos de Soldados de Juguete por tu reserva del {cuando}{ref}. '
    + 'No vamos a poder ofrecerte uno de los extras que habías pedido, así que no se te cobrará. '
    + 'La reserva se mantiene igual. Cualquier duda, aquí estamos.',

  anulada:
    'Hola {nombre}, te escribimos de Soldados de Juguete. Lamentamos decirte que no podemos atender '
    + 'tu reserva del {cuando}{ref}. Si quieres, buscamos otra fecha que os venga bien.',

  autorizacion:
    'Hola {nombre}, te escribimos de Soldados de Juguete por vuestra reserva de Txikipaintball del '
    + '{cuando}{ref}. Necesitamos que cada niño o niña traiga su autorización firmada por el padre, '
    + 'madre o tutor legal. Puedes descargarla aquí: {autorizacion} — Sin ella no podrán participar. '
    + '¡Gracias!',
};

// Asunto del correo. {ref} aquí es el código a secas, sin paréntesis.
export const ASUNTO_AVISO = 'Tu reserva en Soldados de Juguete · {ref}';
