import { describe, it, expect } from 'vitest'
import { crearEstadoInicial } from '../engine/state.js'
import { aplicarIntencion } from '../engine/index.js'
import { exportarRegistro, reproducirPartida } from '../engine/registro.js'
import { metricasDePartida } from '../engine/metrics.js'
import { poolConStunned } from '../engine/status.js'
import { crearReglas } from '../data/rules.js'
import { armarEstado, unidad, dadosFijos, buscarUnidad, po } from './helpers.js'

const carta = (elemento, valor) => ({ elemento, valor })

describe('US-090 — Registro y reproducibilidad (D-20/D-21)', () => {
  it('Cada intención aplicada queda en la secuencia', () => {
    let estado = crearEstadoInicial('reg-01')
    const antes = estado.secuencia.length
    estado = aplicarIntencion(estado, { tipo: 'JUGAR_CARTA', jugador: 'A', indiceCarta: 0 })
    expect(estado.secuencia.length).toBe(antes + 1)
    expect(estado.secuencia.at(-1)).toMatchObject({
      tipo: 'JUGAR_CARTA', jugador: 'A', indiceCarta: 0,
    })
  })

  it('Las intenciones inválidas no entran en la secuencia', () => {
    let estado = crearEstadoInicial('reg-02')
    const antes = estado.secuencia.length
    estado = aplicarIntencion(estado, { tipo: 'TERMINAR_TURNO', jugador: 'A' })
    expect(estado.secuencia.length).toBe(antes)
    expect(estado.log.at(-1).tipo).toBe('error')
  })

  it('Una intención desconocida no entra en la secuencia', () => {
    let estado = crearEstadoInicial('reg-03')
    estado = aplicarIntencion(estado, { tipo: 'INEXISTENTE', jugador: 'A' })
    expect(estado.secuencia).toHaveLength(0)
  })

  it('Exporta semilla, reglas y secuencia', () => {
    const estado = crearEstadoInicial('reg-04')
    const registro = exportarRegistro(estado)
    expect(registro.semilla).toBe('reg-04')
    expect(registro.reglas).toEqual(estado.reglas)
    expect(registro.secuencia).toEqual([])
  })

  it('La configuración de reglas forma parte del registro exportado', () => {
    let estado = crearEstadoInicial('reg-05')
    estado = aplicarIntencion(estado, {
      tipo: 'CAMBIAR_REGLAS', jugador: 'A', reglas: { manoInicial: 3 },
    })
    const registro = exportarRegistro(estado)
    expect(registro.reglas.manoInicial).toBe(3)
  })

  it('Se reproduce la misma partida a partir de semilla y secuencia', () => {
    const semilla = 'repro-01'
    let original = crearEstadoInicial(semilla)
    original = aplicarIntencion(original, { tipo: 'JUGAR_CARTA', jugador: original.turnoDe, indiceCarta: 0 })
    const registro = exportarRegistro(original)

    const reproducida = reproducirPartida(registro.semilla, registro.secuencia)
    expect(reproducida.unidades).toEqual(original.unidades)
    expect(reproducida.jugadores.A.po).toEqual(original.jugadores.A.po)
    expect(reproducida.jugadores.B.po).toEqual(original.jugadores.B.po)
    expect(reproducida.log.map(l => ({ tipo: l.tipo, descripcion: l.descripcion })))
      .toEqual(original.log.map(l => ({ tipo: l.tipo, descripcion: l.descripcion })))
  })

  it('Las métricas registran los PO perdidos sin gastar', () => {
    const turno = 'A'
    let estado = crearEstadoInicial('met-po')
    estado = aplicarIntencion(estado, { tipo: 'JUGAR_CARTA', jugador: turno, indiceCarta: 0 })
    estado = aplicarIntencion(estado, { tipo: 'TERMINAR_TURNO', jugador: turno })
    const m = metricasDePartida(estado)
    expect(m.poPerdidos).toBeGreaterThan(0)
  })

  it('Las métricas cuentan las veces que se pagó una acción extra cara (>= 4 PO)', () => {
    const mueve = (estado, destino) => aplicarIntencion(
      estado, { tipo: 'MOVER', jugador: 'A', unidadId: 'P1', destino }
    )
    let estado = armarEstado({
      turnoDe: 'A',
      unidades: [
        unidad('P1', 'A', 'Peon', { q: 0, r: 0 }),
        unidad('P2', 'B', 'Peon', { q: 0, r: -3 }),
      ],
      poA: [po('A', 'Fuego', 20)],
    })
    // 1ª gratis, 2ª = 2 PO, 3ª = 4 PO (cuenta como cara), 4ª = 4 PO (cuenta)
    estado = mueve(estado, { q: 1, r: 0 })
    estado = mueve(estado, { q: 2, r: 0 })
    estado = mueve(estado, { q: 3, r: 0 })
    estado = mueve(estado, { q: 4, r: 0 })
    const m = metricasDePartida(estado)
    expect(m.accionesCaras).toBe(2)
  })

  it('Las métricas cuentan los turnos jugados en solitario', () => {
    let estado = armarEstado({
      turnoDe: 'A',
      jugadores: {
        A: { mano: [carta('Fuego', 1), carta('Tierra', 2)] },
        B: { mano: [] },
      },
    })
    estado = aplicarIntencion(estado, { tipo: 'JUGAR_CARTA', jugador: 'A', indiceCarta: 0 })
    estado = aplicarIntencion(estado, { tipo: 'TERMINAR_TURNO', jugador: 'A' })
    const m = metricasDePartida(estado)
    expect(m.turnosSolitarios).toBe(1)
  })

  it('Las métricas registran en qué ronda murió cada Rey', () => {
    const estado = aplicarIntencion(
      armarEstado({
        rng: dadosFijos([9, 4, 3]),
        turnoDe: 'A',
        ronda: 1,
        reglas: { reyProtegidoRonda1: false },
        unidades: [
          unidad('P1', 'A', 'Peon', { q: 0, r: 0 }),
          unidad('R2', 'B', 'Rey', { q: 1, r: 0 }, { heridas: 3, maxVida: 4 }),
          unidad('P3', 'B', 'Peon', { q: 2, r: 0 }),
        ],
        poA: [po('A', 'Fuego', 5)],
      }),
      { tipo: 'ATACAR', jugador: 'A', atacante: 'P1', objetivo: 'R2' }
    )
    const m = metricasDePartida(estado)
    expect(m.rondaMuerteReyB).toBe(1)
    expect(m.rondaMuerteReyA).toBeNull()
    expect(m.totalEliminaciones).toBe(1)
  })
})

describe('US-091 — Panel de reglas (D-22/D-23/D-24)', () => {
  it('CAMBIAR_REGLAS aplica el cambio y lo registra con ronda y turno', () => {
    const estado = armarEstado({ turnoDe: 'A' })
    const nuevo = aplicarIntencion(estado, {
      tipo: 'CAMBIAR_REGLAS', jugador: 'A', reglas: { manoInicial: 3 },
    })
    expect(nuevo.reglas.manoInicial).toBe(3)
    const ev = nuevo.log.find(l => l.tipo === 'reglas')
    expect(ev).toBeDefined()
    expect(ev.ronda).toBe(1)
    expect(ev.turno).toBe('A')
    expect(ev.descripcion).toContain('manoInicial')
  })

  it('Una clave desconocida se rechaza y no cambia nada', () => {
    const estado = armarEstado({ turnoDe: 'A' })
    const antes = JSON.parse(JSON.stringify(estado.reglas))
    const nuevo = aplicarIntencion(estado, {
      tipo: 'CAMBIAR_REGLAS', jugador: 'A', reglas: { inexistente: 1 },
    })
    expect(nuevo.reglas).toEqual(antes)
    expect(nuevo.log.some(l => l.tipo === 'error' && l.descripcion.includes('inexistente'))).toBe(true)
  })

  it('Un tipo inválido se rechaza', () => {
    const nuevo = aplicarIntencion(armarEstado({ turnoDe: 'A' }), {
      tipo: 'CAMBIAR_REGLAS', jugador: 'A', reglas: { manoInicial: 'cinco' },
    })
    expect(nuevo.log.some(l => l.tipo === 'error' && l.descripcion.includes('tipo'))).toBe(true)
  })

  it('Un cambio de reglas no rompe la partida en curso', () => {
    let estado = armarEstado({
      ronda: 2,
      turnoDe: 'A',
      unidades: [unidad('P1', 'A', 'Peon', { q: 0, r: 0 })],
    })
    estado = aplicarIntencion(estado, {
      tipo: 'CAMBIAR_REGLAS', jugador: 'A', reglas: { manoInicial: 4 },
    })
    expect(estado.ronda).toBe(2)
    expect(estado.reglas.manoInicial).toBe(4)
    expect(buscarUnidad(estado, 'P1').pos).toEqual({ q: 0, r: 0 })
  })

  it('D-23: conmutar Stunned a "-1 dado guardado" reduce el keep y conserva los dados', () => {
    const pool = poolConStunned(
      { estados: ['Stunned'] },
      { dados: 2, keep: 2 },
      crearReglas({ stunnedReduceKept: true })
    )
    expect(pool.dados).toBe(2)
    expect(pool.keep).toBe(1)
    expect(poolConStunned(
      { estados: ['Stunned'] },
      { dados: 2, keep: 1 },
      crearReglas({ stunnedReduceKept: true })
    ).keep).toBe(1)
  })

  it('D-05: con el contador por ronda, no se reinicia al terminar el turno', () => {
    let estado = armarEstado({
      turnoDe: 'A',
      reglas: { reinicioContador: 'ronda' },
      unidades: [unidad('P1', 'A', 'Peon', { q: 0, r: 0 }, { accionesEsteTurno: 2 })],
      jugadores: {
        A: { mano: [carta('Fuego', 1)] },
        B: { mano: [carta('Agua', 1)] },
      },
    })
    estado = aplicarIntencion(estado, { tipo: 'JUGAR_CARTA', jugador: 'A', indiceCarta: 0 })
    estado = aplicarIntencion(estado, { tipo: 'TERMINAR_TURNO', jugador: 'A' })
    expect(buscarUnidad(estado, 'P1').accionesEsteTurno).toBe(2)
    expect(estado.turnoDe).toBe('B')
  })

  it('D-05: por turno (arranque) el contador se reinicia', () => {
    let estado = armarEstado({
      turnoDe: 'A',
      unidades: [unidad('P1', 'A', 'Peon', { q: 0, r: 0 }, { accionesEsteTurno: 2 })],
      jugadores: {
        A: { mano: [carta('Fuego', 1)] },
        B: { mano: [carta('Agua', 1)] },
      },
    })
    estado = aplicarIntencion(estado, { tipo: 'JUGAR_CARTA', jugador: 'A', indiceCarta: 0 })
    estado = aplicarIntencion(estado, { tipo: 'TERMINAR_TURNO', jugador: 'A' })
    expect(buscarUnidad(estado, 'P1').accionesEsteTurno).toBe(0)
  })

  it('D-08: el robo por turno es configurable', () => {
    let estado = armarEstado({
      turnoDe: 'A',
      reglas: { roboPorTurno: 2 },
      jugadores: {
        A: { mano: [carta('Fuego', 1)], mazo: [] },
        B: { mano: [carta('Agua', 1)], mazo: [carta('Tierra', 1), carta('Aire', 1)] },
      },
    })
    estado = aplicarIntencion(estado, { tipo: 'JUGAR_CARTA', jugador: 'A', indiceCarta: 0 })
    estado = aplicarIntencion(estado, { tipo: 'TERMINAR_TURNO', jugador: 'A' })
    expect(estado.jugadores.B.mano).toHaveLength(3)
  })

  it('D-12: con el arranque, el defensor no queda Stunned al recibir una herida', () => {
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
    expect(buscarUnidad(estado, 'P2').estados).not.toContain('Stunned')
  })

  it('D-12: con la conmutable apagada, el defensor queda Stunned al recibir una herida', () => {
    const estado = aplicarIntencion(
      armarEstado({
        rng: dadosFijos([9, 4]),
        turnoDe: 'A',
        reglas: { defensorNoQuedaStunned: false },
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
    expect(p2.estados).toContain('Stunned')
  })
})
