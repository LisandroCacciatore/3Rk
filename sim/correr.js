// Runner de simulación. Corre N partidas por configuración con semillas
// registradas, aplica variantes de reglas vía CAMBIAR_REGLAS y guarda el
// resultado (métricas de cada partida) en un JSON.
//
// Uso:
//   node sim/correr.js --n 20 --config aleatorio/aleatorio   (corrida de humo)
//   node sim/correr.js                                        (campaña completa)
//
// El motor no se modifica: cada partida es crearEstadoInicial + aplicarIntencion.
// Los bots solo deciden intenciones legales a partir del estado.

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { jugarPartida, resumenDePartida } from './jugar-partida.js'

const VARIANTES = {
  base: null,
  // D-05: contador 1/3/5/9 por ronda en vez de por turno.
  'contador-ronda': { reinicioContador: 'ronda' },
  // D-23: Stunned quita 1 dado guardado en vez de 1 dado del pool.
  'stunned-keep': { stunnedReduceKept: true },
  // A-11-N4 (Ítem E): Stunned reduce 1 dado del pool Y 1 del keep.
  'stunned-duro': { stunnedDuro: true },
  // A-11-N5 (Ítem E): ganar por diferencia >= 2 empuja 1 hex al defensor.
  'retroceso-defensor': { retrocesoDefensorDiferencia2: true },
  // D-12: el defensor SÍ puede quedar Stunned al recibir una herida.
  'defensor-stunned': { defensorNoQuedaStunned: false },
}

// Campaña de la Fase 3: los 3 emparejamientos en reglas base, y las 3
// variantes de reglas sobre el emparejamiento principal (codicioso/codicioso),
// donde las diferencias de curva, Stunned y contador se ven más limpias.
export const CAMPAÑA = [
  { config: 'aleatorio/aleatorio', variante: 'base' },
  { config: 'codicioso/codicioso', variante: 'base' },
  { config: 'codicioso/ahorrador', variante: 'base' },
  { config: 'codicioso/codicioso', variante: 'contador-ronda' },
  { config: 'codicioso/codicioso', variante: 'stunned-keep' },
  { config: 'codicioso/codicioso', variante: 'stunned-duro' },
  { config: 'codicioso/codicioso', variante: 'retroceso-defensor' },
  { config: 'codicioso/codicioso', variante: 'defensor-stunned' },
]

function parseArgs(argv) {
  const args = { n: 500, config: null }
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--n' && argv[i + 1]) args.n = parseInt(argv[i + 1], 10)
    if (argv[i] === '--config' && argv[i + 1]) args.config = argv[i + 1]
  }
  return args
}

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const RUTA_RESULTADOS = path.join(__dirname, 'resultados.json')

// Carga el JSON si existe, para poder reanudar una campaña cortada.
function cargarResultados() {
  if (fs.existsSync(RUTA_RESULTADOS)) {
    try {
      return JSON.parse(fs.readFileSync(RUTA_RESULTADOS, 'utf-8'))
    } catch {
      return null
    }
  }
  return null
}

function guardarResultados(data) {
  fs.writeFileSync(RUTA_RESULTADOS, JSON.stringify(data, null, 2))
  console.log(`  [checkpoint] ${Object.keys(data.resultados).length} configuración(es) guardada(s)`)
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const args = parseArgs(process.argv.slice(2))
  const campana = args.config
    ? CAMPAÑA.filter((c) => `${c.config}::${c.variante}` === args.config)
    : CAMPAÑA

  console.log(`Simulando ${args.n} partidas por configuración:`)
  for (const { config, variante } of campana) console.log(`  ${config} :: ${variante}`)

  const existente = cargarResultados()
  const resultados = existente?.resultados || {}
  const fecha = existente?.fecha || new Date().toISOString()

  for (const item of campana) {
    const { config, variante } = item
    const key = `${config}::${variante}`
    const yaTiene = resultados[key] ? resultados[key].length : 0
    if (yaTiene >= args.n) {
      console.log(`  [reanudar] ${key} ya completa (${yaTiene} partidas)`)
      continue
    }
    const [botA, botB] = config.split('/')
    const reglas = VARIANTES[variante]
    const partidas = resultados[key] ? [...resultados[key]] : []
    console.log(`  ${key}: faltan ${args.n - yaTiene} partidas`)
    const LOTE = 50
    for (let i = yaTiene; i < args.n; i++) {
      const semilla = `${args.config ? 'corto' : 'camp'}-${variante}-${config}-${i}`
      const { estado, motivo } = jugarPartida({ semilla, botA, botB, variante: reglas })
      partidas.push(resumenDePartida(estado, semilla, motivo))
      if ((i + 1) % LOTE === 0) {
        resultados[key] = partidas
        guardarResultados({ fecha, n: args.n, resultados })
      }
    }
    resultados[key] = partidas
    guardarResultados({ fecha, n: args.n, resultados })
  }

  console.log(`\nResultados completos en ${RUTA_RESULTADOS}`)
}
