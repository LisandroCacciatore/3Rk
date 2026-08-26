# Reporte de trabajo — 04/08/2026 (MVP del Motor de Escaramuza)

**Fecha:** 04/08/2026
**Alcance:** todo lo implementado en el día, del andamiaje a la simulación de
balance. El estado actual del proyecto está en `2026-08-04-informe-situacion.md`;
el reporte de watch points en `2026-08-04-fases2-4-simulacion-watchpoints.md`.

---

## 1. Progresión de sesiones

| Sesión | Contenido | Tests |
|---|---|---|
| 1 | Andamiaje, arquetipos, mazos, bandas, moneda, mano inicial (US-000..005) | 37 |
| 2 | Motor completo: tablero, cartas-PO, activación, Foco, combate, Técnicas, estados, ronda (US-010..084) | 115 |
| 3 | UI jugable de principio a fin (bucle de partida completo) | 182 |
| 4 | Épica 10 + decisiones D-14..D-24 (Reflujo 2 pasos, Disipar, gratuitas, registro, panel de reglas) | 218 |
| 5 | Fixes de economía de cartas (robo en solitario, deadlock mano vacía) | 220 |
| 2-4 | Simulación con bots: herramientas, campaña de 3000 partidas, reporte de watch points | 220 (sin regresiones) |

---

## 2. Sesión 1 — Andamiaje (US-000..005)

- `package.json`, `vite.config.js`, `index.html`: Vite + React 18 + Vitest 3.
- Motor: `dice.js` (RNG sembrado mulberry32), `state.js` (`crearEstadoInicial`),
  `log.js`, `index.js` (`aplicarIntencion` — API pública única).
- Datos: `rules.js` (D-01 a D-12, `crearReglas(overrides)`), `archetypes.js`
  (6 arquetipos), `factions.js` (mazo simétrico 5×3=15), `scenarios.js`.
- UI: `App.jsx` (3 zonas), `LogPanel.jsx`.
- **Decisiones:** proyecto manual (no `npm create vite`); semilla string → hash
  djb2; **bandas asimétricas en datos** (Fuego = Rey, Torre, Caballo, 2×Peón;
  Agua = Rey, Alfil, Campeón, 2×Peón); despliegue fijo (D-11); moneda
  `rng() < 0.5 ? 'A' : 'B'`; mano inicial 5 (D-08).

## 3. Sesión 2 — Motor completo (US-010..084)

- `hex.js`: coordenadas axiales, vecinos, distancia, BFS, camino libre, LoS con
  regla del borde, retroceso, píxeles. `po.js`, `techniques.js` (catálogo de 5).
- **Bugs corregidos:** `caminoLibre` permitía destino ocupado; `hexAlcanzables`
  crecía exponencial (BFS con `distanciaMin`); `aplicarJugarCarta` no validaba
  una-por-turno; `aplicarTerminarTurno` no limpiaba PO ni alternaba turno.

## 4. Sesión 3 — UI jugable

- `selectors.js` (hexes movibles, objetivos de ataque) centraliza la legalidad
  que consume la UI — la UI no calcula reglas.
- `App.jsx` reescrito como bucle jugable; `Board`, `HexTile` (6 estados),
  `UnitToken`, `UnitSheet`, `ActionMenu`, `TechniquePicker`, `HandPanel`,
  `POBar`, `elementos.js`.
- **Decisiones:** se retira `React.StrictMode` (la doble invocación del updater
  en desarrollo avanzaría el RNG dos veces y rompería el determinismo); técnicas
  de ataque se declaran en la confirmación (D-03), defensivas (Muro) en el menú;
  pago mixto auto-selecciona la primera carta del elemento requerido; semilla
  visible y editable.
- **Limitaciones:** Reflujo no cableado en la UI (motor atómico, sin pausa
  tirada→defensa — resuelto en sesión 4); edge case de fin de turno sin cartas
  (resuelto en sesión 5).

## 5. Sesión 4 — Épica 10 + D-14..D-24

Historias cerradas (motor + tests + UI):

- **US-077 Reflujo (D-16/D-17):** en dos pasos vía `estado.combatePendiente` +
  intención `REFLEJAR_DADOS`; tope de cadena de explosión = nivel de Foco
  (`explosionTopePorFoco`).
- **US-078 Disipar (D-14):** anula Muro si lo hay; si no, reduce 1 guardado
  (mín 1). Nunca ambos.
- **US-085 Activaciones gratuitas (D-18/D-19):** canal genérico de motor sin
  disparador; no consumen PO, no cuentan en el contador 1/3/5/9, cierran la
  activación, flag `gratuita`.
- **US-090 Reproducibilidad (D-20/D-21):** `estado.secuencia`, export JSON
  `{ semilla, reglas, secuencia }`, `reproducirPartida`, `metricasDePartida`.
- **US-091 Panel de reglas (D-22/D-23/D-24):** intención `CAMBIAR_REGLAS` con
  validación y evento de log; `SettingsPanel.jsx`; flags `stunnedReduceKept`
  (D-23), `reinicioContador` (D-05), `roboPorTurno` (D-08), `defensorNoQuedaStunned`
  (D-12) cableados.
- `combat.js` reescrito (tope de cadena, tiradas, Reflujo, Disipar, consecuencias);
  `status.js` (`poolConStunned`); `registro.js`, `metrics.js` (nuevos).
- **Limitaciones:** las activaciones gratuitas no tienen fuente en la UI del MVP
  (se testean a nivel de motor).

## 6. Sesión 5 — Fixes de economía de cartas

- **Bug 1 — robo en solitario:** el motor robaba 1 carta al jugador activo en
  cada fin de turno solitario, anulando la carta jugada → la ronda no terminaba.
  Contradecía GDD y FR-091. **Fix:** se elimina `robarCarta` del ramal solitario.
- **Bug 2 — deadlock mano vacía:** `TERMINAR_TURNO` exigía jugar la carta
  obligatoria aunque la mano estuviera vacía y el mazo vacío → partida trabada.
  **Fix:** la carta obligatoria solo se exige si el jugador tiene ≥ 1 carta; con
  la mano vacía se permite terminar el turno y cederlo.
- **UI:** la pista de carta obligatoria se oculta con la mano vacía.
- **Tests nuevos:** "Con la mano vacía se puede terminar el turno y cederlo",
  "En solitario no se roba: la mano del que sigue jugando se agota".

---

## 7. Auditoría de la Épica 10 (arbitro-reglas)

### Etapa 1 — Hallazgos

- **US-078 contradicción con la spec:** Disipar aplicaba ambos efectos (anular
  Muro Y reducir guardado); la spec dice "o".
- **US-085 y US-091 sin base de motor:** gratuitas no existían; 10 de 13 flags
  declarados en `rules.js` no se leían (D-03, D-04, D-05, D-06, D-07, D-09, D-11,
  D-12, D-13…).
- **US-077 y US-090:** requerían decisiones de arquitectura (resolución en dos
  pasos; registro de secuencia), no de reglas.
- **Un solo flag nuevo estrictamente necesario:** D-23 (Stunned "−1 dado
  guardado").

### Etapa 2 / 2b — Aprobaciones del dueño (D-14..D-24)

| ID | Historia | Resultado |
|---|---|---|
| D-14 | US-078 Disipar | ✅ aprobada tal cual |
| D-15 | US-078 entra en el ciclo | ✅ aprobada |
| D-16 | US-077 API dos pasos | ✅ aprobada |
| D-17 | US-077 repetir dados explotados | ✏️ **MODIFICADA** → tope de cadena = nivel de Foco (Foco 2 ⇒ 2 repeticiones; una 3ª tirada de 10 no se repite). Sustituye el tope fijo 20 de D-13. |
| D-18 | US-085 disparador | ✅ aprobada (canal sin disparador) |
| D-19 | US-085 ataque gratuito | ✏️ **MODIFICADA** → no cuenta en el contador 1/3/5/9; es un ataque extra ocasional por habilidad/cartas. No consume PO y cierra la activación. |
| D-20 | US-090 secuencia | ✅ aprobada |
| D-21 | US-090 export + metrics.js | ✅ aprobada |
| D-22 | US-091 panel solo cableado | ✅ aprobada |
| D-23 | US-091 `stunnedReduceKept` | ✅ aprobada |
| D-24 | US-091 `CAMBIAR_REGLAS` | ✅ aprobada |

**Escenarios Gherkin integrados:** E-1 (US-077, @should), E-2 (US-078, @could),
E-3 (US-085, @could), E-4 (US-091, @should).

### Fase 0 — Auditoría de cierre

- Escenarios E-1..E-4 auditados: motor ✅; test E-1 ⚠️ parcial (ver B.1).
- Flags D-14..D-24 verificados por lectura: **no hay reglas 🟡 hardcodeadas**.
- `npm test` 17 files / 220 tests, sin regresiones.
- **B.1 (leve):** E-1 (repetir dado ya explotado) no tiene test dedicado ni
  verifica el tope de cadena por Foco; tampoco commute `explosionTopePorFoco`.
- **B.2 (menor):** comentario obsoleto en `10-instrumentacion.feature:69` ("Sin
  base de motor aún" — la base existe desde la sesión 4).
- **Veredicto:** Épica 10 se cierra **aprobada** con una acción correctiva leve
  (B.1) y una limpieza documental (B.2).

---

## 8. Simulación de balance (Fases 2-4)

Campaña de **3000 partidas** (500 × 6 configs) con 3 bots en `sim/bots.js`
(aleatorio-legal, codicioso, ahorrador). Hallazgos principales: plantilla de
Agua gana 81-95% (H1), Rey muere en ronda 1 en codicioso/codicioso (H2), curva
1/3/5/9 muerta (H3), defender > atacar (H4), Stunned es impuesto bajo (H5).

**Detalle completo, datos por percentil y recomendaciones:**
`2026-08-04-fases2-4-simulacion-watchpoints.md`.

---

## 9. Archivos del prototipo (resumen por capa)

| Capa | Archivos |
|---|---|
| Motor | `src/engine/{dice,state,log,index,hex,po,actions,focus,combat,techniques,status,round,selectors,registro,metrics}.js` |
| Datos | `src/data/{rules,archetypes,factions,techniques,scenarios}.js` |
| UI | `src/ui/{App,Board,HexTile,UnitToken,UnitSheet,ActionMenu,TechniquePicker,HandPanel,POBar,LogPanel,SettingsPanel,elementos}.jsx` |
| Tests | `src/tests/` — 17 specs / 220 tests |
| Simulación | `sim/{bots,correr,reporte,metricas,analisis-orden}.js`, `sim/resultados.json` |
