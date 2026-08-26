import React, { useEffect, useRef } from 'react'

const LIMITE = 80

export default function LogPanel({ log }) {
  const contenedorRef = useRef(null)

  useEffect(() => {
    const el = contenedorRef.current
    if (!el) return
    const cercaDelFondo = el.scrollHeight - el.scrollTop - el.clientHeight < 60
    if (cercaDelFondo) el.scrollTop = el.scrollHeight
  }, [log])

  const visibles = log ? log.slice(-LIMITE) : []

  if (visibles.length === 0) {
    return (
      <div className="log-panel" ref={contenedorRef}>
        <p className="placeholder">Sin eventos aún</p>
      </div>
    )
  }

  const inicio = log.length - visibles.length

  return (
    <div className="log-panel" ref={contenedorRef}>
      {visibles.map((evento, i) => (
        <div key={inicio + i} className={`log-entry log-${evento.tipo}`}>
          <span className="log-ronda">R{evento.ronda}</span>
          <span className="log-turno">T{evento.turno}</span>
          <span className="log-actor">{evento.actor}</span>
          <span className="log-tipo">[{evento.tipo}]</span>
          <span className="log-descripcion">{evento.descripcion}</span>
        </div>
      ))}
    </div>
  )
}
