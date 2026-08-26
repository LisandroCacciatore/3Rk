import { describe, it, expect } from 'vitest'
import {
  cargarEscenario, obtenerEscenario, ESCENARIOS,
  SIMBOLO_TERRENO,
  MATRIZ_VALLE_VADOS, MATRIZ_GARGANTA_DRAGON, MATRIZ_TRES_CARRILES,
  MATRIZ_RUINAS_BASTION, MATRIZ_HUMEDALES,
} from '../data/scenarios.js'
import { vecinos, hexKey, dentroDeForma, generarTableroRect } from '../engine/hex.js'

// Plantillas 15×10 del dueño (ver docs/features y src/data/scenarios.js).
const PLANTILLAS = [
  ['valle-vados', MATRIZ_VALLE_VADOS],
  ['garganta-dragon', MATRIZ_GARGANTA_DRAGON],
  ['encrucijada', MATRIZ_TRES_CARRILES],
  ['ruinas-bastion', MATRIZ_RUINAS_BASTION],
  ['humedales', MATRIZ_HUMEDALES],
]

// BFS de conectividad en el grafo de hexes del tablero, acotado a la forma del
// escenario. Prohíbe bloqueados + agua (todo lo impasable al moverse).
function alcanzablesDesde(origen, proh, forma) {
  const prohi = new Set(proh)
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

const SIMBOLOS_VALIDOS = new Set(Object.keys(SIMBOLO_TERRENO))

describe('Plantillas de mapa 15×10 — integridad de los datos', () => {
  it.each(PLANTILLAS)('%s es una matriz 15×10 con símbolos válidos', (_id, matriz) => {
    expect(matriz).toHaveLength(10)
    for (const fila of matriz) {
      expect(fila).toHaveLength(15)
      for (const celda of fila) {
        expect(SIMBOLOS_VALIDOS.has(celda)).toBe(true)
      }
    }
  })

  it('cargarEscenario deriva el terreno de exactamente los 150 hexes del rect', () => {
    for (const [id, matriz] of PLANTILLAS) {
      const e = cargarEscenario(id, matriz)
      const claves = new Set(Object.keys(e.terreno))
      expect(claves).toEqual(new Set(generarTableroRect(15, 10).map(hexKey)))
    }
  })

  it('cada escenario del catálogo resuelve por obtenerEscenario', () => {
    for (const s of ESCENARIOS) {
      expect(obtenerEscenario(s.id)).not.toBeNull()
    }
  })
})

describe('Plantillas de mapa 15×10 — geometría y bloqueos', () => {
  it.each(PLANTILLAS)('%s es un rect 15×10 con bloqueados y agua disjuntos', (_id, matriz) => {
    const e = cargarEscenario(_id, matriz)
    expect(e.forma).toEqual({ tipo: 'rect', columnas: 15, filas: 10 })
    const bloqueados = new Set(e.bloqueados)
    for (const agua of e.bloqueaMovimientoSinLos) {
      expect(bloqueados.has(agua)).toBe(false)
    }
    // Ningún hex de despliegue queda bloqueado ni es agua.
    for (const d of [...e.despliegue.A, ...e.despliegue.B]) {
      const key = hexKey(d)
      expect(bloqueados.has(key)).toBe(false)
      expect(e.bloqueaMovimientoSinLos).not.toContain(key)
    }
  })

  it('El vado del Valle está libre y se pinta como camino', () => {
    const e = cargarEscenario('valle-vados', MATRIZ_VALLE_VADOS)
    const keyVadoOeste = hexKey({ q: -2, r: -3 }) // matriz R2 C6
    const keyVadoEste = hexKey({ q: -1, r: 1 })   // matriz R6 C9
    for (const k of [keyVadoOeste, keyVadoEste]) {
      expect(e.bloqueados).not.toContain(k)
      expect(e.bloqueaMovimientoSinLos).not.toContain(k)
      expect(e.terreno[k]).toBe('camino')
    }
  })

  it('El agua del Valle vive en bloqueaMovimientoSinLos y se pinta agua', () => {
    const e = cargarEscenario('valle-vados', MATRIZ_VALLE_VADOS)
    const keyAgua = hexKey({ q: -4, r: -3 }) // matriz R2 C4
    expect(e.bloqueados).not.toContain(keyAgua)
    expect(e.bloqueaMovimientoSinLos).toContain(keyAgua)
    expect(e.terreno[keyAgua]).toBe('agua')
  })

  it('Las montañas de la Garganta son bloqueados (no agua)', () => {
    const e = cargarEscenario('garganta-dragon', MATRIZ_GARGANTA_DRAGON)
    const keyMontana = hexKey({ q: -8, r: -2 }) // matriz R3 C0 (⛰️)
    expect(e.bloqueados).toContain(keyMontana)
    expect(e.bloqueaMovimientoSinLos).not.toContain(keyMontana)
    expect(e.terreno[keyMontana]).toBe('montaña')
  })
})

describe('Plantillas de mapa 15×10 — conectividad A↔B y lugares', () => {
  it.each(PLANTILLAS)('%s: los 36 pares despliegue-A↔despliegue-B quedan conectados (6+6, D-38)', (_id, matriz) => {
    const e = cargarEscenario(_id, matriz)
    const proh = [...e.bloqueados, ...e.bloqueaMovimientoSinLos]
    for (const a of e.despliegue.A) {
      const alcanzables = alcanzablesDesde(a, proh, e.forma)
      for (const b of e.despliegue.B) {
        expect(alcanzables.has(hexKey(b))).toBe(true)
      }
    }
  })

  it.each(PLANTILLAS)('%s: despliegues dentro del tablero', (_id, matriz) => {
    const e = cargarEscenario(_id, matriz)
    for (const d of [...e.despliegue.A, ...e.despliegue.B]) {
      expect(dentroDeForma(e.forma, d)).toBe(true)
    }
  })

  it('Solo Ruinas del Bastión define lugares, y están libres', () => {
    for (const [id, matriz] of PLANTILLAS) {
      // Del catálogo: solo el catálogo añade los lugares como extras.
      const e = obtenerEscenario(id)
      if (id === 'ruinas-bastion') {
        expect(e.lugares).toHaveLength(3)
        const ocupados = new Set([...e.despliegue.A, ...e.despliegue.B].map(hexKey))
        const proh = new Set([...e.bloqueados, ...e.bloqueaMovimientoSinLos])
        for (const l of e.lugares) {
          expect(proh.has(hexKey(l))).toBe(false)
          expect(ocupados.has(hexKey(l))).toBe(false)
        }
      } else {
        expect(e.lugares).toHaveLength(0)
      }
    }
  })

  it('Los 3 lugares del Bastión son alcanzables desde los 12 despliegues', () => {
    const e = obtenerEscenario('ruinas-bastion')
    const proh = [...e.bloqueados, ...e.bloqueaMovimientoSinLos]
    for (const d of [...e.despliegue.A, ...e.despliegue.B]) {
      const alcanzables = alcanzablesDesde(d, proh, e.forma)
      for (const l of e.lugares) {
        expect(alcanzables.has(hexKey(l))).toBe(true)
      }
    }
  })

  it('El escenario base sigue intacto y sin agua ni matriz', () => {
    const e = obtenerEscenario('base')
    expect(e.forma).toEqual({ tipo: 'rect', columnas: 15, filas: 10 })
    expect(e.bloqueados).toHaveLength(23)
    expect(e.bloqueaMovimientoSinLos).toHaveLength(0)
    expect(e.terreno).toBeNull()
    expect(e.lugares).toHaveLength(3)
  })
})
