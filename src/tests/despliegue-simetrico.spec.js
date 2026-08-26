import { describe, it, expect } from 'vitest'
import { crearEstadoInicial } from '../engine/state.js'
import { obtenerEscenario } from '../data/scenarios.js'
import { distancia } from '../engine/hex.js'

function reyes(estado) {
  return {
    A: estado.unidades.find(u => u.jugador === 'A' && u.arquetipo === 'Rey'),
    B: estado.unidades.find(u => u.jugador === 'B' && u.arquetipo === 'Rey'),
  }
}

describe('US-171 — Despliegue simétrico estilo ajedrez: 6 unidades por bando', () => {
  it('Ambos bandos despliegan 6 unidades cada uno (12 en mesa)', () => {
    for (const escenario of ['base', 'rio-tajii', 'valle-vados', 'ruinas-bastion']) {
      const estado = crearEstadoInicial('despliegue-test', escenario)
      const a = estado.unidades.filter(u => u.jugador === 'A').length
      const b = estado.unidades.filter(u => u.jugador === 'B').length
      expect(a).toBe(6)
      expect(b).toBe(6)
      expect(estado.unidades).toHaveLength(12)
    }
  })

  it('Cada bando usa la plantilla completa de 6 arquetipos, una vez cada uno', () => {
    const estado = crearEstadoInicial('despliegue-test', 'base')
    const plantillaEsperada = ['Rey', 'Campeon', 'Alfil', 'Torre', 'Caballo', 'Peon']
    for (const bando of ['A', 'B']) {
      const rosters = estado.unidades
        .filter(u => u.jugador === bando)
        .map(u => u.arquetipo)
      expect([...rosters].sort()).toEqual([...plantillaEsperada].sort())
      expect(new Set(rosters).size).toBe(6)
    }
  })

  it('Las posiciones de despliegue están libres y no se pisan', () => {
    const estado = crearEstadoInicial('despliegue-test', 'base')
    const bloqueados = new Set(estado.tablero.bloqueados)
    const posiciones = estado.unidades.map(u => `${u.pos.q},${u.pos.r}`)
    for (const u of estado.unidades) {
      expect(bloqueados.has(`${u.pos.q},${u.pos.r}`)).toBe(false)
    }
    expect(new Set(posiciones).size).toBe(12)
  })

  it('El despliegue simétrico aplica a Río Tajii y a las plantillas de mapa', () => {
    for (const escenario of ['rio-tajii', 'valle-vados', 'garganta-dragon', 'encrucijada', 'ruinas-bastion', 'humedales']) {
      const estado = crearEstadoInicial('despliegue-test', escenario)
      expect(estado.unidades).toHaveLength(12)
    }
  })

  it('Los Reyes no quedan adyacentes entre sí en el arranque', () => {
    const estado = crearEstadoInicial('despliegue-test', 'base')
    const r = reyes(estado)
    expect(distancia(r.A.pos, r.B.pos)).toBeGreaterThan(1)
  })
})