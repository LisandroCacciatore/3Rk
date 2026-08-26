import { describe, it, expect } from 'vitest'
import {
  cargarEscenario, obtenerEscenario, ESCENARIOS,
  SIMBOLO_TERRENO,
  MATRIZ_RIO_TAJII,
} from '../data/scenarios.js'
import { vecinos, hexKey, dentroDeForma, generarTableroRect } from '../engine/hex.js'
import { crearEstadoInicial } from '../engine/state.js'

// BFS de conectividad (mismo helper que plantillas.spec.js).
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

describe('D-36 — Escenario Río Tajii (13×9): integridad de los datos', () => {
  it('es una matriz 13×9 con símbolos válidos', () => {
    expect(MATRIZ_RIO_TAJII).toHaveLength(9)
    for (const fila of MATRIZ_RIO_TAJII) {
      expect(fila).toHaveLength(13)
      for (const celda of fila) {
        expect(SIMBOLOS_VALIDOS.has(celda)).toBe(true)
      }
    }
  })

  it('cargarEscenario deriva el terreno de exactamente los 117 hexes del rect', () => {
    const e = cargarEscenario('rio-tajii', MATRIZ_RIO_TAJII)
    const claves = new Set(Object.keys(e.terreno))
    expect(claves).toEqual(new Set(generarTableroRect(13, 9).map(hexKey)))
    expect(e.forma).toEqual({ tipo: 'rect', columnas: 13, filas: 9 })
  })

  it('está en el catálogo y resuelve por obtenerEscenario', () => {
    expect(ESCENARIOS.some(s => s.id === 'rio-tajii')).toBe(true)
    expect(obtenerEscenario('rio-tajii')).not.toBeNull()
  })

  it('tiene un puente central y dos vados transitables, y agua separada', () => {
    const e = cargarEscenario('rio-tajii', MATRIZ_RIO_TAJII)
    // Puente: matriz C6 R4 → axial {-2,0}.
    const keyPuente = hexKey({ q: -2, r: 0 })
    expect(e.terreno[keyPuente]).toBe('puente')
    expect(e.bloqueados).not.toContain(keyPuente)
    expect(e.bloqueaMovimientoSinLos).not.toContain(keyPuente)

    // Vados: matriz C6 R2 → axial {-1,-2} y C6 R6 → {-3,2}.
    for (const k of [hexKey({ q: -1, r: -2 }), hexKey({ q: -3, r: 2 })]) {
      expect(e.terreno[k]).toBe('camino')
      expect(e.bloqueados).not.toContain(k)
    }

    // Agua del río en bloqueaMovimientoSinLos (impasable, LoS abierto D-28).
    expect(e.bloqueaMovimientoSinLos.length).toBeGreaterThan(0)
    for (const agua of e.bloqueaMovimientoSinLos) {
      expect(e.bloqueados).not.toContain(agua)
      expect(e.terreno[agua]).toBe('agua')
    }
  })

  it('tiene empalizadas libres al costado del puente', () => {
    const e = cargarEscenario('rio-tajii', MATRIZ_RIO_TAJII)
    // Empalizadas: matriz C4 R4 → {-4,0} y C8 R4 → {0,0}.
    for (const k of [hexKey({ q: -4, r: 0 }), hexKey({ q: 0, r: 0 })]) {
      expect(e.terreno[k]).toBe('empalizada')
      expect(e.bloqueados).not.toContain(k)
    }
  })

  it('definir objetivos y lado enemigo del escenario', () => {
    const e = obtenerEscenario('rio-tajii')
    expect(e.objetivos.puente).toEqual({ q: -2, r: 0 })
    // El lado enemigo se expande a las keys transitables de las filas marcadas.
    expect(e.objetivos.ladoEnemigo.A.length).toBeGreaterThan(0)
    expect(e.objetivos.ladoEnemigo.B.length).toBeGreaterThan(0)
    // A nunca está en su propio lado enemigo.
    for (const d of e.despliegue.A) {
      expect(e.objetivos.ladoEnemigo.A).not.toContain(hexKey(d))
    }
    for (const d of e.despliegue.B) {
      expect(e.objetivos.ladoEnemigo.B).not.toContain(hexKey(d))
    }
  })
})

describe('D-36 — Escenario Río Tajii (13×9): geometría y conectividad', () => {
  it('los despliegues quedan dentro del tablero y libres', () => {
    const e = obtenerEscenario('rio-tajii')
    const proh = new Set([...e.bloqueados, ...e.bloqueaMovimientoSinLos])
    for (const d of [...e.despliegue.A, ...e.despliegue.B]) {
      expect(dentroDeForma(e.forma, d)).toBe(true)
      expect(proh.has(hexKey(d))).toBe(false)
    }
  })

  it('todos los pares despliegue-A ↔ despliegue-B quedan conectados', () => {
    const e = obtenerEscenario('rio-tajii')
    const proh = [...e.bloqueados, ...e.bloqueaMovimientoSinLos]
    for (const a of e.despliegue.A) {
      const alcanzables = alcanzablesDesde(a, proh, e.forma)
      for (const b of e.despliegue.B) {
        expect(alcanzables.has(hexKey(b))).toBe(true)
      }
    }
  })

  it('el puente es alcanzable desde todos los despliegues', () => {
    const e = obtenerEscenario('rio-tajii')
    const proh = [...e.bloqueados, ...e.bloqueaMovimientoSinLos]
    const keyPuente = hexKey(e.objetivos.puente)
    for (const d of [...e.despliegue.A, ...e.despliegue.B]) {
      const alcanzables = alcanzablesDesde(d, proh, e.forma)
      expect(alcanzables.has(keyPuente)).toBe(true)
    }
  })
})

describe('D-36 — Río Tajii: el motor crea la partida con objetivos activos', () => {
  it('crearEstadoInicial activa tablero.objetivos y marcador en 0', () => {
    const estado = crearEstadoInicial('tajii-test', 'rio-tajii')
    expect(estado.escenario).toBe('rio-tajii')
    expect(estado.tablero.objetivos.puente).toEqual({ q: -2, r: 0 })
    expect(estado.marcador).toEqual({ A: 0, B: 0 })
    expect(estado.unidades).toHaveLength(12) // 6+6 despliegue por defecto
  })
})
