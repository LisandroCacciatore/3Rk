const STORAGE_KEY = 'escaramuza_descubiertas'

export const INTERACCIONES = {
  Explosion: { nombre: 'Explosión', elementos: ['Fuego', 'Fuego'], descripcion: '+1 dado, explosiona en 9+' },
  DobleTiro: { nombre: 'Doble Tiro', elementos: ['Aire', 'Agua'], descripcion: 'Ataque a dos objetivos adyacentes' },
  Muro: { nombre: 'Muro', elementos: ['Tierra', 'Tierra'], descripcion: '+1 dado guardado en defensa' },
  Reflujo: { nombre: 'Reflujo', elementos: ['Agua', 'Agua'], descripcion: 'Reintentar cualquier cantidad de dados' },
  Disipar: { nombre: 'Disipar', elementos: ['Vacío', 'Vacío'], descripcion: 'Cancela técnica enemiga o reduce dados guardados' },
}

export function cargarDescubiertas() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
  } catch {
    return []
  }
}

export function estaDescubierta(clave) {
  return cargarDescubiertas().includes(clave)
}

export function marcarDescubierta(clave) {
  const descubiertas = cargarDescubiertas()
  if (!descubiertas.includes(clave)) {
    descubiertas.push(clave)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(descubiertas))
    } catch {
      // silencio
    }
  }
}
