import React from 'react'

// Estilos visuales del terreno (Fire Emblem GBA). Solo presentación: paleta por
// tipo, gradientes para el bisel y decorado determinista. Regla SVG: nunca
// <polygon> extra por tile (solo el del hex + el <path> del bisel); todo decorado
// con <path>/<circle>/<line>/<text>/<image>. Ver skill estilo-mapa-tactico.

// Hash determinista por coordenada (sin RNG, sin estado).
function hash(q, r, sal) {
  return ((((q * 73856093) ^ (r * 19349663)) >>> 0) + sal * 7919) >>> 0
}

export function oscurecer(hex, f) {
  const n = parseInt(hex.slice(1), 16)
  const r = Math.round(((n >> 16) & 255) * f)
  const g = Math.round(((n >> 8) & 255) * f)
  const b = Math.round((n & 255) * f)
  return `rgb(${r},${g},${b})`
}

export function tono(paleta, q, r) {
  return paleta[hash(q, r, 0) % paleta.length]
}

export const TERRENOS = {
  prado: { fill: ['#5d7c3f', '#557339', '#6a8a48', '#4f6b36'] },
  bosque: { fill: ['#3d5c33', '#34522c', '#466a3a', '#2f4a28'] },
  agua: { fill: ['#3d6f8f', '#356180', '#477c99', '#30566f'] },
  montaña: { fill: ['#7a7060', '#6f6656', '#847a68', '#655c4e'] },
  camino: { fill: ['#8a6f48', '#7d6440', '#94784f', '#705a38'] },
  // D-30: puente — tablones de madera clara sobre el agua (tono propio).
  puente: { fill: ['#8a5a2e', '#7c4f28', '#97663a', '#6e4523'] },
  // D-31: empalizada — madera oscura de fortín, distinta del camino.
  empalizada: { fill: ['#6b4a26', '#5f4120', '#76522c', '#533817'] },
  ruina: { fill: ['#6b6455', '#605a4c', '#746d5c', '#57503f'] },
  bloqueado: { fill: ['#4a4436', '#403a2e', '#534c3c', '#363024'] },
  corona: { fill: ['#0d0b07'] },
  lugar: { fill: ['#8a7d52', '#7f7248', '#938557', '#746838'] },
}

// Océano profundo del MUNDO: más oscuro y desaturado que el agua somera costera
// para que la isla jugable lea como continente (agua clara cerca → mar hondo).
export const OCEANO_PROFUNDO = ['#29485d', '#243f52', '#31546a', '#1f3645']

export const TERRENO_GRADIENTES = {
  prado: ['#85a257', '#5d7c3f', '#3f5a2a'],
  bosque: ['#4f7a40', '#36582c', '#223a1c'],
  agua: ['#5d9ec4', '#3a6f94', '#254f6b'],
  montaña: ['#97907f', '#6f6656', '#4b4437'],
  camino: ['#a68a5c', '#7d6440', '#55442a'],
  puente: ['#a97a44', '#8a5a2e', '#5c3a1c'],
  empalizada: ['#8a6436', '#6b4a26', '#423013'],
  ruina: ['#8a8374', '#605a4c', '#3f3a30'],
  bloqueado: ['#5c5544', '#403a2e', '#27221a'],
  corona: ['#0d0b07', '#0d0b07', '#0d0b07'],
  lugar: ['#b0a26f', '#8a7d52', '#5c5231'],
}

// Modo esquemático de playtest: color sólido (desaturado, tranquilo) por terreno
// en vez de textura PNG; el terreno se lee por matiz + letra (LETRA_TERRENO).
export const TERRENO_PLANO = {
  prado: '#62784d',
  bosque: '#46603c',
  agua: '#4d7691',
  montaña: '#7d7463',
  camino: '#87714f',
  puente: '#96683a',
  empalizada: '#7a5a30',
  ruina: '#6f6859',
  bloqueado: '#4a4436',
  corona: '#0d0b07',
  lugar: '#8a7d52',
}

// Letra de identificación rápida del terreno en modo esquemático. 'bloqueado'
// no lleva letra: su estado ya pinta el ✕ en el centro del hex.
export const LETRA_TERRENO = {
  prado: 'P',
  bosque: 'B',
  agua: 'A',
  montaña: 'M',
  camino: 'C',
  puente: 'P',
  empalizada: 'E',
  ruina: 'R',
  lugar: 'L',
}

// Posición determinista dentro del hex (rango ±rango desde el centro).
function pos(q, r, sal, rango = 8) {
  return {
    x: ((hash(q, r, sal) % 100) / 100) * rango * 2 - rango,
    y: ((hash(q, r, sal + 3) % 100) / 100) * rango * 2 - rango,
  }
}

// Número determinista 0..1 por (q, r, sal). La decoración depende SOLO de datos
// deterministas (coordenada + sal), nunca de RNG atemporal.
export function num(q, r, sal) {
  return (hash(q, r, sal) % 1000) / 1000
}

// Árbol con copa irregular. `grande` escala el árbol COMPLETO alrededor de su
// propio centro: así la copa puede sobresalir del hex y amalgamar bosques
// vecinos (la luz compartida + densidad ocultan el borde).
function Arbol({ q, r, cx, cy, i, grande = 1 }) {
  const p = pos(q, r, 100 + i * 7, 11)
  const rCan = 3 + num(q, r, 110 + i * 7) * 1.7
  const t = num(q, r, 120 + i * 7)
  const tonoCopa = oscurecer('#2c4422', 1 + (t - 0.5) * 0.5)
  const tonoAlto = oscurecer('#3c6a2b', 1 + (num(q, r, 125 + i * 7) - 0.5) * 0.4)
  return (
    <g key={i} opacity="0.95" transform={`translate(${cx + p.x} ${cy + p.y}) scale(${grande})`}>
      <ellipse
        cx={0}
        cy={6.6}
        rx={rCan * 1.1}
        ry={rCan * 0.5}
        fill="rgba(10,14,8,0.30)"
      />
      <line
        x1={0}
        y1={3.4}
        x2={0}
        y2={7}
        stroke="rgba(38,28,16,0.85)"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <circle
        cx={0}
        cy={0}
        r={rCan}
        fill={tonoAlto}
        stroke={tonoCopa}
        strokeWidth="0.6"
      />
    </g>
  )
}

function Ola(q, r, cx, cy, i) {
  const p = pos(q, r, 200 + i * 7, 12)
  const y0 = cy + p.y
  return (
    <path
      key={i}
      d={`M ${cx + p.x - 8},${y0} q 4,-3.5 8,0 t 8,0`}
      fill="none"
      stroke="rgba(200,232,245,0.5)"
      strokeWidth="1.1"
      strokeLinecap="round"
    />
  )
}

// ============================================================
// DECOR SUELO — elementos bajos que viven DETRÁS de las unidades
// (matas, flores, olas, camino, escombros). No ocultan nada.
// ============================================================
export function DecorSuelo({ tipo, q, r, cx, cy }) {
  if (tipo === 'agua') {
    const n = 3 + (hash(q, r, 14) % 2)
    const olas = []
    for (let i = 0; i < n; i++) olas.push(Ola(q, r, cx, cy, i))
    return (
      <g pointerEvents="none">
        {olas}
        {/* banda de reflejo determinista */}
        <ellipse cx={cx + (num(q, r, 60) - 0.5) * 10} cy={cy + 4} rx={7} ry={1.6} fill="rgba(225,240,250,0.30)" />
        <circle cx={cx + 5} cy={cy + 4} r={1.2} fill="rgba(235,250,255,0.5)" />
        <circle cx={cx - 7} cy={cy - 4} r={0.9} fill="rgba(235,250,255,0.4)" />
      </g>
    )
  }

  if (tipo === 'camino') {
    // Un segmento ancho de camino horizontal + surcos: se siente como una ruta
    // continua a través de los hexes vecinos del mismo camino.
    return (
      <g pointerEvents="none">
        <line x1={cx - 17} y1={cy + 2} x2={cx + 17} y2={cy + 2}
          stroke="rgba(58,44,24,0.55)" strokeWidth="8" strokeLinecap="round" />
        <line x1={cx - 15} y1={cy + 1} x2={cx + 15} y2={cy + 1}
          stroke="rgba(214,196,160,0.35)" strokeWidth="1" strokeLinecap="round" />
        <line x1={cx - 15} y1={cy + 3.5} x2={cx + 15} y2={cy + 3.5}
          stroke="rgba(30,22,12,0.5)" strokeWidth="1" strokeLinecap="round" />
        <circle cx={cx + 6} cy={cy - 2} r={1.2} fill="rgba(60,46,26,0.7)" />
        <circle cx={cx - 7} cy={cy + 5} r={1} fill="rgba(60,46,26,0.6)" />
      </g>
    )
  }

  if (tipo === 'ruina') {
    // Escombros bajos (el decorado alto de columnas vive en DecorAlto).
    return (
      <g pointerEvents="none">
        <circle cx={cx + 5} cy={cy + 3} r={2} fill="#6b6455" stroke="rgba(30,26,20,0.6)" strokeWidth="0.5" />
        <path d={`M ${cx - 3},${cy + 6} l 2,-2 l -1,-2 l 2.5,-1`} fill="none" stroke="rgba(30,26,20,0.6)" strokeWidth="0.8" strokeLinecap="round" />
      </g>
    )
  }

  if (tipo === 'puente') {
    // Tablones transversales sobre el agua: lee como cruce, no como borde.
    return (
      <g pointerEvents="none">
        <line x1={cx - 16} y1={cy} x2={cx + 16} y2={cy}
          stroke="rgba(52,32,16,0.6)" strokeWidth="10" strokeLinecap="round" />
        {[-9, -3, 3, 9].map(off => (
          <line key={off} x1={cx + off - 4} y1={cy - 7} x2={cx + off - 4} y2={cy + 7}
            stroke="rgba(230,200,160,0.5)" strokeWidth="1.6" strokeLinecap="round" />
        ))}
      </g>
    )
  }

  if (tipo === 'empalizada') {
    // Estacas verticales en fila: obstáculo defensivo, no camino.
    const estacas = []
    for (let i = 0; i < 6; i++) {
      const px = cx - 13 + i * 5.4
      const a = (hash(q, r, 90 + i) % 8) - 4
      estacas.push(
        <line key={i} x1={px} y1={cy + 7} x2={px + a} y2={cy - 8}
          stroke="rgba(34,22,10,0.85)" strokeWidth="2.4" strokeLinecap="round" />
      )
    }
    return (
      <g pointerEvents="none">
        <line x1={cx - 14} y1={cy + 6} x2={cx + 14} y2={cy + 6}
          stroke="rgba(24,15,6,0.7)" strokeWidth="2" strokeLinecap="round" />
        {estacas}
      </g>
    )
  }

  if (tipo === 'bosque') {
    // Arbustos bajos cerca del canto para integrar el límite (las copas en DecorAlto).
    return (
      <g pointerEvents="none">
        <circle
          cx={cx + 9}
          cy={cy + 8}
          r={2.6}
          fill={oscurecer('#3c5c2e', 1 + (num(q, r, 40) - 0.5) * 0.4)}
          stroke="#223a1c"
          strokeWidth="0.5"
          opacity="0.9"
        />
      </g>
    )
  }

  if (tipo === 'montaña') {
    return (
      <g pointerEvents="none">
        <circle cx={cx - 8} cy={cy + 9} r={1.6} fill="#6f6656" stroke="rgba(40,35,28,0.7)" strokeWidth="0.5" />
        <circle cx={cx + 8} cy={cy + 9} r={2.2} fill="#5d5446" stroke="rgba(40,35,28,0.7)" strokeWidth="0.5" />
      </g>
    )
  }

  // prado (default): matas, flores y piedras, dispersas hasta ±13.
  const patron = hash(q, r, 7) % 10
  const items = []
  const matasN = 5 + (hash(q, r, 11) % 3)
  for (let i = 0; i < matasN; i++) {
    const px = cx - 8 + num(q, r, 13 + i * 7) * 16
    const py = cy + 1 + num(q, r, 17 + i * 9) * 16
    const len = 3 + num(q, r, 19 + i * 11) * 3
    items.push(
      <line key={`m${i}`} x1={px} y1={py} x2={px + 1.4} y2={py - len}
        stroke="rgba(28,52,20,0.55)" strokeWidth="1.1" strokeLinecap="round" />
    )
  }
  // flores (1-2 matices)
  const nFlores = patron === 3 ? 2 : (patron % 4 === 0 ? 1 : 0)
  for (let i = 0; i < nFlores; i++) {
    const px = cx + (num(q, r, 23 + i * 5) - 0.5) * 20
    const py = cy + (num(q, r, 27 + i * 7) - 0.4) * 18
    const paletaFlores = ['#e9c46a', '#e76f51', '#d9a6d9', '#b7e07a']
    const c = paletaFlores[Math.floor(num(q, r, 31 + i) * paletaFlores.length) % paletaFlores.length]
    items.push(
      <circle key={`f${i}`} cx={px} cy={py} r={1.3} fill={c} stroke="rgba(20,30,12,0.5)" strokeWidth="0.4" />
    )
  }
  // piedra ocasional
  if (patron % 6 === 1) {
    items.push(
      <circle key="g" cx={cx + 4} cy={cy + 8} r={1.9} fill="rgba(140,132,108,0.7)" stroke="rgba(70,62,44,0.5)" strokeWidth="0.5" />
    )
  }
  return <g pointerEvents="none">{items}</g>
}

// ============================================================
// DECOR ALTO — elementos con altura (copas, picos, columnas) que
// sobresalen de su hex y pueden TAPAR parcialmente a la unidad de
// atrás. Se dibuja después de las unidades (orden de profundidad)
// con pointerEvents none: jamás intercepta la interacción.
// `escala` amplía el elemento alrededor de su centro (mayor
// sobresalida hacia el hex de arriba).
// ============================================================
export function DecorAlto({ tipo, q, r, cx, cy, escala = 1 }) {
  if (tipo === 'bosque') {
    const n = 3 + (hash(q, r, 13) % 2) // 3-4 árboles
    const claro = num(q, r, 15) < 0.28 // a veces un claro = área, no muro
    const arboles = []
    if (!claro) {
      for (let i = 0; i < n; i++) {
        arboles.push(<g key={`a-${i}`}>{Arbol(q, r, cx, cy, i, (0.9 + num(q, r, 16 + i) * 0.25) * escala)}</g>)
      }
    } else {
      arboles.push(<g key="a0">{Arbol(q, r, cx, cy, 0, 1 * escala)}</g>)
      arboles.push(<circle key="o" cx={cx} cy={cy + 2} r={8 * escala} fill="rgba(90,120,60,0.18)" />)
    }
    return <g className="decor-alto" pointerEvents="none">{arboles}</g>
  }

  if (tipo === 'montaña') {
    return (
      <g className="decor-alto" pointerEvents="none" transform={`translate(${cx} ${cy}) scale(${escala}) translate(${-cx} ${-cy})`}>
        <path
          d={`M ${cx - 6},${cy + 8} L ${cx},${cy - 8} L ${cx + 6},${cy + 8} Z`}
          fill="#8a8170"
          stroke="rgba(40,35,28,0.8)"
          strokeWidth="0.8"
          strokeLinejoin="round"
        />
        <path
          d={`M ${cx - 3},${cy + 1} L ${cx},${cy - 8 + 2} L ${cx - 1},${cy + 1} Z`}
          fill="#cfc8b8"
          opacity="0.8"
        />
        <path
          d={`M ${cx},${cy + 8} l 3,-6`}
          fill="none"
          stroke="rgba(20,16,12,0.4)"
          strokeWidth="0.9"
        />
      </g>
    )
  }

  if (tipo === 'ruina') {
    // Columnas en pie que sobresalen del terreno (altura).
    return (
      <g className="decor-alto" pointerEvents="none" transform={`translate(${cx} ${cy}) scale(${escala}) translate(${-cx} ${-cy})`}>
        <rect x={cx - 6} y={cy - 5} width={3.4} height={14} rx="1" fill="#8f8878" stroke="rgba(30,26,20,0.7)" strokeWidth="0.6" opacity="0.9"
          transform={`rotate(${num(q, r, 70) * 40 - 20} ${cx} ${cy})`} />
        <rect x={cx - 6} y={cy - 5} width={3.4} height={14} rx={1} fill="#837c6d" stroke="rgba(30,26,20,0.7)" strokeWidth="0.6" opacity="0.9"
          transform={`rotate(${num(q, r, 71) * 40 - 20} ${cx} ${cy})`} />
      </g>
    )
  }

  return null
}
