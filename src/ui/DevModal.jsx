import React from 'react'
import SeedInput from './SeedInput.jsx'

// PASO 4 — modal de ajustes de playtest: concentra los controles de desarrollo
// (reglas, simulación, exportar/reproducir, semilla, nueva partida) para que el
// header quede mínimo. El botón "Fin de turno" NO vive acá: siempre es visible.
export default function DevModal({
  onCerrar,
  semilla,
  onSemilla,
  escenarios = [],
  escenarioSel = 'base',
  onEscenario,
  onReglas,
  onSimular,
  onExportar,
  onCargarRegistro,
  onNueva,
  onCopiar,
  copiado,
  esquematico = false,
  onEsquematico,
  manoAMano = true,
  onManoAMano,
  onHistorial,
}) {
  return (
    <div className="dev-modal-overlay" onClick={onCerrar}>
      <div className="dev-modal" onClick={(e) => e.stopPropagation()}>
        <div className="dev-modal-cab">
          <strong className="panel-titulo">Ajustes de playtest</strong>
          <button className="dev-modal-cerrar" onClick={onCerrar} aria-label="Cerrar">✕</button>
        </div>
        <div className="dev-modal-cuerpo">
          <button className="btn-sec" onClick={onReglas}>Reglas</button>
          <button className="btn-sec" onClick={onSimular}>Simular</button>
          <button className="btn-sec" onClick={onHistorial}>Historial</button>
          <button className="btn-sec" onClick={onExportar}>Exportar</button>
          <button className="btn-sec" onClick={onCopiar}>{copiado ? 'Copiado ✓' : 'Copiar Replay'}</button>
          <label className="btn-sec btn-file">
            Reproducir
            <input type="file" accept="application/json" onChange={onCargarRegistro} />
          </label>
          <button className="btn-sec" onClick={onEsquematico}>
            Tablero esquemático: {esquematico ? 'ON' : 'OFF'}
          </button>
          <button className="btn-sec" onClick={onManoAMano}>
            Mano a mano (handoff): {manoAMano ? 'ON' : 'OFF'}
          </button>
          <span className="hud-semilla">Semilla:</span>
          <SeedInput value={semilla} onAplicar={onSemilla} />
          <label className="hud-semilla">
            Mapa:
            <select
              className="selector-mapa"
              value={escenarioSel}
              onChange={(e) => onEscenario(e.target.value)}
            >
              {escenarios.map(s => (
                <option key={s.id} value={s.id}>{s.nombre}</option>
              ))}
            </select>
          </label>
          <button className="btn-nueva" onClick={onNueva}>Nueva partida</button>
        </div>
      </div>
    </div>
  )
}
