import { describe, it, expect } from 'vitest'
import { costeProximaAccion } from '../engine/actions.js'
import { aplicarIntencion } from '../engine/index.js'
import { totalPO } from '../engine/po.js'
import { armarEstado, unidad, buscarUnidad, po, dadosFijos } from './helpers.js'

describe('US-030 — Activaciones intercaladas', () => {
  it('Repartir 3 PO entre tres unidades (primera acción gratis por unidad)', () => {
    let estado = armarEstado({
      turnoDe: 'A',
      unidades: [
        unidad('P1', 'A', 'Peon', { q: 0, r: 0 }),
        unidad('A1', 'A', 'Alfil', { q: 2, r: 0 }),
        unidad('C1', 'A', 'Caballo', { q: 4, r: 0 }),
      ],
      poA: [po('A', 'Fuego', 3)],
    })
    estado = aplicarIntencion(estado, { tipo: 'MOVER', jugador: 'A', unidadId: 'P1', destino: { q: 1, r: 0 } })
    estado = aplicarIntencion(estado, { tipo: 'MOVER', jugador: 'A', unidadId: 'A1', destino: { q: 3, r: 0 } })
    estado = aplicarIntencion(estado, { tipo: 'MOVER', jugador: 'A', unidadId: 'C1', destino: { q: 5, r: 0 } })
    expect(buscarUnidad(estado, 'P1').pos).toEqual({ q: 1, r: 0 })
    expect(buscarUnidad(estado, 'A1').pos).toEqual({ q: 3, r: 0 })
    expect(buscarUnidad(estado, 'C1').pos).toEqual({ q: 5, r: 0 })
    // Primera acción de cada unidad es gratis (0 PO), quedan 3 PO
    expect(totalPO(estado.jugadores.A)).toBe(3)
  })

  it('Volver a una unidad ya activada (2ª acción cuesta 2 PO)', () => {
    let estado = armarEstado({
      turnoDe: 'A',
      unidades: [
        unidad('P1', 'A', 'Peon', { q: 0, r: 0 }, { accionesEsteTurno: 1, activacionBaseUsada: true }),
        unidad('A1', 'A', 'Alfil', { q: 2, r: 0 }),
      ],
      poA: [po('A', 'Fuego', 5)],
    })
    // A1 primera acción = gratis
    estado = aplicarIntencion(estado, { tipo: 'MOVER', jugador: 'A', unidadId: 'A1', destino: { q: 3, r: 0 } })
    expect(totalPO(estado.jugadores.A)).toBe(5)
    // P1 segunda acción = 2 PO (curva extra [2,4])
    estado = aplicarIntencion(estado, { tipo: 'MOVER', jugador: 'A', unidadId: 'P1', destino: { q: 1, r: 0 } })
    expect(totalPO(estado.jugadores.A)).toBe(3)
    expect(buscarUnidad(estado, 'P1').accionesEsteTurno).toBe(2)
  })

  it('No se pueden activar unidades del oponente', () => {
    const estado = aplicarIntencion(
      armarEstado({
        turnoDe: 'A',
        unidades: [
          unidad('P1', 'A', 'Peon', { q: 0, r: 0 }),
          unidad('P2', 'B', 'Peon', { q: 2, r: 0 }),
        ],
        poA: [po('A', 'Fuego', 3)],
      }),
      { tipo: 'MOVER', jugador: 'A', unidadId: 'P2', destino: { q: 3, r: 0 } }
    )
    expect(buscarUnidad(estado, 'P2').pos).toEqual({ q: 2, r: 0 })
    expect(totalPO(estado.jugadores.A)).toBe(3)
  })
})

describe('US-031 — Coste progresivo de acciones por unidad (activación base gratis + extra [2,4])', () => {
  it.each([
    [0, false, 0],  // sin acciones previas, base no usada -> gratis
    [0, true, 2],   // sin acciones previas, base usada -> 2 PO (1ª extra)
    [1, true, 2],   // 1 acción previa (base usada) -> 2 PO
    [2, true, 4],   // 2 acciones previas -> 4 PO (2ª extra)
  ])('con %i previas, baseUsada=%s cuesta %i', (previas, baseUsada, coste) => {
    const u = unidad('P1', 'A', 'Peon', { q: 0, r: 0 }, {
      accionesEsteTurno: previas,
      activacionBaseUsada: baseUsada,
    })
    expect(costeProximaAccion(u)).toBe(coste)
  })

  it('El contador es individual por unidad', () => {
    const p1 = unidad('P1', 'A', 'Peon', { q: 0, r: 0 }, { accionesEsteTurno: 2, activacionBaseUsada: true })
    const a1 = unidad('A1', 'A', 'Alfil', { q: 2, r: 0 })
    expect(costeProximaAccion(p1)).toBe(4)
    expect(costeProximaAccion(a1)).toBe(0)
  })

  it('La curva extra es conmutable vía reglas', () => {
    const u = unidad('P1', 'A', 'Peon', { q: 0, r: 0 }, { accionesEsteTurno: 1, activacionBaseUsada: true })
    expect(costeProximaAccion(u, { costesAccionExtra: [1, 3] })).toBe(1)
    expect(costeProximaAccion(u, { costesAccionExtra: [2, 4] })).toBe(2)
  })

  it('El contador se reinicia al terminar el turno', () => {
    const estado = armarEstado({
      turnoDe: 'A',
      cartaJugadaEsteTurno: true,
      unidades: [
        unidad('P1', 'A', 'Peon', { q: 0, r: 0 }, { accionesEsteTurno: 2, activacionBaseUsada: true }),
      ],
      jugadores: {
        A: { mano: [{ elemento: 'Fuego', valor: 1 }] },
        B: { mano: [{ elemento: 'Agua', valor: 1 }] },
      },
    })
    const despues = aplicarIntencion(estado, { tipo: 'TERMINAR_TURNO', jugador: 'A' })
    const p1 = buscarUnidad(despues, 'P1')
    expect(p1.accionesEsteTurno).toBe(0)
    expect(p1.activacionBaseUsada).toBe(false)
  })
})

describe('US-032 — Acción Mover', () => {
  it('Mover paga el coste y desplaza la unidad (primera acción gratis)', () => {
    const estado = aplicarIntencion(
      armarEstado({
        turnoDe: 'A',
        unidades: [unidad('C1', 'A', 'Caballo', { q: 0, r: 0 })],
        poA: [po('A', 'Fuego', 1)],
      }),
      { tipo: 'MOVER', jugador: 'A', unidadId: 'C1', destino: { q: 3, r: 0 } }
    )
    const caballo = buscarUnidad(estado, 'C1')
    expect(caballo.pos).toEqual({ q: 3, r: 0 })
    // Primera acción gratis, PO no se gasta
    expect(totalPO(estado.jugadores.A)).toBe(1)
    expect(caballo.accionesEsteTurno).toBe(1)
    expect(caballo.activacionBaseUsada).toBe(true)
  })

  it('Un movimiento rechazado no consume PO ni contador', () => {
    const estado = aplicarIntencion(
      armarEstado({
        turnoDe: 'A',
        unidades: [unidad('P1', 'A', 'Peon', { q: 0, r: 0 })],
        poA: [po('A', 'Fuego', 1)],
      }),
      { tipo: 'MOVER', jugador: 'A', unidadId: 'P1', destino: { q: 6, r: 0 } }
    )
    const peon = buscarUnidad(estado, 'P1')
    expect(peon.pos).toEqual({ q: 0, r: 0 })
    expect(totalPO(estado.jugadores.A)).toBe(1)
    expect(peon.accionesEsteTurno).toBe(0)
    expect(peon.activacionBaseUsada).toBe(false)
  })
})

describe('US-033 — Atacar cierra la activación de la unidad', () => {
  it('Después de atacar la unidad no vuelve a activarse', () => {
    let estado = armarEstado({
      rng: dadosFijos([5, 4]),
      turnoDe: 'A',
      unidades: [
        unidad('P1', 'A', 'Peon', { q: 0, r: 0 }),
        unidad('P2', 'B', 'Peon', { q: 1, r: 0 }),
      ],
      poA: [po('A', 'Fuego', 5)],
    })
    estado = aplicarIntencion(estado, { tipo: 'ATACAR', jugador: 'A', atacante: 'P1', objetivo: 'P2' })
    expect(buscarUnidad(estado, 'P1').activacionCerrada).toBe(true)
    const poAntes = totalPO(estado.jugadores.A)
    estado = aplicarIntencion(estado, { tipo: 'MOVER', jugador: 'A', unidadId: 'P1', destino: { q: 2, r: 0 } })
    expect(buscarUnidad(estado, 'P1').pos).toEqual({ q: 0, r: 0 })
    expect(totalPO(estado.jugadores.A)).toBe(poAntes)
    expect(estado.log.some(l => l.tipo === 'error' && l.descripcion.includes('ya atacó'))).toBe(true)
  })

  it('Se puede mover y después atacar (primera gratis, segunda cierra)', () => {
    let estado = armarEstado({
      rng: dadosFijos([5, 4]),
      turnoDe: 'A',
      unidades: [
        unidad('P1', 'A', 'Peon', { q: 0, r: 0 }),
        unidad('P2', 'B', 'Peon', { q: 1, r: 0 }),
      ],
      poA: [po('A', 'Fuego', 4)],
    })
    estado = aplicarIntencion(estado, { tipo: 'MOVER', jugador: 'A', unidadId: 'P1', destino: { q: 1, r: -1 } })
    estado = aplicarIntencion(estado, { tipo: 'ATACAR', jugador: 'A', atacante: 'P1', objetivo: 'P2' })
    const p1 = buscarUnidad(estado, 'P1')
    expect(p1.pos).toEqual({ q: 1, r: -1 })
    expect(p1.activacionCerrada).toBe(true)
    expect(p1.accionesEsteTurno).toBe(2)
  })

  it('El cierre se levanta al siguiente turno', () => {
    const estado = armarEstado({
      turnoDe: 'A',
      cartaJugadaEsteTurno: true,
      unidades: [
        unidad('P1', 'A', 'Peon', { q: 0, r: 0 }, { activacionCerrada: true }),
      ],
      jugadores: {
        A: { mano: [{ elemento: 'Fuego', valor: 1 }] },
        B: { mano: [{ elemento: 'Agua', valor: 1 }] },
      },
    })
    const despues = aplicarIntencion(estado, { tipo: 'TERMINAR_TURNO', jugador: 'A' })
    expect(buscarUnidad(despues, 'P1').activacionCerrada).toBe(false)
  })

  it('Defender no cierra la activación', () => {
    let estado = armarEstado({
      rng: dadosFijos([4, 9, 9]),
      turnoDe: 'B',
      unidades: [
        unidad('P1', 'B', 'Peon', { q: 0, r: 0 }),
        unidad('T1', 'A', 'Torre', { q: 1, r: 0 }, { maxVida: 4 }),
      ],
      poB: [po('B', 'Fuego', 5)],
      poA: [po('A', 'Fuego', 2)],
    })
    estado = aplicarIntencion(estado, { tipo: 'ATACAR', jugador: 'B', atacante: 'P1', objetivo: 'T1' })
    const torre = buscarUnidad(estado, 'T1')
    expect(torre.activacionCerrada).toBe(false)
    estado.turnoDe = 'A'
    const despues = aplicarIntencion(estado, { tipo: 'MOVER', jugador: 'A', unidadId: 'T1', destino: { q: 2, r: 0 } })
    expect(buscarUnidad(despues, 'T1').pos).toEqual({ q: 2, r: 0 })
  })
})