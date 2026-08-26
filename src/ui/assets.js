// Registro de assets generados (guía de Midjourney/Niji en docs/assets-guia.md).
// Vacío por defecto: la beta corre con placeholders SVG (glifos). Cuando exista
// el PNG en public/assets/units/, registrar acá su nombre y el token lo usa con
// fallback onError al glifo si el archivo falta en runtime.
export const ASSETS_UNIDADES = {
  'fuego_Peon': 'fuego_peon.png',
  'fuego_Alfil': 'fuego_alfil.png',
  'fuego_Torre': 'fuego_torre.png',
  'fuego_Caballo': 'fuego_caballo.png',
  'fuego_Campeon': 'fuego_campeon.png',
  'fuego_Rey': 'fuego_rey.png',
  'agua_Peon': 'agua_peon.png',
  'agua_Alfil': 'agua_alfil.png',
  'agua_Torre': 'agua_torre.png',
  'agua_Caballo': 'agua_caballo.png',
  'agua_Campeon': 'agua_campeon.png',
  'agua_Rey': 'agua_rey.png',
  'tierra_Peon': 'tierra_peon.png',
  'tierra_Alfil': 'tierra_alfil.png',
  'tierra_Torre': 'tierra_torre.png',
  'tierra_Caballo': 'tierra_caballo.png',
  'tierra_Campeon': 'tierra_campeon.png',
  'tierra_Rey': 'tierra_rey.png',
  'aire_Peon': 'aire_peon.png',
  'aire_Alfil': 'aire_alfil.png',
  'aire_Torre': 'aire_torre.png',
  'aire_Caballo': 'aire_caballo.png',
  'aire_Campeon': 'aire_campeon.png',
  'aire_Rey': 'aire_rey.png',
}

export const ASSETS_ESTADOS = {
  // 'Stunned': '/assets/estados/stunned.png',
  // 'Muro': '/assets/estados/muro.png',
}

export function assetUnidad(faccion, arquetipo) {
  const nombre = ASSETS_UNIDADES[`${String(faccion).toLowerCase()}_${arquetipo}`]
  return nombre ? `/assets/units/${nombre}` : null
}

// D-24/25 (US-160/161): arte de la carta por elemento. PNG en public/assets/cartas/.
// Si falta el archivo, la carta dibuja su glifo/cresta SVG de placeholder (fallback).
export const ASSETS_CARTAS = {
  Fuego: 'fuego.png',
  Agua: 'agua.png',
  Aire: 'aire.png',
  Tierra: 'tierra.png',
  Vacio: 'vacio.png',
}

export function assetCarta(elemento) {
  const nombre = ASSETS_CARTAS[elemento]
  return nombre ? `/assets/cartas/${nombre}` : null
}
