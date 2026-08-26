export const DIRECCIONES = [
  { q: +1, r: 0 }, { q: +1, r: -1 }, { q: 0, r: -1 },
  { q: -1, r: 0 }, { q: -1, r: +1 }, { q: 0, r: +1 },
]

export function aCubica({ q, r }) {
  return { x: q, y: -q - r, z: r }
}

export function aAxial({ x, y, z }) {
  return { q: x, r: z }
}

export function distancia(a, b) {
  const ac = aCubica(a)
  const bc = aCubica(b)
  return (Math.abs(ac.x - bc.x) + Math.abs(ac.y - bc.y) + Math.abs(ac.z - bc.z)) / 2
}

export function vecinos(hex) {
  return DIRECCIONES.map(d => ({ q: hex.q + d.q, r: hex.r + d.r }))
}

export function esAdyacente(a, b) {
  return distancia(a, b) === 1
}

export function hexEnRadio(origen, radio) {
  const resultados = []
  for (let q = -radio; q <= radio; q++) {
    for (let r = Math.max(-radio, -q - radio); r <= Math.min(radio, -q + radio); r++) {
      resultados.push({ q: origen.q + q, r: origen.r + r })
    }
  }
  return resultados
}

export function radioHex(q, r) {
  return (Math.abs(q) + Math.abs(r) + Math.abs(q + r)) / 2
}

// Rectángulo de hexes centrado en el origen (offsets odd-r convertidos a
// axiales): filas columnas de ancho, filas de alto, bordes en zigzag típicos
// del hex pointy-top. Es la FORMA del tablero (dato de escenario), no una
// regla de juego. Columnas × filas = número de hexes (15×10 = 150).
export function generarTableroRect(columnas, filas) {
  const hexs = []
  const qShift = Math.floor(columnas / 2)
  const rShift = Math.floor(filas / 2)
  for (let r = 0; r < filas; r++) {
    const offset = Math.floor(r / 2)
    for (let col = 0; col < columnas; col++) {
      hexs.push({ q: col - offset - qShift, r: r - rShift })
    }
  }
  return hexs
}

// Inversa de generarTableroRect: dice si un hex axial pertenece al rectángulo.
export function dentroRect({ q, r }, columnas, filas) {
  const row = r + Math.floor(filas / 2)
  const col = q + Math.floor(columnas / 2) + Math.floor(row / 2)
  return row >= 0 && row < filas && col >= 0 && col < columnas
}

// Borde del tablero según su forma (dato de escenario). null/indefinido → todo
// hex vale (grilla infinita, retrocompatibilidad con los tests de hex suelto).
export function dentroDeForma(forma, hex) {
  if (!forma) return true
  if (forma.tipo === 'rect') return dentroRect(hex, forma.columnas, forma.filas)
  if (forma.tipo === 'hex') return radioHex(hex.q, hex.r) <= forma.radio
  return true
}

export function hexKey({ q, r }) {
  return `${q},${r}`
}

export function parseKey(key) {
  const [q, r] = key.split(',').map(Number)
  return { q, r }
}

function lerpCubica(a, b, t) {
  const ac = aCubica(a)
  const bc = aCubica(b)
  return {
    x: ac.x + (bc.x - ac.x) * t,
    y: ac.y + (bc.y - ac.y) * t,
    z: ac.z + (bc.z - ac.z) * t,
  }
}

function redondearCubica(c) {
  let rx = Math.round(c.x)
  let ry = Math.round(c.y)
  let rz = Math.round(c.z)

  const dx = Math.abs(rx - c.x)
  const dy = Math.abs(ry - c.y)
  const dz = Math.abs(rz - c.z)

  if (dx > dy && dx > dz) {
    rx = -ry - rz
  } else if (dy > dz) {
    ry = -rx - rz
  } else {
    rz = -rx - ry
  }

  return { x: rx, y: ry, z: rz }
}

export function linea(a, b) {
  const n = distancia(a, b)
  if (n === 0) return [{ ...a }]
  const puntos = []
  for (let i = 0; i <= n; i++) {
    const t = i / n
    const c = lerpCubica(a, b, t)
    puntos.push(aAxial(redondearCubica(c)))
  }
  return puntos
}

function lineaConEpsilon(a, b, epsilon) {
  const ac = aCubica(a)
  const bc = aCubica(b)
  const aEps = { x: ac.x + epsilon, y: ac.y - epsilon, z: ac.z }
  const bEps = { x: bc.x + epsilon, y: bc.y - epsilon, z: bc.z }
  const n = distancia(a, b)
  if (n === 0) return [{ ...a }]
  const puntos = []
  for (let i = 0; i <= n; i++) {
    const t = i / n
    const cx = aEps.x + (bEps.x - aEps.x) * t
    const cy = aEps.y + (bEps.y - aEps.y) * t
    const cz = aEps.z + (bEps.z - aEps.z) * t
    puntos.push(aAxial(redondearCubica({ x: cx, y: cy, z: cz })))
  }
  return puntos
}

// D-28 (plantillas de mapa): hexes que bloquean el MOVIMIENTO. Son los
// `bloqueados` (bosque/montaña: impasables + bloquean LoS) más el agua
// (`bloqueaMovimientoSinLos`), que es impasable pero deja pasar el LoS salvo
// que la conmutable `aguaBloqueaLoS` esté activa.
export function bloqueadosParaMovimiento(estado) {
  const base = estado.tablero.bloqueados || []
  const agua = estado.tablero.bloqueaMovimientoSinLos || []
  return [...base, ...agua]
}

export function hayLoS(estado, origen, destino) {
  const obstruye = (c) => {
    if (c.q === origen.q && c.r === origen.r) return false
    if (c.q === destino.q && c.r === destino.r) return false
    const key = hexKey(c)
    if (estado.tablero.bloqueados.includes(key)) return true
    // D-28: el agua solo obstruye el LoS si `aguaBloqueaLoS` está activo.
    if (estado.reglas?.aguaBloqueaLoS &&
        (estado.tablero.bloqueaMovimientoSinLos || []).includes(key)) return true
    return estado.unidades.some(u => u.pos.q === c.q && u.pos.r === c.r)
  }
  const corta = (lin) => lin.slice(1, -1).some(obstruye)
  const a = lineaConEpsilon(origen, destino, +1e-6)
  const b = lineaConEpsilon(origen, destino, -1e-6)
  return !(corta(a) && corta(b))
}

// D-29 (aprobado 12/08/2026): reglas de terreno por tile. Consulta la tabla
// `reglas.reglasTerreno` según el tile visual de un hex (`tablero.terreno`).
// Devuelve `null` si el hex no tiene reglas (terreno por semilla = prado).
export function reglaTerrenoDe(estado, hex) {
  const visual = estado?.tablero?.terreno?.[hexKey(hex)]
  if (!visual) return null
  return estado?.reglas?.reglasTerreno?.[visual] || null
}

// Coste de MOVIMIENTO para ENTRAR a un hex según su terreno: 1 (paso) + el
// `costeExtra` del tile. Sin matriz de biomas → todo cuesta 1 (retrocompat.).
export function costeHexTerreno(estado) {
  const terreno = estado?.tablero?.terreno || null
  return (hex) => {
    if (!terreno) return 1
    const regla = reglaTerrenoDe(estado, hex)
    return regla && regla.costeExtra != null ? 1 + regla.costeExtra : 1
  }
}

// D-31 (aprobado 12/08/2026): modificador de dados del ATACANTE cuando la línea
// de ataque atraviesa un hex de terreno con `modAtacante` (empalizada). Devuelve
// -1 si la línea toca al menos una empalizada; 0 si no.
export function modAtacanteTerreno(estado, origen, destino) {
  const terreno = estado?.tablero?.terreno || null
  if (!terreno) return 0
  let tocaEmpalizada = false
  for (const h of hexesIntermediosLoS(origen, destino)) {
    const regla = reglaTerrenoDe(estado, h)
    if (regla && (regla.modAtacante || 0) < 0) tocaEmpalizada = true
  }
  return tocaEmpalizada ? -1 : 0
}

// Hexes intermedios de la línea de visión (unión de las dos líneas con épsilon,
// igual que `hayLoS`). Sirve para saber qué terreno atraviesa el ataque.
function hexesIntermediosLoS(origen, destino) {
  const set = new Set()
  const a = lineaConEpsilon(origen, destino, +1e-6)
  const b = lineaConEpsilon(origen, destino, -1e-6)
  for (const h of [...a.slice(1, -1), ...b.slice(1, -1)]) set.add(hexKey(h))
  return [...set].map(parseKey)
}

// Coste total de recorrer un camino (sin el hex de origen). Con `costeHex=()=>1`
// equivale a la longitud. Retrocompatibilidad: quien no pasa costeHex obtiene
// el mismo resultado que antes (coste por paso).
export function costeCamino(camino, costeHex = () => 1) {
  return camino.slice(1).reduce((s, h) => s + costeHex(h), 0)
}

// D-29: alcance con coste de terreno. BFS por coste acumulado (Dijkstra simple,
// tablero pequeño): cada hex cuesta `costeHex(hex)` al entrar (default 1).
// `detieneHex` true → el movimiento se detiene al entrar (no se expande).
export function hexAlcanzables(origen, movimiento, ocupados, bloqueados = [], dentro = () => true, costeHex = () => 1, detieneHex = () => false) {
  const bloqueadosSet = new Set(bloqueados)
  const ocupadosSet = new Set(ocupados.map(u => hexKey(u.pos || u)))
  const origenKey = hexKey(origen)
  const costeMin = new Map()
  costeMin.set(origenKey, 0)
  const cola = [{ ...origen, coste: 0 }]
  const resultado = []

  while (cola.length > 0) {
    let idx = 0
    for (let i = 1; i < cola.length; i++) {
      if (cola[i].coste < cola[idx].coste) idx = i
    }
    const actual = cola.splice(idx, 1)[0]
    const actualKey = hexKey(actual)
    if (actual.coste !== costeMin.get(actualKey)) continue
    if (actualKey !== origenKey) resultado.push({ q: actual.q, r: actual.r })

    if (detieneHex(actual)) continue
    for (const vecino of vecinos(actual)) {
      const key = hexKey(vecino)
      const coste = actual.coste + costeHex(vecino)
      if (coste > movimiento) continue
      if (!dentro(vecino)) continue
      if (bloqueadosSet.has(key)) continue
      if (key !== origenKey && ocupadosSet.has(key)) continue
      if (costeMin.has(key) && costeMin.get(key) <= coste) continue
      costeMin.set(key, coste)
      cola.push({ ...vecino, coste })
    }
  }

  return resultado
}

export function caminoLibre(origen, destino, ocupados, bloqueados = [], dentro = () => true, costeHex = () => 1, detieneHex = () => false) {
  const bloqueadosSet = new Set(bloqueados)
  const ocupadosSet = new Set(ocupados.map(u => hexKey(u.pos || u)))
  const origenKey = hexKey(origen)
  const destinoKey = hexKey(destino)

  if (destinoKey === origenKey) return [origen]
  if (!dentro(destino)) return null
  if (bloqueadosSet.has(destinoKey)) return null
  if (ocupadosSet.has(destinoKey)) return null

  const costeMin = new Map()
  costeMin.set(origenKey, 0)
  const anterior = new Map()
  const cola = [{ ...origen, coste: 0 }]

  while (cola.length > 0) {
    let idx = 0
    for (let i = 1; i < cola.length; i++) {
      if (cola[i].coste < cola[idx].coste) idx = i
    }
    const actual = cola.splice(idx, 1)[0]
    const actualKey = hexKey(actual)
    if (actual.coste !== costeMin.get(actualKey)) continue
    if (actualKey === destinoKey) break
    if (detieneHex(actual)) continue

    for (const vecino of vecinos(actual)) {
      const key = hexKey(vecino)
      const coste = actual.coste + costeHex(vecino)
      if (!dentro(vecino)) continue
      if (bloqueadosSet.has(key)) continue
      if (key !== origenKey && ocupadosSet.has(key)) continue
      if (costeMin.has(key) && costeMin.get(key) <= coste) continue
      costeMin.set(key, coste)
      anterior.set(key, actualKey)
      cola.push({ ...vecino, coste })
    }
  }

  if (!costeMin.has(destinoKey)) return null
  const camino = []
  let cur = destinoKey
  while (cur != null) {
    const [q, r] = cur.split(',').map(Number)
    camino.unshift({ q, r })
    cur = anterior.get(cur)
  }
  return camino
}

export function puedeMoverse(unidad, destino, estado) {
  const movimiento = obtenerMovimiento(unidad)
  const ocupados = estado.unidades.filter(u => u.id !== unidad.id)
  const dentro = (h) => dentroDeForma(estado.tablero.forma, h)
  const camino = caminoLibre(unidad.pos, destino, ocupados, bloqueadosParaMovimiento(estado), dentro, costeHexTerreno(estado))
  return camino !== null && costeCamino(camino, costeHexTerreno(estado)) <= movimiento
}

function obtenerMovimiento(unidad) {
  const ARQUETIPOS_MOV = { Peon: 3, Alfil: 4, Torre: 2, Caballo: 5, Campeon: 4, Rey: 3 }
  return ARQUETIPOS_MOV[unidad.arquetipo] || 3
}

export function hexDeAtras(atacante, defensor) {
  const dirQ = atacante.q - defensor.q
  const dirR = atacante.r - defensor.r
  const absQ = Math.abs(dirQ)
  const absR = Math.abs(dirR)
  let sigQ, sigR
  if (absQ >= absR) {
    sigQ = dirQ > 0 ? 1 : dirQ < 0 ? -1 : 0
    sigR = dirR > 0 ? 1 : dirR < 0 ? -1 : 0
  } else {
    sigQ = dirQ > 0 ? 1 : dirQ < 0 ? -1 : 0
    sigR = dirR > 0 ? 1 : dirR < 0 ? -1 : 0
  }
  const opuesto = { q: atacante.q + sigQ, r: atacante.r + sigR }
  return opuesto
}

export function buscarRetroceso(atacante, defensor, estado) {
  const opuesto = hexDeAtras(atacante, defensor)
  const opKey = hexKey(opuesto)
  const dentro = (h) => dentroDeForma(estado.tablero.forma, h)
  const ocupados = new Set(estado.unidades.filter(u => u.id !== atacante.id).map(u => hexKey(u.pos)))
  const bloqueados = new Set(bloqueadosParaMovimiento(estado))

  if (dentro(opuesto) && !ocupados.has(opKey) && !bloqueados.has(opKey)) {
    return opuesto
  }

  const candidatos = vecinos(atacante)
    .filter(v => {
      const key = hexKey(v)
      return dentro(v) && key !== hexKey(defensor) && !ocupados.has(key) && !bloqueados.has(key)
    })
    .sort((a, b) => distancia(b, defensor) - distancia(a, defensor))

  return candidatos.length > 0 ? candidatos[0] : null
}

export function aPixel({ q, r }, tamaño = 30) {
  return {
    x: tamaño * Math.sqrt(3) * (q + r / 2),
    y: tamaño * 1.5 * r,
  }
}

export function verticesHex(tamaño = 30) {
  const puntos = []
  for (let i = 0; i < 6; i++) {
    const angulo = (Math.PI / 180) * (30 + 60 * i)
    puntos.push({
      x: tamaño * Math.cos(angulo),
      y: tamaño * Math.sin(angulo),
    })
  }
  return puntos
}

export function generarTableroHex(radio) {
  const hexs = []
  for (let q = -radio; q <= radio; q++) {
    for (let r = Math.max(-radio, -q - radio); r <= Math.min(radio, -q + radio); r++) {
      hexs.push({ q, r })
    }
  }
  return hexs
}
