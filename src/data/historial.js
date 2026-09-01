const STORAGE_KEY = 'escaramuza_historial'
const MAX_PARTIDAS = 100

export function cargarHistorial() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []
  } catch {
    return []
  }
}

export function guardarPartida(resultado) {
  const historial = cargarHistorial()
  historial.unshift({
    id: Date.now(),
    fecha: new Date().toISOString(),
    semilla: resultado.semilla,
    escenario: resultado.escenario,
    faccionA: resultado.faccionA,
    faccionB: resultado.faccionB,
    ganador: resultado.ganador,
    motivo: resultado.motivo,
    rondas: resultado.rondas,
    eliminacionesA: resultado.eliminacionesA,
    eliminacionesB: resultado.eliminacionesB,
    modoSolitario: resultado.modoSolitario,
  })
  if (historial.length > MAX_PARTIDAS) historial.length = MAX_PARTIDAS
  localStorage.setItem(STORAGE_KEY, JSON.stringify(historial))
  return historial
}

export function estadisticasJugador() {
  const h = cargarHistorial()
  if (h.length === 0) return null
  const victoriasA = h.filter(p => p.ganador === 'A').length
  const porFaccion = {}
  for (const p of h) {
    const faccion = p.ganador === 'A' ? p.faccionA : p.faccionB
    porFaccion[faccion] = (porFaccion[faccion] || 0) + 1
  }
  return {
    totalPartidas: h.length,
    victoriasA,
    victoriasB: h.length - victoriasA,
    porcentajeVictoriasA: Math.round((victoriasA / h.length) * 100),
    rondasPromedio: Math.round(h.reduce((s, p) => s + p.rondas, 0) / h.length * 10) / 10,
    faccionMasUsada: Object.entries(porFaccion).sort((a, b) => b[1] - a[1])[0]?.[0],
    ultimaPartida: h[0],
  }
}

export function limpiarHistorial() {
  localStorage.removeItem(STORAGE_KEY)
}
