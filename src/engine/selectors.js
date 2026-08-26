import { ARQUETIPOS } from '../data/archetypes.js'
import { cumpleFiltroObjetivo } from '../data/cards.js'
import { hexAlcanzables, hexKey, distancia, dentroDeForma, bloqueadosParaMovimiento, costeHexTerreno } from './hex.js'
import { estaEnRangoYVista } from './combat.js'

export function hexesMovibles(estado, unidadId) {
  const unidad = estado.unidades.find(u => u.id === unidadId)
  if (!unidad) return []
  const perfil = ARQUETIPOS[unidad.arquetipo]
  const ocupados = estado.unidades.filter(u => u.id !== unidadId)
  const dentro = (h) => dentroDeForma(estado.tablero.forma, h)
  // D-29: el alcance usa el coste de terreno (los tiles con `costeExtra`
  // consumen más movimiento al entrar).
  return hexAlcanzables(unidad.pos, perfil.movimiento, ocupados, bloqueadosParaMovimiento(estado), dentro, costeHexTerreno(estado))
}

// D-26: lugares aún sin capturar a distancia ≤ 1 de la unidad. La captura la
// resuelve aplicarInteractuar; acá solo se expone qué se puede tomar.
export function lugaresCapturables(estado, unidadId) {
  const unidad = estado.unidades.find(u => u.id === unidadId)
  if (!unidad || !estado.reglas.lugarHabilitado) return []
  const tomados = new Set(estado.tablero.bloqueados)
  return (estado.tablero.lugares || []).filter(lugar => {
    if (tomados.has(hexKey(lugar))) return false
    return distancia(unidad.pos, lugar) <= 1
  })
}

export function objetivosAtaque(estado, unidadId) {
  const atacante = estado.unidades.find(u => u.id === unidadId)
  if (!atacante) return []
  // A-11-N1: el Rey no puede ser objetivo en la Ronda 1.
  const reyProtegido = estado.reglas.reyProtegidoRonda1 && estado.ronda === 1
  return estado.unidades.filter(u =>
    u.jugador !== atacante.jugador &&
    !(reyProtegido && u.arquetipo === 'Rey') &&
    estaEnRangoYVista(estado, atacante, u).ok
  )
}

// D-27 (US-163): unidades aliadas del jugador que pueden ser ORIGEN de la
// habilidad de una carta. A diferencia de D-25 no hay restricción de rol: la
// habilidad es de la carta; el origen solo marca rango/LoS.
export function origenesHabilidad(estado, jugador) {
  return estado.unidades.filter(u => u.jugador === jugador)
}

// D-27 (US-163): objetivos posibles para la carta según su filtro (bando +
// rol/arquetipo) dentro del alcance/línea de visión de la unidad origen.
export function objetivosHabilidad(estado, origenId, carta) {
  const origen = estado.unidades.find(u => u.id === origenId)
  if (!origen) return []
  const habilidad = carta && carta.habilidad
  if (!habilidad) return []
  return estado.unidades.filter(t => {
    const esAliado = t.jugador === origen.jugador
    if (!cumpleFiltroObjetivo(t, habilidad, esAliado)) return false
    return estaEnRangoYVista(estado, origen, t).ok
  })
}