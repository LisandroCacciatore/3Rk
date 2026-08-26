// US-174 — Modo Solitario: IA Nivel 2 (Greedy). Puro motor: no importa React ni
// toca el DOM. Cada invocación devuelve UNA intención válida para el turno
// activo y el motor la aplica igual que una de jugador humano (mismo barrido,
// mismo Replay). Principio: el bot nunca emite una intención que el motor vaya
// a rechazar, así el turno nunca se traba repitiendo errores.

import {
  hexesMovibles, objetivosAtaque, origenesHabilidad, objetivosHabilidad,
} from './selectors.js'
import { distancia } from './hex.js'
import { costeProximaAccion } from './actions.js'
import { puedeRecibirToken } from './focus.js'

export function pensarIntencionBot(estado) {
  const jugador = estado.turnoDe
  const manejador = estado.jugadores[jugador]

  // Mano vacía y sin carta jugada: no queda nada legal salvo ceder el turno.
  if (manejador.mano.length === 0 && !estado.cartaJugadaEsteTurno) {
    return { tipo: 'TERMINAR_TURNO', jugador }
  }

  // 1. Fase de carta: habilidad si golpea a un enemigo en rango/LoS de alguna
  // unidad aliada; si no, la carta de mayor valor como Orden (maximiza PO).
  if (!estado.cartaJugadaEsteTurno) {
    if (estado.reglas.habilitarHabilidadesCarta) {
      for (let i = 0; i < manejador.mano.length; i++) {
        const carta = manejador.mano[i]
        if (!carta.habilidad) continue
        for (const origen of origenesHabilidad(estado, jugador)) {
          for (const objetivo of objetivosHabilidad(estado, origen.id, carta)) {
            if (objetivo.jugador === jugador) continue
            return {
              tipo: 'JUGAR_CARTA', jugador, indiceCarta: i,
              uso: 'habilidad', unidad: origen.id, objetivo: objetivo.id,
            }
          }
        }
      }
    }
    let mejorIndice = 0
    let maxValor = -1
    for (let i = 0; i < manejador.mano.length; i++) {
      if (manejador.mano[i].valor > maxValor) {
        maxValor = manejador.mano[i].valor
        mejorIndice = i
      }
    }
    // Si alguna unidad aliada tiene Foco vacío y la regla cartaDualUso está
    // activa, jugar la carta de menor valor como Foco (prioridad al
    // desarrollo del arquetipo).
    if (estado.reglas.cartaDualUso) {
      const unidadesAliadas = estado.unidades.filter(u => u.jugador === jugador)
      const unidadFoco = unidadesAliadas.find(u => puedeRecibirToken(u, estado.reglas))
      if (unidadFoco) {
        let menorIndice = 0
        let menorValor = Infinity
        for (let i = 0; i < manejador.mano.length; i++) {
          if (manejador.mano[i].valor < menorValor) {
            menorValor = manejador.mano[i].valor
            menorIndice = i
          }
        }
        return {
          tipo: 'JUGAR_CARTA', jugador, indiceCarta: menorIndice,
          uso: 'foco', unidad: unidadFoco.id, elemento: manejador.mano[menorIndice].elemento,
        }
      }
    }
    return { tipo: 'JUGAR_CARTA', jugador, indiceCarta: mejorIndice, uso: 'orden' }
  }

  // 2. Fase de acción.
  const poDisponibles = manejador.po.reduce((s, p) => s + p.cantidad, 0)
  const unidadesActivas = estado.unidades
    .filter(u => u.jugador === jugador && !u.activacionCerrada)
  if (poDisponibles <= 0 || unidadesActivas.length === 0) {
    return { tipo: 'TERMINAR_TURNO', jugador }
  }

  // 2.1 Atacar: la unidad que paga el coste más bajo y golpea al enemigo más
  // débil en rango (menos vida restante). Atacar cierra la activación.
  let mejorAtaque = null
  for (const unidad of unidadesActivas) {
    const coste = costeProximaAccion(unidad, estado.reglas)
    if (poDisponibles < coste) continue
    const enemigos = objetivosAtaque(estado, unidad.id)
    if (enemigos.length === 0) continue
    const objetivo = enemigos
      .slice()
      .sort((a, b) => (a.maxVida - a.heridas) - (b.maxVida - b.heridas))[0]
    if (!mejorAtaque || coste < mejorAtaque.coste) {
      mejorAtaque = { coste, atacante: unidad.id, objetivo: objetivo.id }
    }
  }
  if (mejorAtaque) {
    return {
      tipo: 'ATACAR', jugador,
      atacante: mejorAtaque.atacante, objetivo: mejorAtaque.objetivo,
    }
  }

  // 2.2 Acercarse: repartir las acciones entre unidades (la curva 1/2/3/5 es
  // por unidad, así que conviene mover varias baratas antes que mover una
  // cara). Cada unidad apunta al Rey enemigo, o a su enemigo más cercano si no
  // hay Rey. Se mueve la unidad de menor coste que más distancia gane.
  const enemigos = estado.unidades.filter(u => u.jugador !== jugador)
  if (enemigos.length > 0) {
    const reyEnemigo = enemigos.find(u => u.arquetipo === 'Rey') || null
    let mejorMovimiento = null
    for (const unidad of unidadesActivas) {
      const coste = costeProximaAccion(unidad, estado.reglas)
      if (poDisponibles < coste) continue
      const moviles = hexesMovibles(estado, unidad.id)
      if (moviles.length === 0) continue
      const blanco = reyEnemigo ||
        enemigos.slice().sort((a, b) =>
          distancia(unidad.pos, a.pos) - distancia(unidad.pos, b.pos))[0]
      const antes = distancia(unidad.pos, blanco.pos)
      let mejorHex = null
      let ganancia = 0
      for (const hex of moviles) {
        const gan = antes - distancia(hex, blanco.pos)
        if (gan > ganancia) { ganancia = gan; mejorHex = hex }
      }
      if (!mejorHex || ganancia <= 0) continue
      if (!mejorMovimiento ||
          coste < mejorMovimiento.coste ||
          (coste === mejorMovimiento.coste && ganancia > mejorMovimiento.ganancia)) {
        mejorMovimiento = { coste, ganancia, unidad: unidad.id, destino: mejorHex }
      }
    }
    if (mejorMovimiento) {
      return {
        tipo: 'MOVER', jugador,
        unidadId: mejorMovimiento.unidad, destino: mejorMovimiento.destino,
      }
    }
  }

  return { tipo: 'TERMINAR_TURNO', jugador }
}