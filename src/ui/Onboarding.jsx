import React from 'react'
import { ONBOARDING_PASOS } from '../data/onboarding.js'

export default function Onboarding({ paso, onCerrar }) {
  if (paso >= ONBOARDING_PASOS.length) return null
  const actual = ONBOARDING_PASOS[paso]
  return (
    <div className="onboarding-banner">
      <span className="onboarding-paso">{paso + 1}/{ONBOARDING_PASOS.length}</span>
      <span className="onboarding-texto">{actual.texto}</span>
      <button className="onboarding-cerrar" onClick={onCerrar} aria-label="Ocultar guía">
        ×
      </button>
    </div>
  )
}
