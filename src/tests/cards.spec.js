import { describe, it, expect } from 'vitest'
import { crearEstadoInicial } from '../engine/state.js'
import { aplicarIntencion } from '../engine/index.js'
import { contarCartas } from '../data/factions.js'

describe('US-002 — Mazo de facción de 15 cartas', () => {
  describe('Escenario: Cada jugador tiene 15 cartas', () => {
    it('Cada jugador tiene exactamente 15 cartas sumando mazo, mano y descarte', () => {
      const estado = crearEstadoInicial('test-cartas-01')
      expect(contarCartas(estado.jugadores.A)).toBe(15)
      expect(contarCartas(estado.jugadores.B)).toBe(15)
    })
  })

  describe('Escenario: Estructura de la carta', () => {
    it('Tiene un elemento entre Fuego, Agua, Aire, Tierra y Vacío', () => {
      const estado = crearEstadoInicial('test-cartas-02')
      const elementosValidos = ['Fuego', 'Agua', 'Aire', 'Tierra', 'Vacio']
      for (const carta of estado.jugadores.A.mano) {
        expect(elementosValidos).toContain(carta.elemento)
      }
    })

    it('Tiene un valor de Orden entre 1 y 3', () => {
      const estado = crearEstadoInicial('test-cartas-02b')
      for (const carta of estado.jugadores.A.mano) {
        expect(carta.valor).toBeGreaterThanOrEqual(1)
        expect(carta.valor).toBeLessThanOrEqual(3)
      }
    })
  })

  describe('Escenario: En el MVP toda carta se juega como Orden', () => {
    it('Jugar una carta genera PO del elemento correspondiente', () => {
      const estado = crearEstadoInicial('test-cartas-03')
      const carta = estado.jugadores.A.mano[0]
      const nuevo = aplicarIntencion(estado, {
        tipo: 'JUGAR_CARTA',
        jugador: 'A',
        indiceCarta: 0,
      })
      const poElemento = nuevo.jugadores.A.po.find(
        p => p.elemento === carta.elemento
      )
      expect(poElemento).toBeDefined()
      expect(poElemento.cantidad).toBe(carta.valor)
    })
  })

  describe('Escenario: Mazo simétrico de referencia', () => {
    it('Contiene un ejemplar de cada combinación de 5 elementos por 3 valores', () => {
      const estado = crearEstadoInicial('test-cartas-04')
      const todas = [
        ...estado.jugadores.A.mazo,
        ...estado.jugadores.A.mano,
        ...estado.jugadores.A.descarte,
      ]
      expect(todas).toHaveLength(15)
      const elementos = ['Fuego', 'Agua', 'Aire', 'Tierra', 'Vacio']
      const valores = [1, 2, 3]
      for (const el of elementos) {
        for (const v of valores) {
          const count = todas.filter(c => c.elemento === el && c.valor === v).length
          expect(count).toBe(1)
        }
      }
    })
  })
})
