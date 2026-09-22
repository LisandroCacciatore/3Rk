# Backlog de User Stories (Gherkin) — MVP Motor de Escaramuza

Documento operativo para que un modelo genere el prototipo **historia por historia**.
Fuentes: `Memoria_Maestra_Diseño_Juego.md` (GDD) y `Alcance_Funcional_MVP.md` (FR).

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
  tablero: { radio, bloqueados: Set<"q,r"> },
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
| D-08 | Tamaño de mano inicial y robo por turno | Mano de **5**; se roba **1 al inicio del turno** hasta agotar mazo | FR-004 / US-005 |
| D-09 | ¿Qué pasa al terminar la ronda? | Se rebaraja el descarte, se roba mano nueva de 5 | FR-092 / US-082 |
| D-10 | ¿Stunned puede bajar el pool a 0? | Mínimo 1 dado siempre | FR-080 / US-060 |
| D-11 | Despliegue inicial | Posiciones fijas del escenario base (sin fase de despliegue en MVP) | FR-002 / US-003 |
| D-12 | ¿El defensor puede quedar Stunned? | No: perder la defensa solo cuesta la herida | FR-052 / US-053 |

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
