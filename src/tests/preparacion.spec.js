import { describe, it, expect } from 'vitest'
import { crearEstadoInicial } from '../engine/state.js'
import { ARQUETIPOS } from '../data/archetypes.js'
import { ESCENARIO_BASE } from '../data/scenarios.js'

describe('US-003 — Bandas desplegadas', () => {
  describe('Escenario: Cada jugador controla entre 4 y 6 unidades', () => {
    it('Cada jugador tiene entre 4 y 6 unidades en el tablero', () => {
      const estado = crearEstadoInicial('test-bandas-01')
      const unidadesA = estado.unidades.filter(u => u.jugador === 'A')
      const unidadesB = estado.unidades.filter(u => u.jugador === 'B')
      expect(unidadesA.length).toBeGreaterThanOrEqual(4)
      expect(unidadesA.length).toBeLessThanOrEqual(6)
      expect(unidadesB.length).toBeGreaterThanOrEqual(4)
      expect(unidadesB.length).toBeLessThanOrEqual(6)
    })

    it('Cada unidad tiene un arquetipo asignado y un identificador único', () => {
      const estado = crearEstadoInicial('test-bandas-01b')
      const ids = estado.unidades.map(u => u.id)
      const idsUnicos = [...new Set(ids)]
      expect(ids.length).toBe(idsUnicos.length)
      for (const u of estado.unidades) {
        expect(u.arquetipo).toBeDefined()
        expect(ARQUETIPOS[u.arquetipo]).toBeDefined()
      }
    })

    it('Cada jugador tiene exactamente un Rey', () => {
      const estado = crearEstadoInicial('test-bandas-01c')
      const reyesA = estado.unidades.filter(u => u.jugador === 'A' && u.arquetipo === 'Rey')
      const reyesB = estado.unidades.filter(u => u.jugador === 'B' && u.arquetipo === 'Rey')
      expect(reyesA).toHaveLength(1)
      expect(reyesB).toHaveLength(1)
    })
  })

  describe('Escenario: El despliegue usa las posiciones del escenario base', () => {
    it('Las unidades del jugador A ocupan las posiciones de despliegue A', () => {
      const estado = crearEstadoInicial('test-bandas-02')
      const unidadesA = estado.unidades.filter(u => u.jugador === 'A')
      const posicionesEsperadas = ESCENARIO_BASE.despliegue.A
      for (const u of unidadesA) {
        const esperada = posicionesEsperadas.find(
          p => p.q === u.pos.q && p.r === u.pos.r
        )
        expect(esperada).toBeDefined()
      }
    })

    it('Ninguna unidad comparte hexágono con otra', () => {
      const estado = crearEstadoInicial('test-bandas-02b')
      const posiciones = estado.unidades.map(u => `${u.pos.q},${u.pos.r}`)
      const posUnicas = [...new Set(posiciones)]
      expect(posiciones.length).toBe(posUnicas.length)
    })

    it('Ninguna unidad ocupa un hexágono bloqueado', () => {
      const estado = crearEstadoInicial('test-bandas-02c')
      const bloqueados = new Set(estado.tablero.bloqueados)
      for (const u of estado.unidades) {
        expect(bloqueados.has(`${u.pos.q},${u.pos.r}`)).toBe(false)
      }
    })
  })

  describe('Escenario: Las dos facciones son asimétricas', () => {
    it('Difieren en la composición de arquetipos o en la mezcla elemental del mazo', () => {
      const estado = crearEstadoInicial('test-bandas-03')
      const habilidadesA = estado.jugadores.A.mazo
        .map(c => c.habilidad?.nombre || 'Ninguna')
        .sort()
      const habilidadesB = estado.jugadores.B.mazo
        .map(c => c.habilidad?.nombre || 'Ninguna')
        .sort()
      const sonDiferentes = JSON.stringify(habilidadesA) !== JSON.stringify(habilidadesB)
      expect(sonDiferentes).toBe(true)
    })
  })
})
