import { describe, it, expect } from 'vitest'
import { metricasDePartida } from '../../sim/metricas.js'
import { armarEstado, unidad } from './helpers.js'

// US-106 — Métricas profundas por arquetipo (docs/features/PLAYTEST-02.feature).
// La instrumentación vive en sim/ (fuera del motor): solo lee estado.log,
// estado.unidades, estado.ronda y estado.ganador. No modifica el estado.
//
// Los eventos del log se arman con el formato exacto que produce el motor:
//   'ataque'  { actor, ronda, tipo, detalle: { atacante, defensor,
//              arquetipoAtacante, arquetipoDefensor, resultado } }
//   'herida'  { tipo, unidadId }
//   'eliminacion' { tipo, unidadId, ronda, detalle: { arquetipo, jugador } }
//   'concentracion' { tipo, unidadId, actor }
//   'tecnica' { tipo, unidadId, actor }
//   'accion'  { tipo, unidadId, actor, tecnica }

function ataque({ actor, ronda, atacante, defensor, arqAtacante, arqDefensor, resultado }) {
  return {
    tipo: 'ataque',
    ronda,
    actor,
    detalle: {
      atacante,
      defensor,
      arquetipoAtacante: arqAtacante,
      arquetipoDefensor: arqDefensor,
      resultado,
    },
  }
}

function estadoConLog(log, sobrevivientes, ronda = 5) {
  return armarEstado({ ronda, unidades: sobrevivientes, log })
}

describe('US-106 — Métricas profundas por arquetipo', () => {
  it('Calcular métricas por arquetipo desde el log — objeto arquetipos por cada arquetipo presente', () => {
    const log = [
      ataque({ actor: 'A', ronda: 1, atacante: 'Rey-1', defensor: 'Alfil-4', arqAtacante: 'Rey', arqDefensor: 'Alfil', resultado: 'gana ataque' }),
    ]
    const m = metricasDePartida(estadoConLog(log, [unidad('Rey-1', 'A', 'Rey', { q: 0, r: 0 })]))
    expect(m.arquetipos).toBeDefined()
    expect(Object.keys(m.arquetipos)).toEqual(expect.arrayContaining(['Rey', 'Alfil']))
  })

  it('Daño realizado y recibido por arquetipo', () => {
    const log = [
      ataque({ actor: 'A', ronda: 1, atacante: 'Rey-1', defensor: 'Alfil-4', arqAtacante: 'Rey', arqDefensor: 'Alfil', resultado: 'gana ataque' }),
      ataque({ actor: 'B', ronda: 2, atacante: 'Alfil-4', defensor: 'Torre-2', arqAtacante: 'Alfil', arqDefensor: 'Torre', resultado: 'gana defensa' }),
    ]
    const m = metricasDePartida(estadoConLog(log, [
      unidad('Rey-1', 'A', 'Rey', { q: 0, r: 0 }),
      unidad('Torre-2', 'A', 'Torre', { q: 1, r: 0 }),
      unidad('Alfil-4', 'B', 'Alfil', { q: 0, r: 1 }),
    ]))
    const rey = m.arquetipos['Rey']
    const alfil = m.arquetipos['Alfil']
    const torre = m.arquetipos['Torre']

    expect(rey.vecesAtacando).toBe(1)
    expect(rey.dañoRealizado).toBe(1)
    expect(rey.vecesDefendiendo).toBe(0)
    expect(rey.dañoRecibido).toBe(0)

    expect(alfil.vecesAtacando).toBe(1)
    expect(alfil.dañoRealizado).toBe(0)
    expect(alfil.vecesDefendiendo).toBe(1)
    expect(alfil.dañoRecibido).toBe(1)

    expect(torre.vecesDefendiendo).toBe(1)
    expect(torre.dañoRecibido).toBe(0)
  })

  it('Baja por arquetipo — vecesDerrotado desde las eliminaciones', () => {
    const log = [
      { tipo: 'eliminacion', unidadId: 'Peon-3', ronda: 3, detalle: { arquetipo: 'Peon', jugador: 'A' } },
      { tipo: 'eliminacion', unidadId: 'Peon-6', ronda: 4, detalle: { arquetipo: 'Peon', jugador: 'B' } },
    ]
    const m = metricasDePartida(estadoConLog(log, [
      unidad('Rey-1', 'A', 'Rey', { q: 0, r: 0 }),
      unidad('Rey-5', 'B', 'Rey', { q: 0, r: 1 }),
    ]))
    expect(m.arquetipos['Peon'].vecesDerrotado).toBe(2)
    expect(m.arquetipos['Rey'].vecesDerrotado).toBe(0)
  })

  it('Supervivencia y recursos por arquetipo', () => {
    const log = [
      { tipo: 'eliminacion', unidadId: 'Peon-3', ronda: 3, detalle: { arquetipo: 'Peon', jugador: 'A' } },
      { tipo: 'concentracion', unidadId: 'Rey-1', actor: 'A' },
      { tipo: 'tecnica', unidadId: 'Campeon-5', actor: 'B' },
      { tipo: 'accion', unidadId: 'Torre-2', actor: 'A', tecnica: 'AtaquePesado' },
    ]
    const m = metricasDePartida(estadoConLog(log, [
      unidad('Rey-1', 'A', 'Rey', { q: 0, r: 0 }),
      unidad('Torre-2', 'A', 'Torre', { q: 1, r: 0 }),
      unidad('Campeon-5', 'B', 'Campeon', { q: 0, r: 1 }),
    ]))
    expect(m.arquetipos['Rey'].rondasSobrevividas).toBe(4)
    expect(m.arquetipos['Rey'].focoUtilizado).toBe(1)
    expect(m.arquetipos['Peon'].rondasSobrevividas).toBe(2)
    expect(m.arquetipos['Campeon'].tecnicasUtilizadas).toBe(1)
    expect(m.arquetipos['Torre'].tecnicasUtilizadas).toBe(1)
  })

  it('No modificar el motor — el estado queda intacto', () => {
    const log = [
      ataque({ actor: 'A', ronda: 1, atacante: 'Rey-1', defensor: 'Alfil-4', arqAtacante: 'Rey', arqDefensor: 'Alfil', resultado: 'gana ataque' }),
      { tipo: 'eliminacion', unidadId: 'Alfil-4', ronda: 1, detalle: { arquetipo: 'Alfil', jugador: 'B' } },
      { tipo: 'concentracion', unidadId: 'Rey-1', actor: 'A' },
    ]
    const estado = estadoConLog(log, [unidad('Rey-1', 'A', 'Rey', { q: 0, r: 0 })])
    const antes = JSON.parse(JSON.stringify(estado))
    metricasDePartida(estado)
    expect(JSON.parse(JSON.stringify(estado))).toEqual(antes)
  })

  it('Comparación entre facciones — porFaccion permite comparar el mismo arquetipo', () => {
    const log = [
      ataque({ actor: 'A', ronda: 1, atacante: 'Peon-3', defensor: 'Peon-6', arqAtacante: 'Peon', arqDefensor: 'Peon', resultado: 'gana ataque' }),
      ataque({ actor: 'B', ronda: 2, atacante: 'Peon-6', defensor: 'Rey-1', arqAtacante: 'Peon', arqDefensor: 'Rey', resultado: 'gana ataque' }),
      { tipo: 'eliminacion', unidadId: 'Peon-3', ronda: 4, detalle: { arquetipo: 'Peon', jugador: 'A' } },
    ]
    const m = metricasDePartida(estadoConLog(log, [
      unidad('Rey-1', 'A', 'Rey', { q: 0, r: 0 }, { heridas: 1 }),
    ]))
    const peon = m.arquetipos['Peon']
    expect(peon.porFaccion.A.dañoRealizado).toBe(1)
    expect(peon.porFaccion.B.dañoRealizado).toBe(1)
    expect(peon.porFaccion.A.vecesDerrotado).toBe(1)
    expect(peon.porFaccion.B.dañoRecibido).toBe(1)
  })
})
