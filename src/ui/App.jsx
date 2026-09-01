import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { crearEstadoInicial } from '../engine/state.js'
import { aplicarIntencion } from '../engine/index.js'
import { pensarIntencionBot } from '../engine/bot.js'
import { hexesMovibles, objetivosAtaque, origenesHabilidad, objetivosHabilidad, lugaresCapturables } from '../engine/selectors.js'
import { totalPO, poPorElemento } from '../engine/po.js'
import { costeProximaAccion } from '../engine/actions.js'
import { costeSiguienteToken } from '../engine/focus.js'
import { exportarRegistro, reproducirPartida } from '../engine/registro.js'
import { hexKey, distancia, hexEnRadio, hayLoS } from '../engine/hex.js'
import { ARQUETIPOS } from '../data/archetypes.js'
import { ESCENARIOS } from '../data/scenarios.js'
import { simboloElemento } from './elementos.js'
import {
  obtenerAcciones,
  obtenerTecnicasAtaque,
  obtenerTecnicasDefensa,
  hexesEnRango,
} from './adapter.js'
import Portada from './Portada.jsx'
import Board from './Board.jsx'
import UnitCard from './UnitCard.jsx'
import HandPanel, { CartaActionMenu } from './HandPanel.jsx'
import TechniquePicker from './TechniquePicker.jsx'
import SettingsPanel from './SettingsPanel.jsx'
import DevModal from './DevModal.jsx'
import CombatResult from './CombatResult.jsx'
import SimulationPanel from './SimulationPanel.jsx'
import ReplayBar from './ReplayBar.jsx'
import CartelTurno from './CartelTurno.jsx'
import HandoffTurno from './HandoffTurno.jsx'
import {
  sonidoDados,
  sonidoImpacto,
  sonidoCarta,
  sonidoFanfarria,
  sonidoExplosion,
  sonidoTecnica,
  sonidoAmenazaRey,
  desbloquearAudio,
} from './sound.js'
import { tutorialCompletado, marcarTutorialCompletado } from '../data/onboarding.js'
import { guardarPartida } from '../data/historial.js'
import Onboarding from './Onboarding.jsx'
import CelebracionMomientos from './CelebracionMomientos.jsx'
import HistorialPanel from './HistorialPanel.jsx'
import ChallengeShare from './ChallengeShare.jsx'
import DescubrimientoPopup from './DescubrimientoPopup.jsx'

const SEMILLA_DEFECTO = 'playtest-01'

const TIMEOUT_CARTEL_TURNO = 1800
const TIMEOUT_BOT_PENSAR = 1000
const TIMEOUT_AUTO_PASAR = 600
const TIMEOUT_REPLAY_PASO = 260
const TIMEOUT_COPIADO_CONFIRMAR = 1600

export default function App() {
  const [pantalla, setPantalla] = useState('portada')
  const [semilla, setSemilla] = useState(SEMILLA_DEFECTO)
  // Escenario (mapa) seleccionado: vive en la UI; el motor lo recibe al crear
  // la partida y queda fijado en `estado.escenario` (y en el registro exportado).
  const [escenarioSel, setEscenarioSel] = useState('base')
  const [faccionA, setFaccionA] = useState('Fuego')
  const [faccionB, setFaccionB] = useState('Agua')
  const [modoSolitario, setModoSolitario] = useState(false)
  const [estado, setEstado] = useState(() => crearEstadoInicial(SEMILLA_DEFECTO, 'base', 'Fuego', 'Agua'))
  const [unidadSel, setUnidadSel] = useState(null)
  const [cartaSel, setCartaSel] = useState(null)
  // D-27 (US-163): flujo de carta jugada como Habilidad. null = inactivo.
  // { indiceCarta, origenId? } — primero elige el ORIGEN (unidad aliada, sin
  // restricción de rol), luego el objetivo que cumple el filtro de la carta.
  const [habilidadSel, setHabilidadSel] = useState(null)
  const [modo, setModo] = useState('ninguno')
  const [prepAtaque, setPrepAtaque] = useState(null)
  const [panelReglas, setPanelReglas] = useState(false)
  const [panelAjustes, setPanelAjustes] = useState(false)
  const [repetirSel, setRepetirSel] = useState([])
  const [hoverId, setHoverId] = useState(null)
  const [flashIds, setFlashIds] = useState(() => new Set())
  const [retrocesoIds, setRetrocesoIds] = useState(() => new Set())
  const [ultimoResumen, setUltimoResumen] = useState(null)
  const [combate, setCombate] = useState(null)
  const [panelSimulacion, setPanelSimulacion] = useState(false)
  // Preferencia de playtest (UI, no es una regla del motor): tablero esquemático
  // plano sin texturas ni decorado, para leer el terreno y los estados cómodo.
  const [tableroEsquematico, setTableroEsquematico] = useState(false)
  // Cámara del tablero: cada incremento de resetCamaraTick pide a Board volver
  // al encuadre completo (zoom 100%). Se sube desde el botón de reencuadre y al
  // empezar/crear partida. Pura presentación.
  const [resetCamaraTick, setResetCamaraTick] = useState(0)
  const [replay, setReplay] = useState(null)
  const [indiceReplay, setIndiceReplay] = useState(0)
  const [autoplay, setAutoplay] = useState(false)
  const [copiadoReplay, setCopiadoReplay] = useState(false)
  // US-104 — screen shake global: se dispara por eventos reales del motor y se
  // limpia al terminar la animación. La intensidad depende del tipo de evento.
  const [screenShake, setScreenShake] = useState(null)
  // Cartel de cambio de turno (UI, no regla): { desde, hacia, clave } cuando el
  // turno activo cambia. Se cierra solo a los ~1,8 s o con clic/Escape.
  const [cartelTurno, setCartelTurno] = useState(null)
  // Mano a mano (handoff, UI no regla): cuando cambia la facción activa (A↔B)
  // y está ON, un overlay opaco bloquea la pantalla hasta tocar "Comenzar mi
  // turno", para que el rival no vea la mano nueva. ON por defecto.
  const [manoAMano, setManoAMano] = useState(true)
  const [handoff, setHandoff] = useState(null)
  // Onboarding (P0): guía de primera partida
  const [mostrarOnboarding, setMostrarOnboarding] = useState(() => !tutorialCompletado())
  const [onboardingPaso, setOnboardingPaso] = useState(0)
  // Historial (P1): panel de historial de partidas
  const [panelHistorial, setPanelHistorial] = useState(false)
  // Descubrimiento (P2): popup de interacciones elementales
  const [descubrimientoTecnica, setDescubrimientoTecnica] = useState(null)
  // Timer del pase automático de turno (0 PO / mano vacía) y del cierre del
  // cartel. Se limpian al despachar de nuevo o al terminar el turno a mano.
  const autoPasarRef = useRef(null)
  const cartelRef = useRef(null)

  const resetearInterfaz = () => {
    setUnidadSel(null)
    setCartaSel(null)
    setHabilidadSel(null)
    setModo('ninguno')
    setPrepAtaque(null)
    setPanelReglas(false)
    setPanelAjustes(false)
    setRepetirSel([])
    setHoverId(null)
    setFlashIds(new Set())
    setRetrocesoIds(new Set())
    setUltimoResumen(null)
    setCombate(null)
    setPanelSimulacion(false)
    setReplay(null)
    setIndiceReplay(0)
    setAutoplay(false)
    setCopiadoReplay(false)
    setCartelTurno(null)
    setHandoff(null)
    if (autoPasarRef.current) { clearTimeout(autoPasarRef.current); autoPasarRef.current = null }
    if (cartelRef.current) { clearTimeout(cartelRef.current); cartelRef.current = null }
  }

  const comenzar = () => {
    setEstado(crearEstadoInicial(semilla || SEMILLA_DEFECTO, escenarioSel, faccionA, faccionB))
    resetearInterfaz()
    setResetCamaraTick(t => t + 1)
    setPantalla('partida')
  }

  const despachar = (intencion) => {
    const nuevo = aplicarIntencion(estado, intencion)
    setEstado(nuevo)
    const nuevas = nuevo.log.slice(estado.log.length)

    // Cartel/handoff de cambio de turno (UI, no regla): se muestran cada vez
    // que el jugador activo cambia (a mano o por auto-pase), nunca al terminar
    // la partida. Si cambia la FACCIÓN y el handoff está ON, el handoff opaco
    // reemplaza al cartel efímero. Si no, el cartel se cierra solo (~1,8 s).
    if (!nuevo.ganador && nuevo.turnoDe !== estado.turnoDe) {
      const cambiaFaccion =
        estado.jugadores[estado.turnoDe].faccion !== estado.jugadores[nuevo.turnoDe].faccion
      if (cambiaFaccion && manoAMano) {
        setHandoff({ desde: estado.turnoDe, hacia: nuevo.turnoDe })
        setCartelTurno(null)
        if (cartelRef.current) { clearTimeout(cartelRef.current); cartelRef.current = null }
      } else {
        setCartelTurno({ desde: estado.turnoDe, hacia: nuevo.turnoDe, clave: nuevo.log.length })
        if (cartelRef.current) clearTimeout(cartelRef.current)
        cartelRef.current = window.setTimeout(() => setCartelTurno(null), TIMEOUT_CARTEL_TURNO)
      }
    }

    const cambiadas = []
    for (const antes of estado.unidades) {
      const despues = nuevo.unidades.find(u => u.id === antes.id)
      if (!despues) continue
      if (
        antes.pos.q !== despues.pos.q ||
        antes.pos.r !== despues.pos.r ||
        antes.heridas !== despues.heridas ||
        antes.activacionCerrada !== despues.activacionCerrada
      ) {
        cambiadas.push(despues.id)
      }
    }
    if (cambiadas.length > 0) {
      setFlashIds(prev => new Set([...prev, ...cambiadas]))
    }

    // US-099 — retroceso: marcar unidades desplazadas por el combate para la
    // animación de impacto. Solo si hubo desplazamiento real.
    const retro = nuevas.filter(ev =>
      (ev.tipo === 'retroceso' || ev.tipo === 'retroceso-defensor') &&
      ev.unidadId &&
      ev.descripcion && ev.descripcion.includes('retrocede a')
    )
    if (retro.length > 0) {
      setRetrocesoIds(prev => new Set([...prev, ...retro.map(ev => ev.unidadId)]))
    }

    if (nuevas.length > 0) {
      const relevante = [...nuevas].reverse().find(x =>
        ['herida', 'movimiento', 'eliminacion', 'carta-jugada', 'fin-partida'].includes(x.tipo)
      ) || nuevas[nuevas.length - 1]
      setUltimoResumen({
        clave: nuevo.log.length,
        actor: relevante.actor,
        tipo: relevante.tipo,
        descripcion: relevante.descripcion,
      })
    }

    const ataqueEv = [...nuevas].reverse().find(x => x.tipo === 'ataque' && x.detalle)
    if (ataqueEv) {
      setCombate(ataqueEv.detalle)
      sonidoDados()
    }

    // US-100 — sonido disparado por eventos reales del motor (nunca inferido).
    for (const ev of nuevas) {
      if (ev.tipo === 'herida') sonidoImpacto()
      else if (ev.tipo === 'carta-jugada') sonidoCarta()
      else if (ev.tipo === 'fin-partida') sonidoFanfarria()
    }

    // US-104 — screen shake global disparado por eventos reales del motor.
    // Intensidad fija por tipo de evento (leve/média/fuerte). No se inventa una
    // condición de crítico (GDD §19): la explosión se detecta por el formato de
    // los dados del evento de ataque, no por una regla de la UI.
    if (nuevas.length > 0) {
      const intensidad = (() => {
        if (nuevas.some(ev => ev.tipo === 'eliminacion')) return 'fuerte'
        if (nuevas.some(ev => ev.tipo === 'herida')) return 'media'
        if (nuevas.some(ev => ev.tipo === 'retroceso' || ev.tipo === 'retroceso-defensor')) return 'media'
        const ataqueConExplosion = nuevas.some(ev =>
          ev.tipo === 'ataque' &&
          ev.detalle &&
          (
            (ev.detalle.dadosAtaque || []).some(d => d.includes('+')) ||
            (ev.detalle.dadosDefensa || []).some(d => d.includes('+'))
          )
        )
        if (ataqueConExplosion) return 'leve'
        return null
      })()
      if (intensidad) setScreenShake(intensidad)
    }

    // P0 — Sonidos de celebración (explosiones encadenadas, técnicas, amenaza al Rey).
    for (const ev of nuevas) {
      if (ev.tipo === 'ataque' && ev.detalle) {
        const expAtq = (ev.detalle.dadosAtaque || []).filter(d => d.includes('+')).length
        const expDef = (ev.detalle.dadosDefensa || []).filter(d => d.includes('+')).length
        if (expAtq + expDef >= 3) sonidoExplosion()
        else if (ev.tecnica) sonidoTecnica()
      }
      if (ev.tipo === 'herida') {
        const u = nuevo.unidades.find(u => u.id === ev.unidadId)
        if (u && u.arquetipo === 'Rey' && u.heridas < u.maxVida) sonidoAmenazaRey()
      }
    }

    // P0 — Onboarding: avanzar pasos automáticamente.
    if (mostrarOnboarding && onboardingPaso < 6) {
      for (const ev of nuevas) {
        if (ev.tipo === 'carta-jugada' && onboardingPaso === 0) { setOnboardingPaso(1); break }
        if (ev.tipo === 'ataque' && onboardingPaso === 3) { setOnboardingPaso(4); break }
        if (ev.tipo === 'herida' && onboardingPaso === 4) { setOnboardingPaso(5); break }
      }
      if (modo === 'atacar' && onboardingPaso === 1) setOnboardingPaso(2)
      if (unidadSel && onboardingPaso === 0) setOnboardingPaso(1)
    }

    // P1 — Historial: guardar al terminar la partida.
    if (nuevo.ganador && !estado.ganador) {
      guardarPartida({
        semilla: nuevo.semilla,
        escenario: nuevo.escenario,
        faccionA: nuevo.jugadores.A.faccion,
        faccionB: nuevo.jugadores.B.faccion,
        ganador: nuevo.ganador.ganador,
        motivo: nuevo.ganador.motivo,
        rondas: nuevo.ronda,
        eliminacionesA: nuevo.unidades.filter(u => u.jugador === 'B').length,
        eliminacionesB: nuevo.unidades.filter(u => u.jugador === 'A').length,
        modoSolitario,
      })
    }

    // P2 — Descubrimiento: detectar técnica usada por primera vez.
    for (const ev of nuevas) {
      if (ev.tipo === 'ataque' && ev.tecnica) {
        setDescubrimientoTecnica(ev.tecnica)
        break
      }
    }
  }

  const activo = estado.turnoDe
  const otro = activo === 'A' ? 'B' : 'A'
  const jugadorActivo = estado.jugadores[activo]
  const finalizada = !!estado.ganador
  const unidad = estado.unidades.find(u => u.id === unidadSel) || null
  const pendiente = estado.combatePendiente
  // Ficha de unidad (PASO 5): la muestra la unidad propia seleccionada o, si
  // no hay selección, la unidad propia bajo el cursor (hover preview). Las del
  // rival no abren ficha. Pura presentación; reglas en el motor.
  const unidadHover = hoverId ? estado.unidades.find(u => u.id === hoverId) || null : null
  const unidadFicha =
    unidad && unidad.jugador === activo
      ? unidad
      : unidadHover && unidadHover.jugador === activo
        ? unidadHover
        : null
  const rivalSeleccionada = !!unidad && unidad.jugador !== activo
  const costeProx = unidad && unidad.jugador === activo && !finalizada && !unidad.activacionCerrada
    ? costeProximaAccion(unidad, estado.reglas)
    : null
  const poActivo = totalPO(jugadorActivo)

  const botTimerRef = useRef(null)
  
  // IA Bot (Modo Solitario)
  useEffect(() => {
    if (botTimerRef.current) {
      clearTimeout(botTimerRef.current)
      botTimerRef.current = null
    }
    if (pantalla !== 'partida' || replay || finalizada || pendiente || handoff) return
    if (modoSolitario && activo === 'B') {
      botTimerRef.current = window.setTimeout(() => {
        const intencion = pensarIntencionBot(estado)
        despachar(intencion)
      }, TIMEOUT_BOT_PENSAR)
    }
    return () => {
      if (botTimerRef.current) {
        clearTimeout(botTimerRef.current)
        botTimerRef.current = null
      }
    }
  }, [estado, pantalla, replay, finalizada, pendiente, handoff, modoSolitario, activo, despachar])

  // Pase automático de turno (convenio de UI, no una regla): si el jugador
  // activo se quedó sin PO (y ya jugó la carta obligatoria) o sin cartas que
  // jugar, no hay acciones legales pendientes → se despacha TERMINAR_TURNO
  // solo, con un breve delay para que se vea la última acción. El motor sigue
  // siendo explícito (los bots de sim no cambian) y el determinismo intacto.
  // Guardas: nada en replay, sin Reflujo pendiente, sin partida terminada y
  // sin "Mover gratis" de alguna unidad propia por usar.
  // D-activacionBaseGratis: con la activación base gratuita, la primera
  // acción por unidad es gratis. El auto-pase dispara cuando el jugador no
  // puede pagar acciones extra Y ya usó todas sus activaciones base.
  useEffect(() => {
    if (autoPasarRef.current) {
      clearTimeout(autoPasarRef.current)
      autoPasarRef.current = null
    }
    if (pantalla !== 'partida' || replay || finalizada || pendiente || handoff) return
    const po = totalPO(jugadorActivo)
    const sinCartaPorJugar =
      estado.cartaJugadaEsteTurno === true || jugadorActivo.mano.length === 0
    const sinMovimientoGratis =
      !estado.unidades.some(u => u.jugador === activo && (u.movimientoGratis || 0) > 0)
    const costesExtra = estado.reglas.costesAccionExtra || [2, 4]
    const minCosteExtra = costesExtra[0]
    const todasUnidadesAgotadas = !estado.unidades.some(
      u => u.jugador === activo && !u.activacionCerrada && !u.activacionBaseUsada
    )
    const puedePagarExtra = po >= minCosteExtra
    const sinAccionesLegales = puedePagarExtra ? false : todasUnidadesAgotadas
    if (!sinAccionesLegales || !sinCartaPorJugar || !sinMovimientoGratis) return
    autoPasarRef.current = window.setTimeout(() => {
      despachar({ tipo: 'TERMINAR_TURNO', jugador: activo })
      setUnidadSel(null)
      setCartaSel(null)
      setHabilidadSel(null)
      setModo('ninguno')
      setPrepAtaque(null)
    }, TIMEOUT_AUTO_PASAR)
    return () => {
      if (autoPasarRef.current) {
        clearTimeout(autoPasarRef.current)
        autoPasarRef.current = null
      }
    }
  }, [estado, pantalla, replay, finalizada, pendiente, activo, jugadorActivo, despachar, handoff])

  // Limpieza del timer del cartel al desmontar.
  useEffect(() => () => {
    if (cartelRef.current) clearTimeout(cartelRef.current)
  }, [])

  const nuevaPartida = () => {
    resetearInterfaz()
    setPantalla('portada')
  }

  const exportar = () => {
    const registro = exportarRegistro(estado)
    const blob = new Blob([JSON.stringify(registro, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const enlace = document.createElement('a')
    enlace.href = url
    enlace.download = `escaramuza-${estado.semilla || 'partida'}.json`
    enlace.click()
    URL.revokeObjectURL(url)
  }

  // US-102 — copiar el replay JSON al portapapeles con confirmación visual.
  const copiarReplay = async () => {
    const registro = JSON.stringify(exportarRegistro(estado))
    try {
      await navigator.clipboard.writeText(registro)
    } catch {
      const ta = document.createElement('textarea')
      ta.value = registro
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
    }
    setCopiadoReplay(true)
    window.setTimeout(() => setCopiadoReplay(false), TIMEOUT_COPIADO_CONFIRMAR)
  }

  const pasoReplay = useCallback(() => {
    if (!replay) return
    if (indiceReplay >= replay.secuencia.length) {
      setAutoplay(false)
      return
    }
    setEstado(est => aplicarIntencion(est, replay.secuencia[indiceReplay]))
    setIndiceReplay(i => i + 1)
  }, [replay, indiceReplay])

  // Reproducción automática paso a paso (pura presentación del replay).
  useEffect(() => {
    if (!autoplay || !replay || indiceReplay >= replay.secuencia.length) return
    const t = window.setTimeout(pasoReplay, TIMEOUT_REPLAY_PASO)
    return () => window.clearTimeout(t)
  }, [autoplay, replay, indiceReplay, pasoReplay])

  const saltarReplay = () => {
    if (!replay) return
    setEstado(reproducirPartida(replay.semilla, replay.secuencia, replay.escenario))
    setReplay(null)
    setIndiceReplay(0)
    setAutoplay(false)
  }

  const cerrarReplay = () => {
    setReplay(null)
    setIndiceReplay(0)
    setAutoplay(false)
  }

  const onCargarRegistro = (e) => {
    const archivo = e.target.files[0]
    e.target.value = null
    if (!archivo) return
    const lector = new FileReader()
    lector.onload = () => {
      try {
        const registro = JSON.parse(lector.result)
        // US-102 — reproducir paso a paso: se arranca desde el estado inicial
        // de la semilla (+ escenario) y se aplica la secuencia de a una
        // intención. El estado final es idéntico a reproducirPartida.
        const escenario = registro.escenario || 'base'
        setSemilla(registro.semilla)
        setEscenarioSel(escenario)
        resetearInterfaz()
        setEstado(crearEstadoInicial(registro.semilla, escenario))
        setReplay({ semilla: registro.semilla, escenario, secuencia: registro.secuencia || [] })
        setIndiceReplay(0)
        setPantalla('partida')
      } catch (err) {
        window.alert(`No se pudo reproducir la partida: ${err.message}`)
      }
    }
    lector.readAsText(archivo)
  }

  const onCambiarReglas = (reglas) => {
    despachar({ tipo: 'CAMBIAR_REGLAS', jugador: activo, reglas })
  }

  const tecAtaque = useMemo(
    () => (unidad ? obtenerTecnicasAtaque(estado, unidad.id) : []),
    [unidad, estado]
  )

  const acciones = []
  const tecDefensa = []

  if (unidad) {
    const esMia = unidad.jugador === activo
    for (const a of obtenerAcciones(estado, unidad.id)) {
      acciones.push({
        ...a,
        onClick: () => {
          setCombate(null)
          if (a.id === 'mover') setModo('mover')
          else if (a.id === 'atacar') setModo('atacar')
          else if (a.id === 'concentrar') setModo('concentrar')
          else if (a.id === 'capturar') setModo('capturar')
        },
      })
    }
    for (const t of obtenerTecnicasDefensa(estado, unidad.id)) {
      const d = {
        id: t.id,
        nombre: t.nombre,
        coste: t.coste,
        habilitada: false,
        motivo: t.motivo,
        onClick: () => despachar({
          tipo: 'DECLARAR_TECNICA',
          jugador: activo,
          unidadId: unidad.id,
          tecnica: t.id,
          cartaIndice: t.cartaIndice,
        }),
      }
      if (!esMia) d.motivo = 'no es tu unidad'
      else if (unidad.activacionCerrada) d.motivo = 'ya atacó este turno'
      else if (!t.ok) d.motivo = t.motivo
      else d.habilitada = true
      tecDefensa.push(d)
    }
  }

  const { movilesSet, objetivosSet, segundosSet, rangoSet, capturaSet } = useMemo(() => {
    const mov = new Set()
    const obj = new Set()
    const seg = new Set()
    const rango = new Set()
    const capt = new Set()
    if (unidad && unidad.jugador === activo && !unidad.activacionCerrada && !finalizada) {
      if (modo === 'mover') {
        for (const h of hexesMovibles(estado, unidad.id)) mov.add(hexKey(h))
      }
      if (modo === 'atacar') {
        for (const o of objetivosAtaque(estado, unidad.id)) obj.add(o.id)
        for (const h of hexesEnRango(estado, unidad.id)) rango.add(hexKey(h))
        if (prepAtaque?.tecnica === 'DobleTiro') {
          const def = estado.unidades.find(u => u.id === prepAtaque.objetivo)
          if (def) {
            for (const s of objetivosAtaque(estado, unidad.id)) {
              if (s.id !== def.id && distancia(s.pos, def.pos) === 1) seg.add(s.id)
            }
          }
        }
      }
      if (modo === 'capturar') {
        for (const l of lugaresCapturables(estado, unidad.id)) capt.add(hexKey(l))
      }
    }
    return { movilesSet: mov, objetivosSet: obj, segundosSet: seg, rangoSet: rango, capturaSet: capt }
  }, [unidad, activo, finalizada, modo, estado, prepAtaque])

  // D-27 (US-163): objetivos para la carta jugada como Habilidad.
  // Fase 1 selecciona el ORIGEN (cualquier unidad aliada); fase 2 el objetivo
  // dentro de su alcance que cumple el filtro (bando + rol/arquetipo) de la carta.
  const { origenesSet, objetivoHabSet, cartaHabilidad } = useMemo(() => {
    const canSet = new Set()
    const objSet = new Set()
    let cartaHab = null
    if (habilidadSel && !finalizada && estado.reglas.habilitarHabilidadesCarta) {
      const carta = jugadorActivo?.mano?.[habilidadSel.indiceCarta]
      if (carta) {
        cartaHab = carta
        if (!habilidadSel.origenId) {
          for (const c of origenesHabilidad(estado, activo)) canSet.add(c.id)
        } else {
          for (const o of objetivosHabilidad(estado, habilidadSel.origenId, carta)) objSet.add(o.id)
        }
      }
    }
    return { origenesSet: canSet, objetivoHabSet: objSet, cartaHabilidad: cartaHab }
  }, [habilidadSel, finalizada, estado, jugadorActivo, activo])

  const rawOnUnitClick = (u) => {
    if (finalizada) return
    setCombate(null)
    if (modo === 'habilidad' && habilidadSel) {
      if (habilidadSel.directa) {
        // Single-click: el objetivo se valida por el motor (rango/LoS/filtro).
        // El origen se auto-selecciona en validarHabilidad.
        if (objetivoHabSet.has(u.id)) {
          despachar({
            tipo: 'JUGAR_CARTA', jugador: activo, indiceCarta: habilidadSel.indiceCarta,
            uso: 'habilidad', unidad: null, objetivo: u.id,
          })
          setHabilidadSel(null)
          setCartaSel(null)
          setModo('ninguno')
        }
      } else {
        // Two-click: flujo original origen → objetivo.
        if (!habilidadSel.origenId) {
          if (origenesSet.has(u.id)) {
            setHabilidadSel(prev => ({ ...prev, origenId: u.id }))
          }
        } else if (objetivoHabSet.has(u.id)) {
          despachar({
            tipo: 'JUGAR_CARTA', jugador: activo, indiceCarta: habilidadSel.indiceCarta,
            uso: 'habilidad', unidad: habilidadSel.origenId, objetivo: u.id,
          })
          setHabilidadSel(null)
          setCartaSel(null)
          setModo('ninguno')
        }
      }
      return
    }
    if (modo === 'atacar') {
      if (objetivosSet.has(u.id)) {
        setPrepAtaque({ atacante: unidad.id, objetivo: u.id, tecnica: null, segundo: null })
      } else if (prepAtaque?.tecnica === 'DobleTiro' && segundosSet.has(u.id)) {
        setPrepAtaque(prev => ({ ...prev, segundo: u.id }))
      } else if (u.jugador === activo) {
        setUnidadSel(u.id)
        setModo('ninguno')
        setPrepAtaque(null)
      }
      return
    }
    setUnidadSel(u.id)
    setModo('ninguno')
    setPrepAtaque(null)
  }
  const onUnitClickRef = useRef(rawOnUnitClick)
  onUnitClickRef.current = rawOnUnitClick
  const onUnitClick = useCallback((u) => onUnitClickRef.current(u), [])

  const rawOnHexClick = ({ q, r }) => {
    if (finalizada) return
    setCombate(null)
    const key = hexKey({ q, r })
    if (modo === 'mover' && unidad && movilesSet.has(key)) {
      despachar({ tipo: 'MOVER', jugador: activo, unidadId: unidad.id, destino: { q, r } })
    }
    if (modo === 'capturar' && unidad && capturaSet.has(key)) {
      despachar({ tipo: 'INTERACTUAR', jugador: activo, unidadId: unidad.id, hex: { q, r } })
    }
    if (modo === 'habilidad') setHabilidadSel(null)
    setModo('ninguno')
    setPrepAtaque(null)
  }
  const onHexClickRef = useRef(rawOnHexClick)
  onHexClickRef.current = rawOnHexClick
  const onHexClick = useCallback(({ q, r }) => onHexClickRef.current({ q, r }), [])

  const onCartaClick = useCallback((i) => {
    setCombate(null)
    setCartaSel(prev => (prev === i ? null : i))
  }, [])

  const onHover = useCallback((id) => setHoverId(id), [])
  const onHoverEnd = useCallback(() => setHoverId(null), [])
  const onFlashEnd = useCallback((id) => {
    setFlashIds(prev => {
      if (!prev.has(id)) return prev
      const copia = new Set(prev)
      copia.delete(id)
      return copia
    })
  }, [])

  const onRetrocesoEnd = useCallback((id) => {
    setRetrocesoIds(prev => {
      if (!prev.has(id)) return prev
      const copia = new Set(prev)
      copia.delete(id)
      return copia
    })
  }, [])

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') {
        setModo('ninguno')
        setPrepAtaque(null)
        setCartaSel(null)
        setHabilidadSel(null)
        setPanelReglas(false)
        setPanelAjustes(false)
        setCombate(null)
        setPanelSimulacion(false)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // US-100 — desbloquear audio en el primer gesto del usuario.
  const audioDesbloqueadoRef = useRef(false)
  useEffect(() => {
    const onGesture = () => {
      if (!audioDesbloqueadoRef.current) {
        audioDesbloqueadoRef.current = true
        desbloquearAudio()
      }
    }
    window.addEventListener('pointerdown', onGesture)
    window.addEventListener('click', onGesture)
    return () => {
      window.removeEventListener('pointerdown', onGesture)
      window.removeEventListener('click', onGesture)
    }
  }, [])

  const preview = useMemo(() => {
    if (finalizada || modo !== 'ninguno' || !hoverId) return null
    const hu = estado.unidades.find(u => u.id === hoverId)
    if (!hu) return null
    if (hu.jugador !== activo) {
      // US-094 — amenaza de un rival: hexes dentro de su rango actual con LoS
      // despejada. Presentacional: se deriva con primitivos del motor
      // (hexEnRadio + hayLoS), nunca reimplementando las reglas de ataque.
      const perfil = ARQUETIPOS[hu.arquetipo]
      const amenazas = new Set()
      const origenKey = hexKey(hu.pos)
      for (const h of hexEnRadio(hu.pos, perfil.rango)) {
        const key = hexKey(h)
        if (key === origenKey) continue
        if (estado.tablero.bloqueados.includes(key)) continue
        if (hayLoS(estado, hu.pos, h)) amenazas.add(key)
      }
      return { amenazas }
    }
    if (hu.activacionCerrada) return null
    return {
      moviles: new Set(hexesMovibles(estado, hoverId).map(hexKey)),
      objetivos: new Set(objetivosAtaque(estado, hoverId).map(t => t.id)),
    }
  }, [finalizada, modo, hoverId, activo, estado])

  const onJugarOrden = () => {
    if (cartaSel == null) return
    despachar({ tipo: 'JUGAR_CARTA', jugador: activo, indiceCarta: cartaSel })
    setCartaSel(null)
  }

  // D-27 (US-163): cambia el uso de la carta de Orden a Habilidad y entra en el
  // modo de selección de origen/objetivo (ver rawOnUnitClick).
  // Si la habilidad tiene seleccionDirecta, se salta la selección de origen.
  const onJugarHabilidad = () => {
    if (cartaSel == null || !estado.reglas.habilitarHabilidadesCarta) return
    const carta = jugadorActivo.mano[cartaSel]
    const hab = carta?.habilidad
    const directa = !!hab?.seleccionDirecta
    setHabilidadSel({ indiceCarta: cartaSel, origenId: null, directa })
    setCartaSel(null)
    setModo('habilidad')
  }

  const onConcentrar = (elemento) => {
    if (!unidad) return
    despachar({ tipo: 'CONCENTRARSE', jugador: activo, unidadId: unidad.id, elemento })
    setModo('ninguno')
  }

  const confirmarAtaque = () => {
    if (!prepAtaque || !unidad) return
    const intencion = {
      tipo: 'ATACAR', jugador: activo, atacante: unidad.id, objetivo: prepAtaque.objetivo,
    }
    if (prepAtaque.tecnica) {
      intencion.tecnica = prepAtaque.tecnica
      const item = tecAtaque.find(t => t.id === prepAtaque.tecnica)
      if (item?.cartaIndice != null) intencion.cartaIndice = item.cartaIndice
      if (prepAtaque.tecnica === 'DobleTiro') {
        intencion.segundoObjetivo = prepAtaque.segundo
      }
    }
    despachar(intencion)
    setPrepAtaque(null)
    setModo('ninguno')
    setRepetirSel([])
  }

  const onTerminarTurno = () => {
    // Si el auto-pase ya está armado, el clic manual lo cancela para no
    // despachar TERMINAR_TURNO dos veces (el segundo sería rechazado por el
    // motor como "no es el turno activo").
    if (autoPasarRef.current) {
      clearTimeout(autoPasarRef.current)
      autoPasarRef.current = null
    }
    const poSinGastar = totalPO(jugadorActivo)
    if (poSinGastar > 0 &&
        !window.confirm(`Terminar el turno y perder ${poSinGastar} PO sin gastar?`)) {
      return
    }
    despachar({ tipo: 'TERMINAR_TURNO', jugador: activo })
    setUnidadSel(null)
    setCartaSel(null)
    setHabilidadSel(null)
    setModo('ninguno')
    setPrepAtaque(null)
  }

  const poElem = poPorElemento(jugadorActivo)
  const elementosDisponibles = Object.entries(poElem).filter(([, n]) => n > 0)

  const requiereSegundo = prepAtaque?.tecnica === 'DobleTiro'
  const segundoDef = prepAtaque?.segundo
    ? estado.unidades.find(u => u.id === prepAtaque.segundo)
    : null
  const puedeConfirmar = prepAtaque && (!requiereSegundo || !!segundoDef)

  let hint = ''
  if (!finalizada) {
    if (!estado.cartaJugadaEsteTurno) {
      hint = jugadorActivo.mano.length > 0
        ? 'Juega la carta obligatoria para ganar PO'
        : 'Sin cartas: podés terminar el turno y cederlo'
    } else if (pendiente) {
      hint = 'Reflujo: elegí qué dados repetir'
    } else if (unidad && unidad.jugador !== activo) {
      hint = 'Unidad rival en foco: seleccioná una tuya para actuar'
    } else if (unidad) {
      hint = `Próxima acción cuesta ${costeProximaAccion(unidad, estado.reglas)} PO (escalado 1/2/3/5)`
    } else {
      hint = 'Seleccioná una unidad para ver sus acciones'
    }
  }

  if (pantalla === 'portada') {
    return (
      <Portada
        semilla={semilla}
        onSemilla={setSemilla}
        escenarios={ESCENARIOS}
        escenarioSel={escenarioSel}
        onEscenario={setEscenarioSel}
        faccionA={faccionA}
        onFaccionA={setFaccionA}
        faccionB={faccionB}
        onFaccionB={setFaccionB}
        modoSolitario={modoSolitario}
        onModoSolitario={setModoSolitario}
        onComenzar={comenzar}
      />
    )
  }

  return (
    <div
      className={`app${screenShake ? ` screen-shake-${screenShake}` : ''}`}
      onAnimationEnd={(e) => {
        if (e.animationName.startsWith('app-shake-')) setScreenShake(null)
      }}
    >
      {/* PASO 6 — sin barra superior: solo un badge mínimo de ronda/turno
          (arriba-izquierda) y los controles esenciales flotando arriba-derecha.
          Pura presentación; reglas en el motor. */}
      <div className="hud-flotante">
        <span className="hud-ronda-flotante">RONDA {estado.ronda}</span>
        <span className={`hud-turno-flotante ${activo}`}>
          {estado.ganador ? 'Partida terminada' : `Turno de ${activo}`}
        </span>
        {estado.tablero?.objetivos && (
          <span className="hud-estandartes-flotante">
            Estandartes · A: {estado.marcador?.A ?? 0} / B: {estado.marcador?.B ?? 0}
            {estado.reglas?.victoriaUmbral ? ` · meta ${estado.reglas.victoriaUmbral}` : ''}
          </span>
        )}
      </div>
      <div className="hud-acciones-flotantes">
        <button className="btn-fin-turno" onClick={onTerminarTurno} disabled={finalizada || !!pendiente}>
          Fin de turno
        </button>
        <button
          className="btn-reencuadrar"
          onClick={() => setResetCamaraTick(t => t + 1)}
          title="Reencuadrar tablero (zoom 100%)"
          aria-label="Reencuadrar tablero"
        >
          ⛶
        </button>
        <button
          className="btn-ajustes"
          onClick={() => setPanelAjustes(true)}
          title="Ajustes de playtest"
          aria-label="Ajustes de playtest"
        >
          ⚙
        </button>
      </div>

      {panelAjustes && (
        <DevModal
          onCerrar={() => setPanelAjustes(false)}
          semilla={semilla}
          onSemilla={setSemilla}
          escenarios={ESCENARIOS}
          escenarioSel={escenarioSel}
          onEscenario={setEscenarioSel}
          onReglas={() => { setPanelAjustes(false); setPanelReglas(p => !p) }}
          onSimular={() => { setPanelAjustes(false); setPanelSimulacion(s => !s) }}
          onExportar={exportar}
          onCargarRegistro={onCargarRegistro}
          onNueva={nuevaPartida}
          onCopiar={copiarReplay}
          copiado={copiadoReplay}
          esquematico={tableroEsquematico}
          onEsquematico={() => setTableroEsquematico(v => !v)}
          manoAMano={manoAMano}
          onManoAMano={() => setManoAMano(v => !v)}
          onHistorial={() => { setPanelAjustes(false); setPanelHistorial(true) }}
        />
      )}

      {replay && (
        <ReplayBar
          indice={indiceReplay}
          total={replay.secuencia.length}
          autoplay={autoplay}
          terminado={indiceReplay >= replay.secuencia.length}
          onPaso={pasoReplay}
          onAutoplay={() => setAutoplay(a => !a)}
          onSaltar={saltarReplay}
          onCerrar={cerrarReplay}
        />
      )}

      {!finalizada && (
        <div className={`banner-turno ${activo}`}>
          <span className="turno-letra">Juega {activo}</span>
          <span className="turno-hint">{hint}</span>
        </div>
      )}
      {cartelTurno && (
        <CartelTurno
          desde={cartelTurno.desde}
          hacia={cartelTurno.hacia}
          estado={estado}
          onCerrar={() => setCartelTurno(null)}
        />
      )}
      {handoff && (
        <HandoffTurno
          desde={handoff.desde}
          hacia={handoff.hacia}
          estado={estado}
          onContinuar={() => setHandoff(null)}
        />
      )}
      {ultimoResumen && (
        <div className="banner-evento" key={ultimoResumen.clave}>
          <strong>[{ultimoResumen.tipo}]</strong>{' '}
          {ultimoResumen.actor ? `${ultimoResumen.actor} — ` : ''}
          {ultimoResumen.descripcion}
        </div>
      )}

      {finalizada && (
        <div className="banner-ganador">
          <strong>Gana {estado.ganador.ganador}</strong>: {estado.ganador.motivo}
          <ChallengeShare estado={estado} />
          <button className="btn-nueva" onClick={nuevaPartida}>Nueva partida</button>
        </div>
      )}

      {mostrarOnboarding && !finalizada && (
        <Onboarding
          paso={onboardingPaso}
          onCerrar={() => { setMostrarOnboarding(false); marcarTutorialCompletado() }}
        />
      )}

      <main className="app-main">
        {/* Tablero a pantalla completa (PASO 5): sin laterales. La ficha de
            unidad flota abajo a la izquierda (solo unidades propias) y la
            mano de cartas abajo al centro, en abanico. Pura presentación. */}
        <section className="zone tablero">
          <Board
            estado={estado}
            moviles={movilesSet}
            rango={rangoSet}
            objetivosIds={objetivosSet}
            segundosIds={segundosSet}
            origenesIds={origenesSet}
            objetivoHabIds={objetivoHabSet}
            unidadSeleccionadaId={unidadSel}
            previewMoviles={preview?.moviles}
            previewObjetivos={preview?.objetivos}
            amenazas={preview?.amenazas}
            captura={capturaSet}
            acciones={acciones}
            costeProxima={costeProx}
            poDisponibles={poActivo}
            flashIds={flashIds}
            retrocesoIds={retrocesoIds}
            modo={modo}
            hoverId={hoverId}
            onHexClick={onHexClick}
            onUnitClick={onUnitClick}
            onHover={onHover}
            onHoverEnd={onHoverEnd}
            onFlashEnd={onFlashEnd}
            onRetrocesoEnd={onRetrocesoEnd}
            esquematico={tableroEsquematico}
            resetCamaraTick={resetCamaraTick}
          />
        </section>

        {unidadFicha && (
          <UnitCard
            estado={estado}
            unidad={unidadFicha}
            rivalSeleccionada={rivalSeleccionada}
            costeProxima={
              unidadSel === unidadFicha.id && !finalizada && !unidadFicha.activacionCerrada
                ? costeProximaAccion(unidadFicha, estado.reglas)
                : null
            }
            esTurnoDe={unidadFicha.jugador === activo}
            acciones={acciones}
            tecnicasDefensa={tecDefensa}
            log={estado.log}
            onCerrar={() => setUnidadSel(null)}
          />
        )}

        {/* Mano de cartas: abanico inferior centrado sobre el tablero. El hover
            eleva la carta y muestra arte, coste y descripción (preview puro);
            el click marca la carta y abre el menú de acción (abajo). */}
        <HandPanel
          jugador={jugadorActivo}
          activo
          cartaJugada={estado.cartaJugadaEsteTurno}
          cartaSeleccionada={cartaSel}
          onCartaClick={onCartaClick}
        />
      </main>

      {/* Menú de acción de la carta seleccionada: backdrop + popover. Se cierra
          con Escape, tocando el backdrop o al jugar la carta. Pura presentación
          (D-27/arranque), las reglas viven en el motor. */}
      {cartaSel != null && !finalizada && !estado.cartaJugadaEsteTurno && (
        <CartaActionMenu
          carta={jugadorActivo.mano[cartaSel]}
          faccion={jugadorActivo.faccion}
          habilitarHabilidades={!!estado.reglas.habilitarHabilidadesCarta}
          onJugarOrden={onJugarOrden}
          onJugarHabilidad={onJugarHabilidad}
          onCerrar={() => setCartaSel(null)}
        />
      )}

      {modo === 'concentrar' && unidad && !finalizada && (
        <div className="panel-flotante">
          <strong>Concentrarse: {unidad.id}</strong> — el siguiente token cuesta{' '}
          {costeSiguienteToken(unidad)} PO
          <div className="picker-elementos">
            {elementosDisponibles.length === 0 && <span className="acc-motivo">Sin PO disponibles</span>}
            {elementosDisponibles.map(([elem, n]) => (
              <button key={elem} className="btn-elemento" onClick={() => onConcentrar(elem)}>
                {simboloElemento(elem)} {elem} ({n})
              </button>
            ))}
          </div>
          <button className="btn-cancelar" onClick={() => setModo('ninguno')}>Cancelar</button>
        </div>
      )}

      {modo === 'habilidad' && habilidadSel && !finalizada && (
        <div className="panel-flotante">
          <strong>
            {cartaHabilidad?.habilidad?.nombre || cartaHabilidad?.elemento}{' '}
            {cartaHabilidad?.valor} ·{' '}
            {habilidadSel.directa
              ? 'toca un objetivo'
              : habilidadSel.origenId
                ? 'elige un objetivo'
                : 'elige un origen'}
          </strong>
          {habilidadSel.directa ? (
            <span className="acc-motivo">
              Tocá la unidad {cartaHabilidad?.habilidad?.objetivo === 'aliado' ? 'aliada' : 'enemiga'} para usar {cartaHabilidad?.habilidad?.nombre}
            </span>
          ) : habilidadSel.origenId ? (
            <span className="acc-motivo">
              Origen: {habilidadSel.origenId} — pulsa un objetivo
            </span>
          ) : (
            <span className="acc-motivo">
              Pulsa una unidad aliada como origen
            </span>
          )}
          <button
            className="btn-cancelar"
            onClick={() => { setHabilidadSel(null); setModo('ninguno') }}
          >
            Cancelar
          </button>
        </div>
      )}

      {prepAtaque && unidad && !finalizada && (
        <div className="panel-flotante">
          <div className="conf-head">
            <strong>Declarar ataque:</strong> {unidad.id} →{' '}
            {estado.unidades.find(u => u.id === prepAtaque.objetivo)?.id}
          </div>
          <TechniquePicker
            tecnicas={tecAtaque}
            seleccionada={prepAtaque.tecnica}
            onSeleccionar={(id) => setPrepAtaque(prev => ({ ...prev, tecnica: id, segundo: null }))}
            requiereSegundo={requiereSegundo}
            segundoOk={!!segundoDef}
            segundoNombre={segundoDef?.id}
            foco={unidad.foco || []}
          />
          <div className="conf-acciones">
            <button className="btn-jugar" disabled={!puedeConfirmar} onClick={confirmarAtaque}>
              Confirmar ataque
            </button>
            <button className="btn-cancelar" onClick={() => { setPrepAtaque(null); setModo('ninguno') }}>
              Cancelar
            </button>
          </div>
        </div>
      )}

      {pendiente && !finalizada && (
        <div className="panel-flotante">
          <div className="conf-head">
            <strong>Reflujo (D-16):</strong> {pendiente.atacanteId} tiró{' '}
            {pendiente.atqPoolFinal.dados}g{pendiente.atqPoolFinal.keep} contra {pendiente.objetivoId}
            — elegí qué dados repetir
          </div>
          <div className="reflujo-dados">
            {pendiente.atq.dadosTirados.map((d, i) => (
              <label key={i} className={`reflujo-dado${repetirSel.includes(i) ? ' seleccionado' : ''}`}>
                <input
                  type="checkbox"
                  checked={repetirSel.includes(i)}
                  onChange={() => setRepetirSel(prev =>
                    prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i]
                  )}
                />
                <span>{d.valores.join('+')}</span>
              </label>
            ))}
          </div>
          <div className="conf-acciones">
            <button
              className="btn-jugar"
              onClick={() => {
                despachar({ tipo: 'REFLEJAR_DADOS', jugador: activo, dadosARepetir: repetirSel })
                setRepetirSel([])
              }}
            >
              Repetir {repetirSel.length > 0 ? `(${repetirSel.length})` : 'los elegidos'}
            </button>
            <button
              className="btn-cancelar"
              onClick={() => {
                despachar({ tipo: 'REFLEJAR_DADOS', jugador: activo, dadosARepetir: [] })
                setRepetirSel([])
              }}
            >
              No repetir nada
            </button>
          </div>
        </div>
      )}

      {panelReglas && !finalizada && (
        <SettingsPanel estado={estado} onCambiarReglas={onCambiarReglas} />
      )}

      {panelSimulacion && (
        <SimulationPanel onClose={() => setPanelSimulacion(false)} />
      )}

      {combate && (
        <CombatResult detalle={combate} estado={estado} onCerrar={() => setCombate(null)} />
      )}

      <HistorialPanel visible={panelHistorial} onCerrar={() => setPanelHistorial(false)} />

      <DescubrimientoPopup
        tecnica={descubrimientoTecnica}
        onCerrar={() => setDescubrimientoTecnica(null)}
      />
    </div>
  )
}
