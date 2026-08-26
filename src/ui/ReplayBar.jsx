// US-102 — Barra de reproducción paso a paso de un replay importado.
// La reproducción aplica la misma secuencia de intenciones con el mismo motor
// (crearEstadoInicial + aplicarIntencion), así que el estado final coincide
// exactamente con reproducirPartida(semilla, secuencia).
import React from 'react'

export default function ReplayBar({
  indice,
  total,
  autoplay,
  terminado,
  onPaso,
  onAutoplay,
  onSaltar,
  onCerrar,
}) {
  const pct = total > 0 ? (Math.min(indice, total) / total) * 100 : 0
  return (
    <div className="replay-bar">
      <span className="replay-titulo">
        Replay — paso {Math.min(indice, total)}/{total}
      </span>
      <div className="replay-progreso">
        <div className="replay-barra" style={{ width: `${pct}%` }} />
      </div>
      <button className="btn-sec" onClick={onPaso} disabled={terminado || autoplay}>
        Paso
      </button>
      <button className="btn-sec" onClick={onAutoplay} disabled={terminado}>
        {autoplay ? 'Pausar' : 'Reproducir'}
      </button>
      <button className="btn-sec" onClick={onSaltar}>
        Saltar al final
      </button>
      <button className="btn-cancelar" onClick={onCerrar}>
        Salir del replay
      </button>
    </div>
  )
}
