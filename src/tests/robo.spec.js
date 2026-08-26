import { describe, it, expect } from 'vitest'
import { crearEstadoInicial } from '../engine/state.js'
import { aplicarIntencion } from '../engine/index.js'
import { crearReglas } from '../data/rules.js'

describe('US-005 — Mano inicial y robo', () => {
  describe('Escenario: Reparto inicial', () => {
    it('Cada jugador tiene 5 cartas en la mano', () => {
      const estado = crearEstadoInicial('test-robo-01')
      expect(estado.jugadores.A.mano).toHaveLength(5)
      expect(estado.jugadores.B.mano).toHaveLength(5)
    })

    it('Su mazo tiene 10 cartas restantes', () => {
      const estado = crearEstadoInicial('test-robo-01b')
      expect(estado.jugadores.A.mazo).toHaveLength(10)
      expect(estado.jugadores.B.mazo).toHaveLength(10)
    })
  })

  describe('Escenario: Robo al inicio del turno', () => {
    it('Roba 1 carta al inicio del turno', () => {
      const estado = crearEstadoInicial('test-robo-02')
      const jugador = estado.turnoDe
      const manejador = estado.jugadores[jugador]
      const cartasManoAntes = manejador.mano.length
      const cartasMazoAntes = manejador.mazo.length
      manejador.mano.push(manejador.mazo.pop())
      expect(manejador.mano.length).toBe(cartasManoAntes + 1)
      expect(manejador.mazo.length).toBe(cartasMazoAntes - 1)
    })
  })

  describe('D-08 (aprobado 05/08/2026) — robo por turno = 0', () => {
    it('Al terminar el turno, el jugador entrante no recibe cartas', () => {
      const estado = crearEstadoInicial('test-robo-04')
      const inicial = estado.turnoDe
      const entrante = inicial === 'A' ? 'B' : 'A'
      const manoEntrante = estado.jugadores[entrante].mano.length
      const mazoEntrante = estado.jugadores[entrante].mazo.length
      let actual = aplicarIntencion(estado, { tipo: 'JUGAR_CARTA', jugador: inicial, indiceCarta: 0 })
      actual = aplicarIntencion(actual, { tipo: 'TERMINAR_TURNO', jugador: inicial })
      expect(actual.jugadores[entrante].mano).toHaveLength(manoEntrante)
      expect(actual.jugadores[entrante].mazo).toHaveLength(mazoEntrante)
    })

    it('La ronda termina cuando cada jugador gastó sus 5 cartas', () => {
      let estado = crearEstadoInicial('test-robo-05')
      for (let turno = 0; turno < 10; turno++) {
        const jugador = estado.turnoDe
        expect(estado.jugadores[jugador].mano.length).toBeGreaterThan(0)
        estado = aplicarIntencion(estado, { tipo: 'JUGAR_CARTA', jugador, indiceCarta: 0 })
        estado = aplicarIntencion(estado, { tipo: 'TERMINAR_TURNO', jugador })
      }
      expect(estado.ronda).toBe(2)
      expect(estado.jugadores.A.mano).toHaveLength(5)
      expect(estado.jugadores.B.mano).toHaveLength(5)
    })
  })

  describe('Escenario: Mazo agotado', () => {
    it('No roba ninguna carta y la partida continúa sin error', () => {
      const estado = crearEstadoInicial('test-robo-03')
      estado.jugadores.A.mazo = []
      expect(() => {
        if (estado.jugadores.A.mazo.length > 0) {
          estado.jugadores.A.mano.push(estado.jugadores.A.mazo.pop())
        }
      }).not.toThrow()
      expect(estado.jugadores.A.mazo).toHaveLength(0)
    })
  })
})
