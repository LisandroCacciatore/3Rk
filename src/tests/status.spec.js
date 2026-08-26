import { describe, it, expect } from 'vitest'
import { poolConStunned, agregarStunned } from '../engine/status.js'
import { aplicarIntencion } from '../engine/index.js'
import { crearReglas } from '../data/rules.js'
import { armarEstado, unidad, dadosFijos, buscarUnidad, po } from './helpers.js'

const REGLAS = crearReglas()

describe('US-060 — Estado Stunned', () => {
  it('Stunned resta un dado a la próxima tirada de Ataque', () => {
    const estado = aplicarIntencion(
      armarEstado({
        rng: dadosFijos([7, 3]),
        turnoDe: 'A',
        unidades: [
          unidad('A1', 'A', 'Alfil', { q: 0, r: 0 }, { estados: ['Stunned'] }),
          unidad('B1', 'B', 'Peon', { q: 1, r: 0 }),
        ],
        poA: [po('A', 'Fuego', 5)],
      }),
      { tipo: 'ATACAR', jugador: 'A', atacante: 'A1', objetivo: 'B1' }
    )
    const detalle = estado.log.find(l => l.tipo === 'ataque').detalle
    expect(detalle.poolAtaque).toBe('1g1')
  })

  it('Stunned resta un dado a la próxima tirada de Defensa', () => {
    const pool = poolConStunned({ estados: ['Stunned'] }, { dados: 2, keep: 1 }, REGLAS)
    expect(pool.dados).toBe(1)
  })

  it('El estado se consume con la primera tirada, sea de ataque o de defensa', () => {
    const estado = aplicarIntencion(
      armarEstado({
        rng: dadosFijos([7, 3]),
        turnoDe: 'A',
        unidades: [
          unidad('P1', 'A', 'Peon', { q: 0, r: 0 }),
          unidad('A1', 'B', 'Alfil', { q: 1, r: 0 }, { estados: ['Stunned'] }),
        ],
        poA: [po('A', 'Fuego', 5)],
      }),
      { tipo: 'ATACAR', jugador: 'A', atacante: 'P1', objetivo: 'A1' }
    )
    const alfil = buscarUnidad(estado, 'A1')
    expect(alfil.estados).not.toContain('Stunned')
  })

  it('El pool nunca baja de un dado', () => {
    const pool = poolConStunned({ estados: ['Stunned'] }, { dados: 1, keep: 1 }, REGLAS)
    expect(pool.dados).toBe(1)
  })

  it('Stunned no se acumula', () => {
    const unidadStun = { estados: [] }
    agregarStunned(unidadStun)
    agregarStunned(unidadStun)
    expect(unidadStun.estados.filter(e => e === 'Stunned')).toHaveLength(1)
  })

  it('Stunned no impide activarse', () => {
    const estado = aplicarIntencion(
      armarEstado({
        turnoDe: 'A',
        unidades: [
          unidad('A1', 'A', 'Alfil', { q: 0, r: 0 }, { estados: ['Stunned'] }),
        ],
        poA: [po('A', 'Fuego', 5)],
      }),
      { tipo: 'MOVER', jugador: 'A', unidadId: 'A1', destino: { q: 1, r: 0 } }
    )
    const alfil = buscarUnidad(estado, 'A1')
    expect(alfil.pos).toEqual({ q: 1, r: 0 })
  })
})

describe('A-11-N4 — Stunned duro (Ítem E)', () => {
  it('Stunned duro resta 1 dado del pool Y 1 del keep', () => {
    const pool = poolConStunned(
      { estados: ['Stunned'] },
      { dados: 2, keep: 2 },
      crearReglas({ stunnedDuro: true })
    )
    expect(pool.dados).toBe(1)
    expect(pool.keep).toBe(1)
  })

  it('Stunned duro nunca baja el pool ni el keep de 1', () => {
    const pool = poolConStunned(
      { estados: ['Stunned'] },
      { dados: 1, keep: 1 },
      crearReglas({ stunnedDuro: true })
    )
    expect(pool.dados).toBe(1)
    expect(pool.keep).toBe(1)
  })

  it('Stunned duro prevalece sobre stunnedReduceKept', () => {
    const pool = poolConStunned(
      { estados: ['Stunned'] },
      { dados: 2, keep: 2 },
      crearReglas({ stunnedDuro: true, stunnedReduceKept: true })
    )
    expect(pool.dados).toBe(1)
    expect(pool.keep).toBe(1)
  })
})
