import React from 'react'

// Glifos geométricos por arquetipo: formas simples, todas distintas, legibles a
// 30px dentro del token. Relleno blanco + trazo oscuro para contrastar sobre el
// color de la facción.
const FORMAS = {
  Peon: ({ color, stroke }) => (
    <circle r="7" fill={color} stroke={stroke} strokeWidth="1" />
  ),
  Alfil: ({ color, stroke }) => (
    <polygon points="0,-9 8,6 -8,6" fill={color} stroke={stroke} strokeWidth="1" strokeLinejoin="round" />
  ),
  Torre: ({ color, stroke }) => (
    <polygon points="-7,-7 -7,7 7,7 7,-7 -3,-7 -3,-3 3,-3 3,-7" fill={color} stroke={stroke} strokeWidth="1" strokeLinejoin="round" />
  ),
  Caballo: ({ color, stroke }) => (
    <polygon points="0,-9 8,0 0,9 -8,0" fill={color} stroke={stroke} strokeWidth="1" strokeLinejoin="round" />
  ),
  Campeon: ({ color, stroke }) => (
    <polygon
      points="0,-9 2.35,-3.24 8.56,-2.78 3.80,1.24 5.29,7.28 0,4 -5.29,7.28 -3.80,1.24 -8.56,-2.78 -2.35,-3.24"
      fill={color}
      stroke={stroke}
      strokeWidth="1"
      strokeLinejoin="round"
    />
  ),
  Rey: ({ color, stroke }) => (
    <polygon
      points="-9,7 -9,5 -6,-7 -3,5 0,-8 3,5 6,-7 9,5 9,7"
      fill={color}
      stroke={stroke}
      strokeWidth="1"
      strokeLinejoin="round"
    />
  ),
}

// Crestas de facción (identidad kemono feudal). Cada elemento además de su color
// tiene un símbolo propio: la cresta NO depende solo del color.
// Fuego (Husky/Lobo): Mon de 3 círculos. Agua (Poodle): rombo de 4 diamantes.
// Aire: ráfaga de viento. Tierra: montaña. Vacío: estrella de seis puntas.
const CRESTAS = {
  Fuego: ({ color, stroke }) => (
    <g>
      <circle cx="-3.6" cy="-2" r="3" fill={color} stroke={stroke} strokeWidth="0.6" />
      <circle cx="3.6" cy="-2" r="3" fill={color} stroke={stroke} strokeWidth="0.6" />
      <circle cx="0" cy="3.6" r="3" fill={color} stroke={stroke} strokeWidth="0.6" />
    </g>
  ),
  Agua: ({ color, stroke }) => (
    <g>
      <polygon points="-3.4,-4 0,-1.6 3.4,-4 0,-6.4" fill={color} stroke={stroke} strokeWidth="0.6" />
      <polygon points="-3.4,1 0,3.4 3.4,1 0,-1.6" fill={color} stroke={stroke} strokeWidth="0.6" />
      <polygon points="-3.4,6 0,8.4 3.4,6 0,3.4" fill={color} stroke={stroke} strokeWidth="0.6" />
      <polygon points="-3.4,-9 0,-6.6 3.4,-9 0,-11.4" fill={color} stroke={stroke} strokeWidth="0.6" />
    </g>
  ),
  Aire: ({ color, stroke }) => (
    <g fill="none" stroke={color} strokeWidth="1.4" strokeLinecap="round">
      <path d="M-7,-5 Q-3.5,-7 0,-5 T7,-5" />
      <path d="M-7,0 Q-3.5,-2 0,0 T7,0" />
      <path d="M-7,5 Q-3.5,3 0,5 T7,5" />
    </g>
  ),
  Tierra: ({ color, stroke }) => (
    <g>
      <polygon points="-8,6 0,-8 8,6" fill={color} stroke={stroke} strokeWidth="0.6" strokeLinejoin="round" />
      <path d="M-4.5,6 L-1,-1.5 L2,6" fill="none" stroke={stroke} strokeWidth="0.7" />
    </g>
  ),
  Vacio: ({ color, stroke }) => (
    <g>
      <polygon points="0,-8 7,6 -7,6" fill={color} stroke={stroke} strokeWidth="0.6" strokeLinejoin="round" />
      <polygon points="0,8 7,-6 -7,-6" fill="rgba(0,0,0,0.28)" stroke={color} strokeWidth="0.6" strokeLinejoin="round" />
    </g>
  ),
}

export function CrestaFaccion({ faccion, color = '#fff', stroke = 'rgba(0,0,0,0.45)', tamaño = 1 }) {
  const Forma = CRESTAS[faccion] || CRESTAS.Agua
  return (
    <g transform={`scale(${tamaño})`}>
      <Forma color={color} stroke={stroke} />
    </g>
  )
}

export const FACCIÓN_COLORES = {
  Fuego: '#e94560',
  Agua: '#3498db',
  Aire: '#3ec6c9',
  Tierra: '#c08a3e',
  Vacio: '#8a5ae0',
}

export const COLORES_JUGADOR = {
  A: '#e94560',
  B: '#3498db',
}

export default function FormaArquetipo({ arquetipo, color = '#fff', stroke = 'rgba(0,0,0,0.4)', tamaño = 1 }) {
  const Forma = FORMAS[arquetipo] || FORMAS.Peon
  return (
    <g transform={`scale(${tamaño})`}>
      <Forma color={color} stroke={stroke} />
    </g>
  )
}
