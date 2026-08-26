// Terreno del mapa — capa 100 % presentacional en estilo Fire Emblem GBA.
// El motor no conoce el terreno: solo pinta. Determinista: misma semilla → mismo
// mapa (función pura de q, r y semilla). Nunca modifica reglas ni estados del
// juego (eso vive en src/engine y src/data). Ver skill estilo-mapa-tactico.
//
// Dos fuentes de verdad visual:
// - ESCENARIOS CON MATRIZ (plantillas 15×10): `terrenoDe` recibe el mapa de
//   biomas del escenario (`estado.tablero.terreno`, key axial → tipo) y pinta
//   cada hex con su bioma (agua/bosque/montaña/camino/prado). Determinista por
//   definición: la matriz es dato fijo.
// - ESCENARIO BASE (sin matriz): terreno organizado POR REGIÓN por semilla —
//   río central en la fila r=0 (agua; los vados abiertos se pintan como camino),
//   dos caminos N-S que cruzan por los vados, bosque al NO, montaña al SE, y
//   prado dominante con acentos dispersos.
//
// Lo bloqueado solo pinta: las reglas de paso y LoS viven en el motor
// (tablero.bloqueados / tablero.bloqueaMovimientoSinLos).

// Hash determinista por coordenada (sin RNG, sin estado).
function hash(q, r, sal) {
  return ((((q * 73856093) ^ (r * 19349663)) >>> 0) + sal * 7919) >>> 0
}

// Deriva un número de la semilla (string) para poder mezclarla en el hash.
function seedNumero(semilla) {
  let h = 2166136261
  for (let i = 0; i < semilla.length; i++) {
    h ^= semilla.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

export const TIPOS_TERRENO = [
  'prado', 'bosque', 'agua', 'montaña', 'camino', 'ruina', 'bloqueado', 'corona',
]

// Distancia radial (norma cúbica) desde el centro del tablero.
export function radioHex(q, r) {
  return (Math.abs(q) + Math.abs(r) + Math.abs(q + r)) / 2
}

// Terreno del TABLERO jugable (rect 15×10) y del MUNDO de escenario (isla).
// `bloqueado` respeta estado.tablero.bloqueados; `enTablero` distingue los hexes
// jugables (regiones del mapa) del escenario de alrededor (isla genérica).
// `mapaTerreno` (opcional) es la matriz de biomas del escenario (key axial →
// tipo visual): si viene y el hex es jugable, la matriz manda — la plantilla
// pinta su diseño, no la región por semilla.
export function terrenoDe(q, r, semilla, bloqueado = false, enTablero = false, mapaTerreno = null) {
  const s = seedNumero(String(semilla))

  // Mundo de escenario (fuera del tablero jugable): isla genérica sin río ni
  // caminos, con bosques y ruinas dispersos y manchas de camino.
  if (!enTablero) {
    const j = (hash(q, r, s + 71) % 1000) / 1000
    if (hash(q, r, s + 61) % 41 < 1) return 'ruina'
    if (hash(q, r, s + 51) % 23 < 1) return 'bosque'
    return j < 0.18 ? 'camino' : 'prado'
  }

  // Plantilla con matriz de biomas: la matriz es la fuente de verdad visual
  // (agua, bosque, montaña, vado= camino, pradera). Cubre los 150 hexes.
  if (mapaTerreno) {
    const tipo = mapaTerreno[`${q},${r}`]
    if (tipo) return tipo
  }

  // Bloqueados: el río (r=0) se pinta agua, el bosque NO y la montaña SE como
  // su acento; el resto de bloqueados mantiene el aspecto de terreno agotado.
  if (bloqueado) {
    if (r === 0) return 'agua'
    if (r <= -2 && q <= -5) return 'bosque'
    if (r >= 2 && q >= 1) return 'montaña'
    return 'bloqueado'
  }

  // Vados y caminos: la fila del río (r=0) y las columnas de los vados (q=0 y
  // q=-6) se pintan camino para que se lea el cruce.
  if (r === 0) return 'camino'
  if (q === 0 || q === -6) return 'camino'

  // Prado dominante con bosques y ruinas dispersos (determinista por semilla).
  if (hash(q, r, s + 51) % 23 < 1) return 'bosque'
  if (hash(q, r, s + 61) % 41 < 1) return 'ruina'
  return 'prado'
}

// Terreno del MUNDO (escenario que rodea al tablero jugable). Reusa terrenoDe
// para la isla y fuerza mar más allá de su borde, de modo que el tablero sea un
// continente en el océano y no un mapa encajonado. Pura presentación.
export function terrenoEscena(q, r, semilla, radioMundo = 12) {
  const d = radioHex(q, r)
  if (d <= radioMundo) return terrenoDe(q, r, semilla, false, false)
  return 'agua'
}
