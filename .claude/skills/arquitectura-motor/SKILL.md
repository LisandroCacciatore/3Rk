---
name: arquitectura-motor
description: Contrato técnico del prototipo web del Motor de Escaramuza — separación estricta entre motor de reglas puro (src/engine) e interfaz React (src/ui), forma del estado, función aplicarIntencion, inmutabilidad y determinismo con RNG sembrado. Usar antes de crear o modificar cualquier archivo de src/, y cuando haya que decidir dónde vive una pieza de lógica.
---

# Arquitectura del prototipo

## Stack

Vite + React 18 + JavaScript plano (ES2022, módulos). Tablero en SVG inline. Tests con Vitest.
Sin TypeScript, sin Redux, sin librerías de UI, sin motor de sprites.

## La regla que no se negocia

**`src/engine/` no importa React ni toca el DOM. `src/ui/` no contiene reglas de juego.**

Si un componente necesita saber cuánto cuesta una acción, llama a un selector del motor.
Si un componente calcula ese coste por su cuenta, está mal, aunque funcione.

Motivo: cada escenario Gherkin del backlog se testea contra el motor sin montar React. Una regla
escondida en un componente es una regla que no se puede testear ni conmutar en el playtest.

## Mapa de archivos

```
src/
  engine/
    hex.js          coordenadas axiales, vecinos, distancia, línea, LoS, caminos
    dice.js         RNG sembrado, tirada XgY, explosión
    state.js        createGame(), selectores, helpers de clonado
    cards.js        mazo, robo, descarte, rebarajado
    po.js           generación y gasto de PO
    actions.js      mover / atacar / interactuar / concentrarse + contador 1-3-5-9
    focus.js        reserva de tokens, coste escalonado
    combat.js       resolución del intercambio
    techniques.js   catálogo y aplicación de efectos
    status.js       Stunned
    round.js        turnos, fin de ronda, condiciones de victoria
    log.js          registro estructurado
    index.js        API pública: aplicarIntencion(estado, intencion)
  data/
    archetypes.js  factions.js  techniques.js  scenarios.js  rules.js
  ui/
    App.jsx  Board.jsx  HexTile.jsx  UnitToken.jsx  HandPanel.jsx  POBar.jsx
    UnitSheet.jsx  ActionMenu.jsx  TechniquePicker.jsx  LogPanel.jsx  SettingsPanel.jsx
  tests/
    <modulo>.spec.js
```

## Contrato del motor

```js
// src/engine/index.js
export function aplicarIntencion(estado, intencion) → estadoNuevo
```

- **Nunca muta** el estado recibido. Devuelve uno nuevo.
- Una intención desconocida devuelve el estado sin cambios y registra un evento de tipo `error`.
- Una intención inválida (PO insuficientes, movimiento ilegal, unidad ya activada) **no aplica
  efectos parciales**: o pasa entera o no pasa nada. Sin PO consumidos, sin contador incrementado.
- Toda intención aplicada agrega al menos una entrada al log.

Forma de la intención: `{ tipo, jugador, ...payload }`.
Tipos: `JUGAR_CARTA`, `MOVER`, `ATACAR`, `INTERACTUAR`, `CONCENTRARSE`, `TERMINAR_TURNO`.

## Forma del estado

```js
{
  semilla, rng, ronda, turnoDe, cartaJugadaEsteTurno,
  tablero: { radio, bloqueados: ["1,0", "1,1"] },
  jugadores: {
    A: { faccion, mazo: [], mano: [], descarte: [], po: [{ elemento, cantidad }] },
    B: { ... }
  },
  unidades: [{
    id, jugador, arquetipo, pos: { q, r },
    heridas, foco: [{ elemento }], estados: [],
    accionesEsteTurno, activacionCerrada
  }],
  reglas: { ...flags de data/rules.js },
  log: [],
  ganador: null
}
```

Estructuras serializables: nada de `Set`, `Map`, clases ni funciones dentro del estado, para que
una partida se pueda exportar, guardar y reproducir como JSON.

## Determinismo

- El motor **nunca** llama a `Math.random()`.
- `dice.js` expone un RNG sembrado. El estado lleva su semilla y su cursor.
- Misma semilla + misma secuencia de intenciones = misma partida, dado por dado.
- En los tests se inyecta un generador con una secuencia fija de resultados.

Esto no es un lujo: sin determinismo no se puede reproducir una partida de playtest ni discutir
un resultado raro de combate.

## Reglas conmutables

Todo lo marcado 🟡 en la skill `reglas-escaramuza` (decisiones D-01 a D-12) vive en
`src/data/rules.js` y se lee desde `estado.reglas`. Nunca se hardcodea el valor de arranque en el
motor. El panel de ajustes de la UI las cambia en caliente.

## Convenciones

- Nombres de dominio en español (`unidad`, `heridas`, `foco`, `aplicarIntencion`), utilidades en
  inglés si es lo natural. Consistencia sobre pureza.
- Funciones puras y chicas. Si una función necesita el estado entero para decidir, recibe el
  estado entero; si le alcanza con una unidad, recibe una unidad.
- Errores de reglas se devuelven como resultado, no se lanzan como excepción.
- Nada de `localStorage` en el motor. La persistencia, si aparece, es responsabilidad de la UI.
