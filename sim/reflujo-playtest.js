// Builder de un replay de playtest que llega a un ataque con Reflujo (D-16).
//
// La secuencia se arma a mano (estrategia decidida acá, sin bots): el jugador B
// (Agua) concentra 2 tokens de Agua en su Alfil (Alfil-7), lo acerca a una
// unidad de A dentro de rango 2 + LoS, ataca con Reflujo (que pausa en
// combatePendiente) y resuelve con REFLEJAR_DADOS. El jugador A solo juega su
// carta obligatoria y termina el turno.
//
// Cada intención se valida contra el motor (aplicarIntencion): si un paso es
// inválido el motor lo registra como 'error' y el builder lo reporta. Al final
// exporta { semilla, reglas, secuencia } a public/playtests/reflujo.json y
// verifica el determinismo con reproducirPartida (misma semilla + misma
// secuencia = misma partida).

import { crearEstadoInicial } from '../src/engine/state.js'
import { aplicarIntencion } from '../src/engine/index.js'
import { reproducirPartida } from '../src/engine/registro.js'
import { hexesMovibles, objetivosAtaque } from '../src/engine/selectors.js'
import { costeProximaAccion } from '../src/engine/actions.js'
import { costeSiguienteToken } from '../src/engine/focus.js'
import { totalPO } from '../src/engine/po.js'
import { distancia } from '../src/engine/hex.js'
import { writeFileSync, mkdirSync } from 'node:fs'
import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ATAQUE_REFLEJO = { tipo: 'ATACAR', tecnica: 'Reflujo' }
const TOPE_INTENCIONES = 120
const TOPE_RONDAS = 4

const __dirname = dirname(fileURLToPath(import.meta.url))
const SALIDA = `${__dirname}/../public/playtests/reflujo.json`

// Elige en la mano la carta de mayor valor (maximiza PO del turno).
function elegirCarta(estado, jugador) {
  const mano = estado.jugadores[jugador].mano
  let mejor = 0
  for (let i = 1; i < mano.length; i++) {
    if (mano[i].valor > mano[mejor].valor) mejor = i
  }
  return mejor
}

// En el hex alcanzable más cercano al enemigo; si algún hex habilita un ataque
// válido, se prefiere ese. Devuelve null si no hay movimiento.
function hexObjetivo(estado, unidadId) {
  const unidad = estado.unidades.find((u) => u.id === unidadId)
  const enemigos = estado.unidades.filter((u) => u.jugador !== unidad.jugador)
  if (enemigos.length === 0) return null

  const hexes = hexesMovibles(estado, unidadId)
  if (hexes.length === 0) return null

  // 1º preferencia: un hex desde el que ya haya objetivo atacable.
  let atacante = null
  for (const hex of hexes) {
    const clon = JSON.parse(JSON.stringify(estado))
    const u = clon.unidades.find((x) => x.id === unidadId)
    u.pos = { ...hex }
    if (objetivosAtaque(clon, unidadId).length > 0) {
      atacante = hex
      break
    }
  }
  if (atacante) return atacante

  // 2º: el hex que minimiza la distancia al enemigo más cercano.
  let mejor = null
  let mejorDist = Infinity
  for (const hex of hexes) {
    const d = Math.min(...enemigos.map((e) => distancia(hex, e.pos)))
    if (d < mejorDist) {
      mejorDist = d
      mejor = hex
    }
  }
  return mejor
}

// Índices de los dados más bajos a repetir (misma heurística que los bots).
function dadosARepetir(estado) {
  const pendiente = estado.combatePendiente
  if (!pendiente) return []
  const ordenados = pendiente.atq.dadosTirados
    .map((d, i) => ({ i, v: d.valorTotal }))
    .sort((a, b) => a.v - b.v)
  return ordenados
    .slice(0, Math.max(1, Math.floor(ordenados.length / 2)))
    .map((x) => x.i)
}

// Estrategia de B: jugar carta, concentrar 2 Agua en el Alfil, acercarse y
// atacar con Reflujo. Devuelve la intención o null si nada que hacer.
function intencionB(estado) {
  const jugador = 'B'
  const manejador = estado.jugadores[jugador]

  if (estado.combatePendiente) {
    return {
      tipo: 'REFLEJAR_DADOS',
      jugador,
      dadosARepetir: dadosARepetir(estado),
    }
  }

  if (!estado.cartaJugadaEsteTurno && manejador.mano.length > 0) {
    return { tipo: 'JUGAR_CARTA', jugador, indiceCarta: elegirCarta(estado, jugador) }
  }

  const alfil = estado.unidades.find((u) => u.jugador === 'B' && u.arquetipo === 'Alfil')
  if (!alfil || alfil.activacionCerrada) {
    return { tipo: 'TERMINAR_TURNO', jugador }
  }

  const tokensAgua = alfil.foco.filter((t) => t.elemento === 'Agua').length
  const po = totalPO(manejador)

  if (tokensAgua < 2 && po >= costeSiguienteToken(alfil)) {
    return { tipo: 'CONCENTRARSE', jugador, unidadId: alfil.id, elemento: 'Agua' }
  }

  if (tokensAgua >= 2) {
    const objetivos = objetivosAtaque(estado, alfil.id)
    if (objetivos.length > 0) {
      return { ...ATAQUE_REFLEJO, jugador, atacante: alfil.id, objetivo: objetivos[0].id }
    }
    if (po >= costeProximaAccion(alfil, estado.reglas)) {
      const destino = hexObjetivo(estado, alfil.id)
      if (destino) {
        return { tipo: 'MOVER', jugador, unidadId: alfil.id, destino }
      }
    }
  }

  return { tipo: 'TERMINAR_TURNO', jugador }
}

// A solo juega su carta obligatoria y termina el turno (adversario pasivo).
function intencionA(estado) {
  const jugador = 'A'
  const manejador = estado.jugadores[jugador]

  if (estado.combatePendiente) {
    return { tipo: 'REFLEJAR_DADOS', jugador, dadosARepetir: dadosARepetir(estado) }
  }

  if (!estado.cartaJugadaEsteTurno && manejador.mano.length > 0) {
    return { tipo: 'JUGAR_CARTA', jugador, indiceCarta: elegirCarta(estado, jugador) }
  }
  return { tipo: 'TERMINAR_TURNO', jugador }
}

// Construye la partida paso a paso hasta completar el ataque con Reflujo.
// Devuelve { estado, reflujoCompletado, paso, errores }.
function construir(semilla) {
  let estado = crearEstadoInicial(semilla)
  const errores = []
  let reflujoTirado = false

  for (let paso = 0; paso < TOPE_INTENCIONES; paso++) {
    if (estado.ronda > TOPE_RONDAS) break
    if (estado.ganador) break

    const intento = estado.turnoDe === 'B' ? intencionB(estado) : intencionA(estado)
    const antes = estado.log.length
    estado = aplicarIntencion(estado, intento)
    const nuevos = estado.log.slice(antes)

    const hayError = nuevos.some((e) => e.tipo === 'error')
    if (hayError) errores.push({ paso, intento, log: nuevos.find((e) => e.tipo === 'error')?.descripcion })

    // ATACAR con Reflujo pausa en combatePendiente y loguea 'tirada-ataque'.
    if (nuevos.some((e) => e.tipo === 'tirada-ataque' && e.descripcion.includes('Reflujo'))) {
      reflujoTirado = true
    }
    // El ataque quedó completo cuando hubo tirada de Reflujo y ya no hay
    // pendiente (REFLEJAR_DADOS se aplicó en un paso posterior).
    if (reflujoTirado && !estado.combatePendiente) {
      return { estado, reflujoCompletado: true, paso, errores }
    }
  }

  return { estado, reflujoCompletado: false, paso: TOPE_INTENCIONES, errores }
}

// Valida determinismo: reproducirPartida(semilla, secuencia) debe dar el mismo
// resultado que la partida guiada.
function validarDeterminismo(semilla, secuencia, original) {
  const repetido = reproducirPartida(semilla, secuencia)
  return {
    ok:
      repetido.log.length === original.log.length &&
      JSON.stringify(repetido.ganador) === JSON.stringify(original.ganador) &&
      repetido.secuencia.length === original.secuencia.length,
    logIgual: repetido.log.length === original.log.length,
    ganadorIgual: JSON.stringify(repetido.ganador) === JSON.stringify(original.ganador),
    secuenciaIgual: repetido.secuencia.length === original.secuencia.length,
  }
}

let resultado = null
let intentos = 0

for (let n = 1; n <= 40 && !resultado; n++) {
  const semilla = `playtest-reflujo-${n}`
  const r = construir(semilla)
  intentos = n
  if (r.reflujoCompletado && r.errores.length === 0) {
    resultado = { semilla, ...r }
  } else if (r.reflujoCompletado) {
    console.warn(`  semilla ${semilla}: Reflujo completado pero con ${r.errores.length} errores — descartada`)
  }
}

if (!resultado) {
  console.error(`No se encontró una semilla válida en ${intentos} intentos.`)
  process.exit(1)
}

const { semilla, estado, paso, errores } = resultado
const secuencia = estado.secuencia || []
const determinismo = validarDeterminismo(semilla, secuencia, estado)

console.log('=== Builder de replay con Reflujo ===')
console.log(`semilla: ${semilla}`)
console.log(`intentos: ${intentos}`)
console.log(`intenciones: ${secuencia.length} (paso ${paso})`)
console.log(`errores: ${errores.length}`)
console.log(`ronda final: ${estado.ronda}`)
console.log(`ganador: ${estado.ganador ? `${estado.ganador.ganador} (${estado.ganador.motivo})` : 'sin finalizar'}`)
console.log(`determinismo: ${determinismo.ok ? 'OK' : JSON.stringify(determinismo)}`)

const tiradasReflujo = estado.log.filter(
  (e) => e.tipo === 'tirada-ataque' && e.descripcion.includes('Reflujo')
)
console.log(`tiradas con Reflujo en el log: ${tiradasReflujo.length}`)
if (tiradasReflujo.length > 0) console.log(`  ejemplo: ${tiradasReflujo[0].descripcion}`)

const acciones = estado.log.filter((e) => e.tipo === 'accion' && e.tecnica === 'Reflujo')
console.log(`ataques con Reflujo registrados: ${acciones.length}`)

if (errores.length > 0) {
  console.log('errores detectados:')
  for (const e of errores.slice(0, 5)) console.log(`  paso ${e.paso}: ${e.log}`)
}

if (!determinismo.ok || errores.length > 0 || acciones.length === 0) {
  console.error('El replay no cumple las validaciones. No se escribe el archivo.')
  process.exit(1)
}

const registro = {
  semilla,
  reglas: estado.reglas,
  secuencia,
}

mkdirSync(`${__dirname}/../public/playtests`, { recursive: true })
writeFileSync(SALIDA, JSON.stringify(registro, null, 2), 'utf8')
console.log(`\nReplay exportado: ${SALIDA}`)
console.log(`Tamaño: ${JSON.stringify(registro).length} bytes, ${secuencia.length} intenciones.`)
