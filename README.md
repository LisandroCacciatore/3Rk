# 3Rk — Motor de Escaramuza

**Prototipo web jugable para validar el núcleo táctico de un juego de mesa de escaramuzas con deckbuilding.**

No es un producto: es una herramienta de playtest. El objetivo es medir el sistema de reglas —no venderlo— antes de comprometer componentes físicos.

---

## El problema que resuelve

Un juego de mesa táctico no se puede balancear sobre el papel: las interacciones entre posicionamiento, cartas y estados emergen recién cuando alguien juega. Este prototipo existe para que esas partidas ocurran rápido, de forma **determinista y medible**: misma semilla, misma partida, con las decisiones de diseño conmutables para poder comparar variantes.

## Stack

| Capa | Elección |
|---|---|
| Lenguaje | JavaScript (ES2022, módulos) — sin compilación de tipos |
| UI | React 18 + Vite 6 |
| Tablero | SVG inline (cada hexágono es un `<polygon>` con su handler) |
| Tests | Vitest 3 + Testing Library |
| Simulación | `sim/` — partidas automatizadas con reporte |

Sin backend: el juego es 100 % cliente.

## Cómo correrlo

```bash
npm install
npm run dev            # servidor de desarrollo
npm test               # suite de Vitest
npm run test:watch     # tests en modo watch
npm run sim            # simulación de partidas
npm run sim:reporte    # reporte de la simulación
npm run build          # build de producción
```

## Estructura

```
├── CLAUDE.md            reglas globales del proyecto (para agentes)
├── ESTRUCTURA.md        mapa de agentes y skills
├── .claude/
│   ├── agents/          6 subagentes especializados
│   └── skills/          12 skills de conocimiento compartido
├── docs/
│   ├── Memoria_Maestra_Diseño_Juego.md   GDD: decisiones y racional
│   ├── Alcance_Funcional_MVP.md          requerimientos funcionales
│   ├── BACKLOG.md                        stack, orden de implementación
│   ├── Inventario_Produccion.md          inventario de assets
│   └── features/                         11 archivos .feature (Gherkin)
├── src/
│   ├── engine/          reglas puras — no conoce la UI
│   ├── ui/              render — sin reglas de juego
│   └── data/rules.js    decisiones D-01 a D-12 (conmutables)
└── sim/                 simulación y métricas de balance
```

## Metodología

El proyecto se construye con un harness de agentes, y las reglas de convivencia están en `CLAUDE.md`:

**1. El motor no sabe que existe la UI.** `src/engine/` no importa React ni toca el DOM; `src/ui/` no contiene reglas. Un cálculo de reglas dentro de un `.jsx` es un bug de arquitectura aunque el resultado sea correcto. Esto es lo que hace que el motor sea testeable de punta a punta.

**2. No se inventan reglas.** Si una situación no está en el GDD ni en los escenarios, se marca como decisión abierta con un valor de arranque propuesto y **se pregunta**. Un modelo que rellena un hueco con una decisión razonable arruina el playtest: a partir de ahí ya no se sabe qué se está midiendo.

**3. Todo lo marcado 🟡 es conmutable.** Las decisiones de diseño viven en `src/data/rules.js` y se leen desde `estado.reglas`; nunca se hardcodean en el motor.

**Flujo por historia:** `backlog-keeper` → `motor-dev` / `ui-dev` → `verificador` (tests) → `arbitro-reglas` (auditoría contra la especificación). `balance-analista` entra cuando hay partidas completas que simular.

**Agentes:** `arbitro-reglas` · `motor-dev` · `ui-dev` · `verificador` · `balance-analista` · `backlog-keeper`

`arbitro-reglas` y `verificador` son de solo lectura a propósito: **un revisor que también arregla deja de ser una revisión independiente.**

**Spec primero:** las 11 historias de `docs/features/` están escritas en Gherkin y cada escenario se convierte en un test de Vitest (skill `gherkin-a-vitest`). La especificación *es* la suite.

### Definition of Done

1. Todos los escenarios de la historia pasan como test (los de UI se verifican a mano).
2. El comportamiento es verificable en el navegador.
3. El motor sigue siendo determinista: misma semilla, misma partida.
4. `npm test` en verde, sin regresiones.
5. Ninguna regla 🟡 quedó hardcodeada.

## Estado

Prototipo en desarrollo activo. El backlog de implementación y el orden de las historias están en `docs/BACKLOG.md`; el GDD y el alcance funcional del MVP están congelados en `docs/`.
