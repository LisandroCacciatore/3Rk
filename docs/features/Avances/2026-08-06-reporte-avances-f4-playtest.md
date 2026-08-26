# Reporte de avances y estado — 06/08/2026 (cierre de sesión F.4)

**Fecha:** 06/08/2026
**Alcance:** cierre del checklist de playtest F.4 (Etapa 11, Fase 5): verificación manual en el
navegador del flujo de Reflujo en dos pasos (D-16) con un replay preparado para esta sesión.
**Verificación al cierre:** `npm test` **251/251** (18 archivos) · `npm run build` ✅ ·
reproducción del replay sin errores ni regresiones.
**Documentos hermanos:** `2026-08-06-checklist-playtest.md` (checklist tildado),
`2026-08-06-reporte-epica-ui02-y-fixes.md`, `2026-08-05-pendientes-decision.md` (F.4).

---

## 1. Resumen ejecutivo

La sesión F.4 era la **Fase 5 de la Etapa 11 del playtest**: verificar a mano en el navegador el
flujo de Reflujo en dos pasos (D-16), que quedó pendiente de verificación desde que se implementó.
Para poder probarlo sin depender del azar (Reflujo exige acumular 2 tokens de Agua en un Alfil o
Campeón de la banda Agua, en varias rondas), se construyó un **replay de playtest** que llega solo
a un ataque con Reflujo.

El dueño importó el replay y confirmó: **"Perfecto, funciona según lo esperado"**. El flujo de
Reflujo en dos pasos quedó verificado a mano en el navegador, sin errores y sin regresiones.

---

## 2. Preparación de la sesión — builder de replay con Reflujo

**Objetivo:** llegar a un ataque con Reflujo de forma reproducible, sin depender del draw aleatorio.

**Cómo se logró** (`sim/reflujo-playtest.js`):

1. La secuencia se arma a mano (sin bots): el jugador B (Agua) juega su carta obligatoria cada
   turno, concentra **2 tokens de Agua** en su Alfil (`Alfil-7`) en turnos separados (los PO no
   persisten entre turnos, `D-08`), lo acerca con `MOVER` hasta tener un objetivo de A a rango 2
   + LoS, y ataca con `ATACAR` + `tecnica: 'Reflujo'`.
2. **Dato de reglas clave** (por qué hace falta acumular tokens y no usar la carta): Reflujo
   cuesta `{ Agua: 2 }` y la carta solo cubre el **excedente sobre la capacidad de Foco**
   (`src/engine/techniques.js:65`). Para Alfil (Foco 2) y Campeón (Foco 3) el excedente es 0:
   solo los tokens guardados pagan la Técnica.
3. Cada intención se valida contra el motor: si un paso fuera inválido, el motor lo registraría
   como `error` y la semilla se descartaría. Se probaron semillas `playtest-reflujo-N` hasta
   encontrar una limpia (la primera, `playtest-reflujo-1`).
4. Al terminar, se valida el **determinismo** con `reproducirPartida(semilla, secuencia)`:
   el estado reproducido debe coincidir con la partida guiada.

**Resultado** — `public/playtests/reflujo.json` (semilla `playtest-reflujo-1`, 16 intenciones):

```
secuencia: 16 intenciones · errores en reproducción: 0 · combatePendiente final: null
tirada con Reflujo: "Alfil-7 tiró su pool de ataque (2g1): 6, 7 — Reflujo: elegí qué dados repetir"
ataque registrado: "Alfil-7 atacó pagando 2 PO con Reflujo"
ronda final: 1 · ganador: sin finalizar · manos A/B: 2/2
```

Las últimas 6 intenciones muestran el flujo exacto que se verifica a mano:

```
JUGAR_CARTA (A) → TERMINAR_TURNO (A) → JUGAR_CARTA (B) → MOVER Alfil-7 →
ATACAR Reflujo (B) → REFLEJAR_DADOS (B)
```

---

## 3. Playtest manual en el navegador — verificado

Checklist completo: `2026-08-06-checklist-playtest.md`.

### 3.1 Reflujo en dos pasos (D-16) — ✅ verificado por el dueño

| Ítem | Resultado |
|---|---|
| Importar el replay con el botón "Reproducir" (`TopHUD.jsx:70`) | ✅ |
| El `ATACAR` con Reflujo pausa tras la primera tirada, sin resolver heridas | ✅ |
| Panel "Reflujo (D-16)" con los dados y checkboxes (`App.jsx:658`) | ✅ |
| Bloqueo de otras intenciones mientras `combatePendiente` (`index.js:41`) | ✅ |
| "Repetir" resuelve repitiendo los dados elegidos | ✅ |
| "No repetir nada" conserva la primera tirada | ✅ |
| Interacción con el autoplay del replay (1.7): funciona según lo esperado | ✅ |

> **Confirmación del dueño (06/08/2026):** "Perfecto, funciona según lo esperado."

### 3.2 No verificado aún (quedan pendientes del checklist)

El resto de la Fase 5 sigue sin verificar en el navegador (no era parte de esta corrida):

- **Paso 2 — Panel de reglas conmutables (D-24/US-091):** toggles de los 9 flags cableados.
- **Paso 3 — Replay exportar/copiar/importar/reproducir (US-102):** 3.1 a 3.6.
- **Paso 4 — Visibilidad por turno:** roster/ficha solo de la facción activa.

---

## 4. Estado general del proyecto

| Área | Estado |
|---|---|
| Motor de reglas (11 épicas) | ✅ Completo y testeado — `src/engine/`, `src/data/` sin cambios |
| Decisiones 🟡 (D-01…D-24, A-11-N1…N6) | ✅ Todas en `src/data/rules.js`, leídas desde `estado.reglas` |
| UI — transformación visual | ✅ Prado, sprites, HUD, escala 1440×810 (ver reporte de avances UI) |
| UI — épica UI-02 | ✅ 11/11 historias implementadas |
| Simulación | ✅ `npm run sim` con checkpoints + panel en navegador |
| Playtest F.4 — Reflujo D-16 | ✅ Verificado a mano (esta sesión) |
| Playtest F.4 — resto (panel reglas, replay, visibilidad) | 🔲 Pendiente (checklist pasos 2-4) |

**Garantías vigentes:** el motor sigue siendo determinista (misma semilla → misma partida); toda
regla 🟡 vive en `data/rules.js`; ninguna regla quedó hardcodeada.

---

## 5. Archivos creados / modificados en esta sesión

| Archivo | Qué es |
|---|---|
| `docs/features/Avances/2026-08-06-checklist-playtest.md` | Checklist F.4 actualizado (paso 1 ✅) |
| `sim/reflujo-playtest.js` | Builder del replay con Reflujo (secuencia armada a mano) |
| `public/playtests/reflujo.json` | Replay exportado (semilla `playtest-reflujo-1`, 16 intenciones) |
| `docs/features/Avances/2026-08-06-reporte-epica-ui02-y-fixes.md` | Reporte de la sesión anterior (referencia) |

---

## 6. Cómo reanudar el playtest F.4

```
npm run dev
```

Quedan por tildar los pasos 2 (panel de reglas), 3 (replay) y 4 (visibilidad por turno) del
checklist. El replay `public/playtests/reflujo.json` queda disponible para reproducir el flujo de
Reflujo cuando se necesite.
