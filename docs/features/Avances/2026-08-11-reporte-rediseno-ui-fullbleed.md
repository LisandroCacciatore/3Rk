# Reporte de avances y estado — 11/08/2026 (rediseño UI: mapa full-bleed + abanico + ficha)

**Fecha:** 11/08/2026
**Alcance:** rediseño de la pantalla de partida estilo Fire Emblem — tablero a pantalla completa
sin laterales, mano de cartas en abanico (inferior-centro) y ficha de unidad flotante
(inferior-izquierda) con retrato, clase y barra de vida; sprites ~20% más grandes.
**Verificación al cierre:** `npm test` **310/310** (25 archivos) · `npm run build` ✅ (80 módulos) ·
motor determinista: solo cambió `src/ui/` y `src/index.css`, `src/engine/` y `src/data/` intactos.

---

## 1. Resumen ejecutivo

La pantalla de partida dejó de ser un "cajón" de 3 columnas con sidebar de Ejército a la
izquierda y mano a la derecha:

1. **Mapa a pantalla completa.** `.app-main` ya no es un flex de columnas: el mundo SVG
   (Fire Emblem GBA) ocupa todo el alto disponible bajo el HUD, sin marcos ni barras laterales.
   El roster (RosterPanel) se **eliminó por completo** (decisión).
2. **Mano en abanico (abajo al centro).** Las 5 cartas del jugador activo se superponen en
   abanico sobre el borde del tablero; el **hover eleva y escala** la carta activa mostrando su
   arte, coste y descripción; el **click la fija** con "Jugar como Orden"/"Jugar como Habilidad".
   La carta obligatoria deshabilita el abanico. El PO disponible queda como chip junto al abanico.
3. **Ficha de unidad flotante (abajo a la izquierda).** Aparece al **seleccionar o hacer hover**
   sobre una unidad **propia** (las del rival no abren ficha, decisión). Incluye **retrato**
   (el sprite del mapa recortado en un marco, fallback glifo), **nombre + clase (arquetipo) +
   facción**, **barra de HP** con proporción y números, y la grilla compacta de stats
   (Mov./Atk./Def./Rango/Vida/Foco) más Foco slots, técnicas, estados y acciones.
4. **Sprites ~20% más grandes.** `spritePlacement` normaliza el alto visible a ~50px (antes 42);
   pies anclados igual, crece hacia arriba. Fila de indicadores (cresta, Foco, estados) y el
   badge de coste suben para no chocar con la cabeza del sprite.

El tablero **esquemático** (Ajustes) y el panel de reglas conmutables (D-24) se conservan.

---

## 2. Cambios por capa

| Archivo | Qué es |
|---|---|
| `src/ui/App.jsx` | Layout sin laterales (`.app-main` = solo el tablero + overlays). Ficha por selección **o hover** de unidad propia (`unidadFicha`); rivales no abren ficha. Mano directa como `HandPanel`. Eliminados `RosterPanel`, `rosterAbierto`, `unidadesVisibles`. |
| `src/ui/UnitSheet.jsx` | `RetratoUnidad` (sprite recortado con `assetUnidad`+`spritePlacement`, fallback glifo) + `BarraVida` (HP con proporción); cabecera con "Clase {arquetipo}". |
| `src/ui/HandPanel.jsx` | Reescrito como abanico `.mano-fan` con cartas `.carta-fan` rotadas (leve arco); hover eleva/escala; preview `.carta-abanico-preview` con arte+coste+descripción; click fija con botones de jugar; `POBar` en chip `.mano-abanico-cab`. |
| `src/ui/sprites.js` | `ESCALA_SPRITE = 1.19` sobre `escala` (alto normalizado ~50px). |
| `src/ui/UnitToken.jsx` | Indicadores de cabeza suben (`cabezaY -30→-44`; emojis de estado -37→-52). |
| `src/ui/Board.jsx` | Badge de coste sube a `c.y - 48` (sprites más altos). |
| `src/index.css` | `.app-main`/`.tablero` full-bleed; `.unit-card-flotante` absoluta abajo-izquierda; bloque del abanico; `.fich-retrato*` y `.fich-hp*`; **eliminados** los bloques de roster, columnas y mini-cartas. |
| `src/ui/RosterPanel.jsx` | **Eliminado** (roster fuera del alcance). |
| Tests | `ui-ficha-flotante.spec.jsx` (nuevo, 4) y `ui-mano-abanico.spec.jsx` (nuevo, 4); **borrados** `ui-plantillas-lateral.spec.jsx` y `ui-mano-lateral.spec.jsx`. |

---

## 3. Verificación

- `npm test`: **310/310** en verde (25 archivos, sin regresiones).
  - `ui-ficha-flotante`: la ficha aparece al seleccionar/hover una unidad propia (stats +
    "Vida x/y" + retrato, sin `.roster-card`), no aparece con unidades rivales, se cierra con ✕.
  - `ui-mano-abanico`: 5 cartas en el abanico, hover eleva y muestra "(N) PO (Orden)" con
    descripción, click fija "Jugar como Orden", la carta obligatoria deshabilita el abanico sin
    preview.
  - `ui-smoke` y `ui-esquematico`: siguen en verde (127 hexes, 10 unidades, esquemático con
    letras de terreno).
- `npm run build`: ✅ (80 módulos).
- Determinismo: sin cambios en `src/engine/` ni `src/data/` (misma semilla → misma partida).
- Sin reglas 🟡 hardcodeadas: solo presentación; reglas y toggles viven en `estado.reglas`.

---

## 4. Decisiones aplicadas (confirmadas con el usuario)

1. **Roster eliminado por completo** — full-bleed; la ficha aparece al seleccionar/hover.
2. **Solo unidades propias abren ficha** (las del rival quedan ocultas).
3. **Sprites ~20% más grandes** (alto normalizado 42→50px).

---

## 5. Estado general del proyecto

| Área | Estado |
|---|---|
| Motor de reglas (11 épicas) | ✅ Completo y testeado |
| Decisiones 🟡 (D-01…D-27) | ✅ Todas en `src/data/rules.js`, leídas desde `estado.reglas` |
| Pantalla full-bleed tipo FE (mapa completo sin laterales) | ✅ Implementado y testeado (esta sesión) |
| Mano en abanico inferior-centro con hover | ✅ Implementado y testeado (esta sesión) |
| Ficha flotante con retrato, clase, barra de HP y stats | ✅ Implementado y testeado (esta sesión) |
| Tablero esquemático de playtest | ✅ Conservado (toggle en Ajustes) |
| Smoke manual en el navegador (DoD #2) | 🔲 Pendiente — `npm run dev` |

---

## 6. Cómo reanudar

```
npm run dev
```

Smoke manual pendiente: (1) el mapa a pantalla completa sin laterales; (2) hover/click en
unidades propias → ficha con retrato, HP y stats abajo a la izquierda; (3) el abanico de cartas:
hover que eleva la carta y preview con coste/descripción, click que fija "Jugar como Orden"; (4)
perspectiva de los sprites más grandes sobre el tile sin perder legibilidad de indicadores.