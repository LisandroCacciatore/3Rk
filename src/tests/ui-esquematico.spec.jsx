import { render, screen, fireEvent } from '@testing-library/react'
import App from '../ui/App.jsx'

// Preferencia de playtest (no es una regla del motor): al activar el tablero
// esquemático desde Ajustes, el tablero queda plano (color + letra de terreno),
// sin decorado alto (árboles/montañas/columnas) ni texturas, manteniendo los
// hexes jugables, las fichas y los símbolos de estado.
describe('UI: tablero esquemático de playtest', () => {
  const empezarConEsquematico = () => {
    const result = render(<App />)
    fireEvent.click(screen.getByRole('button', { name: /Comenzar escaramuza/i }))
    fireEvent.click(screen.getByRole('button', { name: /Ajustes de playtest/i }))
    fireEvent.click(screen.getByRole('button', { name: /Tablero esquemático/i }))
    return result
  }

  it('muestra las letras de terreno, sin decorado alto, con los 150 hexes y 10 unidades', () => {
    const { container } = empezarConEsquematico()
    expect(container.querySelectorAll('svg .hex-tile polygon').length).toBe(150)
    expect(container.querySelectorAll('svg .unit-token').length).toBe(12)
    expect(container.querySelectorAll('svg .terreno-letra').length).toBeGreaterThan(0)
    expect(container.querySelectorAll('svg .decor-alto').length).toBe(0)
  })

  it('al volver a apagar el interruptor restaura el decorado', () => {
    const { container } = empezarConEsquematico()
    expect(container.querySelectorAll('svg .decor-alto').length).toBe(0)
    fireEvent.click(screen.getByRole('button', { name: /Tablero esquemático/i }))
    expect(container.querySelectorAll('svg .terreno-letra').length).toBe(0)
  })
})