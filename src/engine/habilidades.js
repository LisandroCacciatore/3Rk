// D-27 (US-163): resolver una carta jugada como Habilidad. Puro motor: no
// importa React ni toca el DOM. Conmutable vía estado.reglas.habilitarHabilidadesCarta.
//
// Diferencia con D-25: la habilidad es de la CARTA (catálogo HABILIDADES_POR_CARTA),
// no del elemento ni del rol de la unidad. Se elige una unidad aliada como ORIGEN
// (sin restricción de rol) y un OBJETIVO que cumpla el filtro de la carta
// (bando + rol/arquetipo) en rango y línea de visión del origen. El efecto se
// despacha por clave mecánica con magnitud fija (el valor solo cuenta para el PO).
import { ARQUETIPOS } from '../data/archetypes.js'
import { cumpleFiltroObjetivo } from '../data/cards.js'
import { puedeRecibirToken, agregarToken, quitarTokenFoco } from './focus.js'
import { estaEnRangoYVista } from './combat.js'
import { agregarStunned, consumirStunned } from './status.js'
import { buscarRetroceso, distancia } from './hex.js'
import { aplicarEfectoTecnica } from './techniques.js'
import { otorgarBaja } from './objetivos.js'

export const habilidades = {
  validar(estado, intencion) {
    return validarHabilidad(estado, intencion)
  },
  aplicar(estado, validacion) {
    return aplicarEfecto(estado, validacion)
  },
}

// Valida la intención de JUGAR_CARTA con uso='habilidad'.
// Devuelve { ok: true, carta, origen, objetivo, habilidad, jugador } o
// { ok: false, motivo }.
function validarHabilidad(estado, intencion) {
  const { jugador, indiceCarta, unidad: origenId, objetivo: objetivoId } = intencion

  if (jugador !== estado.turnoDe) {
    return { ok: false, motivo: `${jugador} no es el turno activo` }
  }
  if (!estado.reglas.habilitarHabilidadesCarta) {
    return { ok: false, motivo: 'Las habilidades de carta están deshabilitadas' }
  }

  const manejador = estado.jugadores[jugador]
  if (!manejador || indiceCarta == null || indiceCarta < 0 || indiceCarta >= manejador.mano.length) {
    return { ok: false, motivo: 'índice de carta fuera de rango' }
  }
  if (estado.cartaJugadaEsteTurno) {
    return { ok: false, motivo: 'ya se jugó la carta obligatoria del turno' }
  }

  const carta = manejador.mano[indiceCarta]
  const habilidad = carta.habilidad
  if (!habilidad) {
    return { ok: false, motivo: `${carta.elemento}${carta.valor} no tiene habilidad` }
  }

  const objetivo = estado.unidades.find(u => u.id === objetivoId)
  if (!objetivo) {
    return { ok: false, motivo: 'objetivo no encontrado' }
  }
  const esAliado = objetivo.jugador === jugador
  if (!cumpleFiltroObjetivo(objetivo, habilidad, esAliado)) {
    const rol = ARQUETIPOS[objetivo.arquetipo]?.rol
    if (habilidad.objetivo === 'enemigo' && esAliado) {
      return { ok: false, motivo: `${carta.elemento} apunta solo a unidades enemigas` }
    }
    if (habilidad.objetivo === 'aliado' && !esAliado) {
      return { ok: false, motivo: `${carta.elemento} apunta solo a unidades aliadas` }
    }
    if (habilidad.filtro?.rol && rol !== habilidad.filtro.rol) {
      return { ok: false, motivo: `${carta.elemento} solo afecta a unidades ${habilidad.filtro.rol}` }
    }
    if (habilidad.filtro?.arquetipos) {
      return { ok: false, motivo: `${carta.elemento} solo afecta a ${habilidad.filtro.arquetipos.join('/')}` }
    }
    return { ok: false, motivo: 'el objetivo no cumple el filtro de la carta' }
  }

  // Auto-origen para single-click (seleccionDirecta): encontrar la unidad aliada
  // más cercana que tenga LoS + rango al objetivo.
  let origen
  if (origenId) {
    origen = estado.unidades.find(u => u.id === origenId)
    if (!origen || origen.jugador !== jugador) {
      return { ok: false, motivo: 'origen inválido o no es una unidad tuya' }
    }
  } else {
    const candidatas = estado.unidades.filter(u =>
      u.jugador === jugador && estaEnRangoYVista(estado, u, objetivo).ok
    )
    if (candidatas.length === 0) {
      return { ok: false, motivo: 'ninguna unidad aliada tiene rango al objetivo' }
    }
    origen = candidatas.sort((a, b) =>
      distancia(a.pos, objetivo.pos) - distancia(b.pos, objetivo.pos)
    )[0]
  }

  const rango = estaEnRangoYVista(estado, origen, objetivo)
  if (!rango.ok) {
    return { ok: false, motivo: `objetivo rechazado: ${rango.motivo}` }
  }

  return { ok: true, carta, origen, objetivo, habilidad, jugador }
}

// Aplica el efecto sobre el estado ya clonado y validado (mutación permitida).
export function aplicarEfecto(estado, validacion) {
  if (!validacion.ok) return { ok: false, motivo: validacion.motivo }

  const { carta, origen, objetivo, jugador, habilidad } = validacion
  const cartaValor = carta?.valor || 1
  const magnitud = calcularMagnitud(habilidad, cartaValor)

  switch (habilidad.efecto) {
    case 'herida':
      infligirHeridas(estado, objetivo, magnitud, jugador)
      break
    case 'herida-retroceso':
      infligirHeridas(estado, objetivo, magnitud, jugador)
      retrocederUnidad(estado, origen, objetivo, 1)
      break
    case 'aoe-herida': {
      // Bomba: el daño en área se calcula sobre el tablero ANTES de eliminar al
      // objetivo, para que los adyacentes queden determinados por su posición.
      const adyacentes = enemigosAdyacentes(estado, objetivo, jugador)
      infligirHeridas(estado, objetivo, magnitud)
      for (const vecino of adyacentes) infligirHeridas(estado, vecino, magnitud)
      break
    }
    case 'cura':
      curarHeridas(objetivo, magnitud)
      break
    case 'pool-ataque':
      objetivo.bonoPoolAtaque = (objetivo.bonoPoolAtaque || 0) + magnitud
      break
    case 'pool-defensa':
      objetivo.bonoPoolDefensa = (objetivo.bonoPoolDefensa || 0) + magnitud
      break
    case 'recuperar-carta': {
      // Corriente (Aire3): recupera la carta que estaba antes en el descarte
      // (la recién jugada ya fue empujada por aplicarJugarCarta; se toma la
      // penúltima). Si el descarte solo tiene la jugada, no se recupera nada.
      const manejador = estado.jugadores[jugador]
      if (manejador && manejador.descarte.length >= 2) {
        const recuperada = manejador.descarte.splice(manejador.descarte.length - 2, 1)[0]
        manejador.mano.push(recuperada)
      }
      break
    }
    case 'foco':
      for (let i = 0; i < magnitud; i++) {
        if (!puedeRecibirToken(objetivo)) break
        agregarToken(objetivo, 'Tierra')
      }
      break
    case 'muro':
      aplicarEfectoTecnica(objetivo, 'Muro')
      break
    case 'retroceso':
      retrocederUnidad(estado, origen, objetivo, magnitud)
      break
    case 'movimiento-gratis':
      objetivo.movimientoGratis = (objetivo.movimientoGratis || 0) + 1
      break
    case 'stunned':
      agregarStunned(objetivo)
      break
    case 'anti-stunned':
      consumirStunned(objetivo)
      break
    case 'drenar-foco':
      quitarTokenFoco(objetivo, magnitud)
      break
    case 'disipar':
      aplicarDisipar(objetivo)
      break
    default:
      return { ok: false, motivo: `${habilidad.efecto} no tiene implementación` }
  }

  return { ok: true, habilidad }
}

function infligirHeridas(estado, unidad, cantidad, causante) {
  for (let i = 0; i < cantidad; i++) {
    unidad.heridas += 1
    if (unidad.heridas >= unidad.maxVida) eliminarUnidad(estado, unidad, causante)
  }
}

function eliminarUnidad(estado, unidad, causante) {
  const muerto = estado.unidades.find((u) => u.id === unidad.id)
  if (!muerto) return
  estado.unidades = estado.unidades.filter((u) => u.id !== unidad.id)
  // D-34: si la baja la causó una habilidad, el bando del lanzador suma +1.
  if (causante) otorgarBaja(estado, unidad)
}

function curarHeridas(unidad, cantidad) {
  unidad.heridas = Math.max(0, unidad.heridas - cantidad)
}

// Empuja `unidad` alejándola de `origen` hasta `pasos` hexes (o hasta que no
// haya hex libre). Espejo del retroceso de combate (D-06/A-11-N5).
function retrocederUnidad(estado, origen, unidad, pasos) {
  let retrocedio = 0
  for (let i = 0; i < pasos; i++) {
    const hex = buscarRetroceso(unidad.pos, origen.pos, estado)
    if (!hex) break
    unidad.pos = hex
    retrocedio += 1
  }
  return retrocedio
}

function enemigosAdyacentes(estado, unidad, jugador) {
  return estado.unidades.filter(u =>
    u.jugador !== jugador && u.id !== unidad.id && distancia(u.pos, unidad.pos) === 1
  )
}

// Ruptura (Vacio3): anula el Muro activo O marca al objetivo para que su próxima
// tirada de defensa pierda 1 dado guardado (nunca ambos, espejo de D-14 Disipar).
function aplicarDisipar(unidad) {
  const idx = unidad.efectos.indexOf('Muro')
  if (idx >= 0) {
    unidad.efectos.splice(idx, 1)
    return
  }
  unidad.disipadoDefensa = (unidad.disipadoDefensa || 0) + 1
}

// Calcula la magnitud efectiva de una habilidad según el valor de la carta.
// 'multiplicar': base × carta.valor | 'sumar': base + (valor-1) | null: fijo.
function calcularMagnitud(hab, valor) {
  const base = hab.magnitudBase ?? hab.magnitud ?? 0
  if (!hab.escalaConValor) return base
  if (hab.escalaConValor === 'multiplicar') return base * valor
  if (hab.escalaConValor === 'sumar') return base + (valor - 1)
  return base
}
