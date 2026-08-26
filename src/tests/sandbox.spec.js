import { describe, it, expect } from 'vitest'
import { crearEstadoInicial } from '../engine/state.js'
import { obtenerEscenario } from '../data/scenarios.js'
import { dentroDeForma, hexKey } from '../engine/hex.js'
import { verificarVictoria } from '../engine/round.js'

// US-175 — Army Sandbox: escenario asimétrico "Horda vs Élite". La creación de
// unidades lee el `.arquetipo` de cada posición de despliegue; si no lo trae,
// cae al roster estándar (retrocompatibilidad). Un bando sin Rey desde el
// inicio se resuelve por eliminación total, sin ficciones de "muerte del Rey".
describe('US-175 — Army Sandbox (Horda vs Élite)', () => {
  it('el escenario sandbox-horda es seleccionable desde el catálogo', () => {
    const e = obtenerEscenario('sandbox-horda')
    expect(e).not.toBeNull()
    expect(e.nombre).toBe('sandbox-horda')
  })

  it('despliega 3 de élite (A) contra 12 Peones (B)', () => {
    const estado = crearEstadoInicial('sandbox-test', 'sandbox-horda')
    const A = estado.unidades.filter(u => u.jugador === 'A')
    const B = estado.unidades.filter(u => u.jugador === 'B')
    expect(A).toHaveLength(3)
    expect(B).toHaveLength(12)
    expect(A.map(u => u.arquetipo).sort()).toEqual(['Alfil', 'Campeon', 'Rey'])
    expect(B.every(u => u.arquetipo === 'Peon')).toBe(true)
  })

  it('B no tiene Rey y A sí', () => {
    const estado = crearEstadoInicial('sandbox-test', 'sandbox-horda')
    expect(estado.unidades.some(u => u.jugador === 'B' && u.arquetipo === 'Rey')).toBe(false)
    expect(estado.unidades.some(u => u.jugador === 'A' && u.arquetipo === 'Rey')).toBe(true)
  })

  it('todas las unidades quedan dentro de la forma del tablero', () => {
    const estado = crearEstadoInicial('sandbox-test', 'sandbox-horda')
    const forma = estado.tablero.forma
    expect(forma).toEqual({ tipo: 'rect', columnas: 15, filas: 10 })
    for (const u of estado.unidades) {
      expect(dentroDeForma(forma, u.pos)).toBe(true)
    }
  })

  it('las posiciones de despliegue no colisionan ni caen en bloqueados', () => {
    const estado = crearEstadoInicial('sandbox-test', 'sandbox-horda')
    const bloqueados = new Set(estado.tablero.bloqueados)
    const claves = estado.unidades.map(u => hexKey(u.pos))
    expect(new Set(claves).size).toBe(claves.length)
    for (const key of claves) {
      expect(bloqueados.has(key)).toBe(false)
    }
  })

  it('un bando sin Rey desde el inicio cae directo a eliminación total', () => {
    const estado = crearEstadoInicial('sandbox-test', 'sandbox-horda')
    const soloA = { ...estado, unidades: estado.unidades.filter(u => u.jugador === 'A') }
    expect(verificarVictoria(soloA)).toEqual({ ganador: 'A', motivo: 'eliminación total' })
    const soloB = { ...estado, unidades: estado.unidades.filter(u => u.jugador === 'B') }
    expect(verificarVictoria(soloB)).toEqual({ ganador: 'B', motivo: 'eliminación total' })
  })

  it('retrocompatibilidad: sin .arquetipo en las posiciones, se usa el roster estándar', () => {
    const estado = crearEstadoInicial('retrocompat', 'base')
    expect(estado.unidades).toHaveLength(12)
    expect(estado.unidades.filter(u => u.jugador === 'B')).toHaveLength(6)
    expect(estado.unidades.some(u => u.jugador === 'B' && u.arquetipo === 'Rey')).toBe(true)
  })
})