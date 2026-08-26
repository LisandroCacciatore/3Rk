export function totalPO(jugador) {
  return jugador.po.reduce((sum, p) => sum + p.cantidad, 0)
}

export function poPorElemento(jugador) {
  const mapa = {}
  for (const p of jugador.po) {
    mapa[p.elemento] = (mapa[p.elemento] || 0) + p.cantidad
  }
  return mapa
}

export function gastarPO(jugador, cantidad) {
  const total = totalPO(jugador)
  if (total < cantidad) return { ok: false, restante: total }

  const po = [...jugador.po]
  let restante = cantidad

  for (let i = 0; i < po.length && restante > 0; i++) {
    if (po[i].cantidad <= restante) {
      restante -= po[i].cantidad
      po[i] = { ...po[i], cantidad: 0 }
    } else {
      po[i] = { ...po[i], cantidad: po[i].cantidad - restante }
      restante = 0
    }
  }

  const consumidos = jugador.po.filter(p => p.cantidad > 0).length - po.filter(p => p.cantidad > 0).length
  return {
    ok: true,
    po: po.filter(p => p.cantidad > 0),
    consumidos: cantidad,
  }
}

export function limpiarPO(jugador) {
  return { ...jugador, po: [] }
}

export function cartaAEsperanza(carta) {
  const mapa = { Fuego: '🔥', Agua: '💧', Aire: '🌪️', Tierra: '🌍', Vacio: '◼️' }
  return `${mapa[carta.elemento] || '?'}${carta.valor}`
}

export function estaEnMano(jugador, indice) {
  return indice >= 0 && indice < jugador.mano.length
}

export function jugarCarta(jugador, indice) {
  if (!estaEnMano(jugador, indice)) return null
  const carta = jugador.mano[indice]
  const nuevaMano = [...jugador.mano]
  nuevaMano.splice(indice, 1)
  return {
    carta,
    mano: nuevaMano,
    descarte: [...jugador.descarte, carta],
    poGenerados: { elemento: carta.elemento, cantidad: carta.valor + 1 },
  }
}

export function puedeJugarCarta(jugador) {
  return jugador.mano.length > 0
}
