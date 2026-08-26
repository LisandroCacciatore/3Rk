// Análisis puntual: ¿la asimetría A/B es por plantilla (Agua > Fuego) o por
// orden de juego? Repite el cálculo del jugador inicial sin re-jugar nada:
// el primer jugador sale de tirarMoneda(rng), pero replicar el consumo exacto
// del rng (barajar del mazo) es frágil. Por eso re-jugamos solo emparejamientos
// rápidos con n moderado.
import { jugarPartida } from './correr.js'

const CONFIGS = {
  'codicioso/codicioso': 150,
  'codicioso/ahorrador': 150,
  'aleatorio/aleatorio': 40,
}

for (const [config, n] of Object.entries(CONFIGS)) {
  let empiezaA = { total: 0, ganaA: 0 }
  let empiezaB = { total: 0, ganaA: 0 }
  let ganaA = 0
  let total = 0
  for (let i = 0; i < n; i++) {
    const semilla = `orden-${config}-${i}`
    const { estado } = jugarPartida({ semilla, config })
    if (!estado.ganador) continue
    const g = estado.ganador.ganador
    const p = estado.jugadorInicial
    total++
    if (g === 'A') ganaA++
    if (p === 'A') {
      empiezaA.total++
      if (g === 'A') empiezaA.ganaA++
    } else {
      empiezaB.total++
      if (g === 'A') empiezaB.ganaA++
    }
  }
  const f = (o) => (o.total ? (100 * o.ganaA / o.total).toFixed(0) + '%' : 'n/a')
  console.log(config)
  console.log(`  victoria A global: ${(100 * ganaA / total).toFixed(0)}% (${total} terminadas)`)
  console.log(`  gana A cuando A empieza: ${f(empiezaA)}  (${empiezaA.ganaA}/${empiezaA.total})`)
  console.log(`  gana A cuando B empieza: ${f(empiezaB)}  (${empiezaB.ganaA}/${empiezaB.total})`)
}
