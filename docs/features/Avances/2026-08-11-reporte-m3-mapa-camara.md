# Reporte de avances y estado — 11/08/2026 (M3: escenario rect 15×10 + cámara móvil)

**Fecha:** 11/08/2026
**Alcance:** hito **M3** del mapa (tablero rectangular 15×10, escenario con río/vados, bloques de
bosque y montaña, lugares, despliegues A/B, terreno por regiones y balance visual del Frente) y
**cámara móvil** (pan & zoom con centrado automático y reencuadre).
**Verificación al cierre:** `npm test` **319/319** (25 archivos) · `npm run build` ✅ (78 módulos) ·
determinismo: misma semilla → misma partida (los cambios de cámara son 100 % presentacionales).

---

## 1. Resumen ejecutivo

El tablero dejó de ser un hexágono radial de 127 casillas y pasó a ser un **rectángulo 15×10
(150 hexes)** con escenario táctico pensado para el playtest, y la pantalla ganó una **cámara
móvil** que resuelve la "vista de pájaro lejana" (unidades chicas y perdidas en un mar de hexes).

1. **M3 — Escenario rect 15×10.** `ESCENARIO_BASE` (src/data/scenarios.js) define forma
   `{ rect, 15×10 }`, un **río central** en la fila r=0 con **dos vados libres** (q=0 y q=-6),
   bloques de **bosque (NO)** y **montaña (SE)** de 5 hexes, **3 lugares** (D-26) y **despliegues
   fijos** de 5+5 unidades. Verificado con BFS: los 25 pares despliegue-A↔despliegue-B quedan
   conectados. El terreno pasó de ruido radial a **biomas por región** (río, caminos N-S por los
   vados, prado dominante, océano somero/profundo) — siempre cosmético, el motor solo conoce
   `forma` + `bloqueados`.
2. **Cámara móvil.** El tablero ya no se encaja completo: se ve una porción enfocada a **zoom
   1.25× por defecto** (rango 1.0–2.5), con **pan** (botón derecho o medio), **zoom con la rueda
   al cursor**, **centrado suave** (~320 ms) al seleccionar una unidad, y botón **⛶ reencuadre**
   que vuelve al encuadre completo. El HUD, la mano en abanico, la ficha de unidad, la viñeta y la
   luz cenital quedan **fijos** en pantalla; solo el mundo + tablero + overlays anclados viajan.
3. **Anclaje visual.** Se reforzó la sombra exterior de las unidades (0.28 / rx 17) para que el
   sprite no se sienta "pegado" a zoom alto. La sombra doble y la grilla al 16 % ya existían y se
   conservan: el efecto "calcomanía flotante" lo producía el encuadre fijo, no la falta de sombra.

---

## 2. Cambios por capa

### M3 — Mapa y escenario

| Archivo | Qué es |
|---|---|
| `src/engine/hex.js` | Geometría del tablero rect: `generarTableroRect(col, filas)`, `dentroRect(q,r,..)` y `dentroDeForma` unificado para rect/hex. Solo matemática de coordenadas, sin reglas de juego. |
| `src/data/scenarios.js` | `ESCENARIO_BASE` rect 15×10: 23 bloqueados (río 13 + bosque 5 + montaña 5), 3 lugares, despliegues A/B de 5 hexes. |
| `src/engine/state.js` | El estado copia `escenario.forma` al `tablero` (además de `bloqueados` y `lugares`). |
| `src/ui/Board.jsx` | Renderiza la forma del escenario (`generarTableroRect`); el mundo de fondo se genera con radio ampliado para cubrir el tablero rect. |
| `src/ui/terreno.js` | Terreno **por regiones**: río (r=0) en agua con vados pintados como camino, caminos N-S en q=0/q=-6, bosque NO, montaña SE, prado dominante con acentos; mundo alrededor como isla con mar. |
| `src/ui/terrenoVisual.jsx` | Paleta `OCEANO_PROFUNDO` (mar lejano desaturado) además de la costera. |
| `src/ui/HexTile.jsx` | Ajuste de invariante de test (una sola capa de datos sobre el terreno). |
| `src/tests/escenario.spec.js` | Tests del escenario: 23 bloqueados/3 lugares, conectividad A↔B (BFS), lugares alcanzables, despliegues no bloqueados ni pisados, vados libres. |
| `src/tests/hex.spec.js`, `ui-smoke.spec.jsx`, `ui-esquematico.spec.jsx` | Invariantes actualizados de 127 → **150** hexes. |

### M3g + Cámara (balance visual del Frente y navegación)

| Archivo | Qué es |
|---|---|
| `src/ui/Board.jsx` | **Motor de cámara**: estado `cam {x,y,z}`, `<g transform>` que mueve mundo+tablero+overlays y deja fijos viñeta/fondo/HUD; pan con botón derecho/medio (`setPointerCapture`), zoom con rueda **no-pasiva al cursor** (inverso de `preserveAspectRatio slice`), centrado suave rAF (easeOutCubic 320 ms) al seleccionar, clamp del centro para que el tablero no salga del encuadre, reset por `resetCamaraTick`; `CapaMundo` genera con `hypot(vb.w, vb.h)` para cubrir cualquier pan/zoom; vignette + luz cenital fijas en espacio de pantalla; océano profundo sin olas. |
| `src/ui/App.jsx` | Botón **⛶ reencuadre** en el HUD flotante; `resetCamaraTick` sube al empezar partida, al crear nueva y al pulsar el botón. |
| `src/ui/UnitToken.jsx` | Sombra exterior reforzada (0.28 / rx 17) para el anclaje a zoom alto. |
| `src/index.css` | `.board-container svg { touch-action: none; cursor: grab }`, `.arrastrando { cursor: grabbing }`, `.btn-reencuadrar`. |
| `src/tests/ui-smoke.spec.jsx` | Assert del botón de reencuadre en el HUD. |

---

## 3. Detalle del escenario (M3)

`ESCENARIO_BASE` (src/data/scenarios.js):

- **Forma:** rectángulo 15×10 → **150 hexes jugables** (antes 127 radiales).
- **Río:** fila r=0 completa salvo los **vados** `(0,0)` y `(-6,0)` → 13 hexes bloqueados.
- **Bloqueos tácticos:** bosque NO `(-7..-5, -3..-2)` y montaña SE `(1..3, 2..3)`, 5 hexes c/u.
- **Lugares (D-26):** `(0,-1)` centro y `(-6,1)`/`(2,1)` flancos del río; captura 2 PO fijos.
- **Despliegue A:** 5 hexes en r=-4 (`q -4..0`); **despliegue B:** 5 hexes en r=3 (`q -4..0`).
- **Conectividad garantizada por test (BFS):** los 25 pares A↔B quedan conectados y cada lugar es
  alcanzable desde todos los hexes de despliegue.

El terreno es **solo presentación** (`terreno.js` pinta por región; el motor conoce únicamente
`forma` y `bloqueados`). En modo esquemático el tablero se lee por color + letra (P/B/A/M/C/R/L).

---

## 4. Detalle de la cámara (M3g+)

| Comportamiento | Valor |
|---|---|
| Zoom por defecto | **1.25×** (rango 1.0–2.5) |
| Pan | botón **derecho** o **medio** arrastrando; izquierdo = selección |
| Zoom | **rueda** del mouse, centrado en el cursor, factor `exp(-deltaY·0.0012)` |
| Centrado automático | al **seleccionar** una unidad, easeOutCubic ~320 ms; se cancela al pan/zoom manual |
| Reencuadre | botón **⛶** en el HUD → encuadre completo a zoom 100 % (también al comenzar/nueva partida) |
| Fijos en pantalla | HUD, mano en abanico, ficha flotante, viñeta, luz cenital, fondo esquemático |
| Clamp | el centro no puede sacar el tablero del encuadre por completo |

La cámara es **presentacional pura**: no consume RNG ni toca `estado`; solo transforma
coordenadas visuales. En modo esquemático también aplica (consistencia de navegación).

---

## 5. Verificación

- `npm test`: **319/319** en verde (25 archivos), sin regresiones.
  - `escenario.spec.js`: 23 bloqueados/3 lugares, BFS de conectividad, vados libres, lugares
    alcanzables, despliegues válidos.
  - `ui-smoke` / `ui-esquematico`: **150** hexes y 10 unidades; botón de reencuadre presente.
- `npm run build`: ✅ 78 módulos.
- Verificación **manual en navegador** (DoD de UI): pan con botón derecho/medio, zoom con rueda
  al cursor, centrado suave al seleccionar, ⛶ reencuadre, esquemático con grilla nítida y
  navegación consistente, viñeta/luz cenital fijas.
- **Determinismo:** los cambios de cámara y terreno no consumen RNG (el terreno es función pura
  de q, r, semilla). `src/engine/` y `src/data/` solo sumaron geometría/datos del escenario; no
  cambió ninguna regla.

---

## 6. Próximos pasos posibles

- Ajuste fino de la cámara (zoom por defecto, rango, duración del centrado) según playtest.
- Próximo bloque de gameplay (combate/técnicas) definido por el backlog.
- Generar las variantes de escenario sobre la misma forma rect (más `obtenerEscenario('...')`).
