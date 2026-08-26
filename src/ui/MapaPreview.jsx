import React, { memo } from 'react'
import { generarTableroRect, hexKey, aPixel, verticesHex } from '../engine/hex.js'
import { terrenoDe } from './terreno.js'
import { TERRENO_PLANO, LETRA_TERRENO } from './terrenoVisual.jsx'
import { obtenerEscenario } from '../data/scenarios.js'

// Preview esquemática del mapa en la portada. PURA presentación: lee el DATO de
// escenario (`obtenerEscenario`) y pinta un SVG mínimo (color plano del terreno
// + letra + ✕ en bloqueados), igual que el modo esquemático de playtest. Determinista
// (matriz fija o terreno por semilla para el base). Nunca toca reglas ni el motor.
//
// Los polígonos usan la clase `mapa-preview`, NUNCA `.hex-tile`: el invariante de
// test "150 .hex-tile polygon" aplica al tablero de la partida, y esta vista vive
// solo en la portada.

const RADIO = 30

function puntosHex(c) {
  return verticesHex(RADIO).map(v => `${(c.x + v.x).toFixed(1)},${(c.y + v.y).toFixed(1)}`).join(' ')
}

function MapaPreview({ escenarioId = 'base', semilla = 'playtest-01', width = 460 }) {
  const esc = obtenerEscenario(escenarioId) || obtenerEscenario('base')
  if (!esc?.forma || esc.forma.tipo !== 'rect') return null

  const hexs = generarTableroRect(esc.forma.columnas, esc.forma.filas)
  const bloqueados = new Set(esc.bloqueados || [])

  let xMin = Infinity, xMax = -Infinity, yMin = Infinity, yMax = -Infinity
  const celdas = hexs.map(h => {
    const c = aPixel(h, RADIO)
    if (c.x < xMin) xMin = c.x
    if (c.x > xMax) xMax = c.x
    if (c.y < yMin) yMin = c.y
    if (c.y > yMax) yMax = c.y
    const key = hexKey(h)
    const terreno = esc.terreno
      ? (esc.terreno[key] || 'prado')
      : terrenoDe(h.q, h.r, semilla, bloqueados.has(key), true, null)
    return { key, c, terreno, bloqueado: bloqueados.has(key) }
  })

  const PAD = 36
  const viewBox = `${xMin - PAD} ${yMin - PAD} ${(xMax - xMin) + 2 * PAD} ${(yMax - yMin) + 2 * PAD}`

  return (
    <svg
      className="mapa-preview"
      viewBox={viewBox}
      width={width}
      style={{ maxWidth: '100%', height: 'auto' }}
      role="img"
      aria-label={`Mapa ${esc.nombre} (${esc.forma.columnas}×${esc.forma.filas})`}
      pointerEvents="none"
    >
      <title>{`${esc.nombre} · ${esc.forma.columnas}×${esc.forma.filas}`}</title>
      {celdas.map(({ key, c, terreno, bloqueado }) => (
        <g key={key}>
          <polygon
            className="mapa-preview-poly"
            points={puntosHex(c)}
            fill={TERRENO_PLANO[terreno] || TERRENO_PLANO.prado}
            stroke="rgba(12,26,12,0.42)"
            strokeWidth="0.7"
          />
          <text
            className={`mapa-preview-letra${bloqueado ? ' bloqueado' : ''}`}
            x={c.x.toFixed(1)}
            y={(c.y + 3.5).toFixed(1)}
            fontSize="10"
            textAnchor="middle"
            fill="#f4ead0"
            style={{ paintOrder: 'stroke', stroke: 'rgba(20,24,14,0.9)', strokeWidth: 1.2, strokeLinejoin: 'round' }}
          >
            {bloqueado ? '✕' : LETRA_TERRENO[terreno]}
          </text>
        </g>
      ))}
    </svg>
  )
}

export default memo(MapaPreview)