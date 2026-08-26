import { describe, it, expect } from 'vitest'
import { ELEMENTOS, VALORES, FACCIONES } from '../data/factions.js'
import { HABILIDADES_POR_CARTA } from '../data/cards.js'

describe('US-170 — Cada facción tiene 4 habilidades activas en su mazo base', () => {
  it('Cada facción declara exactamente 4 habilidades activas sobre su mazo de 15', () => {
    for (const faccion of Object.values(FACCIONES)) {
      expect(faccion.mazo).toHaveLength(15)
      expect(faccion.habilidadesActivas).toHaveLength(4)
      const activas = faccion.mazo.filter(c => c.habilidad)
      expect(activas).toHaveLength(4)
      for (const carta of activas) {
        expect(Object.keys(HABILIDADES_POR_CARTA)).toContain(`${carta.elemento}${carta.valor}`)
        expect(carta.habilidad.nombre).toBe(HABILIDADES_POR_CARTA[`${carta.elemento}${carta.valor}`].nombre)
      }
    }
  })

  it('Las cuatro facciones se diferencian por sus habilidades activas', () => {
    const combinaciones = Object.values(FACCIONES).map(f =>
      JSON.stringify([
        ...f.habilidadesActivas,
      ].sort())
    )
    expect(new Set(combinaciones).size).toBe(4)
  })

  it('Una carta del mazo nace con habilidad o sin ella según lo declara su facción', () => {
    const fuego = FACCIONES.Fuego
    expect(fuego.habilidadesActivas).toContain('Fuego3')
    const fuego3 = fuego.mazo.find(c => c.elemento === 'Fuego' && c.valor === 3)
    expect(fuego3.habilidad.nombre).toBe('Bomba')
    const sinHabilidad = fuego.mazo.find(c => c.elemento === 'Fuego' && c.valor === 2)
    expect(sinHabilidad.habilidad).toBeNull()
  })

  it('La versión de prueba mantiene mazos simétricos en estructura pero NO en habilidades', () => {
    const fuego = FACCIONES.Fuego.mazo
    const agua = FACCIONES.Agua.mazo
    const er = c => `${c.elemento}${c.valor}`
    expect(fuego.map(er).sort()).toEqual(agua.map(er).sort())
    expect(new Set(FACCIONES.Fuego.habilidadesActivas))
      .not.toEqual(new Set(FACCIONES.Agua.habilidadesActivas))
  })
})