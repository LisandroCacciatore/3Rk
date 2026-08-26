# Informe técnico — Capa de UI del Motor de Escaramuza

Guía de handoff para una IA especializada en dar forma (estética/estilo) a la interfaz.
**Enfoque técnico**: cómo está generado hoy cada elemento de la UI, para que la IA entrante
pueda rediseñar lo visual sin romper arquitectura, determinismo ni los invariantes de test.

---

## 1. Stack y reglas absolutas

- **Stack**: Vite 6 + React 18.3 (JS plano, **sin TypeScript**) + Vitest 3 + Testing Library + jsdom.
- **Entrada**: `src/main.jsx` renderiza `<App />`. **StrictMode desactivado a propósito**: el RNG
  es un closure mutable en el estado y el doble render en dev avanzaría los dados dos veces,
  rompiendo el determinismo semilla+intenciones. NO reactivar StrictMode.
- **Regla de arquitectura (no negociable)**: `src/engine/` nunca importa UI; `src/ui/` puede
  importar engine/data pero **ningún `.jsx` puede calcular reglas** (costes, alcances, legalidad,
  resultados). Todo sale de selectores de `src/engine` vía el contrato `adapter.js`. Un componente
  que recalcule una regla es un bug de arquitectura.
- **Determinismo**: la UI no toma decisiones aleatorias; todo deriva del estado y la semilla. El
  terreno es función pura `(q, r, semilla)`. Misma semilla → misma partida y mismo mapa.
- **Filosofía playtest**: legibilidad del estado > estética. Todo lo que un jugador necesita en la
  mesa física debe estar visible **sin hacer clic**. Animaciones cortas y funcionales (feedback de
  eventos reales del motor, nunca reglas), sin cinemáticas, sin pantallas de carga.

---

## 2. Layout de la pantalla de partida (ASCII)

```
┌─────────────────────────────────────────────────────────────┐
│  Ronda 2 · Turno de A · Mano A:3 B:1 · Semilla playtest-01  │  TopHUD (encabezado, siempre visible)
├──────────────────────────────────────────┬──────────────────┤
│  ╭──────────────────────────────╮         │                  │
│  │  ┌────┐                      │ Ficha de la unidad        │
│  │  │ #Reí│  hexes  hexes  hex   │ seleccionada              │  .zone.tablero     │  .zone.aside
│  │  └────┘                      │  ├────────────────────────┤
│  │                              │  │ Registro de partida    │  LogPanel (scroll)
│  │  Tablero SVG (viewBox        │  │ (evento más reciente   │
│  │  cámara pan/zoom 150 hexes) │  │  abajo)                │  │
│  │   corona (anillo oscuro no   │  │  │                      │
│  │   jugable)                   │  │  v                      │  │
│  ╰──────────────────────────────╯         │                  │
├──────────────────────────────────────────┴────────────────────┤
│  PO Av ●  PO Bv ● │ Mano (abanico) │ Acciones │ Fin de turno │  .footer
└─────────────────────────────────────────────────────────────┘
```

Planos clave del layout (en `src/index.css`):
- `.app` = columna flex, `height: 100dvh`; `.top-hud` encabezado; `.app-main` flex fila con dos
  zonas `.zone.tablero` y `.zone.aside`; `.aside` ancho fijo `calc(--escala * 330px)`; `.footer`
  flex.
- El tablero es un único `<svg>` dentro de `.board-container`, que está dentro de `.zone.tablero`
  (flex centrado).
- `.zone` = panel con marco rústico; los paneles flotantes (modal de ataque, concentrar, habilidad,
  reflujo, reglas, simulación, replay, combate) se superponen sobre este layout.

---

## 3. Mapa del árbol `src/ui/`

### 3.1 Capa / contenedores y shell
- `App.jsx` (852 líneas) — **raíz y dueño de todo el estado** (estado del motor + estado de
  interacción UI), enruta portada/partida, despacha intenciones, arma los sets de resaltado del
  tablero, dispara sonido y screen-shake **solo a partir de eventos reales del log** del motor.
- `Portada.jsx` — pantalla de inicio (ESCARAMUZA) con las bandas de facción y el seed.
- `TopHUD.jsx` — bandas de estado por facción, ronda/turno, semilla, botones de control, load replay.
- `SeedInput.jsx` — input del seed (determinismo).
- `ReplayBar.jsx` — reproducción paso a paso (barra de progreso inline `style={{width}}`).

### 3.2 Tablero y mapa
- `Board.jsx` — un único `<svg>` con `viewBox` adaptado al aspect del contenedor y **cámara móvil**
  (pan & zoom con centrado al seleccionar y botón de reencuadre; ver UI-04.feature). Un `<g
  transform>` mueve mundo + tablero + overlays; la viñeta, la luz cenital y el fondo esquemático
  quedan fijos fuera del grupo. Dibuja en orden: `CapaMundo` (terreno cosmético por región),
  150 `<HexTile>`, flechas de movimiento (inline fill), anillo del Rey (`<circle
  class="rey-ring">`), línea de LoS (polyline verde/rojo), badge de coste de próxima acción, fichas
  de unidad, menú contextual, feedback de combate.
- `HexTile.jsx` — un hexrón: **exactamente UN `<polygon>`** (exterior) + bisel interior como
  `<path>` + decorado SVG + tile-imagen opcional (clipado con `<clipPath>/<path>`).
- `terreno.js` — **generador determinista de terreno por regiones** (río central con los dos vados
  como camino, caminos N-S por los vados, bosque NO, montaña SE, prado dominante, mar
  somero/profundo). Recibe `enTablero` para no pintar decorado fuera del tablero. Puramente
  presentacional; el motor no lo conoce (solo conoce `forma` + `bloqueados`).
- `terrenoVisual.jsx` — paletas, gradientes radiales (`terra-{tipo}`), `DecorTerreno` (árboles,
  olas, rocas, pasto, pétalos sakura). Todo decorado con `<path>/<circle>/<line>/<text>`, jamás
  `<polygon>`.
- `terrenoImagen.js` — tile PNG con **probe único por tipo** (cache de módulo, no 150 peticiones) +
  fallback al gradiente. Hook `assetTerreno(tipo)` con `useSyncExternalStore`.
- `fondo.js` — fondo del tablero `tablero.png` como `background-image` cover; fallback al gradiente
  marrón CSS de `.board-container`.
- `UnitToken.jsx` — ficha de unidad: sombra elíptica, anillo de facción, sprite `<image>` con
  `image-rendering:pixelated` + fallback a glifo `FormaArquetipo`, barra de vida por umbrales
  (66%/33%), slots de Foco, estados (Stunned/Muro como emoji `<text>`), animación de movimiento por
  `transition: transform`. `memo` con comparador profundo (`mismaUnidad`).

### 3.3 Paneles, sidebars, modales
- `UnitSheet.jsx` — ficha de unidad (atributos, Foco, técnicas, estados, activación). Atributos
  hardcodeados desde `perfil` + `unidad.heridas/maxVida`.
- `LogPanel.jsx` — registro de eventos (`estado.log`), auto-scroll solo si ya está cerca del fondo.
- `HandPanel.jsx` — mano de cartas con abanico `<path>` en CSS (`--rot`/`--baja`, `transform:
  rotate/translateY`); jugar como Orden o como Habilidad (D-24/25).
- `RosterPanel.jsx` — franjado de ejército plegable (tarjetas de unidad).
- `SettingsPanel.jsx` — reglas conmutables 🟡; cada cambio → `CAMBIAR_REGLAS`.
- `SimulationPanel.jsx` — simulación bot vs bot y telemetría agregada; reusa `sim/` (no motor).
- `ActionMenu.jsx` — botones de acción + técnicas de defensa (footer).
- `TechniquePicker.jsx` — selección de técnica de ataque con chips de coste de Foco.
- `CombatResult.jsx` — overlay de combate: pooling tirado, dados guardados con explosión
  (`"10+4"`), sumas, veredicto.
- `CombatFeedback.jsx` — popups flotantes sobre el tablero por **eventos reales del log**.
- `UnitContextMenu.jsx` — menú contextual SVG junto a la unidad (constantes de píxel fijas).
- `POBar.jsx` — chips de meta por elemento + total.

### 3.4 Adaptadores y helpers UI puros
- **`adapter.js` (156 líneas) — el contrato UI→∞**: única vía legítima para que la UI lea
  decisiones de juego. Expone: `faccionDeJugador`, `tecnicasDeTipo`, `declaracionTecnica`,
  `costeTecnicaTexto`, `obtenerTecnicasAtaque/Defensa`, `obtenerAcciones` (devuelve
  `{id,nombre,coste,habilitada,motivo}`), `hexesEnRango`, `objetivoEnRango`, `resumenDado`
  (parsea `"7"`/`"10+4"` → explosión), `descripciónStunned`, `ultimoEventoAtaque`.
- `elementos.js` — símbolo+color por elemento (🔥 Fuego, 💧 Agua, 🌪️ Aire, 🌍 Tierra, ◼️ Vacío) y
  etiquetas de estado. Elemento siempre **símbolo + color**, nunca solo color.
- `glifos.jsx` — `FormaArquetipo`, `CrestaFaccion`, `COLORES_JUGADOR` (A `#e94560` Fuego, B
  `#3498db` Agua).
- `assets.js` — registri de imágenes (`ASSETS_UNIDADES`, `ASSETS_CARTAS`) con fallback runtime
  `assetUnidad()/assetCarta()`. `ASSETS_ESTADOS` vacío/comentado.
- `sound.js` — WebAudio (no hay assets de audio): `sonidoDados`, `sonidoImpacto`, `sonidoCarta`,
  `sonidoFanfarria`, `desbloquearAudio()` (obligatorio en el primer gesto del usuario).

---

## 4. Cómo se genera el estado visual / la interacción

- **Fuente de verdad**: un solo `estado` en `App.jsx` (`crearEstadoInicial(semilla)`); cada
  interacción = `despachar({tipo,...})` → `aplicarIntención()` (engine) → nuevo estado inmutable →
  setState → re-render del árbol completo.
- **Contrato de acción**: `estado.jugadores` → mano/descarte/mazo/po; `estado.unidades` →
  `heridas/maxVida/foco/estados/activacionCerrada`; `estado.log` → [eventos,id,tipo,descripcion].
- **Sets de resaltado del tablero**: `movilesSet/objetivosSet/rangoSet/segundosSet/
  canalizadoresSet/objetivoHabSet/previewSet` derivados de los selectores del motor
  (`hexesMovibles`, `objetivosAtaque`, `canalizadoresHabilidad`, `objetivosHabilidad`, `hexEnRadio`).
- **Feedback derivado de eventos reales**: `flashIds`, `retrocesoIds`, `ultimoResumen`, `combate`,
  `screenShake` se computen difiriendo el log nuevo vs viejo dentro de `despachar`. La UI no inventa
  condiciones (p. ej. "explosión" se detecta por el formato `"10+4"` de los dados, no por una regla
  hardcodeada de la UI).

Los sets de resaltado y los handlers (`onUnitClick`, `onHexClick`) se guardan en **refs** y se
exponen con `useCallback` para evitar cierres obsoletos. Hay `Escape` global que resetea los modos.

---

## 5. Sistema de theming (`src/index.css`, 2031 líneas, un archivo)

- **Token fluido**: `--escala: clamp(0.75, min(calc(100vw / 1440px), calc(100dvh / 810px)), 1.25)`.
  *Todos* los tamaños van como `calc(var(--escala) * Npx)` para escalado proporcionado. Mantener
  esta convención al rediseñar.
- **Token UI**: fondo brown (`--bg-0..3`, `--madera1/2`), dorados (`--oro`, `--oro-b`), acentos
  facciones (`--fuego`, `--agua`), `--éxito`/`--alerta`, tipografías `--font-titulo` (Georgia) /
  `--font-ui` (Segoe UI).
- **Clases temáticas** por área: `.top-hud`, `.hud-*`, `.zone`, `.board-container`, `.aside`,
  `.footer`, `.roster-*`, `.unit-sheet`, `.foco-slot`, `.tecnica-fila`, `.log-{tipo}`,
  `.panel-flotante`, `.btn-*` (`.btn-jugar` verde, `.btn-cancelar` rojo, `.btn-habilidad` violeta,
  `.btn-fin-turno`), `.dado`, `.sim-*`, `.replay-*`.
- **Colores de elemento/facción**: se inyectan como custom properties **inline**
  (`--color-elem`, `--banda`, `--color-banda`, `--rot`, `--baja`) en los componentes (HandPanel,
  UnitSheet, RosterPanel, POBar, TechniquePicker, Portada, TopHUD), no vía tokens CSS centrales.
  Es el "truco temático" sancionado pero disperso — candidato a ordenar en un token store.
- **Responsive**: `@media (max-width:1280px)` y `(max-width:1000px)` (encogen aside, cartas y
  action-menu; en el más angosto las bandas del HUD se apilan).

---

## 6. Assets (`public/assets/`) y fallbacks

| Carpeta | Contenido | Fallback |
|---|---|---|
| `units/` | 12 sprites `fuego_*.png` / `agua_*.png`, 128px pixel art | glifo SVG (`FormaArquetipo`) |
| `cartas/` | 5 PNG por elemento (`fuego.png`, `agua.png`, `aire.png`, `tierra.png`, `vacio.png`) | cresta SVG (`CrestaFaccion`) |
| `fondos/` | `tablero.png` (≈16:9) | gradiente marrón CSS |
| `tierras/` | 8 tiles top-down hex (`prado`, `bosque`, `agua`, `montaña`, `camino`, `ruina`, `bloqueado`, `corona`) | gradiente + decorado SVG |

Cada uno usa un hook de probe único (`terrenoImagen.js`/`fondo.js`) con `useSyncExternalStore` +
cache de módulo; en jsdom el probe no resuelve → fallback (no rompe tests). Registros en
`src/ui/assets.js`. Guía completa de generación y prompts: `docs/assets-guia.md`.

---

## 7. Tests de UI e **invariantes que no deben romperse**

`src/tests/`:
- **`ui-smoke.spec.jsx`**:
  1. Los portada monta (ESCARAMUZA, FUEGO, AGUA, botón "Comenzar escaramuza").
  2. Al comenzar se muestra el HUD (`Motor de`, `/RONDA 1/`, `/Turno de/`, `/Semilla:/`).
  3. **`container.querySelectorAll('svg .hex-tile polygon').length === 150`** ← invariante crítico.
  4. **`svg .unit-token` count === 10** (ejercito desplegado).
  5. El panel de reglas se abre con sus checkbox/select.
  6. `CombatResult` renderiza dados, sumas (`= 21`) y la clase `.dado.exploto` para `"10+4"`.
- **`ui-assets.spec.jsx`**: mapeo de `assetUnidad` (Fuego/Peón → `fuego_peon.png`, `null` para no
  modelados); `UnitToken` dibuja `<image>` cuando hay sprite y **no** `<image>` (fallback glifo)
  para un arquetipo no modelado (Golem); conserva `.unit-token`, `.seleccionado`, `.token-ring`.

**Implicaciones concretas para quien toque la UI**:
- No agregar ningún `<polygon>` dentro de un `.hex-tile` (usar `<path>`/`<clipPath>`; ya es así en
  el bisel y el tile imagen). Rompería el test 150.
- No cambiar el criterio de los estados (se distinguen por **símbolo+color**, nunca solo color).
- No introducir reglas/cálculos de juego en la UI.
- No reactivar StrictMode.
- Respetar `--escala` para todo tamaño.

---

## 8. Candidados de refactor / deudas técnicas (encarables por la IA de UI)

- **Constantes SVG en píxeles fijos** no escaladas por `--escala`: `UnitContextMenu.jsx`
  (`ANCHO=92`, `ITEM_ALTO=18`, `BORDE_X=288`/`BORDE_Y=250`) y varios `font-size` hardcodeados en el
  espacio SVG (líneas ~680–886 del CSS).
- **Mojibake en `index.css`**: al menos dos comentarios con caracteres ilegibles
  (`… Simulaci?s y telemetr?a …` ~1843, `… Barra de replay poner btn …` ~2000). Encoding mixto;
  normalizar a UTF-8.
- **Inline styles dispersos**: `backgroundImage` del tablero (fondo), `transform/animationDelay`
  en dados y popups, `style={{cursor:'pointer'}}` en hexes, barras de progreso con `style={{width}}`.
- **Colores de elemento inline** vs token store (sección 5).
- **Gradientes de botones hardcoded** (p. ej. `#2d5a3a`, `#5a2a35`) en vez de tokens.

---

## 9. Reglas de oro para la IA entrante

1. **La UI pinta y dispara; el motor decide.** Nunca inventar una mecánica visual que el log/estado
   no emita; si falta soporte de motor para algo visual, marcar `BLOCKED` y no simularlo.
2. Sin reglas nuevas desde la UI; todo decisión sale de `src/engine` vía `adapter.js`/selectores.
3. Mantener **determinismo**: sin RNG en la UI, sin StrictMode.
4. Mantener **invariantes de test** (150 `<polygon>`, 10 `.unit-token`).
5. Usar **`--escala`** para todo tamaño; visual de SVG coherente con el escalada base.
6. **Accesibilidad / arrastrar y soltar / temas**: preguntar antes de construir (fase actual no lo cubre).
7. Documentación de fuente: `docs/assets-guia.md` (arte+prompts), `docs/BACKLOG.md`, y la skill
   `.claude/skills/ui-tablero-hex` (convenciones de UI del prototipo).