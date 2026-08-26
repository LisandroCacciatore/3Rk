import React from 'react'
import { poPorElemento } from '../engine/po.js'
import { simboloElemento, colorElemento } from './elementos.js'

export default function POBar({ jugador, nombre }) {
  const po = poPorElemento(jugador)
  const total = Object.values(po).reduce((s, v) => s + v, 0)

  return (
    <div className="po-bar">
      {nombre && <span className="po-nombre">{nombre}</span>}
      {total === 0 ? (
        <span className="po-sin">Sin PO</span>
      ) : (
        Object.entries(po).map(([elem, cant]) => (
          <span key={elem} className="po-item" style={{ '--color-elem': colorElemento(elem) }}>
            <span className="po-icono">{simboloElemento(elem)}</span>
            {cant}
          </span>
        ))
      )}
      {total > 0 && <span className="po-total">= {total} PO</span>}
    </div>
  )
}
