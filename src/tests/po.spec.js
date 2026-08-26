import { describe, it, expect } from 'vitest'
import { crearEstadoInicial } from '../engine/state.js'
import { aplicarIntencion } from '../engine/index.js'
import { totalPO, poPorElemento, jugarCarta, gastarPO, limpiarPO } from '../engine/po.js'

describe('US-020 — Jugar una carta como Orden genera PO', () => {
  it('La carta genera PO de su elemento y se descarta', () => {
    const estado = crearEstadoInicial('po-01')
    const jugador = estado.turnoDe
    const carta = estado.jugadores[jugador].mano[0]
    const nuevo = aplicarIntencion(estado, {
      tipo: 'JUGAR_CARTA', jugador, indiceCarta: 0,
    })
    const manejador = nuevo.jugadores[jugador]
    expect(manejador.po.length).toBeGreaterThan(0)
    expect(manejador.po.find(p => p.elemento === carta.elemento)).toBeDefined()
    expect(manejador.mano.length).toBe(4)
    expect(manejador.descarte.length).toBe(1)
  })

  it.each([
    ['🔥', 1, 'Fuego'],
    ['💧', 2, 'Agua'],
    ['🌪️', 3, 'Aire'],
    ['🌍', 1, 'Tierra'],
    ['◼️', 2, 'Vacio'],
  ])('Carta %s%i genera %i PO de %s', (emoji, valor, poEsperado, elemento) => {
    const estado = crearEstadoInicial('po-esq')
    const jugador = estado.turnoDe
    const idx = estado.jugadores[jugador].mano.findIndex(
      c => c.elemento === elemento && c.valor === valor
    )
    if (idx === -1) return
    const nuevo = aplicarIntencion(estado, {
      tipo: 'JUGAR_CARTA', jugador, indiceCarta: idx,
    })
    expect(totalPO(nuevo.jugadores[jugador])).toBeGreaterThanOrEqual(poEsperado)
  })

  it('Una carta por turno — segunda carta rechazada', () => {
    const estado = crearEstadoInicial('po-02')
    const jugador = estado.turnoDe
    let actual = aplicarIntencion(estado, {
      tipo: 'JUGAR_CARTA', jugador, indiceCarta: 0,
    })
    const segundo = aplicarIntencion(actual, {
      tipo: 'JUGAR_CARTA', jugador, indiceCarta: 0,
    })
    expect(segundo.jugadores[jugador].mano.length).toBe(
      actual.jugadores[jugador].mano.length
    )
  })
})

describe('US-021 — Acciones básicas aceptan PO de cualquier elemento', () => {
  it('PO insuficientes — gastarPO falla', () => {
    const jugador = { po: [{ elemento: 'Fuego', cantidad: 1 }] }
    const resultado = gastarPO(jugador, 3)
    expect(resultado.ok).toBe(false)
  })

  it('PO suficientes — gastarPO limpia', () => {
    const jugador = { po: [{ elemento: 'Fuego', cantidad: 3 }] }
    const resultado = gastarPO(jugador, 3)
    expect(resultado.ok).toBe(true)
  })
})

describe('US-022 — PO no gastados se pierden al terminar el turno', () => {
  it('Terminar turno limpia PO', () => {
    const estado = crearEstadoInicial('po-03')
    const jugador = estado.turnoDe
    let actual = aplicarIntencion(estado, {
      tipo: 'JUGAR_CARTA', jugador, indiceCarta: 0,
    })
    expect(totalPO(actual.jugadores[jugador])).toBeGreaterThan(0)
    actual = aplicarIntencion(actual, {
      tipo: 'TERMINAR_TURNO', jugador,
    })
    expect(totalPO(actual.jugadores[jugador])).toBe(0)
  })
})
