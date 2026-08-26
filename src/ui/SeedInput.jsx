import React, { useEffect, useState } from 'react'

export default function SeedInput({ value, onAplicar }) {
  const [texto, setTexto] = useState(value)

  useEffect(() => {
    setTexto(value)
  }, [value])

  const aplicar = () => onAplicar(texto.trim() || value)

  return (
    <input
      className="seed-input"
      value={texto}
      onChange={(e) => setTexto(e.target.value)}
      onKeyDown={(e) => { if (e.key === 'Enter') aplicar() }}
      onBlur={aplicar}
      placeholder="semilla"
      title="Semilla de la próxima partida"
    />
  )
}
