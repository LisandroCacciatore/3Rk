import { describe, it, expect } from 'vitest'
import { ESCENARIO_BASE } from '../data/scenarios.js'
import { vecinos, hexKey, dentroDeForma } from '../engine/hex.js'

// BFS de conectividad en el grafo de hexes del tablero, acotado a la forma del
// escenario (rectángulo 15×10): la grilla hexagonal es infinita y hay que
// cortarla en el borde jugable.
function alcanzablesDesde(origen, bloqueados, forma) {
  const prohi = new Set(bloqueados)
  const inicioKey = hexKey(origen)
  const visitados = new Map()
  visitados.set(inicioKey, origen)
  const cola = [{ ...origen }]
  while (cola.length > 0) {
    const actual = cola.shift()
    for (const v of vecinos(actual)) {
      const key = hexKey(v)
      if (visitados.has(key) || prohi.has(key)) continue
      if (!dentroDeForma(forma, v)) continue
      visitados.set(key, v)
      cola.push(v)
    }
  }
  return visitados
}

describe('ESCENARIO_BASE — D-26 choke points y lugares', () => {
  const { forma, bloqueados, lugares, despliegue } = ESCENARIO_BASE

  it('Es un rectángulo 15×10 con 23 bloqueados y 3 lugares libres', () => {
    expect(forma).toEqual({ tipo: 'rect', columnas: 15, filas: 10 })
    expect(bloqueados).toHaveLength(23)
    expect(lugares).toHaveLength(3)
    const bloqueadosSet = new Set(bloqueados)
    for (const l of lugares) {
      expect(bloqueadosSet.has(hexKey(l))).toBe(false)
    }
  })

  it('Los 36 pares despliegue-A↔despliegue-B quedan conectados (6+6, D-38)', () => {
    for (const a of despliegue.A) {
      const alcanzables = alcanzablesDesde(a, bloqueados, forma)
      for (const b of despliegue.B) {
        expect(alcanzables.has(hexKey(b))).toBe(true)
      }
    }
  })

  it('Cada lugar es alcanzable desde los 12 hexes de despliegue', () => {
    const todos = [...despliegue.A, ...despliegue.B]
    for (const d of todos) {
      const alcanzables = alcanzablesDesde(d, bloqueados, forma)
      for (const l of lugares) {
        expect(alcanzables.has(hexKey(l))).toBe(true)
      }
    }
  })

  it('Ningún hex de despliegue está bloqueado', () => {
    const bloqueadosSet = new Set(bloqueados)
    for (const d of [...despliegue.A, ...despliegue.B]) {
      expect(bloqueadosSet.has(hexKey(d))).toBe(false)
    }
  })

  it('Los lugares no se pisan con los despliegues', () => {
    const ocupados = new Set([...despliegue.A, ...despliegue.B].map(hexKey))
    for (const l of lugares) {
      expect(ocupados.has(hexKey(l))).toBe(false)
    }
  })

  it('El río deja los dos vados libres y bloquea el resto de la fila r=0', () => {
    const bloqueadosSet = new Set(bloqueados)
    expect(bloqueadosSet.has('0,0')).toBe(false)
    expect(bloqueadosSet.has('-6,0')).toBe(false)
    expect(bloqueadosSet.has('-9,0')).toBe(true)
    expect(bloqueadosSet.has('5,0')).toBe(true)
  })
})
