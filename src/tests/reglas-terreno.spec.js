import { describe, it, expect } from 'vitest'
import { armarEstado, unidad, dadosFijos, po } from './helpers.js'
import { costeHexTerreno, costeCamino, hexAlcanzables, modAtacanteTerreno } from '../engine/hex.js'
import { tiradaAtaque } from '../engine/combat.js'
import { aplicarIntencion } from '../engine/index.js'

// Terreno en forma { q,r → visual }. Visual conocido: 'prado', 'puente',
// 'empalizada', 'agua'. Los no listados en reglasTerreno no tienen efecto.
const conTerreno = (overrides = {}) => armarEstado({
  tablero: {
    terreno: {
      '0,0': 'puente',
      '0,1': 'empalizada',
      '1,0': 'empalizada',
    },
  },
  ...overrides,
})

describe('D-29/30/31 — Terreno por tile: coste de movimiento', () => {
  it('sin matriz de biomas todo cuesta 1 (retrocompatibilidad)', () => {
    const estado = armarEstado({})
    const coste = costeHexTerreno(estado)
    expect(coste({ q: 0, r: 1 })).toBe(1)
  })

  it('el puente cuesta igual que el prado (cruce libre)', () => {
    const estado = conTerreno()
    const coste = costeHexTerreno(estado)
    expect(coste({ q: 0, r: 0 })).toBe(1)
  })

  it('entrar a una empalizada cuesta +1 movimiento', () => {
    const estado = conTerreno()
    const coste = costeHexTerreno(estado)
    expect(coste({ q: 0, r: 1 })).toBe(2)
  })

  it('hexAlcanzables limita por coste acumulado, no por pasos', () => {
    const estado = conTerreno()
    const alcanzables = hexAlcanzables(
      { q: 0, r: 0 },
      2,
      [],
      [],
      () => true,
      costeHexTerreno(estado),
    )
    // (0,1) empalizada cuesta 2 → alcanzable con Movimiento 2.
    expect(alcanzables.some(h => h.q === 0 && h.r === 1)).toBe(true)
    // (0,2) vía (0,1) cuesta 2+1=3 → NO alcanzable con 2.
    expect(alcanzables.some(h => h.q === 0 && h.r === 2)).toBe(false)
  })

  it('costeCamino suma el costeExtra de cada hex recorrido', () => {
    const estado = conTerreno()
    const camino = [{ q: 0, r: 0 }, { q: 0, r: 1 }, { q: 0, r: 2 }]
    expect(costeCamino(camino, costeHexTerreno(estado))).toBe(3) // 2 (empalizada) + 1
  })

  it('con Movimiento 1 no se puede entrar a una empalizada (coste 2)', () => {
    const estado = conTerreno()
    const alcanzables1 = hexAlcanzables(
      { q: 0, r: 0 }, 1, [], [], () => true, costeHexTerreno(estado),
    )
    expect(alcanzables1.some(h => h.q === 0 && h.r === 1)).toBe(false)
  })
})

describe('D-31 — Empalizada: modAtacante en la línea de ataque', () => {
  function estadoDeAtaque() {
    return conTerreno({
      rng: dadosFijos([3, 3, 3, 3, 3, 3]),
      unidades: [
        unidad('A1', 'A', 'Alfil', { q: 0, r: 2 }),
        unidad('B1', 'B', 'Rey', { q: 0, r: 0 }),
      ],
      reglas: { declaracionTecnica: 'antes-de-tirar' },
    })
  }

  it('el pool de ataque pierde 1 dado si la línea atraviesa empalizada', () => {
    const estado = estadoDeAtaque()
    // Alfil base 2 dados − 1 de empalizada = 1.
    const tirada = tiradaAtaque(estado, 'A1', 'B1', {})
    expect(tirada.atqPoolFinal.dados).toBe(1)
  })

  it('sin empalizada en la línea no se modifica el pool', () => {
    const estado = armarEstado({
      rng: dadosFijos([3, 3, 3, 3, 3, 3]),
      unidades: [
        unidad('A1', 'A', 'Alfil', { q: 2, r: 2 }),
        unidad('B1', 'B', 'Rey', { q: 0, r: 0 }),
      ],
    })
    const tirada = tiradaAtaque(estado, 'A1', 'B1', {})
    expect(tirada.atqPoolFinal.dados).toBe(2)
  })

  it('modAtacanteTerreno devuelve −1 cuando toca la empalizada (no direccional)', () => {
    const estado = estadoDeAtaque()
    expect(modAtacanteTerreno(estado, { q: 0, r: 2 }, { q: 0, r: 0 })).toBe(-1)
    expect(modAtacanteTerreno(estado, { q: 0, r: 0 }, { q: 0, r: 2 })).toBe(-1)
  })

  it('la unidad no se queda con 0 dados: mínimo 1', () => {
    const estado = conTerreno({
      rng: dadosFijos([3, 3, 3, 3, 3, 3]),
      unidades: [
        unidad('A1', 'A', 'Peon', { q: 0, r: 2 }),
        unidad('B1', 'B', 'Rey', { q: 0, r: 0 }),
      ],
      reglas: { declaracionTecnica: 'antes-de-tirar' },
    })
    const tirada = tiradaAtaque(estado, 'A1', 'B1', {})
    expect(tirada.atqPoolFinal.dados).toBe(1)
  })
})

describe('D-29 — Mover respeta el coste de terreno (aplicarMover)', () => {
  it('rechaza cruzar una empalizada si el coste total supera el movimiento', () => {
    const estado = conTerreno({
      turnoDe: 'A',
      unidades: [unidad('A1', 'A', 'Torre', { q: 0, r: 0 })],
      poA: [po('A', 'Fuego', 4)],
      reglas: { despliegue: 'posiciones-fijas-del-escenario' },
    })
    // Torre Mov 2: (0,1) empalizada (coste 2) alcanzable; (0,2) vía (0,1)
    // cuesta 3 → NO.
    let actual = aplicarIntencion(estado, { tipo: 'MOVER', jugador: 'A', unidadId: 'A1', destino: { q: 0, r: 1 } })
    expect(actual.unidades.find(u => u.id === 'A1').pos).toEqual({ q: 0, r: 1 })

    // Desde (0,0), cruzar hasta (0,2) cuesta 2 (empalizada) + 1 = 3 > 2.
    actual = aplicarIntencion(estado, { tipo: 'MOVER', jugador: 'A', unidadId: 'A1', destino: { q: 0, r: 2 } })
    expect(actual.unidades.find(u => u.id === 'A1').pos).toEqual({ q: 0, r: 0 })
  })

  it('un Caballo (Mov 5) sí cruza la empalizada y sigue', () => {
    const estado = conTerreno({
      turnoDe: 'A',
      unidades: [unidad('A1', 'A', 'Caballo', { q: 0, r: 0 })],
      poA: [po('A', 'Fuego', 4)],
    })
    const actual = aplicarIntencion(estado, { tipo: 'MOVER', jugador: 'A', unidadId: 'A1', destino: { q: 0, r: 2 } })
    expect(actual.unidades.find(u => u.id === 'A1').pos).toEqual({ q: 0, r: 2 })
  })
})
