import React, { useEffect, useState } from 'react'
import { INTERACCIONES, estaDescubierta, marcarDescubierta } from '../data/interacciones.js'

export default function DescubrimientoPopup({ tecnica, onCerrar }) {
  const [visible, setVisible] = useState(false)
  const info = INTERACCIONES[tecnica]

  useEffect(() => {
    if (!tecnica || !info) { setVisible(false); return }
    if (estaDescubierta(tecnica)) { setVisible(false); return }
    setVisible(true)
    marcarDescubierta(tecnica)
    const t = setTimeout(() => {
      setVisible(false)
      onCerrar?.()
    }, 4000)
    return () => clearTimeout(t)
  }, [tecnica, info, onCerrar])

  if (!visible || !info) return null

  return (
    <div className="descubrimiento-overlay" onClick={() => { setVisible(false); onCerrar?.() }}>
      <div className="descubrimiento-popup" onClick={e => e.stopPropagation()}>
        <div className="descubrimiento-icono">⚡</div>
        <div className="descubrimiento-titulo">NUEVA INTERACCIÓN</div>
        <div className="descubrimiento-nombre">{info.nombre}</div>
        <div className="descubrimiento-elementos">{info.elementos.join(' + ')}</div>
        <div className="descubrimiento-desc">{info.descripcion}</div>
        <button className="descubrimiento-cerrar" onClick={() => { setVisible(false); onCerrar?.() }}>
          CERRAR
        </button>
      </div>
    </div>
  )
}
