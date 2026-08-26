// Runner de partida Bot vs Bot, reutilizable en Node (sim/correr.js) y en el
// navegador (src/ui/SimulationPanel.jsx). No toca el sistema de archivos:
// depende solo del motor y de las políticas de sim/bots.js.
//
// Determinismo: misma semilla + mismas políticas + mismas reglas = misma
// partida, dado por dado. El RNG del bot es independiente del RNG del motor
// (crearEstadoInicial siembra el del motor con la semilla; acá se siembra un
// segundo generador para las decisiones del bot).

import { crearEstadoInicial } from '../src/engine/state.js'
import { aplicarIntencion } from '../src/engine/index.js'
import { mulberry32 } from '../src/engine/dice.js'
import { metricasDePartida } from './metricas.js'
import {
  botAleatorioLegal,
  botCodicioso,
  botAhorrador,
} from './bots.js'

export const BOTS = {
  aleatorio: botAleatorioLegal,
  codicioso: botCodicioso,
  ahorrador: botAhorrador,
}

export const CONFIGS = {
  'aleatorio/aleatorio': [botAleatorioLegal, botAleatorioLegal],
  'codicioso/codicioso': [botCodicioso, botCodicioso],
  'codicioso/ahorrador': [botCodicioso, botAhorrador],
}

export const TOPE_TURNOS = 300
export const TOPE_ERRORES = 40

// Convierte la semilla (string) en un número determinista para sembrar el
// rng propio del bot. Distinto del rng del motor: ese lo siembra crearEstadoInicial.
export function seedBot(semilla, lado) {
  let h = 0
  const str = `${semilla}::${lado}`
  for (let i = 0; i < str.length; i++) {
    h = (h * 31 + str.charCodeAt(i)) | 0
  }
  return h >>> 0
}

// Juega una partida completa con dos bots. Devuelve el estado final y el motivo
// de corte si no terminó (tope de turnos o demasiados errores del bot).
// `botA` y `botB` son claves de BOTS ('aleatorio' | 'codicioso' | 'ahorrador').
export function jugarPartida({ semilla, botA, botB, variante = null }) {
  let estado = crearEstadoInicial(semilla)
  if (variante) {
    estado = aplicarIntencion(estado, {
      tipo: 'CAMBIAR_REGLAS',
      jugador: estado.turnoDe,
      reglas: variante,
    })
  }

  const fnsA = BOTS[botA]
  const fnsB = BOTS[botB]
  const rngBotA = mulberry32(seedBot(semilla, 'A'))
  const rngBotB = mulberry32(seedBot(semilla, 'B'))

  let turnos = 0
  let errores = 0
  let motivo = null

  while (!estado.ganador && turnos < TOPE_TURNOS && errores < TOPE_ERRORES) {
    const jugador = estado.turnoDe
    const bot = jugador === 'A' ? fnsA : fnsB
    const rngBot = jugador === 'A' ? rngBotA : rngBotB
    const intencion = bot(estado, rngBot)
    const antes = estado.log.length
    estado = aplicarIntencion(estado, intencion)
    const nuevos = estado.log.slice(antes)

    if (nuevos.some((e) => e.tipo === 'error')) {
      errores++
    } else {
      errores = 0
      if (nuevos.some((e) => e.tipo === 'fin-turno')) turnos++
    }
  }

  if (!estado.ganador) {
    motivo = errores >= TOPE_ERRORES ? 'errores' : 'tope-turnos'
  }

  return { estado, motivo, turnos }
}

// Resumen serializable de una partida terminada, para agregar en un panel.
export function resumenDePartida(estado, semilla, motivo = null) {
  return {
    semilla,
    motivo,
    rondas: estado.ronda,
    eliminaciones: (estado.log || []).filter((e) => e.tipo === 'eliminacion').length,
    metricas: metricasDePartida(estado),
  }
}
