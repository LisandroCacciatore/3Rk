# Reporte de avances y estado — 10/08/2026 (pantalla de partida en columnas)

**Fecha:** 10/08/2026
**Alcance:** pantalla de partida con 3 columnas — plantillas (roster + ficha detallada) a la
izquierda, tablero al centro, mano de cartas a la derecha —, con los paneles fuera del tablero;
verificación del tablero esquemático de playtest; estabilización de los tests de UI.
**Verificación al cierre:** `npm test` **308/308** (25 archivos) · `npm run build` ✅ (81 módulos) ·
motor determinista (sin cambios en el patrón `semilla + secuencia`).

---

## 1. Resumen ejecutivo

La pantalla de partida pasó de un único `<main>` centrado con los paneles flotando sobre el
tablero a un área de **3 columnas** (`app-main`):

1. **`plantillas-lateral` (izquierda, fuera del tablero):** Roster (plantillas del ejército
   activo) arriba y la **ficha detallada** de la unidad seleccionada debajo (`UnitCard`).
2. **`zone tablero` (centro):** el mapa Fire Emblem GBA a pantalla completa, sin marco ni caja.
3. **`mano-lateral` (derecha, fuera del tablero):** las cartas del jugador activo como
   **mini-cartas compactas** (símbolo + coste) apiladas; el hover expande un preview a la
   izquierda con arte, nombre y coste, que queda **fijado** al hacer click (con el estado
   generalmente `Jugar como Orden`); jugar la carta obligatoria deja la mano deshabilitada.

Nada de esto toca el motor: es presentación pura (las reglas de Orden, Foco, habilidad D-27,
costes, etc. siguen viviendo en `src/engine/` y `src/data/`).

---

## 2. Cambios por capa

| Capa | Cambios |
|---|---|
| **UI** | `App.jsx`: layout de 3 columnas (`plantillas-lateral` / `tablero` / `mano-lateral`); el roster queda **abierto por defecto**; `esquematico` se propaga también a `Board` desde el toggle del modal. `RosterPanel.jsx`: strip de plantillas (banda de color de jugador, glifo de arquetipo, facción, stats, slots de Foco, estados). `HandPanel.jsx`: lista de mini-cartas + preview expandible/fijable con el coste de la carta. `UnitCard.jsx`: ficha detallada en la columna izquierda. `index.css`: reglas de las columnas (`plantillas-lateral`, `mano-lateral`, strip, mini-cartas). |
| **Engine** | Sin cambios de reglas. El historial/log (`estado.log`) queda atado a la **partida**, no al imperio. |
| **Tests** | `ui-mano-lateral.spec.jsx` (nuevo, 4 tests) y `ui-plantillas-lateral.spec.jsx` (nuevo, 2 tests). `ui-esquematico.spec.jsx` (se verificó el test existente). |
| **Config** | `vite.config.js`: `testTimeout: 15000` (los renders de App completa superan el default de 5000 ms). |

---

## 3. Verificación

- `npm test`: **308/308** en verde (25 archivos, sin regresiones).
  - `ui-plantillas-lateral.spec.jsx`: muestra las 5 plantillas del ejército activo en el lateral
    y seleccionar una abre la ficha detallada.
  - `ui-mano-lateral.spec.jsx`: mini-cartas compactas, hover expande el preview con el coste,
    selección fija el preview con "Jugar como Orden", y la carta obligatoria deshabilita la mano.
  - `ui-esquematico.spec.jsx`: el tablero esquemático muestra letras de terreno sin decorado
    alto, con los 127 hexes y 10 unidades; al apagar el interruptor se restaura el decorado.
- `npm run build`: ✅ (81 módulos).
- Determinismo: sin cambios en el motor; el escenario de reproducción del feature lo verifica.
- Sin reglas 🟡 hardcodeadas: el toggle de tablero esquemático y el panel de reglas conmutables
  (D-24) son preferencias de UI que se leen de `estado.reglas`; las reglas no se movieron.

---

## 4. Nota sobre los timeouts de los tests de UI

Al crecer el tablero (radio 6, mundo con ~800 hexes, decorado alto), los tests que renderizan
`App` completa pasaron de ~3 s a >5 s en jsdom y reventaban el `testTimeout` por defecto
(5000 ms). Se subió `testTimeout` a 15000 ms en `vite.config.js`: los renders de App completa
son inherentemente pesados (SVG de ~1000 nodos en un DOM sin layout). No es un bug de render en
loop: los mismos tests de App que no abren el modal siguen pasando en ~700 ms–2 s.

---

## 5. Estado general del proyecto

| Área | Estado |
|---|---|
| Motor de reglas (11 épicas) | ✅ Completo y testeado |
| Decisiones 🟡 (D-01…D-27) | ✅ Todas en `src/data/rules.js`, leídas desde `estado.reglas` |
| Pantalla de partida en 3 columnas (roster/ficha izq., tablero, mano der.) | ✅ Implementado y testeado (esta sesión) |
| Tablero esquemático de playtest | ✅ Verificado (toggle en Ajustes → mismo tablero sin decorado) |
| Smoke manual en el navegador (DoD #2) | 🔲 Pendiente — `npm run dev` y verificar visualmente columnas y esquemático |

---

## 6. Archivos creados / modificados en esta sesión

| Archivo | Qué es |
|---|---|
| `src/ui/App.jsx` | Layout de 3 columnas; roster abierto por defecto; `esquematico` → `Board` |
| `src/ui/RosterPanel.jsx` | Strip de plantillas en la columna izquierda |
| `src/ui/HandPanel.jsx` | Mini-cartas + preview expandible/fijado en la columna derecha |
| `src/ui/UnitCard.jsx` | Ficha detallada en la columna izquierda (select con el roster) |
| `src/index.css` | Reglas de `plantillas-lateral` y `mano-lateral` (fuera del tablero) |
| `src/tests/ui-plantillas-lateral.spec.jsx` | Nuevo — 2 tests |
| `src/tests/ui-mano-lateral.spec.jsx` | Nuevo — 4 tests |
| `vite.config.js` | `testTimeout: 15000` para los rendés de App completa |
| `docs/features/UI-02.feature` / `UI-03.feature` | Sin cambios (los paneles se verifican a mano) |

---

## 7. Cómo reanudar

```
npm run dev
```

Queda pendiente el **smoke manual** en el navegador: (1) verificar que el roster y la ficha a la
izquierda y la mano a la derecha se ven y se usan bien sobre el mapa a pantalla completa; (2)
activar "Tablero esquemático" en Ajustes y confirmar que se recorta el decorado del mundo sin
perder los 127 hexes. Con eso la epica de "pantalla de partida" cierra su Definition of Done.