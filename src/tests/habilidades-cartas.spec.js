import { describe, it, expect } from 'vitest'
import { aplicarIntencion } from '../engine/index.js'
import { HABILIDADES_POR_CARTA } from '../data/cards.js'
import { armarEstado, unidad, buscarUnidad } from './helpers.js'

// D-27 (US-163): la habilidad es de la CARTA (catálogo por carta), sin gate de
// rol. Se elige un origen (unidad aliada, cualquiera) y un objetivo que cumple
// el filtro de la carta en rango/LoS del origen. Reglas de habilidad ON.

function cartaDe(clave, extras = {}) {
  const elemento = clave.replace(/\d/, '')
  const valor = Number(clave.slice(-1))
  return { elemento, valor, tipo: 'Hechizo', habilidad: HABILIDADES_POR_CARTA[clave], ...extras }
}

// Estado base: A (activo) juega `carta` desde `origen` hacia `objetivo`.
function base(carta, opts = {}) {
  return armarEstado({
    turnoDe: 'A',
    reglas: { habilitarHabilidadesCarta: true },
    jugadores: {
      A: { mano: [carta], descarte: opts.descarteA || [] },
    },
    unidades: [
      unidad(
        opts.origenId || 'Origen', 'A', opts.origenArquetipo || 'Peon',
        opts.origenPos || { q: 0, r: 0 }
      ),
      unidad(
        opts.objetivoId || 'Objetivo', opts.objetivoJugador || 'B',
        opts.objetivoArquetipo || 'Peon',
        opts.objetivoPos || { q: 1, r: 0 },
        opts.objetivoExtras || {}
      ),
    ],
  })
}

function jugarHabilidad(estado, opts = {}) {
  return aplicarIntencion(estado, {
    tipo: 'JUGAR_CARTA', jugador: 'A', indiceCarta: 0, uso: 'habilidad',
    unidad: opts.origen || 'Origen', objetivo: opts.objetivo || 'Objetivo',
  })
}

describe('US-160 — Jugar una carta como habilidad (uso excluyente)', () => {
  it('Jugar por habilidad no genera PO', () => {
    const estado = base(cartaDe('Fuego3'))
    const nuevo = jugarHabilidad(estado)
    expect(nuevo.jugadores.A.po).toHaveLength(0)
    expect(nuevo.jugadores.A.mano).toHaveLength(0)
    expect(nuevo.jugadores.A.descarte).toHaveLength(1)
  })

  it('Jugar por habilidad consume la carta obligatoria del turno', () => {
    const estado = base(cartaDe('Fuego1'))
    estado.jugadores.A.mano.push(cartaDe('Agua2'))
    const tras = jugarHabilidad(estado)
    expect(tras.cartaJugadaEsteTurno).toBe(true)
    const seg = aplicarIntencion(tras, { tipo: 'JUGAR_CARTA', jugador: 'A', indiceCarta: 0, uso: 'orden' })
    expect(seg.log.some(l => l.tipo === 'error' && l.descripcion.includes('ya jugó'))).toBe(true)
  })

  it('Flag apagado conserva el MVP actual', () => {
    const estado = base(cartaDe('Fuego3'))
    estado.reglas.habilitarHabilidadesCarta = false
    const rechazado = jugarHabilidad(estado)
    expect(rechazado.jugadores.A.mano).toHaveLength(1)
    expect(rechazado.jugadores.A.po).toHaveLength(0)
    expect(rechazado.log.some(l => l.tipo === 'error' && l.descripcion.includes('deshabilitadas'))).toBe(true)
    const orden = aplicarIntencion(estado, { tipo: 'JUGAR_CARTA', jugador: 'A', indiceCarta: 0, uso: 'orden' })
    expect(orden.jugadores.A.po).toEqual([{ elemento: 'Fuego', cantidad: 3 }])
  })
})

describe('US-163 — La habilidad es de la carta, no de la unidad', () => {
  it('Cualquier unidad aliada puede ser origen, sin importar su rol', () => {
    // Fuego1 (tipo Hechizo) antes solo lo canalizaba un Mago; ahora el origen
    // puede ser un Guerrero (Peón) sin restricción.
    const estado = base(cartaDe('Fuego1'))
    const nuevo = jugarHabilidad(estado)
    expect(buscarUnidad(nuevo, 'Objetivo').heridas).toBe(1)
    expect(nuevo.log.some(l => l.tipo === 'error')).toBe(false)
  })

  it('Una carta sin habilidad no puede jugarse como Habilidad', () => {
    const estado = base({ elemento: 'Fuego', valor: 1, tipo: 'Hechizo', habilidad: null })
    const res = jugarHabilidad(estado)
    expect(res.jugadores.A.mano).toHaveLength(1)
    expect(res.log.some(l => l.tipo === 'error' && l.descripcion.includes('no tiene habilidad'))).toBe(true)
  })

  it('El objetivo debe estar en rango del origen', () => {
    const estado = base(cartaDe('Fuego1'), { objetivoPos: { q: 3, r: 0 } })
    const res = jugarHabilidad(estado)
    expect(res.jugadores.A.mano).toHaveLength(1)
    expect(res.log.some(l => l.tipo === 'error' && l.descripcion.includes('fuera de rango'))).toBe(true)
  })

  it('Filtro de bando: una carta de aliado rechaza enemigos', () => {
    const estado = base(cartaDe('Agua2'))
    const res = jugarHabilidad(estado)
    expect(res.jugadores.A.mano).toHaveLength(1)
    expect(res.log.some(l => l.tipo === 'error' && l.descripcion.includes('solo a unidades aliadas'))).toBe(true)
  })

  it('Filtro de bando: una carta de enemigo rechaza aliados', () => {
    const estado = base(cartaDe('Fuego1'), { objetivoJugador: 'A' })
    const res = jugarHabilidad(estado)
    expect(res.jugadores.A.mano).toHaveLength(1)
    expect(res.log.some(l => l.tipo === 'error' && l.descripcion.includes('solo a unidades enemigas'))).toBe(true)
  })

  it('Filtro por arquetipo: Escudo solo afecta a Torre', () => {
    const estado = base(cartaDe('Agua3'), { objetivoJugador: 'A', objetivoArquetipo: 'Peon' })
    const res = jugarHabilidad(estado)
    expect(res.jugadores.A.mano).toHaveLength(1)
    expect(res.log.some(l => l.tipo === 'error' && l.descripcion.includes('solo afecta a Torre'))).toBe(true)
  })

  it('Filtro por rol: Avalancha solo afecta a Guerreros', () => {
    const estado = base(cartaDe('Tierra3'), { objetivoJugador: 'A', objetivoArquetipo: 'Alfil' })
    const res = jugarHabilidad(estado)
    expect(res.jugadores.A.mano).toHaveLength(1)
    expect(res.log.some(l => l.tipo === 'error' && l.descripcion.includes('solo afecta a unidades Guerrero'))).toBe(true)
  })
})

describe('US-163 — Efectos propios de cada carta (magnitud escala con valor)', () => {
  it('Fuego1 Chispa: 1 herida directa', () => {
    const nuevo = jugarHabilidad(base(cartaDe('Fuego1')))
    expect(buscarUnidad(nuevo, 'Objetivo').heridas).toBe(1)
  })

  it('Fuego2 Látigo: 2 heridas (valor×base) y retrocede 1 hex', () => {
    const estado = base(cartaDe('Fuego2'), { objetivoExtras: { maxVida: 5 } })
    const nuevo = jugarHabilidad(estado)
    const objetivo = buscarUnidad(nuevo, 'Objetivo')
    expect(objetivo.heridas).toBe(2)
    expect(objetivo.pos).toEqual({ q: 2, r: 0 })
  })

  it('Fuego3 Bomba: daña al objetivo y a los enemigos adyacentes a él (valor×base)', () => {
    const estado = base(cartaDe('Fuego3'), {
      objetivoExtras: { maxVida: 5 },
    })
    estado.unidades.push(unidad('Vecino', 'B', 'Peon', { q: 2, r: 0 }, { maxVida: 5 }))
    const nuevo = jugarHabilidad(estado)
    expect(buscarUnidad(nuevo, 'Objetivo').heridas).toBe(3)
    expect(buscarUnidad(nuevo, 'Vecino').heridas).toBe(3)
  })

  it('Agua1 Escarcha: el enemigo queda Stunned', () => {
    const nuevo = jugarHabilidad(base(cartaDe('Agua1')))
    expect(buscarUnidad(nuevo, 'Objetivo').estados).toContain('Stunned')
  })

  it('Agua2 Ola: cura 3 (base+valor-1) sin superar la vida máxima', () => {
    const estado = base(cartaDe('Agua2'), {
      objetivoJugador: 'A', objetivoExtras: { maxVida: 5, heridas: 3 },
    })
    const nuevo = jugarHabilidad(estado)
    expect(buscarUnidad(nuevo, 'Objetivo').heridas).toBe(0)
  })

  it('Agua3 Escudo: otorga Muro defensivo a una Torre', () => {
    const estado = base(cartaDe('Agua3'), { objetivoJugador: 'A', objetivoArquetipo: 'Torre' })
    const nuevo = jugarHabilidad(estado)
    expect(buscarUnidad(nuevo, 'Objetivo').efectos).toContain('Muro')
  })

  it('Aire1 Vendaval: +1 dado a la próxima tirada de ataque', () => {
    const estado = base(cartaDe('Aire1'), { objetivoJugador: 'A' })
    const nuevo = jugarHabilidad(estado)
    expect(buscarUnidad(nuevo, 'Objetivo').bonoPoolAtaque).toBe(1)
  })

  it('Aire2 Brisa: +2 dados (base+valor-1) a la próxima tirada de defensa', () => {
    const estado = base(cartaDe('Aire2'), { objetivoJugador: 'A' })
    const nuevo = jugarHabilidad(estado)
    expect(buscarUnidad(nuevo, 'Objetivo').bonoPoolDefensa).toBe(2)
  })

  it('Aire3 Corriente: recupera la carta previa del descarte', () => {
    const estado = base(cartaDe('Aire3'), {
      objetivoJugador: 'A',
      descarteA: [cartaDe('Fuego1'), cartaDe('Agua2')],
    })
    const nuevo = jugarHabilidad(estado)
    expect(nuevo.jugadores.A.mano.some(c => c.elemento === 'Agua')).toBe(true)
    expect(nuevo.jugadores.A.descarte.map(c => c.elemento)).toEqual(['Fuego', 'Aire'])
  })

  it('Tierra1 Raíz: guarda 1 token de Foco gratis', () => {
    const estado = base(cartaDe('Tierra1'), { objetivoJugador: 'A' })
    const nuevo = jugarHabilidad(estado)
    expect(buscarUnidad(nuevo, 'Objetivo').foco).toHaveLength(1)
  })

  it('Tierra2 Terremoto: empuja al enemigo 3 hexes (base+valor-1)', () => {
    const nuevo = jugarHabilidad(base(cartaDe('Tierra2')))
    expect(buscarUnidad(nuevo, 'Objetivo').pos).toEqual({ q: 4, r: 0 })
  })

  it('Tierra3 Avalancha: el Guerrero aliado puede Mover gratis', () => {
    const estado = base(cartaDe('Tierra3'), {
      objetivoJugador: 'A', objetivoArquetipo: 'Peon', objetivoId: 'Objetivo',
    })
    estado.unidades.push(unidad('Enemigo', 'B', 'Peon', { q: 4, r: 0 }))
    estado.jugadores.A.po = [{ elemento: 'Fuego', cantidad: 3 }]
    const trasCarta = jugarHabilidad(estado)
    expect(buscarUnidad(trasCarta, 'Objetivo').movimientoGratis).toBe(1)
    const trasMover = aplicarIntencion(trasCarta, {
      tipo: 'MOVER', jugador: 'A', unidadId: 'Objetivo', destino: { q: 2, r: 0 },
    })
    const movimiento = trasMover.log.find(l => l.tipo === 'movimiento')
    expect(movimiento.coste).toBe(0)
    expect(trasMover.jugadores.A.po).toEqual([{ elemento: 'Fuego', cantidad: 3 }])
    expect(buscarUnidad(trasMover, 'Objetivo').accionesEsteTurno).toBe(0)
  })

  it('Vacio1 Drenar: el enemigo pierde 1 token de Foco', () => {
    const estado = base(cartaDe('Vacio1'), {
      objetivoExtras: { foco: [{ elemento: 'Tierra' }, { elemento: 'Fuego' }] },
    })
    const nuevo = jugarHabilidad(estado)
    expect(buscarUnidad(nuevo, 'Objetivo').foco).toHaveLength(1)
  })

  it('Vacio2 Purga: quita Stunned a un aliado', () => {
    const estado = base(cartaDe('Vacio2'), {
      objetivoJugador: 'A', objetivoExtras: { estados: ['Stunned'] },
    })
    const nuevo = jugarHabilidad(estado)
    expect(buscarUnidad(nuevo, 'Objetivo').estados).not.toContain('Stunned')
  })

  it('Vacio3 Ruptura: anula el Muro del enemigo', () => {
    const estado = base(cartaDe('Vacio3'), { objetivoExtras: { efectos: ['Muro'] } })
    const nuevo = jugarHabilidad(estado)
    expect(buscarUnidad(nuevo, 'Objetivo').efectos).not.toContain('Muro')
  })

  it('Vacio3 Ruptura: sin Muro, marca −1 dado guardado en la próxima defensa', () => {
    const nuevo = jugarHabilidad(base(cartaDe('Vacio3')))
    expect(buscarUnidad(nuevo, 'Objetivo').disipadoDefensa).toBe(1)
  })

  it('Mismo semilla + mismas intenciones = misma resolución', () => {
    const ejecutar = () => {
      const estado = base(cartaDe('Fuego2'))
      const actual = jugarHabilidad(estado)
      return JSON.stringify({
        heridas: buscarUnidad(actual, 'Objetivo')?.heridas,
        pos: buscarUnidad(actual, 'Objetivo')?.pos,
        po: actual.jugadores.A.po,
        log: actual.log.map(l => l.tipo),
      })
    }
    expect(ejecutar()).toBe(ejecutar())
  })
})
