import { describe, it, expect } from 'vitest'
import { crearEstadoInicial } from '../engine/state.js'
import { aplicarIntencion } from '../engine/index.js'
import { pensarIntencionBot } from '../engine/bot.js'
import { armarEstado, unidad, po } from './helpers.js'
import { vecinos, hexKey } from '../engine/hex.js'

// US-174 — Modo Solitario: el bot devuelve intenciones válidas que el motor
// aplica sin errores, nunca se traba repitiendo intenciones rechazadas y respeta
// el Foco del arquetipo (capacidad como DATO, no constante).
describe('US-174 — Bot Solitario (pensarIntencionBot)', () => {
  it('juega un turno completo, sin errores, y cede el turno', () => {
    const inicial = crearEstadoInicial('bot-turno', 'sandbox-horda')
    inicial.turnoDe = 'B'
    let estado = inicial
    const errores = []
    let pasos = 0
    while (estado.turnoDe === 'B' && !estado.ganador && pasos < 300) {
      const intencion = pensarIntencionBot(estado)
      estado = aplicarIntencion(estado, intencion)
      const ultimo = estado.log[estado.log.length - 1]
      if (ultimo && ultimo.tipo === 'error') {
        errores.push({ intencion: intencion.tipo, descripcion: ultimo.descripcion })
      }
      pasos++
    }
    expect(errores).toEqual([])
    expect(estado.turnoDe).toBe('A')
    expect(estado.cartaJugadaEsteTurno).toBe(false)
  })

  it('reparte el movimiento entre unidades distintas (curva 1/2/3/5 por unidad)', () => {
    const estado = armarEstado({
      turnoDe: 'B',
      ronda: 1,
      cartaJugadaEsteTurno: true,
      poB: [po('B', 'Fuego', 3)],
      unidades: [
        unidad('Peon-1', 'B', 'Peon', { q: 0, r: -3 }),
        unidad('Peon-2', 'B', 'Peon', { q: 0, r: 2 }),
        unidad('Peon-3', 'B', 'Peon', { q: 4, r: -3 }),
        unidad('Rey-A', 'A', 'Rey', { q: 0, r: 0 }),
      ],
    })
    let e = estado
    const moviles = new Set()
    let pasos = 0
    while (e.turnoDe === 'B' && pasos < 20) {
      const intencion = pensarIntencionBot(e)
      e = aplicarIntencion(e, intencion)
      if (intencion.tipo === 'MOVER' && intencion.unidadId) moviles.add(intencion.unidadId)
      if (intencion.tipo === 'TERMINAR_TURNO') break
    }
    expect(moviles.size).toBe(3)
  })

  it('no concentra con el Foco del arquetipo lleno (Peón: tope 1)', () => {
    const estado = armarEstado({
      turnoDe: 'B',
      cartaJugadaEsteTurno: true,
      poB: [po('B', 'Fuego', 3)],
      bloqueados: vecinos({ q: 0, r: 0 }).map(hexKey),
      unidades: [
        unidad('Peon-1', 'B', 'Peon', { q: 0, r: 0 }, { foco: [{ elemento: 'Fuego' }] }),
        unidad('Rey-A', 'A', 'Rey', { q: 5, r: 5 }),
      ],
    })
    const intencion = pensarIntencionBot(estado)
    expect(intencion.tipo).toBe('TERMINAR_TURNO')
  })

  it('no concentra si no alcanza el PO del token siguiente (coste 1/3/5)', () => {
    const estado = armarEstado({
      turnoDe: 'B',
      cartaJugadaEsteTurno: true,
      poB: [po('B', 'Fuego', 1)],
      bloqueados: vecinos({ q: 0, r: 0 }).map(hexKey),
      unidades: [
        unidad('Alfil-1', 'B', 'Alfil', { q: 0, r: 0 }, { foco: [{ elemento: 'Tierra' }] }),
        unidad('Rey-A', 'A', 'Rey', { q: 5, r: 5 }),
      ],
    })
    const intencion = pensarIntencionBot(estado)
    expect(intencion.tipo).toBe('TERMINAR_TURNO')
  })

  it('usa carta como Foco cuando tiene PO y Foco vacío (si no jugó carta)', () => {
    const estado = armarEstado({
      turnoDe: 'B',
      cartaJugadaEsteTurno: false,
      poB: [po('B', 'Fuego', 3)],
      bloqueados: vecinos({ q: 0, r: 0 }).map(hexKey),
      unidades: [
        unidad('Peon-1', 'B', 'Peon', { q: 0, r: 0 }),
        unidad('Rey-A', 'A', 'Rey', { q: 5, r: 5 }),
      ],
      jugadores: {
        B: { mano: [{ elemento: 'Fuego', valor: 2 }] },
        A: { mano: [] },
      },
    })
    const intencion = pensarIntencionBot(estado)
    expect(intencion).toMatchObject({ tipo: 'JUGAR_CARTA', jugador: 'B', uso: 'foco', unidad: 'Peon-1' })
    const nuevo = aplicarIntencion(estado, intencion)
    expect(nuevo.log[nuevo.log.length - 1].tipo).toBe('carta-foco')
    expect(nuevo.unidades.find(u => u.id === 'Peon-1').foco).toHaveLength(1)
  })
})