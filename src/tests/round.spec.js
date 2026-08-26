import { describe, it, expect } from 'vitest'
import { aplicarIntencion } from '../engine/index.js'
import { verificarVictoria, iniciarNuevaRonda } from '../engine/round.js'
import { totalPO } from '../engine/po.js'
import { armarEstado, unidad, dadosFijos, buscarUnidad, po } from './helpers.js'

const carta = (elemento, valor) => ({ elemento, valor })
const mazoDe = (n) => Array.from({ length: n }, (_, i) =>
  carta(['Fuego', 'Agua', 'Aire', 'Tierra', 'Vacio'][i % 5], (i % 3) + 1)
)

describe('US-080 — Alternancia de turnos sin posibilidad de pasar', () => {
  it('No existe la opción de pasar', () => {
    const estado = aplicarIntencion(
      armarEstado({ turnoDe: 'A' }),
      { tipo: 'PASAR', jugador: 'A' }
    )
    expect(estado.log.some(l => l.tipo === 'error' && l.descripcion.includes('Intención desconocida'))).toBe(true)
  })

  it('El turno alterna entre jugadores', () => {
    const estado = armarEstado({
      turnoDe: 'A',
      jugadores: {
        A: { mano: [carta('Fuego', 1)] },
        B: { mano: [carta('Agua', 1)] },
      },
    })
    let actual = aplicarIntencion(estado, { tipo: 'JUGAR_CARTA', jugador: 'A', indiceCarta: 0 })
    actual = aplicarIntencion(actual, { tipo: 'TERMINAR_TURNO', jugador: 'A' })
    expect(actual.turnoDe).toBe('B')
  })

  it('No se puede terminar el turno sin jugar carta', () => {
    const estado = armarEstado({
      turnoDe: 'A',
      jugadores: {
        A: { mano: [carta('Fuego', 1)] },
        B: { mano: [carta('Agua', 1)] },
      },
    })
    const despues = aplicarIntencion(estado, { tipo: 'TERMINAR_TURNO', jugador: 'A' })
    expect(despues.turnoDe).toBe('A')
    expect(despues.log.some(l => l.tipo === 'error' && l.descripcion.includes('debe jugar una carta'))).toBe(true)
  })

  it('Con la mano vacía se puede terminar el turno y cederlo (sin deadlock)', () => {
    const estado = armarEstado({
      turnoDe: 'A',
      jugadores: {
        A: { mano: [], mazo: [], descarte: [] },
        B: { mano: [carta('Agua', 1)], mazo: [], descarte: [] },
      },
    })
    const despues = aplicarIntencion(estado, { tipo: 'TERMINAR_TURNO', jugador: 'A' })
    expect(despues.turnoDe).toBe('B')
    expect(despues.log.some(l => l.tipo === 'error')).toBe(false)
  })
})

describe('US-081 — Turnos en solitario y fin de ronda', () => {
  it('El jugador sin cartas cede el turno', () => {
    const estado = armarEstado({
      turnoDe: 'A',
      jugadores: {
        A: { mano: [carta('Fuego', 1), carta('Agua', 2)] },
        B: { mano: [] },
      },
    })
    let actual = aplicarIntencion(estado, { tipo: 'JUGAR_CARTA', jugador: 'A', indiceCarta: 0 })
    actual = aplicarIntencion(actual, { tipo: 'TERMINAR_TURNO', jugador: 'A' })
    expect(actual.turnoDe).toBe('A')
    expect(actual.log.some(l => l.descripcion.includes('no puede jugar'))).toBe(true)
  })

  it('En solitario no se roba: la mano del que sigue jugando se agota', () => {
    const estado = armarEstado({
      rng: dadosFijos(Array(20).fill(3)),
      turnoDe: 'A',
      jugadorInicial: 'A',
      jugadores: {
        A: { mano: [carta('Fuego', 1), carta('Agua', 2)], mazo: mazoDe(5), descarte: [] },
        B: { mano: [], mazo: [], descarte: [] },
      },
    })
    let actual = aplicarIntencion(estado, { tipo: 'JUGAR_CARTA', jugador: 'A', indiceCarta: 0 })
    actual = aplicarIntencion(actual, { tipo: 'TERMINAR_TURNO', jugador: 'A' })
    expect(actual.turnoDe).toBe('A')
    expect(actual.jugadores.A.mano).toHaveLength(1)
    expect(actual.jugadores.A.mazo).toHaveLength(5)

    actual = aplicarIntencion(actual, { tipo: 'JUGAR_CARTA', jugador: 'A', indiceCarta: 0 })
    actual = aplicarIntencion(actual, { tipo: 'TERMINAR_TURNO', jugador: 'A' })
    expect(actual.ronda).toBe(2)
    expect(actual.log.some(l => l.tipo === 'fin-ronda')).toBe(true)
  })

  it('La ronda termina solo con ambas manos vacías', () => {
    const estado = armarEstado({
      rng: dadosFijos(Array(20).fill(3)),
      turnoDe: 'A',
      jugadorInicial: 'A',
      unidades: [unidad('P1', 'A', 'Peon', { q: 0, r: 0 }, { heridas: 1 })],
      jugadores: {
        A: { mano: [carta('Fuego', 1)], mazo: mazoDe(5) },
        B: { mano: [], mazo: mazoDe(5) },
      },
    })
    let actual = aplicarIntencion(estado, { tipo: 'JUGAR_CARTA', jugador: 'A', indiceCarta: 0 })
    actual = aplicarIntencion(actual, { tipo: 'TERMINAR_TURNO', jugador: 'A' })
    expect(actual.ronda).toBe(2)
    expect(actual.jugadores.A.mano).toHaveLength(5)
    expect(actual.jugadores.B.mano).toHaveLength(5)
    expect(actual.turnoDe).toBe('A')
  })

  it('La ronda no termina con una sola mano vacía', () => {
    const estado = armarEstado({
      turnoDe: 'A',
      jugadores: {
        A: { mano: [carta('Fuego', 1), carta('Agua', 2), carta('Aire', 3)] },
        B: { mano: [] },
      },
    })
    let actual = aplicarIntencion(estado, { tipo: 'JUGAR_CARTA', jugador: 'A', indiceCarta: 0 })
    actual = aplicarIntencion(actual, { tipo: 'TERMINAR_TURNO', jugador: 'A' })
    expect(actual.ronda).toBe(1)
  })
})

describe('US-082 — Comienzo de una nueva ronda', () => {
  it('Se rebaraja y se reparte', () => {
    const estado = armarEstado({
      rng: dadosFijos(Array(20).fill(3)),
      turnoDe: 'A',
      jugadorInicial: 'A',
      jugadores: {
        A: { mano: [carta('Fuego', 1)], mazo: mazoDe(5) },
        B: { mano: [], mazo: mazoDe(5) },
      },
    })
    let actual = aplicarIntencion(estado, { tipo: 'JUGAR_CARTA', jugador: 'A', indiceCarta: 0 })
    actual = aplicarIntencion(actual, { tipo: 'TERMINAR_TURNO', jugador: 'A' })
    expect(actual.jugadores.A.descarte).toHaveLength(0)
    expect(actual.jugadores.B.descarte).toHaveLength(0)
    expect(actual.ronda).toBe(2)
  })

  it('El estado del tablero persiste entre rondas', () => {
    const estado = armarEstado({
      rng: dadosFijos(Array(20).fill(3)),
      turnoDe: 'A',
      jugadorInicial: 'A',
      unidades: [unidad('P1', 'A', 'Peon', { q: 0, r: 0 }, {
        heridas: 1, estados: ['Stunned'],
      })],
      jugadores: {
        A: { mano: [carta('Fuego', 1)], mazo: mazoDe(5) },
        B: { mano: [], mazo: mazoDe(5) },
      },
    })
    let actual = aplicarIntencion(estado, { tipo: 'JUGAR_CARTA', jugador: 'A', indiceCarta: 0 })
    actual = aplicarIntencion(actual, { tipo: 'TERMINAR_TURNO', jugador: 'A' })
    const p1 = buscarUnidad(actual, 'P1')
    expect(p1.pos).toEqual({ q: 0, r: 0 })
    expect(p1.heridas).toBe(1)
    expect(p1.estados).toContain('Stunned')
    expect(totalPO(actual.jugadores.A)).toBe(0)
    expect(totalPO(actual.jugadores.B)).toBe(0)
  })

  it('A-11-N6: el contador de Técnicas usadas se renueva al iniciar la ronda', () => {
    const estado = armarEstado({
      turnoDe: 'A',
      jugadorInicial: 'A',
      unidades: [unidad('C1', 'A', 'Campeon', { q: 0, r: 0 }, {
        foco: [{ elemento: 'Fuego' }, { elemento: 'Fuego' }],
        tecnicasUsadasEsteRonda: 1,
      })],
    })
    expect(buscarUnidad(estado, 'C1').tecnicasUsadasEsteRonda).toBe(1)
    const nueva = iniciarNuevaRonda(estado, 'A')
    expect(buscarUnidad(nueva, 'C1').tecnicasUsadasEsteRonda).toBe(0)
  })

  it('El jugador inicial de la nueva ronda', () => {
    const estado = armarEstado({
      rng: dadosFijos(Array(20).fill(3)),
      turnoDe: 'A',
      jugadorInicial: 'A',
      jugadores: {
        A: { mano: [carta('Fuego', 1)], mazo: mazoDe(5) },
        B: { mano: [], mazo: mazoDe(5) },
      },
    })
    let actual = aplicarIntencion(estado, { tipo: 'JUGAR_CARTA', jugador: 'A', indiceCarta: 0 })
    actual = aplicarIntencion(actual, { tipo: 'TERMINAR_TURNO', jugador: 'A' })
    expect(actual.turnoDe).toBe(estado.jugadorInicial)
  })
})

describe('US-083 — Derrota por eliminación total', () => {
  it('Sin unidades en mesa se pierde', () => {
    const estado = aplicarIntencion(
      armarEstado({
        rng: dadosFijos([9, 4]),
        turnoDe: 'A',
        unidades: [
          unidad('P1', 'A', 'Peon', { q: 0, r: 0 }),
          unidad('P2', 'B', 'Peon', { q: 1, r: 0 }, { heridas: 1 }),
        ],
        poA: [po('A', 'Fuego', 5)],
      }),
      { tipo: 'ATACAR', jugador: 'A', atacante: 'P1', objetivo: 'P2' }
    )
    expect(estado.ganador).not.toBeNull()
    expect(estado.ganador.ganador).toBe('A')
  })

  it('La partida se detiene al terminar', () => {
    const base = armarEstado({
      rng: dadosFijos([9, 4]),
      turnoDe: 'A',
      unidades: [
        unidad('P1', 'A', 'Peon', { q: 0, r: 0 }),
        unidad('P2', 'B', 'Peon', { q: 1, r: 0 }, { heridas: 1 }),
      ],
      poA: [po('A', 'Fuego', 5)],
    })
    const terminada = aplicarIntencion(base, { tipo: 'ATACAR', jugador: 'A', atacante: 'P1', objetivo: 'P2' })
    expect(terminada.ganador).not.toBeNull()
    const nuevo = aplicarIntencion(terminada, { tipo: 'JUGAR_CARTA', jugador: 'A', indiceCarta: 0 })
    expect(nuevo.ganador).toStrictEqual(terminada.ganador)
    expect(nuevo.log.some(l => l.tipo === 'error' && l.descripcion.includes('partida terminó'))).toBe(true)
  })
})

describe('US-084 — Derrota inmediata por muerte del Rey', () => {
  const estadoConReyHerido = () => armarEstado({
    rng: dadosFijos([9, 4, 4]),
    turnoDe: 'A',
    ronda: 2,
    unidades: [
      unidad('P1', 'A', 'Peon', { q: 0, r: 0 }),
      unidad('R2', 'B', 'Rey', { q: 1, r: 0 }, { heridas: 3, maxVida: 4 }),
      unidad('P3', 'B', 'Peon', { q: 2, r: 0 }),
      unidad('P4', 'B', 'Peon', { q: 3, r: 0 }),
    ],
    poA: [po('A', 'Fuego', 5)],
  })

  it('La muerte del Rey termina la partida', () => {
    const estado = aplicarIntencion(estadoConReyHerido(), { tipo: 'ATACAR', jugador: 'A', atacante: 'P1', objetivo: 'R2' })
    expect(estado.ganador.ganador).toBe('A')
    expect(estado.ganador.motivo).toBe('muerte del Rey')
    expect(estado.unidades.filter(u => u.jugador === 'B')).toHaveLength(2)
  })

  it('La verificación ocurre apenas se aplica la herida', () => {
    const estado = aplicarIntencion(estadoConReyHerido(), { tipo: 'ATACAR', jugador: 'A', atacante: 'P1', objetivo: 'R2' })
    const fin = estado.log.find(l => l.tipo === 'fin-partida')
    expect(fin).toBeDefined()
    expect(fin.descripcion).toContain('muerte del Rey')
  })
})
