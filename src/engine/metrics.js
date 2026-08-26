// Métricas de playtest a partir del registro. Miran los watch points del GDD:
  // PO perdidos sin gastar, coste de acciones altas (3ª/4ª), turnos en solitario
  // y ronda de muerte de cada Rey.
  export function metricasDePartida(estado) {
    const log = estado.log || []

    const poPerdidos = log
      .filter(e => e.tipo === 'po-perdidos')
      .reduce((s, e) => s + (e.cantidad || 0), 0)

    // Con la nueva curva extra [2,4], las acciones "caras" son las que cuestan >= 4 PO
    // (2ª extra = 4 PO, 3ª extra = 4 PO)
    const accionesCaras = log.filter(e =>
      ['accion', 'movimiento'].includes(e.tipo) && (e.coste || 0) >= 4
    ).length

  const turnosSolitarios = log.filter(e => e.tipo === 'fin-turno' && e.solitario).length

  const rondaMuerteReyA = log
    .find(e => e.tipo === 'eliminacion' && e.detalle?.arquetipo === 'Rey' && e.detalle?.jugador === 'A')
    ?.ronda ?? null
  const rondaMuerteReyB = log
    .find(e => e.tipo === 'eliminacion' && e.detalle?.arquetipo === 'Rey' && e.detalle?.jugador === 'B')
    ?.ronda ?? null

  const totalHeridas = log.filter(e => e.tipo === 'herida').length
  const totalEliminaciones = log.filter(e => e.tipo === 'eliminacion').length
  const ataques = log.filter(e => e.tipo === 'ataque').length

  return {
    poPerdidos,
    accionesCaras,
    turnosSolitarios,
    rondaMuerteReyA,
    rondaMuerteReyB,
    totalHeridas,
    totalEliminaciones,
    ataques,
  }
}
