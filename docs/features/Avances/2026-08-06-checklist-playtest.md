# Checklist de playtest — F.4 · Etapa 11, Fase 5 (manual en navegador)

**Fecha:** 06/08/2026
**Objetivo:** verificar a mano el flujo de Reflujo en dos pasos (D-16), el panel de reglas
(D-24/US-091), el replay exportar/copiar/importar/reproducir (US-102) y la visibilidad por
turno. Todo lo que se verifica ya está construido; esta sesión es de verificación.
**Replay preparado:** `public/playtests/reflujo.json` (generado por `sim/reflujo-playtest.js`).
**Cómo arrancar:** `npm run dev` y abrir el navegador.

Cada ítem: ✅ / ❌ / observación.

---

## 0. Preparación

- [x] `npm run dev` levanta el juego sin errores de consola.
- [x] `npm test` en verde antes de empezar (251/251).
- [x] Disponible `public/playtests/reflujo.json` (generado).

---

## 1. Reflujo en dos pasos (D-16 / US-077)

Ref: `src/engine/index.js:41` (bloqueo), `:308` (pausa), `:346` (REFLEJAR_DADOS),
`src/ui/App.jsx:658` (panel), `src/engine/combat.js:187`.

- [x] **1.1 Importar el replay**: en el navegador, el botón **"Reproducir"** (`TopHUD.jsx:70`,
      un `<label>` con `<input type="file">` invisible) abre el selector de archivos. Seleccionar
      `public/playtests/reflujo.json`. La partida arranca desde el estado inicial de la semilla.
- [x] **1.2 Reproducir hasta el ataque con Reflujo** (usar el autoplay de la ReplayBar): al llegar
      al `ATACAR` con Reflujo, la resolución **se pausa** tras la primera tirada: no se resuelven
      heridas aún y aparece el panel "Reflujo (D-16)".
- [x] **1.3 Panel de dados**: se muestran los dados tirados con checkboxes (`reflujo-dado`) y el
      hint "elegí qué dados repetir".
- [x] **1.4 Bloqueo de otras intenciones**: mientras hay `combatePendiente`, ninguna otra acción
      se acepta (el motor responde "Hay un ataque con Reflujo pendiente", `index.js:51`).
- [x] **1.5 "Repetir"**: marcar al menos 1 dado → se repite, se resuelve el ataque y
      `combatePendiente` queda `null` (no vuelve el panel).
- [x] **1.6 "No repetir nada"**: conserva la primera tirada y resuelve igual.
- [x] **1.7 (OBSERVAR) Interacción con el autoplay**: en modo replay el `REFLEJAR_DADOS` grabado
      ya viene en la secuencia. Resultado: **funciona según lo esperado** (confirmado por el dueño
      el 06/08/2026) — el autoplay aplica la resolución grabada sin conflicto con el panel; no se
      resuelve dos veces.

---

## 2. Panel de reglas conmutables (D-24 / US-091)

Ref: `src/ui/SettingsPanel.jsx` (9 flags), `src/engine/index.js:524` (CAMBIAR_REGLAS).

- [ ] **2.1 Abrir el panel** (botón "Reglas" en el TopHUD) con una partida en curso.
- [ ] **2.2 D-12** `defensorNoQuedaStunned` — atacar y confirmar que el defensor herido no queda
      Stunned.
- [ ] **2.3 D-05** `reinicioContador` `ronda` vs `turno` — el contador 1/2/3/5 de una unidad se
      comporta según la selección al cambiar de turno/ronda.
- [ ] **2.4 D-08** `roboPorTurno` — con `1`, el jugador entrante roba 1 carta al recibir el turno;
      con `0`, no roba.
- [ ] **2.5 D-23** `stunnedReduceKept` — Stunned resta 1 dado guardado (en vez de 1 dado del pool).
- [ ] **2.6 A-11-N4** `stunnedDuro` — Stunned resta 1 del pool Y 1 del keep (mín 1).
- [ ] **2.7 A-11-N5** `retrocesoDefensorDiferencia2` — ganar por diferencia ≥2 empuja 1 hex al
      defensor (animación de retroceso visible).
- [ ] **2.8 A-11-N6** `tecnicasUnaPorRonda` — una unidad no puede usar 2ª Técnica en la misma ronda.
- [ ] **2.9 A-11-N1** `reyProtegidoRonda1` — el Rey no puede ser objetivo en la Ronda 1 (off: sí
      puede).
- [ ] **2.10 A-11-N3** `costesAccion` — alternar `1/2/3/5` ↔ `1/3/5/9` y ver el cambio en los
      costes del ActionMenu / badge de unidad.
- [ ] **2.11 Log**: cada cambio queda registrado como evento `reglas` en el Combat Log.

---

## 3. Replay: exportar, copiar, importar, reproducir (US-102)

Ref: `src/engine/registro.js` (exportarRegistro/reproducirPartida), `src/ui/App.jsx:168` (exportar),
`:180` (copiarReplay), `:227` (importar), `src/ui/ReplayBar.jsx`.

- [ ] **3.1 Exportar** — jugar 2-3 turnos y "Exportar": descarga un JSON
      `escaramuza-<semilla>.json` con `{ semilla, reglas, secuencia }`.
- [ ] **3.2 Copiar al portapapeles** — "Copiar Replay": el JSON queda en el portapapeles y aparece
      la confirmación visual (~1.6s).
- [ ] **3.3 Importar** — "Nueva partida" y luego usar el botón **"Reproducir"** para seleccionar
      el JSON: se reconstruye la partida con el mismo motor.
- [ ] **3.4 Reproducir paso a paso** — la ReplayBar aplica la secuencia de a una intención
      (autoplay 260ms; saltar al final con "Saltar"; cerrar con "Cerrar").
- [ ] **3.5 Estado final idéntico** — al terminar la reproducción, el estado coincide con
      `reproducirPartida(semilla, secuencia)` (ganador, log, unidades).
- [ ] **3.6 Volver a jugar** — tras cerrar la ReplayBar se puede seguir con la partida reconstruida.

---

## 4. Visibilidad por turno (DoD pendiente)

Ref: `src/ui/App.jsx:156` (unidadesVisibles), `src/ui/UnitSheet.jsx` (ficha rival oculta).

- [ ] **4.1** En el turno de A, el roster (`RosterPanel`) lista solo unidades de A.
- [ ] **4.2** En el turno de B, el roster lista solo unidades de B.
- [ ] **4.3** Seleccionar una unidad rival muestra "Ficha rival oculta — seleccioná una de tus
      unidades".
- [ ] **4.4** Al pasar el turno, el tablero conserva las 10 unidades intactas (posiciones y vidas).

---

## Cierre

- [ ] Sin regresiones: `npm test` en verde al finalizar.
- [ ] Anotar cada ❌ en la sección "Deuda y pendientes" del reporte de avances.
- [ ] Resultado de 1.7 (interacción Reflujo + autoplay) documentado.

## Observaciones / hallazgos

- (anotar aquí cualquier ❌, comportamiento raro o sugerencia)
