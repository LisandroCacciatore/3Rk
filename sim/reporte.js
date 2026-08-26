// Reporte de la campaña de simulación. Lee sim/resultados.json (generado por
// correr.js) y resume cada watch point con media + percentiles (p10, p50, p90),
// no solo promedios.
//
// Uso: node sim/reporte.js [path-a-resultados.json]

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const archivo = process.argv[2] || path.join(__dirname, 'resultados.json')
const data = JSON.parse(fs.readFileSync(archivo, 'utf-8'))

function percentil(ordenado, p) {
  if (ordenado.length === 0) return null
  const idx = Math.min(ordenado.length - 1, Math.max(0, Math.ceil(ordenado.length * p) - 1))
  return ordenado[idx]
}

function resumen(valores) {
  if (valores.length === 0) return { n: 0, media: null, p10: null, p50: null, p90: null }
  const ordenado = [...valores].sort((a, b) => a - b)
  const media = ordenado.reduce((s, v) => s + v, 0) / ordenado.length
  return {
    n: ordenado.length,
    media: +media.toFixed(2),
    p10: percentil(ordenado, 0.1),
    p50: percentil(ordenado, 0.5),
    p90: percentil(ordenado, 0.9),
  }
}

function extraer(partidas, fn) {
  const vals = []
  for (const p of partidas) {
    const v = fn(p)
    if (v !== null && v !== undefined && Number.isFinite(v)) vals.push(v)
  }
  return vals
}

function imprimirResumen(nombre, valores, unidad = '') {
  const r = resumen(valores)
  if (r.n === 0) {
    console.log(`  ${nombre}: sin datos`)
    return
  }
  console.log(
    `  ${nombre}: n=${r.n} media=${r.media}${unidad} [p10=${r.p10} p50=${r.p50} p90=${r.p90}]`
  )
}

function filaPartida(p) {
  return {
    motivo: p.motivo,
    m: p.metricas,
    rondas: p.rondas,
  }
}

for (const key of Object.keys(data.resultados)) {
  const [config, variante] = key.split('::')
  console.log(`\n${'='.repeat(72)}`)
  console.log(`CONFIG: ${config} | VARIANTE: ${variante}`)
  console.log(`${'='.repeat(72)}`)

  const partidas = data.resultados[key].map(filaPartida)
  const terminadas = partidas.filter((p) => !p.motivo)
  const motivoError = partidas.filter((p) => p.motivo === 'errores').length
  const motivoTope = partidas.filter((p) => p.motivo === 'tope-turnos').length

  console.log(`\n--- ${config} (${partidas.length} partidas) ---`)
  console.log(
    `  terminadas: ${terminadas.length} | errores-bot: ${motivoError} | tope-turnos: ${motivoTope}`
  )

  // Victoria
  const victoriasA = terminadas.filter((p) => p.m.ganador === 'A').length
  const victoriasB = terminadas.filter((p) => p.m.ganador === 'B').length
  const victoriaReina = terminadas.filter((p) => p.m.motivoVictoria === 'muerte del Rey').length
  const t = terminadas.length || 1
  console.log(`  victoria A: ${victoriasA} (${((victoriasA / t) * 100).toFixed(0)}%) | B: ${victoriasB} (${((victoriasB / t) * 100).toFixed(0)}%) | por Rey: ${victoriaReina} (${((victoriaReina / t) * 100).toFixed(0)}%)`)

  // Watch point: curva 1/3/5/9
  console.log('  -- Curva 1/3/5/9 --')
  imprimirResumen('2ª acción (3 PO)', extraer(partidas, (p) => p.m.segundaAccion), '/partida')
  imprimirResumen('3ª acción (5 PO)', extraer(partidas, (p) => p.m.terceraAccion), '/partida')
  imprimirResumen('4ª acción (9 PO)', extraer(partidas, (p) => p.m.cuartaAccion), '/partida')
  imprimirResumen('% turnos con acción cara', extraer(partidas, (p) => p.m.pctAccionesCaras), '%')

  // Watch point: ritmo del Foco
  console.log('  -- Ritmo del Foco --')
  imprimirResumen('tokens Foco generados', extraer(partidas, (p) => p.m.tokensFocoGenerados), '/partida')
  imprimirResumen('técnicas usadas', extraer(partidas, (p) => p.m.tecnicasUsadas), '/partida')
  imprimirResumen('turnos 1er token → 1ª técnica', extraer(partidas, (p) => p.m.turnosPrimerTokenAPrimeraTecnica), ' turnos')
  imprimirResumen('PO perdidos sin gastar', extraer(partidas, (p) => p.m.poPerdidos), '/partida')

  // Watch point: asimetría de tempo
  console.log('  -- Asimetría de tempo --')
  imprimirResumen('turnos en solitario A', extraer(partidas, (p) => p.m.turnosSolitariosA), '/partida')
  imprimirResumen('turnos en solitario B', extraer(partidas, (p) => p.m.turnosSolitariosB), '/partida')
  const conSolit = terminadas.filter((p) => p.m.turnosSolitarios > 0)
  const solitDelGanador = conSolit.filter((p) => p.m.victoriaConSolitarios > 0)
  console.log(`  partidas terminadas con turnos en solitario: ${conSolit.length}/${terminadas.length} — de ellas, el ganador tuvo solitario: ${solitDelGanador.length} (${((solitDelGanador.length / (conSolit.length || 1)) * 100).toFixed(0)}%)`)

  // Watch point: Rey anticlimático
  console.log('  -- Rey anticlimático --')
  imprimirResumen('ronda muerte Rey A', extraer(terminadas, (p) => p.m.rondaMuerteReyA), ' ronda')
  imprimirResumen('ronda muerte Rey B', extraer(terminadas, (p) => p.m.rondaMuerteReyB), ' ronda')
  imprimirResumen('rondas de partida', extraer(partidas, (p) => p.rondas), ' rondas')

  // Watch point: Keep 2 domina
  console.log('  -- Keep 2 domina --')
  imprimirResumen('tasa victoria atacante (Keep2: Campeón/Rey)', extraer(partidas, (p) => p.m.keep2.tasaAtacante))
  imprimirResumen('tasa victoria atacante (resto)', extraer(partidas, (p) => p.m.resto.tasaAtacante))
  imprimirResumen('tasa victoria atacante (global)', extraer(partidas, (p) => p.m.tasaAtacanteGlobal))

  // Watch point: Stunned
  console.log('  -- Stunned --')
  imprimirResumen('intercambios con atacante Stunned', extraer(partidas, (p) => p.m.atacanteStunned.intercambios), '/partida')
  imprimirResumen('tasa victoria atacante Stunned', extraer(partidas, (p) => p.m.atacanteStunned.tasaVictoria))
  imprimirResumen('intercambios con defensor Stunned', extraer(partidas, (p) => p.m.defensorStunned.intercambios), '/partida')
  imprimirResumen('tasa victoria defensor Stunned', extraer(partidas, (p) => p.m.defensorStunned.tasaVictoria))

  // Explosiones y heridas
  console.log('  -- Combate --')
  imprimirResumen('intercambios por partida', extraer(partidas, (p) => p.m.intercambios), '/partida')
  imprimirResumen('frecuencia explosiones', extraer(partidas, (p) => p.m.explosiones.frecuencia))
  for (const [arq, val] of Object.entries(partidas[0]?.m?.heridasPorArquetipo || {})) {
    imprimirResumen(`heridas por ataque (${arq})`, extraer(partidas, (p) => p.m.heridasPorArquetipo[arq]))
  }

  // US-106 — desglose por arquetipo (agregado a través de las partidas)
  const arquetiposBase = partidas[0]?.m?.arquetipos || {}
  const media = (arq, campo) => {
    const valores = extraer(partidas, (p) => p.m.arquetipos?.[arq]?.[campo])
    if (valores.length === 0) return null
    const suma = valores.reduce((s, v) => s + v, 0)
    return +((suma / valores.length) * 1).toFixed(2)
  }
  if (Object.keys(arquetiposBase).length > 0) {
    console.log('  -- Arquetipos (US-106) --')
    for (const arq of Object.keys(arquetiposBase)) {
      console.log(
        `  ${arq}: ataca=${media(arq, 'vecesAtacando')} dañoRealizado=${media(arq, 'dañoRealizado')} ` +
        `defiende=${media(arq, 'vecesDefendiendo')} dañoRecibido=${media(arq, 'dañoRecibido')} ` +
        `derrotado=${media(arq, 'vecesDerrotado')} rondas=${media(arq, 'rondasSobrevividas')} ` +
        `técnicas=${media(arq, 'tecnicasUtilizadas')} foco=${media(arq, 'focoUtilizado')}`
      )
      for (const fac of ['A', 'B']) {
        const f = partidas[0]?.m?.arquetipos?.[arq]?.porFaccion?.[fac]
        if (!f) continue
        const m = (campo) => {
          const valores = extraer(partidas, (p) => p.m.arquetipos?.[arq]?.porFaccion?.[fac]?.[campo])
          if (valores.length === 0) return null
          return +((valores.reduce((s, v) => s + v, 0) / valores.length)).toFixed(2)
        }
        console.log(
          `    [${fac}] dañoRealizado=${m('dañoRealizado')} dañoRecibido=${m('dañoRecibido')} ` +
          `derrotado=${m('vecesDerrotado')} rondas=${m('rondasSobrevividas')}`
        )
      }
    }
  }
}

console.log('\nQué NO prueba esta simulación:')
console.log('  - Si el juego es divertido o las decisiones interesantes (eso lo responden humanos).')
console.log('  - Si las unidades se sienten distintas entre sí más allá de la tasa de victoria.')
console.log('  - El valor de las Técnicas de defensa (Muro) y de doble objetivo (Doble Tiro):')
console.log('    los bots solo declaran técnicas de ataque pagables con tokens o carta.')
