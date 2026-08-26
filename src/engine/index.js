import { crearEstadoInicial } from './state.js'
import { agregarEvento } from './log.js'
import { gastarPO } from './po.js'
import {
  costeProximaAccion, incrementarAcciones, cerrarActivacion, marcarActivacionBaseUsada,
} from './actions.js'
import { agregarToken, puedeRecibirToken } from './focus.js'
import {
  resolverIntercambio, aplicarConsecuenciasDerrota, estaEnRangoYVista,
  tiradaAtaque, repetirDados, resolverTiradaDefensa, finalizarIntercambio,
} from './combat.js'
import { puedeDeclarar, declararTecnica, aplicarEfectoTecnica, TECNICAS } from './techniques.js'
import { verificarVictoria, jugadorContrario, iniciarNuevaRonda } from './round.js'
import { metasFinDeTurno, verificarVictoriaObjetivos } from './objetivos.js'
import { ARQUETIPOS } from '../data/archetypes.js'
import { REGLAS_POR_DEFECTO } from '../data/rules.js'
import { habilidades } from './habilidades.js'
import { caminoLibre, distancia, hexKey, dentroDeForma, bloqueadosParaMovimiento, costeCamino, costeHexTerreno } from './hex.js'

export function aplicarIntencion(estado, intencion) {
  if (!intencion || !intencion.tipo) {
    const e = clonarEstado(estado)
    e.log = agregarEvento(e.log, {
      ronda: e.ronda,
      actor: 'SISTEMA',
      tipo: 'error',
      descripcion: `Intención sin tipo: ${JSON.stringify(intencion)}`,
    }, e.turnoDe)
    return e
  }

  if (estado.ganador) {
    const e = clonarEstado(estado)
    e.log = agregarEvento(e.log, {
      ronda: e.ronda,
      actor: intencion.jugador || 'SISTEMA',
      tipo: 'error',
      descripcion: 'La partida terminó: no se pueden ejecutar más acciones',
    }, e.turnoDe)
    return e
  }

  // D-16: mientras haya un ataque con Reflujo pendiente, solo se puede repetir
  // los dados o cambiar reglas. Nada más.
  if (estado.combatePendiente &&
      intencion.tipo !== 'REFLEJAR_DADOS' &&
      intencion.tipo !== 'CAMBIAR_REGLAS') {
    const e = clonarEstado(estado)
    e.log = agregarEvento(e.log, {
      ronda: e.ronda,
      actor: intencion.jugador || 'SISTEMA',
      tipo: 'error',
      descripcion: 'Hay un ataque con Reflujo pendiente: resolvelo antes de otra acción',
    }, e.turnoDe)
    return e
  }

  const estadoClone = clonarEstado(estado)

  const resultado = (() => {
    switch (intencion.tipo) {
      case 'JUGAR_CARTA':
        return aplicarJugarCarta(estadoClone, intencion)
      case 'MOVER':
        return aplicarMover(estadoClone, intencion)
      case 'ATACAR':
        return aplicarAtacar(estadoClone, intencion)
      case 'INTERACTUAR':
        return aplicarInteractuar(estadoClone, intencion)
      case 'DECLARAR_TECNICA':
        return aplicarDeclararTecnica(estadoClone, intencion)
      case 'REFLEJAR_DADOS':
        return aplicarReflejarDados(estadoClone, intencion)
      case 'CAMBIAR_REGLAS':
        return aplicarCambiarReglas(estadoClone, intencion)
      case 'TERMINAR_TURNO':
        return aplicarTerminarTurno(estadoClone, intencion)
      default:
        estadoClone.log = agregarEvento(estadoClone.log, {
          ronda: estadoClone.ronda,
          actor: intencion.jugador || 'DESCONOCIDO',
          tipo: 'error',
          descripcion: `Intención desconocida: "${intencion.tipo}"`,
        }, estadoClone.turnoDe)
        return estadoClone
    }
  })()

  // D-20: toda intención aplicada (el log cerró con algo distinto de "error")
  // queda en la secuencia para poder reproducir y exportar la partida.
  const ultimo = resultado.log[resultado.log.length - 1]
  if (ultimo && ultimo.tipo !== 'error') {
    const { tipo, ...payload } = intencion
    resultado.secuencia = [...(resultado.secuencia || []), { tipo, ...payload }]
  }

  return resultado
}

function clonarEstado(estado) {
  const rng = estado.rng
  estado.rng = null
  const clon = structuredClone(estado)
  estado.rng = rng
  clon.rng = rng
  return clon
}

function registrar(estado, evento) {
  estado.log = agregarEvento(estado.log, {
    ronda: estado.ronda,
    actor: evento.actor || 'SISTEMA',
    tipo: evento.tipo,
    descripcion: evento.descripcion,
    ...(evento.coste !== undefined ? { coste: evento.coste } : {}),
    ...(evento.cantidad !== undefined ? { cantidad: evento.cantidad } : {}),
    ...(evento.solitario !== undefined ? { solitario: evento.solitario } : {}),
    ...(evento.unidadId !== undefined ? { unidadId: evento.unidadId } : {}),
    ...(evento.tecnica !== undefined ? { tecnica: evento.tecnica } : {}),
    ...(evento.elemento !== undefined ? { elemento: evento.elemento } : {}),
    ...(evento.valor !== undefined ? { valor: evento.valor } : {}),
    ...(evento.detalle ? { detalle: evento.detalle } : {}),
  }, estado.turnoDe)
}

function quitarMuro(unidad) {
  const idx = unidad.efectos.indexOf('Muro')
  if (idx >= 0) unidad.efectos.splice(idx, 1)
}

function robarCarta(estado, jugador) {
  const manejador = estado.jugadores[jugador]
  const cantidad = estado.reglas.roboPorTurno || 0
  const robadas = []
  for (let i = 0; i < cantidad && manejador.mazo.length > 0; i++) {
    const carta = manejador.mazo.pop()
    manejador.mano.push(carta)
    robadas.push(carta)
  }
  if (robadas.length > 0) {
    registrar(estado, {
      actor: jugador,
      tipo: 'robo',
      descripcion: `${jugador} roba ${robadas.length} carta(s)` +
        (robadas.length === 1 ? ` (${robadas[0].elemento}${robadas[0].valor})` : ''),
    })
  }
}

function aplicarJugarCarta(estado, intencion) {
  const { jugador, indiceCarta, uso = 'orden' } = intencion
  const manejador = estado.jugadores[jugador]
  if (!manejador || indiceCarta < 0 || indiceCarta >= manejador.mano.length) {
    registrar(estado, {
      actor: jugador,
      tipo: 'error',
      descripcion: `JUGAR_CARTA inválida: índice ${indiceCarta} fuera de rango`,
    })
    return estado
  }
  if (estado.cartaJugadaEsteTurno) {
    registrar(estado, {
      actor: jugador,
      tipo: 'error',
      descripcion: `${jugador} ya jugó una carta este turno`,
    })
    return estado
  }

  // D-27 (US-163): uso excluyente. 'habilidad' no genera PO, aplica el efecto
  // propio de la carta desde un origen aliado (rango/LoS) y hacia un objetivo
  // que cumple su filtro. Conmutado por reglas.
  if (uso === 'habilidad') {
    const validacion = habilidades.validar(estado, intencion)
    if (!validacion.ok) {
      registrar(estado, {
        actor: jugador,
        tipo: 'error',
        descripcion: `Habilidad rechazada: ${validacion.motivo}`,
      })
      return estado
    }
    const carta = manejador.mano[indiceCarta]
    manejador.mano.splice(indiceCarta, 1)
    manejador.descarte.push(carta)
    estado.cartaJugadaEsteTurno = true
    const reyesAntes = {
      A: estado.unidades.some(u => u.jugador === 'A' && u.arquetipo === 'Rey'),
      B: estado.unidades.some(u => u.jugador === 'B' && u.arquetipo === 'Rey'),
    }
    habilidades.aplicar(estado, validacion)
    registrar(estado, {
      actor: jugador,
      tipo: 'carta-habilidad',
      elemento: carta.elemento,
      valor: carta.valor,
      unidadId: intencion.unidad,
      descripcion: `${jugador} jugó ${carta.elemento}${carta.valor} ` +
        `(${carta.habilidad?.nombre || 'Habilidad'}) desde ${intencion.unidad}` +
        ` hacia ${intencion.objetivo}`,
      detalle: { habilidad: carta.habilidad?.nombre, objetivo: intencion.objetivo },
    })
    verificarVictoriaYRegistrar(estado, reyesAntes)
    return estado
  }

  // uso === 'foco': la carta prepara un token elemental en una unidad aliada (sin PO)
  // Conmutado por regla cartaDualUso. Excluyente con 'orden' y 'habilidad'.
  if (uso === 'foco') {
    if (!estado.reglas.cartaDualUso) {
      registrar(estado, {
        actor: jugador,
        tipo: 'error',
        descripcion: 'Jugar carta como Foco está desactivado (regla cartaDualUso)',
      })
      return estado
    }
    const { unidad: unidadFocoId, elemento: elementoFoco } = intencion
    if (!unidadFocoId || !elementoFoco) {
      registrar(estado, {
        actor: jugador,
        tipo: 'error',
        descripcion: 'Foco requiere unidad destino y elemento',
      })
      return estado
    }
    const unidad = estado.unidades.find(u => u.id === unidadFocoId && u.jugador === jugador)
    if (!unidad) {
      registrar(estado, { actor: jugador, tipo: 'error', descripcion: 'Unidad no encontrada' })
      return estado
    }
    if (!puedeRecibirToken(unidad)) {
      registrar(estado, { actor: jugador, tipo: 'error', descripcion: `${unidadFocoId} tiene el Foco lleno` })
      return estado
    }
    const carta = manejador.mano[indiceCarta]
    manejador.mano.splice(indiceCarta, 1)
    manejador.descarte.push(carta)
    estado.cartaJugadaEsteTurno = true
    const resultadoToken = agregarToken(unidad, elementoFoco)
    if (!resultadoToken.ok) return estado
    registrar(estado, {
      actor: jugador,
      tipo: 'carta-foco',
      elemento: elementoFoco,
      valor: carta.valor,
      unidadId: unidadFocoId,
      descripcion: `${jugador} jugó ${carta.elemento}${carta.valor} como Foco → ${elementoFoco} en ${unidadFocoId}`,
    })
    return estado
  }

  const carta = manejador.mano[indiceCarta]
  manejador.mano.splice(indiceCarta, 1)
  manejador.descarte.push(carta)
  manejador.po.push({ elemento: carta.elemento, cantidad: carta.valor })
  estado.cartaJugadaEsteTurno = true
  registrar(estado, {
    actor: jugador,
    tipo: 'carta-jugada',
    elemento: carta.elemento,
    valor: carta.valor,
    descripcion: `${jugador} jugó ${carta.elemento}${carta.valor} como Orden`,
  })
  return estado
}

function aplicarMover(estado, intencion) {
  const { jugador, unidadId, destino, gratuita = false } = intencion
  if (jugador !== estado.turnoDe) {
    registrar(estado, { actor: jugador, tipo: 'error', descripcion: `${jugador} no es el turno activo` })
    return estado
  }
  const unidad = estado.unidades.find(u => u.id === unidadId)
  if (!unidad || unidad.jugador !== jugador) {
    registrar(estado, { actor: jugador, tipo: 'error', descripcion: `MOVER inválido: unidad ${unidadId} no encontrada` })
    return estado
  }
  if (unidad.activacionCerrada) {
    registrar(estado, { actor: jugador, tipo: 'error', descripcion: `${unidadId} ya atacó este turno y no puede activarse` })
    return estado
  }
  const perfil = ARQUETIPOS[unidad.arquetipo]
  const ocupados = estado.unidades.filter(u => u.id !== unidadId)
  const dentro = (h) => dentroDeForma(estado.tablero.forma, h)
  const costeHex = costeHexTerreno(estado)
  const camino = caminoLibre(unidad.pos, destino, ocupados, bloqueadosParaMovimiento(estado), dentro, costeHex)
  if (!camino) {
    registrar(estado, { actor: jugador, tipo: 'error', descripcion: `MOVER inválido: no hay camino libre a (${destino.q},${destino.r})` })
    return estado
  }
  // D-29: el coste real del camino incluye el `costeExtra` de los tiles de
  // terreno (empalizada), no solo la distancia en pasos.
  const costeTotal = costeCamino(camino, costeHex)
  if (costeTotal > perfil.movimiento) {
    registrar(estado, { actor: jugador, tipo: 'error', descripcion: `MOVER inválido: el camino a (${destino.q},${destino.r}) cuesta ${costeTotal} y supera Movimiento ${perfil.movimiento}` })
    return estado
  }
  // D-27 (US-163) "Avalancha" (Tierra3): el bono de Mover gratis otorgado por la
  // carta se consume en el primer movimiento (coste 0, no toca el contador).
  // El flag explícito de gratuita (D-19) prevalece.
  const gratis = gratuita || (unidad.movimientoGratis || 0) > 0
  const coste = gratis ? 0 : costeProximaAccion(unidad, estado.reglas)
  const esActivacionBase = !gratis && coste === 0
  if (!gratis) {
    const gasto = gastarPO(estado.jugadores[jugador], coste)
    if (!gasto.ok) {
      registrar(estado, { actor: jugador, tipo: 'error', descripcion: `PO insuficientes: Mover cuesta ${coste} PO` })
      return estado
    }
    estado.jugadores[jugador].po = gasto.po
  }
  if (gratis && (unidad.movimientoGratis || 0) > 0) {
    unidad.movimientoGratis = Math.max(0, unidad.movimientoGratis - 1)
  }
  quitarMuro(unidad)
  unidad.pos = { ...destino }
  if (!gratis) {
    incrementarAcciones(unidad)
    if (esActivacionBase) marcarActivacionBaseUsada(unidad)
  }
  registrar(estado, {
    actor: jugador,
    tipo: 'movimiento',
    coste,
    unidadId,
    descripcion: `${unidadId} se movió a (${destino.q},${destino.r})` +
      (gratis ? ' (activación gratuita)' : ` pagando ${coste} PO`),
  })
  return estado
}

function aplicarAtacar(estado, intencion) {
  const {
    jugador, atacante, objetivo, tecnica, segundoObjetivo,
    dadosARepetir, cartaIndice, gratuita = false,
  } = intencion
  const error = (desc) => {
    registrar(estado, { actor: jugador, tipo: 'error', descripcion: desc })
    return estado
  }

  if (jugador !== estado.turnoDe) return error(`${jugador} no es el turno activo`)
  const atac = estado.unidades.find(u => u.id === atacante)
  if (!atac || atac.jugador !== jugador) return error(`ATACAR inválido: unidad ${atacante} no encontrada`)
  if (atac.activacionCerrada) return error(`${atacante} ya atacó este turno`)
  const def = estado.unidades.find(u => u.id === objetivo)
  if (!def || def.jugador === jugador) return error(`Objetivo ${objetivo} inválido`)

  // A-11-N1: el Rey no puede ser objetivo de ataque en la Ronda 1.
  if (estado.reglas.reyProtegidoRonda1 && estado.ronda === 1 && def.arquetipo === 'Rey') {
    return error('El Rey no puede ser objetivo en la Ronda 1')
  }

  const teniaRey = {
    A: estado.unidades.some(u => u.jugador === 'A' && u.arquetipo === 'Rey'),
    B: estado.unidades.some(u => u.jugador === 'B' && u.arquetipo === 'Rey'),
  }

  const chequeoRango = estaEnRangoYVista(estado, atac, def)
  if (!chequeoRango.ok) return error(`Ataque rechazado: ${chequeoRango.motivo}`)

  let segundo = null
  if (tecnica === 'DobleTiro') {
    if (!segundoObjetivo) return error('Doble Tiro requiere un segundo objetivo')
    segundo = estado.unidades.find(u => u.id === segundoObjetivo)
    if (!segundo || segundo.jugador === jugador) return error('segundo objetivo inválido')
    if (estado.reglas.reyProtegidoRonda1 && estado.ronda === 1 && segundo.arquetipo === 'Rey') {
      return error('El Rey no puede ser objetivo en la Ronda 1')
    }
    if (distancia(def.pos, segundo.pos) !== 1) {
      return error('Los objetivos de Doble Tiro deben ser adyacentes entre sí')
    }
    const r2 = estaEnRangoYVista(estado, atac, segundo)
    if (!r2.ok) return error(`Segundo objetivo rechazado: ${r2.motivo}`)
  }

  if (tecnica) {
    const carta = cartaIndice != null ? estado.jugadores[jugador].mano[cartaIndice] : null
    const chequeo = puedeDeclarar(atac, tecnica, { carta, cartaIndice, reglas: estado.reglas })
    if (!chequeo.ok) return error(`Técnica rechazada: ${chequeo.motivo}`)
  }

  const coste = gratuita ? 0 : costeProximaAccion(atac, estado.reglas)
  const esActivacionBase = !gratuita && coste === 0
  if (!gratuita) {
    const gasto = gastarPO(estado.jugadores[jugador], coste)
    if (!gasto.ok) return error(`PO insuficientes: Atacar cuesta ${coste} PO`)
    estado.jugadores[jugador].po = gasto.po
  }

  let consumidoTecnica = false
  if (tecnica) {
    const carta = cartaIndice != null ? estado.jugadores[jugador].mano[cartaIndice] : null
    const decl = declararTecnica(atac, tecnica, { carta, cartaIndice, reglas: estado.reglas })
    if (decl.ok) {
      atac.foco = decl.tokens
      if (cartaIndice != null) {
        const cartaAportada = estado.jugadores[jugador].mano[cartaIndice]
        estado.jugadores[jugador].mano.splice(cartaIndice, 1)
        estado.jugadores[jugador].descarte.push(cartaAportada)
      }
      consumidoTecnica = true
    }
  }

  quitarMuro(atac)

  // D-16: Reflujo se resuelve en dos pasos. La primera intención tira el pool
  // de ataque y deja la resolución en pausa; REFLEJAR_DADOS la completa.
  if (tecnica === 'Reflujo' && dadosARepetir === undefined) {
    const { atq, atqPoolFinal, umbral, topeCadena, atacanteStunned } = tiradaAtaque(estado, atacante, objetivo, { tecnica })
    estado.combatePendiente = {
      jugador,
      atacanteId: atacante,
      objetivoId: objetivo,
      tecnica,
      coste,
      gratuita,
      consumidoTecnica,
      teniaRey,
      atacanteStunned,
      atq,
      atqPoolFinal,
      umbral,
      topeCadena,
    }
    registrar(estado, {
      actor: jugador,
      tipo: 'tirada-ataque',
      descripcion: `${atacante} tiró su pool de ataque (${atqPoolFinal.dados}g${atqPoolFinal.keep}): ` +
        `${atq.dadosTirados.map(d => d.valores.join('+')).join(', ')} — Reflujo: elegí qué dados repetir`,
    })
    return estado
  }

  const objetivos = segundo ? [def, segundo] : [def]
  const resultados = objetivos.map(o =>
    resolverIntercambio(estado, atacante, o.id, { tecnica, dadosARepetir })
  )

  if (resultados.some(r => !r.ganaAtacante)) {
    aplicarConsecuenciasDerrota(estado, atacante, def.id)
  }

  return finalizarAtaque(estado, jugador, atacante, coste, tecnica, consumidoTecnica, teniaRey, gratuita, esActivacionBase)
}

function aplicarReflejarDados(estado, intencion) {
  const { jugador, dadosARepetir = [] } = intencion
  const pendiente = estado.combatePendiente
  const error = (desc) => {
    registrar(estado, { actor: jugador, tipo: 'error', descripcion: desc })
    return estado
  }

  if (!pendiente) return error('REFLEJAR_DADOS sin ataque con Reflujo pendiente')
  if (jugador !== estado.turnoDe) return error(`${jugador} no es el turno activo`)
  if (pendiente.jugador !== jugador) return error('El ataque pendiente no pertenece a este jugador')

  const invalidos = dadosARepetir.filter(i =>
    !Number.isInteger(i) || i < 0 || i >= pendiente.atq.dadosTirados.length
  )
  if (invalidos.length > 0) return error(`Índice de dado a repetir inválido: ${invalidos.join(', ')}`)

  const atqFinal = dadosARepetir.length > 0
    ? repetirDados(estado.rng, pendiente.atq, dadosARepetir, pendiente.umbral, pendiente.topeCadena)
    : pendiente.atq

  const { defPoolFinal, def, defensorStunned } = resolverTiradaDefensa(estado, pendiente.objetivoId, pendiente.tecnica)
  const resultado = finalizarIntercambio(
    estado, pendiente.atacanteId, pendiente.objetivoId,
    atqFinal, def, pendiente.atqPoolFinal, defPoolFinal,
    { atacanteStunned: pendiente.atacanteStunned, defensorStunned }
  )
  if (resultado && !resultado.ganaAtacante) {
    aplicarConsecuenciasDerrota(estado, pendiente.atacanteId, pendiente.objetivoId)
  }

  estado.combatePendiente = null
  return finalizarAtaque(
    estado, jugador, pendiente.atacanteId,
    pendiente.coste, pendiente.tecnica, pendiente.consumidoTecnica, pendiente.teniaRey, pendiente.gratuita, false
  )
}

function finalizarAtaque(estado, jugador, atacanteId, coste, tecnica, consumidoTecnica, teniaRey, gratuita, esActivacionBase) {
  const atac = estado.unidades.find(u => u.id === atacanteId)
  if (atac) {
    // D-19: la activación gratuita no incrementa el contador 1/3/5/9,
    // pero cierra igual la activación de la unidad (FR-033).
    if (!gratuita) {
      incrementarAcciones(atac)
      if (esActivacionBase) marcarActivacionBaseUsada(atac)
    }
    cerrarActivacion(atac)
  }

  registrar(estado, {
    actor: jugador,
    tipo: 'accion',
    coste,
    unidadId: atacanteId,
    ...(consumidoTecnica ? { tecnica } : {}),
    descripcion: `${atacanteId} atacó${gratuita ? ' (activación gratuita)' : ` pagando ${coste} PO`}` +
      (consumidoTecnica ? ` con ${tecnica}` : ''),
  })

// D-25 (US-161): Fuego puede matar al objetivo; verificar victoria.
  verificarVictoriaYRegistrar(estado, teniaRey)

  return estado
}

// Verifica victoria por eliminación total o muerte del Rey y la registra.
// `teniaRey` es el estado de Reyes antes de la acción: solo se declara muerte del
// Rey si el Rey existía (los tests usan planteles sin Rey y no deben ganar por eso).
function verificarVictoriaYRegistrar(estado, teniaRey) {  let victoria = verificarVictoria(estado)
  if (!victoria) {
    const tieneRey = {
      A: estado.unidades.some(u => u.jugador === 'A' && u.arquetipo === 'Rey'),
      B: estado.unidades.some(u => u.jugador === 'B' && u.arquetipo === 'Rey'),
    }
    if (teniaRey?.A && !tieneRey.A) {
      victoria = { ganador: 'B', motivo: 'muerte del Rey' }
    } else if (teniaRey?.B && !tieneRey.B) {
      victoria = { ganador: 'A', motivo: 'muerte del Rey' }
    }
  }
  // D-33/D-35: la victoria por objetivos (umbral de estandartes o límite de
  // rondas) se evalúa solo si no hubo ya eliminación/Rey.
  if (!victoria) {
    victoria = verificarVictoriaObjetivos(estado)
  }
  if (victoria) {
    estado.ganador = victoria
    registrar(estado, {
      actor: 'SISTEMA',
      tipo: 'fin-partida',
      descripcion: `Gana ${victoria.ganador}: ${victoria.motivo}`,
    })
  }
  return victoria
}

// Chequea SOLO la victoria por objetivos (D-33/35) y la registra. No evalúa
// eliminación ni muerte del Rey: eso se decide al momento de la herida, y los
// fixtures de turno/round de los tests no tienen unidades en mesa.
function verificarVictoriaObjetivosYRegistrar(estado) {
  const victoria = verificarVictoriaObjetivos(estado)
  if (victoria) {
    estado.ganador = victoria
    registrar(estado, {
      actor: 'SISTEMA',
      tipo: 'fin-partida',
      descripcion: `Gana ${victoria.ganador}: ${victoria.motivo}`,
    })
  }
  return victoria
}

function aplicarDeclararTecnica(estado, intencion) {
  const { jugador, unidadId, tecnica, cartaIndice } = intencion
  if (jugador !== estado.turnoDe) {
    registrar(estado, { actor: jugador, tipo: 'error', descripcion: `${jugador} no es el turno activo` })
    return estado
  }
  const unidad = estado.unidades.find(u => u.id === unidadId)
  if (!unidad || unidad.jugador !== jugador) {
    registrar(estado, { actor: jugador, tipo: 'error', descripcion: `DECLARAR_TECNICA inválido: unidad ${unidadId} no encontrada` })
    return estado
  }
  const t = TECNICAS[tecnica]
  if (!t || t.tipo !== 'defensa') {
    registrar(estado, { actor: jugador, tipo: 'error', descripcion: `La Técnica ${tecnica} no es defensiva` })
    return estado
  }
  const carta = cartaIndice != null ? estado.jugadores[jugador].mano[cartaIndice] : null
  const chequeo = puedeDeclarar(unidad, tecnica, { carta, cartaIndice, reglas: estado.reglas })
  if (!chequeo.ok) {
    registrar(estado, { actor: jugador, tipo: 'error', descripcion: `Técnica rechazada: ${chequeo.motivo}` })
    return estado
  }
  const decl = declararTecnica(unidad, tecnica, { carta, cartaIndice, reglas: estado.reglas })
  if (decl.ok) {
    unidad.foco = decl.tokens
    if (cartaIndice != null) {
      const cartaAportada = estado.jugadores[jugador].mano[cartaIndice]
      estado.jugadores[jugador].mano.splice(cartaIndice, 1)
      estado.jugadores[jugador].descarte.push(cartaAportada)
    }
  }
  aplicarEfectoTecnica(unidad, tecnica)
  registrar(estado, {
    actor: jugador,
    tipo: 'tecnica',
    unidadId,
    tecnica,
    descripcion: `${unidadId} declara ${TECNICAS[tecnica].nombre}`,
  })
  return estado
}

function aplicarInteractuar(estado, intencion) {
  const { jugador, unidadId, hex } = intencion
  const error = (desc) => {
    registrar(estado, { actor: jugador, tipo: 'error', descripcion: desc })
    return estado
  }

  if (jugador !== estado.turnoDe) return error(`${jugador} no es el turno activo`)
  if (!estado.reglas.lugarHabilitado) return error('La mecánica Lugar está desactivada')

  const unidad = estado.unidades.find(u => u.id === unidadId)
  if (!unidad || unidad.jugador !== jugador) {
    return error(`INTERACTUAR inválido: unidad ${unidadId} no encontrada`)
  }
  if (unidad.activacionCerrada) {
    return error(`${unidadId} ya atacó este turno y no puede activarse`)
  }

  const lugar = (estado.tablero.lugares || [])
    .find(l => l.q === hex?.q && l.r === hex?.r)
  if (!lugar) return error(`No hay un Lugar en (${hex?.q},${hex?.r})`)
  const key = hexKey(lugar)
  if (estado.tablero.bloqueados.includes(key)) {
    return error(`El Lugar (${hex.q},${hex.r}) ya fue capturado`)
  }
  if (distancia(unidad.pos, lugar) > 1) {
    return error(`Debes estar sobre o adyacente al Lugar (${hex.q},${hex.r})`)
  }

  const coste = estado.reglas.costeCapturaLugar
  const gasto = gastarPO(estado.jugadores[jugador], coste)
  if (!gasto.ok) return error(`PO insuficientes: capturar el Lugar cuesta ${coste} PO`)
  estado.jugadores[jugador].po = gasto.po

  quitarMuro(unidad)
  estado.tablero.bloqueados.push(key)
  estado.puntosVictoria[jugador] += estado.reglas.lugarVpGanancia
  incrementarAcciones(unidad)
  registrar(estado, {
    actor: jugador,
    tipo: 'captura',
    coste,
    unidadId,
    valor: estado.reglas.lugarVpGanancia,
    detalle: { hex: hexKey(lugar) },
    descripcion: `${unidadId} capturó el Lugar (${hex.q},${hex.r})` +
      ` por ${coste} PO (+${estado.reglas.lugarVpGanancia} VP)`,
  })
  return estado
}

function aplicarCambiarReglas(estado, intencion) {
  const { jugador, reglas } = intencion
  const error = (desc) => {
    registrar(estado, { actor: jugador || 'SISTEMA', tipo: 'error', descripcion: desc })
    return estado
  }

  if (!reglas || typeof reglas !== 'object' || Array.isArray(reglas)) {
    return error('CAMBIAR_REGLAS inválido: se espera un objeto de reglas')
  }
  const invalidas = Object.keys(reglas).filter(k => !(k in REGLAS_POR_DEFECTO))
  if (invalidas.length > 0) {
    return error(`CAMBIAR_REGLAS inválido: claves desconocidas ${invalidas.join(', ')}`)
  }
  for (const [k, v] of Object.entries(reglas)) {
    if (typeof v !== typeof estado.reglas[k]) {
      return error(`CAMBIAR_REGLAS inválido: tipo de "${k}"`)
    }
  }

  estado.reglas = { ...estado.reglas, ...reglas }
  registrar(estado, {
    actor: jugador || 'SISTEMA',
    tipo: 'reglas',
    descripcion: `Reglas cambiadas: ${Object.entries(reglas).map(([k, v]) => `${k}=${JSON.stringify(v)}`).join(', ')}`,
  })
  return estado
}

function aplicarTerminarTurno(estado, intencion) {
  const { jugador } = intencion
  // La carta obligatoria es obligatoria solo si se tiene carta (FR-090). Con la
  // mano vacía no se puede jugar: se cede el turno (FR-091), en vez de trabarse.
  if (!estado.cartaJugadaEsteTurno && estado.jugadores[jugador].mano.length > 0) {
    registrar(estado, {
      actor: jugador,
      tipo: 'error',
      descripcion: `${jugador} debe jugar una carta antes de terminar el turno`,
    })
    return estado
  }

  const contrario = jugadorContrario(jugador)
  const poPerdidos = estado.jugadores[jugador].po.reduce((s, p) => s + p.cantidad, 0)
  estado.jugadores[jugador].po = []
  estado.cartaJugadaEsteTurno = false

  // D-34: metas de FIN DE TURNO (control del puente y cruce al lado enemigo).
  // Solo suman estandartes; la victoria por umbral la decide el chequeo de abajo.
  metasFinDeTurno(estado, jugador)
  verificarVictoriaObjetivosYRegistrar(estado)

  // D-05: ¿el contador 1/3/5/9 se reinicia por turno o por ronda?
  if (estado.reglas.reinicioContador === 'turno') {
    for (const u of estado.unidades) {
      if (u.jugador === jugador) {
        u.accionesEsteTurno = 0
        u.activacionCerrada = false
        u.activacionBaseUsada = false
      }
    }
  } else {
    for (const u of estado.unidades) {
      if (u.jugador === jugador) {
        u.activacionCerrada = false
      }
    }
  }

  if (poPerdidos > 0) {
    registrar(estado, {
      actor: jugador,
      tipo: 'po-perdidos',
      cantidad: poPerdidos,
      descripcion: `${jugador} perdió ${poPerdidos} PO sin gastar`,
    })
  }

  const ambosSinMano =
    estado.jugadores[jugador].mano.length === 0 &&
    estado.jugadores[contrario].mano.length === 0

  const partes = [`${jugador} terminó su turno`]
  if (poPerdidos > 0) partes.push(`perdió ${poPerdidos} PO`)

  if (ambosSinMano) {
    registrar(estado, { actor: jugador, tipo: 'fin-turno', descripcion: partes.join('. ') })
    iniciarNuevaRonda(estado, estado.jugadorInicial)
    registrar(estado, {
      actor: 'SISTEMA',
      tipo: 'fin-ronda',
      descripcion: `Comienza la ronda ${estado.ronda}. Juega ${estado.turnoDe}.`,
    })
    // D-35: límite de rondas — si ya se superó, decide la victoria ahora.
    verificarVictoriaObjetivosYRegistrar(estado)
    return estado
  }

  if (estado.jugadores[contrario].mano.length === 0) {
    estado.turnoDe = jugador
    partes.push(`${contrario} no puede jugar: se queda sin cartas`)
    registrar(estado, {
      actor: jugador,
      tipo: 'fin-turno',
      solitario: true,
      descripcion: partes.join('. '),
    })
    // FR-091/GDD: en solitario el jugador con mano continúa SIN robar, hasta
    // agotarla. Robar aquí rellenaría la mano y la ronda nunca terminaría.
    return estado
  }

  estado.turnoDe = contrario
  registrar(estado, { actor: jugador, tipo: 'fin-turno', descripcion: partes.join('. ') })
  robarCarta(estado, contrario)
  return estado
}
