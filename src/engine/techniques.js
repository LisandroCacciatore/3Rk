import { ARQUETIPOS } from '../data/archetypes.js'

export const TECNICAS = {
  Explosion: {
    nombre: 'Explosion',
    coste: { Fuego: 2 },
    arquetipos: ['Peon', 'Campeon'],
    tipo: 'ataque',
    descripcion: '+1 dado al pool, explosión con 9+',
  },
  DobleTiro: {
    nombre: 'Doble Tiro',
    coste: { Aire: 1, Agua: 1 },
    arquetipos: ['Alfil'],
    tipo: 'ataque',
    descripcion: 'Ataque a distancia impacta a dos objetivos adyacentes',
  },
  Muro: {
    nombre: 'Muro',
    coste: { Tierra: 2 },
    arquetipos: ['Torre'],
    tipo: 'defensa',
    descripcion: 'Keep +1 en Defensa hasta la próxima activación',
  },
  Reflujo: {
    nombre: 'Reflujo',
    coste: { Agua: 2 },
    arquetipos: ['Alfil', 'Campeon'],
    tipo: 'ataque',
    descripcion: 'Repetir cualquier cantidad de dados, una vez',
  },
  Disipar: {
    nombre: 'Disipar',
    coste: { Vacio: 2 },
    arquetipos: ['Campeon'],
    tipo: 'ataque',
    descripcion: 'Anula Técnica defensiva o reduce 1 dado guardado',
  },
}

export function tecnicasDisponibles(arquetipo) {
  return Object.values(TECNICAS).filter(t =>
    t.arquetipos.includes(arquetipo)
  )
}

export function puedeDeclarar(unidad, tecnica, opciones = {}) {
  const t = TECNICAS[tecnica]
  if (!t) return { ok: false, motivo: 'Técnica desconocida' }
  if (!t.arquetipos.includes(unidad.arquetipo)) {
    return { ok: false, motivo: `${unidad.arquetipo} no puede usar ${t.nombre}` }
  }
  const reglas = opciones.reglas || {}

  // A-11-N6: límite de UNA Técnica por ronda por unidad
  if (reglas.tecnicasUnaPorRonda && (unidad.tecnicasUsadasEsteRonda || 0) >= 1) {
    return { ok: false, motivo: 'ya usó su Técnica esta ronda' }
  }

  // Solo tokens en Foco (sin pago mixto) - controlado por flag tecnicasSoloFoco
  if (reglas.tecnicasSoloFoco !== false) {
    for (const [elem, cant] of Object.entries(t.coste)) {
      const tokens = unidad.foco.filter(f => f.elemento === elem).length
      if (tokens < cant) {
        return { ok: false, motivo: `Faltan ${cant - tokens} token(s) de ${elem} en Foco` }
      }
    }
    return { ok: true }
  }

  // Legacy: pago mixto (si flag OFF) - mantenido por compatibilidad
  const capacidad = ARQUETIPOS[unidad.arquetipo].foco
  const carta = opciones.carta
  for (const [elem, cant] of Object.entries(t.coste)) {
    const tokens = unidad.foco.filter(f => f.elemento === elem).length
    const faltan = cant - tokens
    if (faltan <= 0) continue
    const excedenteCubrible = Math.max(0, cant - capacidad)
    const cartaValida = !!carta && carta.elemento === elem
    if (!cartaValida) {
      return { ok: false, motivo: `Faltan ${faltan} token(s) de ${elem}` }
    }
    if (faltan > excedenteCubrible) {
      return { ok: false, motivo: 'la carta solo cubre el excedente sobre la capacidad de Foco' }
    }
  }
  return { ok: true }
}

export function declararTecnica(unidad, tecnica, opciones = {}) {
  const chequeo = puedeDeclarar(unidad, tecnica, opciones)
  if (!chequeo.ok) return chequeo

  const t = TECNICAS[tecnica]
  const nuevosTokens = [...unidad.foco]
  for (const [elem, cant] of Object.entries(t.coste)) {
    const aQuitar = Math.min(
      nuevosTokens.filter(f => f.elemento === elem).length,
      cant
    )
    for (let i = 0; i < aQuitar; i++) {
      const idx = nuevosTokens.findIndex(f => f.elemento === elem)
      nuevosTokens.splice(idx, 1)
    }
  }
  // A-11-N6: registrar el uso de la Técnica de esta ronda.
  unidad.tecnicasUsadasEsteRonda = (unidad.tecnicasUsadasEsteRonda || 0) + 1
  return { ok: true, tokens: nuevosTokens, tecnica: t }
}

export function aplicarEfectoTecnica(unidad, tecnica) {
  if (tecnica === 'Muro') {
    if (!unidad.efectos.includes('Muro')) {
      unidad.efectos.push('Muro')
    }
    return { ok: true }
  }
  return { ok: false, motivo: `${tecnica} no tiene efecto pasivo` }
}