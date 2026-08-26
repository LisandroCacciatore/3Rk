import { describe, it, expect } from 'vitest'
import {
  distancia, vecinos, hexAlcanzables, caminoLibre,
  hayLoS, linea, buscarRetroceso, generarTableroHex, hexKey,
  generarTableroRect, dentroRect, dentroDeForma, bloqueadosParaMovimiento,
} from '../engine/hex.js'
import { hexesMovibles } from '../engine/selectors.js'
import { armarEstado, unidad } from './helpers.js'

function estadoCon(opts = {}) {
  return {
    tablero: {
      bloqueados: opts.bloqueados || [],
      bloqueaMovimientoSinLos: opts.bloqueaMovimientoSinLos || [],
      forma: opts.forma || null,
    },
    reglas: opts.reglas || {},
    unidades: (opts.unidades || []).map(u => ({
      id: u.id, pos: u.pos, jugador: u.jugador || 'A',
    })),
  }
}

describe('US-010 — Adyacencia es distancia 1', () => {
  it('El hexágono (0,0) tiene 6 vecinos a distancia 1', () => {
    const vec = vecinos({ q: 0, r: 0 })
    expect(vec).toHaveLength(6)
    for (const v of vec) {
      expect(distancia({ q: 0, r: 0 }, v)).toBe(1)
    }
  })
})

describe('US-011 — Medición de distancia', () => {
  it.each([
    [0, 0, 0, 0, 0],
    [0, 0, 1, 0, 1],
    [0, 0, 2, 0, 2],
    [0, 0, 0, 2, 2],
    [0, 0, 2, -1, 2],
    [0, 0, -2, 3, 3],
  ])('Distancia (%i,%i) → (%i,%i) = %i', (q1, r1, q2, r2, esp) => {
    expect(distancia({ q: q1, r: r1 }, { q: q2, r: r2 })).toBe(esp)
  })

  it('Los hexs bloqueados no alteran la medición', () => {
    expect(distancia({ q: 0, r: 0 }, { q: 2, r: 0 })).toBe(2)
  })
})

describe('US-012 — Movimiento sobre el tablero', () => {
  it('Alcanzables con Mov 3 desde (0,0) están a distancia ≤3', () => {
    const alc = hexAlcanzables({ q: 0, r: 0 }, 3, [], [])
    expect(alc.length).toBeGreaterThan(0)
    for (const h of alc) {
      expect(distancia({ q: 0, r: 0 }, h)).toBeLessThanOrEqual(3)
    }
  })

  it('No se supera el valor de Movimiento', () => {
    const alc = hexAlcanzables({ q: 0, r: 0 }, 2, [], [])
    for (const h of alc) {
      expect(distancia({ q: 0, r: 0 }, h)).toBeLessThanOrEqual(2)
    }
  })

  it('Camino libre cuando no hay obstáculos', () => {
    const c = caminoLibre({ q: 0, r: 0 }, { q: 2, r: 0 }, [], [])
    expect(c).not.toBeNull()
    expect(c.length - 1).toBe(2)
  })

  it('Destino adyacente ocupado no se puede alcanzar', () => {
    const c = caminoLibre({ q: 0, r: 0 }, { q: 1, r: 0 }, [{ pos: { q: 1, r: 0 } }], [])
    expect(c).toBeNull()
  })

  it('Hex bloqueado adyacente — no se puede alcanzar', () => {
    const c = caminoLibre({ q: 0, r: 0 }, { q: 1, r: 0 }, [], ['1,0'])
    expect(c).toBeNull()
  })

  it('Rodeo con obstáculos', () => {
    const c = caminoLibre({ q: 0, r: 0 }, { q: 3, r: 0 }, [], ['1,0', '2,0'])
    expect(c).not.toBeNull()
    for (const h of c.slice(1, -1)) {
      expect(hexKey(h)).not.toBe('1,0')
      expect(hexKey(h)).not.toBe('2,0')
    }
  })
})

describe('US-013 — Línea de visión', () => {
  it('Despejada', () => {
    expect(hayLoS(estadoCon(), { q: 0, r: 0 }, { q: 3, r: 0 })).toBe(true)
  })

  it('Bloqueado obstruye', () => {
    expect(hayLoS(estadoCon({ bloqueados: ['2,0'] }), { q: 0, r: 0 }, { q: 3, r: 0 })).toBe(false)
  })

  it('Unidad interpuesta obstruye', () => {
    const e = estadoCon({ unidades: [{ id: 'X', pos: { q: 1, r: 0 } }] })
    expect(hayLoS(e, { q: 0, r: 0 }, { q: 3, r: 0 })).toBe(false)
  })

  it('Rozar borde no obstruye', () => {
    expect(hayLoS(estadoCon({ bloqueados: ['1,1'] }), { q: 0, r: 0 }, { q: 2, r: -1 })).toBe(true)
  })

  it('Línea incluye origen y destino', () => {
    const lin = linea({ q: 0, r: 0 }, { q: 2, r: 0 })
    expect(lin[0]).toEqual({ q: 0, r: 0 })
    expect(lin[lin.length - 1]).toEqual({ q: 2, r: 0 })
  })
})

describe('D-28 — Agua bloquea movimiento pero no LoS', () => {
  it('El agua no obstruye el LoS con el arranque (aguaBloqueaLoS=false)', () => {
    const e = estadoCon({ bloqueaMovimientoSinLos: ['2,0'] })
    expect(hayLoS(e, { q: 0, r: 0 }, { q: 3, r: 0 })).toBe(true)
  })

  it('aguaBloqueaLoS=true rebloquea el LoS sobre el agua', () => {
    const e = estadoCon({ bloqueaMovimientoSinLos: ['2,0'], reglas: { aguaBloqueaLoS: true } })
    expect(hayLoS(e, { q: 0, r: 0 }, { q: 3, r: 0 })).toBe(false)
  })

  it('El agua impide el paso al fusionarse en bloqueadosParaMovimiento', () => {
    const estado = armarEstado({
      tablero: { bloqueaMovimientoSinLos: ['1,0'] },
      unidades: [unidad('P1', 'A', 'Peon', { q: 0, r: 0 })],
    })
    expect(bloqueadosParaMovimiento(estado)).toContain('1,0')
    expect(hexesMovibles(estado, 'P1').map(hexKey)).not.toContain('1,0')
  })

  it('bloqueadosParaMovimiento fusiona bloqueados y agua', () => {
    const e = estadoCon({ bloqueados: ['2,0'], bloqueaMovimientoSinLos: ['3,0'] })
    expect(bloqueadosParaMovimiento(e)).toEqual(['2,0', '3,0'])
  })

  it('buscarRetroceso no empuja al agua', () => {
    const e = estadoCon({
      bloqueaMovimientoSinLos: ['-1,0'],
      unidades: [
        { id: 'atk', pos: { q: 0, r: 0 } },
        { id: 'def', pos: { q: 1, r: 0 }, jugador: 'B' },
      ],
    })
    const r = buscarRetroceso({ q: 0, r: 0 }, { q: 1, r: 0 }, e)
    expect(hexKey(r)).not.toBe('-1,0')
  })
})

describe('Retroceso tras intercambio perdido', () => {
  it('Al opuesto cuando está libre', () => {
    const e = estadoCon({
      unidades: [
        { id: 'atk', pos: { q: 0, r: 0 } },
        { id: 'def', pos: { q: 1, r: 0 }, jugador: 'B' },
      ],
    })
    expect(buscarRetroceso({ q: 0, r: 0 }, { q: 1, r: 0 }, e)).toEqual({ q: -1, r: 0 })
  })

  it('Alternativo si opuesto ocupado', () => {
    const e = estadoCon({
      unidades: [
        { id: 'atk', pos: { q: 0, r: 0 } },
        { id: 'def', pos: { q: 1, r: 0 }, jugador: 'B' },
        { id: 'otro', pos: { q: -1, r: 0 } },
      ],
    })
    const r = buscarRetroceso({ q: 0, r: 0 }, { q: 1, r: 0 }, e)
    expect(r).not.toBeNull()
    expect(distancia(r, { q: 1, r: 0 })).toBeGreaterThan(1)
  })
})

describe('Tablero', () => {
  it('Radio 1 = 7 hexs', () => expect(generarTableroHex(1)).toHaveLength(7))
  it('Radio 4 = 61 hexs', () => expect(generarTableroHex(4)).toHaveLength(61))
  it('Radio 6 = 127 hexs', () => expect(generarTableroHex(6)).toHaveLength(127))
})

describe('Tablero rectangular 15×10', () => {
  const FORMA = { tipo: 'rect', columnas: 15, filas: 10 }
  const dentroRectForma = (h) => dentroDeForma(FORMA, h)

  it('generarTableroRect(15,10) produce 150 hexes y 3×4 produce 12', () => {
    expect(generarTableroRect(15, 10)).toHaveLength(150)
    expect(generarTableroRect(3, 4)).toHaveLength(12)
  })

  it('todos los hexes generados caen dentro del rectángulo', () => {
    for (const h of generarTableroRect(15, 10)) {
      expect(dentroRect(h, 15, 10)).toBe(true)
    }
  })

  it('dentroRect descarta hexes fuera del borde', () => {
    expect(dentroRect({ q: -11, r: 4 }, 15, 10)).toBe(true)
    expect(dentroRect({ q: 3, r: 4 }, 15, 10)).toBe(true)
    expect(dentroRect({ q: -11, r: 5 }, 15, 10)).toBe(false)
    expect(dentroRect({ q: -12, r: 4 }, 15, 10)).toBe(false)
    expect(dentroRect({ q: 4, r: 4 }, 15, 10)).toBe(false)
    expect(dentroRect({ q: -7, r: -6 }, 15, 10)).toBe(false)
  })

  it('el BFS de movimiento con límites inunda el rect sin salirse', () => {
    const alc = hexAlcanzables({ q: 0, r: 0 }, 20, [], [], dentroRectForma)
    // 150 hexes del rect menos el origen (el BFS no se incluye a sí mismo).
    expect(alc.length).toBe(149)
    for (const h of alc) expect(dentroDeForma(FORMA, h)).toBe(true)
  })

  it('caminoLibre rechaza destinos fuera del rectángulo', () => {
    const ok = caminoLibre({ q: 0, r: 0 }, { q: -11, r: 4 }, [], [], dentroRectForma)
    expect(ok).not.toBeNull()
    const fuera = caminoLibre({ q: 0, r: 0 }, { q: -12, r: 4 }, [], [], dentroRectForma)
    expect(fuera).toBeNull()
  })

  it('buscarRetroceso en el borde no empuja fuera del rectángulo', () => {
    const e = estadoCon({
      forma: FORMA,
      unidades: [
        { id: 'atk', pos: { q: -11, r: 4 } },
        { id: 'def', pos: { q: -10, r: 4 }, jugador: 'B' },
      ],
    })
    const r = buscarRetroceso({ q: -11, r: 4 }, { q: -10, r: 4 }, e)
    expect(r).not.toBeNull()
    expect(dentroDeForma(FORMA, r)).toBe(true)
    expect(r).toEqual({ q: -11, r: 3 })
  })
})
