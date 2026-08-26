import { describe, it, expect } from 'vitest'
import {
  TECNICAS, tecnicasDisponibles, puedeDeclarar, declararTecnica,
} from '../engine/techniques.js'
import { resolverIntercambio } from '../engine/combat.js'
import { aplicarIntencion } from '../engine/index.js'
import { totalPO } from '../engine/po.js'
import { armarEstado, unidad, dadosFijos, buscarUnidad, po } from './helpers.js'

const token = (elemento) => ({ elemento })

describe('US-070 — Catálogo mínimo de Técnicas', () => {
  it('El catálogo está definido como datos', () => {
    expect(Object.keys(TECNICAS)).toHaveLength(5)
    for (const t of Object.values(TECNICAS)) {
      expect(t.nombre).toBeDefined()
      expect(t.coste).toBeDefined()
      expect(t.arquetipos).toBeDefined()
      expect(t.descripcion).toBeDefined()
    }
  })

  it.each([
    ['Explosion', ['Peon', 'Campeon']],
    ['DobleTiro', ['Alfil']],
    ['Muro', ['Torre']],
    ['Reflujo', ['Alfil', 'Campeon']],
    ['Disipar', ['Campeon']],
  ])('Coste y portadores: %s', (nombre, arqs) => {
    expect(TECNICAS[nombre].arquetipos).toEqual(arqs)
    expect(TECNICAS[nombre].coste).toBeDefined()
  })

  it('Una unidad solo accede a las Técnicas de su arquetipo', () => {
    const disponibles = tecnicasDisponibles('Torre')
    expect(disponibles.map(t => t.nombre)).toEqual(['Muro'])
  })
})

describe('US-071 — Consumo de tokens al usar una Técnica', () => {
  it('La Técnica descuenta los tokens exactos', () => {
    const unidadC = unidad('C1', 'A', 'Campeon', { q: 0, r: 0 }, {
      foco: [token('Fuego'), token('Fuego'), token('Agua')],
    })
    const resultado = declararTecnica(unidadC, 'Explosion')
    expect(resultado.ok).toBe(true)
    expect(resultado.tokens.filter(t => t.elemento === 'Fuego')).toHaveLength(0)
    expect(resultado.tokens.filter(t => t.elemento === 'Agua')).toHaveLength(1)
  })

  it('Sin tokens suficientes no se puede declarar', () => {
    const unidadC = unidad('C1', 'A', 'Campeon', { q: 0, r: 0 }, {
      foco: [token('Fuego')],
    })
    const resultado = puedeDeclarar(unidadC, 'Explosion')
    expect(resultado.ok).toBe(false)
    expect(resultado.motivo).toContain('token(s) de Fuego')
  })

  it('Los tokens del elemento equivocado no sirven', () => {
    const unidadC = unidad('C1', 'A', 'Campeon', { q: 0, r: 0 }, {
      foco: [token('Agua'), token('Agua')],
    })
    expect(puedeDeclarar(unidadC, 'Explosion').ok).toBe(false)
  })
})

describe('US-072 — Pago mixto con carta (legacy: tecnicasSoloFoco=false)', () => {
  const torre = (foco) => unidad('T1', 'A', 'Torre', { q: 0, r: 0 }, { foco })
  const reglasLegacy = { tecnicasSoloFoco: false }

  it('Foco 2 más carta cubren una Técnica de 3 tokens', () => {
    const resultado = puedeDeclarar(
      torre([token('Tierra')]),
      'Muro',
      { carta: { elemento: 'Tierra', valor: 1 }, reglas: reglasLegacy }
    )
    expect(resultado.ok).toBe(true)
    const declarado = declararTecnica(
      torre([token('Tierra')]),
      'Muro',
      { carta: { elemento: 'Tierra', valor: 1 }, reglas: reglasLegacy }
    )
    expect(declarado.ok).toBe(true)
    expect(declarado.tokens.filter(t => t.elemento === 'Tierra')).toHaveLength(0)
  })

  it('La carta aportada no genera PO', () => {
    let estado = armarEstado({
      reglas: reglasLegacy,
      turnoDe: 'A',
      unidades: [unidad('T1', 'A', 'Torre', { q: 0, r: 0 }, {
        foco: [token('Tierra')],
      })],
      jugadores: {
        A: { mano: [{ elemento: 'Tierra', valor: 2 }] },
        B: { mano: [] },
      },
    })
    estado = aplicarIntencion(estado, {
      tipo: 'DECLARAR_TECNICA', jugador: 'A', unidadId: 'T1', tecnica: 'Muro', cartaIndice: 0,
    })
    expect(estado.jugadores.A.mano).toHaveLength(0)
    expect(estado.jugadores.A.descarte).toHaveLength(1)
    expect(totalPO(estado.jugadores.A)).toBe(0)
    expect(estado.cartaJugadaEsteTurno).toBe(false)
  })

  it('La carta debe ser del elemento requerido', () => {
    const resultado = puedeDeclarar(
      torre([token('Tierra')]),
      'Muro',
      { carta: { elemento: 'Fuego', valor: 2 }, reglas: reglasLegacy }
    )
    expect(resultado.ok).toBe(false)
    expect(resultado.motivo).toContain('token(s) de Tierra')
  })

  it('El pago mixto solo cubre lo que excede el Foco', () => {
    const resultado = puedeDeclarar(
      torre([]),
      'Muro',
      { carta: { elemento: 'Tierra', valor: 2 }, reglas: reglasLegacy }
    )
    expect(resultado.ok).toBe(false)
    expect(resultado.motivo).toContain('solo cubre el excedente')
  })
})

describe('US-072b — Técnicas SOLO con Foco preparado (default: tecnicasSoloFoco=true)', () => {
  const torre = (foco) => unidad('T1', 'A', 'Torre', { q: 0, r: 0 }, { foco })

  it('Con Foco suficiente se puede declarar', () => {
    const resultado = puedeDeclarar(torre([token('Tierra'), token('Tierra')]), 'Muro')
    expect(resultado.ok).toBe(true)
  })

  it('Sin Foco suficiente se rechaza (sin pago mixto)', () => {
    const resultado = puedeDeclarar(torre([token('Tierra')]), 'Muro')
    expect(resultado.ok).toBe(false)
    expect(resultado.motivo).toContain('Faltan 1 token(s) de Tierra en Foco')
  })

  it('La carta NO permite pagar el excedente', () => {
    const resultado = puedeDeclarar(
      torre([token('Tierra')]),
      'Muro',
      { carta: { elemento: 'Tierra', valor: 2 } }
    )
    expect(resultado.ok).toBe(false)
    expect(resultado.motivo).toContain('Faltan 1 token(s) de Tierra en Foco')
  })
})

describe('US-073 — Momento de declaración', () => {
  it('Una sola Técnica por ataque', () => {
    const ataque = aplicarIntencion(
      armarEstado({
        rng: dadosFijos([5, 4, 4, 4]),
        turnoDe: 'A',
        unidades: [
          unidad('C1', 'A', 'Campeon', { q: 0, r: 0 }, {
            foco: [token('Fuego'), token('Fuego')],
          }),
          unidad('P2', 'B', 'Peon', { q: 1, r: 0 }),
        ],
        poA: [po('A', 'Fuego', 5)],
      }),
      { tipo: 'ATACAR', jugador: 'A', atacante: 'C1', objetivo: 'P2', tecnica: 'Explosion' }
    )
    const campeon = buscarUnidad(ataque, 'C1')
    expect(ataque.log.some(l => l.tipo === 'ataque')).toBe(true)
    expect(campeon.accionesEsteTurno).toBe(1)
  })
})

describe('US-074 — Técnica Explosión', () => {
  it('Explosión agrega un dado al pool', () => {
    const estado = aplicarIntencion(
      armarEstado({
        rng: dadosFijos([9, 4, 3, 1, 2]),
        turnoDe: 'A',
        unidades: [
          unidad('C1', 'A', 'Campeon', { q: 0, r: 0 }, {
            foco: [token('Fuego'), token('Fuego')],
          }),
          unidad('P2', 'B', 'Peon', { q: 1, r: 0 }),
        ],
        poA: [po('A', 'Fuego', 5)],
      }),
      { tipo: 'ATACAR', jugador: 'A', atacante: 'C1', objetivo: 'P2', tecnica: 'Explosion' }
    )
    const detalle = estado.log.find(l => l.tipo === 'ataque').detalle
    expect(detalle.poolAtaque).toBe('3g2')
  })

  it('Explosión baja el umbral de explosión', () => {
    const estado = aplicarIntencion(
      armarEstado({
        rng: dadosFijos([9, 4, 3, 1, 2]),
        turnoDe: 'A',
        unidades: [
          unidad('C1', 'A', 'Campeon', { q: 0, r: 0 }, {
            foco: [token('Fuego'), token('Fuego')],
          }),
          unidad('P2', 'B', 'Peon', { q: 1, r: 0 }),
        ],
        poA: [po('A', 'Fuego', 5)],
      }),
      { tipo: 'ATACAR', jugador: 'A', atacante: 'C1', objetivo: 'P2', tecnica: 'Explosion' }
    )
    const detalle = estado.log.find(l => l.tipo === 'ataque').detalle
    expect(detalle.keptAtaque).toContain(13)
  })

  it('El umbral rebajado dura solo ese ataque', () => {
    const base = () => armarEstado({
      rng: dadosFijos([9, 4, 3, 1, 2]),
      unidades: [
        unidad('C1', 'A', 'Campeon', { q: 0, r: 0 }),
        unidad('P2', 'B', 'Peon', { q: 1, r: 0 }),
      ],
    })
    const con = resolverIntercambio(base(), 'C1', 'P2', { tecnica: 'Explosion' })
    const sin = resolverIntercambio(base(), 'C1', 'P2')
    expect(con.detalle.dadosAtaque).toEqual(['9+4', '3', '1'])
    expect(sin.detalle.dadosAtaque).toEqual(['9', '4'])
  })
})

describe('US-075 — Técnica Doble Tiro', () => {
  const alfilConTecnica = () => unidad('A1', 'A', 'Alfil', { q: 0, r: 0 }, {
    foco: [token('Aire'), token('Agua')],
  })

  it('Se seleccionan dos objetivos adyacentes entre sí', () => {
    const estado = aplicarIntencion(
      armarEstado({
        rng: dadosFijos([5, 4, 3, 2, 6, 1]),
        turnoDe: 'A',
        unidades: [
          alfilConTecnica(),
          unidad('B1', 'B', 'Peon', { q: 2, r: 0 }),
          unidad('B2', 'B', 'Peon', { q: 2, r: -1 }),
        ],
        poA: [po('A', 'Fuego', 5)],
      }),
      { tipo: 'ATACAR', jugador: 'A', atacante: 'A1', objetivo: 'B1', tecnica: 'DobleTiro', segundoObjetivo: 'B2' }
    )
    const ataques = estado.log.filter(l => l.tipo === 'ataque')
    expect(ataques).toHaveLength(2)
  })

  it('Los objetivos deben ser adyacentes entre sí', () => {
    const estado = aplicarIntencion(
      armarEstado({
        rng: dadosFijos([5, 4, 3]),
        turnoDe: 'A',
        unidades: [
          alfilConTecnica(),
          unidad('B1', 'B', 'Peon', { q: 2, r: 0 }),
          unidad('B2', 'B', 'Peon', { q: 3, r: 1 }),
        ],
        poA: [po('A', 'Fuego', 5)],
      }),
      { tipo: 'ATACAR', jugador: 'A', atacante: 'A1', objetivo: 'B1', tecnica: 'DobleTiro', segundoObjetivo: 'B2' }
    )
    expect(estado.log.some(l => l.tipo === 'error' && l.descripcion.includes('adyacentes entre sí'))).toBe(true)
  })

  it('Cada objetivo debe cumplir rango y línea de visión', () => {
    const estado = aplicarIntencion(
      armarEstado({
        rng: dadosFijos([5, 4, 3]),
        turnoDe: 'A',
        unidades: [
          alfilConTecnica(),
          unidad('B1', 'B', 'Peon', { q: 0, r: -1 }),
          unidad('B2', 'B', 'Peon', { q: 0, r: -2 }),
        ],
        poA: [po('A', 'Fuego', 5)],
      }),
      { tipo: 'ATACAR', jugador: 'A', atacante: 'A1', objetivo: 'B1', tecnica: 'DobleTiro', segundoObjetivo: 'B2' }
    )
    expect(estado.log.some(l => l.tipo === 'error' && l.descripcion.includes('sin línea de visión'))).toBe(true)
  })

  it('Un solo resultado adverso basta para el retroceso', () => {
    const estado = aplicarIntencion(
      armarEstado({
        rng: dadosFijos([9, 8, 2, 3, 4, 9]),
        turnoDe: 'A',
        unidades: [
          alfilConTecnica(),
          unidad('B1', 'B', 'Peon', { q: 2, r: 0 }),
          unidad('B2', 'B', 'Peon', { q: 2, r: -1 }),
        ],
        poA: [po('A', 'Fuego', 5)],
      }),
      { tipo: 'ATACAR', jugador: 'A', atacante: 'A1', objetivo: 'B1', tecnica: 'DobleTiro', segundoObjetivo: 'B2' }
    )
    const retrocesos = estado.log.filter(l => l.tipo === 'retroceso')
    const stunned = estado.log.filter(l => l.tipo === 'stunned')
    const alfil = buscarUnidad(estado, 'A1')
    expect(retrocesos).toHaveLength(1)
    expect(stunned).toHaveLength(1)
    expect(alfil.estados).toContain('Stunned')
  })
})

describe('US-076 — Técnica Muro', () => {
  const torreConMuro = () => unidad('T1', 'A', 'Torre', { q: 1, r: 0 }, {
    maxVida: 4, efectos: ['Muro'],
  })

  it('Muro incrementa el Keep defensivo', () => {
    const estado = aplicarIntencion(
      armarEstado({
        rng: dadosFijos([3, 1, 2]),
        turnoDe: 'A',
        unidades: [
          unidad('P1', 'A', 'Peon', { q: 0, r: 0 }),
          unidad('T2', 'B', 'Torre', { q: 1, r: 0 }, { maxVida: 4, efectos: ['Muro'] }),
        ],
        poA: [po('A', 'Fuego', 5)],
      }),
      { tipo: 'ATACAR', jugador: 'A', atacante: 'P1', objetivo: 'T2' }
    )
    const detalle = estado.log.find(l => l.tipo === 'ataque').detalle
    expect(detalle.poolDefensa).toBe('2g2')
  })

  it('Muro persiste hasta la próxima activación', () => {
    const base = () => armarEstado({
      rng: dadosFijos([1, 1, 1, 2]),
      unidades: [
        unidad('P1', 'A', 'Peon', { q: 0, r: 0 }),
        torreConMuro(),
      ],
    })
    const primero = resolverIntercambio(base(), 'P1', 'T1')
    const segundo = resolverIntercambio(base(), 'P1', 'T1')
    expect(primero.detalle.poolDefensa).toBe('2g2')
    expect(segundo.detalle.poolDefensa).toBe('2g2')
  })

  it('Muro se apaga al activarse la unidad', () => {
    const estado = aplicarIntencion(
      armarEstado({
        turnoDe: 'A',
        unidades: [unidad('T1', 'A', 'Torre', { q: 0, r: 0 }, {
          maxVida: 4, efectos: ['Muro'],
        })],
        poA: [po('A', 'Fuego', 5)],
      }),
      { tipo: 'MOVER', jugador: 'A', unidadId: 'T1', destino: { q: 1, r: 0 } }
    )
    const torre = buscarUnidad(estado, 'T1')
    expect(torre.efectos).not.toContain('Muro')
  })
})

describe('US-077 — Técnica Reflujo', () => {
  const campeon = (foco) => unidad('C1', 'A', 'Campeon', { q: 0, r: 0 }, {
    maxVida: 4, foco,
  })

  it('Se eligen los dados a repetir después de ver el resultado', () => {
    const estado = aplicarIntencion(
      armarEstado({
        rng: dadosFijos([2, 7, 9, 1]),
        turnoDe: 'A',
        unidades: [
          campeon([token('Agua'), token('Agua')]),
          unidad('P2', 'B', 'Peon', { q: 1, r: 0 }),
        ],
        poA: [po('A', 'Fuego', 5)],
      }),
      {
        tipo: 'ATACAR', jugador: 'A', atacante: 'C1', objetivo: 'P2',
        tecnica: 'Reflujo', dadosARepetir: [0],
      }
    )
    const detalle = estado.log.find(l => l.tipo === 'ataque').detalle
    expect(detalle.dadosAtaque).toEqual(['9', '7'])
  })

  it('Solo una repetición', () => {
    const resultado = resolverIntercambio(
      armarEstado({
        rng: dadosFijos([2, 7, 9, 1, 5]),
        unidades: [
          campeon([token('Agua'), token('Agua')]),
          unidad('P2', 'B', 'Peon', { q: 1, r: 0 }),
        ],
      }),
      'C1', 'P2', { tecnica: 'Reflujo', dadosARepetir: [0, 1] }
    )
    const detalle = resultado.detalle
    expect(detalle.dadosAtaque).toEqual(['9', '1'])
  })

  it('Un dado repetido puede explotar', () => {
    const resultado = resolverIntercambio(
      armarEstado({
        rng: dadosFijos([2, 7, 10, 5, 1]),
        unidades: [
          campeon([token('Agua'), token('Agua')]),
          unidad('P2', 'B', 'Peon', { q: 1, r: 0 }),
        ],
      }),
      'C1', 'P2', { tecnica: 'Reflujo', dadosARepetir: [0] }
    )
    const detalle = resultado.detalle
    expect(detalle.keptAtaque).toContain(15)
  })

  it('Puedo optar por no repetir nada', () => {
    const estado = aplicarIntencion(
      armarEstado({
        rng: dadosFijos([7, 3, 1]),
        turnoDe: 'A',
        unidades: [
          campeon([token('Agua'), token('Agua')]),
          unidad('P2', 'B', 'Peon', { q: 1, r: 0 }),
        ],
        poA: [po('A', 'Fuego', 5)],
      }),
      {
        tipo: 'ATACAR', jugador: 'A', atacante: 'C1', objetivo: 'P2',
        tecnica: 'Reflujo', dadosARepetir: [],
      }
    )
    const detalle = estado.log.find(l => l.tipo === 'ataque').detalle
    expect(detalle.dadosAtaque).toEqual(['7', '3'])
    const campeonEstado = buscarUnidad(estado, 'C1')
    expect(campeonEstado.foco).toHaveLength(0)
  })
})

describe('US-077 — Reflujo en dos pasos (D-16)', () => {
  const campeon = (foco) => unidad('C1', 'A', 'Campeon', { q: 0, r: 0 }, {
    maxVida: 4, foco,
  })
  const atacarReflujo = (rngValores) => armarEstado({
    rng: dadosFijos(rngValores),
    turnoDe: 'A',
    unidades: [
      campeon([token('Agua'), token('Agua')]),
      unidad('P2', 'B', 'Peon', { q: 1, r: 0 }),
    ],
    poA: [po('A', 'Fuego', 5)],
  })

  it('La primera intención tira el pool y deja la resolución en pausa', () => {
    const estado = aplicarIntencion(
      atacarReflujo([2, 7, 9, 1]),
      { tipo: 'ATACAR', jugador: 'A', atacante: 'C1', objetivo: 'P2', tecnica: 'Reflujo' }
    )
    expect(estado.combatePendiente).toBeDefined()
    expect(estado.combatePendiente.atq.dadosTirados.map(d => d.valores.join('+'))).toEqual(['2', '7'])
    expect(estado.log.some(l => l.tipo === 'tirada-ataque')).toBe(true)
    expect(estado.log.some(l => l.tipo === 'ataque')).toBe(false)
    const campeonEstado = buscarUnidad(estado, 'C1')
    expect(campeonEstado.accionesEsteTurno).toBe(0)
    expect(campeonEstado.activacionCerrada).toBe(false)
  })

  it('REFLEJAR_DADOS repite los dados elegidos y completa el ataque', () => {
    let estado = aplicarIntencion(
      atacarReflujo([2, 7, 9, 1]),
      { tipo: 'ATACAR', jugador: 'A', atacante: 'C1', objetivo: 'P2', tecnica: 'Reflujo' }
    )
    estado = aplicarIntencion(estado, {
      tipo: 'REFLEJAR_DADOS', jugador: 'A', dadosARepetir: [0],
    })
    const detalle = estado.log.find(l => l.tipo === 'ataque').detalle
    expect(detalle.dadosAtaque).toEqual(['9', '7'])
    const campeonEstado = buscarUnidad(estado, 'C1')
    expect(campeonEstado.accionesEsteTurno).toBe(1)
    expect(campeonEstado.activacionCerrada).toBe(true)
    expect(estado.combatePendiente).toBeNull()
  })

  it('Puedo optar por no repetir nada en el segundo paso', () => {
    let estado = aplicarIntencion(
      atacarReflujo([7, 3, 1]),
      { tipo: 'ATACAR', jugador: 'A', atacante: 'C1', objetivo: 'P2', tecnica: 'Reflujo' }
    )
    estado = aplicarIntencion(estado, {
      tipo: 'REFLEJAR_DADOS', jugador: 'A', dadosARepetir: [],
    })
    const detalle = estado.log.find(l => l.tipo === 'ataque').detalle
    expect(detalle.dadosAtaque).toEqual(['7', '3'])
    expect(buscarUnidad(estado, 'C1').foco).toHaveLength(0)
  })

  it('REFLEJAR_DADOS sin ataque pendiente se rechaza', () => {
    const estado = aplicarIntencion(
      armarEstado({ turnoDe: 'A', unidades: [campeon([])] }),
      { tipo: 'REFLEJAR_DADOS', jugador: 'A', dadosARepetir: [] }
    )
    expect(estado.log.some(l => l.tipo === 'error' && l.descripcion.includes('pendiente'))).toBe(true)
  })

  it('Con un ataque pendiente no se puede ejecutar otra intención', () => {
    const pendiente = aplicarIntencion(
      atacarReflujo([2, 7, 9, 1]),
      { tipo: 'ATACAR', jugador: 'A', atacante: 'C1', objetivo: 'P2', tecnica: 'Reflujo' }
    )
    const bloqueado = aplicarIntencion(pendiente, { tipo: 'JUGAR_CARTA', jugador: 'A', indiceCarta: 0 })
    expect(bloqueado.log.some(l => l.tipo === 'error' && l.descripcion.includes('Reflujo pendiente'))).toBe(true)
  })

  it('Un índice de dado inválido se rechaza', () => {
    const pendiente = aplicarIntencion(
      atacarReflujo([2, 7, 9, 1]),
      { tipo: 'ATACAR', jugador: 'A', atacante: 'C1', objetivo: 'P2', tecnica: 'Reflujo' }
    )
    const rechazado = aplicarIntencion(pendiente, {
      tipo: 'REFLEJAR_DADOS', jugador: 'A', dadosARepetir: [7],
    })
    expect(rechazado.log.some(l => l.tipo === 'error' && l.descripcion.includes('Índice'))).toBe(true)
  })
})

describe('US-078 — Técnica Disipar (D-14)', () => {
  const campeon = (foco) => unidad('C1', 'A', 'Campeon', { q: 0, r: 0 }, {
    maxVida: 4, foco,
  })
  const base = (defensor, dados = [7, 2, 3]) => armarEstado({
    rng: dadosFijos(dados),
    turnoDe: 'A',
    unidades: [campeon([token('Vacio'), token('Vacio')]), defensor],
    poA: [po('A', 'Fuego', 5)],
  })

  it('Disipar anula Muro y no reduce además el dado guardado', () => {
    const estado = aplicarIntencion(
      base(unidad('T2', 'B', 'Torre', { q: 1, r: 0 }, { maxVida: 4, efectos: ['Muro'] }), [7, 2, 3, 4]),
      { tipo: 'ATACAR', jugador: 'A', atacante: 'C1', objetivo: 'T2', tecnica: 'Disipar' }
    )
    const detalle = estado.log.find(l => l.tipo === 'ataque').detalle
    const torre = buscarUnidad(estado, 'T2')
    expect(torre.efectos).not.toContain('Muro')
    expect(detalle.poolDefensa).toBe('2g1')
  })

  it('Disipar contra un objetivo sin Técnica defensiva reduce 1 guardado', () => {
    const estado = aplicarIntencion(
      base(unidad('P2', 'B', 'Peon', { q: 1, r: 0 })),
      { tipo: 'ATACAR', jugador: 'A', atacante: 'C1', objetivo: 'P2', tecnica: 'Disipar' }
    )
    const detalle = estado.log.find(l => l.tipo === 'ataque').detalle
    expect(detalle.poolDefensa).toBe('1g1')
  })

  it('El dado guardado nunca baja de 1', () => {
    const estado = resolverIntercambio(
      armarEstado({
        rng: dadosFijos([7, 2, 3]),
        unidades: [
          campeon([token('Vacio'), token('Vacio')]),
          unidad('P2', 'B', 'Peon', { q: 1, r: 0 }),
        ],
      }),
      'C1', 'P2', { tecnica: 'Disipar' }
    )
    expect(estado.detalle.poolDefensa).toBe('1g1')
  })
})

describe('A-11-N6 — UNA Técnica por ronda por unidad', () => {
  const reglasOn = { tecnicasUnaPorRonda: true }
  const reglasOff = { tecnicasUnaPorRonda: false }
  const campeon = (foco, usadas = 0) => unidad('C1', 'A', 'Campeon', { q: 0, r: 0 }, {
    foco, tecnicasUsadasEsteRonda: usadas,
  })

  it('Con la regla activa, quien ya usó su Técnica no puede declarar otra', () => {
    const resultado = puedeDeclarar(campeon([token('Fuego'), token('Fuego')], 1), 'Explosion', { reglas: reglasOn })
    expect(resultado.ok).toBe(false)
    expect(resultado.motivo).toContain('esta ronda')
  })

  it('Con la regla desactivada, la segunda de la ronda está permitida', () => {
    const resultado = puedeDeclarar(campeon([token('Fuego'), token('Fuego')], 1), 'Explosion', { reglas: reglasOff })
    expect(resultado.ok).toBe(true)
  })

  it('Con la regla activa, la primera de la ronda pasa', () => {
    const resultado = puedeDeclarar(campeon([token('Fuego'), token('Fuego')]), 'Explosion', { reglas: reglasOn })
    expect(resultado.ok).toBe(true)
  })

  it('Sin reglas en las opciones, el límite no aplica', () => {
    const resultado = puedeDeclarar(campeon([token('Fuego'), token('Fuego')], 1), 'Explosion')
    expect(resultado.ok).toBe(true)
  })

  it('declararTecnica cuenta la Técnica solo al consumir', () => {
    const u = campeon([token('Fuego'), token('Fuego')])
    const declarado = declararTecnica(u, 'Explosion', { reglas: reglasOn })
    expect(declarado.ok).toBe(true)
    expect(u.tecnicasUsadasEsteRonda).toBe(1)
  })

  it('(motor) una unidad no repite Técnica en la misma ronda aunque vuelva a activarse', () => {
    let estado = armarEstado({
      rng: dadosFijos([7, 2, 3, 4, 5, 6]),
      turnoDe: 'A',
      cartaJugadaEsteTurno: true,
      unidades: [
        unidad('C1', 'A', 'Campeon', { q: 0, r: 0 }, {
          maxVida: 4,
          foco: [token('Fuego'), token('Fuego'), token('Fuego'), token('Fuego')],
        }),
        unidad('P2', 'B', 'Peon', { q: 1, r: 0 }, { maxVida: 2 }),
      ],
      jugadores: {
        A: { mano: [{ elemento: 'Fuego', valor: 1 }] },
        B: { mano: [] },
      },
      poA: [po('A', 'Fuego', 9)],
    })

    estado = aplicarIntencion(estado, { tipo: 'ATACAR', jugador: 'A', atacante: 'C1', objetivo: 'P2', tecnica: 'Explosion' })
    expect(buscarUnidad(estado, 'C1').tecnicasUsadasEsteRonda).toBe(1)

    estado = aplicarIntencion(estado, { tipo: 'TERMINAR_TURNO', jugador: 'A' })
    expect(estado.turnoDe).toBe('A')
    expect(buscarUnidad(estado, 'C1').activacionCerrada).toBe(false)
    expect(buscarUnidad(estado, 'C1').tecnicasUsadasEsteRonda).toBe(1)

    estado = aplicarIntencion(estado, { tipo: 'ATACAR', jugador: 'A', atacante: 'C1', objetivo: 'P2', tecnica: 'Explosion' })
    const errores = estado.log.filter(l => l.tipo === 'error').map(l => l.descripcion)
    expect(errores.some(d => d.includes('ya usó su Técnica esta ronda'))).toBe(true)
    expect(buscarUnidad(estado, 'C1').activacionCerrada).toBe(false)
  })
})
