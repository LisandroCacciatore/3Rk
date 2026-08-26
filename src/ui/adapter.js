// Capa de presentación: compone selectores del motor en consultas listas para
// la UI. No contiene reglas de juego: toda decisión sale del engine. Un
// componente que calcula por su cuenta (coste, legalidad, alcance) es un bug.
import { ARQUETIPOS } from '../data/archetypes.js'
import { hexesMovibles, objetivosAtaque, lugaresCapturables } from '../engine/selectors.js'
import { totalPO, cartaAEsperanza } from '../engine/po.js'
import { costeProximaAccion } from '../engine/actions.js'
import { puedeRecibirToken } from '../engine/focus.js'
import { TECNICAS, puedeDeclarar } from '../engine/techniques.js'
import { hexEnRadio, hexKey, distancia } from '../engine/hex.js'
import { simboloElemento } from './elementos.js'

// D-36 (aprobado 12/08/2026): en el escenario Río Tajii las facciones se
// muestran como Mouri (A) y Takeda (B). Es SOLO presentación: el motor sigue
// A/B con mazos elementales Fuego/Agua.
const NOMBRES_RESKIN_TAJII = { A: 'Mouri', B: 'Takeda' }

export function faccionDeJugador(jugador, estado) {
  const faccion = estado?.jugadores?.[jugador]?.faccion || (jugador === 'A' ? 'Fuego' : 'Agua')
  if (estado?.escenario === 'rio-tajii') {
    return NOMBRES_RESKIN_TAJII[jugador] || faccion
  }
  return faccion
}

export function tecnicasDeTipo(unidad, tipo) {
  return Object.keys(TECNICAS).filter(k =>
    TECNICAS[k].arquetipos.includes(unidad.arquetipo) && TECNICAS[k].tipo === tipo
  )
}

export function declaracionTecnica(unidad, tecnica, mano, reglas) {
  let chequeo = puedeDeclarar(unidad, tecnica, { reglas })
  if (chequeo.ok) return { ok: true, cartaIndice: null, motivo: null }
  for (let i = 0; i < mano.length; i++) {
    chequeo = puedeDeclarar(unidad, tecnica, { carta: mano[i], cartaIndice: i, reglas })
    if (chequeo.ok) return { ok: true, cartaIndice: i, motivo: null }
  }
  return { ok: false, cartaIndice: null, motivo: chequeo.motivo }
}

export function costeTecnicaTexto(tecnica) {
  return Object.entries(tecnica.coste)
    .map(([elem, n]) => `${simboloElemento(elem)}×${n}`)
    .join(' ')
}

function tecnicasDelTipo(estado, unidadId, tipo) {
  const unidad = estado.unidades.find(u => u.id === unidadId)
  if (!unidad) return []
  const mano = estado.jugadores[estado.turnoDe].mano
  return tecnicasDeTipo(unidad, tipo).map(id => {
    const t = TECNICAS[id]
    const decl = declaracionTecnica(unidad, id, mano, estado.reglas)
    return {
      id,
      nombre: t.nombre,
      descripcion: t.descripcion,
      coste: costeTecnicaTexto(t),
      costeMapa: t.coste,
      ok: decl.ok,
      motivo: decl.ok && decl.cartaIndice != null
        ? `Se consumirá la carta ${cartaAEsperanza(mano[decl.cartaIndice])}`
        : decl.motivo,
      cartaIndice: decl.cartaIndice,
    }
  })
}

export function obtenerTecnicasAtaque(estado, unidadId) {
  return tecnicasDelTipo(estado, unidadId, 'ataque')
}

export function obtenerTecnicasDefensa(estado, unidadId) {
  return tecnicasDelTipo(estado, unidadId, 'defensa')
}

export function obtenerAcciones(estado, unidadId) {
  const activo = estado.turnoDe
  const unidad = estado.unidades.find(u => u.id === unidadId)
  if (!unidad) return []
  const esMia = unidad.jugador === activo
  const jugadorActivo = estado.jugadores[activo]
  const po = totalPO(jugadorActivo)
  const coste = costeProximaAccion(unidad, estado.reglas)
  const moviles = esMia ? hexesMovibles(estado, unidad.id) : []
  const objetivos = esMia ? objetivosAtaque(estado, unidad.id) : []

  const acciones = []
  const mover = { id: 'mover', nombre: 'Mover', coste, habilitada: false, motivo: '' }
  if (!esMia) mover.motivo = 'no es tu unidad'
  else if (unidad.activacionCerrada) mover.motivo = 'ya atacó este turno'
  else if (po < coste) mover.motivo = 'PO insuficientes'
  else if (moviles.length === 0) mover.motivo = 'sin destinos alcanzables'
  else mover.habilitada = true
  acciones.push(mover)

  const atacar = { id: 'atacar', nombre: 'Atacar', coste, habilitada: false, motivo: '' }
  if (!esMia) atacar.motivo = 'no es tu unidad'
  else if (unidad.activacionCerrada) atacar.motivo = 'ya atacó este turno'
  else if (po < coste) atacar.motivo = 'PO insuficientes'
  else if (objetivos.length === 0) atacar.motivo = 'sin objetivos en rango y visión'
  else atacar.habilitada = true
  acciones.push(atacar)

  const lugares = esMia ? lugaresCapturables(estado, unidad.id) : []
  const capturar = {
    id: 'capturar', nombre: 'Capturar Lugar', coste: estado.reglas.costeCapturaLugar,
    habilitada: false, motivo: '', detalle: { hexes: lugares },
  }
  if (!esMia) capturar.motivo = 'no es tu unidad'
  else if (unidad.activacionCerrada) capturar.motivo = 'ya atacó este turno'
  else if (!estado.reglas.lugarHabilitado) capturar.motivo = 'mecánica Lugar desactivada'
  else if (po < estado.reglas.costeCapturaLugar) capturar.motivo = 'PO insuficientes'
  else if (lugares.length === 0) capturar.motivo = 'sin lugares alcanzables'
  else capturar.habilitada = true
  acciones.push(capturar)

  return acciones
}

export function hexesEnRango(estado, unidadId) {
  const unidad = estado.unidades.find(u => u.id === unidadId)
  if (!unidad) return []
  const perfil = ARQUETIPOS[unidad.arquetipo]
  return hexEnRadio(unidad.pos, perfil.rango)
}

export function objetivoEnRango(estado, unidadId, objetivoId) {
  const unidad = estado.unidades.find(u => u.id === unidadId)
  const objetivo = estado.unidades.find(u => u.id === objetivoId)
  if (!unidad || !objetivo) return false
  const perfil = ARQUETIPOS[unidad.arquetipo]
  return distancia(unidad.pos, objetivo.pos) <= perfil.rango
}

export function resumenDado(valoresStr) {
  const valores = String(valoresStr).split('+').map(Number)
  return {
    valores,
    exploto: valores.length > 1,
    total: valores.reduce((s, v) => s + v, 0),
  }
}

export function descripcionStunned(reglas) {
  if (reglas.stunnedDuro) {
    return 'Stunned: −1 dado del pool y −1 dado guardado (cada uno mínimo 1)'
  }
  if (reglas.stunnedReduceKept) {
    return 'Stunned: −1 dado guardado (mínimo 1)'
  }
  return `Stunned: −1 dado del pool${reglas.stunnedMinimoUnDado ? ' (mínimo 1)' : ''}`
}

export function ultimoEventoAtaque(estado, desde = 0) {
  const log = estado.log
  for (let i = log.length - 1; i >= Math.max(0, desde); i--) {
    if (log[i] && log[i].tipo === 'ataque' && log[i].detalle) return log[i].detalle
  }
  return null
}
