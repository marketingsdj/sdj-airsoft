// ─────────────────────────────────────────────────────────────────────────────
//  OPTIMIZAR FOTOS
// ─────────────────────────────────────────────────────────────────────────────
//  Busca imágenes .svg PESADAS (fotos con un JPEG/PNG incrustado, típicamente
//  varios MB), crea una versión .webp ligera y actualiza las referencias en el
//  código de .svg a .webp.
//
//  👉 CUÁNDO EJECUTARLO: cada vez que añadas fotos nuevas (modos de juego,
//     instalaciones, etc.) que pesen mucho. Basta con:
//         npm run optimizar-fotos
//     (luego revisa y sube los cambios a GitHub).
//
//  · No borra las imágenes originales: crea el .webp al lado.
//  · Genera el .webp en `public` y en la carpeta fuente `multimedia`, para que
//    no se pierda al hacer npm start (sync-media).
//  · Es seguro re-ejecutarlo: si un .webp ya existe y está al día, lo rehace
//    igual (rápido) y no vuelve a tocar referencias ya cambiadas.
// ─────────────────────────────────────────────────────────────────────────────
import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';

const proj = process.cwd();
const publicRoot = path.join(proj, 'public');
const multimediaRoot = path.join(proj, '..', 'multimedia');
const srcRoot = path.join(proj, 'src');

const UMBRAL = 500 * 1024;   // solo imágenes de más de ~500 KB
const ANCHO_MAX = 1400;      // ancho máximo del .webp
const CALIDAD = 78;          // calidad WebP

function recorrer(dir, cb) {
  if (!fs.existsSync(dir)) return;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) recorrer(p, cb);
    else cb(p);
  }
}

// 1) Localizar los .svg pesados con imagen incrustada dentro de /public.
const pesadas = [];
recorrer(publicRoot, (p) => {
  if (!p.toLowerCase().endsWith('.svg')) return;
  if (fs.statSync(p).size < UMBRAL) return;
  const svg = fs.readFileSync(p, 'utf8');
  const m = svg.match(/data:image\/(jpeg|png);base64,([A-Za-z0-9+/=\s]+)/);
  if (!m) return; // .svg vectorial de verdad (logo, icono): no se toca
  const rel = path.relative(publicRoot, p).replace(/\\/g, '/');
  pesadas.push({ rel, b64: m[2] });
});

if (pesadas.length === 0) {
  console.log('No hay imágenes pesadas que optimizar. ✔');
  process.exit(0);
}

// 2) Crear el .webp optimizado (en public y en multimedia).
const relsSvg = [];
for (const it of pesadas) {
  const buf = Buffer.from(it.b64.replace(/\s/g, ''), 'base64');
  const out = await sharp(buf)
    .resize({ width: ANCHO_MAX, withoutEnlargement: true })
    .webp({ quality: CALIDAD })
    .toBuffer();
  const webpRel = it.rel.replace(/\.svg$/i, '.webp');
  for (const root of [publicRoot, multimediaRoot]) {
    const dest = path.join(root, webpRel);
    if (fs.existsSync(path.dirname(dest))) fs.writeFileSync(dest, out);
  }
  relsSvg.push(it.rel);
  console.log(`${it.rel}  (${(buf.length / 1048576).toFixed(1)} MB)  ->  ${webpRel}  (${Math.round(out.length / 1024)} KB)`);
}

// 3) Actualizar referencias en el código (.ts/.html/.scss): .svg -> .webp.
let archivosTocados = 0;
recorrer(srcRoot, (p) => {
  if (!/\.(ts|html|scss)$/i.test(p)) return;
  let c = fs.readFileSync(p, 'utf8');
  let cambiado = false;
  for (const rel of relsSvg) {
    if (c.includes(rel)) {
      c = c.split(rel).join(rel.replace(/\.svg$/i, '.webp'));
      cambiado = true;
    }
  }
  if (cambiado) { fs.writeFileSync(p, c); archivosTocados++; }
});

console.log(`\n${pesadas.length} imagen(es) optimizada(s). Referencias actualizadas en ${archivosTocados} archivo(s).`);
console.log('Revisa la web y sube los cambios a GitHub.');
