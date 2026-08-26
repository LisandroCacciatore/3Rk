import React, { useState } from 'react'
import UnitSheet from './UnitSheet.jsx'
import ActionMenu from './ActionMenu.jsx'
import LogPanel from './LogPanel.jsx'

// PASO 2 — ficha de unidad flotante (esquina inferior-izquierda sobre el mapa).
// Agrupa la ficha, las acciones disponibles y el registro colapsable en un solo
// panel que ya no ocupa un lateral dedicado: el tablero gana todo el ancho.
// Pura composición presentacional; las reglas viven en el motor.
export default function UnitCard({
  estado,
  unidad,
  rivalSeleccionada,
  costeProxima,
  esTurnoDe,
  acciones,
  tecnicasDefensa,
  log,
  onCerrar,
}) {
  const [logAbierto, setLogAbierto] = useState(false)
  if (!unidad) return null

  return (
    <div className="unit-card-flotante" style={{ '--color-banda': '#c9a24f' }}>
      <button
        className="btn-cerrar-ficha"
        onClick={onCerrar}
        title="Cerrar ficha"
        aria-label="Cerrar ficha"
      >
        ✕
      </button>
      <UnitSheet
        estado={estado}
        unidad={unidad}
        rivalSeleccionada={rivalSeleccionada}
        costeProxima={costeProxima}
        esTurnoDe={esTurnoDe}
      />
      {acciones.length > 0 || (tecnicasDefensa || []).length > 0 ? (
        <ActionMenu acciones={acciones} tecnicasDefensa={tecnicasDefensa} />
      ) : null}
      <div className="unit-card-pie">
        <button
          className={`btn-log-toggle${logAbierto ? ' abierto' : ''}`}
          onClick={() => setLogAbierto(o => !o)}
          title="Eventos de la partida (registro del motor)"
        >
          {logAbierto ? '▼ Ocultar registro' : `▲ Registro (${log ? log.length : 0})`}
        </button>
      </div>
      {logAbierto && <LogPanel log={log} />}
    </div>
  )
}
