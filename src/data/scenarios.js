import { hexKey } from '../engine/hex.js'

// ═══════════════════════════════════════════════════════════════════════════
// Escenarios del prototipo. El escenario es DATO: el motor solo conoce
// `tablero.forma`, `tablero.bloqueados`, `tablero.bloqueaMovimientoSinLos`,
// `tablero.lugares` y `estado.escenario`. El terreno visual (src/ui/terreno.js)
// lo pinta la UI según `escenario.terreno` (matriz de biomas) y es 100 %
// cosmético. Nunca se hardcodea una regla acá.
//
// D-28 (aprobado, playtest 11/08/2026): el agua bloquea el MOVIMIENTO pero NO
// la línea de visión (los arqueros disparan a través del río). El flag
// conmutable `aguaBloqueaLoS` (data/rules.js) rebloquea el LoS si se activa.
// Por eso las matrices separan `bloqueados` (bosque/montaña: impasable + LoS)
// de `bloqueaMovimientoSinLos` (agua: solo impasable).
//
// NOTA SOBRE LAS PLANTILLAS: los mapas 1 (Valle) y 3 (Encrucijada) llegaron con
// 30 celdas corruptas en el chat (U+FFFD) y se reconstruyeron según el diseño
// original del dueño (patrón de celdas supervivientes + concepto de cada mapa).
// Verificar visualmente en el navegador antes de usarlos como data de playtest.
// ═══════════════════════════════════════════════════════════════════════════

// Símbolo → comportamiento de paso + tipo visual. `paso` es dato de escenario
// que el motor usa; `visual` lo usa la capa de terreno (presentación).
export const SIMBOLO_TERRENO = {
  '🟩': { visual: 'prado', paso: 'libre' },
  '🌉': { visual: 'camino', paso: 'libre' }, // vado: cruce libre
  '🌁': { visual: 'puente', paso: 'libre' }, // D-30: puente = cruce libre sobre agua
  '🪵': { visual: 'empalizada', paso: 'libre' }, // D-31: coste +1, -1 dado (reglasTerreno)
  '🌲': { visual: 'bosque', paso: 'bloqueado' },
  '⛰️': { visual: 'montaña', paso: 'bloqueado' },
  '🌊': { visual: 'agua', paso: 'agua' }, // impasable, LoS abierto (D-28)
}

// Inversa de `generarTableroRect` (engine/hex.js): matriz (col, row) → axial
// con el offset odd-r del rectángulo. Sin esto, los bloqueados caen en hexes
// equivocados a partir de la fila 1.
function aAxial(col, row, columnas, filas) {
  const qShift = Math.floor(columnas / 2)
  const rShift = Math.floor(filas / 2)
  return { q: col - Math.floor(row / 2) - qShift, r: row - rShift }
}

// US-171: Despliegue Simétrico Estilo Ajedrez (6 unidades por bando)
function desplieguePorDefecto(columnas, filas) {
  // A: filas 0 y 1 (Norte)
  const posicionesA = [
    { col: 7, row: 0 }, // Rey
    { col: 6, row: 0 }, // Campeon
    { col: 8, row: 0 }, // Alfil
    { col: 4, row: 0 }, // Torre
    { col: 10, row: 0 }, // Caballo
    { col: 7, row: 1 }, // Peon
  ]
  
  // B: filas 9 y 8 (Sur, asume 10 filas, pero lo hacemos general)
  const rB = filas - 1
  const posicionesB = [
    { col: 7, row: rB }, // Rey
    { col: 6, row: rB }, // Campeon
    { col: 8, row: rB }, // Alfil
    { col: 4, row: rB }, // Torre
    { col: 10, row: rB }, // Caballo
    { col: 7, row: rB - 1 }, // Peon
  ]

  return {
    A: posicionesA.map(p => aAxial(p.col, p.row, columnas, filas)),
    B: posicionesB.map(p => aAxial(p.col, p.row, columnas, filas)),
  }
}

export function cargarEscenario(nombre, matriz, extras = {}) {
  const columnas = matriz[0].length
  const filas = matriz.length
  const bloqueados = []
  const bloqueaMovimientoSinLos = []
  const terreno = {}

  matriz.forEach((fila, row) => {
    fila.forEach((simbolo, col) => {
      const h = aAxial(col, row, columnas, filas)
      const key = hexKey(h)
      const config = SIMBOLO_TERRENO[simbolo] || SIMBOLO_TERRENO['🟩']
      terreno[key] = config.visual
      if (config.paso === 'bloqueado') bloqueados.push(key)
      else if (config.paso === 'agua') bloqueaMovimientoSinLos.push(key)
    })
  })

  const escenario = {
    nombre,
    concepto: extras.concepto || '',
    forma: { tipo: 'rect', columnas, filas },
    bloqueados,
    bloqueaMovimientoSinLos,
    terreno,
    lugares: extras.lugares || [],
    despliegue: extras.despliegue || desplieguePorDefecto(columnas, filas),
  }

  // D-33 (aprobado 12/08/2026): objetivos de victoria. `extras.objetivos.puente`
  // es el hex {q,r} a controlar; `extras.objetivos.ladoEnemigo` lista, por bando,
  // las FILAS de la matriz que cuentan como lado enemigo. Se expanden a las keys
  // de todos los hexes transitables de esas filas (para la meta de cruce).
  if (extras.objetivos) {
    const ladoEnemigo = { A: [], B: [] }
    matriz.forEach((fila, row) => {
      fila.forEach((simbolo, col) => {
        const h = aAxial(col, row, columnas, filas)
        const config = SIMBOLO_TERRENO[simbolo] || SIMBOLO_TERRENO['🟩']
        if (config.paso === 'bloqueado' || config.paso === 'agua') return
        const key = hexKey(h)
        for (const bando of ['A', 'B']) {
          if ((extras.objetivos.ladoEnemigo?.[bando] || []).includes(row)) {
            ladoEnemigo[bando].push(key)
          }
        }
      })
    })
    escenario.objetivos = {
      puente: extras.objetivos.puente,
      ladoEnemigo,
    }
  }

  return escenario
}

export const ESCENARIO_BASE = {
  // D-26 — tablero rectangular 15×10 (150 hexes). Los bloqueos son DATOS de
  // escenario (tablero.bloqueados): el motor solo conoce forma + bloqueados,
  // nunca el terreno. El terreno visual (terreno.js) pinta por región y sigue
  // siendo 100 % cosmético. Sin `terreno` (matriz): la UI lo genera por semilla.
  forma: { tipo: 'rect', columnas: 15, filas: 10 },
  // Río central en la fila r=0 (15 hexes) con DOS vados libres (q=0 y q=-6)
  // para cruzar; bloques de bosque (NO) y montaña (SE) de 5 hexes cada uno
  // como acentos tácticos. Verificado con BFS: los 25 pares despliegue-A↔
  // despliegue-B quedan conectados y ningún hex de despliegue queda tapado.
  bloqueados: [
    // Río (r=0) menos los vados (0,0) y (-6,0) → 13 hexes.
    '-9,0', '-8,0', '-7,0', '-5,0', '-4,0', '-3,0', '-2,0', '-1,0', '1,0', '2,0', '3,0', '4,0', '5,0',
    // Bosque NO.
    '-7,-3', '-6,-3', '-7,-2', '-6,-2', '-5,-2',
    // Montaña SE.
    '1,2', '2,2', '3,2', '1,3', '2,3',
  ],
  // El escenario base no tiene agua distinta de sus bloqueados: sin
  // `bloqueaMovimientoSinLos` y sin matriz de biomas (terreno por semilla).
  bloqueaMovimientoSinLos: [],
  terreno: null,
  // D-26 — lugares: posiciones estratégicas disputadas (captura: 2 PO fijos,
  // +1 VP y la casilla se agota a bloqueado). Centro y ambos flancos del río.
  lugares: [
    { q: 0, r: -1 },
    { q: -6, r: 1 },
    { q: 2, r: 1 },
  ],
  despliegue: desplieguePorDefecto(15, 10),
}

// ═══ Plantillas 15×10 (150 hexes). Un símbolo por celda, fila de arriba hacia
// abajo: R0 = despliegue A, R9 = despliegue B. ═══════════════════════════════

// 1. El Valle de los Dos Vados — río diagonal con dos cruces (vados 🌉).
export const MATRIZ_VALLE_VADOS = [
  ['🟩', '🟩', '🟩', '🟩', '🟩', '🟩', '🟩', '🟩', '🟩', '🟩', '🟩', '🟩', '🟩', '🟩', '🟩'],
  ['🌲', '🌲', '🟩', '🟩', '🟩', '🟩', '🟩', '🟩', '🟩', '🟩', '🟩', '🟩', '🌲', '🌲', '🌲'],
  ['🌲', '🟩', '🟩', '🟩', '🌊', '🌊', '🌉', '🌊', '🌊', '🌊', '🟩', '🟩', '🟩', '🌲', '🌲'],
  ['🟩', '🟩', '🟩', '🌊', '🌊', '🟩', '🟩', '🟩', '🌊', '🌊', '🌊', '🟩', '🟩', '🟩', '🟩'],
  ['🟩', '🟩', '🌊', '🌊', '🟩', '🟩', '🟩', '🟩', '🟩', '🌊', '🌊', '🌊', '🟩', '🟩', '🟩'],
  ['🟩', '🟩', '🌊', '🌊', '🌊', '🟩', '🟩', '🟩', '🟩', '🟩', '🌊', '🌊', '🟩', '🟩', '🟩'],
  ['🟩', '🟩', '🟩', '🌊', '🌊', '🌊', '🟩', '🟩', '🟩', '🌉', '🌊', '🌊', '🟩', '🟩', '🟩'],
  ['🌲', '🌲', '🟩', '🟩', '🌊', '🌊', '🌊', '🌊', '🌊', '🌊', '🟩', '🟩', '🟩', '🌲', '🌲'],
  ['🌲', '🌲', '🌲', '🟩', '🟩', '🟩', '🟩', '🟩', '🟩', '🟩', '🟩', '🟩', '🟩', '🌲', '🌲'],
  ['🟩', '🟩', '🟩', '🟩', '🟩', '🟩', '🟩', '🟩', '🟩', '🟩', '🟩', '🟩', '🟩', '🟩', '🟩'],
]

// 2. La Garganta del Dragón — cañón central estrecho entre macizos y bosques.
export const MATRIZ_GARGANTA_DRAGON = [
  ['🟩', '🟩', '🟩', '🟩', '🟩', '🟩', '🟩', '🟩', '🟩', '🟩', '🟩', '🟩', '🟩', '🟩', '🟩'],
  ['🌲', '🌲', '🌲', '🟩', '🟩', '🟩', '🟩', '🟩', '🟩', '🟩', '🟩', '🟩', '🌲', '🌲', '🌲'],
  ['⛰️', '⛰️', '🌲', '🌲', '🟩', '🟩', '🟩', '🟩', '🟩', '🟩', '🟩', '🌲', '🌲', '⛰️', '⛰️'],
  ['⛰️', '⛰️', '⛰️', '🟩', '🟩', '🟩', '🟩', '🟩', '🟩', '🟩', '🟩', '🟩', '⛰️', '⛰️', '⛰️'],
  ['⛰️', '⛰️', '🟩', '🟩', '🟩', '🌲', '🌲', '🟩', '🌲', '🌲', '🟩', '🟩', '🟩', '⛰️', '⛰️'],
  ['⛰️', '⛰️', '🟩', '🟩', '🟩', '🌲', '🌲', '🟩', '🌲', '🌲', '🟩', '🟩', '🟩', '⛰️', '⛰️'],
  ['⛰️', '⛰️', '⛰️', '🟩', '🟩', '🟩', '🟩', '🟩', '🟩', '🟩', '🟩', '🟩', '⛰️', '⛰️', '⛰️'],
  ['⛰️', '⛰️', '🌲', '🌲', '🟩', '🟩', '🟩', '🟩', '🟩', '🟩', '🟩', '🌲', '🌲', '⛰️', '⛰️'],
  ['🌲', '🌲', '🌲', '🟩', '🟩', '🟩', '🟩', '🟩', '🟩', '🟩', '🟩', '🟩', '🌲', '🌲', '🌲'],
  ['🟩', '🟩', '🟩', '🟩', '🟩', '🟩', '🟩', '🟩', '🟩', '🟩', '🟩', '🟩', '🟩', '🟩', '🟩'],
]

// 3. La Encrucijada de los Tres Carriles — dos bloques de bosque dividen el
// mapa en tres calles verticales. RECONSTRUIDO (ver nota al inicio del archivo).
export const MATRIZ_TRES_CARRILES = [
  ['🟩', '🟩', '🟩', '🟩', '🟩', '🟩', '🟩', '🟩', '🟩', '🟩', '🟩', '🟩', '🟩', '🟩', '🟩'],
  ['🟩', '🟩', '🟩', '🟩', '🟩', '🟩', '🟩', '🟩', '🟩', '🟩', '🟩', '🟩', '🟩', '🟩', '🟩'],
  ['🟩', '🟩', '🌲', '🌲', '🌲', '🌲', '🟩', '🟩', '🟩', '🌲', '🌲', '🌲', '🌲', '🟩', '🟩'],
  ['🟩', '🟩', '🌲', '🌲', '🌲', '🌲', '🟩', '🟩', '🟩', '🌲', '🌲', '🌲', '🌲', '🟩', '🟩'],
  ['🟩', '🟩', '🌲', '🌲', '🌲', '🌲', '🟩', '🟩', '🟩', '🌲', '🌲', '🌲', '🌲', '🟩', '🟩'],
  ['🟩', '🟩', '🌲', '🌲', '🌲', '🌲', '🟩', '🟩', '🟩', '🌲', '🌲', '🌲', '🌲', '🟩', '🟩'],
  ['🟩', '🟩', '🌲', '🌲', '🌲', '🌲', '🟩', '🟩', '🟩', '🌲', '🌲', '🌲', '🌲', '🟩', '🟩'],
  ['🟩', '🟩', '🌲', '🌲', '🌲', '🌲', '🟩', '🟩', '🟩', '🌲', '🌲', '🌲', '🌲', '🟩', '🟩'],
  ['🟩', '🟩', '🟩', '🟩', '🟩', '🟩', '🟩', '🟩', '🟩', '🟩', '🟩', '🟩', '🟩', '🟩', '🟩'],
  ['🟩', '🟩', '🟩', '🟩', '🟩', '🟩', '🟩', '🟩', '🟩', '🟩', '🟩', '🟩', '🟩', '🟩', '🟩'],
]

// 4. Las Ruinas del Bastión — fortaleza de montaña con patio interior. Lleva
// los 3 lugares (santuarios) de este mapa: dentro del patio, disputados.
export const MATRIZ_RUINAS_BASTION = [
  ['🟩', '🟩', '🟩', '🟩', '🟩', '🟩', '🟩', '🟩', '🟩', '🟩', '🟩', '🟩', '🟩', '🟩', '🟩'],
  ['🌲', '🌲', '🟩', '🟩', '🟩', '🟩', '🟩', '🟩', '🟩', '🟩', '🟩', '🟩', '🟩', '🌲', '🌲'],
  ['🌲', '🟩', '🟩', '🟩', '🟩', '⛰️', '⛰️', '🟩', '⛰️', '⛰️', '🟩', '🟩', '🟩', '🟩', '🌲'],
  ['🟩', '🟩', '🟩', '🟩', '⛰️', '🟩', '🟩', '🟩', '🟩', '🟩', '⛰️', '🟩', '🟩', '🟩', '🟩'],
  ['🟩', '🟩', '🟩', '⛰️', '🟩', '🟩', '🟩', '🟩', '🟩', '🟩', '🟩', '⛰️', '🟩', '🟩', '🟩'],
  ['🟩', '🟩', '🟩', '⛰️', '🟩', '🟩', '🟩', '🟩', '🟩', '🟩', '🟩', '⛰️', '🟩', '🟩', '🟩'],
  ['🟩', '🟩', '🟩', '🟩', '⛰️', '🟩', '🟩', '🟩', '🟩', '🟩', '⛰️', '🟩', '🟩', '🟩', '🟩'],
  ['🌲', '🟩', '🟩', '🟩', '🟩', '⛰️', '⛰️', '🟩', '⛰️', '⛰️', '🟩', '🟩', '🟩', '🟩', '🌲'],
  ['🌲', '🌲', '🟩', '🟩', '🟩', '🟩', '🟩', '🟩', '🟩', '🟩', '🟩', '🟩', '🟩', '🌲', '🌲'],
  ['🟩', '🟩', '🟩', '🟩', '🟩', '🟩', '🟩', '🟩', '🟩', '🟩', '🟩', '🟩', '🟩', '🟩', '🟩'],
]

// 5. Los Humedales del Sur — islas y terreno fragmentado, dominado por el agua.
export const MATRIZ_HUMEDALES = [
  ['🟩', '🟩', '🟩', '🟩', '🟩', '🟩', '🟩', '🟩', '🟩', '🟩', '🟩', '🟩', '🟩', '🟩', '🟩'],
  ['🟩', '🟩', '🟩', '🟩', '🌊', '🌊', '🌊', '🟩', '🟩', '🟩', '🟩', '🟩', '🟩', '🟩', '🟩'],
  ['🌲', '🌲', '🟩', '🌊', '🌊', '🟩', '🟩', '🟩', '🌊', '🌊', '🟩', '🟩', '🌲', '🌲', '🌲'],
  ['🌲', '🟩', '🟩', '🟩', '🟩', '🟩', '🌊', '🌊', '🌊', '🟩', '🟩', '🟩', '🟩', '🌲', '🌲'],
  ['🟩', '🟩', '🌊', '🌊', '🟩', '🟩', '🟩', '🟩', '🟩', '🟩', '🌊', '🌊', '🟩', '🟩', '🟩'],
  ['🟩', '🟩', '🌊', '🌊', '🟩', '🟩', '🟩', '🟩', '🟩', '🟩', '🌊', '🌊', '🟩', '🟩', '🟩'],
  ['🌲', '🌲', '🟩', '🟩', '🟩', '🌊', '🌊', '🌊', '🟩', '🟩', '🟩', '🟩', '🟩', '🌲', '🌲'],
  ['🌲', '🌲', '🌲', '🟩', '🟩', '🌊', '🌊', '🟩', '🟩', '🟩', '🌊', '🌊', '🟩', '🌲', '🌲'],
  ['🟩', '🟩', '🟩', '🟩', '🟩', '🟩', '🟩', '🟩', '🌊', '🌊', '🌊', '🟩', '🟩', '🟩', '🟩'],
  ['🟩', '🟩', '🟩', '🟩', '🟩', '🟩', '🟩', '🟩', '🟩', '🟩', '🟩', '🟩', '🟩', '🟩', '🟩'],
]

// 6. Río Tajii — campo de batalla del río (D-29…D-36). 13×9 (117 hexes).
// RÍO LONGITUDINAL (vertical) que cruza el mapa por el centro con TRES cruces:
// dos vados 🌉 (norte y sur) y un puente 🌁 central (el objetivo de victoria,
// D-33/34). Los flancos del puente están protegidos por dos empalizadas 🪵
// (coste +1 al cruzar, -1 dado al atacar a través; D-31) y hay bosques 🌲 en
// las esquinas. El lado "enemigo" de cada bando es la mitad del tablero al
// otro lado del río (meta de cruce, D-34).
export const MATRIZ_RIO_TAJII = [
  ['🟩', '🟩', '🟩', '🟩', '🟩', '🟩', '🟩', '🟩', '🟩', '🟩', '🟩', '🟩', '🟩'],
  ['🌲', '🟩', '🟩', '🟩', '🟩', '🟩', '🌊', '🟩', '🟩', '🟩', '🟩', '🟩', '🌲'],
  ['🌲', '🟩', '🟩', '🟩', '🟩', '🟩', '🌉', '🟩', '🟩', '🟩', '🟩', '🟩', '🌲'],
  ['🟩', '🟩', '🟩', '🟩', '🟩', '🟩', '🌊', '🟩', '🟩', '🟩', '🟩', '🟩', '🟩'],
  ['🟩', '🟩', '🟩', '🟩', '🪵', '🟩', '🌁', '🟩', '🪵', '🟩', '🟩', '🟩', '🟩'],
  ['🟩', '🟩', '🟩', '🟩', '🟩', '🟩', '🌊', '🟩', '🟩', '🟩', '🟩', '🟩', '🟩'],
  ['🟩', '🟩', '🟩', '🟩', '🟩', '🟩', '🌉', '🟩', '🟩', '🟩', '🟩', '🟩', '🟩'],
  ['🌲', '🟩', '🟩', '🟩', '🟩', '🟩', '🌊', '🟩', '🟩', '🟩', '🟩', '🟩', '🌲'],
  ['🟩', '🟩', '🟩', '🟩', '🟩', '🟩', '🟩', '🟩', '🟩', '🟩', '🟩', '🟩', '🟩'],
]

// 3 lugares dentro del patio de la fortaleza (Ruinas del Bastión): hexes que la
// matriz deja libres (R3/R4/R5, columna 7). No se pisan con despliegues.
const LUGARES_RUINAS = [
  { q: -2, r: -1 }, // R4 C7
  { q: -1, r: -2 }, // R3 C7
  { q: -2, r: 0 },  // R5 C7
]

// Catálogo de escenarios de plantilla, con su concepto para el selector de UI.
export const ESCENARIOS = [
  { id: 'base', nombre: 'Base (río y vados)', concepto: 'Escenario base: río central, dos vados, bloques de bosque/montaña y 3 lugares.' },
  { id: 'valle-vados', nombre: 'El Valle de los Dos Vados', concepto: 'Río diagonal con dos cruces: cuellos de botella y tiro a través del agua (D-28).' },
  { id: 'garganta-dragon', nombre: 'La Garganta del Dragón', concepto: 'Paso de montaña: cañón central estrecho que premia la defensa en bloque.' },
  { id: 'encrucijada', nombre: 'La Encrucijada de los Tres Carriles', concepto: 'Tres calles verticales: dividir tropas y maniobras envolventes.' },
  { id: 'ruinas-bastion', nombre: 'Las Ruinas del Bastión', concepto: 'Fortaleza con patio y 3 santuarios: rey de la colina y captura de puntos.' },
  { id: 'humedales', nombre: 'Los Humedales del Sur', concepto: 'Islas y terreno fragmentado: movilidad y rango dominan.' },
  { id: 'rio-tajii', nombre: 'Río Tajii', concepto: 'Campo de batalla del río: cruces disputados, puente central y victoria por estandartes (D-33/34/35).' },
  { id: 'sandbox-horda', nombre: 'Sandbox: Horda vs Élite', concepto: 'Ejército asimétrico: 3 unidades de élite vs 12 Peones (Solitario ideal).' },
]

const ESCENARIOS_POR_ID = {
  base: ESCENARIO_BASE,
  'valle-vados': cargarEscenario('valle-vados', MATRIZ_VALLE_VADOS, {
    concepto: 'Río diagonal con dos cruces: cuellos de botella y tiro a través del agua (D-28).',
  }),
  'garganta-dragon': cargarEscenario('garganta-dragon', MATRIZ_GARGANTA_DRAGON, {
    concepto: 'Paso de montaña: cañón central estrecho que premia la defensa en bloque.',
  }),
  'encrucijada': cargarEscenario('encrucijada', MATRIZ_TRES_CARRILES, {
    concepto: 'Tres calles verticales: dividir tropas y maniobras envolventes.',
  }),
  'ruinas-bastion': cargarEscenario('ruinas-bastion', MATRIZ_RUINAS_BASTION, {
    concepto: 'Fortaleza con patio y 3 santuarios: rey de la colina y captura de puntos.',
    lugares: LUGARES_RUINAS,
  }),
  'humedales': cargarEscenario('humedales', MATRIZ_HUMEDALES, {
    concepto: 'Islas y terreno fragmentado: movilidad y rango dominan.',
  }),
  'rio-tajii': cargarEscenario('rio-tajii', MATRIZ_RIO_TAJII, {
    concepto: 'Campo de batalla del río: cruces disputados, puente central y victoria por estandartes (D-33/34/35).',
    // D-33 (aprobado 12/08/2026): objetivos de victoria. `puente` es el hex del
    // puente central (matriz C6 R4 → axial {-2,0}). `ladoEnemigo` marca las
    // filas de la matriz que cada bando considera "lado enemigo": para A, la
    // mitad sur del río (filas 5-8); para B, la mitad norte (filas 0-3).
    objetivos: {
      puente: { q: -2, r: 0 },
      ladoEnemigo: {
        A: [5, 6, 7, 8],
        B: [0, 1, 2, 3],
      },
    },
  }),
  'sandbox-horda': {
    ...ESCENARIO_BASE,
    nombre: 'sandbox-horda',
    concepto: 'Ejército asimétrico: 3 unidades de élite vs 12 Peones (Solitario ideal).',
    despliegue: {
      A: [
        { arquetipo: 'Rey', q: 0, r: -4 },
        { arquetipo: 'Campeon', q: -1, r: -4 },
        { arquetipo: 'Alfil', q: 1, r: -5 },
      ],
      B: [
        { arquetipo: 'Peon', q: 0, r: 4 }, { arquetipo: 'Peon', q: -1, r: 4 },
        { arquetipo: 'Peon', q: 1, r: 4 }, { arquetipo: 'Peon', q: -2, r: 4 },
        { arquetipo: 'Peon', q: -4, r: 3 }, { arquetipo: 'Peon', q: -3, r: 3 },
        { arquetipo: 'Peon', q: -2, r: 3 }, { arquetipo: 'Peon', q: -1, r: 3 },
        { arquetipo: 'Peon', q: 0, r: 3 }, { arquetipo: 'Peon', q: 3, r: 3 },
        { arquetipo: 'Peon', q: -2, r: 2 }, { arquetipo: 'Peon', q: 0, r: 2 },
      ]
    }
  },
}

export function obtenerEscenario(nombre = 'base') {
  return ESCENARIOS_POR_ID[nombre] || null
}

export function crearEscenarioSandbox(nombre, matrizTerreno, unidadesA, unidadesB) {
  // Creamos el escenario base usando cargarEscenario
  const base = cargarEscenario(nombre, matrizTerreno, {
    despliegue: {
      A: unidadesA,
      B: unidadesB
    }
  })
  
  return base
}
