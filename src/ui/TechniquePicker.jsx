import React from 'react'
import { simboloElemento, colorElemento } from './elementos.js'
import { cantidadPorElemento } from '../engine/focus.js'

export default function TechniquePicker({
  tecnicas,
  seleccionada,
  onSeleccionar,
  requiereSegundo,
  segundoOk,
  segundoNombre,
  foco = [],
}) {
  const tokens = cantidadPorElemento({ foco })

  return (
    <div className="technique-picker">
      <span className="acc-seccion">Técnica de este ataque</span>
      <button
        className={`btn-tecnica ${!seleccionada ? 'seleccionada' : ''}`}
        onClick={() => onSeleccionar(null)}
      >
        <span className="tecnica-nombre">Ninguna</span>
      </button>
      {tecnicas.map(t => (
        <button
          key={t.id}
          className={`btn-tecnica ${seleccionada === t.id ? 'seleccionada' : ''} ${!t.ok ? 'btn-disabled' : ''}`}
          disabled={!t.ok}
          onClick={() => onSeleccionar(t.id)}
          title={t.motivo || t.descripcion || undefined}
        >
          <span className="tecnica-cab">
            <span className="tecnica-nombre">{t.nombre}</span>
            {t.costeMapa && (
              <span className="tec-chips">
                {Object.entries(t.costeMapa).map(([elem, n]) => {
                  const presentes = tokens[elem] || 0
                  const cubierto = presentes >= n
                  return (
                    <span
                      key={elem}
                      className={`tec-chip ${cubierto ? 'cubierto' : 'faltante'}`}
                      style={{ '--color-elem': colorElemento(elem) }}
                      title={`${presentes}/${n} token(s) de ${elem} en Foco`}
                    >
                      {simboloElemento(elem)}×{n}
                    </span>
                  )
                })}
              </span>
            )}
          </span>
          {t.descripcion && <span className="acc-motivo">{t.descripcion}</span>}
          {!t.ok && t.motivo && <span className="acc-motivo motivo">{t.motivo}</span>}
        </button>
      ))}
      {requiereSegundo && (
        <p className="acc-motivo">
          {segundoOk
            ? `Segundo objetivo: ${segundoNombre}.`
            : 'Selecciona un segundo objetivo adyacente al primero.'}
        </p>
      )}
    </div>
  )
}
