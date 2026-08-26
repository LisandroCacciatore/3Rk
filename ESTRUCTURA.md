# Estructura del proyecto — agentes y skills

## Árbol

```
proyecto-escaramuza/
├── CLAUDE.md                       reglas globales que Claude lee siempre
├── ESTRUCTURA.md                   este archivo
├── .claude/
│   ├── agents/                     6 subagentes
│   │   ├── backlog-keeper.md
│   │   ├── motor-dev.md
│   │   ├── ui-dev.md
│   │   ├── verificador.md
│   │   ├── arbitro-reglas.md
│   │   └── balance-analista.md
│   └── skills/                     7 skills
│       ├── reglas-escaramuza/SKILL.md
│       ├── arquitectura-motor/SKILL.md
│       ├── geometria-hex/SKILL.md
│       ├── gherkin-a-vitest/SKILL.md
│       ├── ui-tablero-hex/SKILL.md
│       ├── playtest-metricas/SKILL.md
│       └── historias-gherkin/SKILL.md
├── docs/
│   ├── Memoria_Maestra_Diseño_Juego.md
│   ├── Alcance_Funcional_MVP.md
│   ├── BACKLOG.md
│   └── features/                   11 archivos .feature
├── src/                            (lo genera motor-dev / ui-dev)
├── sim/                            (lo genera balance-analista)
└── package.json
```

## Agente vs. skill

- Una **skill** es conocimiento: reglas del juego, matemática hexagonal, convenciones. Vive en el
  contexto y no toma decisiones.
- Un **agente** es un trabajador con contexto propio, herramientas limitadas y un criterio. Lo que
  lo define no es lo que sabe, sino **lo que no puede hacer**.

Por eso `arbitro-reglas` y `verificador` son solo lectura o no parchean: un revisor que también
arregla deja de ser una revisión independiente.

## Reparto

| Agente | Herramientas | Skills precargadas | Límite duro |
|---|---|---|---|
| `backlog-keeper` | Read, Write, Edit, Grep, Glob | historias-gherkin, reglas-escaramuza | No toca código ni resuelve reglas de diseño |
| `motor-dev` | Read, Write, Edit, Bash, Grep, Glob | reglas-escaramuza, arquitectura-motor, geometria-hex | No toca `src/ui/` |
| `ui-dev` | Read, Write, Edit, Bash, Grep, Glob | arquitectura-motor, ui-tablero-hex, geometria-hex | No toca `src/engine/` ni escribe reglas |
| `verificador` | Read, Write, Edit, Bash, Grep, Glob | gherkin-a-vitest, reglas-escaramuza | No arregla el código para que pase el test |
| `arbitro-reglas` | Read, Grep, Glob | reglas-escaramuza | No modifica nada |
| `balance-analista` | Read, Write, Bash, Grep, Glob | playtest-metricas, reglas-escaramuza | Propone cambios de valores, no los aplica |

`reglas-escaramuza` se precarga en cinco de los seis agentes a propósito: es la fuente de verdad
única y el antídoto contra que cada uno improvise su propia versión del juego.

`balance-analista` es el único con `memory: project`, en `.claude/agent-memory/`. Acumula qué
políticas de bot sirvieron y qué hipótesis quedaron descartadas, para que la segunda tanda de
análisis valga más que la primera. Los demás son de una sola pasada.

## Flujo por historia

```
US-0xx del backlog
   ↓
[backlog-keeper]  solo si la historia necesita ajuste
   ↓
[motor-dev] o [ui-dev]   implementa
   ↓
[verificador]   escribe los tests y corre la suite
   ↓
[arbitro-reglas]   audita contra la especificación
   ↓
listo o vuelve al implementador
```

Los dos últimos pasos son los que sostienen el proyecto. Sin ellos, un modelo genera código que
compila, pasa sus propios tests y juega a otro juego.

## Instalación

1. Copiar la carpeta como raíz del repositorio del prototipo.
2. `npm create vite@latest . -- --template react` y `npm i -D vitest`.
3. Abrir Claude Code en la carpeta. Los agentes se cargan solos desde `.claude/agents/`.
4. Empezar por la épica 0: `@backlog-keeper` no hace falta, arrancá con
   `Implementá US-000 con el agente motor-dev`.

Si es la primera vez que existe la carpeta `.claude/agents/`, reiniciá la sesión: el watcher solo
cubre directorios que ya existían al arrancar.

## Ajustes que probablemente quieras

- **Modelo por agente.** Todos están en `model: inherit`. Si querés abaratar, poné
  `model: haiku` en `verificador` y dejá `arbitro-reglas` en el modelo grande: la auditoría es
  donde más rinde el criterio.
- **Un séptimo agente de refactor.** No lo incluí porque en un prototipo de playtest el refactor
  temprano es tiempo perdido. Vale la pena recién si el motor pasa los 2000 renglones.
- **Skills chicas.** `skills:` inyecta el contenido **completo** en el contexto del agente al
  arrancar, no solo la descripción. Si una skill crece mucho, se paga en cada invocación.
