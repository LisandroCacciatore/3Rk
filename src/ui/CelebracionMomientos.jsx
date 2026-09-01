import React, { useEffect, useRef, useState } from 'react'
import { aPixel } from '../engine/hex.js'

let contadorCelebracion = 0

function detectarCelebraciones(estado, prevEstado, desde) {
  const celebraciones = []
  for (const ev of estado.log.slice(desde)) {
    if (!ev || ev.tipo === 'error') continue

    if (ev.tipo === 'ataque' && ev.detalle) {
      const det = ev.detalle
      const explosionesAtq = (det.dadosAtaque || []).filter(d => d.includes('+')).length
      const explosionesDef = (det.dadosDefensa || []).filter(d => d.includes('+')).length
      const totalExplosiones = explosionesAtq + explosionesDef

      if (totalExplosiones >= 3) {
        const hex = det.atacante ? estado.unidades.find(u => u.id === det.atacante)?.pos : null
        if (hex) {
          celebraciones.push({
            id: ++contadorCelebracion,
            tipo: 'explosion-cadena',
            texto: totalExplosiones >= 5 ? '¡CADENA IMPARABLE!' : '¡FUEGO RENACE!',
            hex,
            duracion: 2500,
          })
        }
      }

      if (ev.tecnica) {
        const hex = det.atacante ? estado.unidades.find(u => u.id === det.atacante)?.pos : null
        if (hex) {
          const nombres = { Explosion: '¡EXPLOSIÓN!', DobleTiro: '¡DOBLE TIRO!', Muro: '¡MURO!', Reflujo: '¡REFLUJO!', Disipar: '¡DISIPAR!' }
          celebraciones.push({
            id: ++contadorCelebracion,
            tipo: 'tecnica',
            texto: nombres[ev.tecnica] || `¡${ev.tecnica.toUpperCase()}!`,
            hex,
            duracion: 2000,
          })
        }
      }
    }

    if (ev.tipo === 'herida') {
      const u = estado.unidades.find(u => u.id === ev.unidadId)
      if (u && u.arquetipo === 'Rey') {
        const hex = u.pos
        celebraciones.push({
          id: ++contadorCelebracion,
          tipo: 'rey-amenaza',
          texto: u.heridas >= u.maxVida ? '¡REY DERROTADO!' : '¡EL REY HERIDO!',
          hex,
          duracion: 3000,
        })
      }
    }
  }
  return celebraciones
}

const DURACION_DEFAULT = 2000

export default function CelebracionMomientos({ estado }) {
  const [celebraciones, setCelebraciones] = useState([])
  const logVistoRef = useRef(estado.log.length)
  const prevEstadoRef = useRef(null)
  const timersRef = useRef([])

  useEffect(() => {
    const desde = logVistoRef.current
    const actual = estado.log.length
    logVistoRef.current = actual
    if (actual <= desde) {
      prevEstadoRef.current = estado
      return
    }
    const nuevas = detectarCelebraciones(estado, prevEstadoRef.current, desde)
    prevEstadoRef.current = estado
    if (nuevas.length === 0) return
    setCelebraciones(prev => [...prev, ...nuevas])
    for (const c of nuevas) {
      const t = setTimeout(() => {
        setCelebraciones(prev => prev.filter(x => x.id !== c.id))
      }, c.duracion || DURACION_DEFAULT)
      timersRef.current.push(t)
    }
  }, [estado])

  useEffect(() => {
    return () => {
      timersRef.current.forEach(clearTimeout)
      timersRef.current = []
    }
  }, [])

  return (
    <g className="celebracion-momentos" pointerEvents="none">
      {celebraciones.map((c) => {
        const pos = aPixel(c.hex, 30)
        return (
          <g key={c.id} className={`celebracion-celebracion cele-${c.tipo}`}>
            <text x={pos.x} y={pos.y - 48} textAnchor="middle" className="celebracion-texto">
              {c.texto}
            </text>
          </g>
        )
      })}
    </g>
  )
}
