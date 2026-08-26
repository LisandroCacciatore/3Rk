import { REGLAS_POR_DEFECTO } from '../data/rules.js'

export function costeProximaAccion(unidad, reglas) {
  const costesExtra = reglas?.costesAccionExtra ?? REGLAS_POR_DEFECTO.costesAccionExtra
  const baseGratis = reglas?.activacionBaseGratis ?? REGLAS_POR_DEFECTO.activacionBaseGratis

  if (baseGratis && !unidad.activacionBaseUsada) {
    return 0
  }
  const accionesExtra = unidad.accionesEsteTurno - (baseGratis && unidad.activacionBaseUsada ? 1 : 0)
  const idx = Math.min(Math.max(0, accionesExtra), costesExtra.length - 1)
  return costesExtra[idx]
}

export function marcarActivacionBaseUsada(unidad) {
  unidad.activacionBaseUsada = true
}

export function incrementarAcciones(unidad) {
  unidad.accionesEsteTurno += 1
}

export function cerrarActivacion(unidad) {
  unidad.activacionCerrada = true
}

export function resetearUnidad(unidad) {
  unidad.accionesEsteTurno = 0
  unidad.activacionCerrada = false
  unidad.activacionBaseUsada = false
}

export function resetearUnidades(unidades) {
  for (const u of unidades) {
    resetearUnidad(u)
  }
}