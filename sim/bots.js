// Políticas de juego para simulación. Cada bot decide una intención legal
// mirando el estado. No tocan estado.rng (ese lo consume el motor para los
// dados): usan su propio rng sembrado que el runner les pasa.
//
// Tres políticas, en orden creciente de sofisticación:
//   aleatorio  -> línea de base: elige al azar entre intenciones legales.
//   codicioso  -> ataca si tiene objetivo válido; si no, se acerca al enemigo.
//   ahorrador  -> conserva recursos: acumula Foco, ataca solo con Técnica o
//                 para rematar. Mide la asimetría de tempo (hoarding).
//
// Las Técnicas se usan solo cuando el arquetipo puede pagarlas: con tokens de
// Foco, o con una carta de la mano que cubra el excedente (regla D-18). El
// ahorrador, en cambio, nunca aporta cartas a una Técnica: eso lo hace gastar
// menos cartas que el rival y prolongar su mano hasta el final de la ronda.

import { hexesMovibles, objetivosAtaque } from '../src/engine/selectors.js'
import { costeProximaAccion } from '../src/engine/actions.js'
import { costeSiguienteToken, puedeRecibirToken } from '../src/engine/focus.js'
import { distancia } from '../src/engine/hex.js'
import { totalPO } from '../src/engine/po.js'
import { TECNICAS, puedeDeclarar } from '../src/engine/techniques.js'
import { ELEMENTOS } from '../src/data/factions.js'

const ELEMENTO_PREFERIDO = {
  Peon: 'Fuego',
  Alfil: 'Agua',
  Caballo: null,
  Torre: 'Tierra',
  Campeon: 'Agua',
  Rey: null,
}

// Mientras haya un ataque con Reflujo pendiente (D-16) la única jugada legal
// es REFLEJAR_DADOS: repetir los dados más bajos del pool.
function resolverReflujo(estado) {
  const pendiente = estado.combatePendiente
  const dados = pendiente.atq.dadosTirados
  const ordenados = dados
    .map((d, i) => ({ i, v: d.valorTotal }))
    .sort((a, b) => a.v - b.v)
  const repetir = ordenados
    .slice(0, Math.max(1, Math.floor(dados.length / 2)))
    .map((x) => x.i)
  return { tipo: 'REFLEJAR_DADOS', jugador: estado.turnoDe, dadosARepetir: repetir }
}

// La carta obligatoria (FR-090) hay que jugarla antes de terminar el turno.
function jugarCartaObligatoria(estado, seleccionar) {
  const jugador = estado.turnoDe
  const mano = estado.jugadores[jugador].mano
  if (!estado.cartaJugadaEsteTurno && mano.length > 0) {
    return { tipo: 'JUGAR_CARTA', jugador, indiceCarta: seleccionar(mano) }
  }
  return null
}

// Objetivo con mejor razón heridas/vida, priorizando al Rey.
function elegirObjetivo(estado, unidad) {
  const objetivos = objetivosAtaque(estado, unidad.id)
  if (objetivos.length === 0) return null
  return objetivos.reduce((mejor, o) => {
    const s = o.heridas / o.maxVida + (o.arquetipo === 'Rey' ? 1 : 0)
    const sm = mejor.heridas / mejor.maxVida + (mejor.arquetipo === 'Rey' ? 1 : 0)
    return s > sm ? o : mejor
  })
}

// Técnica de ataque pagable por la unidad: con tokens propios o con una carta.
// `usarCartas=false` (ahorrador) fuerza pago solo con tokens.
function tecnicaAtaqueDisponible(estado, unidad, usarCartas) {
  const mano = estado.jugadores[unidad.jugador].mano
  for (const [clave, t] of Object.entries(TECNICAS)) {
    if (t.tipo !== 'ataque' || clave === 'DobleTiro') continue
    if (!t.arquetipos.includes(unidad.arquetipo)) continue
    if (puedeDeclarar(unidad, clave, { reglas: estado.reglas }).ok) return { tecnica: clave }
    if (!usarCartas) continue
    for (let i = 0; i < mano.length; i++) {
      const carta = mano[i]
      if (carta.elemento in t.coste &&
          puedeDeclarar(unidad, clave, { carta, cartaIndice: i, reglas: estado.reglas }).ok) {
        return { tecnica: clave, cartaIndice: i }
      }
    }
  }
  return null
}

// Muro (defensiva, Torre): pago con 2 Tierra o con 1 Tierra + carta.
function tecnicaDefensaDisponible(estado, unidad, usarCartas) {
  if (!TECNICAS.Muro.arquetipos.includes(unidad.arquetipo)) return null
  if (unidad.efectos.includes('Muro')) return null
  if (puedeDeclarar(unidad, 'Muro', { reglas: estado.reglas }).ok) return { tecnica: 'Muro' }
  if (!usarCartas) return null
  const mano = estado.jugadores[unidad.jugador].mano
  for (let i = 0; i < mano.length; i++) {
    const carta = mano[i]
    if (carta.elemento === 'Tierra' &&
        puedeDeclarar(unidad, 'Muro', { carta, cartaIndice: i, reglas: estado.reglas }).ok) {
      return { tecnica: 'Muro', cartaIndice: i }
    }
  }
  return null
}

// El hex alcanzable que deja a la unidad más cerca del enemigo más cercano.
function hexMasCercanoAEnemigo(estado, unidad) {
  const enemigos = estado.unidades.filter((u) => u.jugador !== unidad.jugador)
  if (enemigos.length === 0) return null
  let mejor = null
  let mejorDist = Infinity
  for (const hex of hexesMovibles(estado, unidad.id)) {
    const d = Math.min(...enemigos.map((e) => distancia(hex, e.pos)))
    if (d < mejorDist) {
      mejorDist = d
      mejor = hex
    }
  }
  return mejor
}

function concentrarBarato(estado, rng, propias) {
  const po = totalPO(estado.jugadores[estado.turnoDe])
  for (const unidad of propias) {
    if (!puedeRecibirToken(unidad)) continue
    const coste = costeSiguienteToken(unidad)
    if (po < coste) continue
    const elemento = ELEMENTO_PREFERIDO[unidad.arquetipo] ||
      ELEMENTOS[Math.floor(rng() * ELEMENTOS.length)]
    return { tipo: 'CONCENTRARSE', jugador: estado.turnoDe, unidadId: unidad.id, elemento }
  }
  return null
}

// ---------------------------------------------------------------- aleatorio

// Elige al azar entre los TIPOS de acción legalmente disponibles (carta,
// atacar, mover, concentrar, terminar turno) y dentro del tipo elige una
// opción concreta también al azar. Mantiene la esencia de línea de base
// aleatoria pero garantiza que las unidades terminen combatiendo: un bot que
// solo deambula nunca ataca y las partidas no terminan.
export function botAleatorioLegal(estado, rng) {
  if (estado.combatePendiente) return resolverReflujo(estado)

  const jugador = estado.turnoDe
  const manejador = estado.jugadores[jugador]
  const propias = estado.unidades.filter(
    (u) => u.jugador === jugador && !u.activacionCerrada
  )

  const tipos = []
  const aleatorio = (arr) => arr[Math.floor(rng() * arr.length)]

  if (!estado.cartaJugadaEsteTurno && manejador.mano.length > 0) {
    tipos.push('carta')
  }
  if (propias.length > 0) {
    const puedeAtacar = propias.some((u) => objetivosAtaque(estado, u.id).length > 0)
    const puedeMover = propias.some((u) => hexesMovibles(estado, u.id).length > 0)
    const puedeConcentrar = propias.some((u) => puedeRecibirToken(u))
    if (puedeAtacar) tipos.push('atacar')
    if (puedeMover) tipos.push('mover')
    if (puedeConcentrar) tipos.push('concentrar')
  }
  if (estado.cartaJugadaEsteTurno || manejador.mano.length === 0) {
    tipos.push('terminar')
  }

  if (tipos.length === 0) return { tipo: 'TERMINAR_TURNO', jugador }

  const tipo = aleatorio(tipos)
  const unidad = aleatorio(propias)

  switch (tipo) {
    case 'carta': {
      const indices = manejador.mano.map((_, i) => i)
      return { tipo: 'JUGAR_CARTA', jugador, indiceCarta: aleatorio(indices) }
    }
    case 'atacar': {
      const atacantes = propias.filter((u) => objetivosAtaque(estado, u.id).length > 0)
      const atacante = aleatorio(atacantes)
      const objetivo = aleatorio(objetivosAtaque(estado, atacante.id))
      return { tipo: 'ATACAR', jugador, atacante: atacante.id, objetivo: objetivo.id }
    }
    case 'mover': {
      const moviles = propias.filter((u) => hexesMovibles(estado, u.id).length > 0)
      const unidadM = aleatorio(moviles)
      // Sesgo leve hacia el enemigo: elegir entre los hexes que no alejan,
      // para que el combate efectivamente ocurra.
      const hexes = hexesMovibles(estado, unidadM.id)
      const enemigos = estado.unidades.filter((u) => u.jugador !== unidadM.jugador)
      const actual = Math.min(...enemigos.map((e) => distancia(unidadM.pos, e.pos)))
      const buenos = hexes.filter(
        (h) => Math.min(...enemigos.map((e) => distancia(h, e.pos))) <= actual
      )
      const destino = aleatorio(buenos.length > 0 ? buenos : hexes)
      return { tipo: 'MOVER', jugador, unidadId: unidadM.id, destino }
    }
    case 'concentrar': {
      const conc = aleatorio(propias.filter((u) => puedeRecibirToken(u)))
      const elemento = ELEMENTOS[Math.floor(rng() * ELEMENTOS.length)]
      return { tipo: 'CONCENTRARSE', jugador, unidadId: conc.id, elemento }
    }
    default:
      return { tipo: 'TERMINAR_TURNO', jugador }
  }
}

// ---------------------------------------------------------------- codicioso

export function botCodicioso(estado, rng) {
  if (estado.combatePendiente) return resolverReflujo(estado)

  const jugador = estado.turnoDe
  const manejador = estado.jugadores[jugador]

  const carta = jugarCartaObligatoria(estado, (mano) => {
    let idx = 0
    for (let i = 0; i < mano.length; i++) if (mano[i].valor > mano[idx].valor) idx = i
    return idx
  })
  if (carta) return carta

  const po = totalPO(manejador)
  const propias = estado.unidades.filter((u) => u.jugador === jugador && !u.activacionCerrada)

  for (const unidad of propias) {
    if (po < costeProximaAccion(unidad, estado.reglas)) continue
    const objetivo = elegirObjetivo(estado, unidad)
    if (!objetivo) continue
    const tec = tecnicaAtaqueDisponible(estado, unidad, true)
    return tec
      ? { tipo: 'ATACAR', jugador, atacante: unidad.id, objetivo: objetivo.id, ...tec }
      : { tipo: 'ATACAR', jugador, atacante: unidad.id, objetivo: objetivo.id }
  }

  for (const unidad of propias) {
    const defensa = tecnicaDefensaDisponible(estado, unidad, true)
    if (defensa) return { tipo: 'DECLARAR_TECNICA', jugador, unidadId: unidad.id, ...defensa }
  }

  for (const unidad of propias) {
    const destino = hexMasCercanoAEnemigo(estado, unidad)
    if (!destino) continue
    if (po < costeProximaAccion(unidad, estado.reglas)) continue
    return { tipo: 'MOVER', jugador, unidadId: unidad.id, destino }
  }

  const conc = concentrarBarato(estado, rng, propias)
  if (conc) return conc

  return { tipo: 'TERMINAR_TURNO', jugador }
}

// ---------------------------------------------------------------- ahorrador

export function botAhorrador(estado, rng) {
  if (estado.combatePendiente) return resolverReflujo(estado)

  const jugador = estado.turnoDe
  const manejador = estado.jugadores[jugador]

  const carta = jugarCartaObligatoria(estado, (mano) => {
    let idx = 0
    for (let i = 0; i < mano.length; i++) if (mano[i].valor < mano[idx].valor) idx = i
    return idx
  })
  if (carta) return carta

  const po = totalPO(manejador)
  const propias = estado.unidades.filter((u) => u.jugador === jugador && !u.activacionCerrada)

  for (const unidad of propias) {
    const defensa = tecnicaDefensaDisponible(estado, unidad, false)
    if (defensa) return { tipo: 'DECLARAR_TECNICA', jugador, unidadId: unidad.id, ...defensa }
  }

  for (const unidad of propias) {
    if (po < costeProximaAccion(unidad, estado.reglas)) continue
    const objetivo = elegirObjetivo(estado, unidad)
    if (!objetivo) continue
    const tec = tecnicaAtaqueDisponible(estado, unidad, false)
    if (tec) return { tipo: 'ATACAR', jugador, atacante: unidad.id, objetivo: objetivo.id, ...tec }
    if (objetivo.heridas + 1 >= objetivo.maxVida) {
      return { tipo: 'ATACAR', jugador, atacante: unidad.id, objetivo: objetivo.id }
    }
  }

  const conc = concentrarBarato(estado, rng, propias)
  if (conc) return conc

  return { tipo: 'TERMINAR_TURNO', jugador }
}
