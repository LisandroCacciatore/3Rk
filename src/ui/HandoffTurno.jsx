import React from 'react'
import { faccionDeJugador } from './adapter.js'

// Handoff de pantalla compartida (mano a mano, UI no regla): cuando el jugador
// activo CAMBIA (A↔B), un overlay opaco bloquea el tablero y la mano hasta que
// el nuevo jugador toca "Comenzar mi turno". Así queda definido de quién es la
// pantalla y el rival no alcanza a ver la mano nueva. No se auto-cierra ni con
// clic fuera ni con Escape: la privacidad exige la entrega explícita.
export default function HandoffTurno({ desde, hacia, estado, onContinuar }) {
  return (
    <div className="handoff-overlay">
      <div className="handoff-card" role="status" aria-live="polite">
        <div className="cartel-turno-titulo">FIN DE TURNO</div>
        <div className="cartel-turno-cambio">
          <span className={`cartel-faccion ${desde}`}>Jugador {faccionDeJugador(desde, estado)}</span>
          <span className="cartel-flecha" aria-hidden="true">→</span>
          <span className={`cartel-faccion ${hacia}`}>Jugador {faccionDeJugador(hacia, estado)}</span>
        </div>
        <div className="handoff-entrega">
          Pasa el dispositivo a <strong>Jugador {faccionDeJugador(hacia, estado)}</strong>
        </div>
        <button className="btn-jugar handoff-btn" onClick={onContinuar}>
          Comenzar mi turno
        </button>
      </div>
    </div>
  )
}
