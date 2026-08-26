# Reporte de estado — Épica UI-02 completa + fixes post-playtest

**Fecha:** 06/08/2026
**Alcance:** cierre de la épica UI-02 (11 historias) y corrección de los dos bugs
reportados en el playtest (pantalla negra en ataque a distancia, sin sonido).
**Verificación al cierre:** `npm test` **251/251** (18 archivos) · `npm run build` ✅ ·
determinismo verificado (misma semilla → misma partida).
**Documentos hermanos:** `2026-08-06-reporte-avances-ui.md` (transformación visual),
`2026-08-05-pendientes-decision.md`, `docs/features/UI-02.feature`.

---

## 1. Resumen ejecutivo

El **MVP de reglas quedó completo** (11 épicas, 251/251 tests) y la **épica UI-02 se
implementó entera**: feedback táctico, presentación física y herramientas de playtest. El
playtest manual del dueño encontró dos bugs que se corrigieron en esta sesión y el juego
quedó confirmado como jugable ("perfecto, lo jugué, me gusta").

El motor de reglas **no se tocó**: `src/engine/` y `src/data/` siguen intactos, la UI
consume selectores/eventos del motor y el determinismo se mantiene.

---

## 2. Bugs reportados en el playtest — corregidos

| # | Síntoma | Causa raíz | Fix | Archivo |
|---|---|---|---|---|
| 1 | **Pantalla negra** al atacar a distancia con arqueros | En modo ataque, el render usaba `hover.pos` (del estado de hover) en el cálculo de LoS **fuera del bloque** donde `hover` se declara → `ReferenceError` que tiraba el render del tablero. El bug era exclusivo del path de ataque a distancia (LoS sobre enemigo), por eso solo ocurría ahí | `loS` ahora guarda `destino: hover.pos` dentro del bloque y el render usa `loS.destino` | `src/ui/Board.jsx:149` |
| 2 | **Sin sonido** en toda la partida | `despachar()` en `App.jsx` accedía a `nuevas` (eventos nuevos del log, usados por el bloque de retroceso US-099) **antes** de su declaración `const` → temporal dead zone. El `ReferenceError` cortaba la ejecución de `despachar` en **cada acción**, dejando sin correr el loop de sonido, el overlay de combate y el banner de eventos | `const nuevas = nuevo.log.slice(estado.log.length)` movida al inicio de `despachar` (línea 93) | `src/ui/App.jsx:93` |

Además, se subieron los volúmenes en `src/ui/sound.js` (dados 0.07→0.14, impacto
0.16→0.3, carta 0.09→0.18, fanfarria 0.24→0.32) y el desbloqueo de audio ahora se
dispara también en el evento `click` (además de `pointerdown`), por si el navegador
bloquea el primero.

---

## 3. Épica UI-02 — estado por historia

Referencia: `docs/features/UI-02.feature` (regla del proyecto: escenarios de UI se
verifican a mano en el navegador, no como tests Vitest).

| US | Historia | Estado | Implementación |
|---|---|---|---|
| US-092 | Menú contextual de unidad | ✅ | `src/ui/UnitContextMenu.jsx` — reusa `obtenerAcciones()` y los mismos callbacks del ActionMenu; solo acciones ejecutables; no aparece para unidades rivales |
| US-093 | Animación de movimiento | ✅ | `src/ui/UnitToken.jsx` — render en posición previa + transición 0.26s; al terminar coincide exacto con el estado del motor |
| US-094 | Zonas de amenaza | ✅ | `Board.jsx` — preview al hoverear enemigo con `hexEnRadio()` + `hayLoS()`; estado `amenaza` nuevo en `HexTile.jsx`, visualmente distinto de los overlays propios |
| US-095 | Indicadores flotantes de combate | ✅ | `src/ui/CombatFeedback.jsx` — disparado por eventos reales del log (`herida`, `stunned`, `retroceso`, `retroceso-defensor`, `eliminacion`, `ataque` con explosión vía `resumenDado`); nunca por inferencia de la UI |
| US-096 | Cartas con tacto físico (abanico) | ✅ | `HandPanel.jsx` — abanico CSS con `--rot`/`--baja`, hover eleva con `scale`; no altera la funcionalidad ni el PO |
| US-097 | Indicador de coste de próxima acción | ✅ | `Board.jsx` — badge junto a la unidad vía `costeProximaAccion()` + `poDisponibles`; rojo si faltan PO; nunca hardcodeado |
| US-098 | Unidad agotada | ⏸️ no implementar | `@wont`: depende de una regla futura; se respeta el escenario "no inventar agotamiento en la UI" |
| US-099 | Feedback visual de retroceso | ✅ | `UnitToken.jsx` — sacudida `token-cuerpo.sacudida` reaccionando a eventos `retroceso`/`retroceso-defensor`; limpieza por `onAnimationEnd`; cubre ambos eventos sin importar el flag |
| US-100 | Efectos de sonido ligeros | ✅ | `sound.js` (WebAudio, fallback silencioso) + cableado en `despachar()` — dados, impacto, carta, fanfarria; no bloquea el juego sin audio |
| US-101 | Panel de simulación Bot vs Bot | ✅ | `src/ui/SimulationPanel.jsx` — **reusa** `sim/bots.js` y el motor; semillas fijas `sim-N` (determinismo verificado); no modifica las reglas globales |
| US-102 | Replay: copiar y reproducir visual | ✅ | `src/ui/ReplayBar.jsx` — reproducción paso a paso aplicando `aplicarIntencion` (estado final idéntico a `reproducirPartida`), autoplay 260ms, saltar/cerrar; "Copiar Replay" con `navigator.clipboard` + fallback `execCommand` |
| US-103 | Panel de telemetría | ✅ | integrado en `SimulationPanel.jsx` — partidas, victorias por facción, rondas promedio, eliminaciones (`resumenDePartida` ahora incluye `eliminaciones` en `sim/jugar-partida.js`), Foco diferenciado de PO, alerta de desequilibrio |

**Orden de implementación** (del feature): feedback táctico (095→093→097→092→094) →
presentación física (096→100) → herramientas de playtest (101→103→102). ✅ respetado.

**Extras de la sesión:** botones "Simular" y "Copiar Replay" en `TopHUD.jsx`.

---

## 4. Estado general del proyecto

| Área | Estado |
|---|---|
| Motor de reglas (11 épicas) | ✅ Completo y testeado — `src/engine/`, `src/data/` sin cambios |
| Decisiones 🟡 (D-01…D-24, A-11-N1…N6) | ✅ Todas en `src/data/rules.js`, leídas desde `estado.reglas`; ninguna hardcodeada |
| UI — transformación visual | ✅ Ver `2026-08-06-reporte-avances-ui.md` (prado, sprites, HUD, escala 1440×810) |
| UI — épica UI-02 | ✅ 11/11 historias implementadas (ver §3) |
| Simulación | ✅ `npm run sim` con checkpoints; `sim/resultados.json` post-ajustes; panel en navegador |
| Playtest manual | ✅ Jugado por el dueño; 2 bugs corregidos (§2); confirmado "perfecto" |

---

## 5. Deuda técnica y pendientes

1. ⚠️ **Sprites desfasados** — las imágenes de las unidades se ven desplazadas respecto del
   hex (dejado así a pedido del dueño). Candidato a corregir en una sesión de calibración de
   tokens. (Del reporte de avances UI.)
2. **Panel US-091 parcial** — expone solo flags cableados (D-22); D-06, D-07, D-11 y
   `explosionTopeCadena` documentados como no conmutables hasta cablearse. (BACKLOG §5.)
3. **Verificación manual pendiente** — pasar el turno y confirmar roster/ficha por facción y
   las 10 unidades intactas. (DoD de la sesión de visibilidad por turno.)
4. **F.4 del playtest (Etapa 11, Fase 5)** — checklist manual: flujo de Reflujo en dos pasos
   (D-16), panel de reglas, exportar/reproducir replay. (`2026-08-05-pendientes-decision.md` §F.)
5. **Campaña completa de simulación** — 3000 partidas (~20 min) con variantes `stunned-duro`
   y `retroceso-defensor` para cuantificar H4/H5 (la medición quedó diferida al playtest manual
   por decisión del dueño; ver pendientes-decision Ítem E).

---

## 6. Cómo verificar en el navegador

```
npm run dev
```

- Atacar a distancia con arqueros: el tablero no se apaga y aparece el overlay de combate.
- Cualquier acción: sonido de dados/impacto; las heridas muestran "-1 HP" flotante sobre la unidad.
- Hoverear un enemigo: hexágonos que amenaza resaltados sutilmente.
- Seleccionar unidad propia: menú contextual con acciones y badge de coste junto al hex.
- Mover: la unidad se desliza; al atacar y perder, retrocede con sacudida.
- Botones "Simular" (panel con telemetría) y "Copiar Replay" (reproducción paso a paso).
