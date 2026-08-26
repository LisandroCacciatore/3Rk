import { describe, it, expect } from 'vitest'
import { crearEstadoInicial } from '../engine/state.js'
import { aplicarIntencion } from '../engine/index.js'

describe('US-000 — Andamiaje del prototipo y estado inicial', () => {
  describe('Escenario: La aplicación arranca y muestra la pantalla de partida', () => {
    it('El estado inicial se crea correctamente', () => {
      const estado = crearEstadoInicial('test-01')
      expect(estado).toBeDefined()
      expect(estado.ronda).toBe(1)
      expect(estado.turnoDe).toBeDefined()
      expect(estado.tablero).toBeDefined()
      expect(estado.jugadores.A).toBeDefined()
      expect(estado.jugadores.B).toBeDefined()
    })
  })

  describe('Escenario: El motor expone una única función de entrada', () => {
    it('aplicarIntencion devuelve un estado nuevo sin mutar el original', () => {
      const estado = crearEstadoInicial('test-02')
      const snapshot = {
        ronda: estado.ronda,
        turnoDe: estado.turnoDe,
        tablero: JSON.parse(JSON.stringify(estado.tablero)),
        jugadores: JSON.parse(JSON.stringify(estado.jugadores)),
        unidades: JSON.parse(JSON.stringify(estado.unidades)),
      }
      const nuevo = aplicarIntencion(estado, { tipo: 'JUGAR_CARTA', jugador: 'A', indiceCarta: 0 })
      expect(nuevo.ronda).toBe(snapshot.ronda)
      expect(nuevo.turnoDe).toBe(snapshot.turnoDe)
      expect(nuevo.tablero).toEqual(snapshot.tablero)
      expect(estado.ronda).toBe(snapshot.ronda)
      expect(estado.turnoDe).toBe(snapshot.turnoDe)
      expect(estado.tablero).toEqual(snapshot.tablero)
      expect(estado.jugadores).toEqual(snapshot.jugadores)
      expect(estado.unidades).toEqual(snapshot.unidades)
    })
  })

  describe('Escenario: Una intención desconocida no rompe la partida', () => {
    it('El estado devuelto es idéntico al original', () => {
      const estado = crearEstadoInicial('test-03')
      const estadoOriginal = JSON.parse(JSON.stringify(estado))
      const nuevo = aplicarIntencion(estado, { tipo: 'INEXISTENTE' })
      expect(nuevo.tablero).toEqual(estadoOriginal.tablero)
      expect(nuevo.jugadores).toEqual(estadoOriginal.jugadores)
      expect(nuevo.unidades).toEqual(estadoOriginal.unidades)
      expect(nuevo.ronda).toBe(estadoOriginal.ronda)
      expect(nuevo.turnoDe).toBe(estadoOriginal.turnoDe)
    })

    it('Se registra en el log una entrada de tipo "error" con el nombre de la intención', () => {
      const estado = crearEstadoInicial('test-03b')
      const nuevo = aplicarIntencion(estado, { tipo: 'INEXISTENTE' })
      const eventosError = nuevo.log.filter(e => e.tipo === 'error')
      expect(eventosError.length).toBeGreaterThan(0)
      expect(eventosError[0].descripcion).toContain('INEXISTENTE')
    })
  })

  describe('Escenario: El estado inicial se crea con una semilla determinista', () => {
    it('Ambos estados iniciales son idénticos campo por campo', () => {
      const estado1 = crearEstadoInicial('playtest-01')
      const estado2 = crearEstadoInicial('playtest-01')
      expect(estado1.ronda).toBe(estado2.ronda)
      expect(estado1.turnoDe).toBe(estado2.turnoDe)
      expect(estado1.tablero).toEqual(estado2.tablero)
      expect(estado1.jugadores.A.mazo.length).toBe(estado2.jugadores.A.mazo.length)
      expect(estado1.jugadores.A.mano.length).toBe(estado2.jugadores.A.mano.length)
      expect(estado1.unidades.length).toBe(estado2.unidades.length)
      expect(estado1.jugadores.A.faccion).toBe(estado2.jugadores.A.faccion)
    })

    it('Semillas diferentes generan estados diferentes', () => {
      const estado1 = crearEstadoInicial('semilla-a')
      const estado2 = crearEstadoInicial('semilla-b')
      const alMenosUnoDifiere =
        estado1.turnoDe !== estado2.turnoDe ||
        estado1.jugadores.A.mano[0]?.elemento !== estado2.jugadores.A.mano[0]?.elemento
      expect(alMenosUnoDifiere).toBe(true)
    })
  })

  describe('Escenario: El registro de partida acumula eventos en orden', () => {
    it('El log contiene tres entradas tras tres intenciones', () => {
      const estado = crearEstadoInicial('test-05')
      let actual = aplicarIntencion(estado, { tipo: 'JUGAR_CARTA', jugador: 'A', indiceCarta: 0 })
      actual = aplicarIntencion(actual, { tipo: 'JUGAR_CARTA', jugador: 'B', indiceCarta: 0 })
      actual = aplicarIntencion(actual, { tipo: 'TERMINAR_TURNO', jugador: 'A' })
      expect(actual.log.length).toBeGreaterThanOrEqual(4)
    })

    it('Cada entrada tiene ronda, turno, actor, tipo y descripción legible', () => {
      const estado = crearEstadoInicial('test-05b')
      const actual = aplicarIntencion(estado, { tipo: 'TERMINAR_TURNO', jugador: 'A' })
      const evento = actual.log[actual.log.length - 1]
      expect(evento).toHaveProperty('ronda')
      expect(evento).toHaveProperty('turno')
      expect(evento).toHaveProperty('actor')
      expect(evento).toHaveProperty('tipo')
      expect(evento).toHaveProperty('descripcion')
      expect(typeof evento.descripcion).toBe('string')
      expect(evento.descripcion.length).toBeGreaterThan(0)
    })
  })
})
