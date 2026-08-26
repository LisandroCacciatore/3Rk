import { ARQUETIPOS } from '../data/archetypes.js'

export function capacidadFoco(unidad) {
  return ARQUETIPOS[unidad.arquetipo].foco
}

export function puedeRecibirToken(unidad) {
  return unidad.foco.length < capacidadFoco(unidad)
}

export function agregarToken(unidad, elemento) {
  if (!puedeRecibirToken(unidad)) {
    return { ok: false, motivo: 'capacidad de Foco completa' }
  }
  unidad.foco.push({ elemento })
  return { ok: true }
}

export function quitarTokenFoco(unidad, cantidad = 1) {
  let quitados = 0
  for (let i = 0; i < cantidad; i++) {
    if (unidad.foco.length === 0) break
    unidad.foco.pop()
    quitados += 1
  }
  return quitados
}

export function totalFoco(unidad) {
  return unidad.foco.length
}

export function cantidadPorElemento(unidad) {
  const conteo = {}
  for (const token of unidad.foco) {
    conteo[token.elemento] = (conteo[token.elemento] || 0) + 1
  }
  return conteo
}