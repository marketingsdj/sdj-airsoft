const fs = require('fs');
const path = require('path');

const src = path.join(__dirname, '..', 'multimedia');
const dest = path.join(__dirname, 'public');

fs.cpSync(src, dest, { recursive: true, force: true });

console.log('Sync completado');
