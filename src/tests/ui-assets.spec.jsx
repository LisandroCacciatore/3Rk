import { render } from '@testing-library/react'
import { assetUnidad } from '../ui/assets.js'
import { assetTerreno } from '../ui/terrenoImagen.js'
import UnitToken from '../ui/UnitToken.jsx'
import HexTile from '../ui/HexTile.jsx'

const unidadBase = (overrides = {}) => ({
  id: 'U-1',
  jugador: 'A',
  arquetipo: 'Peon',
  pos: { q: 0, r: 0 },
  heridas: 0,
  maxVida: 2,
  foco: [],
  estados: [],
  efectos: [],
  activacionCerrada: false,
  accionesEsteTurno: 0,
  ...overrides,
})

describe('assets: registro de sprites', () => {
  it('devuelve la ruta correcta por facción/arquetipo (mapeo motor: Fuego=A, Agua=B)', () => {
    expect(assetUnidad('Fuego', 'Peon')).toBe('/assets/units/fuego_peon.png')
    expect(assetUnidad('Fuego', 'Rey')).toBe('/assets/units/fuego_rey.png')
    expect(assetUnidad('Agua', 'Alfil')).toBe('/assets/units/agua_alfil.png')
    expect(assetUnidad('Agua', 'Campeon')).toBe('/assets/units/agua_campeon.png')
    expect(assetUnidad('Tierra', 'Peon')).toBe('/assets/units/tierra_peon.png')
    expect(assetUnidad('Tierra', 'Caballo')).toBe('/assets/units/tierra_caballo.png')
    expect(assetUnidad('Aire', 'Peon')).toBe('/assets/units/aire_peon.png')
    expect(assetUnidad('Aire', 'Rey')).toBe('/assets/units/aire_rey.png')
  })

  it('devuelve null para claves no registradas (fallback a glifo)', () => {
    expect(assetUnidad('Vacio', 'Peon')).toBeNull()
    expect(assetUnidad('Fuego', 'Golem')).toBeNull()
    expect(assetUnidad('Desconocido', 'Peon')).toBeNull()
  })
})

describe('UnitToken: sprite o fallback', () => {
  it('dibuja <image> cuando el sprite está registrado', () => {
    const { container } = render(
      <svg><UnitToken unidad={unidadBase({ jugador: 'A', arquetipo: 'Peon' })} faccion="Fuego" /></svg>
    )
    expect(container.querySelector('.unit-token')).not.toBeNull()
    expect(container.querySelector('.unit-token image')).not.toBeNull()
  })

  it('usa el sprite de la facción recibida (Tierra/Aire, no el fallback Fuego/Agua)', () => {
    const { container: c1 } = render(
      <svg><UnitToken unidad={unidadBase({ jugador: 'A', arquetipo: 'Peon' })} faccion="Tierra" /></svg>
    )
    expect(c1.querySelector('.unit-token image').getAttribute('href')).toBe('/assets/units/tierra_peon.png')
    const { container: c2 } = render(
      <svg><UnitToken unidad={unidadBase({ jugador: 'B', arquetipo: 'Rey' })} faccion="Aire" /></svg>
    )
    expect(c2.querySelector('.unit-token image').getAttribute('href')).toBe('/assets/units/aire_rey.png')
  })

  it('cae al glifo SVG (sin <image>) cuando el arquetipo no tiene asset', () => {
    const { container } = render(
      <svg><UnitToken unidad={unidadBase({ arquetipo: 'Golem' })} faccion="Fuego" /></svg>
    )
    expect(container.querySelector('.unit-token')).not.toBeNull()
    expect(container.querySelector('.unit-token image')).toBeNull()
  })

  it('mantiene el anillo de facción y la clase .unit-token', () => {
    const { container } = render(
      <svg><UnitToken unidad={unidadBase()} faccion="Fuego" seleccionado /></svg>
    )
    const token = container.querySelector('.unit-token')
    expect(token).not.toBeNull()
    expect(token.classList.contains('seleccionado')).toBe(true)
    expect(container.querySelector('.token-ring')).not.toBeNull()
  })
})

describe('assetTerreno: registro de tiles', () => {
  it('devuelve la ruta correcta por tipo de terreno', () => {
    expect(assetTerreno('prado')).toBe('/assets/tierras/prado.png')
    expect(assetTerreno('bosque')).toBe('/assets/tierras/bosque.png')
    expect(assetTerreno('camino')).toBe('/assets/tierras/camino.png')
    expect(assetTerreno('puente')).toBe('/assets/tierras/puente.png')
    expect(assetTerreno('empalizada')).toBe('/assets/tierras/empalizada.png')
  })

  it('devuelve null para tipos sin asset (o eliminados) — fallback al tono plano', () => {
    expect(assetTerreno('lugar')).toBeNull()
    expect(assetTerreno('corona')).toBeNull()
    expect(assetTerreno('Desconocido')).toBeNull()
  })
})

describe('HexTile: arte por tile o respaldo', () => {
  const hex = (overrides = {}) => ({ q: 0, r: 0, terreno: 'prado', ...overrides })

  it('en modo inmersivo dibuja <image> recortado cuando el tipo tiene asset', () => {
    const { container } = render(
      <svg><HexTile q={0} r={0} terreno="prado" /></svg>
    )
    expect(container.querySelector('.hex-tile-arte image')).not.toBeNull()
  })

  it('conserva exactamente UN <polygon> por hex aunque haya arte', () => {
    const { container } = render(
      <svg><HexTile q={0} r={0} terreno="bosque" /></svg>
    )
    expect(container.querySelectorAll('.hex-tile polygon').length).toBe(1)
  })

  it('no monta <image> en modo esquemático (siguen las letras de terreno)', () => {
    const { container } = render(
      <svg><HexTile {...hex()} esquematico /></svg>
    )
    expect(container.querySelector('.hex-tile-arte image')).toBeNull()
  })

  it('no monta <image> cuando el tipo no tiene asset (p.ej. lugar)', () => {
    const { container } = render(
      <svg><HexTile {...hex({ terreno: 'lugar' })} /></svg>
    )
    expect(container.querySelector('.hex-tile-arte image')).toBeNull()
  })
})
