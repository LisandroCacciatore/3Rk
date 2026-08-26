import { render, screen, fireEvent } from '@testing-library/react'
import App from '../ui/App.jsx'

const comenzar = () => {
  const view = render(<App />)
  fireEvent.click(screen.getByRole('button', { name: /Comenzar escaramuza/i }))
  return view
}

describe('UI: mano de cartas en abanico (inferior-centro)', () => {
  it('muestra las cartas del jugador activo como abanico de cartas', () => {
    const { container } = comenzar()
    const cartas = container.querySelectorAll('.mano-abanico .carta-fan')
    expect(cartas.length).toBe(5)
  })

  it('el hover muestra un preview puro (coste y descripción) sin botones y cierra al salir', () => {
    const { container } = comenzar()
    const cartas = container.querySelectorAll('.mano-abanico .carta-fan')
    expect(cartas.length).toBeGreaterThan(0)

    fireEvent.mouseEnter(cartas[0])
    expect(cartas[0].className).toContain('elevada')

    const preview = container.querySelector('.carta-abanico-preview')
    expect(preview).not.toBeNull()
    expect(preview.textContent).toMatch(/PO \(Orden\)/)
    // Preview puro: sin botones ni menú de acción.
    expect(preview.querySelector('button')).toBeNull()
    expect(container.querySelector('.carta-action-menu')).toBeNull()

    fireEvent.mouseLeave(cartas[0])
    expect(container.querySelector('.carta-abanico-preview')).toBeNull()
  })

  it('al hacer click, la carta queda seleccionada y se abre el menú de acción', () => {
    const { container } = comenzar()
    const cartas = container.querySelectorAll('.mano-abanico .carta-fan')
    fireEvent.click(cartas[0])

    expect(cartas[0].className).toContain('seleccionada')
    expect(container.querySelector('.carta-action-menu')).not.toBeNull()
    expect(screen.getByRole('button', { name: /Jugar como Orden/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Jugar como Habilidad/ })).toBeInTheDocument()
  })

  it('el menú se cierra al tocar el backdrop y con Escape', () => {
    const { container } = comenzar()
    const cartas = container.querySelectorAll('.mano-abanico .carta-fan')

    fireEvent.click(cartas[0])
    expect(container.querySelector('.carta-action-menu')).not.toBeNull()

    fireEvent.click(container.querySelector('.carta-menu-backdrop'))
    expect(container.querySelector('.carta-action-menu')).toBeNull()

    fireEvent.click(cartas[0])
    expect(container.querySelector('.carta-action-menu')).not.toBeNull()

    fireEvent.keyDown(window, { key: 'Escape' })
    expect(container.querySelector('.carta-action-menu')).toBeNull()
  })

  it('con D-27 apagado, el botón de Habilidad se deshabilita con el motivo', () => {
    const { container } = comenzar()
    fireEvent.click(screen.getByRole('button', { name: /Ajustes de playtest/i }))
    fireEvent.click(screen.getByRole('button', { name: /Reglas/i }))
    fireEvent.click(screen.getByRole('checkbox', { name: /Cartas jugables como Habilidad elemental/i }))
    fireEvent.keyDown(window, { key: 'Escape' })
    fireEvent.keyDown(window, { key: 'Escape' })

    const cartas = container.querySelectorAll('.mano-abanico .carta-fan')
    fireEvent.click(cartas[0])

    const botonHabilidad = screen.getByRole('button', { name: /Jugar como Habilidad/ })
    expect(botonHabilidad.disabled).toBe(true)
    expect(container.querySelector('.carta-menu-motivo').textContent).toMatch(/D-27/)
  })

  it('al jugar la carta obligatoria, el abanico queda deshabilitado y sin menú ni preview', () => {
    const { container } = comenzar()
    const cartas = container.querySelectorAll('.mano-abanico .carta-fan')
    fireEvent.click(cartas[0])
    fireEvent.click(screen.getByRole('button', { name: /Jugar como Orden/ }))

    const restantes = [...container.querySelectorAll('.mano-abanico .carta-fan')]
    expect(restantes.length).toBe(4)
    expect(restantes.every(b => b.disabled)).toBe(true)
    expect(container.querySelector('.carta-abanico-preview')).toBeNull()
    expect(container.querySelector('.carta-action-menu')).toBeNull()
  })
})
