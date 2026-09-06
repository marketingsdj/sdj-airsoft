const fs = require('fs');
const path = require('path');

const src = path.join(__dirname, '..', 'multimedia');
const dest = path.join(__dirname, 'public');

// Los .svg de Canva de más de 500 KB no son vectores: llevan un JPG en base64.
// Cada uno tiene su .webp ligero al lado (optimizar-fotos.mjs), así que no se
// copian a public/ ni entran en git. Los originales siguen en ../multimedia.
const SVG_MAX = 500 * 1024;

if (!fs.existsSync(src)) {
  console.log('No existe ../multimedia: no se sincroniza nada (public/ se usa tal cual).');
  process.exit(0);
}

fs.cpSync(src, dest, {
  recursive: true,
  force: true,
  filter: (p) => {
    const name = path.basename(p);
    if (name.startsWith('._') || name === '.DS_Store') return false; // basura macOS
    if (name.toLowerCase().endsWith('.svg')) {
      const st = fs.statSync(p);
      if (st.isFile() && st.size > SVG_MAX) return false;
    }
    return true;
  },
});

console.log('Sync completado');
