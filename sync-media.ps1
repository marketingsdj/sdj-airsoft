$src = "e:\WEB SDJ\multimedia"
$pub = "e:\WEB SDJ\sdj-airsoft\public"

# Archivos raíz → Inicio
$inicio = @("WEB_INICIO.mp4","No necesitas experiencia previa.svg")
foreach ($f in $inicio) {
    $s = Join-Path $src $f
    $d = Join-Path "$pub\Inicio" $f
    if (Test-Path $s) {
        New-Item -ItemType Directory -Force -Path "$pub\Inicio" | Out-Null
        Copy-Item $s $d -Force
    }
}

# Archivos raíz → Campo
$campo = @("Imagen aerea campo.svg","Campo privadas.svg","Web_campo.mp4")
foreach ($f in $campo) {
    $s = Join-Path $src $f
    $d = Join-Path "$pub\Campo" $f
    if (Test-Path $s) {
        New-Item -ItemType Directory -Force -Path "$pub\Campo" | Out-Null
        Copy-Item $s $d -Force
    }
}

# Carpetas → Inicio
$carpetasInicio = @("Kit inicio","Imagenes asi se vive una partida")
foreach ($c in $carpetasInicio) {
    $s = Join-Path $src $c
    $d = Join-Path "$pub\Inicio" $c
    if (Test-Path $s) {
        robocopy $s $d /MIR /NP /NFL /NDL /NJH /NJS | Out-Null
    }
}

# Carpetas → Campo
$carpetasCampo = @("Campo Instalaciones","Galeria sdj tienda","Modos de juego","Fotos alquilados")
foreach ($c in $carpetasCampo) {
    $s = Join-Path $src $c
    $d = Join-Path "$pub\Campo" $c
    if (Test-Path $s) {
        New-Item -ItemType Directory -Force -Path $d | Out-Null
        robocopy $s $d /MIR /NP /NFL /NDL /NJH /NJS | Out-Null
    }
}

Write-Host "Sync completado" -ForegroundColor Green
