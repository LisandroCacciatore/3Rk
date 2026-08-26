import { render, screen, fireEvent } from '@testing-library/react'
import App from '../ui/App.jsx'

const comenzar = () => {
  const view = render(<App />)
  fireEvent.click(screen.getByRole('button', { name: /Comenzar escaramuza/i }))
  return view
}

describe('UI: ficha de unidad flotante (inferior-izquierda)', () => {
  it('al seleccionar una unidad propia la ficha flotante muestra stats', () => {
    const { container } = comenzar()
    expect(container.querySelector('.plantillas-lateral')).toBeNull()
    expect(container.querySelector('.roster-card')).toBeNull()

    const propias = container.querySelectorAll('.unit-token.activo')
    expect(propias.length).toBeGreaterThan(0)
    fireEvent.click(propias[0])

    const ficha = container.querySelector('.unit-card-flotante')
    expect(ficha).not.toBeNull()
    expect(ficha.textContent).toMatch(/Movimiento/)
    expect(ficha.textContent).toMatch(/Ataque/)
    expect(ficha.textContent).toMatch(/Defensa/)
    expect(ficha.textContent).toMatch(/Clase/)
    expect(ficha.textContent).toMatch(/Vida \d+\/\d+/)
    expect(container.querySelector('.fich-retrato-glifo, .fich-retrato-svg')).not.toBeNull()
    // El pool del motor llega como "XgY" (dados g keep) — bug 2g arreglado.
    const valorDe = (etiqueta) => [...ficha.querySelectorAll('.fich-atrib')]
      .find(a => a.textContent.includes(etiqueta))
      ?.querySelector('.fich-atrib-valor')
      ?.textContent
    expect(valorDe('Ataque')).toMatch(/^\d+g\d+/)
    expect(valorDe('Defensa')).toMatch(/^\d+g\d+/)
  })

  it('el hover sobre una unidad propia abre la ficha sin necesidad de clic', () => {
    const { container } = comenzar()
    expect(container.querySelector('.unit-card-flotante')).toBeNull()

    const propias = container.querySelectorAll('.unit-token.activo')
    fireEvent.mouseEnter(propias[0])
    expect(container.querySelector('.unit-card-flotante')).not.toBeNull()
  })

  it('el hover sobre una unidad rival no abre su ficha', () => {
    const { container } = comenzar()
    const rivales = container.querySelectorAll('.unit-token:not(.activo)')
    expect(rivales.length).toBeGreaterThan(0)

    fireEvent.mouseEnter(rivales[0])
    expect(container.querySelector('.unit-card-flotante')).toBeNull()
  })

  it('la ficha se cierra con el botón ✕', () => {
    const { container } = comenzar()
    const propias = container.querySelectorAll('.unit-token.activo')
    fireEvent.click(propias[0])
    expect(container.querySelector('.unit-card-flotante')).not.toBeNull()

    fireEvent.click(screen.getByRole('button', { name: /Cerrar ficha/i }))
    expect(container.querySelector('.unit-card-flotante')).toBeNull()
  })
})