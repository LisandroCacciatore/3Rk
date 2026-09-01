import React, { useState } from 'react'
import { cartaAEsperanza } from '../engine/po.js'
import { simboloElemento, colorElemento, colorGlowElemento } from './elementos.js'
import { CrestaFaccion } from './glifos.jsx'
import { assetCarta } from './assets.js'
import POBar from './POBar.jsx'

// Etiquetas de lectura derivadas del catálogo de habilidad (datos de
// src/data/cards.js), nunca reglas nuevas: bando del objetivo y filtro de rol.
function textoObjetivo(habilidad) {
  if (!habilidad || habilidad.objetivo === 'cualquiera') return 'Cualquiera'
  if (habilidad.objetivo === 'aliado') return 'Aliado'
  if (habilidad.objetivo === 'enemigo') return 'Enemigo'
  return 'Cualquiera'
}

function filtroTexto(habilidad) {
  const filtro = habilidad && habilidad.filtro
  if (!filtro) return null
  if (filtro.arquetipos) return `solo ${filtro.arquetipos.join(', ')}`
  if (filtro.rol) return `solo ${filtro.rol}`
  return 'solo objetivo válido'
}

// Arte de carta con fallback al glifo/cresta: si el PNG no existe, se dibuja el
// placeholder SVG sin romper la interfaz (mismo patrón que los sprites de unidad).
function CartaArte({ elemento, faccion }) {
  const [rota, setRota] = useState(false)
  const src = assetCarta(elemento)
  if (src && !rota) {
    return (
      <img
        className="carta-img"
        src={src}
        alt={elemento}
        onError={() => setRota(true)}
      />
    )
  }
  return (
    <svg className="carta-cresta" viewBox="-12 -12 24 24" preserveAspectRatio="xMidYMid meet">
      <CrestaFaccion faccion={faccion} color="#fff" tamaño={1.1} />
    </svg>
  )
}

// Mano en abanico inferior-centro (PASO 5): cartas superpuestas con leve
// rotación. El hover eleva la carta activa y muestra un preview puro (arte +
// coste + descripción, sin botones); el click marca la carta como seleccionada
// y abre el menú de acción (CartaActionMenu) por fuera. La carta obligatoria
// deshabilita todo el abanico. Pura presentación; reglas en el motor.
export default function HandPanel({
  jugador,
  activo,
  cartaJugada,
  cartaSeleccionada,
  onCartaClick,
}) {
  const [hover, setHover] = useState(null)

  if (!activo) {
    return (
      <div className="mano-abanico">
        <div className="mano-vacia">
          <span className="acc-motivo">Mano rival oculta ({jugador.mano.length} cartas)</span>
        </div>
      </div>
    )
  }

  const mano = jugador.mano || []
  const mostrarIdx = hover != null ? hover : cartaSeleccionada
  const cartaMostrada = mostrarIdx != null && !cartaJugada ? mano[mostrarIdx] : null
  const habilidadMostrada = cartaMostrada && cartaMostrada.habilidad
  const centro = (mano.length - 1) / 2

  return (
    <div className="mano-abanico">
      <div className="mano-abanico-cab">
        <POBar jugador={jugador} />
        {cartaJugada && <span className="acc-motivo">Carta obligatoria ya jugada este turno</span>}
      </div>

      <div className="mano-fan">
        {mano.map((carta, i) => {
          const jugada = cartaJugada
          const elevada = hover === i || cartaSeleccionada === i
          const rot = (i - centro) * 7
          return (
            <button
              key={i}
              type="button"
              className={`carta-fan ${elevada ? 'elevada' : ''} ${cartaSeleccionada === i ? 'seleccionada' : ''} ${jugada ? 'carta-deshabilitada' : ''}`}
              style={{
                '--rot': `${rot}deg`,
                '--color-elem': colorElemento(carta.elemento),
                '--glow': colorGlowElemento(carta.elemento),
                zIndex: elevada ? 30 : i,
              }}
              onClick={(e) => {
                if (jugada) return
                e.stopPropagation()
                onCartaClick(i)
              }}
              disabled={jugada}
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
              title={`${carta.elemento} ${carta.valor} — genera ${cartaAEsperanza(carta)} PO`}
              aria-label={`Carta ${carta.elemento} ${carta.valor}`}
            >
              <span className="carta-fan-arte">
                <CartaArte elemento={carta.elemento} faccion={jugador.faccion} />
              </span>
              <span className="carta-fan-simbolo">{simboloElemento(carta.elemento)}</span>
              <span className="carta-fan-valor">{carta.valor}</span>
            </button>
          )
        })}
        {mano.length === 0 && <span className="acc-motivo">Sin cartas en la mano</span>}
      </div>

      {!cartaJugada && cartaMostrada && (
        <div
          className="carta-abanico-preview"
          style={{ '--color-elem': colorElemento(cartaMostrada.elemento) }}
        >
          {/* I. Cabecera: nombre de la habilidad + badge de valor (PO). */}
          <div className="carta-detalle-cab">
            <span className="carta-preview-titulo">
              {habilidadMostrada ? habilidadMostrada.nombre : cartaMostrada.tipo}
            </span>
            <span className="carta-detalle-pobadge">
              <span className="carta-detalle-povalor">{cartaMostrada.valor}</span>
              <span className="carta-detalle-polabel">PO</span>
            </span>
          </div>

          {/* II. Ilustración central (caja cuadrada con arte del elemento). */}
          <span className="carta-preview-arte">
            <CartaArte elemento={cartaMostrada.elemento} faccion={jugador.faccion} />
          </span>

          {/* III. Franja de iconos: elemento · tipo · objetivo/filtro. */}
          <div className="carta-detalle-badges">
            <span className="carta-detalle-badge">
              {simboloElemento(cartaMostrada.elemento)} {cartaMostrada.elemento}
            </span>
            <span className="carta-detalle-badge">{cartaMostrada.tipo}</span>
            <span className="carta-detalle-badge">Objetivo: {textoObjetivo(habilidadMostrada)}</span>
            {filtroTexto(habilidadMostrada) && (
              <span className="carta-detalle-badge carta-detalle-filtro">{filtroTexto(habilidadMostrada)}</span>
            )}
          </div>

          {/* IV. Caja de texto: coste como Orden y descripción de la habilidad. */}
          <div className="carta-preview-cuerpo">
            <span className="carta-preview-coste">
              {cartaAEsperanza(cartaMostrada)} PO (Orden)
            </span>
            <span className="carta-preview-desc">
              {habilidadMostrada
                ? habilidadMostrada.descripcion
                : 'Carta sin habilidad adicional.'}
            </span>
          </div>

          {/* V. Pie: tipo de carta y bando/objetivo permitido. */}
          <div className="carta-detalle-pie">
            <span>Tipo: {cartaMostrada.tipo}</span>
            <span>
              Objetivo: {textoObjetivo(habilidadMostrada)}
              {filtroTexto(habilidadMostrada) ? ` · ${filtroTexto(habilidadMostrada)}` : ''}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

// Menú de acción de la carta seleccionada: se abre al hacer clic en una carta
// del abanico (backdrop + popover centrado). "Jugar como Orden" siempre está
// disponible; "Jugar como Habilidad" se deshabilita con el motivo cuando la
// carta no tiene habilidad o D-27 está apagado. Pura presentación; reglas en
// el motor (las acciones se despachan desde App).
export function CartaActionMenu({
  carta,
  faccion,
  habilitarHabilidades,
  onJugarOrden,
  onJugarHabilidad,
  onCerrar,
}) {
  const habilidad = carta.habilidad
  const motivoHabilidad = !habilidad
    ? 'Esta carta no tiene habilidad'
    : !habilitarHabilidades
      ? 'Habilidades de carta desactivadas (D-27)'
      : null
  const costeOrden = cartaAEsperanza(carta)

  // Calcular magnitud escalada para mostrar en el menú
  let magnitudTexto = ''
  if (habilidad) {
    const base = habilidad.magnitudBase ?? habilidad.magnitud ?? 0
    if (habilidad.escalaConValor === 'multiplicar') {
      const val = base * carta.valor
      magnitudTexto = base !== val ? ` (${val})` : ''
    } else if (habilidad.escalaConValor === 'sumar') {
      const val = base + (carta.valor - 1)
      magnitudTexto = base !== val ? ` (${val})` : ''
    }
  }

  return (
    <div className="carta-menu-overlay">
      <div className="carta-menu-backdrop" onClick={onCerrar} />
      <div
        className="carta-action-menu"
        style={{ '--color-elem': colorElemento(carta.elemento) }}
        role="dialog"
        aria-label="Opciones de la carta"
      >
        <div className="carta-menu-titulo">
          {habilidad ? habilidad.nombre : carta.tipo}
          <span className="carta-menu-carta">
            {simboloElemento(carta.elemento)} {carta.elemento} {carta.valor}
          </span>
        </div>
        <div className="carta-menu-arte">
          <CartaArte elemento={carta.elemento} faccion={faccion} />
        </div>
        <button className="btn-jugar" onClick={onJugarOrden}>
          Jugar como Orden ({costeOrden} PO {simboloElemento(carta.elemento)})
        </button>
        <button
          className="btn-jugar btn-habilidad"
          disabled={!!motivoHabilidad}
          onClick={onJugarHabilidad}
          title={motivoHabilidad || undefined}
        >
          Jugar como Habilidad{habilidad ? `: ${habilidad.nombre}${magnitudTexto}` : ''}
        </button>
        {motivoHabilidad && <span className="acc-motivo carta-menu-motivo">{motivoHabilidad}</span>}
        <button className="btn-cancelar" onClick={onCerrar}>
          Cancelar
        </button>
      </div>
    </div>
  )
}
