# Reporte de avances y estado — 07/08/2026 (cierre de sesión D-27)

**Fecha:** 07/08/2026
**Alcance:** implementación de la decisión **D-27 (US-163)** — la habilidad es de la **carta**,
no del rol: catálogo por carta de 15 efectos únicos, origen aliado sin gate de rol, filtro de
objetivo por bando + rol + arquetipo, flag ON por defecto.
**Verificación al cierre:** `npm test` **299/299** (22 archivos) · `npm run build` ✅ ·
motor determinista (misma semilla → misma partida).
**Documentos hermanos:** `docs/BACKLOG.md` (fila D-27 y D-25 marcada como superada),
`docs/features/11-cartas-habilidades.feature` (reescrito a US-163).

---

## 1. Resumen ejecutivo

Con D-27, cada una de las 15 cartas del mazo base declara **su propio efecto** en
`HABILIDADES_POR_CARTA`, con magnitud **fija** (el valor 1–3 solo cuenta para el PO de Orden). Se
eliminó el gate de rol del MVP (Mago→Hechizo, Guerrero→Arma): el origen de una habilidad es
**cualquier unidad aliada** en rango/LoS del objetivo. El objetivo debe cumplir el filtro de la
carta (`cumpleFiltroObjetivo`: bando + rol + arquetipo). El flag `habilitarHabilidadesCarta`
queda **ON por defecto** (toggle conservado).

La decisión se confirmó con el dueño en 4 puntos y una simplificación:
- 15 efectos únicos, uno por carta (tabla completa aprobada).
- Origen aliado sin restricción de rol.
- Filtro por bando + rol + arquetipo.
- Activación ON por defecto.
- **Avalancha (Tierra3)** simplificada → "el aliado puede Mover gratis (solo mover, sin atacar)".

---

## 2. Modelo y efectos (catálogo por carta)

Carta de mazo: `{ elemento, valor, tipo, habilidad }` con
`habilidad = { nombre, objetivo, filtro?, efecto, magnitud, descripcion }`.

| Carta | Habilidad | Bando | Filtro | Efecto |
|---|---|---|---|---|
| 🔥1 | Chispa | enemigo | — | 1 herida directa |
| 🔥2 | Látigo | enemigo | — | 1 herida + retrocede 1 hex |
| 🔥3 | Bomba | enemigo | — | 1 herida al objetivo y a cada enemigo adyacente |
| 💧1 | Escarcha | enemigo | — | objetivo Stunned |
| 💧2 | Ola | aliado | — | cura 2 (sin superar vida máxima) |
| 💧3 | Escudo | aliado | Torre | Muro (keep +1 en defensa) |
| 🌪️1 | Vendaval | aliado | — | +1 dado a la próxima tirada de ataque |
| 🌪️2 | Brisa | aliado | — | +1 dado a la próxima tirada de defensa |
| 🌪️3 | Corriente | aliado | — | recupera la carta previa del descarte |
| 🌍1 | Raíz | aliado | — | 1 token de Foco gratis (tope respetado) |
| 🌍2 | Terremoto | enemigo | — | empuja 2 hexes |
| 🌍3 | Avalancha | aliado | Guerrero | Mover gratis (solo mover, sin atacar) |
| ◼️1 | Drenar | enemigo | — | pierde 1 token de Foco |
| ◼️2 | Purga | aliado | — | quita Stunned |
| ◼️3 | Ruptura | enemigo | — | anula Muro o reduce 1 dado guardado de defensa |

---

## 3. Implementación

| Capa | Cambios |
|---|---|
| **Datos** | `cards.js`: `HABILIDADES_POR_CARTA` + `cumpleFiltroObjetivo`; se eliminaron `ROL_TIPO`/`rolCanaliza`/`HABILIDADES` por elemento. `factions.js` inyecta `habilidad` en el mazo. `rules.js`: `habilitarHabilidadesCarta: true`. |
| **Motor** | `habilidades.js` reescrito: validación (turno, flag, origen propio, filtro, rango/LoS) y `aplicarEfecto` con dispatch por clave (`herida`, `herida-retroceso`, `aoe-herida`, `cura`, `pool-ataque`, `pool-defensa`, `recuperar-carta`, `foco`, `muro`, `retroceso`, `movimiento-gratis`, `stunned`, `anti-stunned`, `drenar-foco`, `disipar`). `selectors.js`: `origenesHabilidad` (todas las aliadas) y `objetivosHabilidad`. `focus.js`: `quitarTokenFoco`. `combat.js`: `bonoPoolDefensa` y `disipadoDefensa` consumibles en defensa. `index.js`: `aplicarMover` consume `movimientoGratis` (coste 0, sin contador) y el log de habilidad incluye `carta.habilidad.nombre`. |
| **UI** | `HandPanel.jsx`: muestra nombre + descripción de la habilidad y botón "Jugar como Habilidad". `App.jsx`: flujo elegir carta → elegir origen → elegir objetivo filtrado. `Board.jsx`/`UnitToken.jsx`: prop `origenesIds`/`origen` para resaltar el origen. |
| **Tests** | `habilidades-cartas.spec.js` reescrito: **27 tests** (uso excluyente, sin gate de rol, filtros de bando/rol/arquetipo, los 15 efectos, determinismo). |

### Bugs corregidos durante la implementación

- `retrocederUnidad` pasaba objetos de unidad a `buscarRetroceso` (que espera posiciones) →
  posición `NaN` en Látigo/Terremoto. Se pasan `unidad.pos`/`origen.pos`.
- El test de Avalancha armaba un estado con solo unidades de A → B quedaba eliminado al resolver
  la carta y la partida terminaba antes del MOVER. Se añadió una unidad B.
- Test de filtro por rol buscaba el texto `'solo a unidades Guerrero'`; el mensaje real es
  `'solo afecta a unidades Guerrero'`.
- Prop desincronizada en la UI: `App.jsx` pasaba `canalizadoresIds` pero `Board.jsx` leía
  `origenesIds`; se alineó (y se eliminó el prop muerto).
- Descripción de Aire3 imprecisa: recupera la carta **anterior** del descarte, no la última
  (la carta jugada pasa a ser la última).

---

## 4. Verificación

- `npm test`: **299/299** en verde (22 archivos, sin regresiones). Los 27 tests nuevos de
  `habilidades-cartas.spec.js` cubren los escenarios del feature reescrito.
- `npm run build`: ✅ (82 módulos).
- Determinismo: sin cambios en el patrón `semilla + secuencia`; el escenario de reproducción del
  feature lo verifica.
- Sin reglas 🟡 hardcodeadas: todas las decisiones viven en `src/data/rules.js` y se leen desde
  `estado.reglas`.

---

## 5. Estado general del proyecto

| Área | Estado |
|---|---|
| Motor de reglas (11 épicas) | ✅ Completo y testeado |
| Decisiones 🟡 (D-01…D-27) | ✅ Todas en `src/data/rules.js`, leídas desde `estado.reglas` |
| Cartas como habilidad por carta (D-27/US-163) | ✅ Implementado y testeado (esta sesión) |
| Smoke manual del flujo habilidad en el navegador | 🔲 Pendiente (DoD #2) — `npm run dev` |

---

## 6. Archivos creados / modificados en esta sesión

| Archivo | Qué es |
|---|---|
| `src/data/cards.js` | `HABILIDADES_POR_CARTA` (15 cartas), `cumpleFiltroObjetivo`, `habilidadDeCarta`; eliminados `ROL_TIPO`/`rolCanaliza`/`HABILIDADES` |
| `src/data/factions.js` | Mazo base con `habilidad` por carta |
| `src/data/rules.js` | `habilitarHabilidadesCarta: true` |
| `src/engine/habilidades.js` | Validación + `aplicarEfecto` (dispatch por clave) |
| `src/engine/selectors.js` | `origenesHabilidad`, `objetivosHabilidad` |
| `src/engine/focus.js` | `quitarTokenFoco` |
| `src/engine/combat.js` | `bonoPoolDefensa`/`disipadoDefensa` consumibles |
| `src/engine/index.js` | `aplicarMover` consume `movimientoGratis`; log de habilidad con nombre |
| `src/ui/HandPanel.jsx` | Nombre + descripción de la habilidad, botón "Jugar como Habilidad" |
| `src/ui/App.jsx`, `Board.jsx`, `UnitToken.jsx` | Flujo origen→objetivo y resaltado del origen |
| `src/tests/habilidades-cartas.spec.js` | 27 tests |
| `docs/features/11-cartas-habilidades.feature` | Reescribo a US-163 |
| `docs/BACKLOG.md` | Fila D-27; D-25 marcada como superada |

---

## 7. Cómo reanudar

```
npm run dev
```

Queda pendiente el **smoke manual** del flujo Orden ↔ Habilidad en el navegador (elegir carta →
elegir origen → elegir objetivo filtrado; verificar que el resaltado de orígenes y el rechazo por
filtro se ven correctamente). Con eso, D-27 cierra su Definition of Done completo.
