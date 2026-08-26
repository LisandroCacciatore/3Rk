// Colocación de sprites de unidad (PASO 3).
//
// Los PNG de public/assets/units/ miden 500×500 (potencia de 2), pero la figura
// real (bbox con alfa > 0) no llena el lienzo igual en todos: unos son altos y
// angostos, otros bajos y anchos, y algunos tienen el muñeco centrado mientras
// otros cargan a la izquierda/derecha. Las métricas se generan con
// `node scripts/medir-bbox.mjs` (devDependency pngjs) y se normalizan a una
// base de 500 px:
//   - cx     : centro X del bbox (px sobre 500) → alinea el cuerpo con el hex.
//   - bottom : borde inferior del bbox (px sobre 500) → ancla los pies.
//   - escala : factor que normaliza el ALTO visible a 42px (65-75% del hex de
//              60px).
//
// Re-medidos 13/08/2026 tras reexportar los 24 sprites (ahora con 4 facciones:
// fuego, agua, tierra, aire). Dato de presentación, no una regla: el motor no
// conoce estas métricas.
//
// PASO 6 — sprites ~35% más grandes sobre el tablero (11/08/2026): el alto
// normalizado pasa de 42px a ~54px. Factor de presentación, no una regla.
const ESCALA_SPRITE = 1.35
const SPRITES = {
  'fuego_Peon': { cx: 252.5, bottom: 442, escala: 0.101695 },
  'fuego_Alfil': { cx: 261, bottom: 487, escala: 0.0875 },
  'fuego_Torre': { cx: 250.5, bottom: 485, escala: 0.09375 },
  'fuego_Caballo': { cx: 244, bottom: 490, escala: 0.087683 },
  'fuego_Campeon': { cx: 252, bottom: 460, escala: 0.100719 },
  'fuego_Rey': { cx: 240.5, bottom: 492, escala: 0.087866 },
  'agua_Peon': { cx: 254.5, bottom: 420, escala: 0.112299 },
  'agua_Alfil': { cx: 242.5, bottom: 411, escala: 0.12069 },
  'agua_Torre': { cx: 241.5, bottom: 439, escala: 0.107692 },
  'agua_Caballo': { cx: 246, bottom: 448, escala: 0.100962 },
  'agua_Campeon': { cx: 249.5, bottom: 439, escala: 0.119658 },
  'agua_Rey': { cx: 252, bottom: 445, escala: 0.102439 },
  'tierra_Peon': { cx: 250, bottom: 484.57, escala: 0.087231 },
  'tierra_Alfil': { cx: 247, bottom: 495, escala: 0.087318 },
  'tierra_Torre': { cx: 258, bottom: 485, escala: 0.087318 },
  'tierra_Caballo': { cx: 262.5, bottom: 485, escala: 0.090323 },
  'tierra_Campeon': { cx: 249.5, bottom: 487, escala: 0.088421 },
  'tierra_Rey': { cx: 259.5, bottom: 495, escala: 0.088235 },
  'aire_Peon': { cx: 232.5, bottom: 486, escala: 0.088608 },
  'aire_Alfil': { cx: 260.5, bottom: 494, escala: 0.086242 },
  'aire_Torre': { cx: 249.5, bottom: 494.98, escala: 0.086074 },
  'aire_Caballo': { cx: 253, bottom: 499, escala: 0.084507 },
  'aire_Campeon': { cx: 239.5, bottom: 487, escala: 0.090323 },
  'aire_Rey': { cx: 252, bottom: 490, escala: 0.091703 },
}

// Devuelve el rectángulo SVG que dibuja el sprite recortado a su bbox real,
// anclando los pies en (anclaPiesX, anclaPiesY). anclaPiesY por defecto =
// centro.y + 2 (la elipse de sombra oscura bajo el token). null si el arquetipo
// no tiene métricas registradas (no hay asset → la UI usa el glifo).
export function spritePlacement(faccion, arquetipo, centro, anclaPies = centro.y + 2) {
  const s = SPRITES[`${String(faccion).toLowerCase()}_${arquetipo}`]
  if (!s) return null
  const escala = s.escala * ESCALA_SPRITE
  const lado = 500 * escala
  return {
    x: centro.x - s.cx * escala,
    y: anclaPies - s.bottom * escala,
    width: lado,
    height: lado,
  }
}