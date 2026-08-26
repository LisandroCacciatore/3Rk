# Motor de Escaramuza — prototipo web

Prototipo jugable en navegador para validar el núcleo táctico de un juego de mesa de escaramuzas
con deckbuilding. No es un producto: es una herramienta de playtest.

## Documentos de referencia

| Archivo | Qué es |
|---|---|
| `docs/Memoria_Maestra_Diseño_Juego.md` | GDD: decisiones de diseño y racional |
| `docs/Alcance_Funcional_MVP.md` | Requerimientos funcionales (FR) y alcance congelado |
| `docs/features/*.feature` | Backlog de historias en Gherkin, la especificación operativa |
| `docs/BACKLOG.md` | Stack, arquitectura, orden de implementación y decisiones abiertas |

## Stack

Vite + React 18 + JavaScript plano. Tablero en SVG. Tests con Vitest. Sin TypeScript.

## Las tres reglas del proyecto

1. **El motor no sabe que existe la UI.** `src/engine/` no importa React ni toca el DOM.
   `src/ui/` no contiene reglas de juego. Un cálculo de reglas dentro de un `.jsx` es un bug de
   arquitectura aunque el resultado sea correcto.

2. **No se inventan reglas.** Si una situación no está en el GDD ni en los escenarios, se marca
   como decisión abierta con un valor de arranque propuesto y **se pregunta**. Un modelo que
   rellena un hueco con una decisión razonable arruina el playtest: a partir de ahí ya no se sabe
   qué se está midiendo.

3. **Todo lo marcado 🟡 es conmutable.** Las decisiones D-01 a D-12 viven en `src/data/rules.js`
   y se leen desde `estado.reglas`. Nunca se hardcodean en el motor.

## Flujo de trabajo

Una historia por vez, en el orden de `docs/BACKLOG.md`. Para cada una:

`backlog-keeper` (si hay que ajustar la historia) → `motor-dev` o `ui-dev` (implementa) →
`verificador` (tests) → `arbitro-reglas` (auditoría contra la especificación).

`balance-analista` entra recién cuando hay partidas completas que simular.

## Definition of Done

1. Todos los escenarios de la historia pasan como test, salvo los de UI, que se verifican a mano.
2. El comportamiento es verificable en el navegador.
3. El motor sigue siendo determinista: misma semilla, misma partida.
4. `npm test` en verde, sin regresiones.
5. Ninguna regla 🟡 quedó hardcodeada.

## Agentes disponibles

`arbitro-reglas` · `motor-dev` · `ui-dev` · `verificador` · `balance-analista` · `backlog-keeper`

Ver `.claude/agents/` para qué hace cada uno y `.claude/skills/` para el conocimiento compartido.
