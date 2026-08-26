# Reporte de avances y estado actual — esperado vs construido

Fecha: **06/08/2026**
Alcance: estado del prototipo completo, con foco en la transformación visual de la sesión actual.
Verificación al cierre: `npm test` **251/251** (18 archivos) · `npm run build` ✅.

---

## 1. Resumen ejecutivo

El **motor de reglas del MVP está completo y testeado**: las 11 épicas del backlog están
implementadas y sus escenarios pasan como tests Vitest. La deuda que queda es **visual y de
acabado de interfaz**, no de reglas.

En esta sesión se ejecutó la transformación visual pedida en el brief de UI (campo de batalla,
sprites con sombras, HUD de pergamino/madera/oro, cartas con tacto físico) más la corrección de
escala a resolución/zoom variable. El motor no se tocó: `src/engine/` y `src/data/` quedaron
intactos y el determinismo se mantiene (misma semilla → misma partida).

Pendiente principal: **las imágenes de los sprites se ven desfasadas** (alineación/posición).
Se dejó así a pedido del dueño. Detalle en §5.

---

## 2. MVP de reglas: esperado vs construido

Esperado: las épicas 0–10 de `docs/BACKLOG.md` (§3), cada historia con sus escenarios en
`docs/features/*.feature` y su traducción a tests Vitest.

| # | Épica | Historia | Estado |
|---|---|---|---|
| 0 | Andamiaje | `00-andamiaje.feature` | ✅ Implementada y testeada |
| 1 | Tablero y geometría | `02-tablero.feature` | ✅ Implementada y testeada |
| 2 | Preparación | `01-preparacion.feature` | ✅ Implementada y testeada |
| 3 | Cartas y PO | `03-cartas-po.feature` | ✅ Implementada y testeada |
| 4 | Activación y acciones | `04-activacion-acciones.feature` | ✅ Implementada y testeada |
| 5 | Combate | `06-combate.feature` | ✅ Implementada y testeada |
| 6 | Estados | `07-estados.feature` | ✅ Implementada y testeada |
| 7 | Foco | `05-foco.feature` | ✅ Implementada y testeada |
| 8 | Técnicas | `08-tecnicas.feature` | ✅ Implementada y testeada |
| 9 | Ronda y victoria | `09-ronda-victoria.feature` | ✅ Implementada y testeada |
| 10 | Instrumentación | `10-instrumentacion.feature` | ✅ Implementada y testeada |

**Decisiones abiertas (D-01…D-24).** Todas viven en `data/rules.js` y se leen desde
`estado.reglas`. Cableado actual (auditoría del 04/08/2026, ver §7 del reporte anterior):

- **Cableadas y consumidas por el motor:** D-01, D-02, D-08 (`manoInicial`), D-10 y umbrales
  de D-13 (`explosion`, `explosionTope`, tope de cadena sustituido por nivel de Foco en D-17).
- **Declaradas pero sin consumir:** D-03, D-04, D-05, D-06, D-07, D-08 (`roboPorTurno`), D-09,
  D-11, D-12, D-13 (`explosionTopeCadena`), D-14, D-16…D-21, D-23, D-24.
- D-22 define que el panel US-091 expone **solo flags cableados**; se cablearon D-05, D-12 y
  `roboPorTurno` en esa iteración.
- 🟡 **Ninguna regla quedó hardcodeada en el motor** (DoD #5).

---

## 3. Transformación visual (sesión actual): esperado vs construido

Esperado (brief de UI): tablero protagonista, terreno texturizado, sprites con sombra, HUD de
pergamino/madera/oro, cartas con tacto físico, todo responsivo y sin tocar el motor.

### 3.1 Campo de batalla (Hito 1) ✅

| Esperado | Construido |
|---|---|
| Tablero protagonista, verde prado, con textura | `HexTile.jsx` con paleta VERDES `#5d7c3f/#557339/#6a8a48/#4f6b36`, bisel con gradiente `url(#terra)` (defs en `Board.jsx`), decorado determinista por hash (matas, guijarros, rocas/arbustos en bloqueados) |
| Estados del hex visibles | Overlays semitransparentes con `drop-shadow` por estado (rango/ataque/camino/marca) |
| Asistencia al movimiento y LoS | Flechas de ruta en modo mover + marcador terminal en línea de visión |
| Restricción de estructura SVG | Decorado solo con `<path>/<circle>/<line>`: el test `ui-smoke.spec.jsx` fija 61 `<polygon>` (tiles) y 10 `<g class="unit-token">` |

### 3.2 Unidades y sprites ✅

| Esperado | Construido |
|---|---|
| Sprites de facción (Fuego = Husky, Agua = Poodle), 16-bit | 12 PNG en `public/assets/units/` (500×500), registry `assets.js`, `assetUnidad` con mapeo A=Fuego/B=Agua y fallback mixto |
| Ficha compacta con lectura rápida | `UnitToken.jsx`: sprite 38×40, `BASE_Y 12`, anillo de facción `rx 11.5/ry 4.6`, indicadores 💫/🛡 en `−37`, glifo fallback `tamaño 1.25` |
| Vida legible | Barra de vida compacta (rect 24×3, verde/ámbar/rojo) reemplaza los pips |

### 3.3 Cartas, HUD y panels (Hito 3+) ✅

| Esperado | Construido |
|---|---|
| Cartas grandes con tacto físico | 78×108 estilo pergamino, borde elemental superior 4px, abanico (`margin-left: −16px`) |
| Coste de acciones legible | ActionMenu con medallón de coste PO; chips de PO con glow |
| Protagonismo de la lectura | Ficha, registro y combate con tipografía mayor; dados D10 grandes; roster colapsado por defecto; `viewBox="-288 -250 576 500"` |

### 3.4 Escala a resolución/zoom variable ✅

Problema diagnosticado: pantalla 1536×864 @ 96 DPI; a 25% de zoom el viewport es ~6144×3456 y
el HUD con `px` fijos quedaba pequeño frente al tablero SVG.

Solución: escala fluida en `src/index.css` —

```css
:root {
  --escala: min(calc(100vw / 1440), calc(100dvh / 810));
}
```

Toda la UI se convirtió a `calc(var(--escala) * Npx)` (portada, HUD, banners, roster, zonas,
footer, cartas, PO, ActionMenu, ficha, log, paneles flotantes, combate, media queries). El
tablero SVG llena su contenedor y ahora **todo el lienzo escala junto**. Base de calibración
elegida por el dueño: **1440×810**.

### 3.5 Visibilidad por turno (fichas y cartas del jugador activo) ✅

| Esperado | Construido |
|---|---|
| En turno de A solo se ven las fichas y cartas de A; en turno de B solo las de B | `App.jsx`: `unidadesVisibles = estado.unidades.filter(u => u.jugador === activo)` alimenta el `RosterPanel`; `UnitSheet` solo renderiza unidades propias |
| No confundir selección rival con propia | `UnitSheet.jsx`: tercer estado — *"Ficha rival oculta — seleccioná una de tus unidades"* |
| Contador coherente | `RosterPanel.jsx`: "N unidades en tu ejército" |
| Tablero intacto | 10 unidades siempre visibles; selección y apuntado sin cambios. La mano (`HandPanel`) ya era del jugador activo |

---

## 4. Criterios de terminado (DoD)

| # | Criterio | Estado |
|---|---|---|
| 1 | Escenarios pasan como test (salvo UI, que se verifica a mano) | ✅ 251/251 |
| 2 | Comportamiento verificable en navegador | ✅ con `npm run dev` |
| 3 | Motor determinista (misma semilla → misma partida) | ✅ sin cambios en el motor |
| 4 | Sin regresiones | ✅ 18 archivos de test, 251 tests |
| 5 | Ninguna regla 🟡 hardcodeada | ✅ todo en `data/rules.js` |

---

## 5. Deuda técnica y pendientes

1. ⚠️ **Sprites desfasados** — las imágenes de las unidades se ven desplazadas/desalineadas
   respecto del hex (pedido del dueño: dejarlo así por ahora). Candidato a corregir en la
   próxima sesión de calibración de tokens.
2. **Cartas sin pulido visual** — el abanico y el formato pergamino están, pero queda pendiente
   el "tacto físico" fino (bordes, sombra, hover) en un hito futuro.
3. **Panel US-091 parcial** — expone solo flags cableados (D-22); el resto de las decisiones 🟡
   queda documentado como no conmutable hasta cablearse.
4. **Verificación manual pendiente** — confirmar en navegador que al pasar el turno el roster y
   la ficha cambian de facción y las 10 unidades del tablero quedan intactas.
5. **Fase de despliegue** fuera del MVP (D-11: posiciones fijas del escenario base).

---

## 6. Cómo verificar en el navegador

```
npm run dev
```

- Tablero verde prado con decorado, 10 unidades con sprites de facción y barra de vida.
- Al pasar el turno: el roster lista solo la facción activa; seleccionar un rival muestra
  "Ficha rival oculta"; el tablero no cambia.
- Redimensionar/zoom: todo el lienzo (tablero + HUD + cartas) escala junto (`--escala` 1440×810).
