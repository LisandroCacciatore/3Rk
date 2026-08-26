import { describe, it, expect } from 'vitest'
import { ARQUETIPOS, listarArquetipos } from '../data/archetypes.js'
import { TIPO_DE_CARTA, HABILIDADES_POR_CARTA, TIPOS } from '../data/cards.js'
import { ELEMENTOS, VALORES, FACCIONES } from '../data/factions.js'
import {
  MATRIZ_VALLE_VADOS,
  MATRIZ_GARGANTA_DRAGON,
  MATRIZ_TRES_CARRILES,
  MATRIZ_RUINAS_BASTION,
  MATRIZ_HUMEDALES,
  MATRIZ_RIO_TAJII,
} from '../data/scenarios.js'
import { crearEstadoInicial } from '../engine/state.js'

// Contador de símbolos de una matriz (fuente del kit de tiles del inventario).
function contadores(matriz) {
  const c = {}
  for (const fila of matriz) {
    for (const s of fila) c[s] = (c[s] || 0) + 1
  }
  return c
}

describe('Inventario de producción — Unidades (roster de combate)', () => {
  it('despliega 6 fijas por bando (12 en mesa)', () => {
    const e = crearEstadoInicial('inventario-test', 'base')
    expect(e.unidades).toHaveLength(12)
    expect(e.unidades.slice(0, 6).map(u => u.arquetipo))
      .toEqual(['Rey', 'Campeon', 'Alfil', 'Torre', 'Caballo', 'Peon'])
    expect(e.unidades.slice(6).map(u => u.arquetipo))
      .toEqual(['Rey', 'Campeon', 'Alfil', 'Torre', 'Caballo', 'Peon'])
  })

  it('la ficha oficial de arquetipos coincide (rangos corregidos A-11-N2)', () => {
    const esperados = {
      Peon: { movimiento: 3, ataque: { dados: 1, kept: 1 }, defensa: { dados: 1, kept: 1 }, vida: 2, rango: 1, foco: 1 },
      Alfil: { movimiento: 4, ataque: { dados: 2, kept: 1 }, defensa: { dados: 1, kept: 1 }, vida: 2, rango: 2, foco: 2 },
      Torre: { movimiento: 2, ataque: { dados: 2, kept: 1 }, defensa: { dados: 2, kept: 1 }, vida: 4, rango: 1, foco: 1 },
      Caballo: { movimiento: 5, ataque: { dados: 2, kept: 1 }, defensa: { dados: 1, kept: 1 }, vida: 3, rango: 3, foco: 1 },
      Campeon: { movimiento: 4, ataque: { dados: 2, kept: 2 }, defensa: { dados: 2, kept: 1 }, vida: 4, rango: 2, foco: 3 },
      Rey: { movimiento: 3, ataque: { dados: 1, kept: 1 }, defensa: { dados: 2, kept: 2 }, vida: 4, rango: 1, foco: 2 },
    }
    expect(listarArquetipos()).toHaveLength(6)
    for (const [arq, perfil] of Object.entries(esperados)) {
      expect(ARQUETIPOS[arq]).toMatchObject(perfil)
    }
  })

  it('guarda FR-062: Keep 2 solo Campeón (ataque) y Rey (defensa)', () => {
    const ataque2 = listarArquetipos().filter(a => ARQUETIPOS[a].ataque.kept >= 2)
    const defensa2 = listarArquetipos().filter(a => ARQUETIPOS[a].defensa.kept >= 2)
    expect(ataque2).toEqual(['Campeon'])
    expect(defensa2).toEqual(['Rey'])
  })
})

describe('Inventario de producción — Cartas y mazos', () => {
  it('el mazo base son 15 cartas: 1 por elemento×valor, 7 Hechizo / 8 Arma', () => {
    const mazo = FACCIONES.Fuego.mazo
    expect(mazo).toHaveLength(15)
    expect(ELEMENTOS).toHaveLength(5)
    expect(VALORES).toEqual([1, 2, 3])
    for (const carta of mazo) {
      expect(carta.elemento).toBeTruthy()
      expect(carta.valor).toBeTruthy()
      expect(carta.tipo).toBeTruthy()
    }
    expect(mazo.filter(c => c.habilidad)).toHaveLength(4)
    const tipos = Object.values(TIPO_DE_CARTA)
    expect(tipos.filter(t => t === TIPOS.Hechizo)).toHaveLength(7)
    expect(tipos.filter(t => t === TIPOS.Arma)).toHaveLength(8)
  })

  it('los 15 nombres de carta coinciden con el catálogo oficial', () => {
    const esperados = {
      Fuego1: 'Chispa', Fuego2: 'Látigo', Fuego3: 'Bomba',
      Agua1: 'Escarcha', Agua2: 'Ola', Agua3: 'Escudo',
      Aire1: 'Vendaval', Aire2: 'Brisa', Aire3: 'Corriente',
      Tierra1: 'Raíz', Tierra2: 'Terremoto', Tierra3: 'Avalancha',
      Vacio1: 'Drenar', Vacio2: 'Purga', Vacio3: 'Ruptura',
    }
    expect(Object.keys(HABILIDADES_POR_CARTA)).toHaveLength(15)
    for (const [k, nombre] of Object.entries(esperados)) {
      expect(HABILIDADES_POR_CARTA[k]?.nombre).toBe(nombre)
    }
  })
})

describe('Inventario de producción — Tablero y terrenos', () => {
  it('los 5 escenarios son 15×10 (150 hexes) y Río Tajii 13×9', () => {
    const estandar = [
      MATRIZ_VALLE_VADOS, MATRIZ_GARGANTA_DRAGON,
      MATRIZ_TRES_CARRILES, MATRIZ_RUINAS_BASTION, MATRIZ_HUMEDALES,
    ]
    for (const m of estandar) {
      expect(m).toHaveLength(10)
      for (const fila of m) expect(fila).toHaveLength(15)
    }
    expect(MATRIZ_RIO_TAJII).toHaveLength(9)
    for (const fila of MATRIZ_RIO_TAJII) expect(fila).toHaveLength(13)
  })

  it('el kit de tiles = máximo por símbolo sobre los 6 escenarios', () => {
    const matrices = [
      MATRIZ_VALLE_VADOS, MATRIZ_GARGANTA_DRAGON, MATRIZ_TRES_CARRILES,
      MATRIZ_RUINAS_BASTION, MATRIZ_HUMEDALES, MATRIZ_RIO_TAJII,
    ]
    const max = {}
    for (const m of matrices) {
      for (const [s, n] of Object.entries(contadores(m))) {
        max[s] = Math.max(max[s] || 0, n)
      }
    }
    delete max['🟩'] // pradera = tapete, no tile
    expect(max).toEqual({ '🌲': 48, '⛰️': 28, '🌊': 31, '🌉': 2, '🌁': 1, '🪵': 2 })
  })

  it('el conteo por escenario coincide con la tabla del inventario', () => {
    const matrices = {
      valle: MATRIZ_VALLE_VADOS,
      garganta: MATRIZ_GARGANTA_DRAGON,
      encrucijada: MATRIZ_TRES_CARRILES,
      ruinas: MATRIZ_RUINAS_BASTION,
      humedales: MATRIZ_HUMEDALES,
      tajii: MATRIZ_RIO_TAJII,
    }
    const esperado = {
      valle: { '🌲': 17, '🌊': 31, '🌉': 2 },
      garganta: { '🌲': 28, '⛰️': 28 },
      encrucijada: { '🌲': 48 },
      ruinas: { '🌲': 12, '⛰️': 16 },
      humedales: { '🌊': 28, '🌲': 17 },
      tajii: { '🌲': 6, '🌊': 4, '🌉': 2, '🪵': 2, '🌁': 1 },
    }
    for (const [k, matriz] of Object.entries(matrices)) {
      const c = contadores(matriz)
      for (const [s, n] of Object.entries(esperado[k])) {
        expect(c[s]).toBe(n)
      }
    }
  })
})