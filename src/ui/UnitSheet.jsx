import React, { useState } from 'react'
import { ARQUETIPOS } from '../data/archetypes.js'
import { simboloElemento, colorElemento } from './elementos.js'
import FormaArquetipo, { COLORES_JUGADOR, CrestaFaccion } from './glifos.jsx'
import {
  faccionDeJugador,
  obtenerTecnicasAtaque,
  obtenerTecnicasDefensa,
  costeTecnicaTexto,
  descripcionStunned,
} from './adapter.js'
import { cantidadPorElemento } from '../engine/focus.js'
import { TECNICAS } from '../engine/techniques.js'
import { poolAtaque, poolDefensa } from '../engine/combat.js'
import { assetUnidad } from './assets.js'
import { spritePlacement } from './sprites.js'

const ICONOS_ATRIB = {
  movimiento: (
    <path d="M2 8h9M7 4l4 4-4 4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  ),
  ataque: (
    <path d="M10 1 L15 6 M4 10 L6 12 M1 15 L6 10 M3 3 L13 13" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
  ),
  defensa: (
    <path d="M8 1C5 2 3 4 3 7c0 4 3 6 5 8 2-2 5-4 5-8 0-3-2-5-5-6z" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
  ),
  vida: (
    <path d="M8 13C4 10 2 7 2 5c0-2 2-3 3-3 .8 0 1.6.4 3 1.3C9.4 2.4 10.2 2 11 2c1 0 3 1 3 3 0 2-2 5-6 8z" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
  ),
  rango: (
    <g>
      <circle cx="8" cy="8" r="4.5" fill="none" stroke="currentColor" strokeWidth="1.3" />
      <path d="M8 0v3M8 13v3M0 8h3M13 8h3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </g>
  ),
  foco: (
    <path d="M3 4h10l2 4-7 7-7-7zM3 4l2 4h6l2-4M5 8l3 7 3-7" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
  ),
}

function IconoAtributo({ tipo }) {
  return (
    <svg className="fich-icono" viewBox="0 0 16 16" aria-hidden="true">
      {ICONOS_ATRIB[tipo]}
    </svg>
  )
}

function TecnicaFila({ tecnica, tokens }) {
  const t = TECNICAS[tecnica.id]
  return (
    <div className={`tecnica-fila ${tecnica.ok ? 'ok' : ''}`} title={tecnica.motivo || t?.descripcion}>
      <span className="tecnica-nombre">{tecnica.nombre}</span>
      <span className="tecnica-coste">
        {Object.entries(tecnica.costeMapa || {}).map(([elem, n]) => {
          const presentes = tokens[elem] || 0
          const ok = presentes >= n
          return (
            <span
              key={elem}
              className={`tecnica-req ${ok ? 'cubierto' : ''}`}
              style={{ '--color-elem': colorElemento(elem) }}
              title={`${presentes}/${n} token(s) de ${elem}`}
            >
              {simboloElemento(elem)} {presentes}/{n}
            </span>
          )
        })}
      </span>
      <span className={`tecnica-estado ${tecnica.ok ? 'ok' : ''}`}>
        {tecnica.ok ? 'Disponible' : tecnica.motivo}
      </span>
    </div>
  )
}

// Retrato de la unidad: recorta el sprite del mapa (el mismo PNG de
// public/assets/units/) dentro de un marco de retrato, con fallback al glifo si
// no hay asset o falla la decodificación. Presentacional, sin reglas.
function RetratoUnidad({ faccion, arquetipo, colorBanda }) {
  const [roto, setRoto] = useState(false)
  const url = assetUnidad(faccion, arquetipo)
  const p = url ? spritePlacement(faccion, arquetipo, { x: 48, y: 56 }) : null
  const ok = url && p && !roto
  if (!ok) {
    return (
      <svg className="fich-retrato-glifo" viewBox="-13 -13 26 26" aria-hidden="true">
        <circle r="12" fill={colorBanda} stroke="#1a1410" strokeWidth="1" />
        <FormaArquetipo arquetipo={arquetipo} tamaño={0.95} />
      </svg>
    )
  }
  return (
    <svg className="fich-retrato-svg" viewBox="0 0 96 96" aria-hidden="true">
      <defs>
        <clipPath id="fich-hex-clip">
          <polygon points="82.6,68 48,88 13.4,68 13.4,28 48,8 82.6,28" />
        </clipPath>
      </defs>
      <image
        href={url}
        x={p.x}
        y={p.y}
        width={p.width}
        height={p.height}
        clipPath="url(#fich-hex-clip)"
        style={{ imageRendering: 'pixelated' }}
        onError={() => setRoto(true)}
        onLoad={() => setRoto(false)}
      />
    </svg>
  )
}

// Color de vida por proporción (verde → amarillo → rojo), compartido por la
// barra y por el atributo numérico para lectura inmediata.
function colorVida(heridas, maxVida) {
  const proporcion = Math.max(0, maxVida - heridas) / maxVida
  return proporcion > 0.66 ? '#6fbf7a' : proporcion > 0.33 ? '#e8c15a' : '#ff5252'
}

function BarraVida({ heridas, maxVida }) {
  const proporcion = Math.max(0, maxVida - heridas) / maxVida
  const color = colorVida(heridas, maxVida)
  return (
    <div className="fich-hp">
      <div className="fich-hp-barra">
        <div className="fich-hp-barra-llena" style={{ width: `${proporcion * 100}%`, background: color }} />
        <span className="fich-hp-letra" style={{ color }}>
          Vida {heridas}/{maxVida}
        </span>
      </div>
    </div>
  )
}

export default function UnitSheet({ estado, unidad, costeProxima, esTurnoDe, rivalSeleccionada }) {
  if (!unidad) {
    return (
      <div className="unit-sheet vacio">
        <h3 className="panel-titulo">Ficha de unidad</h3>
        <p className="placeholder">
          {rivalSeleccionada
            ? 'Ficha rival oculta — seleccioná una de tus unidades.'
            : 'Selecciona una unidad para ver su ficha.'}
        </p>
      </div>
    )
  }

  const perfil = ARQUETIPOS[unidad.arquetipo]
  const colorBanda = COLORES_JUGADOR[unidad.jugador] || '#888'
  const faccion = faccionDeJugador(unidad.jugador, estado)
  const focoActual = unidad.foco || []
  const focoCap = perfil.foco || 0
  const tokens = cantidadPorElemento(unidad)
  const tecAtaque = obtenerTecnicasAtaque(estado, unidad.id)
  const tecDefensa = obtenerTecnicasDefensa(estado, unidad.id)
  const tecnicas = [...tecAtaque, ...tecDefensa]
  const stunned = unidad.estados?.includes('Stunned')
  // Pools efectivos del motor (combat.js): ya incluyen bonos de carta
  // (bonoPoolAtaque/bonoPoolDefensa) y Muro (keep +1). La ficha los resalta en
  // azul (bono activo) o rojo (disipado en la próxima defensa) — presentación,
  // el motor es la única fuente.
  const poolAtq = poolAtaque(unidad)
  const poolDef = poolDefensa(unidad)
  const bonoAtq = unidad.bonoPoolAtaque || 0
  const bonoDef = unidad.bonoPoolDefensa || 0
  const muro = unidad.efectos?.includes('Muro')
  const disipado = unidad.disipadoDefensa || 0
  const atqMod = bonoAtq > 0
  const defMod = bonoDef > 0 || muro || disipado > 0

  return (
    <div className="unit-sheet" style={{ '--color-banda': colorBanda }}>
      <div className="fich-cabecera">
        <RetratoUnidad faccion={faccion} arquetipo={unidad.arquetipo} colorBanda={colorBanda} />
        <div className="fich-titulos">
          <h3>
            {perfil.nombre} <span className="fich-id">({unidad.id})</span>
          </h3>
          <p className="fich-sub" title={`Hex (${unidad.pos.q}, ${unidad.pos.r})`}>
            {faccion} · Clase {unidad.arquetipo} · J{unidad.jugador}
          </p>
          <BarraVida heridas={unidad.heridas} maxVida={unidad.maxVida} />
        </div>
        <svg className="fich-cresta" viewBox="-12 -12 24 24" width="22" height="22">
          <circle r="11" fill={colorBanda} stroke="#1a1410" strokeWidth="1" />
          <CrestaFaccion faccion={faccion} color="#fff" tamaño={0.85} />
        </svg>
      </div>

      <div className="fich-atributos">
        <div className="fich-atrib"><span className="fich-atrib-label"><IconoAtributo tipo="movimiento" /> Movimiento</span><span className="fich-atrib-valor">{perfil.movimiento}</span></div>
        <div className="fich-atrib">
          <span className="fich-atrib-label"><IconoAtributo tipo="ataque" /> Ataque</span>
          <span className={`fich-atrib-valor${atqMod ? ' mod-azul' : ''}`}>
            {poolAtq.dados}g{poolAtq.keep}
            {atqMod && <span className="fich-atrib-mod">+{bonoAtq} dado</span>}
          </span>
        </div>
        <div className="fich-atrib">
          <span className="fich-atrib-label"><IconoAtributo tipo="defensa" /> Defensa</span>
          <span className={`fich-atrib-valor${defMod ? (disipado > 0 ? ' mod-rojo' : ' mod-azul') : ''}`}>
            {poolDef.dados}g{poolDef.keep}
            {bonoDef > 0 && <span className="fich-atrib-mod">+{bonoDef} dado</span>}
            {muro && <span className="fich-atrib-mod">Muro +1 keep</span>}
            {disipado > 0 && <span className="fich-atrib-mod">−1 guardado próx. defensa</span>}
          </span>
        </div>
        <div className="fich-atrib"><span className="fich-atrib-label"><IconoAtributo tipo="vida" /> Vida</span><span className="fich-atrib-valor" style={{ color: colorVida(unidad.heridas, unidad.maxVida) }}>{unidad.heridas}/{unidad.maxVida}</span></div>
        <div className="fich-atrib"><span className="fich-atrib-label"><IconoAtributo tipo="rango" /> Rango</span><span className="fich-atrib-valor">{perfil.rango}</span></div>
        <div className="fich-atrib"><span className="fich-atrib-label"><IconoAtributo tipo="foco" /> Foco</span><span className="fich-atrib-valor">{focoActual.length}/{focoCap}</span></div>
      </div>

      <div className="fich-foco">
        <strong>Foco:</strong>
        <div className="fich-foco-slots">
          {Array.from({ length: focoCap }, (_, i) => {
            const token = focoActual[i]
            return token ? (
              <span
                key={i}
                className="foco-slot lleno"
                style={{ '--color-elem': colorElemento(token.elemento) }}
                title={token.elemento}
              >
                {simboloElemento(token.elemento)}
              </span>
            ) : (
              <span key={i} className="foco-slot vacio" />
            )
          })}
          {focoCap === 0 && <span className="acc-motivo">sin Foco</span>}
        </div>
      </div>

      {tecnicas.length > 0 && (
        <div className="fich-tecnicas">
          <strong>Técnicas:</strong>
          {tecnicas.map(t => (
            <TecnicaFila key={t.id} tecnica={t} tokens={tokens} />
          ))}
        </div>
      )}

      <div className="fich-estados">
        <strong>Estados:</strong>{' '}
        {(unidad.estados || []).length === 0 && (unidad.efectos || []).length === 0
          ? 'ninguno'
          : [
              ...(stunned ? [`💫 Stunned — ${descripcionStunned(estado.reglas)}`] : []),
              ...(unidad.estados || []).filter(e => e !== 'Stunned').map(e => `💫 ${e}`),
              ...(unidad.efectos || []).map(e => `🛡 ${e}`),
            ].join(' · ')}
      </div>

      <div className="fich-acciones">
        <strong>Acciones este turno:</strong> {unidad.accionesEsteTurno}
        {unidad.activacionCerrada ? (
          <span className="motivo"> · ya atacó, activación cerrada</span>
        ) : esTurnoDe ? (
          <span> · próxima acción cuesta {costeProxima} PO</span>
        ) : null}
      </div>
    </div>
  )
}
