import { barajar } from './dice.js'
import { resetearUnidades } from './actions.js'

export function verificarVictoria(estado) {
  const unidadesA = estado.unidades.filter((u) => u.jugador === 'A')
  const unidadesB = estado.unidades.filter((u) => u.jugador === 'B')

  if (unidadesA.length === 0) {
    return { ganador: 'B', motivo: 'eliminación total' }
  }
  if (unidadesB.length === 0) {
    return { ganador: 'A', motivo: 'eliminación total' }
  }

  return null
}

export function jugadorContrario(jugador) {
  return jugador === 'A' ? 'B' : 'A'
}

export function finDeTurno(estado, jugador) {
  const contrario = jugadorContrario(jugador)
  const propietario = estado.jugadores[jugador]
  const oponente = estado.jugadores[contrario]

  if (oponente.mano.length === 0) {
    if (propietario.mano.length > 0) {
      estado.turnoDe = jugador
      return { tipo: 'mismo-jugador' }
    }
    estado.turnoDe = contrario
    return { tipo: 'ambos-sin-mano' }
  }

  estado.turnoDe = contrario
  return { tipo: 'alternado' }
}

export function iniciarNuevaRonda(estado, jugadorInicial) {
  for (const j of ['A', 'B']) {
    const manejador = estado.jugadores[j]
    manejador.mazo = [...manejador.mazo, ...manejador.descarte]
    manejador.descarte = []
    manejador.mazo = barajar(manejador.mazo, estado.rng)
    manejador.mano = manejador.mazo.splice(0, estado.reglas.manoInicial)
    manejador.po = []
  }
  resetearUnidades(estado.unidades)
  // A-11-N6: el límite de UNA Técnica por ronda se renueva al iniciar la ronda.
  for (const u of estado.unidades) {
    u.tecnicasUsadasEsteRonda = 0
  }
  if (!estado.reglas.focoPersisteEntreRondas) {
    const perdidos = []
    for (const u of estado.unidades) {
      if (u.foco.length > 0) perdidos.push({ id: u.id, cantidad: u.foco.length })
      u.foco = []
    }
    if (perdidos.length > 0) {
      estado.log = [...estado.log, {
        timestamp: estado.log.length,
        ronda: estado.ronda + 1,
        turno: estado.turnoDe,
        actor: 'SISTEMA',
        tipo: 'foco-perdido',
        descripcion: `Foco vaciado al iniciar la ronda: ${perdidos.map(p => `${p.id} (${p.cantidad})`).join(', ')}`,
      }]
    }
  }
  estado.ronda += 1
  estado.turnoDe = jugadorInicial
  estado.cartaJugadaEsteTurno = false
  return estado
}
