# ==============================================
# Script: evaluar_todos.ps1
# Autor:  (tu nombre)
# Propósito:
#   Ejecuta evaluacion_cifrado.js y evaluacion_bits_correctos.js
#   en modo estático y dinámico, con soporte de parámetros.
# ==============================================

# Rutas por defecto de entrada y salida
$entrada = "./test"
$salida = "./resultados"

# Encabezado
Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║         🚀  EJECUCIÓN AUTOMÁTICA DE EVALUACIONES       ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Verifica Node.js
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Node.js no está instalado o no está en el PATH." -ForegroundColor Red
    exit 1
}

# Inicia temporizador total
$startTime = Get-Date

# Función auxiliar
function Ejecutar-Prueba {
    param (
        [string]$Script,
        [string[]]$Args,
        [string]$Descripcion
    )

    Write-Host "`n───────────────────────────────────────────────" -ForegroundColor DarkGray
    Write-Host " Ejecutando: $Descripcion" -ForegroundColor Yellow
    Write-Host "───────────────────────────────────────────────`n" -ForegroundColor DarkGray

    try {
        & node $Script @Args
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Finalizado correctamente: $Descripcion`n" -ForegroundColor Green
        } else {
            Write-Host "⚠️ Error detectado al ejecutar: $Descripcion`n" -ForegroundColor Red
        }
    } catch {
        Write-Host "❌ Falló la ejecución de $Descripcion : $_" -ForegroundColor Red
    }
}

# === EVALUACIÓN CIFRADO ===
& node evaluacion_cifrado.js ./entrada ./resultados 'trabajoterminal2'
# === EVALUACIÓN BITS CORRECTOS ===
& node evaluacion_bits_correctos.js 0
& node evaluacion_bits_correctos.js 1

# === Tiempo total ===
$endTime = Get-Date
$elapsed = $endTime - $startTime

Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║       🏁 TODAS LAS EVALUACIONES HAN FINALIZADO         ║" -ForegroundColor Cyan
Write-Host ("║      Tiempo total de ejecución: {0:hh\:mm\:ss}                     ║" -f $elapsed) -ForegroundColor Cyan
Write-Host "║   Revisa los archivos CSV y carpetas de salida.        ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""
