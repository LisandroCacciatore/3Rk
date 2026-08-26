import { tirarPool, tirarD10 } from './dice.js'
import { ARQUETIPOS } from '../data/archetypes.js'
import { distancia, hayLoS, buscarRetroceso, modAtacanteTerreno } from './hex.js'
import { poolConStunned, tieneStunned, consumirStunned, agregarStunned } from './status.js'
import { agregarEvento } from './log.js'
import { otorgarBaja } from './objetivos.js'

export function poolAtaque(unidad) {
  const perfil = ARQUETIPOS[unidad.arquetipo]
  const pool = { dados: perfil.ataque.dados, keep: perfil.ataque.kept }
  // D-25 (US-161) Aire: bono de pool consumible otorgado por una carta como
  // Habilidad ("🌪️ a la próxima tirada de ataque"). Se consume al tirar.
  if ((unidad.bonoPoolAtaque || 0) > 0) {
    pool.dados += unidad.bonoPoolAtaque
  }
  return pool
}

export function poolDefensa(unidad) {
  const perfil = ARQUETIPOS[unidad.arquetipo]
  const pool = { dados: perfil.defensa.dados, keep: perfil.defensa.kept }
  // D-27 (US-163) Aire2 "Brisa": bono de pool defensivo consumible otorgado por
  // una carta como Habilidad. Se suma al pool y se consume al tirar.
  if ((unidad.bonoPoolDefensa || 0) > 0) {
    pool.dados += unidad.bonoPoolDefensa
  }
  if (unidad.efectos.includes('Muro')) {
    pool.keep += 1
  }
  return pool
}

export function estaEnRangoYVista(estado, atacante, defensor) {
  const perfil = ARQUETIPOS[atacante.arquetipo]
  const rango = perfil.rango
  if (distancia(atacante.pos, defensor.pos) > rango) {
    return { ok: false, motivo: 'fuera de rango' }
  }
  if (!hayLoS(estado, atacante.pos, defensor.pos)) {
    return { ok: false, motivo: 'sin línea de visión' }
  }
  return { ok: true }
}

// D-17: el tope de cadena de la explosión es el nivel de Foco del que tira
// (un dado explotado se repite hasta `foco` veces), salvo que la conmutable
// `explosionTopePorFoco` esté apagada, en cuyo caso se usa el tope fijo de D-13.
export function topeCadenaPara(estado, unidad) {
  if (estado.reglas.explosionTopePorFoco) {
    return ARQUETIPOS[unidad.arquetipo].foco + 1
  }
  return estado.reglas.explosionTopeCadena
}

// Resuelve SOLO la tirada de ataque. Es la primera mitad de un intercambio:
// útil para pausar la resolución cuando Reflujo pide elegir dados (D-16).
export function tiradaAtaque(estado, atacanteId, defensorId, opciones = {}) {
  const { tecnica } = opciones
  const rng = estado.rng
  const atacante = estado.unidades.find((u) => u.id === atacanteId)
  const defensor = estado.unidades.find((u) => u.id === defensorId)

  const atqPool = poolAtaque(atacante)
  // D-25 (US-161) Aire: el bono de pool de la carta-habilidad se consume en la
  // primera tirada de ataque en la que participa el canalizador.
  if ((atacante.bonoPoolAtaque || 0) > 0) {
    atacante.bonoPoolAtaque = 0
  }
  let umbral = estado.reglas.explosionUmbralPorDefecto
  if (tecnica === 'Explosion') {
    atqPool.dados += 1
    umbral = estado.reglas.explosionUmbralExplosion
  }
  // D-31 (empalizada): si la línea de ataque atraviesa un hex con modAtacante
  // negativo, el atacante resta 1 dado al pool (mínimo 1).
  const modTerreno = modAtacanteTerreno(estado, atacante.pos, defensor.pos)
  if (modTerreno < 0) {
    atqPool.dados = Math.max(1, atqPool.dados + modTerreno)
  }
  const topeCadena = topeCadenaPara(estado, atacante)
  const atacanteStunned = tieneStunned(atacante)
  const atqPoolFinal = poolConStunned(atacante, atqPool, estado.reglas)
  if (atqPoolFinal.dados <= 0) atqPoolFinal.dados = 1
  const atq = tirarPool(rng, atqPoolFinal.dados, atqPoolFinal.keep, umbral, topeCadena)
  if (tieneStunned(atacante)) consumirStunned(atacante)

  return { atacante, defensor, atq, atqPoolFinal, umbral, topeCadena, atacanteStunned }
}

export function repetirDados(rng, tirada, indices, umbral, topeCadena) {
  const nuevos = tirada.dadosTirados.map((d, i) =>
    indices.includes(i) ? tirarD10(rng, umbral, topeCadena) : d,
  )
  const ordenados = [...nuevos].sort((a, b) => b.valorTotal - a.valorTotal)
  const kept = ordenados.slice(0, tirada.kept.length)
  return {
    dadosTirados: nuevos,
    kept,
    suma: kept.reduce((a, b) => a + b.valorTotal, 0),
  }
}

// Resuelve la tirada de defensa y devuelve su pool final y sus dados.
export function resolverTiradaDefensa(estado, defensorId, tecnica) {
  const rng = estado.rng
  const defensor = estado.unidades.find((u) => u.id === defensorId)

  // D-14: Disipar anula la Técnica defensiva activa O reduce 1 guardado, nunca ambos.
  const teniaMuro = defensor.efectos.includes('Muro')
  if (tecnica === 'Disipar' && teniaMuro) {
    defensor.efectos = defensor.efectos.filter((e) => e !== 'Muro')
  }
  let defPool = poolDefensa(defensor)
  if (tecnica === 'Disipar' && !teniaMuro) {
    defPool.keep = Math.max(1, defPool.keep - 1)
  }
  // D-27 (US-163): Bonos/disipado otorgados por carta-habilidad, consumibles en
  // la primera tirada de defensa. Espejo del consumo de bonoPoolAtaque.
  if ((defensor.bonoPoolDefensa || 0) > 0) {
    defensor.bonoPoolDefensa = 0
  }
  if ((defensor.disipadoDefensa || 0) > 0) {
    defPool.keep = Math.max(1, defPool.keep - 1)
    defensor.disipadoDefensa = Math.max(0, defensor.disipadoDefensa - 1)
  }
  const topeCadena = topeCadenaPara(estado, defensor)
  const defensorStunned = tieneStunned(defensor)
  const defPoolFinal = poolConStunned(defensor, defPool, estado.reglas)
  if (defPoolFinal.dados <= 0) defPoolFinal.dados = 1
  const def = tirarPool(rng, defPoolFinal.dados, defPoolFinal.keep, estado.reglas.explosionUmbralPorDefecto, topeCadena)
  if (tieneStunned(defensor)) consumirStunned(defensor)

  return { defPool, defPoolFinal, def, defensorStunned }
}

// Segunda mitad del intercambio: compara sumas, aplica herida/eliminación,
// registra el evento 'ataque' con el detalle completo.
export function finalizarIntercambio(estado, atacanteId, defensorId, atq, def, atqPoolFinal, defPoolFinal, flags = {}) {
  const atacante = estado.unidades.find((u) => u.id === atacanteId)
  const defensor = estado.unidades.find((u) => u.id === defensorId)
  if (!atacante || !defensor) return null

  const ganaAtacante = atq.suma > def.suma
  const eventos = []

  if (ganaAtacante) {
    defensor.heridas += 1
    eventos.push({ tipo: 'herida', unidadId: defensor.id, descripcion: `${defensor.id} recibe 1 herida (${defensor.heridas}/${defensor.maxVida})` })
    // D-12: ¿el defensor puede quedar Stunned? Arranque: no (perder la defensa solo cuesta la herida).
    if (!estado.reglas.defensorNoQuedaStunned) {
      agregarStunned(defensor)
      eventos.push({ tipo: 'stunned', unidadId: defensor.id, descripcion: `${defensor.id} queda Stunned` })
    }
    if (defensor.heridas >= defensor.maxVida) {
      const jugadorDefensor = defensor.jugador
      const arquetipoDefensor = defensor.arquetipo
      estado.unidades = estado.unidades.filter((u) => u.id !== defensor.id)
      // D-34: +1 estandarte al bando del que causó la baja.
      otorgarBaja(estado, defensor)
      eventos.push({ tipo: 'eliminacion', unidadId: defensor.id, descripcion: `${defensor.id} fue eliminado`, detalle: { arquetipo: arquetipoDefensor, jugador: jugadorDefensor } })
    } else if (estado.reglas.retrocesoDefensorDiferencia2 && atq.suma - def.suma >= 2) {
      // A-11-N5 (Ítem E): ganar por diferencia >= 2 empuja 1 hex al defensor
      // (además de la herida). Si no hay hex libre, se queda (espejo de D-06).
      const hex = buscarRetroceso(defensor.pos, atacante.pos, estado)
      if (hex) {
        defensor.pos = hex
        eventos.push({ tipo: 'retroceso-defensor', unidadId: defensor.id, descripcion: `${defensor.id} retrocede a (${hex.q},${hex.r})` })
      } else {
        eventos.push({ tipo: 'retroceso-defensor', unidadId: defensor.id, descripcion: `${defensor.id} no puede retroceder` })
      }
    }
  } else {
    eventos.push({ tipo: 'derrota', unidadId: atacante.id, descripcion: `${atacante.id} pierde el intercambio` })
  }

  const detalle = {
    atacante: atacanteId,
    defensor: defensorId,
    arquetipoAtacante: atacante.arquetipo,
    arquetipoDefensor: defensor.arquetipo,
    atacanteStunned: flags.atacanteStunned || false,
    defensorStunned: flags.defensorStunned || false,
    poolAtaque: `${atqPoolFinal.dados}g${atqPoolFinal.keep}`,
    dadosAtaque: atq.dadosTirados.map((d) => d.valores.join('+')),
    keptAtaque: atq.kept.map((d) => d.valorTotal),
    sumaAtaque: atq.suma,
    poolDefensa: `${defPoolFinal.dados}g${defPoolFinal.keep}`,
    dadosDefensa: def.dadosTirados.map((d) => d.valores.join('+')),
    keptDefensa: def.kept.map((d) => d.valorTotal),
    sumaDefensa: def.suma,
    resultado: ganaAtacante ? 'gana ataque' : 'gana defensa',
  }

  estado.log = agregarEvento(estado.log, {
    ronda: estado.ronda,
    actor: atacante.jugador,
    tipo: 'ataque',
    descripcion: `${atacante.id} ataca a ${defensor.id}: ${detalle.resultado} (${atq.suma} vs ${def.suma})`,
    detalle,
  }, estado.turnoDe)

  for (const evento of eventos) {
    estado.log = agregarEvento(estado.log, {
      ronda: estado.ronda,
      actor: atacante.jugador,
      tipo: evento.tipo,
      descripcion: evento.descripcion,
      ...(evento.unidadId !== undefined ? { unidadId: evento.unidadId } : {}),
      ...(evento.detalle ? { detalle: evento.detalle } : {}),
    }, estado.turnoDe)
  }

  return { ganaAtacante, eventos, detalle }
}

export function resolverIntercambio(estado, atacanteId, defensorId, opciones = {}) {
  const { tecnica, dadosARepetir = [] } = opciones
  const { atq, atqPoolFinal, umbral, topeCadena, atacanteStunned } = tiradaAtaque(estado, atacanteId, defensorId, opciones)

  let atqFinal = atq
  if (tecnica === 'Reflujo' && dadosARepetir.length > 0) {
    atqFinal = repetirDados(estado.rng, atq, dadosARepetir, umbral, topeCadena)
  }

  const { defPoolFinal, def, defensorStunned } = resolverTiradaDefensa(estado, defensorId, tecnica)
  return finalizarIntercambio(estado, atacanteId, defensorId, atqFinal, def, atqPoolFinal, defPoolFinal, {
    atacanteStunned,
    defensorStunned,
  })
}

export function aplicarConsecuenciasDerrota(estado, atacanteId, defensorId) {
  const atacante = estado.unidades.find((u) => u.id === atacanteId)
  const defensor = estado.unidades.find((u) => u.id === defensorId)
  if (!atacante || !defensor) return

  const retroceso = buscarRetroceso(atacante.pos, defensor.pos, estado)
  if (retroceso) {
    atacante.pos = retroceso
    estado.log = agregarEvento(estado.log, {
      ronda: estado.ronda,
      actor: atacante.jugador,
      tipo: 'retroceso',
      unidadId: atacante.id,
      descripcion: `${atacante.id} retrocede a (${retroceso.q},${retroceso.r})`,
    }, estado.turnoDe)
  } else {
    estado.log = agregarEvento(estado.log, {
      ronda: estado.ronda,
      actor: atacante.jugador,
      tipo: 'retroceso',
      unidadId: atacante.id,
      descripcion: `${atacante.id} no puede retroceder`,
    }, estado.turnoDe)
  }
  agregarStunned(atacante)
  estado.log = agregarEvento(estado.log, {
    ronda: estado.ronda,
    actor: atacante.jugador,
    tipo: 'stunned',
    unidadId: atacante.id,
    descripcion: `${atacante.id} queda Stunned`,
  }, estado.turnoDe)
}
