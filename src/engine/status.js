export const STUNNED = 'Stunned'

export function tieneStunned(unidad) {
  return unidad.estados.includes(STUNNED)
}

export function poolConStunned(unidad, pool, reglas) {
  if (!tieneStunned(unidad)) return pool
  const min = reglas.stunnedMinimoUnDado ? 1 : 0
  if (reglas.stunnedDuro) {
    return { ...pool, dados: Math.max(min, pool.dados - 1), keep: Math.max(1, pool.keep - 1) }
  }
  if (reglas.stunnedReduceKept) {
    return { ...pool, keep: Math.max(1, pool.keep - 1) }
  }
  return { ...pool, dados: Math.max(min, pool.dados - 1) }
}

export function consumirStunned(unidad) {
  const idx = unidad.estados.indexOf(STUNNED)
  if (idx >= 0) unidad.estados.splice(idx, 1)
}

export function agregarStunned(unidad) {
  if (!unidad.estados.includes(STUNNED)) {
    unidad.estados.push(STUNNED)
  }
}
