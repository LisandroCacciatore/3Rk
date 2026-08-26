import { render, screen, fireEvent, waitFor } from '@testing-library/react'
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

// El cartel efímero se prueba con el handoff apagado: con mano a mano ON (por
// defecto) el cambio de jugador muestra el handoff opaco en su lugar.
function desactivarHandoff() {
  fireEvent.click(screen.getByRole('button', { name: /Ajustes de playtest/i }))
  fireEvent.click(screen.getByRole('button', { name: /Mano a mano/i }))
  fireEvent.click(screen.getByRole('button', { name: /Cerrar/i }))
}

describe('UI: cartel de cambio de turno', () => {
  afterEach(() => vi.restoreAllMocks())

  it('aparece al pasar el turno y anuncia la facción que empieza', () => {
    const { container } = comenzar()
    desactivarHandoff()
    expect(container.querySelector('.cartel-turno')).toBeNull()

    jugarCartaComoOrden(container)
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    fireEvent.click(screen.getByRole('button', { name: /Fin de turno/i }))

    const cartel = container.querySelector('.cartel-turno')
    expect(cartel).not.toBeNull()
    expect(cartel.textContent).toMatch(/FIN DE TURNO/)
    expect(cartel.textContent).toMatch(/Jugador Fuego/)
    expect(cartel.textContent).toMatch(/Jugador Agua/)
    // El turno realmente cambió de A (Fuego) a B (Agua).
    expect(container.querySelector('.hud-turno-flotante').textContent).toMatch(/Turno de B/)
  })

  it('se cierra al hacer clic sobre el cartel', async () => {
    const { container } = comenzar()
    desactivarHandoff()
    jugarCartaComoOrden(container)
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    fireEvent.click(screen.getByRole('button', { name: /Fin de turno/i }))

    const cartel = container.querySelector('.cartel-turno')
    expect(cartel).not.toBeNull()
    fireEvent.click(cartel)
    await waitFor(() => expect(container.querySelector('.cartel-turno')).toBeNull())
  })
})
