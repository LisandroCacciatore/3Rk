// Fondo del tablero como imagen con fallback al gradiente CSS. Mientras el PNG no
// existe, .board-container usa su degradado marrón actual (estilo pergamino). Un
// solo sondeo (probe) gracias a un cache de módulo. Presentacional: el motor no
// importa este módulo.
import { useSyncExternalStore } from 'react'

const BASE = `${import.meta.env?.BASE_URL || '/'}`.replace(/\/$/, '')

export const ASSETS_FONDOS = {
  tablero: `${BASE}/assets/fondos/tablero.png`,
}

const cache = new Map() // ruta -> 'pendiente' | 'ok' | 'no'
const listeners = new Set()

function emitir() {
  listeners.forEach((fn) => fn())
}

function sondear(ruta) {
  if (cache.has(ruta)) return
  cache.set(ruta, 'pendiente')
  const img = new Image()
  img.onload = () => {
    cache.set(ruta, 'ok')
    emitir()
  }
  img.onerror = () => {
    cache.set(ruta, 'no')
    emitir()
  }
  img.src = ruta
}

const suscribirse = (fn) => {
  listeners.add(fn)
  return () => listeners.delete(fn)
}
const getSnapshot = (ruta) => () => cache.get(ruta) === 'ok'

export function useFondo() {
  const ruta = ASSETS_FONDOS.tablero
  sondear(ruta)
  const ok = useSyncExternalStore(suscribirse, getSnapshot(ruta))
  return ok ? { url: ruta, backgroundImage: `url(${ruta})` } : null
}