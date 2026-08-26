import { describe, it, expect } from 'vitest'
import { armarEstado, unidad, dadosFijos, po } from './helpers.js'
import { aplicarIntencion } from '../engine/index.js'
import { otorgarBaja, metasFinDeTurno, verificarVictoriaObjetivos } from '../engine/objetivos.js'

const OBJETIVOS = {
  puente: { q: 0, r: 0 },
  ladoEnemigo: {
    A: ['0,3', '1,3'], // hexes que para A cuentan como lado enemigo
    B: ['0,-3', '1,-3'],
  },
}

function estadoConObjetivos(overrides = {}) {
  return armarEstado({
    tablero: { objetivos: OBJETIVOS },
    ...overrides,
  })
}

describe('D-33/34/35 — Victoria por objetivos', () => {
  it('sin escenario de objetivos no se activa la modalidad', () => {
    const estado = armarEstado({})
    expect(verificarVictoriaObjetivos(estado)).toBe(null)
  })

  it('otorgarBaja suma +1 estandarte al bando contrario del eliminado', () => {
    const estado = estadoConObjetivos()
    otorgarBaja(estado, { jugador: 'B', id: 'B1' })
    expect(estado.marcador).toEqual({ A: 1, B: 0 })
  })

  it('metasFinDeTurno: +2 por controlar el puente al final del turno', () => {
    const estado = estadoConObjetivos({
      unidades: [unidad('A1', 'A', 'Peon', { q: 0, r: 0 })],
    })
    metasFinDeTurno(estado, 'A')
    expect(estado.marcador.A).toBe(2)
  })

  it('metasFinDeTurno: +2 por cada unidad que termina en el lado enemigo', () => {
    const estado = estadoConObjetivos({
      unidades: [
        unidad('A1', 'A', 'Peon', { q: 0, r: 3 }),
        unidad('A2', 'A', 'Peon', { q: 1, r: 3 }),
        unidad('A3', 'A', 'Peon', { q: 0, r: -3 }), // lado propio: no suma
      ],
    })
    metasFinDeTurno(estado, 'A')
    expect(estado.marcador.A).toBe(4)
  })

  it('metasFinDeTurno no suma puntos si no cumple las condiciones', () => {
    const estado = estadoConObjetivos({
      unidades: [unidad('A1', 'A', 'Peon', { q: 0, r: -3 })],
    })
    metasFinDeTurno(estado, 'A')
    expect(estado.marcador.A).toBe(0)
  })

  it('al alcanzar el umbral se gana por objetivos', () => {
    const estado = estadoConObjetivos({
      marcador: { A: 5, B: 1 },
    })
    otorgarBaja(estado, { jugador: 'B', id: 'B1' }) // A llega a 6
    expect(verificarVictoriaObjetivos(estado)).toEqual({ ganador: 'A', motivo: 'objetivos' })
  })

  it('al superar el límite de rondas gana el de más puntos', () => {
    const estado = estadoConObjetivos({
      ronda: 11,
      marcador: { A: 3, B: 4 },
    })
    expect(verificarVictoriaObjetivos(estado)).toEqual({ ganador: 'B', motivo: 'puntos al límite de rondas' })
  })

  it('empate al límite de rondas: gana el Rey vivo', () => {
    const estado = estadoConObjetivos({
      ronda: 11,
      marcador: { A: 4, B: 4 },
      unidades: [
        unidad('A1', 'A', 'Rey', { q: 0, r: -3 }),
        unidad('B1', 'B', 'Peon', { q: 0, r: 3 }), // B sin Rey
      ],
    })
    expect(verificarVictoriaObjetivos(estado)).toEqual({ ganador: 'A', motivo: 'desempate por Rey vivo' })
  })

  it('empate al límite de rondas con ambos Reyes vivos: empate', () => {
    const estado = estadoConObjetivos({
      ronda: 11,
      marcador: { A: 4, B: 4 },
      unidades: [
        unidad('A1', 'A', 'Rey', { q: 0, r: -3 }),
        unidad('B1', 'B', 'Rey', { q: 0, r: 3 }),
      ],
    })
    expect(verificarVictoriaObjetivos(estado)).toEqual({ ganador: null, motivo: 'empate' })
  })

  it('antes del límite de rondas no hay victoria por puntos', () => {
    const estado = estadoConObjetivos({
      ronda: 10,
      marcador: { A: 4, B: 4 },
    })
    expect(verificarVictoriaObjetivos(estado)).toBe(null)
  })
})

describe('D-34 — Metas por bajas a través de la partida (integración)', () => {
  it('eliminar a un enemigo en combate suma +1 al bando atacante', () => {
    const estado = estadoConObjetivos({
      turnoDe: 'A',
      rng: dadosFijos([9, 9, 1, 1, 1, 1]), // ataque alto (9), defensa baja (1)
      unidades: [
        unidad('A1', 'A', 'Caballo', { q: 0, r: 2 }),
        unidad('B1', 'B', 'Peon', { q: 0, r: 1 }, { maxVida: 1 }), // vida 1: una herida lo elimina
      ],
      poA: [po('A', 'Fuego', 3)],
      reglas: { declaracionTecnica: 'antes-de-tirar' },
    })
    const actual = aplicarIntencion(estado, { tipo: 'ATACAR', jugador: 'A', atacante: 'A1', objetivo: 'B1' })
    if (actual.combatePendiente) {
      const repetir = aplicarIntencion(actual, { tipo: 'REFLEJAR_DADOS', jugador: 'A', dadosARepetir: [] })
      expect(repetir.marcador.A).toBe(1)
    } else {
      expect(actual.marcador.A).toBe(1)
    }
  })
})
