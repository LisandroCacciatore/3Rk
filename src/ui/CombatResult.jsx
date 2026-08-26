import React from 'react'
import { resumenDado } from './adapter.js'
import { faccionDeJugador } from './adapter.js'
import FormaArquetipo, { COLORES_JUGADOR, CrestaFaccion } from './glifos.jsx'

function Dado({ valores, index, minimo }) {
  const r = resumenDado(valores)
  return (
    <span
      className={`dado ${r.exploto ? 'exploto' : ''}`}
      style={{ animationDelay: `${index * 0.12}s` }}
      title={r.exploto ? `Explosión: ${r.valores.join(' + ')}` : `Valor: ${r.valores[0]}`}
    >
      <span className="dado-facha">
        <span className="dado-cadena">
          {r.valores.map((v, i) => (
            <span key={i} className={i === 0 ? 'dado-primario' : 'dado-exploto'}>
              {i > 0 && <small>+</small>}
              {v}
            </span>
          ))}
        </span>
        {minimo !== undefined && <small className="dado-umbral">{minimo}+</small>}
      </span>
      {r.exploto && <span className="dado-explosion">EXPLOSIÓN</span>}
    </span>
  )
}

function Bando({ titulo, nombre, pool, dados, kept, suma, info }) {
  return (
    <div className={`combate-bando ${titulo.toLowerCase()}`}>
      <span className="combate-nombre">
        {info && (
          <svg className="combate-mini" viewBox="-11 -11 22 22" width="22" height="22">
            <circle r="11" fill={COLORES_JUGADOR[info.jugador] || '#888'} stroke="#1a1410" strokeWidth="1" />
            <FormaArquetipo arquetipo={info.arquetipo} tamaño={0.7} />
            <CrestaFaccion faccion={info.faccion} color="#fff" tamaño={0.34} />
          </svg>
        )}
        <span>
          {titulo}: {nombre}
        </span>
      </span>
      <div className="combate-pool">
        <span className="combate-pool-tag">{pool}</span>
        {dados.map((d, i) => (
          <Dado key={i} valores={d} index={i} />
        ))}
      </div>
      <div className="combate-kept">
        <span className="acc-seccion">Guardados:</span>{' '}
        {kept.join(' + ')} <strong className="combate-suma">= {suma}</strong>
      </div>
    </div>
  )
}

export default function CombatResult({ detalle, onCerrar, estado }) {
  if (!detalle) return null

  const info = (id) => {
    if (!estado) return null
    const u = estado.unidades.find(x => x.id === id)
    if (!u) return null
    return {
      jugador: u.jugador,
      arquetipo: u.arquetipo,
      faccion: faccionDeJugador(u.jugador, estado),
    }
  }

  return (
    <div className="combate-overlay">
      <div className="combate-panel">
        <header className="combate-titulo">
          <span>
            {detalle.atacante} <span className="combate-flecha">⚔</span> {detalle.defensor}
          </span>
          <span className="combate-rol">
            {detalle.arquetipoAtacante} contra {detalle.arquetipoDefensor}
          </span>
        </header>

        <div className="combate-bandas">
          <Bando
            titulo="Atacante"
            nombre={detalle.atacante}
            pool={detalle.poolAtaque}
            dados={detalle.dadosAtaque}
            kept={detalle.keptAtaque}
            suma={detalle.sumaAtaque}
            info={info(detalle.atacante)}
          />
          <div className="combate-vs">VS</div>
          <Bando
            titulo="Defensor"
            nombre={detalle.defensor}
            pool={detalle.poolDefensa}
            dados={detalle.dadosDefensa}
            kept={detalle.keptDefensa}
            suma={detalle.sumaDefensa}
            info={info(detalle.defensor)}
          />
        </div>

        <div className={`combate-resultado ${detalle.resultado.includes('gana ataque') ? 'gana-atacante' : ''}`}>
          {detalle.resultado}
        </div>

        <button className="btn-combate-cerrar" onClick={onCerrar}>
          Continuar
        </button>
      </div>
    </div>
  )
}
