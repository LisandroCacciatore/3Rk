import { mulberry32, barajar } from './dice.js'
import { crearLog, agregarEvento } from './log.js'
import { crearReglas } from '../data/rules.js'
import { ARQUETIPOS } from '../data/archetypes.js'
import { FACCIONES } from '../data/factions.js'
import { obtenerEscenario } from '../data/scenarios.js'

let contadorUnidades = 0

function generarIdUnidad(jugador, arquetipo) {
  contadorUnidades++
  return `${arquetipo}-${contadorUnidades}`
}

function crearUnidadesDespliegue(jugador, faccion, escenario) {
  const positions = escenario.despliegue[jugador]
  const arquetiposFaccion = obtenerArquetiposFaccion(faccion)

  return positions.map((pos, i) => {
    // Si la posición trae un arquetipo explícito (Sandbox), lo usa; si no, usa el del roster estándar por índice.
    const arquetipo = pos.arquetipo || arquetiposFaccion[i] || 'Peon'
    const perfil = ARQUETIPOS[arquetipo]
    return {
      id: generarIdUnidad(jugador, arquetipo),
      jugador,
      arquetipo,
      pos: { q: pos.q, r: pos.r },
      heridas: 0,
      maxVida: perfil.vida,
      foco: [],
      estados: [],
      efectos: [],
      accionesEsteTurno: 0,
      activacionCerrada: false,
      activacionBaseUsada: false,
      tecnicasUsadasEsteRonda: 0,
    }
  })
}

function obtenerArquetiposFaccion(faccion) {
  return ['Rey', 'Campeon', 'Alfil', 'Torre', 'Caballo', 'Peon']
}

export function crearEstadoInicial(semilla, escenarioNombre = 'base', faccionA = 'Fuego', faccionB = 'Agua') {
  contadorUnidades = 0
  const rng = mulberry32(semillaStringASeed(semilla))

  // D-26/D-28: el escenario es DATO (src/data/scenarios.js). El segundo
  // parámetro es opcional: por defecto se juega el escenario base (retro-
  // compatibilidad con tests y simulaciones).
  const escenario = obtenerEscenario(escenarioNombre) || obtenerEscenario('base')
  const reglas = crearReglas()

  const unidadesA = crearUnidadesDespliegue('A', faccionA, escenario)
  const unidadesB = crearUnidadesDespliegue('B', faccionB, escenario)
  const unidades = [...unidadesA, ...unidadesB]

  const mazoA = barajar([...FACCIONES[faccionA].mazo], rng)
  const mazoB = barajar([...FACCIONES[faccionB].mazo], rng)

  const manoA = mazoA.splice(0, reglas.manoInicial)
  const manoB = mazoB.splice(0, reglas.manoInicial)

  const turnoInicial = tirarMoneda(rng) === 0 ? 'A' : 'B'

  const estado = {
    semilla,
    rng,
    ronda: 1,
    jugadorInicial: turnoInicial,
    turnoDe: turnoInicial,
    faseTurno: 'inicio',
    cartaJugadaEsteTurno: false,
    escenario: escenarioNombre,
    tablero: {
      forma: escenario.forma || null,
      bloqueados: [...escenario.bloqueados],
      bloqueaMovimientoSinLos: [...(escenario.bloqueaMovimientoSinLos || [])],
      // Matriz de biomas del escenario (key axial → tipo visual). El terreno es
      // COSMÉTICO: la UI lo pinta; el motor solo usa forma/bloqueados/agua.
      terreno: escenario.terreno || null,
      lugares: (escenario.lugares || []).map(l => ({ ...l })),
      // D-33 (aprobado 12/08/2026): objetivos de victoria del escenario.
      // DATO de escenario: `puente` (hex a controlar) y `ladoEnemigo` (hexes que
      // cuentan como lado enemigo para cada bando). El motor solo los lee.
      objetivos: escenario.objetivos || null,
    },
    puntosVictoria: { A: 0, B: 0 },
    // D-33: marcador de estandartes por objetivos. Lo suma objetivos.js y lo
    // decide verificarVictoriaObjetivos. Empieza en 0 por bando.
    marcador: { A: 0, B: 0 },
    jugadores: {
      A: {
        faccion: faccionA,
        mazo: mazoA,
        mano: manoA,
        descarte: [],
        po: [],
      },
      B: {
        faccion: faccionB,
        mazo: mazoB,
        mano: manoB,
        descarte: [],
        po: [],
      },
    },
    unidades,
    reglas,
    secuencia: [],
    log: [],
    ganador: null,
  }

  estado.log = agregarEvento(crearLog(), {
    ronda: 1,
    turno: turnoInicial,
    actor: 'SISTEMA',
    tipo: 'inicio',
    descripcion: `Partida creada con semilla "${semilla}". Juega primero el jugador ${turnoInicial}.`,
  })

  return estado
}

function semillaStringASeed(semilla) {
  let hash = 0
  const str = String(semilla)
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return Math.abs(hash) || 1
}

function tirarMoneda(rng) {
  return rng() < 0.5 ? 0 : 1
}
