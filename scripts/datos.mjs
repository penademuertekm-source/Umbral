// Lanza el pipeline de datos con el Python del entorno virtual scripts/.venv (Windows, macOS y Linux).
//   npm run datos            → scripts/construir_datos.py
//   npm run datos:preparar   → crea scripts/.venv e instala scripts/requirements.txt
//   npm run test:datos       → pruebas del pipeline (scripts/pruebas)
import { spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const carpeta = dirname(fileURLToPath(import.meta.url))
const raiz = join(carpeta, '..')
const venv = join(carpeta, '.venv')
const python =
  process.platform === 'win32' ? join(venv, 'Scripts', 'python.exe') : join(venv, 'bin', 'python')

function correr(comando, argumentos) {
  const r = spawnSync(comando, argumentos, { stdio: 'inherit', cwd: raiz })
  return r.status ?? 1
}

const [modo, ...resto] = process.argv.slice(2)

if (modo === '--preparar') {
  const candidatos = process.platform === 'win32' ? [['py', ['-3']], ['python', []]] : [['python3', []], ['python', []]]
  const base = candidatos.find(([cmd, args]) => spawnSync(cmd, [...args, '--version']).status === 0)
  if (!base) {
    console.error('No encontré Python 3. Instala Python 3.11 o superior y vuelve a intentarlo.')
    process.exit(1)
  }
  if (!existsSync(python) && correr(base[0], [...base[1], '-m', 'venv', venv]) !== 0) process.exit(1)
  process.exit(correr(python, ['-m', 'pip', 'install', '-r', join(carpeta, 'requirements.txt')]))
}

if (!existsSync(python)) {
  console.error('Falta el entorno de Python. Ejecuta primero: npm run datos:preparar')
  process.exit(1)
}

if (modo === '--pruebas') {
  process.exit(correr(python, ['-m', 'unittest', 'discover', '-s', join(carpeta, 'pruebas'), '-t', carpeta, ...resto]))
}

process.exit(correr(python, [join(carpeta, 'construir_datos.py'), ...process.argv.slice(2)]))
