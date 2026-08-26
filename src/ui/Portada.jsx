import React from 'react'
import { CrestaFaccion } from './glifos.jsx'
import { assetUnidad } from './assets.js'
import SeedInput from './SeedInput.jsx'
import MapaPreview from './MapaPreview.jsx'

// Identidad visual de cada facción en el lobby (solo presentación). La paleta
// del lobby es una decisión estética propia y puede diferir de la del tablero:
// las reglas no dependen de estos colores.
const FACCION_UI = {
  Fuego: { especie: "Clan Husky · cánidos oscuros", lema: "Hakama negras, yumi y katanas", color: "#e94560" },
  Agua: { especie: "Clan Poodle · nobles caniches", lema: "Armaduras de rosa y dorado", color: "#e84393" },
  Tierra: { especie: "Clan Akita · canes de la montaña", lema: "Armaduras pesadas y kanabō", color: "#0984e3" },
  Aire: { especie: "Clan Shiba · sabuesos veloces", lema: "Túnicas ligeras y naginatas", color: "#8e44ad" },
}

function AvatarRey({ faccion, color, className }) {
  const sprite = assetUnidad(faccion, 'Rey')
  if (sprite) {
    return <img src={sprite} alt={faccion} className={`${className}-sprite`} />
  }
  return (
    <svg className={`${className}-crest`} viewBox="-14 -14 28 28">
      <circle r="13" fill={color} stroke="#1a1410" strokeWidth="1.5" />
      <CrestaFaccion faccion={faccion} color="#fff" tamaño={1.1} />
    </svg>
  )
}

function Placa({ faccion, color, especie, lema }) {
  return (
    <div className="portada-placa" style={{ '--color-fac': color }}>
      <div className="portada-placa-avatar">
        <AvatarRey faccion={faccion} color={color} className="portada-placa" />
      </div>
      <div className="portada-placa-info">
        <strong className="banda-nombre">{faccion.toUpperCase()}</strong>
        <span className="banda-especie">{especie}</span>
        <span className="banda-lema">{lema}</span>
      </div>
    </div>
  )
}

function TarjetaFaccion({ faccion, color, seleccionada, onSeleccionar }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={seleccionada}
      aria-label={`Elegir ${faccion}`}
      className={`portada-card${seleccionada ? ' selected' : ''}`}
      style={{ '--color-fac': color }}
      onClick={() => onSeleccionar(faccion)}
    >
      <span className="portada-card-avatar">
        <AvatarRey faccion={faccion} color={color} className="portada-card" />
      </span>
      <span className="portada-card-nombre">{faccion}</span>
    </button>
  )
}

function SelectorJugador({ etiqueta, faccion, onFaccion, conBot = false, modoSolitario, onModoSolitario }) {
  const meta = FACCION_UI[faccion] || FACCION_UI.Fuego
  return (
    <div className="portada-selector">
      <div className="portada-selector-head">
        <label className="portada-label-jugador">{etiqueta}</label>
        {conBot && (
          <label className="portada-bot-toggle">
            <input
              type="checkbox"
              checked={!!modoSolitario}
              onChange={(e) => onModoSolitario?.(e.target.checked)}
            />
            <span>Jugar contra IA (Bot)</span>
          </label>
        )}
      </div>
      <Placa faccion={faccion} color={meta.color} especie={meta.especie} lema={meta.lema} />
      <div className="portada-card-grid" role="radiogroup" aria-label={`Elegir facción del ${etiqueta}`}>
        {Object.keys(FACCION_UI).map(fKey => (
          <TarjetaFaccion
            key={fKey}
            faccion={fKey}
            color={FACCION_UI[fKey].color}
            seleccionada={fKey === faccion}
            onSeleccionar={onFaccion}
          />
        ))}
      </div>
    </div>
  )
}

export default function Portada({
  semilla,
  onSemilla,
  escenarios = [],
  escenarioSel = 'base',
  onEscenario,
  faccionA = 'Fuego',
  onFaccionA,
  faccionB = 'Agua',
  onFaccionB,
  modoSolitario = false,
  onModoSolitario,
  onComenzar,
}) {
  const escenario = escenarios.find(s => s.id === escenarioSel)
  return (
    <div className="portada">
      <div className="portada-titulo">
        <span className="portada-kicker">Escaramuza táctica feudal · prototipo de playtest</span>
        <h1>ESCARAMUZA</h1>
        <p className="portada-sub">Un juego de tablero táctico con deckbuilding</p>
      </div>

      <div className="portada-banderas">
        <SelectorJugador etiqueta="JUGADOR 1 (A)" faccion={faccionA} onFaccion={onFaccionA} />
        <div className="portada-vs">VS</div>
        <SelectorJugador
          etiqueta="JUGADOR 2 (B)"
          faccion={faccionB}
          onFaccion={onFaccionB}
          conBot
          modoSolitario={modoSolitario}
          onModoSolitario={onModoSolitario}
        />
      </div>

      <div className="portada-controls">
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
        <button className="btn-nueva btn-comenzar" onClick={onComenzar}>
          ⚔️ COMENZAR ESCARAMUZA
        </button>
      </div>

      <div className="portada-mapa">
        <MapaPreview escenarioId={escenarioSel} semilla={semilla} />
        <p className="portada-mapa-caption">
          {escenario?.nombre}
          {` — ${escenario?.concepto ?? ''}`}
        </p>
      </div>

      <p className="portada-pie">
        El motor de reglas manda: esta interfaz solo presenta su estado.
      </p>
    </div>
  )
}
