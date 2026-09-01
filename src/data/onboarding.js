const STORAGE_KEY = 'escaramuza_tutorial_completado'

export function tutorialCompletado() {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'true'
  } catch {
    return false
  }
}

export function marcarTutorialCompletado() {
  try {
    localStorage.setItem(STORAGE_KEY, 'true')
  } catch {
    // silencio
  }
}

export const ONBOARDING_PASOS = [
  { trigger: 'carta-jugada', texto: 'Cada carta tiene 3 usos: Orden (PO), Foco (energía) o Habilidad. Jugá una carta.' },
  { trigger: 'unidad-seleccionada', texto: 'Seleccioná una unidad y elegí una acción: Mover, Atacar o Concentrar.' },
  { trigger: 'modo-atacar', texto: 'Tocá un objetivo enemigo dentro del rango de ataque.' },
  { trigger: 'ataque', texto: 'Mirá el resultado en el panel de combate. Dados que explotan encadenan más dados.' },
  { trigger: 'herida', texto: '¡Herida! El sistema es D10 Roll & Keep: tirás N dados, guardás los mejores K.' },
  { trigger: 'ronda-2', texto: '¡Ya sabés lo básico! Descubrí las Técnicas (Foco x2) y las Habilidades de cada carta.' },
]
