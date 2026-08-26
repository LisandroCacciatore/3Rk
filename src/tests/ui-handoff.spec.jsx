import { render, screen, fireEvent } from '@testing-library/react'
import { afterEach, describe, it, expect, vi } from 'vitest'
import App from '../ui/App.jsx'

const comenzar = () => {
  const view = render(<App />)
  fireEvent.click(screen.getByRole('button', { name: /Comenzar escaramuza/i }))
  return view
}

function jugarCartaComoOrden(container) {
  const cartas = container.querySelectorAll('.mano-abanico .carta-fan')
  fireEvent.click(cartas[0])
  const filtro = container.querySelector('.carta-action-menu')
  const botonOrden = [...filtro.querySelectorAll('button')]
    .find(b => /Jugar como Orden/i.test(b.textContent))
  fireEvent.click(botonOrden)
}

function pasarTurno() {
  vi.spyOn(window, 'confirm').mockReturnValue(true)
  fireEvent.click(screen.getByRole('button', { name: /Fin de turno/i }))
}

function desactivarHandoff() {
  fireEvent.click(screen.getByRole('button', { name: /Ajustes de playtest/i }))
  fireEvent.click(screen.getByRole('button', { name: /Mano a mano/i }))
  fireEvent.click(screen.getByRole('button', { name: /Cerrar/i }))
}

describe('UI: handoff de pantalla compartida (mano a mano)', () => {
  afterEach(() => vi.restoreAllMocks())

  it('aparece al cambiar de jugador, reemplaza al cartel y anuncia la entrega', () => {
    const { container } = comenzar()
    expect(container.querySelector('.handoff-overlay')).toBeNull()

    jugarCartaComoOrden(container)
    pasarTurno()

    const handoff = container.querySelector('.handoff-overlay')
    expect(handoff).not.toBeNull()
    expect(handoff.textContent).toMatch(/Pasa el dispositivo a/)
    expect(handoff.textContent).toMatch(/Jugador Agua/)
    expect(handoff.textContent).toMatch(/Jugador Fuego/)
    expect(screen.getByRole('button', { name: /Comenzar mi turno/i })).not.toBeNull()
    // Con handoff ON no hay cartel efímero a la vez.
    expect(container.querySelector('.cartel-turno')).toBeNull()
    // El turno ya cambió a B bajo el handoff.
    expect(container.querySelector('.hud-turno-flotante').textContent).toMatch(/Turno de B/)
  })

  it('solo se cierra con "Comenzar mi turno": ni clic fuera ni Escape', () => {
    const { container } = comenzar()
    jugarCartaComoOrden(container)
    pasarTurno()

    fireEvent.click(container.querySelector('.handoff-overlay'))
    expect(container.querySelector('.handoff-overlay')).not.toBeNull()
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(container.querySelector('.handoff-overlay')).not.toBeNull()

    fireEvent.click(screen.getByRole('button', { name: /Comenzar mi turno/i }))
    expect(container.querySelector('.handoff-overlay')).toBeNull()
  })

  it('con el toggle OFF muestra el cartel efímero en su lugar', () => {
    const { container } = comenzar()
    desactivarHandoff()

    jugarCartaComoOrden(container)
    pasarTurno()

    expect(container.querySelector('.handoff-overlay')).toBeNull()
    expect(container.querySelector('.cartel-turno')).not.toBeNull()
  })
})
