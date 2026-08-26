import React, { memo } from 'react'
import { aPixel, verticesHex } from '../engine/hex.js'
import { TERRENOS, TERRENO_PLANO, LETRA_TERRENO, tono } from './terrenoVisual.jsx'
import { assetTerreno } from './terrenoImagen.js'

// Terreno y estados del hexágono. Cada estado se distingue por forma + símbolo,
// nunca solo por color (en capturas de playtest se pierde el matiz).
//
// PASO 6 — hexágonos lisos: el relleno es un tono plano por terreno (sin
// texturas ni gradientes de relieve), con la grilla como trazo liviano. Los
// overlays de estado viven en una capa <path> translúcida sobre el terreno.
//
// PASO 8 — arte por tile (D-29+): si el tipo tiene asset registrado
// (assetTerreno), un <image> recortado con #hex-clip se dibuja sobre el tono
// plano; el tono queda como fondo de respaldo si el PNG falta o falla al
// decodificar. En modo esquemático no se monta (siguen las letras del terreno).
//
// Invariante: exactamente UN <polygon> por hex (el del terreno, sin clase propia)
// dentro del <g class="hex-tile">; el bisel, los overlays y el arte son <path> o
// <image>, nunca <polygon> extra. Ver skill estilo-mapa-tactico.

// Overlays de estado: translúcidos (el terreno sigue legible debajo) y con borde
// propio.
//
// UI-04 (mundo inmersivo): la grilla base es un trazo muy liviano sobre el
// terreno (las referencias muestran el mapa y la malla se dibuja encima); los
// estados funcionales se pintan con rellenos translúcidos suaves sobre el piso.
// Paleta: movimiento = azul, alcance de ataque = rojo, objetivo = rojo intenso
// (se diferencia del alcance por intensidad + el anillo/retícula del token),
// amenaza = rosa pálido, seleccionado/captura = ámbar. Cada estado sigue con
// símbolo y/o estilo de trazo además del color (regla símbolo+color).
const ESTILOS = {
  normal: { stroke: 'rgba(10,22,10,0.14)', strokeWidth: 0.45, dash: null, simbolo: null },
  bloqueado: { fill: 'rgba(42,36,24,0.82)', stroke: 'rgba(122,106,74,0.5)', strokeWidth: 1, dash: '4 3', simbolo: '✕' },
  alcanzable: { fill: 'rgba(52,152,219,0.30)', stroke: '#7ab8ff', strokeWidth: 1.3, dash: '5 3', simbolo: '●' },
  rango: { fill: 'rgba(200,60,60,0.26)', stroke: '#ff6b6b', strokeWidth: 1, dash: '3 3', simbolo: '◉' },
  objetivo: { fill: 'rgba(150,30,30,0.34)', stroke: '#ff5252', strokeWidth: 2.2, dash: null, simbolo: null },
  objetivo2: { fill: 'rgba(150,90,30,0.32)', stroke: '#ffb06b', strokeWidth: 1.8, dash: '5 3', simbolo: null },
  seleccionado: { fill: 'rgba(230,200,110,0.24)', stroke: '#ffd166', strokeWidth: 2, dash: null, simbolo: null },
  preview: { fill: 'rgba(38,160,180,0.26)', stroke: '#a8e6f0', strokeWidth: 1.2, dash: '2 4', simbolo: null },
  amenaza: { fill: 'rgba(180,60,60,0.18)', stroke: '#ff9a9a', strokeWidth: 1, dash: '3 4', simbolo: null },
  captura: { fill: 'rgba(200,160,60,0.30)', stroke: '#ffd166', strokeWidth: 1.6, dash: '5 3', simbolo: '⚑' },
}

const rutaHex = (cx, cy, radio) => {
  const pts = verticesHex(radio).map(v =>
    `${(cx + v.x).toFixed(1)},${(cy + v.y).toFixed(1)}`
  )
  return `M${pts.join(' L')} Z`
}

// Terrenos de borde del campo jugable: la grilla se atenúa (menor opacidad)
// para que el centro (prado/camino) conserve el máximo contraste (PASO 7).
const TERRENO_TENUE = new Set(['agua', 'montaña'])

// Peñasco que identifica un hex bloqueado en modo inmersivo (PASO 7): el ✕ solo
// queda para el modo esquemático de playtest. Pura presentación; el motor solo
// sabe que el hex está en `tablero.bloqueados`.
function Penasco({ centro }) {
  return (
    <g className="bloqueo-penasco" pointerEvents="none">
      <ellipse cx={centro.x} cy={centro.y + 9} rx={8} ry={2.6} fill="rgba(0,0,0,0.35)" />
      <path d="M -5 7 L -3.5 -1 L 0 -5 L 3.5 -2.5 L 6 6 Z" fill="#6b614d" stroke="#241f15" strokeWidth="0.8" strokeLinejoin="round" />
      <path d="M 0 -5 L 1.5 -9 L 4.5 -6.5 L 3.5 -2.5 Z" fill="#837862" stroke="#241f15" strokeWidth="0.7" strokeLinejoin="round" />
      <path d="M -2 -2 L 0.5 -4.5 L 2 -1 L 0.5 0.5 Z" fill="#8f8469" stroke="#241f15" strokeWidth="0.6" strokeLinejoin="round" />
    </g>
  )
}

const INTERACTIVOS = new Set([
  'alcanzable', 'rango', 'objetivo', 'objetivo2', 'seleccionado',
  'captura', 'canalizador', 'objetivo-hab', 'preview', 'amenaza',
])

function HexTile({ q, r, estado = 'normal', terreno = 'prado', onClick, children, esquematico = false }) {
  const tamaño = 30
  const centro = aPixel({ q, r }, tamaño)
  const verts = verticesHex(tamaño)
  const puntos = verts.map(v => `${centro.x + v.x},${centro.y + v.y}`).join(' ')
  const estilo = ESTILOS[estado] || ESTILOS.normal
  const paleta = (TERRENOS[terreno] || TERRENOS.prado).fill
  // Solo los hexes con un estado accionable son clickeables (cursor pointer);
  // el resto (normal/bloqueado) no insinúa interacción.
  const interactivo = INTERACTIVOS.has(estado)
  // Relleno base: modo esquemático = color plano por terreno; si no, tono plano
  // por terreno con variación determinista por hex (hexágonos lisos, sin
  // texturas ni relieves).
  const fillBase = esquematico
    ? (TERRENO_PLANO[terreno] || TERRENO_PLANO.prado)
    : tono(paleta, q, r)
  // Overlay de estado sobre la textura (solo cuando el estado lo pide).
  const tieneOverlay = estado !== 'normal' && !!estilo.fill
  // Letra del terreno en modo esquemático (los bloqueados ya llevan ✕).
  const letra = esquematico && terreno !== 'bloqueado' ? LETRA_TERRENO[terreno] : null
  // Arte del tile: solo en modo inmersivo y si el tipo tiene asset registrado.
  // El <g> traduce el origen al centro del hex para que el recorte #hex-clip
  // (definido alrededor de su propio origen en el defs del tablero) quede
  // centrado en CADA tile; el tono plano de abajo sigue de fondo.
  const tileUrl = !esquematico ? assetTerreno(terreno) : null

  return (
    <g
      className={`hex-tile${interactivo ? ' interactivo' : ''} estado-${estado} terreno-${terreno}${esquematico ? ' esquematico' : ''}`}
      onClick={() => onClick && onClick({ q, r })}
      style={{ cursor: interactivo ? 'pointer' : 'default' }}
    >
      <polygon
        points={puntos}
        fill={fillBase}
        stroke={esquematico
          ? 'rgba(12,26,12,0.42)'
          : TERRENO_TENUE.has(terreno) ? 'rgba(10,22,10,0.09)' : 'rgba(10,22,10,0.16)'}
        strokeWidth={esquematico ? 0.7 : 0.5}
      />
      {/* Arte del tile: recortado al hex, encima del tono plano. Sin latch: si el
        PNG falta o falla, el tinte de respaldo queda visible debajo. */}
      {tileUrl && (
        <g
          transform={`translate(${centro.x} ${centro.y})`}
          clipPath="url(#hex-clip)"
          className="hex-tile-arte"
          pointerEvents="none"
        >
          <image
            className="hex-tile-img"
            href={tileUrl}
            x={-30}
            y={-30}
            width={60}
            height={60}
            preserveAspectRatio="xMidYMid slice"
          />
        </g>
      )}
      {/* Letra de terreno: identificación esquemática, arriba del hex (no choca
        con el símbolo de estado del centro ni con la ficha). */}
      {letra && (
        <text
          className="terreno-letra"
          x={centro.x}
          y={centro.y - 8}
          textAnchor="middle"
          fontSize="8"
          fill="#f4ead0"
          style={{ paintOrder: 'stroke', stroke: 'rgba(20,24,14,0.9)', strokeWidth: 1.2, strokeLinejoin: 'round' }}
          pointerEvents="none"
        >
          {letra}
        </text>
      )}
      {/* Overlay de estado: capa translúcida + borde + símbolo sobre el terreno. */}
      {tieneOverlay && (
        <path
          d={rutaHex(centro.x, centro.y, 30)}
          fill={estilo.fill}
          stroke={estilo.stroke}
          strokeWidth={estilo.strokeWidth}
          strokeDasharray={estilo.dash}
          pointerEvents="none"
        />
      )}
      {estilo.simbolo && !(estado === 'bloqueado' && !esquematico) && (
        <text
          x={centro.x}
          y={centro.y + 4}
          textAnchor="middle"
          fontSize="10"
          fill="#e8d9b0"
          opacity="0.9"
          pointerEvents="none"
        >
          {estilo.simbolo}
        </text>
      )}
      {estado === 'bloqueado' && !esquematico && <Penasco centro={centro} />}
      {/* Lugar (D-26): santuario a capturar. Desaparece al capturarse, porque
        la casilla pasa a 'bloqueado' y el terreno ya no es 'lugar'. En modo
        esquemático solo queda su letra (L), sin el dibujo del santuario. */}
      {terreno === 'lugar' && !esquematico && (
        <g pointerEvents="none">
          <ellipse cx={centro.x} cy={centro.y + 8} rx={9} ry={3} fill="rgba(20,16,8,0.35)" />
          <rect x={centro.x - 3.4} y={centro.y + 1} width={6.8} height={7} rx="1" fill="#9c9378" stroke="rgba(40,34,20,0.8)" strokeWidth="0.6" />
          <rect x={centro.x - 4.6} y={centro.y + 5.5} width={9.2} height={2.4} rx="1" fill="#6f674e" stroke="rgba(30,26,16,0.8)" strokeWidth="0.6" />
          <line x1={centro.x} y1={centro.y + 1} x2={centro.x} y2={centro.y - 7} stroke="rgba(58,48,28,0.9)" strokeWidth="1.1" strokeLinecap="round" />
          <circle cx={centro.x} cy={centro.y - 7} r={3.4} fill="#e9c46a" stroke="#8a6d1f" strokeWidth="0.8" />
          <circle cx={centro.x - 0.9} cy={centro.y - 7.8} r={1} fill="rgba(255,250,220,0.85)" />
        </g>
      )}
      {children}
    </g>
  )
}

export default memo(HexTile)
