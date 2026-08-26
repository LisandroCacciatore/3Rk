---
name: estilo-mapa-tactico
description: Convenciones para el mapa del prototipo en estilo Fire Emblem GBA — asignación de terreno determinista por semilla (src/ui/terreno.js), paleta por tipo de terreno, decorado SVG permitido (nunca <polygon> extra por tile), solape de los estados funcionales por encima del terreno y convención para tile art PNG futuro. Usar al crear o modificar el mapa, el terreno o el render del tablero en src/ui.
---

# Mapa estilo Fire Emblem GBA

## Qué es esta capa

El terreno del mapa es **100 % presentacional**. El motor de reglas (`src/engine/`,
`src/data/rules.js`) no conoce ni `prado` ni `bosque` ni `agua`: solo ve hexes normales y
`bloqueados`. Esta capa existe para que el tablero se lea como un **mundo pintado** (tipo
Fire Emblem GBA FE7/FE8) y no como una hoja de ajedrez.

Referencia de estilo: tiles 2D pintados top-down con rejilla, paleta cálida, unidades con
sombra paradas sobre el tile, borde del mapa con terreno no jugable. Coherente con el pixel
art 16-bit de las unidades (`docs/assets-guia.md`).

## Regla que no se negocia

- **El terreno no cambia reglas.** Nada de "el agua cuesta movimiento extra" ni "el bosque
  da cobertura". Si un día el terreno pasa a ser regla, eso vive en el motor y en
  `src/data/rules.js`, no acá.
- **Determinismo.** El terreno es función pura de `(q, r, semilla)`: misma semilla → mismo
  mapa. Nunca usa RNG ni estado.
- **Los estados funcionales mandan.** Alcanzable, rango, objetivo, seleccionado, amenaza,
  bloqueado se pintan **encima del terreno** con tinte translúcido + stroke + símbolo. El
  terreno nunca compite con la legibilidad del estado (nunca solo color).

## `src/ui/terreno.js`

- `terrenoDe(q, r, semilla, bloqueado)` → uno de `TIPOS_TERRENO`:
  `prado | bosque | agua | montaña | camino | ruina | bloqueado` (`corona` solo como etiqueta
  visual de los hexes del borde, se pasa directo desde `Board.jsx`).
- `bloqueado = true` devuelve siempre `'bloqueado'` (respeta `estado.tablero.bloqueados`).
- Distribución **de mapa**, no ruido: camino central con meandro por columna, parches de
  bosque alrededor de centros derivados de la semilla, ruinas dispersas en tierra firme, y
  borde del mundo (d ≥ 3) con sector angular que rota con la semilla (el mar "entra" por un
  lado distinto en cada partida).

## `src/ui/terrenoVisual.jsx`

- `TERRENOS[tipo].fill`: paleta de tonos para el relleno base (el `tono(q, r, paleta)` elige
  uno por hashing de coordenada).
- `TERRENO_GRADIENTES[tipo]`: stops del `radialGradient` del bisel (`#terra-<tipo>`), que
  `Board.jsx` declara en los `defs` del `<svg>`.
- `DecorTerreno({ tipo, q, r, cx, cy })`: decorado determinista por tipo (árboles, olas,
  pico, camino, ruinas, matas/pétalos).

## Reglas de render SVG

- **Un solo `<polygon>` por tile** (el hex) + el `<path>` del bisel. Los tests históricos de
  la UI cuentan polígonos. Todo decorado usa `<path>/<circle>/<line>/<text>/<image>`, nunca
  `<polygon>` extra.
- El bisel interior se rellena con `url(#terra-<tipo>)` en estado normal/bloqueado; con un
  estado funcional activo el tile pasa a overlay translúcido (igual que antes del terreno).
- El decorado vive **detrás** de las unidades (las capas del tablero no cambian: terreno →
  resaltados → unidades → marcadores → overlay LoS).
- La corona del tablero (hexes a distancia `radio + 1`, no jugables) se dibuja en
  `Board.jsx` como `<path className="hex-corona">` (nunca `<polygon>` ni con la clase
  `hex-tile`): así no rompe el test que cuenta los 61 `.hex-tile polygon` del escenario
  base. Da el borde de "mundo" que falta cuando el tablero flota sobre un panel.

## Tile art PNG futuro

Si algún día se genera arte por IA (guía en `docs/assets-guia.md`, sección "Mapa y UI"):

- PNG 128×128 transparente por tipo, registrado en `src/ui/assets.js`, dibujado con
  `<image href>` dentro del hex con `clipPath #hex-clip` (ya existe en `Board.jsx`).
- El mecanismo de swap no cambia `terrenoDe()`: el tipo de terreno sigue siendo la única
  fuente de verdad visual.

## Lo que NO se hace

- Animar el terreno (sin brisa, sin agua en movimiento): la fase UI-02 solo permite
  feedback corto ligado a eventos reales del motor, y respeta `prefers-reduced-motion`.
- Hacer que el terreno sea clickeable o despache intenciones: solo pinta.
- Meterse en `src/engine/`, `src/data/` o las reglas de estado del hex.
