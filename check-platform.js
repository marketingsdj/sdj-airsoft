const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

const platformFile = path.join(__dirname, '.node-platform');
const nodeModules = path.join(__dirname, 'node_modules');
const currentPlatform = `${process.platform}-${os.arch()}`;

let needsInstall = false;

if (!fs.existsSync(nodeModules)) {
  console.log('node_modules no encontrado, instalando...');
  needsInstall = true;
} else if (fs.existsSync(platformFile)) {
  const savedPlatform = fs.readFileSync(platformFile, 'utf8').trim();
  if (savedPlatform !== currentPlatform) {
    console.log(`Plataforma cambió de "${savedPlatform}" a "${currentPlatform}"`);
    console.log('Reinstalando módulos para la plataforma actual...');
    fs.rmSync(nodeModules, { recursive: true, force: true });
    needsInstall = true;
  }
} else {
  // node_modules existe pero sin archivo de plataforma — registrar la actual
  fs.writeFileSync(platformFile, currentPlatform);
  console.log(`Plataforma registrada: ${currentPlatform}`);
}

if (needsInstall) {
  execSync('npm install', { stdio: 'inherit', cwd: __dirname });
  fs.writeFileSync(platformFile, currentPlatform);
  console.log('Instalación completada para', currentPlatform);
}
