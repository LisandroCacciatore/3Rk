# Backlog de User Stories (Gherkin) — MVP Motor de Escaramuza

Documento operativo para que un modelo genere el prototipo **historia por historia**.
Fuentes: `Memoria_Maestra_Diseño_Juego.md` (GDD) y `Alcance_Funcional_MVP.md` (FR).

---

## Estado al 12/08/2026

- **Motor y UI del MVP completos**: **405/405 tests en verde**, `npm run build` OK. Épicas 0–12 +
  D-26 (Lugar) + D-27 (habilidades de carta) + D-28 (agua) + **D-29…D-35** (terreno por tile +
  victoria por objetivos) + **D-36 (Río Tajii)** + **US-170/US-171/D-37/D-38** implementadas.
- **Terreno por tile (cerrado):** `reglasTerreno` en `data/rules.js` da reglas reales a la matriz
  de biomas (`costeExtra` al mover, `modAtacante` al atacar). Puente = cruce libre, empalizada v1
  no direccional (+1 movimiento / −1 dado). Spec en desarrollo; tests `reglas-terreno.spec.js`.
- **Victoria por objetivos (cerrado):** `objetivos.js` con `estado.marcador`, metas (+1 baja / +2
  puente / +2 cruce) y umbral 6 o ronda 10 con desempate por Rey vivo. La eliminación/Rey siguen
  ganando al instante. Tests `victoria-objetivos.spec.js`.
- **Inventario de producción (cerrado, 12/08/2026):** `docs/Inventario_Produccion.md` traduce el
  estado real del motor a spec de producción (digital React/SVG + prototipo físico): **12 miniaturas
  (2 por arquetipo, una por bando)**, **4 facciones jugables** (Fuego/Agua/Tierra/Aire) y **60 cartas
  (4 mazos de 15)**, kit de tiles = máximo por símbolo sobre los 6 escenarios con matriz (**48🌲 /
  28⛰️ / 31🌊 / 2🌉 / 1🌁 / 2🪵** sobre tapete pradera 15×10) y auxiliares con decisiones 🟡 de
  producción. Verificación anti-deriva en `src/tests/inventario-produccion.spec.js`.
- **US-170 — Facción = 4 habilidades activas (cerrado, 12/08/2026; D-37 firme):** la asimetría de
  banda vive en el mazo, no en la plantilla. Cada una de las 4 facciones declara exactamente 4
  cartas (de sus 15) con habilidad activa (`habilidadesActivas` en `factions.js`); el resto nace sin
  habilidad. Todas referencian `HABILIDADES_POR_CARTA` (D-27 sigue: habilidad de la carta, sin gate
  de rol). Spec: `docs/features/18-facciones-habilidades.feature`, tests
  `facciones-habilidades.spec.js`.
- **US-171 — Despliegue simétrico estilo ajedrez (cerrado, 12/08/2026; D-38 firme):** **6 unidades
  por bando = 12 en mesa**, cada bando con los 6 arquetipos exactamente una vez (Rey·Campeón·Alfil·
  Torre·Caballo·Peón). Sustituye el 5+5 de D-11; ubicaciones fijas por escenario en `scenarios.js`
  y `state.js`. Spec: `docs/features/19-despliegue-ajedrez.feature`, tests
  `despliegue-simetrico.spec.js`.
- **M3 — Mapa (cerrado):** escenario base rect **15×10 (150 hexes)** con río central y dos vados,
  bloques de bosque/montaña, 3 lugares y despliegues A/B (6+6, D-38). Spec: `docs/features/13-escenario.feature`.
- **Plantillas de mapa (5, cerradas):** Valle de los Dos Vados, Garganta del Dragón, Encrucijada de
  los Tres Carriles, Ruinas del Bastión y Humedales del Sur — matrices 15×10 en
  `src/data/scenarios.js`, con terreno visual por matriz y conectividad A↔B verificada por BFS en
  `src/tests/plantillas.spec.js`. El agua vive en `tablero.bloqueaMovimientoSinLos` (impasable,
  LoS abierto salvo flag `aguaBloqueaLoS`).
- **Cámara móvil (cerrada):** pan & zoom con centrado al seleccionar y botón de reencuadre (⛶).
  Pura presentación, sin tocar reglas. Spec: `docs/features/UI-04.feature`.
- **UX de turno (cerrada):** auto-pase (0 PO / sin cartas) con guardas (sin Reflujo pendiente, sin
  "Mover gratis" sin usar, no en replay), cartel efímero "FIN DE TURNO" que se cierra solo o con
  clic/Escape, y **handoff de pantalla compartida** (mano a mano, ON por defecto, toggle en
  Ajustes): al cambiar de jugador (A↔B) un overlay opaco bloquea el tablero y la mano hasta tocar
  "Comenzar mi turno". Solo UI (`App.jsx`, `CartelTurno.jsx`, `HandoffTurno.jsx`): el motor sigue
  explícito (`TERMINAR_TURNO`) y las simulaciones no cambian. Tests:
  `ui-auto-pase`, `ui-cartel-turno`, `ui-handoff`.
- Reportes: `docs/features/Avances/2026-08-11-reporte-m3-mapa-camara.md` y anteriores en el mismo
  directorio.
- **Portada con preview de mapa (cerrado, 12/08/2026):** la portada muestra una previsualización
  esquemática del escenario seleccionado (`MapaPreview.jsx`): color plano + letra de terreno y ✕ en
  bloqueados, determinista (matriz fija o terreno por semilla). Pura presentación: los polígonos
  usan la clase `mapa-preview` y no tocan el invariante `.hex-tile` del tablero. Test:
  `ui-mapa-preview.spec.jsx`.
- **Mundo oculto en la partida (presentación, 12/08/2026):** el "mundo" (isla + océano alrededor de
  los hexes jugables, UI-04) queda oculto; el mapa descansa sobre un piso plano oscuro
  (`fondo-tablero`). Constante `OCULTAR_MUNDO` en `Board.jsx` (revertible a false). El motor no
  cambia. Test: `ui-sin-mundo.spec.jsx`.

---


## 1. Stack recomendado

| Capa | Elección | Por qué |
|---|---|---|
| Lenguaje | **JavaScript (ES2022, módulos)** | Sin compilación de tipos, sin backend. El juego es 100% cliente: no hay nada que Python resuelva mejor y sí obliga a montar servidor. |
| Motor de reglas | **JS puro, funciones puras, sin dependencias** | El motor no sabe que existe el DOM. Recibe `estado` + `intención` y devuelve `estado nuevo`. Esto hace que cada escenario Gherkin sea un test directo. |
| UI | **React 18 + Vite** | Un juego es "estado → repintar todo". React elimina la manipulación manual del DOM, que es donde un prototipo hecho por partes se vuelve inmantenible. Vite arranca con `npm create vite` y no pide configuración. |
| Tablero | **SVG inline** (no canvas) | Cada hexágono es un `<polygon>` con `onClick`. Debug visual trivial, accesible, y no hay que programar hit-testing. Canvas solo valdría la pena con cientos de piezas animadas. |
| Estilos | **CSS plano + variables** | 6 arquetipos y 5 elementos no justifican Tailwind ni una librería de componentes. |
| Tests | **Vitest** | Misma sintaxis que Jest, cero configuración con Vite. Cada `Escenario` de este backlog se traduce 1:1 a un `it()`. |
| Estado global | `useReducer` + Context | Nada de Redux/Zustand: el reducer llama al motor y listo. |

**Descartados a propósito:** TypeScript (fricción alta para prototipo desechable), Python/Flask (obliga a servidor para un juego local), Phaser/PixiJS (motor de sprites innecesario para un tablero por turnos), Cucumber.js (el parser de Gherkin agrega ceremonia; los `.feature` acá son *especificación*, y los tests se escriben a mano en Vitest).

> Si preferís **cero instalación** (abrir un `index.html` y jugar), la alternativa es el mismo diseño sin React: módulos ES nativos + una función `render(estado)` que reescribe el SVG. Funciona, pero a partir de la Épica F (combate + técnicas) el repintado manual empieza a generar bugs de sincronía. La recomendación firme es Vite + React.

---

## 2. Arquitectura de archivos (contrato para el modelo)

Regla de oro: **`/engine` no importa React ni toca el DOM. `/ui` no contiene reglas de juego.**
Si una historia necesita una regla, va al motor; si necesita mostrarla, va a la UI.

```
src/
  engine/
    hex.js          # coordenadas axiales, vecinos, distancia, línea, LoS
    dice.js         # RNG con semilla, tirada XgY, explosión
    state.js        # createGame(), selectores, clonado inmutable
    cards.js        # mazo, robo, descarte, rebarajado
    po.js           # generación y gasto de Puntos de Orden
    actions.js      # mover / atacar / interactuar / concentrarse + contador 1-3-5-9
    focus.js        # reserva de tokens, coste escalonado
    combat.js       # resolución de ataque
    techniques.js   # catálogo y aplicación de efectos
    status.js       # Stunned
    round.js        # turnos, fin de ronda, condiciones de victoria
    log.js          # registro estructurado de eventos
    index.js        # única API pública: aplicarIntencion(estado, intencion)
  data/
    archetypes.js   # los 6 perfiles del GDD §13
    factions.js     # bandas y mazos
    techniques.js   # catálogo GDD §14
    scenarios.js    # mapa base, hexágonos bloqueados, despliegue
    rules.js        # flags de reglas en testing (ver §5)
  ui/
    App.jsx  Board.jsx  HexTile.jsx  UnitToken.jsx
    HandPanel.jsx  POBar.jsx  UnitSheet.jsx  ActionMenu.jsx
    TechniquePicker.jsx  LogPanel.jsx  SettingsPanel.jsx
  tests/
    <modulo>.spec.js
```

**Forma del estado** (referencia, el modelo puede afinarla en US-000):

```js
{
  semilla, rng, ronda, turnoDe, faseTurno,
  // Tablero: forma (rect 15×10 en el escenario base) + datos del escenario.
  // El terreno es cosmético (src/ui/terreno.js); el motor solo conoce estos.
  tablero: { forma: { tipo: 'rect', columnas, filas } | { tipo: 'hex', radio },
             bloqueados: ["q,r"], lugares: [{ q, r }] },
  jugadores: {
    A: { faccion, mazo:[], mano:[], descarte:[], po:[{elemento,cantidad}] },
    B: { ... }
  },
  unidades: [{ id, jugador, arquetipo, pos:{q,r}, heridas, foco:[], estados:[],
               accionesEsteTurno, activacionCerrada }],
  log: [], ganador: null
}
```

---

## 3. Orden de implementación

Está pensado para que **siempre haya algo jugable en pantalla**. No saltear épicas.

| # | Épica | Archivo | Qué queda funcionando al terminarla |
|---|---|---|---|
| 0 | Andamiaje | `00-andamiaje.feature` | La app abre y muestra un estado inicial. |
| 1 | Tablero y geometría | `02-tablero.feature` | Hexágonos clickeables, distancia y LoS calculadas. |
| 2 | Preparación | `01-preparacion.feature` | Dos bandas desplegadas, moneda, manos repartidas. |
| 3 | Cartas y PO | `03-cartas-po.feature` | Jugar carta genera PO visibles. |
| 4 | Activación y acciones | `04-activacion-acciones.feature` | Mover unidades gastando PO. **Primer loop jugable.** |
| 5 | Combate | `06-combate.feature` | Atacar, heridas, muerte. Partida ganable. |
| 6 | Estados | `07-estados.feature` | Stunned operativo. |
| 7 | Foco | `05-foco.feature` | Tokens elementales acumulables. |
| 8 | Técnicas | `08-tecnicas.feature` | Payoff del Foco. |
| 9 | Ronda y victoria | `09-ronda-victoria.feature` | Partida completa de principio a fin. |
| 10 | Instrumentación | `10-instrumentacion.feature` | Semilla, log exportable, panel de reglas 🟡. |

> El combate va **antes** que el Foco a propósito: es la pregunta de playtest más riesgosa (¿el Roll & Keep da tensión?) y no depende de las Técnicas para probarse.

---

## 4. Cómo alimentar al modelo (plantilla)

Una historia por conversación o por turno. No mandar el backlog entero.

```
Contexto: prototipo web del "Motor de Escaramuza".
Stack: Vite + React 18 + JS puro. Motor de reglas separado de la UI (ver ARQUITECTURA).
Estado actual del repo: [pegar árbol de archivos o los archivos relevantes]

Implementá SOLO esta historia:
[pegar la Característica + Escenarios del .feature]

Requisitos de entrega:
1. Código completo de los archivos nuevos o modificados (no diffs parciales).
2. Un test Vitest por cada Escenario, con el mismo nombre del Escenario.
3. Ninguna regla de juego dentro de componentes React.
4. Si un Escenario es ambiguo, PREGUNTAR antes de inventar; no improvisar reglas.
5. Al final: lista de qué archivos tocaste y cómo verificarlo en pantalla.
```

---

## 5. Decisiones abiertas (resolver antes de codificar la épica que las toca)

El GDD las deja marcadas 🟡. Acá van con un **valor de arranque** para que el modelo no invente en silencio. Todas viven en `data/rules.js` y son conmutables desde el panel de ajustes (US-091).

| ID | Pregunta | Arranque propuesto | Toca |
|---|---|---|---|
| D-01 | ¿Los tokens de Foco persisten entre rondas? | **Sí, persisten** | FR-024 / US-044 |
| D-02 | ¿Concentrarse consume además un paso del contador 1/3/5/9? | **No** (el coste del token *es* el coste) | FR-025 / US-041 |
| D-03 | ¿Cuándo se declara una Técnica? | Junto con la acción Atacar, antes de tirar | FR-073 / US-073 |
| D-04 | ¿El coste escalonado del token depende de tokens ya guardados o comprados este turno? | **De los ya guardados en reserva** | FR-021 / US-041 |
| D-05 | ¿El contador de acciones 1/3/5/9 se reinicia por turno o por ronda? | **Por turno** (los PO tampoco persisten) | FR-036 / US-031 |
| D-06 | ¿Qué pasa si el atacante no puede retroceder (hex ocupado/bloqueado/borde)? | Se queda en su hex, igual queda Stunned | FR-053 / US-054 |
| D-07 | ¿Cuál es el hex "de atrás"? | El opuesto a la dirección del defensor; si está tomado, el vecino libre más lejano al defensor | FR-053 / US-054 |
| D-08 | Tamaño de mano inicial y robo por turno | Mano de **5**; robo por turno **0** (aprobado 05/08/2026: cada jugador gasta sus 5 cartas y la ronda termina con ambas manos vacías) | FR-004 / US-005 |
| D-09 | ¿Qué pasa al terminar la ronda? | Se rebaraja el descarte, se roba mano nueva de 5 | FR-092 / US-082 |
| D-10 | ¿Stunned puede bajar el pool a 0? | Mínimo 1 dado siempre | FR-080 / US-060 |
| D-11 | Despliegue inicial | Posiciones fijas del escenario base (sin fase de despliegue en MVP) | FR-002 / US-003 |
| D-12 | ¿El defensor puede quedar Stunned? | No: perder la defensa solo cuesta la herida | FR-052 / US-053 |
| D-13 | Umbrales de explosión de los dados y tope de cadena | Por defecto 10, con Explosión 9, tope 20 | US-074 / US-091 |

> **Estado de cableado (auditoría Etapa 1, 04/08/2026).** El motor lee de `estado.reglas`:
> D-01, D-02, D-08 `manoInicial`, D-10 y los umbrales de D-13. El resto está **declarado en
> `data/rules.js` pero ningún módulo lo consume todavía**: D-03 `declaracionTecnica`, D-04
> `costeEscalonadoBase`, D-05 `reinicioContador`, D-06 `retrocesoImposible`, D-07 `hexDeAtras`,
> D-08 `roboPorTurno`, D-09 `finDeRonda`, D-11 `despliegue`, D-12 `defensorNoQuedaStunned` y
> D-13 `explosionTopeCadena`. Un panel US-091 que los exponga hoy no tendría efecto. Detalle en
> `docs/features/Avances/2026-08-04-reporte-trabajo.md` (§7).

### 5.1 Decisiones nuevas aprobadas (D-14…D-24)

Aprobadas por el dueño el 04/08/2026 (ver `docs/features/Avances/2026-08-04-reporte-trabajo.md` §7).
Los valores quedan fijados acá y pasan a `data/rules.js` en la implementación. D-17 **modifica el
tope de cadena fijo (20) de D-13**: el tope pasa a ser el nivel de Foco.

| ID | Historia | Decisión aprobada | Impacto en código |
|---|---|---|---|
| D-14 | US-078 | Disipar anula la técnica defensiva activa si la hay; si no, reduce 1 dado guardado (mín 1). Nunca ambos efectos. | `combat.js` + tests |
| D-15 | US-078 | Disipar entra en este ciclo (prioridad @could). | tests + UI |
| D-16 | US-077 | Resolución en dos pasos: `estado.combatePendiente` + intención `REFLEJAR_DADOS`. RNG solo se consume dentro de intenciones. | `index.js`, `combat.js`, estado |
| D-17 | US-077 | Un dado que explotó puede repetirse hasta **nivel de Foco** veces: con Foco 2, un 10 se repite 2 veces (2ª tirada); si la 2ª vuelve a ser 10 se repite 1 vez más (3ª); si la 3ª es 10, ya no se repite. Tope = nivel de Foco (sustituye el 20 fijo de D-13). | `combat.js`, `dice.js`, `rules.js` |
| D-18 | US-085 | Canal genérico de activación gratuita **sin disparador** en el MVP; explosión de dados como disparador queda a futuro. | `actions.js`, `index.js` |
| D-19 | US-085 | El ataque gratuito **no cuenta en el contador 1/3/5/9**: es un ataque extra accesible ocasionalmente (habilidades, cartas jugadas). No consume PO. Cierra igual la activación al terminar la acción. Flag en la intención `{ gratuita: true }`. | `actions.js`, `index.js`, log |
| D-20 | US-090 | `estado.secuencia` con `{ tipo, jugador, ...payload }` por intención aplicada. | `index.js`, estado |
| D-21 | US-090 | Export JSON `{ semilla, reglas, secuencia }` + `metrics.js` de motor que lee el log. | nuevo `metrics.js`, UI |
| D-22 | US-091 | El panel expone solo flags cableados; se cablean D-05, D-12 y `roboPorTurno`; el resto queda documentado como no conmutable. | `rules.js`, `actions.js`, `round.js`, `index.js` |
| D-23 | US-091 | Flag `stunnedReduceKept` (por defecto `false`); si `true`, Stunned resta 1 al keep (mín 1). | `status.js`, `rules.js` |
| D-24 | US-091 | Cambio en caliente vía intención `CAMBIAR_REGLAS` con validación y evento de log (ronda/turno). | `index.js`, `SettingsPanel.jsx` |
| D-25 | US-160/161 | Las cartas pueden jugarse como **Habilidad** elemental (uso excluyente de Orden, sin PO): flag `habilitarHabilidadesCarta` (por defecto `false`). Rol canalizador (Mago→Hechizo, Guerrero→Arma), objetivo en rango/LoS, valor escala el efecto. **SUPERADA por D-27** en el gate de rol y la escala por valor. | `cards.js`, `habilidades.js`, `index.js`, `combat.js`, `selectors.js`, `HandPanel.jsx`, `App.jsx` |
| D-26 | US-162 | Mecánica **Lugar** (playtest, 07/08/2026): santuarios del escenario capturables con Interactuar desde sobre/adyacente (dist. ≤1). Coste **FIJO** 2 PO (rompe la curva 1/2/3/5 a propósito), +1 VP **solo visual** (victoria sigue por eliminación/Rey). La casilla capturada pasa a `bloqueados` (impide movimiento y LoS). Flags `lugarHabilitado` (default `true`), `costeCapturaLugar`, `lugarVpGanancia`. `estado.puntosVictoria` como marcador. | `scenarios.js`, `state.js`, `index.js`, `selectors.js`, `adapter.js`, `Board.jsx`, `HexTile.jsx`, `terrenoVisual.jsx`, `TopHUD.jsx` |
| D-27 | US-163 | La **habilidad es de la carta**, no del rol. Cada una de las 15 cartas del mazo base declara su propio efecto en `HABILIDADES_POR_CARTA` (nombre, bando objetivo, filtro opcional rol/arquetipo, efecto, magnitud **FIJA** — el valor 1–3 solo cuenta para el PO de Orden). **Se elimina el gate de rol**: el origen es cualquier unidad aliada en rango/LoS del objetivo; el tipo Arma/Hechizo queda como metadato. Filtro de objetivo por bando+rol+arquetipo (`cumpleFiltroObjetivo`). `habilitarHabilidadesCarta` pasa a **ON por defecto** (toggle conservado). Nuevos flags por carta: `bonoPoolDefensa`, `disipadoDefensa`, `movimientoGratis`. | `cards.js`, `factions.js`, `habilidades.js`, `selectors.js`, `combat.js`, `focus.js`, `index.js`, `HandPanel.jsx`, `App.jsx`, `Board.jsx`, `UnitToken.jsx` |
| D-28 | US-164 (plantillas de mapa) | El **agua bloquea el MOVIMIENTO pero NO la línea de visión** (los arqueros disparan a través del río). Los hexes de agua viven en `tablero.bloqueaMovimientoSinLos` (nueva columna de escenario, aparte de `bloqueados`), que se fusiona en `bloqueadosParaMovimiento` (movimiento) pero no en `hayLoS` salvo flag `aguaBloqueaLoS` (default `false`). 5 plantillas 15×10 en `scenarios.js` con matrices de biomas (`terreno`), agua separada de montañas/bosque, vados libres y conectividad A↔B verificada. | `scenarios.js`, `hex.js`, `combat.js`, `state.js`, `registro.js`, `terrenoVisual.jsx`, `Board.jsx`, `plantillas.spec.js` |
| D-29 | US-165 (terreno por tile) | **Terreno POR TILE** con reglas reales en el motor. La matriz de biomas `tablero.terreno[key]` deja de ser solo visual: `reglasTerreno` en `data/rules.js` mapea `visual → { costeExtra, modAtacante }`. `costeHexTerreno` suma `costeExtra` al coste de mover (BFS Dijkstra en `hexAlcanzables`, `costeCamino` en `aplicarMover`/`puedeMoverse`); `modAtacanteTerreno` resta dados si la línea de ataque atraviesa el tile (mín 1). Terreno no listado = prado (sin efecto). | `rules.js`, `hex.js`, `selectors.js`, `index.js`, `combat.js`, `reglas-terreno.spec.js` |
| D-30 | US-165 | **Puente = cruce libre** sobre el agua: `costeExtra 0` y `modAtacante 0` (misma regla que el vado). Es el tile de conexión central del escenario Río Tajii. | `rules.js`, `hex.js`, `reglas-terreno.spec.js` |
| D-31 | US-165 | **Empalizada v1 NO direccional**: cruzar el hex cuesta +1 movimiento y la línea de ataque que la atraviesa resta 1 dado al atacante (mín 1). No bloquea LoS. La direccionalidad por borde queda para v2. | `rules.js`, `hex.js`, `combat.js`, `reglas-terreno.spec.js` |
| D-32 | US-165 | Bosque y montaña **siguen impasables** (viven en `bloqueados`, no en `reglasTerreno`). No se toca el balance existente. | `scenarios.js` |
| D-33 | US-166 (victoria por objetivos) | **Victoria por OBJETIVOS como sistema CORE** (conmutable, default ON). El escenario declara `tablero.objetivos` (hex del puente + lista de hexes que cuentan como lado enemigo por bando) y el motor lleva `estado.marcador`. La muerte del Rey y la eliminación total **siguen ganando al instante**; los objetivos solo se evalúan si no hubo ya victoria clásica. | `rules.js`, `objetivos.js`, `state.js`, `index.js`, `combat.js`, `habilidades.js`, `round.js`, `victoria-objetivos.spec.js` |
| D-34 | US-166 | **Metas de Río Tajii**: +1 estandarte por enemigo eliminado (combate o habilidad); +2 por controlar el puente al final de tu turno (unidad propia en el hex); +2 por cada unidad tuya que termine su turno en el lado enemigo (lista del escenario). Flags `victoriaPuntosBaja/Puente/Cruce`. | `objetivos.js`, `index.js`, `combat.js`, `habilidades.js`, `victoria-objetivos.spec.js` |
| D-35 | US-166 | **Umbral y límite**: se gana al llegar a **6 estandartes** o, al fin de la **ronda 10**, el que más tenga. Empate → gana el **Rey vivo**; si ambos Reyes viven (o ninguno), **empate**. Flags `victoriaUmbral` y `victoriaLimiteRondas`. | `objetivos.js`, `index.js`, `victoria-objetivos.spec.js` |
| D-36 | US-167 (Río Tajii) | **Reskin Mouri/Takeda solo COSMÉTICO** en la UI (título, facciones mostradas); el motor sigue A/B con mazos elementales. Ningún cambio de reglas: el playtest mide el mismo núcleo. | `App.jsx`, `scenarios.js` |
| D-37 | US-170 | **La asimetría de facción vive en el MAZO**: cada facción declara exactamente **4 habilidades activas** sobre sus 15 cartas base (las demás nacen sin habilidad). Vuelve firme el rol de diferenciación de bandas ahora que el despliegue es simétrico (D-38). Dato en `FACcIONES[].habilidadesActivas`. | `factions.js`, `cards.js` |
| D-38 | US-171 | **Despliegue simétrico estilo ajedrez**: 6 unidades por bando (12 en mesa), cada bando con los **6 arquetipos exactamente una vez** (Rey·Campeón·Alfil·Torre·Caballo·Peón). Sustituye el 5+5 de D-11; las posiciones son DATO de escenario. | `scenarios.js`, `state.js` |

---

## 6. Trazabilidad FR → US

| Módulo | FR | Historias |
|---|---|---|
| A Preparación | FR-001…004 | US-002, US-003, US-004, US-005 |
| B Cartas y PO | FR-010…014 | US-020, US-021, US-022, US-045 |
| C Foco | FR-020…025 | US-040…US-045 |
| D Activación | FR-030…036 | US-030…US-034 |
| E Tablero | FR-040…043 | US-010…US-013 |
| F Combate | FR-050…057 | US-050…US-055 |
| G Unidades | FR-060…063 | US-001, US-003, US-053 |
| H Técnicas | FR-070…073 | US-070…US-078 |
| I Estados | FR-080, FR-081 | US-060 |
| J Ronda/victoria | FR-090…095 | US-080…US-085 |
| — (soporte playtest) | §6 y §8 del Alcance | US-000, US-056, US-090, US-091 |

---

## 7. Definition of Done (aplica a toda historia)

1. Todos los `Escenario` de la historia pasan como test automatizado.
2. El comportamiento es verificable **a mano en el navegador** (no solo en tests).
3. El motor sigue siendo determinista: misma semilla → misma partida.
4. No se rompió ninguna historia anterior (`npm test` en verde).
5. Toda regla 🟡 tocada quedó como flag en `data/rules.js`, no hardcodeada.
