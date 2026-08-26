import React from 'react'

const ICONOS = {
  mover: '🏃',
  atacar: '⚔',
  interactuar: '🔎',
  concentrar: '✨',
}

function Boton({ accion }) {
  const { id, nombre, coste, habilitada, motivo, onClick } = accion
  return (
    <button
      className={`btn-accion ${habilitada ? '' : 'btn-disabled'}`}
      disabled={!habilitada}
      onClick={onClick}
      title={motivo || undefined}
    >
      <span className="acc-icono">{ICONOS[id] || '·'}</span>
      <span className="acc-nombre">{nombre}</span>
      {coste != null && <span className="acc-coste">{coste} PO</span>}
      {!habilitada && motivo && <span className="acc-motivo">{motivo}</span>}
    </button>
  )
}

export default function ActionMenu({ acciones, tecnicasDefensa }) {
  return (
    <div className="action-menu">
      <h3 className="panel-titulo">Acciones</h3>
      <div className="acciones-basicas">
        {acciones.map(a => <Boton key={a.id} accion={a} />)}
      </div>
      {tecnicasDefensa && tecnicasDefensa.length > 0 && (
        <div className="tecnicas-defensa">
          <span className="acc-seccion">Técnicas defensivas</span>
          {tecnicasDefensa.map(t => <Boton key={t.id} accion={t} />)}
        </div>
      )}
    </div>
  )
}
