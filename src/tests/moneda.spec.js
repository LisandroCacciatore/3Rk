import { describe, it, expect } from 'vitest'
import { crearEstadoInicial } from '../engine/state.js'

describe('US-004 — Jugador inicial por moneda', () => {
  describe('Escenario: Se ejecuta la tirada de moneda', () => {
    it('El turno activo es de un jugador válido', () => {
      const estado = crearEstadoInicial('test-moneda-01')
      expect(['A', 'B']).toContain(estado.turnoDe)
    })

    it('Se registra en el log qué jugador comienza', () => {
      const estado = crearEstadoInicial('test-moneda-02')
      const eventoInicio = estado.log.find(e => e.tipo === 'inicio')
      expect(eventoInicio).toBeDefined()
      expect(eventoInicio.descripcion).toContain(estado.turnoDe)
    })
  })

  describe('Escenario: La moneda es determinista con la misma semilla', () => {
    it('El mismo jugador comienza en ambas partidas con la misma semilla', () => {
      const estado1 = crearEstadoInicial('playtest-01')
      const estado2 = crearEstadoInicial('playtest-01')
      expect(estado1.turnoDe).toBe(estado2.turnoDe)
    })
  })
})
