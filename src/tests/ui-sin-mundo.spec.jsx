import { render, screen, fireEvent } from '@testing-library/react'
import App from '../ui/App.jsx'

// Presentación (12/08/2026): el "mundo" (isla + océano) que rodeaba al tablero
// jugable queda oculto. El mapa se dibuja sobre un piso plano (fondo-tablero) y
// no existen las capas capa-mundo / capa-frente. El motor no cambia: los 150
// hexes jugables y la partida siguen iguales.
describe('UI: mundo oculto en la partida', () => {
  const empezar = () => {
    const result = render(<App />)
    fireEvent.click(screen.getByRole('button', { name: /Comenzar escaramuza/i }))
    return result
  }

  it('dibuja un único piso plano de fondo', () => {
    const { container } = empezar()
    expect(container.querySelectorAll('svg .fondo-tablero').length).toBe(1)
  })

  it('no dibuja el mundo (isla/océano) alrededor del mapa', () => {
    const { container } = empezar()
    expect(container.querySelectorAll('svg .capa-mundo').length).toBe(0)
    expect(container.querySelectorAll('svg .capa-frente').length).toBe(0)
  })

  it('mantiene los 150 hexes jugables del escenario base', () => {
    const { container } = empezar()
    expect(container.querySelectorAll('svg .hex-tile polygon').length).toBe(150)
  })
})