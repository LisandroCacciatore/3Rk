import React from 'react'
import { metricasDePartida } from '../engine/metrics.js'

// D-22/D-23/D-24/D-26: panel de reglas conmutables. Cada cambio es una intención
// CAMBIAR_REGLAS que el motor valida contra REGLAS_POR_DEFECTO y registra.
export default function SettingsPanel({ estado, onCambiarReglas }) {
  const reglas = estado.reglas
  const set = (clave, valor) => onCambiarReglas({ [clave]: valor })
  const m = metricasDePartida(estado)

  return (
    <div className="panel-flotante panel-reglas">
      <div className="conf-head">
        <strong>Reglas conmutables</strong>
        <span className="acc-motivo"> (D-05 / D-08 / D-12 / D-23 / D-26 / A-11-N1 / A-11-N3 / A-11-N4 / A-11-N5 / A-11-N6)</span>
      </div>

      <label className="regla-fila">
        <input
          type="checkbox"
          checked={reglas.defensorNoQuedaStunned}
          onChange={(e) => set('defensorNoQuedaStunned', e.target.checked)}
        />
        El defensor no queda Stunned al recibir una herida (D-12)
      </label>

      <label className="regla-fila">
        Reinicio del contador 1/3/5/9 (D-05):
        <select
          value={reglas.reinicioContador}
          onChange={(e) => set('reinicioContador', e.target.value)}
        >
          <option value="turno">por turno</option>
          <option value="ronda">por ronda</option>
        </select>
      </label>

      <label className="regla-fila">
        Cartas robadas por turno (D-08):
        <input
          type="number"
          min={0}
          max={3}
          value={reglas.roboPorTurno}
          onChange={(e) => set('roboPorTurno', parseInt(e.target.value, 10) || 0)}
        />
      </label>

      <label className="regla-fila">
        <input
          type="checkbox"
          checked={reglas.stunnedReduceKept}
          onChange={(e) => set('stunnedReduceKept', e.target.checked)}
        />
        Stunned resta 1 dado guardado en vez de 1 dado (D-23)
      </label>

      <label className="regla-fila">
        <input
          type="checkbox"
          checked={reglas.stunnedDuro}
          onChange={(e) => set('stunnedDuro', e.target.checked)}
        />
        Stunned resta 1 dado del pool Y 1 dado guardado (A-11-N4)
      </label>

      <label className="regla-fila">
        <input
          type="checkbox"
          checked={reglas.retrocesoDefensorDiferencia2}
          onChange={(e) => set('retrocesoDefensorDiferencia2', e.target.checked)}
        />
        Ganar por diferencia ≥2 empuja 1 hex al defensor (A-11-N5)
      </label>

      <label className="regla-fila">
        <input
          type="checkbox"
          checked={reglas.tecnicasUnaPorRonda}
          onChange={(e) => set('tecnicasUnaPorRonda', e.target.checked)}
        />
        Una unidad solo puede usar UNA Técnica por ronda (A-11-N6)
      </label>

      <label className="regla-fila">
        <input
          type="checkbox"
          checked={reglas.reyProtegidoRonda1}
          onChange={(e) => set('reyProtegidoRonda1', e.target.checked)}
        />
        El Rey no puede ser objetivo en la Ronda 1 (A-11-N1)
      </label>

      <label className="regla-fila">
        <input
          type="checkbox"
          checked={!!reglas.habilitarHabilidadesCarta}
          onChange={(e) => set('habilitarHabilidadesCarta', e.target.checked)}
        />
        Cartas jugables como Habilidad elemental (D-24/25)
      </label>

      <label className="regla-fila">
        <input
          type="checkbox"
          checked={!!reglas.lugarHabilitado}
          onChange={(e) => set('lugarHabilitado', e.target.checked)}
        />
        Mecánica Lugar: capturar santuarios con Interactuar (D-26)
      </label>

      <label className="regla-fila">
        Curva de costes de acción (A-11-N3):
        <select
          value={JSON.stringify(reglas.costesAccion)}
          onChange={(e) => set('costesAccion', JSON.parse(e.target.value))}
        >
          <option value="[1,2,3,5]">1/2/3/5 (aprobada 05/08)</option>
          <option value="[1,3,5,9]">1/3/5/9 (original)</option>
        </select>
      </label>

      <div className="metricas">
        <strong>Métricas (D-20):</strong>
        PO perdidos {m.poPerdidos} · acciones ≥5 PO {m.accionesCaras} ·
        turnos solitarios {m.turnosSolitarios} · Rey A r{m.rondaMuerteReyA ?? '—'} ·
        Rey B r{m.rondaMuerteReyB ?? '—'}
      </div>
    </div>
  )
}
