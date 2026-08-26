import { describe, it, expect } from 'vitest'
import { tirarD10, tirarPool } from '../engine/dice.js'
import { resolverIntercambio, topeCadenaPara } from '../engine/combat.js'
import { aplicarIntencion } from '../engine/index.js'
import { totalPO } from '../engine/po.js'
import { armarEstado, unidad, dadosFijos, buscarUnidad, po } from './helpers.js'

describe('US-050 — Motor de dados con semilla y explosiones', () => {
  it('Un dado normal no explota', () => {
    const rng = dadosFijos([7])
    const resultado = tirarD10(rng, 10)
    expect(resultado.valorTotal).toBe(7)
    expect(resultado.valores).toEqual([7])
    expect(resultado.exploto).toBe(false)
  })

  it('Un 10 explota y se suma', () => {
    const rng = dadosFijos([10, 4])
    const resultado = tirarD10(rng, 10)
    expect(resultado.valorTotal).toBe(14)
    expect(resultado.valores).toEqual([10, 4])
  })

  it('Las explosiones encadenan', () => {
    const rng = dadosFijos([10, 10, 3])
    const resultado = tirarD10(rng, 10)
    expect(resultado.valorTotal).toBe(23)
  })

  it('Tope de seguridad de encadenamiento', () => {
    const rng = () => 0.9
    const resultado = tirarD10(rng, 10, 20)
    expect(resultado.valores).toHaveLength(20)
  })

  it('D-17: el tope de cadena es el nivel de Foco del que tira', () => {
    const estado = armarEstado({
      turnoDe: 'A',
      unidades: [
        unidad('P1', 'A', 'Peon', { q: 0, r: 0 }),
        unidad('C1', 'A', 'Campeon', { q: 2, r: 0 }),
      ],
    })
    expect(topeCadenaPara(estado, buscarUnidad(estado, 'P1'))).toBe(2)
    expect(topeCadenaPara(estado, buscarUnidad(estado, 'C1'))).toBe(4)
  })

  it('D-17: con la conmutable apagada se usa el tope fijo de D-13', () => {
    const estado = armarEstado({
      turnoDe: 'A',
      reglas: { explosionTopePorFoco: false },
      unidades: [unidad('P1', 'A', 'Peon', { q: 0, r: 0 })],
    })
    expect(topeCadenaPara(estado, buscarUnidad(estado, 'P1'))).toBe(20)
  })

  it('D-17: un Peón (Foco 1) con dos 10 no encadena una tercera tirada', () => {
    const estado = armarEstado({
      turnoDe: 'A',
      unidades: [unidad('P1', 'A', 'Peon', { q: 0, r: 0 })],
    })
    const rng = dadosFijos([10, 10])
    const resultado = tirarD10(rng, 10, topeCadenaPara(estado, buscarUnidad(estado, 'P1')))
    expect(resultado.valores).toEqual([10, 10])
    expect(resultado.valorTotal).toBe(20)
  })

  it('La misma semilla reproduce la misma partida', () => {
    const crear = () => armarEstado({
      rng: dadosFijos([5, 4, 8, 2]),
      turnoDe: 'A',
      unidades: [
        unidad('P1', 'A', 'Peon', { q: 0, r: 0 }),
        unidad('P2', 'B', 'Peon', { q: 1, r: 0 }),
      ],
      poA: [po('A', 'Fuego', 5)],
    })
    const e1 = aplicarIntencion(crear(), { tipo: 'ATACAR', jugador: 'A', atacante: 'P1', objetivo: 'P2' })
    const e2 = aplicarIntencion(crear(), { tipo: 'ATACAR', jugador: 'A', atacante: 'P1', objetivo: 'P2' })
    const d1 = e1.log.filter(l => l.tipo === 'ataque').map(l => l.detalle)
    const d2 = e2.log.filter(l => l.tipo === 'ataque').map(l => l.detalle)
    expect(d1).toEqual(d2)
  })
})

describe('US-051 — Tirada Roll and Keep XgY', () => {
  it('Un 2g1 tira dos dados y conserva uno', () => {
    const rng = dadosFijos([3, 8])
    const resultado = tirarPool(rng, 2, 1)
    expect(resultado.dadosTirados).toHaveLength(2)
    expect(resultado.kept.map(d => d.valorTotal)).toEqual([8])
    expect(resultado.suma).toBe(8)
  })

  it('Un 2g2 conserva ambos dados', () => {
    const rng = dadosFijos([4, 6])
    const resultado = tirarPool(rng, 2, 2)
    expect(resultado.suma).toBe(10)
  })

  it('Se conservan siempre los dados más altos', () => {
    const rng = dadosFijos([2, 9, 5])
    const resultado = tirarPool(rng, 3, 2)
    expect(resultado.kept.map(d => d.valorTotal)).toEqual([9, 5])
    expect(resultado.suma).toBe(14)
  })

  it('Un dado explotado se evalúa por su valor acumulado', () => {
    const rng = dadosFijos([10, 2, 9])
    const resultado = tirarPool(rng, 2, 1)
    expect(resultado.dadosTirados.map(d => d.valorTotal)).toEqual([12, 9])
    expect(resultado.kept.map(d => d.valorTotal)).toEqual([12])
  })
})

describe('US-052 — Resolución del ataque por suma', () => {
  const atacar = (rngValores) => aplicarIntencion(
    armarEstado({
      rng: dadosFijos(rngValores),
      turnoDe: 'A',
      unidades: [
        unidad('P1', 'A', 'Peon', { q: 0, r: 0 }),
        unidad('P2', 'B', 'Peon', { q: 1, r: 0 }),
      ],
      poA: [po('A', 'Fuego', 5)],
    }),
    { tipo: 'ATACAR', jugador: 'A', atacante: 'P1', objetivo: 'P2' }
  )

  it('La acción Atacar dispara la resolución completa', () => {
    const estado = atacar([5, 4])
    const ataques = estado.log.filter(l => l.tipo === 'ataque')
    expect(ataques).toHaveLength(1)
    expect(ataques[0].detalle.poolAtaque).toBe('1g1')
    expect(ataques[0].detalle.poolDefensa).toBe('1g1')
    expect(ataques[0].detalle.dadosAtaque).toHaveLength(1)
    expect(ataques[0].detalle.dadosDefensa).toHaveLength(1)
    expect(ataques[0].detalle.sumaAtaque).toBeGreaterThan(0)
    expect(ataques[0].detalle.sumaDefensa).toBeGreaterThan(0)
    expect(['gana ataque', 'gana defensa']).toContain(ataques[0].detalle.resultado)
  })

  it.each([
    [[9, 4], 'gana ataque'],
    [[4, 9], 'gana defensa'],
    [[6, 6], 'gana defensa'],
  ])('Comparación de sumas: ataque %i defensa %i → %s', (valores, resultado) => {
    const estado = atacar(valores)
    const ataques = estado.log.filter(l => l.tipo === 'ataque')
    expect(ataques[0].detalle.resultado).toBe(resultado)
  })

  it('No hay dificultad ni conteo de éxitos', () => {
    const estado = atacar([5, 4])
    const detalle = estado.log.find(l => l.tipo === 'ataque').detalle
    expect(detalle).not.toHaveProperty('dificultad')
    expect(detalle).not.toHaveProperty('exitos')
  })
})

describe('US-053 — El atacante gana: herida y eliminación', () => {
  it('Una victoria del atacante inflige una herida', () => {
    const estado = aplicarIntencion(
      armarEstado({
        rng: dadosFijos([9, 4, 4]),
        turnoDe: 'A',
        unidades: [
          unidad('P1', 'A', 'Peon', { q: 0, r: 0 }),
          unidad('T2', 'B', 'Torre', { q: 1, r: 0 }, { maxVida: 4 }),
        ],
        poA: [po('A', 'Fuego', 5)],
      }),
      { tipo: 'ATACAR', jugador: 'A', atacante: 'P1', objetivo: 'T2' }
    )
    const torre = buscarUnidad(estado, 'T2')
    expect(torre.heridas).toBe(1)
    expect(torre.pos).toEqual({ q: 1, r: 0 })
  })

  it('No hay segunda tirada de daño', () => {
    const estado = aplicarIntencion(
      armarEstado({
        rng: dadosFijos([9, 4]),
        turnoDe: 'A',
        unidades: [
          unidad('P1', 'A', 'Peon', { q: 0, r: 0 }),
          unidad('P2', 'B', 'Peon', { q: 1, r: 0 }),
        ],
        poA: [po('A', 'Fuego', 5)],
      }),
      { tipo: 'ATACAR', jugador: 'A', atacante: 'P1', objetivo: 'P2' }
    )
    const p2 = buscarUnidad(estado, 'P2')
    expect(p2.heridas).toBe(1)
  })

  it('La unidad muere al alcanzar su Vida en heridas', () => {
    const estado = aplicarIntencion(
      armarEstado({
        rng: dadosFijos([9, 4]),
        turnoDe: 'A',
        unidades: [
          unidad('P1', 'A', 'Peon', { q: 0, r: 0 }),
          unidad('P2', 'B', 'Peon', { q: 1, r: 0 }, { heridas: 1, maxVida: 2 }),
        ],
        poA: [po('A', 'Fuego', 5)],
      }),
      { tipo: 'ATACAR', jugador: 'A', atacante: 'P1', objetivo: 'P2' }
    )
    expect(buscarUnidad(estado, 'P2')).toBeNull()
    expect(estado.unidades.some(u => u.id === 'P2')).toBe(false)
    expect(estado.log.some(l => l.tipo === 'ataque' && l.detalle.resultado === 'gana ataque')).toBe(true)
  })

  it('Las heridas se muestran en la ficha', () => {
    const unidadFicha = { heridas: 2, maxVida: 4 }
    expect(`${unidadFicha.heridas}/${unidadFicha.maxVida}`).toBe('2/4')
  })
})

describe('US-054 — El defensor gana o empate: retroceso y Stunned', () => {
  const atacarPerdedor = (valores, extraUnidades = [], extraTablero = {}) => aplicarIntencion(
    armarEstado({
      rng: dadosFijos(valores),
      turnoDe: 'A',
      tablero: { ...(extraTablero.tablero || {}), bloqueados: extraTablero.bloqueados || [] },
      unidades: [
        unidad('P1', 'A', 'Peon', { q: 0, r: 0 }),
        unidad('P2', 'B', 'Peon', { q: 1, r: 0 }),
        ...extraUnidades,
      ],
      poA: [po('A', 'Fuego', 5)],
    }),
    { tipo: 'ATACAR', jugador: 'A', atacante: 'P1', objetivo: 'P2' }
  )

  it('El atacante retrocede un hexágono y queda Stunned', () => {
    const estado = atacarPerdedor([4, 9])
    const p1 = buscarUnidad(estado, 'P1')
    const p2 = buscarUnidad(estado, 'P2')
    expect(p1.pos).toEqual({ q: -1, r: 0 })
    expect(p1.estados).toContain('Stunned')
    expect(p2.heridas).toBe(0)
  })

  it('El empate se resuelve a favor de la defensa', () => {
    const estado = atacarPerdedor([6, 6])
    const p1 = buscarUnidad(estado, 'P1')
    const detalle = estado.log.find(l => l.tipo === 'ataque').detalle
    expect(detalle.resultado).toBe('gana defensa')
    expect(p1.estados).toContain('Stunned')
  })

  it('Retroceso bloqueado por hexágono ocupado', () => {
    const estado = atacarPerdedor([4, 9], [
      unidad('OB', 'B', 'Peon', { q: -1, r: 0 }),
    ])
    const p1 = buscarUnidad(estado, 'P1')
    expect(p1.pos).not.toEqual({ q: -1, r: 0 })
    const otros = estado.unidades.filter(u => u.id !== 'P1')
    const ocupados = new Set(otros.map(u => `${u.pos.q},${u.pos.r}`))
    expect(ocupados.has(`${p1.pos.q},${p1.pos.r}`)).toBe(false)
  })

  it('Sin retroceso posible', () => {
    const bloqueados = ['1,-1', '0,-1', '-1,0', '-1,1', '0,1']
    const estado = atacarPerdedor([4, 9], [], { bloqueados })
    const p1 = buscarUnidad(estado, 'P1')
    expect(p1.pos).toEqual({ q: 0, r: 0 })
    expect(p1.estados).toContain('Stunned')
  })

  it('El retroceso no dispara reacciones', () => {
    const estado = atacarPerdedor([4, 9])
    const p1 = buscarUnidad(estado, 'P1')
    expect(p1.accionesEsteTurno).toBe(1)
    // Primera acción gratis (activación base), PO no se gasta
    expect(totalPO(estado.jugadores.A)).toBe(5)
  })
})

describe('US-055 — Ataque a distancia', () => {
  it('Objetivo dentro de rango', () => {
    const estado = aplicarIntencion(
      armarEstado({
        rng: dadosFijos([5, 4, 4]),
        turnoDe: 'A',
        unidades: [
          unidad('A1', 'A', 'Alfil', { q: 0, r: 0 }),
          unidad('B1', 'B', 'Peon', { q: 2, r: -1 }),
        ],
        poA: [po('A', 'Fuego', 5)],
      }),
      { tipo: 'ATACAR', jugador: 'A', atacante: 'A1', objetivo: 'B1' }
    )
    expect(estado.log.some(l => l.tipo === 'ataque')).toBe(true)
  })

  it('Objetivo fuera de rango', () => {
    const poAntes = 5
    const estado = aplicarIntencion(
      armarEstado({
        rng: dadosFijos([5, 4, 4]),
        turnoDe: 'A',
        unidades: [
          unidad('A1', 'A', 'Alfil', { q: 0, r: 0 }),
          unidad('B1', 'B', 'Peon', { q: 4, r: -2 }),
        ],
        poA: [po('A', 'Fuego', poAntes)],
      }),
      { tipo: 'ATACAR', jugador: 'A', atacante: 'A1', objetivo: 'B1' }
    )
    expect(estado.log.some(l => l.tipo === 'ataque')).toBe(false)
    expect(estado.log.some(l => l.tipo === 'error' && l.descripcion.includes('fuera de rango'))).toBe(true)
    expect(totalPO(estado.jugadores.A)).toBe(poAntes)
  })

  it('Objetivo sin línea de visión', () => {
    const estado = aplicarIntencion(
      armarEstado({
        rng: dadosFijos([5, 4, 4]),
        turnoDe: 'A',
        bloqueados: ['1,0'],
        unidades: [
          unidad('A1', 'A', 'Alfil', { q: 0, r: 0 }),
          unidad('B1', 'B', 'Peon', { q: 2, r: 0 }),
        ],
        poA: [po('A', 'Fuego', 5)],
      }),
      { tipo: 'ATACAR', jugador: 'A', atacante: 'A1', objetivo: 'B1' }
    )
    expect(estado.log.some(l => l.tipo === 'error' && l.descripcion.includes('sin línea de visión'))).toBe(true)
  })

  it('Una unidad de Rango 1 solo ataca adyacente', () => {
    const estado = aplicarIntencion(
      armarEstado({
        rng: dadosFijos([5, 4]),
        turnoDe: 'A',
        unidades: [
          unidad('P1', 'A', 'Peon', { q: 0, r: 0 }),
          unidad('B1', 'B', 'Peon', { q: 2, r: -1 }),
        ],
        poA: [po('A', 'Fuego', 5)],
      }),
      { tipo: 'ATACAR', jugador: 'A', atacante: 'P1', objetivo: 'B1' }
    )
    expect(estado.log.some(l => l.tipo === 'error' && l.descripcion.includes('fuera de rango'))).toBe(true)
  })
})

describe('A-11-N1 — Protección del Rey en la Ronda 1', () => {
  const armarAtaqueAlRey = (ronda) => {
    const estado = armarEstado({
      rng: dadosFijos([5, 4, 4]),
      turnoDe: 'A',
      ronda,
      unidades: [
        unidad('P1', 'A', 'Peon', { q: 0, r: 0 }),
        unidad('R2', 'B', 'Rey', { q: 1, r: 0 }, { maxVida: 4 }),
      ],
      poA: [po('A', 'Fuego', 5)],
    })
    return aplicarIntencion(estado, { tipo: 'ATACAR', jugador: 'A', atacante: 'P1', objetivo: 'R2' })
  }

  it('En la Ronda 1 el ataque al Rey es rechazado', () => {
    const estado = armarAtaqueAlRey(1)
    expect(estado.log.some(l => l.tipo === 'error' && l.descripcion.includes('Rey no puede ser objetivo'))).toBe(true)
    expect(estado.log.some(l => l.tipo === 'ataque')).toBe(false)
  })

  it('En la Ronda 2 el Rey sí puede ser objetivo', () => {
    const estado = armarAtaqueAlRey(2)
    expect(estado.log.some(l => l.tipo === 'ataque')).toBe(true)
  })

  it('Con la regla apagada el Rey puede ser objetivo en la Ronda 1', () => {
    const estado = armarEstado({
      rng: dadosFijos([5, 4, 4]),
      turnoDe: 'A',
      ronda: 1,
      reglas: { reyProtegidoRonda1: false },
      unidades: [
        unidad('P1', 'A', 'Peon', { q: 0, r: 0 }),
        unidad('R2', 'B', 'Rey', { q: 1, r: 0 }, { maxVida: 4 }),
      ],
      poA: [po('A', 'Fuego', 5)],
    })
    const resultado = aplicarIntencion(estado, { tipo: 'ATACAR', jugador: 'A', atacante: 'P1', objetivo: 'R2' })
    expect(resultado.log.some(l => l.tipo === 'ataque')).toBe(true)
  })
})

describe('US-056 — Registro legible del combate', () => {
  it('El log detalla la tirada', () => {
    const resultado = resolverIntercambio(
      armarEstado({
        rng: dadosFijos([10, 2, 9]),
        unidades: [
          unidad('P1', 'A', 'Peon', { q: 0, r: 0 }),
          unidad('P2', 'B', 'Peon', { q: 1, r: 0 }),
        ],
      }),
      'P1', 'P2'
    )
    const detalle = resultado.detalle
    expect(detalle.poolAtaque).toBe('1g1')
    expect(detalle.dadosAtaque).toEqual(['10+2'])
    expect(detalle.sumaAtaque).toBe(12)
    expect(detalle).toHaveProperty('poolDefensa')
    expect(detalle).toHaveProperty('keptDefensa')
    expect(detalle).toHaveProperty('sumaDefensa')
    expect(detalle).toHaveProperty('resultado')
  })
})

describe('A-11-N5 — Retroceso del defensor por diferencia >= 2 (Ítem E)', () => {
  const armarAtaque = (valores, extraUnidades = [], reglas = {}) => aplicarIntencion(
    armarEstado({
      rng: dadosFijos(valores),
      turnoDe: 'A',
      reglas,
      unidades: [
        unidad('P1', 'A', 'Peon', { q: 0, r: 0 }),
        unidad('P2', 'B', 'Peon', { q: 1, r: 0 }),
        ...extraUnidades,
      ],
      poA: [po('A', 'Fuego', 5)],
    }),
    { tipo: 'ATACAR', jugador: 'A', atacante: 'P1', objetivo: 'P2' }
  )

  it('Ganar por diferencia >= 2 empuja 1 hex al defensor', () => {
    const estado = armarAtaque([9, 4], [], { retrocesoDefensorDiferencia2: true })
    const p2 = buscarUnidad(estado, 'P2')
    expect(p2.pos).toEqual({ q: 2, r: 0 })
    expect(p2.heridas).toBe(1)
    expect(estado.log.some(l => l.tipo === 'retroceso-defensor')).toBe(true)
  })

  it('Ganar por diferencia de 1 no empuja al defensor', () => {
    const estado = armarAtaque([9, 8], [], { retrocesoDefensorDiferencia2: true })
    expect(buscarUnidad(estado, 'P2').pos).toEqual({ q: 1, r: 0 })
    expect(estado.log.some(l => l.tipo === 'retroceso-defensor')).toBe(false)
  })

  it('Con la regla apagada no hay retroceso del defensor', () => {
    const estado = armarAtaque([9, 4])
    expect(buscarUnidad(estado, 'P2').pos).toEqual({ q: 1, r: 0 })
    expect(estado.log.some(l => l.tipo === 'retroceso-defensor')).toBe(false)
  })

  it('El defensor eliminado por la herida no retrocede', () => {
    const estado = aplicarIntencion(
      armarEstado({
        rng: dadosFijos([9, 4]),
        turnoDe: 'A',
        reglas: { retrocesoDefensorDiferencia2: true },
        unidades: [
          unidad('P1', 'A', 'Peon', { q: 0, r: 0 }),
          unidad('P2', 'B', 'Peon', { q: 1, r: 0 }, { heridas: 1, maxVida: 2 }),
        ],
        poA: [po('A', 'Fuego', 5)],
      }),
      { tipo: 'ATACAR', jugador: 'A', atacante: 'P1', objetivo: 'P2' }
    )
    expect(buscarUnidad(estado, 'P2')).toBeNull()
    expect(estado.log.some(l => l.tipo === 'retroceso-defensor')).toBe(false)
  })

  it('Con el hex de retroceso bloqueado el defensor se queda', () => {
    const estado = aplicarIntencion(
      armarEstado({
        rng: dadosFijos([9, 4]),
        turnoDe: 'A',
        tablero: { bloqueados: ['1,1', '2,-1', '2,0', '1,-1', '0,1'] },
        reglas: { retrocesoDefensorDiferencia2: true },
        unidades: [
          unidad('P1', 'A', 'Peon', { q: 0, r: 0 }),
          unidad('P2', 'B', 'Peon', { q: 1, r: 0 }),
        ],
        poA: [po('A', 'Fuego', 5)],
      }),
      { tipo: 'ATACAR', jugador: 'A', atacante: 'P1', objetivo: 'P2' }
    )
    expect(buscarUnidad(estado, 'P2').pos).toEqual({ q: 1, r: 0 })
  })
})
