import React, { useEffect } from 'react'
import { faccionDeJugador } from './adapter.js'

// Cartel de cambio de turno (convenio de UI, no una regla): anuncia, cada vez
// que cambia el jugador activo, quién terminó y quién empieza. No bloquea el
// tablero (pointer-events pasa) y se cierra solo (~1,8 s) o con clic/Escape.
export default function CartelTurno({ desde, hacia, estado, onCerrar }) {
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onCerrar()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onCerrar])

  return (
    <div className="cartel-turno-overlay" onClick={onCerrar}>
      <div className="cartel-turno" role="status" aria-live="polite">
        <div className="cartel-turno-titulo">FIN DE TURNO</div>
        <div className="cartel-turno-cambio">
          <span className={`cartel-faccion ${desde}`}>Jugador {faccionDeJugador(desde, estado)}</span>
          <span className="cartel-flecha" aria-hidden="true">→</span>
          <span className={`cartel-faccion ${hacia}`}>Jugador {faccionDeJugador(hacia, estado)}</span>
        </div>
      </div>
    </div>
  )
}
