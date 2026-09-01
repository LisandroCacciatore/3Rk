import React, { useMemo } from 'react'
import { cargarHistorial, limpiarHistorial, estadisticasJugador } from '../data/historial.js'
import { ESCENARIOS } from '../data/scenarios.js'

function formatoFecha(iso) {
  try {
    const d = new Date(iso)
    return d.toLocaleDateString('es-AR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
  } catch {
    return iso
  }
}

function nombreEscenario(id) {
  const s = ESCENARIOS.find(e => e.id === id)
  return s ? s.nombre : id
}

export default function HistorialPanel({ visible, onCerrar }) {
  const historial = useMemo(() => visible ? cargarHistorial() : [], [visible])
  const stats = useMemo(() => visible ? estadisticasJugador() : null, [visible])

  if (!visible) return null

  const limpiar = () => {
    if (window.confirm('¿Limpiar todo el historial de partidas?')) {
      limpiarHistorial()
      onCerrar()
    }
  }

  return (
    <div className="historial-overlay" onClick={onCerrar}>
      <div className="historial-panel" onClick={e => e.stopPropagation()}>
        <div className="historial-header">
          <h3>Historial de Partidas</h3>
          <button className="historial-cerrar" onClick={onCerrar} aria-label="Cerrar">×</button>
        </div>

        {stats ? (
          <>
            <div className="historial-stats">
              <div className="historial-stat">
                <span className="historial-stat-num">{stats.totalPartidas}</span>
                <span className="historial-stat-label">partidas</span>
              </div>
              <div className="historial-stat">
                <span className="historial-stat-num">{stats.porcentajeVictoriasA}%</span>
                <span className="historial-stat-label">victorias</span>
              </div>
              <div className="historial-stat">
                <span className="historial-stat-num">{stats.rondasPromedio}</span>
                <span className="historial-stat-label">rondas prom.</span>
              </div>
              <div className="historial-stat">
                <span className="historial-stat-num">{stats.faccionMasUsada}</span>
                <span className="historial-stat-label">facción top</span>
              </div>
            </div>

            <div className="historial-lista">
              {historial.slice(0, 20).map((p) => (
                <div key={p.id} className={`historial-item ${p.ganador === 'A' ? 'victoria' : 'derrota'}`}>
                  <div className="historial-item-resultado">
                    {p.ganador === 'A' ? 'Victoria' : 'Derrota'}
                    <span className="historial-item-modo">
                      {p.modoSolitario ? '(vs IA)' : '(vs Jugador)'}
                    </span>
                  </div>
                  <div className="historial-item-detalle">
                    {p.faccionA} vs {p.faccionB} · R{p.rondas} · {nombreEscenario(p.escenario)}
                  </div>
                  <div className="historial-item-meta">
                    <span>{formatoFecha(p.fecha)}</span>
                    <span>Seed: {p.semilla}</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="historial-vacio">
            <p>No hay partidas jugadas aún.</p>
            <p>Jugá una partida para ver tu historial acá.</p>
          </div>
        )}

        <div className="historial-footer">
          <button className="historial-limpiar" onClick={limpiar} disabled={!stats}>
            Limpiar historial
          </button>
        </div>
      </div>
    </div>
  )
}
