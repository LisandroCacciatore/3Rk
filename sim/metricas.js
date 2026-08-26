// Derivación de métricas de playtest desde el log del motor.
// Vive en sim/ (fuera de src/) porque es instrumentación de análisis, no reglas.
// Solo lee estado.log, estado.ganador y estado.ronda: no modifica el motor.

const ARQUETIPOS_KEEP2 = ['Campeon', 'Rey']

export function globalTurnIndex(log) {
  // Cada evento hereda el número de turno global: cuenta cuántos fin-turno
  // pasaron antes de él. Útil para "turnos entre X e Y".
  let turno = 1
  return log.map((e) => {
    const t = turno
    if (e.tipo === 'fin-turno') turno += 1
    return { evento: e, turno: t }
  })
}

// US-106 — Métricas profundas por arquetipo, desde ambos lados del combate.
// Deriva exclusivamente del log (eventos 'ataque', 'eliminacion',
// 'concentracion', 'tecnica', 'accion') más el estado final para las unidades
// que sobreviven. No modifica el estado ni el motor.
//
// Convenciones:
// - vecesAtacando: ataques donde el arquetipo era el atacante.
// - dañoRealizado: heridas infligidas = ataques ganados por el arquetipo.
// - vecesDefendiendo: ataques donde el arquetipo era el defensor.
// - dañoRecibido: heridas recibidas = ataques ganados en su contra.
// - vecesDerrotado: eventos 'eliminacion' del arquetipo.
// - rondasSobrevividas: rondas completas vividas por unidad del arquetipo
//   (ronda de eliminación − 1 para las eliminadas, ronda de la partida para
//   las vivas), promediadas por unidad.
// - tecnicasUtilizadas: 'tecnica' defensiva + 'accion' con tecnica (ofensiva).
// - focoUtilizado: tokens de Foco acumulados vía Concentrarse (proxy del foco
//   gastado en técnicas; el log no registra el gasto por unidad).
export function arquetiposDePartida(estado) {
  const log = estado.log || []

  // Mapa unidadId -> { arquetipo, jugador }, construido desde el log y el
  // estado final (las eliminadas solo existen en el log).
  const infoUnidad = new Map()
  const setInfo = (id, arquetipo, jugador) => {
    if (!id) return
    const prev = infoUnidad.get(id) || {}
    infoUnidad.set(id, {
      arquetipo: arquetipo || prev.arquetipo,
      jugador: jugador || prev.jugador,
    })
  }
  for (const e of log) {
    if (e.tipo !== 'ataque' || !e.detalle) continue
    setInfo(e.detalle.atacante, e.detalle.arquetipoAtacante, e.actor)
    setInfo(
      e.detalle.defensor,
      e.detalle.arquetipoDefensor,
      e.actor === 'A' ? 'B' : e.actor === 'B' ? 'A' : null
    )
  }
  for (const e of log) {
    if (e.tipo === 'eliminacion' && e.detalle) {
      setInfo(e.unidadId, e.detalle.arquetipo, e.detalle.jugador)
    }
  }
  for (const u of estado.unidades || []) {
    setInfo(u.id, u.arquetipo, u.jugador)
  }

  const arquetipoDeId = (id) => (typeof id === 'string' ? id.split('-')[0] : null)

  const acum = {}
  const asegurar = (arquetipo) => {
    if (!acum[arquetipo]) {
      acum[arquetipo] = {
        vecesAtacando: 0,
        dañoRealizado: 0,
        vecesDefendiendo: 0,
        dañoRecibido: 0,
        vecesDerrotado: 0,
        rondasSobrevividas: [],
        tecnicasUtilizadas: 0,
        focoUtilizado: 0,
        porFaccion: {
          A: { vecesAtacando: 0, dañoRealizado: 0, vecesDefendiendo: 0, dañoRecibido: 0, vecesDerrotado: 0, rondasSobrevividas: [], tecnicasUtilizadas: 0, focoUtilizado: 0 },
          B: { vecesAtacando: 0, dañoRealizado: 0, vecesDefendiendo: 0, dañoRecibido: 0, vecesDerrotado: 0, rondasSobrevividas: [], tecnicasUtilizadas: 0, focoUtilizado: 0 },
        },
      }
    }
    return acum[arquetipo]
  }
  const agregar = (objetivo, campo, cantidad = 1) => {
    objetivo[campo] = (objetivo[campo] || 0) + cantidad
  }

  // Daño y participaciones desde los intercambios.
  for (const e of log) {
    if (e.tipo !== 'ataque' || !e.detalle) continue
    const at = arquetipoDeId(e.detalle.atacante) || e.detalle.arquetipoAtacante
    const def = arquetipoDeId(e.detalle.defensor) || e.detalle.arquetipoDefensor
    const ganaAtacante = e.detalle.resultado === 'gana ataque'
    const facAtacante = infoUnidad.get(e.detalle.atacante)?.jugador || e.actor
    const facDefensor = infoUnidad.get(e.detalle.defensor)?.jugador ||
      (e.actor === 'A' ? 'B' : e.actor === 'B' ? 'A' : null)

    if (at) {
      agregar(asegurar(at), 'vecesAtacando')
      agregar(asegurar(at).porFaccion[facAtacante] || {}, 'vecesAtacando')
      if (ganaAtacante) {
        agregar(asegurar(at), 'dañoRealizado')
        if (asegurar(at).porFaccion[facAtacante]) agregar(asegurar(at).porFaccion[facAtacante], 'dañoRealizado')
      }
    }
    if (def) {
      agregar(asegurar(def), 'vecesDefendiendo')
      if (asegurar(def).porFaccion[facDefensor]) agregar(asegurar(def).porFaccion[facDefensor], 'vecesDefendiendo')
      if (ganaAtacante) {
        agregar(asegurar(def), 'dañoRecibido')
        if (asegurar(def).porFaccion[facDefensor]) agregar(asegurar(def).porFaccion[facDefensor], 'dañoRecibido')
      }
    }
  }

  // Bajas, técnicas y foco.
  const rondaEliminacion = {}
  for (const e of log) {
    if (e.tipo !== 'eliminacion') continue
    rondaEliminacion[e.unidadId] = e.ronda
    const arq = arquetipoDeId(e.unidadId) || e.detalle?.arquetipo
    const fac = e.detalle?.jugador || infoUnidad.get(e.unidadId)?.jugador
    if (arq) {
      agregar(asegurar(arq), 'vecesDerrotado')
      if (asegurar(arq).porFaccion[fac]) agregar(asegurar(arq).porFaccion[fac], 'vecesDerrotado')
    }
  }
  for (const e of log) {
    if (e.tipo === 'tecnica' || (e.tipo === 'accion' && e.tecnica)) {
      const arq = arquetipoDeId(e.unidadId) || infoUnidad.get(e.unidadId)?.arquetipo
      const fac = e.actor || infoUnidad.get(e.unidadId)?.jugador
      if (arq) {
        agregar(asegurar(arq), 'tecnicasUtilizadas')
        if (asegurar(arq).porFaccion[fac]) agregar(asegurar(arq).porFaccion[fac], 'tecnicasUtilizadas')
      }
    }
    if (e.tipo === 'concentracion') {
      const arq = arquetipoDeId(e.unidadId) || infoUnidad.get(e.unidadId)?.arquetipo
      const fac = e.actor || infoUnidad.get(e.unidadId)?.jugador
      if (arq) {
        agregar(asegurar(arq), 'focoUtilizado')
        if (asegurar(arq).porFaccion[fac]) agregar(asegurar(arq).porFaccion[fac], 'focoUtilizado')
      }
    }
  }

  // Rondas sobrevividas por unidad, agregadas a su arquetipo y facción.
  const rondaPartida = estado.ronda || 1
  const unidadesConteo = new Set()
  for (const [id] of infoUnidad) unidadesConteo.add(id)
  for (const u of estado.unidades || []) unidadesConteo.add(u.id)
  for (const id of unidadesConteo) {
    const info = infoUnidad.get(id) || {}
    const arq = arquetipoDeId(id) || info.arquetipo
    if (!arq) continue
    const rondaFin = rondaEliminacion[id] ?? rondaPartida
    const sobrevividas = rondaFin > 0 ? rondaFin - 1 : rondaPartida
    asegurar(arq).rondasSobrevividas.push(sobrevividas)
    const fac = info.jugador
    if (fac && asegurar(arq).porFaccion[fac]) {
      asegurar(arq).porFaccion[fac].rondasSobrevividas.push(sobrevividas)
    }
  }

  const media = (lista) => (lista.length === 0 ? 0 : lista.reduce((s, v) => s + v, 0) / lista.length)
  const finalizar = (obj) => {
    const { rondasSobrevividas, porFaccion, ...resto } = obj
    return {
      ...resto,
      rondasSobrevividas: +media(rondasSobrevividas).toFixed(2),
      porFaccion: Object.fromEntries(
        Object.entries(porFaccion).map(([fac, v]) => [
          fac,
          { ...v, rondasSobrevividas: +media(v.rondasSobrevividas).toFixed(2) },
        ])
      ),
    }
  }

  return Object.fromEntries(Object.entries(acum).map(([a, v]) => [a, finalizar(v)]))
}

export function metricasDePartida(estado) {
  const log = estado.log || []
  const conTurno = globalTurnIndex(log)

  const ataques = log.filter((e) => e.tipo === 'ataque')
  const resultadoAtaque = (e) => (e.detalle?.resultado === 'gana ataque')

  const victoriasAtacante = ataques.filter(resultadoAtaque)
  const victoriasDefensor = ataques.filter((e) => !resultadoAtaque(e))

  // Watch point: Keep 2 domina. Tasa de victoria del atacante según arquetipo.
  const porArquetipo = (pred) => {
    const pool = ataques.filter(pred)
    const ganados = pool.filter(resultadoAtaque)
    return {
      intercambios: pool.length,
      victoriasAtacante: ganados.length,
      tasaAtacante: pool.length === 0 ? null : ganados.length / pool.length,
    }
  }
  const keep2 = porArquetipo((e) => ARQUETIPOS_KEEP2.includes(e.detalle?.arquetipoAtacante))
  const resto = porArquetipo((e) => !ARQUETIPOS_KEEP2.includes(e.detalle?.arquetipoAtacante))

  // Watch point: curva de acciones inerte. A-11-N3 (05/08/2026): la curva pasó
  // de 1/3/5/9 a 1/2/3/5, así que la 2ª acción cuesta 2 PO, la 3ª 3 PO y la 4ª 5 PO.
  const acciones = log.filter((e) => ['accion', 'movimiento', 'concentracion'].includes(e.tipo))
  const porCoste = (c) => acciones.filter((e) => e.coste === c).length
  const segundaAccion = porCoste(2)
  const terceraAccion = porCoste(3)
  const cuartaAccion = porCoste(5)
  const turnosJugados = log.filter((e) => e.tipo === 'fin-turno').length || 1
  const accionesCaras = terceraAccion + cuartaAccion

  // Watch point: ritmo del Foco. Primer token -> primera Técnica.
  const primerToken = conTurno.find(({ evento }) => evento.tipo === 'concentracion')
  const primeraTecnica = conTurno.find(({ evento }) =>
    evento.tipo === 'tecnica' || (evento.tipo === 'accion' && evento.tecnica)
  )
  const turnosPrimerTokenAPrimeraTecnica =
    primerToken && primeraTecnica
      ? Math.max(0, primeraTecnica.turno - primerToken.turno)
      : null

  // Watch point: asimetría de tempo. Turnos en solitario y quién ganó.
  const solitarios = log.filter((e) => e.tipo === 'fin-turno' && e.solitario)
  const solitariosA = solitarios.filter((e) => e.actor === 'A').length
  const solitariosB = solitarios.filter((e) => e.actor === 'B').length
  const ganador = estado.ganador?.ganador ?? null
  const victoriaConSolitarios = ganador
    ? solitarios.filter((e) => e.actor === ganador).length
    : 0

  // Watch point: Rey anticlimático. Ronda de muerte de cada Rey.
  const muertesRey = log.filter((e) => e.tipo === 'eliminacion' && e.detalle?.arquetipo === 'Rey')
  const rondaMuerteReyA = muertesRey.find((e) => e.detalle?.jugador === 'A')?.ronda ?? null
  const rondaMuerteReyB = muertesRey.find((e) => e.detalle?.jugador === 'B')?.ronda ?? null

  // Watch point: Stunned. Tasa de victoria según estado Stunned en la tirada.
  const atacanteStunned = ataques.filter((e) => e.detalle?.atacanteStunned)
  const defensorStunned = ataques.filter((e) => e.detalle?.defensorStunned)
  const tasa = (pool, gana) => (pool.length === 0 ? null : pool.filter(gana).length / pool.length)

  // Ítem E / A-11-N5: cuánto gatilla el retroceso del defensor por diferencia >= 2.
  const retrocesosDefensor = log.filter((e) => e.tipo === 'retroceso-defensor').length
  const victoriasDiferencia2 = ataques.filter((e) => {
    const d = e.detalle
    return d?.resultado === 'gana ataque' && d.sumaAtaque - d.sumaDefensa >= 2
  }).length

  // Explosiones: un dado con '+' en su representación explotó.
  const conExplosion = ataques.filter((e) =>
    (e.detalle?.dadosAtaque || []).some((d) => d.includes('+')) ||
    (e.detalle?.dadosDefensa || []).some((d) => d.includes('+'))
  )

  // Heridas por arquetipo del atacante, normalizadas por ataques.
  const heridasPorArquetipo = {}
  for (const e of ataques) {
    const a = e.detalle?.arquetipoAtacante
    if (!a) continue
    heridasPorArquetipo[a] = heridasPorArquetipo[a] || { heridas: 0, ataques: 0 }
    heridasPorArquetipo[a].ataques += 1
    if (resultadoAtaque(e)) heridasPorArquetipo[a].heridas += 1
  }
  const heridasNormalizadas = Object.fromEntries(
    Object.entries(heridasPorArquetipo).map(([a, v]) => [
      a,
      v.ataques === 0 ? null : v.heridas / v.ataques,
    ])
  )

  const poGenerados = log
    .filter((e) => e.tipo === 'carta-jugada')
    .reduce((s, e) => s + (e.valor || 0), 0)
  const poGastados = acciones.reduce((s, e) => s + (e.coste || 0), 0)
  const poPerdidos = log
    .filter((e) => e.tipo === 'po-perdidos')
    .reduce((s, e) => s + (e.cantidad || 0), 0)

  const tokensFocoGenerados = log.filter((e) => e.tipo === 'concentracion').length
  const tecnicasUsadas = log.filter((e) =>
    e.tipo === 'tecnica' || (e.tipo === 'accion' && e.tecnica)
  ).length

  return {
    rondas: estado.ronda,
    ganador,
    motivoVictoria: estado.ganador?.motivo ?? null,
    causaVictoria: estado.ganador?.motivo ?? null,
    rondaMuerteReyA,
    rondaMuerteReyB,
    poGenerados,
    poGastados,
    poPerdidos,
    segundaAccion,
    terceraAccion,
    cuartaAccion,
    pctAccionesCaras: (accionesCaras / turnosJugados) * 100,
    tokensFocoGenerados,
    tecnicasUsadas,
    turnosPrimerTokenAPrimeraTecnica,
    turnosSolitariosA: solitariosA,
    turnosSolitariosB: solitariosB,
    turnosSolitarios: solitarios.length,
    victoriaConSolitarios,
    intercambios: ataques.length,
    victoriasAtacante: victoriasAtacante.length,
    victoriasDefensor: victoriasDefensor.length,
    tasaAtacanteGlobal: tasa(ataques, resultadoAtaque),
    keep2,
    resto,
    atacanteStunned: {
      intercambios: atacanteStunned.length,
      tasaVictoria: tasa(atacanteStunned, resultadoAtaque),
    },
    defensorStunned: {
      intercambios: defensorStunned.length,
      tasaVictoria: tasa(defensorStunned, (e) => !resultadoAtaque(e)),
    },
    retrocesosDefensor,
    victoriasDiferencia2,
    explosiones: {
      intercambiosConExplosion: conExplosion.length,
      frecuencia: ataques.length === 0 ? null : conExplosion.length / ataques.length,
    },
    heridasPorArquetipo: heridasNormalizadas,
    arquetipos: arquetiposDePartida(estado),
  }
}
