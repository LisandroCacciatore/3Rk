import { describe, it, expect } from 'vitest'
import { aplicarIntencion } from '../engine/index.js'
import { totalPO } from '../engine/po.js'
import { armarEstado, unidad, dadosFijos, buscarUnidad, po } from './helpers.js'

describe('US-085 — Activaciones gratuitas (D-18/D-19)', () => {
  it('Una activación gratuita no consume PO', () => {
    const estado = aplicarIntencion(
      armarEstado({
        rng: dadosFijos([9, 4, 4]),
        turnoDe: 'A',
        unidades: [
          unidad('P1', 'A', 'Peon', { q: 0, r: 0 }),
          unidad('P2', 'B', 'Peon', { q: 1, r: 0 }),
        ],
        poA: [po('A', 'Fuego', 5)],
      }),
      { tipo: 'ATACAR', jugador: 'A', atacante: 'P1', objetivo: 'P2', gratuita: true }
    )
    expect(totalPO(estado.jugadores.A)).toBe(5)
  })

  it('La activación gratuita no altera el contador 1/3/5/9', () => {
    const estado = aplicarIntencion(
      armarEstado({
        rng: dadosFijos([9, 4, 4]),
        turnoDe: 'A',
        unidades: [
          unidad('P1', 'A', 'Peon', { q: 0, r: 0 }),
          unidad('P2', 'B', 'Peon', { q: 1, r: 0 }),
        ],
        poA: [po('A', 'Fuego', 5)],
      }),
      { tipo: 'ATACAR', jugador: 'A', atacante: 'P1', objetivo: 'P2', gratuita: true }
    )
    const p1 = buscarUnidad(estado, 'P1')
    expect(p1.accionesEsteTurno).toBe(0)
  })

  it('El ataque gratuito cierra igual la activación', () => {
    const estado = aplicarIntencion(
      armarEstado({
        rng: dadosFijos([9, 4, 4]),
        turnoDe: 'A',
        unidades: [
          unidad('P1', 'A', 'Peon', { q: 0, r: 0 }),
          unidad('P2', 'B', 'Peon', { q: 1, r: 0 }),
        ],
        poA: [po('A', 'Fuego', 5)],
      }),
      { tipo: 'ATACAR', jugador: 'A', atacante: 'P1', objetivo: 'P2', gratuita: true }
    )
    const p1 = buscarUnidad(estado, 'P1')
    expect(p1.activacionCerrada).toBe(true)
  })

  it('El log identifica la acción como gratuita', () => {
    const estado = aplicarIntencion(
      armarEstado({
        rng: dadosFijos([9, 4, 4]),
        turnoDe: 'A',
        unidades: [
          unidad('P1', 'A', 'Peon', { q: 0, r: 0 }),
          unidad('P2', 'B', 'Peon', { q: 1, r: 0 }),
        ],
        poA: [po('A', 'Fuego', 5)],
      }),
      { tipo: 'ATACAR', jugador: 'A', atacante: 'P1', objetivo: 'P2', gratuita: true }
    )
    const accion = estado.log.find(l => l.tipo === 'accion')
    expect(accion.descripcion).toContain('gratuita')
    expect(accion.coste).toBe(0)
  })

  it('Un movimiento gratuito no consume PO ni incrementa el contador', () => {
    const estado = aplicarIntencion(
      armarEstado({
        turnoDe: 'A',
        unidades: [
          unidad('P1', 'A', 'Peon', { q: 0, r: 0 }),
          unidad('P2', 'B', 'Peon', { q: 0, r: -3 }),
        ],
        poA: [po('A', 'Fuego', 5)],
      }),
      { tipo: 'MOVER', jugador: 'A', unidadId: 'P1', destino: { q: 1, r: 0 }, gratuita: true }
    )
    const p1 = buscarUnidad(estado, 'P1')
    expect(totalPO(estado.jugadores.A)).toBe(5)
    expect(p1.accionesEsteTurno).toBe(0)
    expect(p1.pos).toEqual({ q: 1, r: 0 })
    expect(estado.log.find(l => l.tipo === 'movimiento').descripcion).toContain('gratuita')
  })

  it('El ataque normal usa la activación base gratis (0 PO)', () => {
    const estado = aplicarIntencion(
      armarEstado({
        rng: dadosFijos([9, 4, 4]),
        turnoDe: 'A',
        unidades: [
          unidad('P1', 'A', 'Peon', { q: 0, r: 0 }),
          unidad('P2', 'B', 'Peon', { q: 1, r: 0 }),
        ],
        poA: [po('A', 'Fuego', 5)],
      }),
      { tipo: 'ATACAR', jugador: 'A', atacante: 'P1', objetivo: 'P2' }
    )
    const p1 = buscarUnidad(estado, 'P1')
    expect(totalPO(estado.jugadores.A)).toBe(5)
    expect(p1.accionesEsteTurno).toBe(1)
    expect(p1.activacionBaseUsada).toBe(true)
  })

  it('El segundo movimiento de la misma unidad paga 2 PO (curva extra)', () => {
    let estado = armarEstado({
      rng: dadosFijos([9, 4, 4]),
      turnoDe: 'A',
      unidades: [
        unidad('P1', 'A', 'Peon', { q: 0, r: 0 }),
        unidad('P2', 'B', 'Peon', { q: 1, r: 0 }),
        unidad('P3', 'B', 'Peon', { q: 2, r: 0 }),
      ],
      poA: [po('A', 'Fuego', 5)],
    })
    // Primer ataque = gratis (y cierra activación)
    estado = aplicarIntencion(estado, { tipo: 'ATACAR', jugador: 'A', atacante: 'P1', objetivo: 'P2' })
    expect(totalPO(estado.jugadores.A)).toBe(5)
    // No se puede atacar de nuevo con P1 (activación cerrada)
    // Usamos una unidad distinta para la segunda acción
    // Pero para probar la curva extra, movemos P1 antes de atacar
    let estado2 = armarEstado({
      turnoDe: 'A',
      unidades: [
        unidad('P1', 'A', 'Peon', { q: 0, r: 0 }),
        unidad('P2', 'B', 'Peon', { q: 5, r: 0 }),
        unidad('P3', 'B', 'Peon', { q: 6, r: 0 }),
      ],
      poA: [po('A', 'Fuego', 5)],
    })
    // Primer movimiento = gratis (activación base)
    estado2 = aplicarIntencion(estado2, { tipo: 'MOVER', jugador: 'A', unidadId: 'P1', destino: { q: 1, r: 0 } })
    expect(totalPO(estado2.jugadores.A)).toBe(5)
    // Segundo movimiento = 2 PO (primera extra)
    estado2 = aplicarIntencion(estado2, { tipo: 'MOVER', jugador: 'A', unidadId: 'P1', destino: { q: 2, r: 0 } })
    expect(totalPO(estado2.jugadores.A)).toBe(3)
    expect(buscarUnidad(estado2, 'P1').accionesEsteTurno).toBe(2)
  })
})
