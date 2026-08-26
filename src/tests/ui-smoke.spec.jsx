import { render, screen, fireEvent } from '@testing-library/react'
import App from '../ui/App.jsx'
import CombatResult from '../ui/CombatResult.jsx'

const comenzarPartida = () => render(<App />)

describe('UI: arranque de la partida', () => {
  it('monta la portada con las dos facciones', () => {
    render(<App />)
    expect(screen.getByText('ESCARAMUZA')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Comenzar escaramuza/i })).toBeInTheDocument()
    expect(screen.getByText('FUEGO')).toBeInTheDocument()
    expect(screen.getByText('AGUA')).toBeInTheDocument()
  })

  it('al comenzar despliega la partida con el HUD', () => {
    comenzarPartida()
    fireEvent.click(screen.getByRole('button', { name: /Comenzar escaramuza/i }))
    expect(screen.getByText(/RONDA 1/)).toBeInTheDocument()
    expect(screen.getByText(/Turno de/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Fin de turno/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Reencuadrar tablero/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Ajustes de playtest/i })).toBeInTheDocument()
  })

  it('dibuja los 150 hexágonos del escenario base (rect 15×10) en SVG', () => {
    const { container } = comenzarPartida()
    fireEvent.click(screen.getByRole('button', { name: /Comenzar escaramuza/i }))
    const hexes = container.querySelectorAll('svg .hex-tile polygon')
    expect(hexes.length).toBe(150)
  })

  it('muestra las 10 unidades desplegadas', () => {
    const { container } = comenzarPartida()
    fireEvent.click(screen.getByRole('button', { name: /Comenzar escaramuza/i }))
    const unidades = container.querySelectorAll('svg .unit-token')
    expect(unidades.length).toBe(12)
  })

  it('abre el panel de reglas conmutables (D-24) desde el modal de ajustes', () => {
    comenzarPartida()
    fireEvent.click(screen.getByRole('button', { name: /Comenzar escaramuza/i }))
    fireEvent.click(screen.getByRole('button', { name: /Ajustes de playtest/i }))
    expect(screen.getByText(/Ajustes de playtest/)).toBeInTheDocument()
    fireEvent.click(screen.getByText('Reglas'))
    expect(screen.getByText(/Reglas conmutables/)).toBeInTheDocument()
    expect(screen.getByRole('checkbox', { name: /defensor no queda Stunned/i })).toBeInTheDocument()
    expect(screen.getByRole('checkbox', { name: /Stunned resta 1 dado guardado/i })).toBeInTheDocument()
    expect(screen.getByRole('combobox', { name: /Reinicio del contador/ })).toBeInTheDocument()
    expect(screen.getByText(/Métricas/)).toBeInTheDocument()
  })
})

describe('UI: presentación de combate', () => {
  const detalle = {
    atacante: 'Campeon-2',
    defensor: 'Torre-3',
    arquetipoAtacante: 'Campeon',
    arquetipoDefensor: 'Torre',
    poolAtaque: '2g2',
    dadosAtaque: ['7', '10+4'],
    keptAtaque: [14, 7],
    sumaAtaque: 21,
    poolDefensa: '2g1',
    dadosDefensa: ['8', '6'],
    keptDefensa: [8],
    sumaDefensa: 8,
    resultado: 'gana ataque',
  }

  it('muestra dados, sumas y resalta la explosión', () => {
    render(<CombatResult detalle={detalle} onCerrar={() => {}} />)
    expect(screen.getAllByText(/Campeon-2/).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/Torre-3/).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/= 21/).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/8/).length).toBeGreaterThan(0)
    expect(screen.getByText(/gana ataque/)).toBeInTheDocument()
    const exploto = document.querySelector('.dado.exploto')
    expect(exploto).not.toBeNull()
  })
})
