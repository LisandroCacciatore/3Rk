import React, { memo, useEffect, useRef, useState } from 'react'
import { aPixel } from '../engine/hex.js'
import { ARQUETIPOS } from '../data/archetypes.js'
import { simboloElemento, colorElemento } from './elementos.js'
import FormaArquetipo, { COLORES_JUGADOR, CrestaFaccion } from './glifos.jsx'
import { assetUnidad } from './assets.js'
import { spritePlacement } from './sprites.js'

// PASO 3 — ya no hay caja fija: cada sprite se coloca con su propio bbox medido
// (ver sprites.js). Los pies quedan anclados a la elipse de sombra (centro.y+2).

function mismaUnidad(a, b) {
  return (
    a.id === b.id &&
    a.jugador === b.jugador &&
    a.arquetipo === b.arquetipo &&
    a.pos.q === b.pos.q &&
    a.pos.r === b.pos.r &&
    a.heridas === b.heridas &&
    a.maxVida === b.maxVida &&
    a.activacionCerrada === b.activacionCerrada &&
    a.accionesEsteTurno === b.accionesEsteTurno &&
    (a.foco === b.foco ||
      (Array.isArray(a.foco) && Array.isArray(b.foco) && a.foco.length === b.foco.length)) &&
    JSON.stringify(a.estados || []) === JSON.stringify(b.estados || []) &&
    JSON.stringify(a.efectos || []) === JSON.stringify(b.efectos || [])
  )
}

function UnitToken({
  unidad,
  faccion,
  turnoActivo,
  seleccionado,
  objetivo,
  segundo,
  origen,
  objetivoHab,
  previewObjetivo,
  flashing,
  retroceso,
  onClick,
  onHover,
  onHoverEnd,
  onFlashEnd,
  onRetrocesoEnd,
}) {
  const [assetRoto, setAssetRoto] = useState(false)
  const centro = aPixel(unidad.pos, 30)

  // US-093 — Animación de movimiento. Puramente presentacional: al cambiar el
  // hex de la unidad, la ficha se renderiza primero en la posición anterior
  // (desplazamiento = vector origen→destino) y luego transiciona a su posición
  // lógica real. Al terminar, el sprite coincide exactamente con el motor.
  const prevPosRef = useRef(unidad.pos)
  const [desplazamiento, setDesplazamiento] = useState(null)
  if (prevPosRef.current !== unidad.pos) {
    const antes = aPixel(prevPosRef.current, 30)
    setDesplazamiento({ dx: antes.x - centro.x, dy: antes.y - centro.y })
    prevPosRef.current = unidad.pos
  }
  useEffect(() => {
    if (!desplazamiento) return
    const raf = requestAnimationFrame(() => setDesplazamiento(null))
    return () => cancelAnimationFrame(raf)
  }, [desplazamiento])

  const color = COLORES_JUGADOR[unidad.jugador] || '#888'
  // Facción del jugador (resuelta por el llamador con faccionDeJugador + estado);
  // null/undefined → sin sprite, glifo.
  const perfil = ARQUETIPOS[unidad.arquetipo] || {}
  const vidaMax = unidad.maxVida || perfil.vida || 2
  const heridas = unidad.heridas || 0
  const focoCap = perfil.foco || 0
  const atenuada = unidad.activacionCerrada
  const opacidad = atenuada ? 0.45 : 1
  // URL del sprite. null si el arquetipo/faccion no tiene asset registrado.
  const url = assetUnidad(faccion, unidad.arquetipo)
  // Colocación recortada al bbox real del sprite (PASO 3). null → glifo.
  const colocacion = url ? spritePlacement(faccion, unidad.arquetipo, centro) : null
  // Reset del fallo si cambia el asset (otra unidad/faccion/arquetipo).
  const lastUrl = useRef(url)
  if (lastUrl.current !== url) {
    lastUrl.current = url
    setAssetRoto(false)
  }
  const stunned = unidad.estados?.includes('Stunned')
  const muro = unidad.efectos?.includes('Muro')

  const colorAnillo = seleccionado ? '#ffd166'
    : objetivo ? '#ff6b6b'
    : segundo ? '#ffb06b'
    : previewObjetivo ? '#5fbfbf'
    : color
  const grosorAnillo = seleccionado ? 2.6 : (objetivo || segundo) ? 2.2 : previewObjetivo ? 1.5 : 1.4

  // Indicadores arriba de la cabeza del sprite (espacio del hex superior). La
  // fila se ancla al techo real de la colocación (colocacion.y), no a una cota
  // fija, para que nunca choque con la cabeza aunque el alto cambie por
  // arquetipo o por escala (PASO 6). Fallback glifo: techo estimado.
  const spriteTop = colocacion ? colocacion.y : centro.y - 30
  const cabezaY = spriteTop - 8
  const emojiY = cabezaY - 8
  const focoInicioX = centro.x + 3

  return (
    <g
      className={`unit-token${unidad.jugador === turnoActivo ? ' activo' : ''}${seleccionado ? ' seleccionado' : ''}${objetivo ? ' objetivo' : ''}${segundo ? ' segundo' : ''}${origen ? ' canalizador' : ''}${objetivoHab ? ' objetivo-hab' : ''}`}
      onClick={(e) => { e.stopPropagation(); onClick && onClick(unidad) }}
      onMouseEnter={() => onHover && onHover(unidad.id)}
      onMouseLeave={() => onHoverEnd && onHoverEnd()}
      opacity={opacidad}
      style={{
        cursor: 'pointer',
        transform: desplazamiento
          ? `translate(${desplazamiento.dx}px, ${desplazamiento.dy}px)`
          : undefined,
        transition: desplazamiento ? 'none' : undefined,
        // US-093 — hint de composición: solo durante el deslizamiento.
        willChange: desplazamiento ? 'transform' : undefined,
      }}
    >
      <title>{perfil.nombre}</title>

      <g
        className={`token-cuerpo${retroceso ? ' sacudida' : ''}`}
        onAnimationEnd={retroceso ? (e) => {
          if (e.animationName === 'token-sacudida') onRetrocesoEnd && onRetrocesoEnd(unidad.id)
        } : undefined}
      >
      {stunned && (
        <ellipse cx={centro.x} cy={centro.y + 2} rx="13" ry="5.5" fill="rgba(12,9,4,0.4)" />
      )}

      {/* Sombra de suelo ancha: asienta el sprite sobre el terreno (estilo FE).
        Con la cámara a zoom 1.4-2.5 los sprites se ven más grandes; la elipse
        exterior se refuerza (0.28 / rx 17) para que el anclaje no se diluya. */}
      <ellipse
        cx={centro.x}
        cy={centro.y + 3}
        rx="17"
        ry="7"
        fill="rgba(0,0,0,0.28)"
      />

      <ellipse
        cx={centro.x}
        cy={centro.y + 2}
        rx="13"
        ry="5.5"
        fill="rgba(0,0,0,0.42)"
      />

      {/* Arco de contraste bajo el anillo (FE GBA): una placa de contacto que garantiza
        que el token se recorte sobre cualquier terreno oscuro o claro. */}
      <ellipse
        cx={centro.x}
        cy={centro.y + 2}
        rx="12.4"
        ry="5.2"
        fill="none"
        stroke="rgba(6,5,3,0.65)"
        strokeWidth="1.1"
      />

      <ellipse
        className={`token-ring${flashing ? ' flashing' : ''}`}
        cx={centro.x}
        cy={centro.y + 2}
        rx="11.5"
        ry="4.6"
        fill="none"
        stroke={colorAnillo}
        strokeWidth={grosorAnillo}
        onAnimationEnd={flashing ? () => onFlashEnd && onFlashEnd(unidad.id) : undefined}
      />

      {/* Fallback glifo: SOLO cuando no hay asset registrado o la decodificacion
        fallo. Va debajo del <image>; cuando el sprite carga bien, no pinta nada
        detras (evita el glifo asomando). Con el <image> siempre montado si hay
        URL, onLoad puede limpiar el error: sin latch, auto-recuperacion. */}
      {(!url || assetRoto) && (
        <g className="token-sprite" transform={`translate(${centro.x}, ${centro.y})`}>
          <FormaArquetipo arquetipo={unidad.arquetipo} tamaño={1.25} />
        </g>
      )}
      {url && colocacion && (
        <image
          className="token-sprite"
          href={url}
          x={colocacion.x}
          y={colocacion.y}
          width={colocacion.width}
          height={colocacion.height}
          style={{ imageRendering: 'pixelated' }}
          onError={() => setAssetRoto(true)}
          onLoad={() => setAssetRoto(false)}
        />
      )}

      <g transform={`translate(${centro.x - 9}, ${cabezaY})`}>
        <CrestaFaccion faccion={faccion} color="#fff" tamaño={0.38} />
      </g>

      {focoCap > 0 && (
        <g>
          {unidad.foco.map((token, i) => (
            <rect
              key={`f${i}`}
              x={focoInicioX + i * 6.5}
              y={cabezaY}
              width={5.5}
              height={5.5}
              fill={colorElemento(token.elemento)}
              stroke="#1a1410"
              strokeWidth="0.5"
              rx="1"
            >
              <title>{token.elemento}</title>
            </rect>
          ))}
          {Array.from({ length: Math.max(0, focoCap - (unidad.foco?.length || 0)) }, (_, i) => (
            <rect
              key={`v${i}`}
              x={focoInicioX + (unidad.foco?.length || 0) * 6.5 + i * 6.5}
              y={cabezaY}
              width={5.5}
              height={5.5}
              fill="none"
              stroke="#d8c9a3"
              strokeWidth="0.5"
              rx="1"
            />
          ))}
        </g>
      )}

      {stunned && (
        <text x={centro.x - 12} y={emojiY} textAnchor="middle" fontSize="9">
          💫
        </text>
      )}

      {muro && (
        <text x={centro.x + 12} y={emojiY} textAnchor="middle" fontSize="8">
          🛡
        </text>
      )}

      {(() => {
        const ancho = 24
        const alto = 3
        const y = centro.y + 17
        const x = centro.x - ancho / 2
        const proporcion = Math.max(0, vidaMax - heridas) / vidaMax
        const color = proporcion > 0.66 ? '#6fbf7a' : proporcion > 0.33 ? '#e8c15a' : '#ff5252'
        return (
          <g>
            <rect
              x={x - 0.8}
              y={y - 0.8}
              width={ancho + 1.6}
              height={alto + 1.6}
              rx={2}
              fill="rgba(10,8,4,0.55)"
            />
            <rect
              x={x}
              y={y}
              width={ancho * proporcion}
              height={alto}
              rx={1.5}
              fill={color}
            />
          </g>
        )
      })()}
      </g>
    </g>
  )
}

export default memo(UnitToken, (prev, next) =>
  prev.faccion === next.faccion &&
  prev.turnoActivo === next.turnoActivo &&
  prev.seleccionado === next.seleccionado &&
  prev.objetivo === next.objetivo &&
  prev.segundo === next.segundo &&
  prev.origen === next.origen &&
  prev.previewObjetivo === next.previewObjetivo &&
  prev.flashing === next.flashing &&
  prev.retroceso === next.retroceso &&
  prev.onClick === next.onClick &&
  prev.onHover === next.onHover &&
  prev.onHoverEnd === next.onHoverEnd &&
  prev.onFlashEnd === next.onFlashEnd &&
  prev.onRetrocesoEnd === next.onRetrocesoEnd &&
  mismaUnidad(prev.unidad, next.unidad)
)
