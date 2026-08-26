import { describe, it, expect } from 'vitest'
import { ARQUETIPOS, obtenerArquetipo, listarArquetipos } from '../data/archetypes.js'

describe('US-001 — Catálogo de arquetipos', () => {
  describe('Escenario: Existen los seis arquetipos con perfil completo', () => {
    it('Contiene exactamente: Peón, Alfil, Torre, Caballo, Campeón y Rey', () => {
      const nombres = listarArquetipos()
      expect(nombres).toHaveLength(6)
      expect(nombres).toContain('Peon')
      expect(nombres).toContain('Alfil')
      expect(nombres).toContain('Torre')
      expect(nombres).toContain('Caballo')
      expect(nombres).toContain('Campeon')
      expect(nombres).toContain('Rey')
    })

    it('Cada uno declara Movimiento, Ataque, Defensa, Vida, Rango, Foco y Técnicas', () => {
      for (const nombre of listarArquetipos()) {
        const a = ARQUETIPOS[nombre]
        expect(a).toHaveProperty('movimiento')
        expect(a).toHaveProperty('ataque')
        expect(a).toHaveProperty('defensa')
        expect(a).toHaveProperty('vida')
        expect(a).toHaveProperty('rango')
        expect(a).toHaveProperty('foco')
        expect(a).toHaveProperty('tecnicas')
      }
    })
  })

  describe('Escenario: Valores de arranque de cada arquetipo', () => {
    it.each([
      ['Peon',   3, 1, 1, 2, 1, 1],
      ['Alfil',  4, 2, 1, 2, 2, 2],
      ['Torre',  2, 2, 2, 4, 1, 1],
      ['Caballo',5, 2, 1, 3, 3, 1],
      ['Campeon',4, 2, 2, 4, 2, 3],
      ['Rey',    3, 1, 2, 4, 1, 2],
    ])('%s: Mov=%i, Atq=%i, Def=%i, Vida=%i, Rango=%i, Foco=%i',
      (nombre, mov, ataque, defensa, vida, rango, foco) => {
        const a = ARQUETIPOS[nombre]
        expect(a.movimiento).toBe(mov)
        expect(a.ataque.dados).toBe(ataque)
        expect(a.defensa.dados).toBe(defensa)
        expect(a.vida).toBe(vida)
        expect(a.rango).toBe(rango)
        expect(a.foco).toBe(foco)
      }
    )
  })

  describe('Escenario: El Keep 2 está restringido', () => {
    it('Solo el Campeón guarda 2 en Ataque', () => {
      for (const nombre of listarArquetipos()) {
        const a = ARQUETIPOS[nombre]
        if (nombre === 'Campeon') {
          expect(a.ataque.kept).toBe(2)
        } else {
          expect(a.ataque.kept).toBeLessThanOrEqual(1)
        }
      }
    })

    it('Solo el Rey guarda 2 en Defensa', () => {
      for (const nombre of listarArquetipos()) {
        const a = ARQUETIPOS[nombre]
        if (nombre === 'Rey') {
          expect(a.defensa.kept).toBe(2)
        } else {
          expect(a.defensa.kept).toBeLessThanOrEqual(1)
        }
      }
    })
  })
})
