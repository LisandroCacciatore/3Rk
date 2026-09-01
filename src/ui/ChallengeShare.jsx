import React, { useState } from 'react'
import { ESCENARIOS } from '../data/scenarios.js'

function nombreEscenario(id) {
  const s = ESCENARIOS.find(e => e.id === id)
  return s ? s.nombre : id
}

export default function ChallengeShare({ estado }) {
  const [copiado, setCopiado] = useState(false)

  if (!estado.ganador) return null

  const facA = estado.jugadores?.A?.faccion || 'Fuego'
  const facB = estado.jugadores?.B?.faccion || 'Agua'
  const ganador = estado.ganador.ganador
  const motivo = estado.ganador.motivo
  const rondas = estado.ronda
  const seed = estado.semilla || 'random'
  const escenario = nombreEscenario(estado.escenario || 'base')

  const texto = [
    `⚔️ ESCARAMUZA CHALLENGE`,
    `Semilla: ${seed} | Mapa: ${escenario}`,
    `${facA} vs ${facB} | ${ganador === 'A' ? 'Victoria' : 'Derrota'} en R${rondas}`,
    `Motivo: ${motivo}`,
    `¿Podés ganar con esta semilla?`,
  ].join('\n')

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(texto)
    } catch {
      const ta = document.createElement('textarea')
      ta.value = texto
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
    }
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2000)
  }

  return (
    <button className="challenge-share-btn" onClick={copiar}>
      {copiado ? '✓ Copiado' : '⚔️ Copiar Challenge'}
    </button>
  )
}
