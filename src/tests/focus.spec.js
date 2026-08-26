import { describe, it, expect } from 'vitest'
import { capacidadFoco, puedeRecibirToken, agregarToken, quitarTokenFoco } from '../engine/focus.js'
import { aplicarIntencion } from '../engine/index.js'
import { iniciarNuevaRonda } from '../engine/round.js'
import { totalPO } from '../engine/po.js'
import { armarEstado, unidad, buscarUnidad, po, dadosFijos } from './helpers.js'

describe('US-040 — Reserva de Foco con tope fijo', () => {
  it('El Foco es un valor fijo del arquetipo', () => {
    const alfil = unidad('A1', 'A', 'Alfil', { q: 0, r: 0 })
    expect(capacidadFoco(alfil)).toBe(2)
  })

  it('No se supera la capacidad (jugar carta como Foco)', () => {
    const unidadLlena = unidad('A1', 'A', 'Alfil', { q: 0, r: 0 }, {
      foco: [{ elemento: 'Fuego' }, { elemento: 'Agua' }],
    })
    const estado = aplicarIntencion(
      armarEstado({
        turnoDe: 'A',
        unidades: [unidadLlena],
        poA: [po('A', 'Fuego', 5)],
        jugadores: { A: { mano: [{ elemento: 'Fuego', valor: 2 }] } },
      }),
      { tipo: 'JUGAR_CARTA', jugador: 'A', indiceCarta: 0, uso: 'foco', unidad: 'A1', elemento: 'Fuego' }
    )
    const alfil = buscarUnidad(estado, 'A1')
    expect(alfil.foco).toHaveLength(2)
    // La carta se rechaza (error), no se descarta, PO no cambia
    expect(totalPO(estado.jugadores.A)).toBe(5)
    expect(estado.log.some(l => l.tipo === 'error' && l.descripcion.includes('Foco lleno'))).toBe(true)
  })
})

describe('US-041 — Preparar Foco jugando carta (sin CONCENTRARSE)', () => {
  it('Jugar carta como Foco añade token a la unidad', () => {
    let estado = armarEstado({
      turnoDe: 'A',
      unidades: [unidad('A1', 'A', 'Alfil', { q: 0, r: 0 })],
      poA: [po('A', 'Agua', 4)],
      jugadores: { A: { mano: [{ elemento: 'Agua', valor: 2 }] } },
    })
    estado = aplicarIntencion(estado, { tipo: 'JUGAR_CARTA', jugador: 'A', indiceCarta: 0, uso: 'foco', unidad: 'A1', elemento: 'Agua' })
    const alfil = buscarUnidad(estado, 'A1')
    expect(alfil.foco).toHaveLength(1)
    expect(alfil.foco[0].elemento).toBe('Agua')
    // No genera PO
    expect(totalPO(estado.jugadores.A)).toBe(4)
  })

  it('Jugar carta como Foco respeta capacidad', () => {
    const estado = aplicarIntencion(
      armarEstado({
        turnoDe: 'A',
        unidades: [unidad('A1', 'A', 'Alfil', { q: 0, r: 0 }, {
          foco: [{ elemento: 'Fuego' }, { elemento: 'Agua' }],
        })],
        jugadores: { A: { mano: [{ elemento: 'Tierra', valor: 2 }] } },
      }),
      { tipo: 'JUGAR_CARTA', jugador: 'A', indiceCarta: 0, uso: 'foco', unidad: 'A1', elemento: 'Tierra' }
    )
    const alfil = buscarUnidad(estado, 'A1')
    expect(alfil.foco).toHaveLength(2)
    expect(estado.log.some(l => l.tipo === 'error' && l.descripcion.includes('Foco lleno'))).toBe(true)
  })

  it('Jugar carta como Foco requiere regla cartaDualUso', () => {
    const estado = aplicarIntencion(
      armarEstado({
        reglas: { cartaDualUso: false },
        turnoDe: 'A',
        unidades: [unidad('A1', 'A', 'Alfil', { q: 0, r: 0 })],
        jugadores: { A: { mano: [{ elemento: 'Fuego', valor: 2 }] } },
      }),
      { tipo: 'JUGAR_CARTA', jugador: 'A', indiceCarta: 0, uso: 'foco', unidad: 'A1', elemento: 'Fuego' }
    )
    expect(estado.log.some(l => l.tipo === 'error' && l.descripcion.includes('desactivado'))).toBe(true)
  })
})

describe('US-042 — Tokens de elementos distintos', () => {
  it('Reserva mixta', () => {
    const u = unidad('A1', 'A', 'Alfil', { q: 0, r: 0 })
    const tokenAire = agregarToken(u, 'Aire')
    const tokenAgua = agregarToken(u, 'Agua')
    expect(tokenAire.ok).toBe(true)
    expect(tokenAgua.ok).toBe(true)
    expect(u.foco.map(t => t.elemento)).toEqual(['Aire', 'Agua'])
  })

  it('El tope aplica al total, no por elemento', () => {
    const u = unidad('A1', 'A', 'Alfil', { q: 0, r: 0 }, {
      foco: [{ elemento: 'Aire' }, { elemento: 'Agua' }],
    })
    const resultado = agregarToken(u, 'Fuego')
    expect(resultado.ok).toBe(false)
    expect(resultado.motivo).toContain('capacidad')
  })
})

describe('US-043 — Los tokens no se transfieren', () => {
  it('No existe acción de transferencia', () => {
    const estado = aplicarIntencion(
      armarEstado({ turnoDe: 'A', unidades: [unidad('A1', 'A', 'Alfil', { q: 0, r: 0 })] }),
      { tipo: 'TRANSFERIR', jugador: 'A', unidadId: 'A1' }
    )
    expect(estado.log.some(l => l.tipo === 'error' && l.descripcion.includes('Intención desconocida'))).toBe(true)
  })

  it('Los tokens se pierden con la unidad', () => {
    const estado = aplicarIntencion(
      armarEstado({
        rng: dadosFijos([9, 4]),
        turnoDe: 'A',
        unidades: [
          unidad('P1', 'A', 'Peon', { q: 0, r: 0 }),
          unidad('P2', 'B', 'Peon', { q: 1, r: 0 }, {
            heridas: 1,
            foco: [{ elemento: 'Fuego' }, { elemento: 'Agua' }],
          }),
        ],
        poA: [po('A', 'Fuego', 5)],
      }),
      { tipo: 'ATACAR', jugador: 'A', atacante: 'P1', objetivo: 'P2' }
    )
    expect(buscarUnidad(estado, 'P2')).toBeNull()
    const tokensRestantes = estado.unidades.reduce((s, u) => s + u.foco.length, 0)
    expect(tokensRestantes).toBe(0)
  })
})

describe('US-044 — Persistencia de tokens entre rondas', () => {
  const estadoConTokens = (persistencia) => {
    const estado = armarEstado({
      reglas: { focoPersisteEntreRondas: persistencia },
      unidades: [unidad('A1', 'A', 'Alfil', { q: 0, r: 0 }, {
        foco: [{ elemento: 'Fuego' }, { elemento: 'Fuego' }],
      })],
    })
    return iniciarNuevaRonda(estado, 'A')
  }

  it('Con la regla en "persisten"', () => {
    const estado = estadoConTokens(true)
    const alfil = buscarUnidad(estado, 'A1')
    expect(alfil.foco).toHaveLength(2)
  })

  it('Con la regla en "se vacían"', () => {
    const estado = estadoConTokens(false)
    const alfil = buscarUnidad(estado, 'A1')
    expect(alfil.foco).toHaveLength(0)
    expect(estado.log.some(l => l.tipo === 'foco-perdido')).toBe(true)
  })

  it('Los tokens nunca se pierden por fin de turno', () => {
    const estado = armarEstado({
      turnoDe: 'A',
      cartaJugadaEsteTurno: true,
      unidades: [unidad('A1', 'A', 'Alfil', { q: 0, r: 0 }, {
        foco: [{ elemento: 'Fuego' }],
      })],
      jugadores: {
        A: { mano: [{ elemento: 'Fuego', valor: 1 }] },
        B: { mano: [{ elemento: 'Agua', valor: 1 }] },
      },
    })
    const despues = aplicarIntencion(estado, { tipo: 'TERMINAR_TURNO', jugador: 'A' })
    const alfil = buscarUnidad(despues, 'A1')
    expect(alfil.foco).toHaveLength(1)
  })
})

describe('US-045 — Aportes de varias fuentes en el mismo turno', () => {
  it('Acumulación desde dos fuentes (agregarToken directo)', () => {
    const u = unidad('C1', 'A', 'Campeon', { q: 0, r: 0 })
    const propia = agregarToken(u, 'Fuego')
    const externa = agregarToken(u, 'Agua')
    expect(propia.ok).toBe(true)
    expect(externa.ok).toBe(true)
    expect(u.foco).toHaveLength(2)
  })

  it('El tope se respeta con aportes externos', () => {
    const u = unidad('A1', 'A', 'Alfil', { q: 0, r: 0 }, {
      foco: [{ elemento: 'Fuego' }, { elemento: 'Agua' }],
    })
    const resultado = agregarToken(u, 'Tierra')
    expect(resultado.ok).toBe(false)
    expect(u.foco).toHaveLength(2)
  })

  it('quitarTokenFoco elimina tokens', () => {
    const u = unidad('C1', 'A', 'Campeon', { q: 0, r: 0 }, {
      foco: [{ elemento: 'Fuego' }, { elemento: 'Agua' }, { elemento: 'Tierra' }],
    })
    const quitados = quitarTokenFoco(u, 2)
    expect(quitados).toBe(2)
    expect(u.foco).toHaveLength(1)
  })
})