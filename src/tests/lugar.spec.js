import { describe, it, expect } from 'vitest'
import { aplicarIntencion } from '../engine/index.js'
import { totalPO } from '../engine/po.js'
import { lugaresCapturables } from '../engine/selectors.js'
import { hexKey } from '../engine/hex.js'
import { armarEstado, unidad, po, buscarUnidad } from './helpers.js'

const estadoCon = (opciones = {}) => armarEstado({
  turnoDe: 'A',
  tablero: {
    lugares: opciones.lugares ?? [{ q: 0, r: 0 }],
    bloqueados: opciones.bloqueados ?? [],
  },
  poA: [po('A', 'Fuego', opciones.po ?? 3)],
  unidades: [unidad('Peón-1', 'A', 'Peon', opciones.pos ?? { q: 1, r: 0 })],
  reglas: opciones.reglas,
})

const capturar = (estado, hex = { q: 0, r: 0 }) =>
  aplicarIntencion(estado, { tipo: 'INTERACTUAR', jugador: 'A', unidadId: 'Peón-1', hex })

describe('US-162 — Capturar un Lugar otorga VP y agota la casilla', () => {
  it.each([
    ['0', { q: 0, r: 0 }],
    ['1', { q: 1, r: 0 }],
  ])('Captura desde un hex sobre o adyacente — distancia %s', (_d, pos) => {
    const estado = estadoCon({ pos })
    const nuevo = capturar(estado)

    expect(totalPO(nuevo.jugadores.A)).toBe(1)
    expect(nuevo.puntosVictoria.A).toBe(1)
    expect(nuevo.tablero.bloqueados).toContain('0,0')
    expect(buscarUnidad(nuevo, 'Peón-1').accionesEsteTurno).toBe(1)
    expect(nuevo.log.at(-1).tipo).toBe('captura')
  })

  it('Capturar desde lejos se rechaza sin efectos parciales', () => {
    const estado = estadoCon({ pos: { q: 2, r: 0 } })
    const nuevo = capturar(estado)

    expect(nuevo.log.at(-1).tipo).toBe('error')
    expect(totalPO(nuevo.jugadores.A)).toBe(3)
    expect(buscarUnidad(nuevo, 'Peón-1').accionesEsteTurno).toBe(0)
    expect(nuevo.tablero.bloqueados).not.toContain('0,0')
    expect(nuevo.puntosVictoria.A).toBe(0)
  })

  it('El hex indicado debe contener un Lugar', () => {
    const estado = estadoCon({ pos: { q: 1, r: 0 } })
    const nuevo = capturar(estado, { q: 2, r: 0 })

    expect(nuevo.log.at(-1).tipo).toBe('error')
    expect(totalPO(nuevo.jugadores.A)).toBe(3)
    expect(nuevo.puntosVictoria.A).toBe(0)
    expect(nuevo.tablero.bloqueados).not.toContain('2,0')
  })

  it('Un Lugar ya capturado no se vuelve a capturar', () => {
    const estado = estadoCon({ bloqueados: ['0,0'] })
    const nuevo = capturar(estado)

    expect(nuevo.log.at(-1).tipo).toBe('error')
    expect(totalPO(nuevo.jugadores.A)).toBe(3)
    expect(nuevo.puntosVictoria.A).toBe(0)
  })

  it('Sin PO suficientes no se captura', () => {
    const estado = estadoCon({ po: 1 })
    const nuevo = capturar(estado)

    expect(nuevo.log.at(-1).tipo).toBe('error')
    expect(totalPO(nuevo.jugadores.A)).toBe(1)
    expect(nuevo.tablero.bloqueados).not.toContain('0,0')
    expect(nuevo.puntosVictoria.A).toBe(0)
  })

  it('Flag apagado conserva el MVP actual', () => {
    const estado = estadoCon({ reglas: { lugarHabilitado: false } })
    const nuevo = capturar(estado)

    expect(nuevo.log.at(-1).tipo).toBe('error')
    expect(totalPO(nuevo.jugadores.A)).toBe(3)
    expect(nuevo.puntosVictoria.A).toBe(0)
    expect(nuevo.tablero.bloqueados).not.toContain('0,0')
  })
})

describe('US-162 — Selector lugaresCapturables', () => {
  it('Expone solo los lugares a distancia ≤ 1 de la unidad', () => {
    const estado = estadoCon({ pos: { q: 2, r: 0 } })
    expect(lugaresCapturables(estado, 'Peón-1').map(hexKey)).toEqual([])

    estado.unidades[0].pos = { q: 1, r: 0 }
    expect(lugaresCapturables(estado, 'Peón-1').map(hexKey)).toEqual(['0,0'])
  })

  it('Excluye lugares ya capturados', () => {
    const estado = estadoCon({ bloqueados: ['0,0'] })
    expect(lugaresCapturables(estado, 'Peón-1').map(hexKey)).toEqual([])
  })

  it('Devuelve lista vacía con la mecánica deshabilitada', () => {
    const estado = estadoCon({ reglas: { lugarHabilitado: false } })
    expect(lugaresCapturables(estado, 'Peón-1')).toEqual([])
  })
})
