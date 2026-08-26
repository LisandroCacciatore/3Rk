// US-095 — Indicadores flotantes de combate.
// Puro feedback de presentación: se dispara EXCLUSIVAMENTE por eventos reales
// del motor en estado.log (herida, stunned, retroceso, retroceso-defensor,
// eliminacion, ataque con explosión). La UI jamás infiere resultados de
// combate; solo traduce los eventos que el motor ya registró.
import React, { useEffect, useRef, useState } from 'react'
import { aPixel } from '../engine/hex.js'
import { resumenDado } from './adapter.js'

let contadorGlobal = 0

function posDeUnidad(estado, prevEstado, id) {
  const u = estado.unidades.find(x => x.id === id)
  if (u) return u.pos
  const p = prevEstado && prevEstado.unidades.find(x => x.id === id)
  return p ? p.pos : null
}

function eventosConPopup(estado, prevEstado, desde) {
  const popups = []
  for (const ev of estado.log.slice(desde)) {
    if (!ev || ev.tipo === 'error') continue

    if (ev.tipo === 'herida') {
      const hex = posDeUnidad(estado, prevEstado, ev.unidadId)
      if (hex) popups.push({ id: ++contadorGlobal, tipo: 'herida', texto: '-1 HP', hex })
    } else if (ev.tipo === 'stunned') {
      const hex = posDeUnidad(estado, prevEstado, ev.unidadId)
      if (hex) popups.push({ id: ++contadorGlobal, tipo: 'stunned', texto: 'STUNNED', hex })
    } else if (ev.tipo === 'retroceso' || ev.tipo === 'retroceso-defensor') {
      // Solo si hubo desplazamiento real ("retrocede a"), no si el hex estaba ocupado.
      if (ev.descripcion && ev.descripcion.includes('retrocede a')) {
        const hex = posDeUnidad(estado, prevEstado, ev.unidadId)
        if (hex) popups.push({ id: ++contadorGlobal, tipo: 'retroceso', texto: 'RETROCESO', hex })
      }
    } else if (ev.tipo === 'eliminacion') {
      const hex = posDeUnidad(estado, prevEstado, ev.unidadId)
      if (hex) popups.push({ id: ++contadorGlobal, tipo: 'eliminado', texto: 'ELIMINADO', hex })
    } else if (ev.tipo === 'ataque' && ev.detalle) {
      const det = ev.detalle
      // La explosión ya la muestra el overlay CombatResult; acá se repite como
      // flotante sobre el bando que explotó, usando la misma lectura de datos
      // (resumenDado), nunca una determinación propia.
      const atqExploto = (det.dadosAtaque || []).some(d => resumenDado(d).exploto)
      const defExploto = (det.dadosDefensa || []).some(d => resumenDado(d).exploto)
      if (atqExploto) {
        const hex = posDeUnidad(estado, prevEstado, det.atacante)
        if (hex) popups.push({ id: ++contadorGlobal, tipo: 'explosion', texto: 'EXPLOSIÓN', hex })
      }
      if (defExploto) {
        const hex = posDeUnidad(estado, prevEstado, det.defensor)
        if (hex) popups.push({ id: ++contadorGlobal, tipo: 'explosion', texto: 'EXPLOSIÓN', hex })
      }
    }
  }
  return popups
}

const DURACION_MS = 1500

export default function CombatFeedback({ estado }) {
  const [popups, setPopups] = useState([])
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
    const nuevos = eventosConPopup(estado, prevEstadoRef.current, desde)
    prevEstadoRef.current = estado
    if (nuevos.length === 0) return
    setPopups(prev => [...prev, ...nuevos])
    for (const p of nuevos) {
      const t = setTimeout(() => {
        setPopups(prev => prev.filter(x => x.id !== p.id))
      }, DURACION_MS)
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
    <g className="combate-feedback" pointerEvents="none">
      {popups.map((p, i) => {
        const c = aPixel(p.hex, 30)
        return (
          <g
            key={p.id}
            className={`combate-flotante cf-${p.tipo}`}
            style={{ animationDelay: `${i * 0.12}s` }}
          >
            <text x={c.x} y={c.y - 24} textAnchor="middle">
              {p.texto}
            </text>
          </g>
        )
      })}
    </g>
  )
}
