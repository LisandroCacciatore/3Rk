import { TIPO_DE_CARTA, HABILIDADES_POR_CARTA } from './cards.js'

export const ELEMENTOS = ['Fuego', 'Agua', 'Aire', 'Tierra', 'Vacio']
export const VALORES = [1, 2, 3]

export const FACCIONES = {
  Fuego: {
    nombre: 'Fuego',
    color: '#e94560',
    habilidadesActivas: ['Fuego1', 'Fuego3', 'Vacio3', 'Aire1'],
    mazo: generarMazoFaccion(['Fuego1', 'Fuego3', 'Vacio3', 'Aire1']),
  },
  Agua: {
    nombre: 'Agua',
    color: '#3498db',
    habilidadesActivas: ['Agua1', 'Agua3', 'Vacio2', 'Tierra1'],
    mazo: generarMazoFaccion(['Agua1', 'Agua3', 'Vacio2', 'Tierra1']),
  },
  Tierra: {
    nombre: 'Tierra',
    color: '#27ae60',
    habilidadesActivas: ['Tierra2', 'Tierra3', 'Vacio1', 'Fuego2'],
    mazo: generarMazoFaccion(['Tierra2', 'Tierra3', 'Vacio1', 'Fuego2']),
  },
  Aire: {
    nombre: 'Aire',
    color: '#f39c12',
    habilidadesActivas: ['Aire2', 'Aire3', 'Vacio1', 'Agua2'],
    mazo: generarMazoFaccion(['Aire2', 'Aire3', 'Vacio1', 'Agua2']),
  },
}

// US-170: cada facción tiene 4 habilidades activas iniciales en su mazo base.
function generarMazoFaccion(habilidadesActivas) {
  const mazo = []
  for (const elemento of ELEMENTOS) {
    for (const valor of VALORES) {
      const id = `${elemento}${valor}`
      const tieneHabilidad = habilidadesActivas.includes(id)
      mazo.push({
        elemento,
        valor,
        tipo: TIPO_DE_CARTA[id],
        habilidad: tieneHabilidad ? (HABILIDADES_POR_CARTA[id] || null) : null,
      })
    }
  }
  return mazo
}

export function contarCartas(jugador) {
  return (jugador.mazo?.length || 0) +
    (jugador.mano?.length || 0) +
    (jugador.descarte?.length || 0)
}