import '@testing-library/jest-dom'
import { crearReglas } from '../data/rules.js'

export function unidad(id, jugador, arquetipo, pos, extras = {}) {
  return {
    id,
    jugador,
    arquetipo,
    pos: { ...pos },
    heridas: extras.heridas || 0,
    maxVida: extras.maxVida || 2,
    foco: extras.foco || [],
    estados: extras.estados || [],
    efectos: extras.efectos || [],
    accionesEsteTurno: extras.accionesEsteTurno || 0,
    tecnicasUsadasEsteRonda: extras.tecnicasUsadasEsteRonda || 0,
    activacionCerrada: extras.activacionCerrada || false,
    activacionBaseUsada: extras.activacionBaseUsada || false,
  }
}

export function dadosFijos(valores) {
  let indice = 0
  return function () {
    if (indice >= valores.length) {
      throw new Error(`RNG agotado: se pidieron ${indice + 1} dados pero solo hay ${valores.length}`)
    }
    return (valores[indice++] - 1) / 10
  }
}

export function armarEstado(overrides = {}) {
  const turnoDe = overrides.turnoDe || 'A'
  return {
    semilla: overrides.semilla || 'test',
    rng: overrides.rng || dadosFijos([3, 3, 3, 3]),
    ronda: overrides.ronda ?? 1,
    jugadorInicial: overrides.jugadorInicial || turnoDe,
    turnoDe,
    faseTurno: 'inicio',
    cartaJugadaEsteTurno: overrides.cartaJugadaEsteTurno ?? false,
    tablero: {
      radio: 4,
      bloqueados: overrides.bloqueados || [],
      ...(overrides.tablero || {}),
    },
    jugadores: {
      A: {
        faccion: 'Fuego', mazo: [], mano: [], descarte: [],
        po: overrides.poA || [],
        ...(overrides.jugadores?.A || {}),
      },
      B: {
        faccion: 'Agua', mazo: [], mano: [], descarte: [],
        po: overrides.poB || [],
        ...(overrides.jugadores?.B || {}),
      },
    },
    unidades: overrides.unidades || [],
    puntosVictoria: overrides.puntosVictoria || { A: 0, B: 0 },
    marcador: overrides.marcador || { A: 0, B: 0 },
    reglas: crearReglas(overrides.reglas || {}),
    secuencia: overrides.secuencia || [],
    log: overrides.log || [],
    ganador: overrides.ganador ?? null,
  }
}

export function buscarUnidad(estado, id) {
  return estado.unidades.find(u => u.id === id) || null
}

export function buscarUnidades(estado, filtro) {
  return estado.unidades.filter(filtro)
}

export function contarCartas(jugador) {
  return (jugador.mazo?.length || 0) +
         (jugador.mano?.length || 0) +
         (jugador.descarte?.length || 0)
}

export function po(jugador, elemento, cantidad) {
  return { elemento, cantidad }
}
