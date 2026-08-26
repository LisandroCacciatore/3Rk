export const ELEMENTOS = {
  Fuego: { simbolo: '🔥', color: '#ff6b4a' },
  Agua: { simbolo: '💧', color: '#4ab8ff' },
  Aire: { simbolo: '🌪️', color: '#3ec6c9' },
  Tierra: { simbolo: '🌍', color: '#c08a3e' },
  Vacio: { simbolo: '◼️', color: '#8a5ae0' },
}

export function simboloElemento(elemento) {
  return ELEMENTOS[elemento]?.simbolo || '?'
}

export function colorElemento(elemento) {
  return ELEMENTOS[elemento]?.color || '#999'
}

// Glow (resplandor) elemental como rgba: se usa en el hover del abanico para
// teñir el halo con el color del elemento. El hex de ELEMENTOS es #rrggbb.
export function colorGlowElemento(elemento) {
  const hex = ELEMENTOS[elemento]?.color
  if (!hex || hex.length !== 7) return 'rgba(201, 162, 79, 0.5)'
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, 0.55)`
}

export const NOMBRES_ESTADO = {
  Stunned: '💫 Stunned',
}

export function listarElementos() {
  return Object.keys(ELEMENTOS)
}
