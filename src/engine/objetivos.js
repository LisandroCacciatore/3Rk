import { hexKey } from './hex.js'
import { agregarEvento } from './log.js'

// ═══════════════════════════════════════════════════════════════════════════
// D-33 (aprobado 12/08/2026): victoria por OBJETIVOS como sistema CORE.
//
// El escenario declara `tablero.objetivos` (hex del puente + lista de hexes
// que cuentan como "lado enemigo") y el motor lleva `estado.marcador` con los
// estandartes de cada bando. Las metas y el umbral viven en `estado.reglas`
// (conmutables D-34/D-35). La muerte del Rey y la eliminación total SIGUEN
// ganando al instante (round.js / index.js), así que acá solo se suman puntos y
// se decide la victoria por objetivos.
// ═══════════════════════════════════════════════════════════════════════════

export function objetivosActivos(estado) {
  return !!(estado.reglas?.victoriaObjetivos && estado.tablero?.objetivos)
}

// D-34: +1 por enemigo eliminado (al bando del que causó la baja).
export function otorgarBaja(estado, eliminado) {
  if (!objetivosActivos(estado)) return
  const matador = eliminado.jugador === 'A' ? 'B' : 'A'
  const puntos = estado.reglas.victoriaPuntosBaja
  estado.marcador[matador] += puntos
  registrarMarcador(estado, matador, puntos, `baja de ${eliminado.id}`)
}

// D-34: metas de FIN DE TURNO. Control del puente (+2 si una unidad propia
// ocupa el hex del puente) y cruce (+2 por cada unidad propia que termine su
// turno en el lado enemigo). Solo suma, la victoria la decide index.js.
export function metasFinDeTurno(estado, jugador) {
  if (!objetivosActivos(estado)) return
  const obj = estado.tablero.objetivos

  if (obj.puente) {
    const enPuente = estado.unidades.some(u =>
      u.jugador === jugador && hexKey(u.pos) === hexKey(obj.puente)
    )
    if (enPuente) {
      const puntos = estado.reglas.victoriaPuntosPuente
      estado.marcador[jugador] += puntos
      registrarMarcador(estado, jugador, puntos, 'control del puente')
    }
  }

  const ladoEnemigo = obj.ladoEnemigo?.[jugador] || []
  const cruzadas = estado.unidades.filter(u =>
    u.jugador === jugador && ladoEnemigo.includes(hexKey(u.pos))
  )
  if (cruzadas.length > 0) {
    const puntos = estado.reglas.victoriaPuntosCruce * cruzadas.length
    estado.marcador[jugador] += puntos
    registrarMarcador(estado, jugador, puntos, `${cruzadas.length} unidad(es) en lado enemigo`)
  }
}

// D-35: verifica umbral y límite de rondas. Devuelve la victoria de objetivos o
// null si todavía no se decide (la eliminación/Rey se chequea aparte en index).
// Desempate por puntos → Rey vivo; si ambos Reyes viven o ninguno, empate.
export function verificarVictoriaObjetivos(estado) {
  if (!objetivosActivos(estado)) return null

  const umbral = estado.reglas.victoriaUmbral
  if (estado.marcador.A >= umbral) return { ganador: 'A', motivo: 'objetivos' }
  if (estado.marcador.B >= umbral) return { ganador: 'B', motivo: 'objetivos' }

  const limite = estado.reglas.victoriaLimiteRondas
  if (estado.ronda > limite) {
    if (estado.marcador.A !== estado.marcador.B) {
      return {
        ganador: estado.marcador.A > estado.marcador.B ? 'A' : 'B',
        motivo: 'puntos al límite de rondas',
      }
    }
    const reyA = estado.unidades.some(u => u.jugador === 'A' && u.arquetipo === 'Rey')
    const reyB = estado.unidades.some(u => u.jugador === 'B' && u.arquetipo === 'Rey')
    if (reyA && !reyB) return { ganador: 'A', motivo: 'desempate por Rey vivo' }
    if (reyB && !reyA) return { ganador: 'B', motivo: 'desempate por Rey vivo' }
    return { ganador: null, motivo: 'empate' }
  }

  return null
}

function registrarMarcador(estado, jugador, puntos, motivo) {
  estado.log = agregarEvento(estado.log, {
    ronda: estado.ronda,
    actor: 'SISTEMA',
    tipo: 'marcador',
    cantidad: puntos,
    descripcion: `${jugador} +${puntos} estandarte(s): ${motivo}`,
  }, estado.turnoDe)
}
