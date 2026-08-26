import { render, screen, fireEvent, act } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import App from '../ui/App.jsx'

const comenzar = () => {
  const view = render(<App />)
  fireEvent.click(screen.getByRole('button', { name: /Comenzar escaramuza/i }))
  return view
}

function jugarCartaComoOrden(container, indice) {
  const cartas = container.querySelectorAll('.mano-abanico .carta-fan')
  fireEvent.click(cartas[indice])
  const filtro = container.querySelector('.carta-action-menu')
  const botonOrden = [...filtro.querySelectorAll('button')]
    .find(b => /Jugar como Orden/i.test(b.textContent))
  fireEvent.click(botonOrden)
}

const esperarAutoPase = async () => {
  await act(async () => {
    await new Promise((r) => setTimeout(r, 1000))
  })
}

describe('UI: auto-pase de turno', () => {
  it('pasa el turno cuando el jugador no tiene acciones restantes', async () => {
    const { container } = comenzar()
    expect(container.querySelector('.hud-turno-flotante').textContent).toMatch(/Turno de A/)

    // La 5.ª carta de la mano de A con la semilla por defecto vale 1 PO.
    jugarCartaComoOrden(container, 4)

    // Seleccionar una unidad y usar la activación base gratuita para mover.
    fireEvent.click(container.querySelector('.unit-token'))
    const mover = [...container.querySelectorAll('.unit-ctx-item')]
      .find(i => /Mover/i.test(i.textContent))
    expect(mover).toBeTruthy()
    fireEvent.click(mover)

    const hexMovible = container.querySelector('.hex-tile.estado-alcanzable')
    expect(hexMovible).toBeTruthy()
    fireEvent.click(hexMovible)

    // Con activación base gratuita, el movimiento es gratis. El jugador tiene
    // 1 PO pero la siguiente acción extra cuesta 2 PO y aún quedan unidades
    // con activación base sin usar → auto-pase NO dispara (aún hay acciones).
    await esperarAutoPase()
    expect(container.querySelector('.hud-turno-flotante').textContent).toMatch(/Turno de A/)
  })
})
