import React, { memo, useCallback, useEffect, useRef, useState } from 'react'
import { generarTableroHex, generarTableroRect, dentroDeForma, hexKey, aPixel, linea, hayLoS, verticesHex } from '../engine/hex.js'
import HexTile from './HexTile.jsx'
import UnitToken from './UnitToken.jsx'
import UnitContextMenu from './UnitContextMenu.jsx'
import CombatFeedback from './CombatFeedback.jsx'
import { terrenoDe, terrenoEscena, radioHex } from './terreno.js'
import { TERRENOS, tono, OCEANO_PROFUNDO, DecorSuelo, DecorAlto } from './terrenoVisual.jsx'
import { faccionDeJugador } from './adapter.js'

// Polígono de clip del <image> de arte de tile (hexágono completo centrado en su
// origen). HexTile traduce cada imagen al centro de su hex antes de recortar, de
// modo que este clip vale para los 150 tiles. No altera el conteo de <polygon>.
const CLIP_PUNTOS = verticesHex(30).map(v => `${v.x},${v.y}`).join(' ')

// Escala del decorado alto (árboles/montañas/columnas): amplía la sobresalida
// hacia el hex de arriba. El mundo exterior escala más que la isla jugable para
// dar el "bosque que tapa a la unidad de atrás" sin tapar la información.
const ESCALA_ALTO_PLAYABLE = 1.7
const ESCALA_ALTO_MUNDO = 2.0

// Presentación (12/08/2026): ocultar el "mundo" (isla + océano) que rodea al
// tablero jugable. El mapa queda sobre un piso plano oscuro (fondo-tablero),
// máximo foco en los hexes jugables. Pura estética: el motor no cambia. Revertir
// = poner false (la isla inmersiva de UI-04 vuelve a dibujarse).
const OCULTAR_MUNDO = true

// Ruta de un hex de escenario (MUNDO). Siempre <path>, NUNCA <polygon>: así no
// rompe el invariante de test "150 .hex-tile polygon" y el escenario no lleva la
// clase .hex-tile (no es jugable).
function rutaHexPath(cx, cy, radio = 30) {
  const pts = verticesHex(radio).map(v => `${(cx + v.x).toFixed(1)},${(cy + v.y).toFixed(1)}`)
  return `M${pts.join(' L')} Z`
}

// ═══ MUNDO de fondo (escena que rodea al tablero jugable) ═══════════════
// Pura presentación, determinista por semilla. memo: solo se re-renderiza si la
// semilla o el viewBox cambian (el juego no lo toca en cada acción). Pintado
// top-down estilo Fire Emblem: relleno plano de paleta + decorado; la grilla es
// un trazo muy liviano (overlay sobre el mundo, no un tablero cerrado).
const CapaMundo = memo(function CapaMundo({ semilla, forma, qr, vb }) {
  // Radio de generación pensado para la cámara (M3g): con pan/zoom el encuadre
  // puede revelar hasta ~un viewBox completo más allá del tablero, así que el
  // mundo se genera con el diagonal completo (hypot de w y h) y margen.
  const R = Math.max(9, Math.ceil(Math.hypot(vb.w, vb.h) / 52) + 2)
  const hexes = generarTableroHex(R)
  const radioMundo = Math.max(qr.rMax, Math.abs(qr.rMin), Math.abs(qr.qMin), Math.abs(qr.qMax)) + 2
  const items = []
  for (const h of hexes) {
    if (dentroDeForma(forma, h)) continue
    const c = aPixel(h, 30)
    const key = hexKey(h)
    const terreno = terrenoEscena(h.q, h.r, semilla, radioMundo)
    // Balance del océano (M3g): el agua lejos de la isla se oscurece y queda
    // calma (sin olas ni reflejos) para que la isla lea como continente; el
    // agua somera costera conserva su brillo y ondas. Solo presentación.
    const d = radioHex(h.q, h.r)
    const profundo = terreno === 'agua' && d > radioMundo + 2
    const paleta = profundo
      ? OCEANO_PROFUNDO
      : (TERRENOS[terreno] || TERRENOS.prado).fill
    items.push(
      <path
        key={key}
        d={rutaHexPath(c.x, c.y)}
        fill={tono(paleta, h.q, h.r)}
        stroke="rgba(8,16,8,0.10)"
        strokeWidth="0.5"
        pointerEvents="none"
      />
    )
    if (!profundo) items.push(<DecorSuelo key={`s-${key}`} tipo={terreno} q={h.q} r={h.r} cx={c.x} cy={c.y} />)
    // El decorado alto del "frente" (filas al sur del tablero) lo dibuja
    // CapaFrente DESPUÉS de las unidades para ocluir el borde de la isla; el
    // resto (filas traseras) se dibuja acá, detrás de todo.
    const enFrente = h.r >= qr.rMax - 2 && h.r <= qr.rMax + 2 &&
      h.q >= qr.qMin - 3 && h.q <= qr.qMax + 3
    if (!enFrente) {
      const alto = (
        <DecorAlto tipo={terreno} q={h.q} r={h.r} cx={c.x} cy={c.y} escala={ESCALA_ALTO_MUNDO} />
      )
      if (alto) items.push(<g key={`a-${key}`}>{alto}</g>)
    }
  }
  return <g className="capa-mundo">{items}</g>
})

// ═══ Capa frontal del mundo: decorado alto de los hexes de escenario que quedan
// en frente del tablero (r >= -radio). Se dibuja DESPUÉS de las unidades para el
// efecto de profundidad "un árbol de la fila delantera tapa parcialmente a la
// unidad de atrás", con pointerEvents none (nunca intercepta la interacción).
const CapaFrente = memo(function CapaFrente({ semilla, forma, qr }) {
  const R = Math.max(qr.rMax + 6, Math.abs(qr.rMin) + 6)
  const hexes = generarTableroHex(R)
  const items = []
  for (const h of hexes) {
    if (dentroDeForma(forma, h)) continue
    if (h.r < qr.rMax - 2 || h.r > qr.rMax + 2) continue
    if (h.q < qr.qMin - 3 || h.q > qr.qMax + 3) continue
    const c = aPixel(h, 30)
    const terreno = terrenoEscena(h.q, h.r, semilla, Math.max(qr.rMax, Math.abs(qr.rMin)) + 2)
    const alto = (
      <DecorAlto tipo={terreno} q={h.q} r={h.r} cx={c.x} cy={c.y} escala={ESCALA_ALTO_MUNDO} />
    )
    if (!alto) continue
    items.push(<g key={hexKey(h)}>{alto}</g>)
  }
  return <g className="capa-frente">{items}</g>
})

// viewBox adaptado al aspect del contenedor (el mundo lo cubre con slice). El
// tablero jugable queda centrado y siempre visible; lo que se recorta en
// aspectos extremos es el borde del mundo, nunca la isla.
function useViewBox() {
  const ref = useRef(null)
  const [vb, setVb] = useState(() => ({ w: 720, h: 640 }))
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const medir = () => {
const rect = el.getBoundingClientRect()
    if (rect.width > 0 && rect.height > 0) {
      const aspect = rect.width / rect.height
      const h = 640
      const w = Math.max(720, Math.min(1250, aspect * h))
      setVb(prev => (prev.w === w && prev.h === h ? prev : { w, h }))
      }
    }
    medir()
    if (typeof ResizeObserver !== 'undefined') {
      const ro = new ResizeObserver(medir)
      ro.observe(el)
      return () => ro.disconnect()
    }
    window.addEventListener('resize', medir)
    return () => window.removeEventListener('resize', medir)
  }, [])
  return { ref, vb }
}

export default function Board({
  estado,
  moviles,
  rango,
  objetivosIds,
  segundosIds,
  origenesIds,
  objetivoHabIds,
  unidadSeleccionadaId,
  previewMoviles,
  previewObjetivos,
  amenazas,
  captura,
  acciones,
  costeProxima,
  poDisponibles,
  flashIds,
  retrocesoIds,
  modo,
  hoverId,
  onHexClick,
  onUnitClick,
  onHover,
  onHoverEnd,
  onFlashEnd,
  onRetrocesoEnd,
  esquematico = false,
  resetCamaraTick = 0,
}) {
  const semilla = estado?.semilla || 'playtest-01'
  const { ref } = useViewBox()
  // Hexes del tablero jugable según la forma del escenario (dato de estado).
  const forma = estado?.tablero?.forma || null
  const hexs = forma?.tipo === 'rect'
    ? generarTableroRect(forma.columnas, forma.filas)
    : generarTableroHex(estado?.tablero?.radio || 4)
  // Bbox en píxeles del tablero jugable + límites axiales (para el mundo).
  let xMin = Infinity, xMax = -Infinity, yMin = Infinity, yMax = -Infinity
  const qr = { qMin: Infinity, qMax: -Infinity, rMin: Infinity, rMax: -Infinity }
  for (const h of hexs) {
    const c = aPixel(h, 30)
    if (c.x < xMin) xMin = c.x
    if (c.x > xMax) xMax = c.x
    if (c.y < yMin) yMin = c.y
    if (c.y > yMax) yMax = c.y
    if (h.q < qr.qMin) qr.qMin = h.q
    if (h.q > qr.qMax) qr.qMax = h.q
    if (h.r < qr.rMin) qr.rMin = h.r
    if (h.r > qr.rMax) qr.rMax = h.r
  }
  const PAD = 70
  const bx = xMin - PAD
  const by = yMin - PAD
  const bw = (xMax - xMin) + 2 * PAD
  const bh = (yMax - yMin) + 2 * PAD
  const viewBox = `${bx} ${by} ${bw} ${bh}`
  const bloqueados = new Set(estado?.tablero?.bloqueados || [])
  // Matriz de biomas del escenario (plantillas): fuente de verdad visual del
  // terreno. El escenario base no la trae (terreno por semilla). Presentación.
  const mapaTerreno = estado?.tablero?.terreno || null
  // D-26: hexes de Lugar (santuario). Al capturarse pasan a bloqueados y el
  // terreno cae a 'bloqueado' — el marcador desaparece solo.
  const lugaresSet = new Set((estado?.tablero?.lugares || []).map(hexKey))
  const capturaSet = captura || new Set()
  const unidades = estado?.unidades || []
  const movilesSet = moviles || new Set()
  const rangoSet = rango || new Set()
  const previewM = previewMoviles || new Set()
  const previewO = previewObjetivos || new Set()
  const amenazasSet = amenazas || new Set()
  const flashes = flashIds || new Set()
  const retrocesos = retrocesoIds || new Set()
  const seleccionada = unidades.find(x => x.id === unidadSeleccionadaId)

  // ═══ Cámara móvil (pan & zoom) ════════════════════════════════════════
  // Pura presentación: un <g transform> mueve mundo+tablero+overlays anclados y
  // deja fijos el vignette, el fondo y el HUD (HTML). No toca reglas ni
  // determinismo: solo transforma coordenadas visuales. `cam = null` = default
  // (centro del tablero a zoom 1.4), recalculado en cada render desde el bbox.
  // Encaje de la cámara: z=1 equivale a 100% del viewBox (el tablero + margen
  // PAD llena el contenedor con "slice", recortando el lado corto). Para ver el
  // tablero completo con margen el default baja de 1; ZOOM_MIN permite alejar
  // bastante para encuadrar el mapa entero en pantallas chicas.
  const ZOOM_DEFECTO = 0.85
  const ZOOM_MIN = 0.35
  const ZOOM_MAX = 2.5
  const centroX = (xMin + xMax) / 2
  const centroY = (yMin + yMax) / 2
  const [cam, setCam] = useState(null)
  const [arrastrando, setArrastrando] = useState(false)
  const svgRef = useRef(null)
  const camRef = useRef(null)
  const animRef = useRef(null)
  const panRef = useRef(null)
  const geometriaRef = useRef({ bx, by, bw, bh, xMin, xMax, yMin, yMax, centroX, centroY })
  geometriaRef.current = { bx, by, bw, bh, xMin, xMax, yMin, yMax, centroX, centroY }
  const camEfectivo = cam || { z: ZOOM_DEFECTO, x: centroX, y: centroY }
  // Refs espejo del valor más reciente (la cámara efectiva y las unidades) para
  // que los efectos lean datos frescos sin re-suscribirse por render (unidades
  // es una referencia nueva en cada render y re-arrancaría la animación).
  const unidadesRef = useRef(unidades)
  useEffect(() => {
    camRef.current = camEfectivo
    unidadesRef.current = unidades
  })

  // Clamp del centro para que el tablero nunca salga del encuadre del todo.
  const clampCam = useCallback((x, y, z) => {
    const g = geometriaRef.current
    return {
      z,
      x: Math.max(g.xMin - (g.bw / 2) / z, Math.min(g.xMax + (g.bw / 2) / z, x)),
      y: Math.max(g.yMin - (g.bh / 2) / z, Math.min(g.yMax + (g.bh / 2) / z, y)),
    }
  }, [])

  const cancelarAnim = useCallback(() => {
    if (animRef.current) cancelAnimationFrame(animRef.current)
    animRef.current = null
  }, [])

  // Punto del cliente → espacio del viewBox (inverso de preserveAspectRatio
  // "xMidYMid slice"). Base para el zoom al cursor.
  const pantallaALogico = useCallback((clienteX, clienteY) => {
    const svg = svgRef.current
    const g = geometriaRef.current
    if (!svg) return null
    const r = svg.getBoundingClientRect()
    if (r.width === 0 || r.height === 0) return null
    const s = Math.min(r.width / g.bw, r.height / g.bh)
    const ox = r.left + (r.width - g.bw * s) / 2
    const oy = r.top + (r.height - g.bh * s) / 2
    return { x: g.bx + (clienteX - ox) / s, y: g.by + (clienteY - oy) / s }
  }, [])

  // Reset de cámara: botón de reencuadre (App sube resetCamaraTick) → encuadre
  // completo del tablero a zoom 100%. Nueva partida también lo sube.
  useEffect(() => {
    cancelarAnim()
    setCam(null)
  }, [resetCamaraTick, cancelarAnim])

  // Centro suave en la unidad seleccionada (easeOutCubic ~320ms). Solo al
  // seleccionar; pan/zoom manual la cancelan. Animación de UI, no reglas.
  useEffect(() => {
    if (!unidadSeleccionadaId) return
    const u = unidadesRef.current.find(x => x.id === unidadSeleccionadaId)
    if (!u) return
    const destino = aPixel(u.pos, 30)
    const origen = camRef.current
    const z = origen.z
    const duracion = 320
    const t0 = performance.now()
    const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3)
    cancelarAnim()
    const paso = (ahora) => {
      const p = Math.min(1, (ahora - t0) / duracion)
      const e = easeOutCubic(p)
      setCam(clampCam(
        origen.x + (destino.x - origen.x) * e,
        origen.y + (destino.y - origen.y) * e,
        z,
      ))
      if (p < 1) animRef.current = requestAnimationFrame(paso)
      else animRef.current = null
    }
    animRef.current = requestAnimationFrame(paso)
    return cancelarAnim
  }, [unidadSeleccionadaId, clampCam, cancelarAnim])

  // Zoom con la rueda: listener nativo no-pasivo (preventDefault funciona) y
  // zoom centrado en el cursor.
  useEffect(() => {
    const svg = svgRef.current
    if (!svg) return
    const onWheel = (e) => {
      e.preventDefault()
      cancelarAnim()
      const L = pantallaALogico(e.clientX, e.clientY)
      if (!L) return
      const prev = camRef.current
      const z = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, prev.z * Math.exp(-e.deltaY * 0.0012)))
      if (z === prev.z) return
      // Mantener el punto bajo el cursor fijo: deshacer transform, re-aplicar.
      const g = geometriaRef.current
      const tX = g.bx + g.bw / 2 - prev.x * prev.z
      const tY = g.by + g.bh / 2 - prev.y * prev.z
      const pX = (L.x - tX) / prev.z
      const pY = (L.y - tY) / prev.z
      const nX = (g.bx + g.bw / 2 - (L.x - pX * z)) / z
      const nY = (g.by + g.bh / 2 - (L.y - pY * z)) / z
      setCam(clampCam(nX, nY, z))
    }
    svg.addEventListener('wheel', onWheel, { passive: false })
    return () => svg.removeEventListener('wheel', onWheel)
  }, [cancelarAnim, clampCam, pantallaALogico])

  // Pan con botón derecho o medio (arrastrar el mapa). El izquierdo sigue
  // siendo selección; el menú contextual del navegador se suprime.
  useEffect(() => {
    const svg = svgRef.current
    if (!svg) return
    const onPointerDown = (e) => {
      if (e.button !== 1 && e.button !== 2) return
      e.preventDefault()
      cancelarAnim()
      const prev = camRef.current
      svg.setPointerCapture(e.pointerId)
      panRef.current = { id: e.pointerId, x: e.clientX, y: e.clientY, cam: prev, z: prev.z }
      setArrastrando(true)
    }
    const onPointerMove = (e) => {
      const p = panRef.current
      if (!p || p.id !== e.pointerId) return
      const g = geometriaRef.current
      const r = svg.getBoundingClientRect()
      if (r.width === 0 || r.height === 0) return
      const s = Math.min(r.width / g.bw, r.height / g.bh)
      const dx = (e.clientX - p.x) / (s * p.z)
      const dy = (e.clientY - p.y) / (s * p.z)
      setCam(clampCam(p.cam.x - dx, p.cam.y - dy, p.z))
    }
    const onPointerUp = (e) => {
      if (!panRef.current || panRef.current.id !== e.pointerId) return
      panRef.current = null
      setArrastrando(false)
      if (svg.hasPointerCapture(e.pointerId)) svg.releasePointerCapture(e.pointerId)
    }
    const onContextMenu = (e) => e.preventDefault()
    svg.addEventListener('pointerdown', onPointerDown)
    svg.addEventListener('pointermove', onPointerMove)
    svg.addEventListener('pointerup', onPointerUp)
    svg.addEventListener('pointercancel', onPointerUp)
    svg.addEventListener('contextmenu', onContextMenu)
    return () => {
      svg.removeEventListener('pointerdown', onPointerDown)
      svg.removeEventListener('pointermove', onPointerMove)
      svg.removeEventListener('pointerup', onPointerUp)
      svg.removeEventListener('pointercancel', onPointerUp)
      svg.removeEventListener('contextmenu', onContextMenu)
    }
  }, [cancelarAnim, clampCam])

  const unidadEn = new Map()
  for (const u of unidades) {
    unidadEn.set(hexKey(u.pos), u)
  }

  const terrenoDeHex = (key, h) =>
    lugaresSet.has(key) && !bloqueados.has(key)
      ? 'lugar'
      : terrenoDe(h.q, h.r, semilla, bloqueados.has(key), true, mapaTerreno)

  const estadoHex = (key) => {
    const u = unidadEn.get(key)
    if (u && segundosIds?.has(u.id)) return 'objetivo2'
    if (u && objetivosIds?.has(u.id)) return 'objetivo'
    if (u && origenesIds?.has(u.id)) return 'canalizador'
    if (u && objetivoHabIds?.has(u.id)) return 'objetivo-hab'
    if (bloqueados.has(key)) return 'bloqueado'
    if (capturaSet.has(key)) return 'captura'
    if (seleccionada && key === hexKey(seleccionada.pos)) return 'seleccionado'
    if (rangoSet.has(key)) return 'rango'
    if (movilesSet.has(key)) return 'alcanzable'
    if (previewM.has(key)) return 'preview'
    if (amenazasSet.has(key)) return 'amenaza'
    return 'normal'
  }

  // Línea de visión: al apuntar un rival en modo ataque, dibujar el trazo real
  // que calcula el motor (linea + hayLoS). Es presentación, no una regla.
  let loS = null
  if (modo === 'atacar' && seleccionada) {
    const hover = hoverId ? unidades.find(u => u.id === hoverId) : null
    if (hover && hover.jugador !== seleccionada.jugador) {
      const puntos = linea(seleccionada.pos, hover.pos)
      loS = {
        d: puntos.map(p => {
          const c = aPixel(p, 30)
          return `${c.x},${c.y}`
        }).join(' '),
        despejada: hayLoS(estado, seleccionada.pos, hover.pos),
        destino: hover.pos,
      }
    }
  }

  // PASO 3 + UI-04 — profundidad por painter's algorithm dentro de la isla: los
  // hexes jugables con decorado alto (bosque/montaña/ruina) y las unidades se
  // mezclan ordenados por r (atrás → adelante), de modo que un árbol de una fila
  // delantera tapa parcialmente a la unidad de atrás. La capa de datos de cada
  // token (anillo, vida, Foco, estados) se repinta después en UnitToken sobre su
  // sprite, así la oclusión nunca esconde información de playtest.
  const playableDecor = []
  if (!esquematico) {
    for (const h of hexs) {
      const key = hexKey(h)
      const terreno = terrenoDeHex(key, h)
      const c = aPixel(h, 30)
      const alto = (
        <DecorAlto tipo={terreno} q={h.q} r={h.r} cx={c.x} cy={c.y} escala={ESCALA_ALTO_PLAYABLE} />
      )
      if (alto) playableDecor.push({ r: h.r, q: h.q, k: `dec-${key}`, orden: 0, node: alto })
    }
  }
  const profundidad = [
    ...playableDecor,
    ...unidades.map(u => ({
      r: u.pos.r, q: u.pos.q, k: u.id, orden: 1,
      node: (
        <UnitToken
          unidad={u}
          faccion={faccionDeJugador(u.jugador, estado)}
          turnoActivo={estado?.turnoDe}
          seleccionado={unidadSeleccionadaId === u.id}
          objetivo={objetivosIds?.has(u.id)}
          segundo={segundosIds?.has(u.id)}
          origen={origenesIds?.has(u.id)}
          objetivoHab={objetivoHabIds?.has(u.id)}
          previewObjetivo={previewO.has(u.id)}
          flashing={flashes.has(u.id)}
          retroceso={retrocesos.has(u.id)}
          onClick={onUnitClick}
          onHover={onHover}
          onHoverEnd={onHoverEnd}
          onFlashEnd={onFlashEnd}
          onRetrocesoEnd={onRetrocesoEnd}
        />
      ),
    })),
  ].sort((a, b) => a.r - b.r || a.q - b.q || a.orden - b.orden)

  // Transform de cámara: el punto `camEfectivo` (centro en coordenadas de
  // tablero) se dibuja en el centro del viewBox. El resto del <svg> (vignette,
  // fondo esquemático) no entra en el grupo y queda fijo en pantalla.
  const tX = bx + bw / 2 - camEfectivo.x * camEfectivo.z
  const tY = by + bh / 2 - camEfectivo.y * camEfectivo.z
  const camaraTransform = `translate(${tX} ${tY}) scale(${camEfectivo.z})`

  return (
    <div className={`board-container${arrastrando ? ' arrastrando' : ''}`} ref={ref}>
      <svg
        ref={svgRef}
        width="100%"
        height="100%"
        viewBox={viewBox}
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <clipPath id="hex-clip">
            <polygon points={CLIP_PUNTOS} />
          </clipPath>
          {/* Vignette de foco: caída hacia los bordes del encuadre para
            concentrar la mirada en la isla. Luz cenital suave arriba para dar
            profundidad. Solo presentación. */}
          <radialGradient id="vineta" cx="0.5" cy="0.5" r="0.72">
            <stop offset="45%" stopColor="#000000" stopOpacity="0" />
            <stop offset="80%" stopColor="#000000" stopOpacity="0.16" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0.48" />
          </radialGradient>
          <linearGradient id="luz-cenital" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#fff3d6" stopOpacity="0.08" />
            <stop offset="35%" stopColor="#fff3d6" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Piso plano detrás del tablero (antes solo en modo esquemático): con el
          mundo oculto (OCULTAR_MUNDO) el mapa descansa sobre una losa oscura.
          Fijo en espacio de pantalla (fuera de la cámara). */}
        <rect
          className="fondo-tablero"
          x={bx}
          y={by}
          width={bw}
          height={bh}
          pointerEvents="none"
        />

        {/* Grupo de cámara: mundo + tablero + overlays anclados. Solo
          transformación visual; la interacción sigue mapeando igual (SVG
          resuelve las coordenadas bajo el transform). */}
        <g transform={camaraTransform}>
        {!OCULTAR_MUNDO && !esquematico && <CapaMundo semilla={semilla} forma={forma} qr={qr} vb={{ w: bw, h: bh }} />}

        {hexs.map(hex => {
          const key = hexKey(hex)
          return (
            <HexTile
              key={key}
              q={hex.q}
              r={hex.r}
              terreno={terrenoDeHex(key, hex)}
              estado={estadoHex(key)}
              onClick={onHexClick}
              esquematico={esquematico}
            />
          )
        })}

        {modo === 'mover' && seleccionada && (
          hexs.map(h => {
            const key = hexKey(h)
            if (!movilesSet.has(key) || unidadEn.has(key)) return null
            const c = aPixel(h, 30)
            const o = aPixel(seleccionada.pos, 30)
            const dx = c.x - o.x
            const dy = c.y - o.y
            const len = Math.hypot(dx, dy) || 1
            const ux = dx / len
            const uy = dy / len
            const ax = c.x - ux * 4
            const ay = c.y - uy * 4
            const p1 = `${ax - uy * 3},${ay + ux * 3}`
            const p2 = `${ax + uy * 3},${ay - ux * 3}`
            return (
              <path
                key={`flecha-${key}`}
                d={`M${c.x},${c.y} L${p1} L${p2} Z`}
                fill="rgba(127,212,240,0.85)"
                stroke="rgba(20,40,60,0.6)"
                strokeWidth="0.6"
                pointerEvents="none"
              />
            )
          })
        )}

        {unidades.filter(u => u.arquetipo === 'Rey').map(u => {
          const c = aPixel(u.pos, 30)
          return (
            <circle
              key={`rey-ring-${u.id}`}
              className="rey-ring"
              cx={c.x}
              cy={c.y}
              r={23}
              pointerEvents="none"
            />
          )
        })}

        {/* Unidades + decorado alto de la isla, mezclados por profundidad. */}
        <g>{profundidad.map(x => <g key={x.k}>{x.node}</g>)}</g>

        {/* Decorado alto del frente del mundo: ocluye el borde de la isla. Solo
          en modo inmersivo y con el mundo visible; el esquemático no dibuja decorado. */}
        {!OCULTAR_MUNDO && !esquematico && <CapaFrente semilla={semilla} forma={forma} qr={qr} />}

        {costeProxima != null && seleccionada && (() => {
          const c = aPixel(seleccionada.pos, 30)
          const ok = poDisponibles >= costeProxima
          return (
            <g
              className={`coste-badge${ok ? '' : ' no-podes'}`}
              transform={`translate(${c.x + 24}, ${c.y - 78})`}
              pointerEvents="none"
            >
              <title>
                {ok
                  ? `Próxima acción cuesta ${costeProxima} PO (escalado 1/2/3/5)`
                  : `PO insuficientes: la próxima acción cuesta ${costeProxima} PO`}
              </title>
              <rect x="-13" y="-11" width="26" height="22" rx="6" />
              <text x="0" y="3" textAnchor="middle">{costeProxima}</text>
              <text x="0" y="9" textAnchor="middle" fontSize="4.5" className="coste-badge-leyenda">
                PO
              </text>
            </g>
          )
        })()}

        {loS && (() => {
          const t = aPixel(loS.destino, 30)
          const color = loS.despejada ? '#6fbf7a' : '#ff6b6b'
          // Flecha direccional: apunta hacia el objetivo en el último tramo real.
          const seg = loS.d.trim().split(/\s+/)
          const penultimo = seg.length > 1 ? seg[seg.length - 2].split(',') : [t.x, t.y]
          const prevX = parseFloat(penultimo[0])
          const prevY = parseFloat(penultimo[1])
          let dx = t.x - prevX
          let dy = t.y - prevY
          const lon = Math.hypot(dx, dy) || 1
          dx /= lon
          dy /= lon
          const aX = t.x - dx * 9
          const aY = t.y - dy * 9
          const p1 = `${aX - dy * 4},${aY + dx * 4}`
          const p2 = `${aX + dy * 4},${aY - dx * 4}`
          return (
            <g pointerEvents="none">
              <polyline
                points={loS.d}
                fill="none"
                stroke={color}
                strokeWidth="2"
                strokeDasharray={loS.despejada ? '7 4' : '3 4'}
                opacity="0.9"
              />
              {/* Cabeza de flecha: la línea "entra" al hex del objetivo */}
              <path d={`M${t.x},${t.y} L${p1} L${p2} Z`} fill={color} stroke="#14100c" strokeWidth="0.8" />
              {/* Reticula de objetivo sobre el hex destino */}
              <circle
                cx={t.x}
                cy={t.y}
                r={10}
                fill={loS.despejada ? 'rgba(111,191,122,0.15)' : 'rgba(255,107,107,0.15)'}
                stroke={color}
                strokeWidth="1.2"
                strokeDasharray="3 3"
              />
              <circle
                cx={t.x}
                cy={t.y}
                r={3.2}
                fill={color}
                stroke="#14100c"
                strokeWidth="1"
              />
            </g>
          )
        })()}

        <UnitContextMenu
          acciones={acciones || []}
          pos={seleccionada ? aPixel(seleccionada.pos, 30) : null}
          visible={modo === 'ninguno' && !!seleccionada}
        />
        <CombatFeedback estado={estado} />
        </g>
        {/* Vignette de foco: último plano, fijo en pantalla (fuera de la cámara),
          no intercepta interacción. En modo esquemático no hay vignette: el
          playtest busca máximo contraste. */}
        {!esquematico && (
          <g pointerEvents="none">
            <rect x={bx} y={by} width={bw} height={bh} fill="url(#luz-cenital)" />
            <rect x={bx} y={by} width={bw} height={bh} fill="url(#vineta)" />
          </g>
        )}
      </svg>
    </div>
  )
}
