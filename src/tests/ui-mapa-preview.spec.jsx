import { render, screen, fireEvent } from '@testing-library/react'
import App from '../ui/App.jsx'

// Preview esquemática del mapa en la portada: SVG plano (color + letra de
// terreno, ✕ en bloqueados) del escenario seleccionado. PURA presentación; los
// polígonos usan la clase `mapa-preview`, nunca `.hex-tile`, para no pisar el
// invariante de test del tablero de la partida (150 polygon en pantalla de juego).
describe('UI: portada con preview del mapa', () => {
  it('muestra el esquemático del escenario base (150 hexes) con letras y bloqueados ✕', () => {
    const { container } = render(<App />)
    const svg = container.querySelector('svg.mapa-preview')
    expect(svg).not.toBeNull()
    expect(svg.querySelectorAll('polygon').length).toBe(150)
    expect(svg.querySelectorAll('.mapa-preview-letra').length).toBeGreaterThan(0)
    expect(svg.querySelectorAll('.mapa-preview-letra.bloqueado').length).toBeGreaterThan(0)
  })

  it('cambia el esquemático con el selector de mapa: 150 hexes y Río Tajii 117', () => {
    const { container } = render(<App />)
    const selector = screen.getByRole('combobox', { name: /Mapa/i })

    fireEvent.change(selector, { target: { value: 'valle-vados' } })
    expect(container.querySelector('svg.mapa-preview').querySelectorAll('polygon').length).toBe(150)

    fireEvent.change(selector, { target: { value: 'rio-tajii' } })
    expect(container.querySelector('svg.mapa-preview').querySelectorAll('polygon').length).toBe(117)
  })

  it('no pisa el invariante .hex-tile en la portada', () => {
    const { container } = render(<App />)
    expect(container.querySelectorAll('svg .hex-tile polygon').length).toBe(0)
  })
})