// US-092 — Menú contextual junto a la unidad seleccionada.
// Reposiciona la MISMA lista de acciones que usa el ActionMenu (obtenerAcciones
// en adapter.js). No duplica lógica: recibe las acciones ya resueltas por el
// selector y sus callbacks, filtra solo las ejecutables y las acerca al hex.
// El ActionMenu queda como fallback intacto.
import React from 'react'

const ANCHO = 92
const ITEM_ALTO = 18
const BORDE_LIMITE = 288
const BORDE_VERTICAL = 250

export default function UnitContextMenu({ acciones, pos, visible }) {
  if (!visible || !pos) return null
  const disponibles = acciones.filter(a => a.habilitada)
  if (disponibles.length === 0) return null

  const alto = disponibles.length * ITEM_ALTO + 6
  let x = pos.x + 32
  if (x + ANCHO > BORDE_LIMITE) x = pos.x - 32 - ANCHO
  let y = pos.y - alto / 2
  y = Math.max(-BORDE_VERTICAL, Math.min(BORDE_VERTICAL - alto, y))

  return (
    <g className="unit-ctx-menu" pointerEvents="auto">
      <rect x={x} y={y} width={ANCHO} height={alto} rx="8" />
      {disponibles.map((a, i) => {
        const yy = y + 3 + i * ITEM_ALTO
        return (
          <g
            key={a.id}
            className="unit-ctx-item"
            onClick={(e) => { e.stopPropagation(); a.onClick && a.onClick() }}
          >
            <title>{a.nombre} — {a.coste} PO</title>
            <rect x={x + 3} y={yy} width={ANCHO - 6} height={ITEM_ALTO - 4} rx="5" />
            <text x={x + 9} y={yy + ITEM_ALTO / 2 - 1} className="unit-ctx-nombre">
              {a.nombre}
            </text>
            <text x={x + ANCHO - 9} y={yy + ITEM_ALTO / 2 - 1} textAnchor="end" className="unit-ctx-coste">
              {a.coste}
            </text>
          </g>
        )
      })}
    </g>
  )
}
